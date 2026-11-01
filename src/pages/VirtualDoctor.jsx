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
  Camera,
  RotateCcw,
  Check,
  AlertCircle,
  Scan,
  Loader2,
  Upload,
  CheckCircle2,
  Trash2,
  Paperclip,
  Sparkles,
  RefreshCw
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
    stopCamera,
    cameraError,
    patientCameraStream,
    isAiSpeaking,
    speakAiResponse,
    currentSubtitle,
    setCurrentSubtitle,
    selectedLanguage,
    analyzeVision,
    isProcessing,
    processingText,
    isPatientSpeaking,
    patientSpeechTranscript,
    speechRecognitionSupported,
    sendMessage,
    refreshMemory,
    isRefreshingMemory,
    refreshFeedback
  } = useConsultation();
  const { getIdToken } = useAuth();

  const [subtitleLang, setSubtitleLang] = useState('en');
  const [uploadFeedback, setUploadFeedback] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [capturedFrame, setCapturedFrame] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const patientVideoRef = useRef(null);
  const fileInputRef = useRef(null);
  const sidebarFileInputRef = useRef(null);
  const lastCaptureTimeRef = useRef(0);

  // Stop camera tracks when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Clear captured frame preview if camera is toggled off
  useEffect(() => {
    if (!isCameraOn) {
      setCapturedFrame(null);
    }
  }, [isCameraOn]);

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

  // Process uploaded image file for Qwen2.5-VL 3B visual triage
  const handleImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadFeedback('Please upload an image file (PNG, JPG, WebP).');
      setTimeout(() => setUploadFeedback(''), 4000);
      return;
    }

    setUploadFeedback(`Analyzing "${file.name}" with Qwen2.5-VL...`);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result;
        setUploadedImage({
          name: file.name,
          preview: base64Data,
          size: file.size
        });

        try {
          let token = null;
          try { token = await getIdToken(); } catch (_) {}

          const res = await analyzeVision(
            base64Data,
            'Please provide a preliminary clinical triage observation of this uploaded medical image in the active consultation language. Give your observation in a single conversational paragraph.',
            token
          );

          setUploadFeedback('Doctor reviewed image and speaking observation...');
          if (res?.observation) {
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
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearImage = () => {
    setUploadedImage(null);
    setUploadFeedback('');
  };

  // Capture live camera frame onto canvas as JPEG
  const handleCaptureFrame = () => {
    if (cooldown > 0 || isProcessing) return;
    if (!isCameraOn || !patientVideoRef.current) {
      setUploadFeedback('Please turn on your camera first.');
      setTimeout(() => setUploadFeedback(''), 3000);
      return;
    }

    const video = patientVideoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setUploadFeedback('Camera feed is initializing. Please wait a moment.');
      setTimeout(() => setUploadFeedback(''), 3000);
      return;
    }

    try {
      // Create HTML canvas to convert video frame to JPEG
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(video.videoWidth, 640);
      canvas.height = Math.max(video.videoHeight, 480);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const frameJpeg = canvas.toDataURL('image/jpeg', 0.90);
      setCapturedFrame(frameJpeg);
      setUploadFeedback('Image captured. Review preview, retake, or confirm to share with doctor.');
    } catch (err) {
      console.error('Frame capture error:', err);
      setUploadFeedback('Failed to capture frame from camera.');
      setTimeout(() => setUploadFeedback(''), 3000);
    }
  };

  // Discard captured frame and return to live camera preview
  const handleRetakeCapture = () => {
    setCapturedFrame(null);
    setUploadFeedback('Live camera preview resumed. Position camera and click Capture.');
    setTimeout(() => setUploadFeedback(''), 3000);
  };

  // Confirm and share captured image with VR Doctor
  const handleConfirmAndShare = async () => {
    if (!capturedFrame || isProcessing) return;
    const imageToSend = capturedFrame;

    setUploadFeedback('Sharing captured photo with VR Doctor for clinical examination...');

    // Save in uploadedImage state for UI preview & sidebar
    const captureTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setUploadedImage({
      name: `Camera-Capture-${captureTimestamp}.jpg`,
      preview: imageToSend,
      size: Math.round((imageToSend.length * 3) / 4)
    });

    try {
      let token = null;
      try { token = await getIdToken(); } catch (_) {}

      const res = await analyzeVision(
        imageToSend,
        'Please describe visible clinical observations (e.g., skin rash, throat redness, facial swelling, cuts, or lesions) in the active response language. Provide your triage observation in a single conversational, reassuring paragraph.',
        token
      );

      setUploadFeedback('Doctor examined the photo and is speaking observations...');
      if (res?.observation) {
        speakAiResponse(res.observation);
      }
      setTimeout(() => setUploadFeedback(''), 5000);

      // Clear captured frame
      setCapturedFrame(null);

      // Stop camera after successful capture and confirmation
      stopCamera();
    } catch (err) {
      console.error('Analysis error:', err);
      setUploadFeedback(`Analysis error: ${err.message || 'Service unavailable'}`);
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

            <hr className="w-full border-[#E4EBE6] my-6" />

            {/* Dedicated Medical Image / Lab Report Upload Section */}
            <div className="w-full flex flex-col">
              <div className="flex items-center gap-1.5 mb-2 text-[#172B24]">
                <Upload className="w-4 h-4 text-[#16865B]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Visual Triage
                </h3>
              </div>
              <p className="text-[11px] text-[#718078] leading-tight mb-3">
                Upload a photo or medical report for instant Qwen2.5-VL clinical observation.
              </p>

              <input
                type="file"
                ref={sidebarFileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {!uploadedImage ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => sidebarFileInputRef.current?.click()}
                  className={`w-full p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center text-center group ${
                    isDragging
                      ? 'border-[#16865B] bg-[#E8F5EE]/60 scale-[1.02]'
                      : 'border-[#E4EBE6] hover:border-[#16865B]/60 bg-[#F8FAF9] hover:bg-[#E8F5EE]/30'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#E4EBE6] group-hover:border-[#16865B]/40 flex items-center justify-center text-[#16865B] shadow-xs mb-2 transition-colors">
                    <ImagePlus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#172B24] group-hover:text-[#16865B]">
                    Upload Image
                  </span>
                  <span className="text-[10px] text-[#718078] mt-0.5">
                    Drag & drop or browse
                  </span>
                  <span className="text-[9px] text-[#9CA3AF] mt-1.5 font-medium">
                    PNG, JPG, WebP
                  </span>
                </div>
              ) : (
                <div className="w-full bg-[#F8FAF9] border border-[#E4EBE6] rounded-2xl p-2.5 flex flex-col gap-2 animate-in fade-in">
                  <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-zinc-900 border border-black/10">
                    <img
                      src={uploadedImage.preview}
                      alt="Uploaded image"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center text-xs font-bold transition-colors"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="px-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#172B24]">
                      <span className="truncate max-w-[100px]" title={uploadedImage.name}>
                        {uploadedImage.name}
                      </span>
                      {isProcessing ? (
                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          Analyzing
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Reviewed
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => sidebarFileInputRef.current?.click()}
                    className="w-full py-1.5 px-2 rounded-xl text-[11px] font-semibold text-[#116B49] bg-[#E8F5EE] hover:bg-[#d5eee0] border border-[#c4e3d3] flex items-center justify-center gap-1 transition"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload New Photo</span>
                  </button>
                </div>
              )}
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
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap items-center gap-2 z-10">
                {doctorState === 'explaining' ? (
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-emerald-400/30 shadow-md animate-pulse">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Doctor Explaining</span>
                  </span>
                ) : isProcessing ? (
                  <span className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-amber-400/30 shadow-sm animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Doctor Thinking...</span>
                  </span>
                ) : doctorState === 'listening' ? (
                  <span className="px-3.5 py-1.5 rounded-full bg-blue-600/90 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-blue-400/30 shadow-md animate-pulse">
                    <Mic className="w-3.5 h-3.5" />
                    <span>Doctor Listening</span>
                  </span>
                ) : isMicOn ? (
                  <span className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-emerald-400 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Mic Active • Speak Now</span>
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-zinc-300 text-xs font-medium flex items-center gap-1.5 border border-white/10 shadow-xs">
                    <MicOff className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Muted • Doctor Idle</span>
                  </span>
                )}
                <span className="hidden sm:inline-flex px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-medium border border-white/10 shadow-xs items-center gap-1">
                  <span className="text-[10px]">📶</span> 4G LTE
                </span>
              </div>

              {/* 3. Floating Patient Camera Preview in the top-right corner */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-36 sm:w-48 md:w-60 aspect-[4/3] rounded-2xl overflow-hidden border-2 border-white/90 shadow-2xl bg-zinc-900/95 backdrop-blur-md transition-all z-20">
                {isCameraOn ? (
                  capturedFrame ? (
                    /* Captured Image Preview State with Retake & Confirm & Share */
                    <div className="relative w-full h-full bg-black flex flex-col justify-between">
                      <img
                        src={capturedFrame}
                        alt="Captured patient camera frame"
                        className="w-full h-full object-cover"
                      />
                      {/* Top Badge: Preview */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Preview</span>
                      </div>

                      {/* Bottom Action Buttons: Retake and Confirm & Share */}
                      <div className="absolute bottom-2 inset-x-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          id="retake-capture-btn"
                          onClick={handleRetakeCapture}
                          disabled={isProcessing}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 backdrop-blur-md text-[10px] font-semibold text-zinc-200 hover:text-white flex items-center justify-center gap-1 border border-white/20 transition-all shadow-xs active:scale-95 disabled:opacity-50"
                          title="Discard frame and retake"
                        >
                          <RotateCcw className="w-3 h-3 text-zinc-300" />
                          <span>Retake</span>
                        </button>
                        <button
                          type="button"
                          id="confirm-share-capture-btn"
                          onClick={handleConfirmAndShare}
                          disabled={isProcessing}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-[#16865B] hover:bg-[#116B49] backdrop-blur-md text-[10px] font-semibold text-white flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 disabled:opacity-50"
                          title="Confirm and share photo with VR Doctor"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin text-white" />
                              <span>Sharing...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3 text-white" />
                              <span>Confirm</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Live Camera Preview State with Capture Button */
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
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white p-2 text-center">
                          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin mb-1" />
                          <span className="text-[10px] font-semibold">Starting camera...</span>
                        </div>
                      )}

                      {/* Live indicator badge */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] font-semibold text-emerald-400 flex items-center gap-1 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Live Camera</span>
                      </div>

                      {/* Updated Button: 'Capture' (Previous: 'Scan Frame') */}
                      <button
                        type="button"
                        id="capture-camera-frame-btn"
                        data-testid="scan-camera-frame-btn"
                        onClick={handleCaptureFrame}
                        disabled={cooldown > 0 || isProcessing}
                        className="absolute bottom-2 inset-x-2 py-1.5 px-2 rounded-lg bg-[#16865B] hover:bg-[#116B49] backdrop-blur-md text-[11px] font-bold text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-60 shadow-md active:scale-95"
                        title="Capture current camera frame"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-3.5 h-3.5 text-white" />
                            <span>Capture</span>
                          </>
                        )}
                      </button>
                    </>
                  )
                ) : cameraError ? (
                  /* Camera Error State */
                  <div className="w-full h-full flex flex-col items-center justify-center bg-red-950/90 text-white p-2.5 text-center">
                    <AlertCircle className="w-5 h-5 text-red-400 mb-1" />
                    <span className="text-[10px] font-bold text-red-200 leading-tight">Camera Unavailable</span>
                    <span className="text-[9px] text-red-300 mt-1 line-clamp-2 leading-tight px-1">{cameraError}</span>
                    <button
                      type="button"
                      onClick={toggleCamera}
                      className="mt-2 px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 text-[10px] text-white font-medium transition"
                    >
                      Retry Camera
                    </button>
                  </div>
                ) : (
                  /* Camera Off State */
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/90 text-white p-2 text-center">
                    <VideoOff className="w-5 h-5 text-zinc-400 mb-1" />
                    <span className="text-[10px] text-zinc-400">Camera Off</span>
                    <button
                      type="button"
                      onClick={toggleCamera}
                      className="mt-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-200 border border-white/10 transition"
                    >
                      Turn On
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Feedback Toast if image selected */}
              {uploadFeedback && (
                <div className="absolute top-16 left-6 px-3 py-1.5 rounded-full bg-[#16865B] text-white text-xs font-medium shadow-lg animate-in fade-in z-20">
                  {uploadFeedback}
                </div>
              )}

              {/* Floating Uploaded Image Preview on Video Stage */}
              {uploadedImage && (
                <div className="absolute bottom-24 left-6 max-w-[200px] bg-black/80 backdrop-blur-md rounded-2xl p-2 border border-white/20 shadow-2xl z-20 animate-in fade-in zoom-in-95">
                  <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-zinc-800 border border-white/10">
                    <img src={uploadedImage.preview} alt="Uploaded medical image" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setUploadedImage(null)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center text-xs font-bold transition-colors"
                      title="Dismiss preview"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-1.5 px-1 flex items-center justify-between text-[10px] text-zinc-300 font-medium">
                    <span className="truncate max-w-[110px]" title={uploadedImage.name}>{uploadedImage.name}</span>
                    <span className="text-emerald-400 font-bold shrink-0">Analyzed</span>
                  </div>
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
                        ? isPatientSpeaking
                          ? 'bg-blue-600 text-white ring-4 ring-blue-400/50 animate-pulse'
                          : 'bg-zinc-800/90 text-white hover:bg-zinc-700'
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
                      {isMicOn ? (isPatientSpeaking ? 'Listening to speech...' : 'Mute Microphone') : 'Unmute Microphone'}
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

                  {/* Refresh Memory Button with status feedback */}
                  <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
                    {refreshFeedback && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        refreshFeedback.status === 'success' ? 'bg-emerald-100 text-emerald-800' :
                        refreshFeedback.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {refreshFeedback.message}
                      </span>
                    )}
                    <button
                      type="button"
                      id="vr-refresh-memory-btn"
                      onClick={async () => {
                        let token = null;
                        try { token = await getIdToken(); } catch (_) {}
                        await refreshMemory(token);
                      }}
                      disabled={isRefreshingMemory}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 hover:bg-[#E8F5EE] border border-[#E4EBE6] text-[#172B24] hover:text-[#16865B] shadow-2xs transition active:scale-95 disabled:opacity-50"
                      title="Clear active consultation memory and start a fresh AI context"
                    >
                      <RefreshCw className={`w-3 h-3 text-[#16865B] ${isRefreshingMemory ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Subtitle Dialogue Text */}
              {isPatientSpeaking && patientSpeechTranscript ? (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/80 border border-blue-200 animate-in fade-in">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Mic className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                      Listening to you...
                    </span>
                    <p className="text-sm sm:text-base text-[#172B24] font-medium leading-relaxed">
                      "{patientSpeechTranscript}"
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm sm:text-base text-[#172B24] leading-relaxed font-normal">
                  {subtitleLang === 'hi'
                    ? (currentSubtitle.hindi || 'हैलो! मैं आपके स्वास्थ्य के बारे में बात करने के लिए तैयार हूँ। कृपया अपने लक्षण बताएं।')
                    : (currentSubtitle.english || 'Hello! I am ready to listen to your health concerns. Please share your symptoms.')}
                </p>
              )}
            </div>

          </section>

        </div>
      </main>
    </div>
  );
}
