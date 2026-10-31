import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { saveConsultationOffline, saveMessagesOffline } from '../utils/indexedDb';

const ConsultationContext = createContext(null);

const BACKEND_URL = 'http://localhost:8000/api/v1';

export const DOCTORS = {
  male: {
    id: 'male',
    name: 'Dr. Vikram Sharma',
    degree: 'MD (Internal Medicine)',
    role: 'Rural Telehealth Lead',
    hospital: 'Apex General Hospital, Varanasi Rural Hub',
    status: 'Online & In Call',
    languages: ['हिन्दी (Hindi)', 'English', 'ਪੰਜਾਬੀ'],
    idleImage: '/actions/images/male_idle.png',
    listeningVideo: '/actions/videos/male_listening.mp4',
    explainVideo: '/actions/videos/male_explain.mp4',
  },
  female: {
    id: 'female',
    name: 'Dr. Ananya Sen',
    degree: 'MBBS, DGO',
    role: 'Family & Women\'s Health Specialist',
    hospital: 'Apex General Hospital, Varanasi Rural Hub',
    status: 'Online & In Call',
    languages: ['বাংলা (Bengali)', 'हिन्दी', 'English'],
    idleImage: '/actions/images/female_idle.png',
    listeningVideo: '/actions/videos/female_listening.mp4',
    explainVideo: '/actions/videos/female_explain.mp4',
  }
};

export function ConsultationProvider({ children }) {
  const [consultationId] = useState('AL-98421');
  
  // Clean initial state: No hardcoded patient messages or fake histories!
  const [messages, setMessages] = useState([]);
  const [chatError, setChatError] = useState(null);

  const [selectedDoctorGender, setSelectedDoctorGender] = useState('male');
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('');
  
  // Refresh Memory button state
  const [isRefreshingMemory, setIsRefreshingMemory] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState(null);

  const [selectedLanguage, setSelectedLanguageState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('aarogya_selected_language') || 'English';
    }
    return 'English';
  });

  const setSelectedLanguage = (lang) => {
    setSelectedLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aarogya_selected_language', lang);
    }
  };

  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [patientCameraStream, setPatientCameraStream] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  
  // Current subtitles for Virtual Doctor
  const [currentSubtitle, setCurrentSubtitle] = useState({
    english: '“I can see the mild redness in your throat. Please stay hydrated and rest today.”',
    hindi: '“मैं आपके गले में हल्का लालपन देख सकता हूँ। कृपया पानी पिएं और आराम करें।”'
  });

  // Clinical triage summary
  const [vitals] = useState({
    temperature: '99.1 °F',
    tempStatus: 'Mild Fever',
    spo2: '98 %',
    spo2Status: 'Optimal'
  });

  const [symptoms, setSymptoms] = useState([]);

  // Speech synthesis reference
  const speechRef = useRef(null);

  // Monitor online / offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save consultation data to IndexedDB for offline-first resilience
  useEffect(() => {
    saveConsultationOffline({
      id: consultationId,
      doctor: selectedDoctorGender,
      language: selectedLanguage,
      vitals,
      symptoms
    }).catch(console.error);

    if (messages.length > 0) {
      saveMessagesOffline(messages).catch(console.error);
    }
  }, [consultationId, messages, selectedDoctorGender, selectedLanguage, vitals, symptoms]);

  /**
   * Determine doctor state and media according to Section 6 of prompt:
   * | Microphone | Camera | Doctor state | Display |
   * | OFF | OFF | Idle | Corresponding idle image |
   * | ON  | OFF | Listening | Corresponding listening video |
   * | OFF | ON  | Idle | Corresponding idle image |
   * | ON  | ON  | Listening | Corresponding listening video |
   * | AI speaking | Any | Explaining | Corresponding explain video |
   */
  const doctor = DOCTORS[selectedDoctorGender];

  let doctorState = 'idle';
  let activeMedia = {
    type: 'image',
    src: doctor.idleImage
  };

  if (isAiSpeaking) {
    doctorState = 'explaining';
    activeMedia = {
      type: 'video',
      src: doctor.explainVideo
    };
  } else if (isMicOn) {
    doctorState = 'listening';
    activeMedia = {
      type: 'video',
      src: doctor.listeningVideo
    };
  } else {
    doctorState = 'idle';
    activeMedia = {
      type: 'image',
      src: doctor.idleImage
    };
  }

  // Camera toggle handler
  const toggleCamera = async () => {
    if (isCameraOn) {
      if (patientCameraStream) {
        patientCameraStream.getTracks().forEach((track) => track.stop());
        setPatientCameraStream(null);
      }
      setIsCameraOn(false);
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: false
          });
          setPatientCameraStream(stream);
          setIsCameraOn(true);
        } else {
          setIsCameraOn(true);
        }
      } catch (err) {
        console.warn('Camera access not granted or not available:', err);
        setIsCameraOn(true);
      }
    }
  };

  // Microphone toggle handler
  const toggleMic = () => {
    setIsMicOn((prev) => !prev);
  };

  // Text-To-Speech with synchronized avatar explain state
  const speakAiResponse = (text) => {
    if (typeof window === 'undefined') return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = audioSpeed;
      utterance.pitch = 1.0;
      
      utterance.onstart = () => {
        setIsAiSpeaking(true);
      };

      utterance.onend = () => {
        setIsAiSpeaking(false);
      };

      utterance.onerror = () => {
        setIsAiSpeaking(false);
      };

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } else {
      setIsAiSpeaking(true);
      setTimeout(() => {
        setIsAiSpeaking(false);
      }, 5000);
    }
  };

  const stopAiSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsAiSpeaking(false);
  };

  /**
   * Helper to convert File/Blob to base64 Data URL
   */
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });
  };

  /**
   * Send a new message to the real FastAPI backend + Ollama Qwen2.5-VL 3B model
   */
  const sendMessage = async (text, attachment = null, token = null) => {
    if (!text?.trim() && !attachment) return;

    setChatError(null);

    let imageBase64Data = null;
    let attachmentName = null;
    if (attachment) {
      if (typeof attachment === 'string') {
        imageBase64Data = attachment;
        attachmentName = 'Image Attachment';
      } else if (attachment instanceof File || attachment instanceof Blob) {
        attachmentName = attachment.name || 'Image Attachment';
        try {
          imageBase64Data = await fileToBase64(attachment);
        } catch (fErr) {
          console.warn('Could not read image file as base64:', fErr);
        }
      }
    }

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderName: 'You (Patient)',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: (text || '').trim(),
      attachment: attachmentName,
      imagePreview: imageBase64Data
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);
    setProcessingText('AAROGYA LINK is analyzing clinical information with Qwen2.5-VL...');

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${BACKEND_URL}/chat/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          consultation_id: consultationId,
          message: (text || '').trim() || 'Please examine the attached image.',
          mode: 'text',
          language: selectedLanguage,
          image_base64: imageBase64Data
        })
      });

      if (!res.ok) {
        let errDetail = 'Failed to generate response.';
        try {
          const errData = await res.json();
          errDetail = errData.detail || errDetail;
        } catch (_) {}
        throw new Error(errDetail);
      }

      const data = await res.json();

      const aiReply = {
        id: data.message_id || `msg-${Date.now() + 1}`,
        sender: 'ai',
        senderName: data.senderName || 'AAROGYA LINK',
        badge: 'Verified Triage',
        timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: data.text
      };

      setMessages((prev) => [...prev, aiReply]);
      
      // Update subtitle in Virtual Doctor Mode for cross-mode continuity
      setCurrentSubtitle({
        english: data.text,
        hindi: data.text
      });

      // If voice is active or user requested speech, speak response
      if (isMicOn) {
        speakAiResponse(data.text);
      }

      return aiReply;

    } catch (err) {
      console.error('Chat error:', err);
      setChatError(err.message || 'Unable to connect to AAROGYA LINK AI service.');
    } finally {
      setIsProcessing(false);
      setProcessingText('');
    }
  };

  /**
   * Analyze visual media or camera frame directly with Qwen2.5-VL 3B
   */
  const analyzeVision = async (imageBase64, promptText = 'Please provide a preliminary clinical triage observation of this image.', token = null) => {
    if (!imageBase64) return;
    setIsProcessing(true);
    setProcessingText('Analyzing visual frame with Qwen2.5-VL 3B...');
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BACKEND_URL}/vision/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          consultation_id: consultationId,
          image_base64: imageBase64,
          prompt: promptText,
          language: selectedLanguage
        })
      });

      if (!res.ok) {
        let errDetail = 'Vision analysis failed.';
        try {
          const errData = await res.json();
          errDetail = errData.detail || errDetail;
        } catch (_) {}
        throw new Error(errDetail);
      }

      const data = await res.json();
      setCurrentSubtitle({
        english: data.observation,
        hindi: data.observation
      });
      return data;
    } catch (err) {
      console.error('Vision analysis error:', err);
      throw err;
    } finally {
      setIsProcessing(false);
      setProcessingText('');
    }
  };

  /**
   * Rebuilds the consultation's context.txt from persisted records in FastAPI
   */
  const refreshMemory = async (token = null) => {
    if (isRefreshingMemory) return;

    setIsRefreshingMemory(true);
    setRefreshFeedback({ status: 'loading', message: 'Refreshing consultation memory...' });

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${BACKEND_URL}/consultations/${consultationId}/refresh-memory`, {
        method: 'POST',
        headers
      });

      if (!res.ok) {
        throw new Error('Backend failed to refresh memory.');
      }

      const data = await res.json();
      setRefreshFeedback({ status: 'success', message: data.message || 'Memory refreshed successfully.' });
      setTimeout(() => setRefreshFeedback(null), 4000);
    } catch (err) {
      console.error('Refresh memory error:', err);
      setRefreshFeedback({ status: 'error', message: 'Unable to refresh memory. Please try again.' });
      setTimeout(() => setRefreshFeedback(null), 5000);
    } finally {
      setIsRefreshingMemory(false);
    }
  };

  return (
    <ConsultationContext.Provider
      value={{
        consultationId,
        messages,
        setMessages,
        chatError,
        setChatError,
        selectedDoctorGender,
        setSelectedDoctorGender,
        doctor,
        doctorState,
        activeMedia,
        isMicOn,
        setIsMicOn,
        toggleMic,
        isCameraOn,
        toggleCamera,
        patientCameraStream,
        isAiSpeaking,
        setIsAiSpeaking,
        speakAiResponse,
        stopAiSpeech,
        isProcessing,
        processingText,
        isRefreshingMemory,
        refreshFeedback,
        refreshMemory,
        selectedLanguage,
        setSelectedLanguage,
        isOnline,
        attachments,
        setAttachments,
        audioSpeed,
        setAudioSpeed,
        currentSubtitle,
        setCurrentSubtitle,
        vitals,
        symptoms,
        sendMessage,
        analyzeVision
      }}
    >
      {children}
    </ConsultationContext.Provider>
  );
}

export function useConsultation() {
  const context = useContext(ConsultationContext);
  if (!context) {
    throw new Error('useConsultation must be used within a ConsultationProvider');
  }
  return context;
}
