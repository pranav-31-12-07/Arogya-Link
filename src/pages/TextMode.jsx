import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useConsultation } from '../contexts/ConsultationContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Thermometer,
  Activity,
  Wind,
  Upload,
  Paperclip,
  Mic,
  MicOff,
  Send,
  Volume2,
  Copy,
  Video,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  Check,
  User,
  Bot,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function TextMode() {
  const {
    messages,
    sendMessage,
    isProcessing,
    processingText,
    chatError,
    setChatError,
    isRefreshingMemory,
    refreshFeedback,
    refreshMemory,
    speakAiResponse,
    isAiSpeaking,
    isMicOn,
    toggleMic
  } = useConsultation();
  const { currentUser, getIdToken } = useAuth();

  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() && !selectedFile) return;
    
    let token = null;
    try {
      token = await getIdToken();
    } catch (_) {}

    const textToSend = inputText;
    const fileToSend = selectedFile;
    setInputText('');
    setSelectedFile(null);

    await sendMessage(textToSend, fileToSend, token);
  };

  const handleRefreshMemoryClick = async () => {
    let token = null;
    try {
      token = await getIdToken();
    } catch (_) {}
    await refreshMemory(token);
  };

  const handleChipClick = (chipText) => {
    setInputText(chipText);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
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
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Helper to format AI response into readable paragraphs/lists
  const formatAiMessage = (text) => {
    const lines = text.split('\n');
    const isEmergency = text.includes('108') || text.includes('112') || text.toLowerCase().includes('emergency');

    return (
      <div className="space-y-2.5">
        {isEmergency && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Emergency Guidance: Contact National Emergency Services (108 / 112) immediately.</span>
          </div>
        )}
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          
          if (/^(\d+\.|\*|-)\s+/.test(trimmed)) {
            return (
              <div key={idx} className="flex items-start gap-2 text-xs md:text-sm pl-2">
                <span className="text-[#16865B] font-bold">•</span>
                <span className="text-[#172B24]">{trimmed.replace(/^(\d+\.|\*|-)\s+/, '')}</span>
              </div>
            );
          }
          return (
            <p key={idx} className="text-xs md:text-sm text-[#172B24] leading-relaxed">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-between">
      <Navbar activeMode="text" />

      {/* Main Consultation Canvas */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 flex flex-col">
        
        {/* Top Clinical Status Badge & Subtle Refresh Memory Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F5EE] border border-[#c4e3d3] text-xs font-semibold text-[#116B49] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#16865B] animate-ping" />
            <span>AI Clinical Assistant Active • 22 Regional Dialects</span>
          </div>

          {/* Refresh Memory Button with icon and status feedback */}
          <div className="flex items-center gap-2">
            {refreshFeedback && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                refreshFeedback.status === 'success' ? 'bg-emerald-100 text-emerald-800' :
                refreshFeedback.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
              }`}>
                {refreshFeedback.message}
              </span>
            )}
            <button
              type="button"
              id="refresh-memory-btn"
              onClick={handleRefreshMemoryClick}
              disabled={isRefreshingMemory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-[#E8F5EE] border border-[#E4EBE6] text-[#172B24] hover:text-[#16865B] shadow-xs transition active:scale-95 disabled:opacity-50"
              title="Reconstruct and synchronize consultation context.txt from persisted memory"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#16865B] ${isRefreshingMemory ? 'animate-spin' : ''}`} />
              <span>Refresh Memory</span>
            </button>
          </div>
        </div>

        {/* Hero Welcome Header (prominent when no messages) */}
        {messages.length === 0 && (
          <div className="text-center my-auto py-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E8F5EE] text-[#16865B] mb-4 shadow-xs">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#172B24] tracking-tight">
              How can I help you today?
            </h1>
            <p className="text-xs md:text-sm text-[#718078] mt-2 max-w-xl mx-auto leading-relaxed">
              Describe how you're feeling in your own words or language. I'm here to listen, triage, and support your care.
            </p>

            {/* Suggestion Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => handleChipClick('I have had fever & body ache for 2 days')}
                className="px-3.5 py-2 rounded-full bg-white hover:bg-[#E8F5EE] border border-[#E4EBE6] text-xs font-medium text-[#172B24] flex items-center gap-2 transition-all shadow-xs hover:border-[#16865B]/30"
              >
                <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                <span>Fever & body ache for 2 days</span>
              </button>

              <button
                type="button"
                onClick={() => handleChipClick('I experience stomach pain after meals')}
                className="px-3.5 py-2 rounded-full bg-white hover:bg-[#E8F5EE] border border-[#E4EBE6] text-xs font-medium text-[#172B24] flex items-center gap-2 transition-all shadow-xs hover:border-[#16865B]/30"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>Stomach pain after meals</span>
              </button>

              <button
                type="button"
                onClick={() => handleChipClick('I have chest tightness and a dry cough')}
                className="px-3.5 py-2 rounded-full bg-white hover:bg-[#E8F5EE] border border-[#E4EBE6] text-xs font-medium text-[#172B24] flex items-center gap-2 transition-all shadow-xs hover:border-[#16865B]/30"
              >
                <Wind className="w-3.5 h-3.5 text-blue-500" />
                <span>Chest tightness & cough</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-full bg-white hover:bg-[#E8F5EE] border border-[#E4EBE6] text-xs font-medium text-[#172B24] flex items-center gap-2 transition-all shadow-xs hover:border-[#16865B]/30"
              >
                <Upload className="w-3.5 h-3.5 text-[#16865B]" />
                <span>Upload lab report / photo</span>
              </button>
            </div>
          </div>
        )}

        {/* Chat Error Banner (e.g. backend / Ollama unavailable) */}
        {chatError && (
          <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Connection Error</span>
                <span>{chatError}</span>
              </div>
            </div>
            <button
              onClick={() => setChatError(null)}
              className="text-red-600 hover:text-red-800 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Dynamic Message Thread */}
        <div className="flex-1 space-y-5 pb-28">
          {messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="flex flex-col items-end animate-in fade-in">
                  <div className="flex items-end gap-2.5 max-w-xl">
                    <div className="bg-[#bbf7d0]/80 text-[#172B24] px-5 py-3.5 rounded-2xl rounded-tr-xs shadow-xs text-sm leading-relaxed border border-[#86efac]/50">
                      <p>{msg.text}</p>
                      {msg.attachment && (
                        <div className="mt-2 text-xs bg-white/70 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium">
                          <Paperclip className="w-3 h-3 text-[#16865B]" />
                          <span>Attachment: {msg.attachment}</span>
                        </div>
                      )}
                      {msg.imagePreview && (
                        <div className="mt-2 rounded-xl overflow-hidden max-w-xs border border-emerald-300 shadow-xs">
                          <img src={msg.imagePreview} alt="Patient uploaded" className="w-full h-auto max-h-48 object-cover" />
                        </div>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#86efac] text-[#116B49] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-[11px] text-[#718078] mt-1 pr-10 flex items-center gap-1">
                    <span>{currentUser?.displayName || 'You'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                    <span className="text-[#16865B]">✓✓</span>
                  </div>
                </div>
              );
            }

            // Real AI Message Card from qwen2.5:7b
            return (
              <div key={msg.id} className="flex items-start gap-3 max-w-2xl animate-in fade-in">
                <div className="w-9 h-9 rounded-2xl bg-[#16865B] text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <Bot className="w-5 h-5" />
                </div>

                <div className="bg-white rounded-2xl border border-[#E4EBE6] p-5 shadow-xs flex-1">
                  {/* AI Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E4EBE6] mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#172B24]">
                        {msg.senderName || 'AAROGYA LINK'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#116B49] border border-[#c4e3d3]">
                        Verified Triage
                      </span>
                    </div>
                    <span className="text-[11px] text-[#718078]">{msg.timestamp}</span>
                  </div>

                  {/* Formatted Model Response */}
                  {formatAiMessage(msg.text)}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-[#E4EBE6]">
                    <button
                      type="button"
                      onClick={() => speakAiResponse(msg.text)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#172B24] bg-gray-50 hover:bg-[#E8F5EE] border border-[#E4EBE6] flex items-center gap-1.5 transition"
                    >
                      <Volume2 className={`w-3.5 h-3.5 text-[#16865B] ${isAiSpeaking ? 'animate-pulse' : ''}`} />
                      <span>Listen (ऑडियो सुनें)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#172B24] bg-gray-50 hover:bg-gray-100 border border-[#E4EBE6] flex items-center gap-1.5 transition"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#16865B]" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#718078]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <a
                      href="/virtual-doctor.html"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#116B49] bg-[#E8F5EE] hover:bg-[#d5eee0] border border-[#c4e3d3] flex items-center gap-1.5 transition ml-auto"
                    >
                      <Video className="w-3.5 h-3.5 text-[#16865B]" />
                      <span>Switch to Virtual Doctor</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}

          {/* AI Thinking / Local Model Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center gap-3 animate-in fade-in">
              <div className="w-9 h-9 rounded-2xl bg-[#16865B] text-white flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[#E4EBE6] shadow-xs text-xs font-medium text-[#718078]">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16865B] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16865B] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16865B] animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>{processingText || 'AAROGYA LINK is processing with local AI...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Fixed Sticky Message Input Composer */}
      <div className="sticky bottom-0 z-30 bg-gradient-to-t from-[#F8FAF9] via-[#F8FAF9] to-transparent pt-4 pb-4 px-4">
        <div className="max-w-4xl mx-auto">
          
          {selectedFile && (
            <div className="mb-2 p-2 px-3 rounded-2xl bg-white border border-[#E4EBE6] text-xs flex items-center justify-between text-[#172B24] shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2.5 truncate">
                {selectedFile.type?.startsWith('image/') && (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-9 h-9 rounded-lg object-cover border border-[#c4e3d3] shrink-0"
                  />
                )}
                <div className="truncate">
                  <span className="font-semibold block truncate">{selectedFile.name}</span>
                  <span className="text-[10px] text-[#718078]">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready for Qwen2.5-VL visual analysis
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 ml-2 transition"
                title="Remove attachment"
              >
                ✕
              </button>
            </div>
          )}

          <form
            onSubmit={handleSend}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`bg-white rounded-full border shadow-lg p-1.5 flex items-center gap-2 transition-all focus-within:ring-2 focus-within:ring-[#16865B]/20 focus-within:border-[#16865B] ${
              isDragging ? 'border-[#16865B] ring-2 ring-[#16865B]/30 bg-[#E8F5EE]/40' : 'border-[#E4EBE6]'
            }`}
          >
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="hidden"
            />
            <button
              type="button"
              id="chat-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#718078] hover:text-[#16865B] hover:bg-[#F8FAF9] transition"
              title="Attach photo or medical report"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Input Field */}
            <input
              type="text"
              id="chat-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your symptoms in Hindi, English, Bengali or any regional language..."
              className="flex-1 bg-transparent px-2 text-sm text-[#172B24] placeholder-[#718078] focus:outline-none"
            />

            {/* Microphone Button */}
            <button
              type="button"
              id="chat-mic-btn"
              onClick={toggleMic}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                isMicOn
                  ? 'bg-red-50 text-red-600 animate-pulse'
                  : 'text-[#718078] hover:text-[#16865B] hover:bg-[#F8FAF9]'
              }`}
              title={isMicOn ? 'Stop recording voice' : 'Record voice in local language'}
            >
              {isMicOn ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              id="chat-send-btn"
              disabled={(!inputText.trim() && !selectedFile) || isProcessing}
              className="w-10 h-10 rounded-full bg-[#16865B] hover:bg-[#116B49] text-white flex items-center justify-center shadow-sm disabled:opacity-40 transition active:scale-95"
              title="Send symptoms"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>

          {/* Subtext Disclaimers */}
          <div className="flex items-center justify-between text-[11px] text-[#718078] px-4 mt-2">
            <span>
              Aarogya Link AI provides clinical triage assistance. For critical emergencies, call{' '}
              <a href="tel:108" className="font-bold text-red-600 underline">
                108 immediately
              </a>
              .
            </span>
            <span className="flex items-center gap-1 text-[#16865B] font-semibold shrink-0">
              <Lock className="w-3 h-3" /> Encrypted Consult
            </span>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
