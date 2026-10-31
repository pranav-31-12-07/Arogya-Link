import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { saveConsultationOffline, saveMessagesOffline, getConsultationOffline, getMessagesOffline } from '../utils/indexedDb';

const ConsultationContext = createContext(null);

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

const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    sender: 'user',
    senderName: 'Ramesh K.',
    timestamp: '10:24 AM',
    text: 'Namaste doctor, I have had a mild fever (100.4°F) and throat soreness since yesterday evening. Should I take paracetamol?'
  },
  {
    id: 'msg-2',
    sender: 'ai',
    senderName: 'Aarogya Clinical AI',
    badge: 'Verified Triage',
    timestamp: '10:25 AM',
    text: 'Namaste Ramesh ji. I understand you are experiencing a mild fever (100.4°F) and a sore throat. This commonly indicates an early viral respiratory response.',
    guidance: [
      { title: 'Warm Saline Gargles', detail: '2 to 3 times daily with lukewarm water and a pinch of salt to alleviate local throat irritation.' },
      { title: 'Hydration', detail: 'Drink plenty of warm water, tulsi/ginger tea, or clear soups to maintain fluid levels.' },
      { title: 'Temperature Monitoring', detail: 'Track temperature every 4-6 hours. Take paracetamol (500mg) only if temperature exceeds 100°F or with body pain.' }
    ],
    emergencyWarning: 'If you experience severe shortness of breath, sudden chest discomfort, fever crossing 102°F that doesn\'t reduce, or extreme fatigue, seek immediate medical care or tap Call 108 Emergency.',
    hindiTranslation: 'नमस्ते रमेश जी। मैं समझ सकता हूँ कि आपको हल्का बुखार और गले में खराश है। गुनगुने नमक के पानी से गरारे करें और पर्याप्त तरल पदार्थ लें।'
  },
  {
    id: 'msg-3',
    sender: 'user',
    senderName: 'Ramesh K.',
    timestamp: '10:27 AM',
    text: 'I am also taking my routine blood pressure medicine (Amlodipine 5mg). Does that interact?'
  }
];

export function ConsultationProvider({ children }) {
  const [consultationId] = useState('AL-98421');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [selectedDoctorGender, setSelectedDoctorGender] = useState('male');
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('Hindi');
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [patientCameraStream, setPatientCameraStream] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  
  // Current subtitles for Virtual Doctor
  const [currentSubtitle, setCurrentSubtitle] = useState({
    english: '“I can see the mild redness in your throat. Please stay hydrated and rest today. Let us check your temperature now.”',
    hindi: '“मैं आपके गले में हल्का लालपन देख सकता हूँ। कृपया पानी पिएं और आराम करें...”'
  });

  // Clinical triage summary cards
  const [vitals] = useState({
    temperature: '99.1 °F',
    tempStatus: 'Mild Fever',
    spo2: '98 %',
    spo2Status: 'Optimal'
  });

  const [symptoms] = useState([
    'Mild Pharyngitis',
    'Generalized Body Ache',
    'No Respiratory Distress'
  ]);

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

    saveMessagesOffline(messages).catch(console.error);
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

  // Camera toggle handler using browser MediaDevices API
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
          // Fallback if browser media is restricted
          setIsCameraOn(true);
        }
      } catch (err) {
        console.warn('Camera access not granted or not available:', err);
        // Still toggle camera indicator with simulated preview for testing
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
      // Simulation fallback if speechSynthesis is not available
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

  // Send a new message in consultation
  const sendMessage = async (text, attachment = null) => {
    if (!text.trim() && !attachment) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderName: 'You (Patient)',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: text.trim(),
      attachment: attachment ? attachment.name : null
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);
    setProcessingText('Checking pharmacological interactions & clinical triage...');

    // Simulate AI clinical triage response for demo
    setTimeout(() => {
      const aiReply = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        senderName: 'Aarogya Clinical AI',
        badge: 'Verified Triage',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Regarding your query: "${text}". Amlodipine (5mg) is a calcium channel blocker used for hypertension. Short-term paracetamol use for fever does not have clinically significant adverse interactions with Amlodipine. However, avoid NSAIDs like ibuprofen without physician approval as they can elevate blood pressure.`,
        guidance: [
          { title: 'Blood Pressure Monitoring', detail: 'Continue routine Amlodipine schedule. Take BP reading once daily while unwell.' },
          { title: 'Safe Antipyretic', detail: 'Paracetamol is preferred over NSAIDs for fever reduction in hypertensive individuals.' }
        ],
        emergencyWarning: 'If systolic BP exceeds 160 mmHg or you notice swelling/dizziness along with high fever, reach out to your primary medical center immediately.'
      };

      setMessages((prev) => [...prev, aiReply]);
      setIsProcessing(false);
      setProcessingText('');

      // Update subtitle in Virtual Doctor
      setCurrentSubtitle({
        english: `“Regarding your query, Amlodipine has no adverse interaction with standard paracetamol. Maintain adequate hydration and rest.”`,
        hindi: `“एमलोडिपिन के साथ पैरासिटामोल का कोई प्रतिकूल प्रभाव नहीं है। पर्याप्त पानी पिएं और आराम करें।”`
      });

      // If Virtual Doctor mode is open or mic is active, speak the response
      speakAiResponse(aiReply.text);
    }, 2000);
  };

  return (
    <ConsultationContext.Provider
      value={{
        consultationId,
        messages,
        setMessages,
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
        sendMessage
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
