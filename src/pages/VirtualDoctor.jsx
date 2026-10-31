import React, { useRef, useEffect, useState } from 'react';
import Navbar from '../components/common/Navbar';
import { useConsultation, DOCTORS } from '../contexts/ConsultationContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  ImagePlus,
  Captions,
  Volume2,
  Scan,
  Loader2
} from 'lucide-react';

export default function VirtualDoctor() {
  const {
    selectedDoctorGender,
    setSelectedDoctorGender,
    doctor,
    doctorState,
    activeMedia,
    isMicOn,
    toggleMic,
    isCameraOn,
    toggleCamera,
    patientCameraStream,
    isAiSpeaking,
    speakAiResponse,
    currentSubtitle,
    setCurrentSubtitle,
    selectedLanguage,
    analyzeVision,
    isProcessing,
    processingText
  } = useConsultation();
  const { getIdToken } = useAuth();

  const [subtitleLang, setSubtitleLang] = useState('en');
  const [uploadFeedback, setUploadFeedback] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const patientVideoRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastCaptureTimeRef = useRef(0);

  // Attach webcam stream to patient PiP video element when camera is active
  useEffect(() => {
    if (patientVideoRef.current) {
      if (isCameraOn && patientCameraStream) {
        patientVideoRef.current.srcObject = patientCameraStream;
      } else {
        patientVideoRef.current.srcObject = null;
      }
    }
  }, [isCameraOn, patientCameraStream]);

  // Cooldown countdown timer for camera frame throttling
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleImageUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFeedback(`Analyzing "${file.name}" with Qwen2.5-VL...`);
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            let token = null;
            try { token = await getIdToken(); } catch (_) {}
            const res = await analyzeVision(
              reader.result,
              'Please provide a preliminary clinical triage observation of this uploaded medical image in the active consultation language.',
              token
            );
            setUploadFeedback('Observation updated in consultation subtitles');
            if (isMicOn && res?.observation) {
              speakAiResponse(res.observation);
            }
            setTimeout(() => setUploadFeedback(''), 4000);
          } catch (err) {
            setUploadFeedback(`Analysis error: ${err.message || 'Service unavailable'}`);
            setTimeout(() => setUploadFeedback(''), 5000);
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setUploadFeedback('Could not read image file.');
        setTimeout(() => setUploadFeedback(''), 3000);
      }
    }
  };

  const handleScanFrame = async () => {
    if (cooldown > 0 || isProcessing) return;
    if (!isCameraOn || !patientVideoRef.current) {
      setUploadFeedback('Please turn on your camera first.');
      setTimeout(() => setUploadFeedback(''), 3000);
      return;
    }

    const video = patientVideoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setUploadFeedback('Camera feed not ready yet.');
      setTimeout(() => setUploadFeedback(''), 3000);
      return;
    }

    try {
      setCooldown(15); // 15-second throttle cooldown to protect system & GPU
      setUploadFeedback('Capturing camera frame for preliminary observation...');

      const canvas = document.createElement('canvas');
      canvas.width = Math.min(video.videoWidth, 640);
      canvas.height = Math.min(video.videoHeight, 480);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameBase64 = canvas.toDataURL('image/jpeg', 0.85);

      let token = null;
      try { token = await getIdToken(); } catch (_) {}

      const res = await analyzeVision(
        frameBase64,
        'Please describe visible clinical observations (e.g., skin rash, eye redness, facial swelling) in the active response language. Maintain triage precautions.',
        token
      );

      setUploadFeedback('Observation recorded from camera frame');
      if (isMicOn && res?.observation) {
        speakAiResponse(res.observation);
      }
      setTimeout(() => setUploadFeedback(''), 4000);
    } catch (err) {
      setUploadFeedback(`Frame analysis error: ${err.message || 'Service unavailable'}`);
      setTimeout(() => setUploadFeedback(''), 5000);
    }
  };

  const handlePlaySubtitles = () => {
    const textToSpeak = subtitleLang === 'hi' 
      ? (currentSubtitle.hindi || 'मैं आपके गले में हल्का लालपन देख सकता हूँ। कृपया पानी पिएं और आराम करें।')
      : (currentSubtitle.english || 'I can see the mild redness in your throat. Please stay hydrated and rest today.');
    speakAiResponse(textToSpeak);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col">
      {/* Retain top navigation and language selection */}
      <Navbar activeMode="doctor" />

      {/* Main Video Call Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start flex-1">
          
          {/* 1. Compact Specialist Selector (Left Column) */}
          <aside className="md:col-span-3 lg:col-span-2 bg-white rounded-3xl border border-[#E4EBE6] p-5 shadow-xs flex flex-col items-center">
            <h2 className="text-sm font-bold text-[#172B24] mb-6 text-center tracking-tight">
              Choose Doctor
            </h2>

            <div className="flex flex-row md:flex-col items-center justify-center gap-7 w-full">
              {/* Male Doctor Option */}
              <button
                type="button"
                id="select-male-doctor"
                onClick={() => setSelectedDoctorGender('male')}
                className="group flex flex-col items-center focus:outline-none transition-transform active:scale-95"
              >
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 transition-all duration-200 ${
                    selectedDoctorGender === 'male'
                      ? 'ring-3 ring-[#16865B] ring-offset-2'
                      : 'ring-1 ring-[#E4EBE6] opacity-75 group-hover:opacity-100 group-hover:ring-gray-300'
                  }`}
                >
                  <img
                    src="/actions/images/male_idle.png"
                    alt="Male Doctor"
                    className="w-full h-full rounded-full object-cover shadow-xs"
                  />
                </div>
                <span
                  className={`mt-2.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all shadow-xs ${
                    selectedDoctorGender === 'male'
                      ? 'bg-[#16865B] text-white'
                      : 'bg-gray-100 text-[#718078] group-hover:bg-gray-200'
                  }`}
                >
                  Male Doctor
                </span>
              </button>

              {/* Female Doctor Option */}
              <button
                type="button"
                id="select-female-doctor"
                onClick={() => setSelectedDoctorGender('female')}
                className="group flex flex-col items-center focus:outline-none transition-transform active:scale-95"
              >
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 transition-all duration-200 ${
                    selectedDoctorGender === 'female'
                      ? 'ring-3 ring-[#16865B] ring-offset-2'
                      : 'ring-1 ring-[#E4EBE6] opacity-75 group-hover:opacity-100 group-hover:ring-gray-300'
                  }`}
                >
                  <img
                    src="/actions/images/female_idle.png"
                    alt="Female Doctor"
                    className="w-full h-full rounded-full object-cover shadow-xs"
                  />
                </div>
                <span
                  className={`mt-2.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all shadow-xs ${
                    selectedDoctorGender === 'female'
                      ? 'bg-[#16865B] text-white'
                      : 'bg-gray-100 text-[#718078] group-hover:bg-gray-200'
                  }`}
                >
                  Female Doctor
                </span>
              </button>
            </div>
          </aside>

          {/* 2. Dominant Central Video Screen (occupying most screen space) */}
          <section className="md:col-span-9 lg:col-span-10 flex flex-col gap-4">
            
            {/* The Video Container */}
            <div className="relative w-full aspect-[16/9] bg-zinc-900 rounded-3xl overflow-hidden shadow-md border border-[#E4EBE6]">
              
              {/* Doctor Media Display according to Section 6 state logic:
                  - Idle image when mic & cam are off, or mic is off
                  - Listening video when mic is on
                  - Explaining video when AI is speaking (priority)
              */}
              {activeMedia.type === 'video' ? (
                <video
                  key={`${selectedDoctorGender}-${doctorState}`}
                  src={activeMedia.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={activeMedia.src}
                  alt={doctor.name}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Top-Left Video Status Badges */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#16865B] animate-pulse" />
                  HD Video
                </span>
                <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-medium border border-white/10 shadow-xs flex items-center gap-1">
                  <span className="text-[10px]">📶</span> 4G LTE
                </span>
              </div>

              {/* 3. Small Floating Patient Camera Preview in the top-right corner */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-28 sm:w-36 md:w-44 aspect-[4/3] rounded-2xl overflow-hidden border-2 border-white/90 shadow-2xl bg-zinc-800 backdrop-blur-md transition-all">
                {isCameraOn ? (
                  <>
                    {patientCameraStream ? (
                      <video
                        ref={patientVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-white p-2 text-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mb-1" />
                        <span className="text-[10px] font-semibold">Camera Active</span>
                      </div>
                    )}
                    <button
                      type="button"
                      id="scan-camera-frame-btn"
                      onClick={handleScanFrame}
                      disabled={cooldown > 0 || isProcessing}
                      className="absolute bottom-1.5 inset-x-1.5 py-1 px-1.5 rounded-lg bg-black/70 hover:bg-black/90 backdrop-blur-md text-[10px] font-semibold text-white flex items-center justify-center gap-1 transition-all disabled:opacity-60 shadow-xs active:scale-95"
                      title="Analyze frame with Qwen2.5-VL 3B"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                          <span>Analyzing...</span>
                        </>
                      ) : cooldown > 0 ? (
                        <span>Wait {cooldown}s</span>
                      ) : (
                        <>
                          <Scan className="w-3 h-3 text-emerald-400" />
                          <span>Scan Frame</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/90 text-white p-2 text-center">
                    <VideoOff className="w-5 h-5 text-zinc-400 mb-1" />
                    <span className="text-[10px] text-zinc-400">Camera Off</span>
                  </div>
                )}
              </div>

              {/* Upload Feedback Toast if image selected */}
              {uploadFeedback && (
                <div className="absolute top-16 left-6 px-3 py-1.5 rounded-full bg-[#16865B] text-white text-xs font-medium shadow-lg animate-in fade-in">
                  {uploadFeedback}
                </div>
              )}

              {/* 4, 5, 6. Floating Overlay: EXACTLY THREE icon-only controls at bottom */}
              <div className="absolute bottom-5 inset-x-0 flex justify-center items-center pointer-events-none">
                <div className="pointer-events-auto bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-full flex items-center gap-3.5 border border-white/15 shadow-xl">
                  
                  {/* Control 1: Microphone (Icon-Only) */}
                  <button
                    type="button"
                    id="doctor-mic-control-btn"
                    onClick={toggleMic}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm active:scale-95 group relative ${
                      isMicOn
                        ? 'bg-zinc-800/90 text-white hover:bg-zinc-700'
                        : 'bg-zinc-800/90 text-red-400 hover:bg-zinc-700'
                    }`}
                  >
                    {isMicOn ? (
                      <Mic className="w-5 h-5 text-white" />
                    ) : (
                      <MicOff className="w-5 h-5 text-red-400" />
                    )}
                    {/* Hover Tooltip */}
                    <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-zinc-900/90 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
                      {isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
                    </span>
                  </button>

                  {/* Control 2: Camera (Icon-Only) */}
                  <button
                    type="button"
                    id="doctor-cam-control-btn"
                    onClick={toggleCamera}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm active:scale-95 group relative ${
                      isCameraOn
                        ? 'bg-zinc-800/90 text-white hover:bg-zinc-700'
                        : 'bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {isCameraOn ? (
                      <VideoIcon className="w-5 h-5 text-white" />
                    ) : (
                      <VideoOff className="w-5 h-5 text-zinc-400" />
                    )}
                    {/* Hover Tooltip */}
                    <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-zinc-900/90 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
                      {isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
                    </span>
                  </button>

                  {/* Control 3: Image Upload (Icon-Only, Vibrant Green) */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    id="doctor-upload-control-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-12 h-12 rounded-full bg-[#16865B] hover:bg-[#116B49] text-white flex items-center justify-center transition-all duration-150 shadow-md active:scale-95 group relative"
                  >
                    <ImagePlus className="w-5 h-5" />
                    {/* Hover Tooltip */}
                    <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-zinc-900/90 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
                      Upload Medical Image
                    </span>
                  </button>

                </div>
              </div>

            </div>

            {/* 7. Subtitles Section directly below the video */}
            <div className="bg-white rounded-3xl border border-[#E4EBE6] p-5 shadow-xs">
              {/* Header with Title & Language Selector */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E4EBE6] mb-3">
                <div className="flex items-center gap-2 text-[#172B24]">
                  <Captions className="w-5 h-5 text-[#16865B]" />
                  <h3 className="font-bold text-sm text-[#172B24]">
                    Live Consultation Subtitles
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  {/* Language switch */}
                  <div className="flex items-center bg-gray-100 p-0.5 rounded-full text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setSubtitleLang('en')}
                      className={`px-3 py-1 rounded-full transition-all ${
                        subtitleLang === 'en'
                          ? 'bg-[#16865B] text-white shadow-xs'
                          : 'text-[#718078] hover:text-[#172B24]'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubtitleLang('hi')}
                      className={`px-3 py-1 rounded-full transition-all ${
                        subtitleLang === 'hi'
                          ? 'bg-[#16865B] text-white shadow-xs'
                          : 'text-[#718078] hover:text-[#172B24]'
                      }`}
                    >
                      हिंदी (Hindi)
                    </button>
                  </div>

                  {/* Audio Waveform / TTS Play button */}
                  <button
                    type="button"
                    onClick={handlePlaySubtitles}
                    className="p-1.5 rounded-full hover:bg-gray-100 text-[#16865B] transition-colors"
                    title="Listen to response"
                  >
                    <div className="flex items-center gap-0.5 h-4">
                      <span className={`w-1 bg-[#16865B] rounded-full ${isAiSpeaking ? 'h-4 animate-voice-wave-1' : 'h-3'}`} />
                      <span className={`w-1 bg-[#16865B] rounded-full ${isAiSpeaking ? 'h-2 animate-voice-wave-2' : 'h-4'}`} />
                      <span className={`w-1 bg-[#16865B] rounded-full ${isAiSpeaking ? 'h-4 animate-voice-wave-3' : 'h-2'}`} />
                      <span className={`w-1 bg-[#16865B] rounded-full ${isAiSpeaking ? 'h-3 animate-voice-wave-1' : 'h-3.5'}`} />
                    </div>
                  </button>
                </div>
              </div>

              {/* Subtitle Dialogue Text */}
              <p className="text-sm sm:text-base text-[#172B24] leading-relaxed font-normal">
                {subtitleLang === 'hi'
                  ? (currentSubtitle.hindi || 'मैं आपके गले में हल्का लालपन देख सकता हूँ। कृपया पानी पिएं और आराम करें।')
                  : (currentSubtitle.english || 'I can see the mild redness in your throat. Please stay hydrated and rest today.')}
              </p>
            </div>

          </section>

        </div>
      </main>
    </div>
  );
}
