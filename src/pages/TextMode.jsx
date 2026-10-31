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
  Bot
} from 'lucide-react';

export default function TextMode() {
  const {
    messages,
    sendMessage,
    isProcessing,
    processingText,
    speakAiResponse,
    isAiSpeaking,
    isMicOn,
    toggleMic
  } = useConsultation();
  const { currentUser } = useAuth();

  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim() && !selectedFile) return;
    sendMessage(inputText, selectedFile);
    setInputText('');
    setSelectedFile(null);
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
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-between">
      <Navbar activeMode="text" />

      {/* Main Consultation Canvas */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col">
        
        {/* Top Clinical Status Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8F5EE] border border-[#c4e3d3] text-xs font-semibold text-[#116B49] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#16865B] animate-ping" />
            <span>AI Clinical Assistant Active • 22 Regional Dialects</span>
          </div>
        </div>

        {/* Hero Welcome Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#172B24] tracking-tight">
            How can I help you today?
          </h1>
          <p className="text-xs md:text-sm text-[#718078] mt-2 max-w-xl mx-auto leading-relaxed">
            Describe how you're feeling in your own words or language. I'm here to listen, triage, and support your care.
          </p>

          {/* Suggestion Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
            <button
              onClick={() => handleChipClick('I have had fever & body ache for 2 days')}
              className="px-3.5 py-2 rounded-full bg-white hover:bg-[#E8F5EE] border border-[#E4EBE6] text-xs font-medium text-[#172B24] flex items-center gap-2 transition-all shadow-xs hover:border-[#16865B]/30"
            >
              <Thermometer className="w-3.5 h-3.5 text-orange-500" />
              <span>Fever & body ache for 2 days</span>
            </button>

            <button
              onClick={() => handleChipClick('I experience severe stomach pain after meals')}
              className="px-3.5 py-2 rounded-full bg-white hover:bg-[#E8F5EE] border border-[#E4EBE6] text-xs font-medium text-[#172B24] flex items-center gap-2 transition-all shadow-xs hover:border-[#16865B]/30"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Stomach pain after meals</span>
            </button>

            <button
              onClick={() => handleChipClick('I have chest tightness and a persistent dry cough')}
              className="px-3.5 py-2 rounded-full bg-white hover:bg-[#E8F5EE] border border-[#E4EBE6] text-xs font-medium text-[#172B24] flex items-center gap-2 transition-all shadow-xs hover:border-[#16865B]/30"
            >
              <Wind className="w-3.5 h-3.5 text-blue-500" />
              <span>Chest tightness & cough</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-full bg-white hover:bg-[#E8F5EE] border border-[#E4EBE6] text-xs font-medium text-[#172B24] flex items-center gap-2 transition-all shadow-xs hover:border-[#16865B]/30"
            >
              <Upload className="w-3.5 h-3.5 text-[#16865B]" />
              <span>Upload lab report / photo</span>
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 space-y-6 pb-28">
          {messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="flex flex-col items-end">
                  <div className="flex items-end gap-2.5 max-w-xl">
                    <div className="bg-[#bbf7d0]/80 text-[#172B24] px-5 py-3.5 rounded-2xl rounded-tr-xs shadow-xs text-sm leading-relaxed border border-[#86efac]/50">
                      <p>{msg.text}</p>
                      {msg.attachment && (
                        <div className="mt-2 text-xs bg-white/70 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium">
                          <Paperclip className="w-3 h-3 text-[#16865B]" />
                          <span>Attachment: {msg.attachment}</span>
                        </div>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#86efac] text-[#116B49] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-[11px] text-[#718078] mt-1 pr-10 flex items-center gap-1">
                    <span>{currentUser?.displayName || msg.senderName || 'Patient'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                    <span className="text-[#16865B]">✓✓</span>
                  </div>
                </div>
              );
            }

            // AI Message Card
            return (
              <div key={msg.id} className="flex items-start gap-3 max-w-2xl">
                <div className="w-9 h-9 rounded-2xl bg-[#16865B] text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <Bot className="w-5 h-5" />
                </div>

                <div className="bg-white rounded-2xl border border-[#E4EBE6] p-5 shadow-xs flex-1">
                  {/* AI Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E4EBE6] mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#172B24]">
                        {msg.senderName}
                      </span>
                      {msg.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EE] text-[#116B49] border border-[#c4e3d3]">
                          {msg.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#718078]">{msg.timestamp}</span>
                  </div>

                  {/* Main Response Text */}
                  <p className="text-sm text-[#172B24] leading-relaxed mb-4">
                    {msg.text}
                  </p>

                  {/* Structured Guidance Box */}
                  {msg.guidance && (
                    <div className="bg-[#E8F5EE]/60 rounded-xl p-3.5 border border-[#c4e3d3]/60 mb-4 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#116B49] mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Primary At-Home Guidance</span>
                      </div>
                      {msg.guidance.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-[#172B24]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16865B] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">{item.title}: </span>
                            <span className="text-[#334155]">{item.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Emergency Warning Box */}
                  {msg.emergencyWarning && (
                    <div className="bg-red-50/80 rounded-xl p-3.5 border border-red-200/80 mb-4 text-xs text-red-900 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-red-700 block mb-0.5">
                          Emergency Warning Indicators
                        </span>
                        <span>{msg.emergencyWarning}</span>{' '}
                        <a href="tel:108" className="font-bold underline text-red-700 ml-1">
                          Call 108 Emergency
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E4EBE6]">
                    <button
                      onClick={() => speakAiResponse(msg.text)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#172B24] bg-gray-50 hover:bg-[#E8F5EE] border border-[#E4EBE6] flex items-center gap-1.5 transition"
                    >
                      <Volume2 className={`w-3.5 h-3.5 text-[#16865B] ${isAiSpeaking ? 'animate-pulse' : ''}`} />
                      <span>Listen in Hindi (ऑडियो सुनें)</span>
                    </button>

                    <button
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

          {/* AI Thinking/Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#16865B] text-white flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[#E4EBE6] shadow-xs text-xs font-medium text-[#718078]">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16865B] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16865B] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16865B] animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>{processingText || 'Analyzing symptoms & preparing clinical guidance...'}</span>
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
            <div className="mb-2 px-4 py-1.5 rounded-xl bg-white border border-[#E4EBE6] text-xs flex items-center justify-between text-[#172B24] shadow-xs">
              <span className="truncate">Attached: {selectedFile.name}</span>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-red-500 hover:text-red-700 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          <form
            onSubmit={handleSend}
            className="bg-white rounded-full border border-[#E4EBE6] shadow-lg p-1.5 flex items-center gap-2 transition-all focus-within:ring-2 focus-within:ring-[#16865B]/20 focus-within:border-[#16865B]"
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
              disabled={!inputText.trim() && !selectedFile}
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
