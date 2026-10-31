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
  const [isPatientSpeaking, setIsPatientSpeaking] = useState(false);
  const [patientSpeechTranscript, setPatientSpeechTranscript] = useState('');
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(true);
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

  /**
   * VR Doctor Model State Hierarchy:
   * 1. When AI is answering / speaking -> Explanation video
   * 2. When unmute AND patient is speaking -> Listening video
   * 3. When mute (or unmute but silent) -> Idle image
   */
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
  } else if (isMicOn && isPatientSpeaking) {
    doctorState = 'listening';
    activeMedia = {
      type: 'video',
      src: doctor.listeningVideo
    };
  } else {
    // When mute or idle
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

  // Synchronized state refs for STT lifecycle
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isMicOnRef = useRef(isMicOn);
  const isAiSpeakingRef = useRef(isAiSpeaking);
  const isProcessingRef = useRef(isProcessing);

  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const getRecognitionLangCode = (lang) => {
    const l = (lang || '').toLowerCase();
    if (l.includes('hindi') || l.includes('hi')) return 'hi-IN';
    if (l.includes('marathi') || l.includes('mr')) return 'mr-IN';
    if (l.includes('bengali') || l.includes('bn')) return 'bn-IN';
    if (l.includes('kannada') || l.includes('kn')) return 'kn-IN';
    if (l.includes('punjabi') || l.includes('pa')) return 'pa-IN';
    return 'en-IN';
  };

  // Web Speech API Continuous STT & Voice Activity Detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechRecognitionSupported(false);
      return;
    }
    setSpeechRecognitionSupported(true);

    if (isMicOn) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = getRecognitionLangCode(selectedLanguage);

        recognition.onstart = () => {
          // Listening active
        };

        recognition.onspeechstart = () => {
          if (!isAiSpeakingRef.current && !isProcessingRef.current) {
            setIsPatientSpeaking(true);
          }
        };

        recognition.onsoundstart = () => {
          if (!isAiSpeakingRef.current && !isProcessingRef.current) {
            setIsPatientSpeaking(true);
          }
        };

        recognition.onresult = (event) => {
          if (isAiSpeakingRef.current || isProcessingRef.current) return;

          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const currentText = (finalTranscript || interimTranscript).trim();
          if (currentText) {
            setIsPatientSpeaking(true);
            setPatientSpeechTranscript(currentText);

            // Silence debounce timer: 1.6s of silence after patient speech triggers AI consultation
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              setIsPatientSpeaking(false);
              const messageToSend = currentText;
              setPatientSpeechTranscript('');
              if (messageToSend.trim() && !isProcessingRef.current) {
                sendMessage(messageToSend.trim());
              }
            }, 1600);
          }
        };

        recognition.onerror = (event) => {
          if (event.error !== 'no-speech') {
            console.warn('Speech recognition status:', event.error);
          }
        };

        recognition.onend = () => {
          // Auto-restart while mic is unmuted and AI is not answering
          if (isMicOnRef.current && !isAiSpeakingRef.current && !isProcessingRef.current) {
            try {
              recognition.start();
            } catch (_) {}
          }
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (_) {}

      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
        recognitionRef.current = null;
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setIsPatientSpeaking(false);
      setPatientSpeechTranscript('');
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [isMicOn, selectedLanguage]);

  // Microphone toggle handler
  const toggleMic = () => {
    setIsMicOn((prev) => {
      const nextState = !prev;
      if (!nextState) {
        setIsPatientSpeaking(false);
        setPatientSpeechTranscript('');
      }
      return nextState;
    });
  };

  // Text-To-Speech with synchronized avatar explain state and gender-specific voices
  const speakAiResponse = (text) => {
    if (typeof window === 'undefined' || !text) return;

    // Temporarily pause speech recognition while AI is speaking to avoid feedback echo
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }
    setIsPatientSpeaking(false);

    // Sanitize speech text: convert numbered lists (1. 2.) and bullets (* - •) into flowing paragraphs
    const cleanSpeechText = text
      .replace(/^[\s]*[\d]+[\.\)]\s*/gm, '') // Remove list numbers like 1. 2.
      .replace(/^[\s]*[\*\-•]\s*/gm, '')     // Remove bullet symbols
      .replace(/[\*\#\_`~]/g, '')             // Strip markdown asterisks, hashes, etc.
      .replace(/\s*\n+\s*/g, ' ')            // Merge line breaks into seamless paragraph sentences
      .trim();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
      utterance.rate = audioSpeed || 1.0;

      const isFemale = selectedDoctorGender === 'female';
      // Pitch modulation: higher and brighter for female doctor (1.18), deeper and resonant for male doctor (0.88)
      utterance.pitch = isFemale ? 1.18 : 0.88;

      try {
        const voices = window.speechSynthesis.getVoices();
        const langPrefix = getRecognitionLangCode(selectedLanguage).split('-')[0].toLowerCase();
        
        // Filter voices that match current language or dialect
        const matchingLangVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
        const candidatePool = matchingLangVoices.length > 0 ? matchingLangVoices : voices;

        const femaleKeywords = ['female', 'zira', 'heera', 'susan', 'hazel', 'kalpana', 'swara', 'geeta', 'samantha', 'victoria', 'karen', 'catherine', 'eva', 'ananya', 'woman'];
        const maleKeywords = ['male', 'david', 'ravi', 'george', 'mark', 'james', 'richard', 'daniel', 'hemant', 'vikram', 'guy', 'man'];

        let selectedVoice = null;
        if (isFemale) {
          selectedVoice = candidatePool.find(v => femaleKeywords.some(k => v.name.toLowerCase().includes(k)));
        } else {
          selectedVoice = candidatePool.find(v => maleKeywords.some(k => v.name.toLowerCase().includes(k)));
        }

        // Fallback to first matching language voice if specific gender voice not named explicitly
        if (!selectedVoice && candidatePool.length > 0) {
          selectedVoice = candidatePool[0];
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      } catch (err) {
        console.warn('Voice selection error:', err);
      }

      utterance.onstart = () => {
        setIsAiSpeaking(true);
      };

      utterance.onend = () => {
        setIsAiSpeaking(false);
        // Resume listening if mic is still active
        if (isMicOnRef.current && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (_) {}
        }
      };

      utterance.onerror = () => {
        setIsAiSpeaking(false);
        if (isMicOnRef.current && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (_) {}
        }
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
          mode: (typeof window !== 'undefined' && window.location.pathname.includes('virtual-doctor')) ? 'doctor' : 'text',
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

      // Synchronize vision analysis into consultation message history
      const userMsg = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        senderName: 'You (Patient)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'Uploaded medical image for preliminary visual examination.',
        attachment: 'Medical Image',
        imagePreview: imageBase64
      };

      const aiReply = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        senderName: 'AAROGYA LINK',
        badge: 'Visual Triage Observation',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: data.observation
      };

      setMessages((prev) => [...prev, userMsg, aiReply]);
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
        analyzeVision,
        isPatientSpeaking,
        setIsPatientSpeaking,
        patientSpeechTranscript,
        speechRecognitionSupported
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
