import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useConsultation } from '../../contexts/ConsultationContext';
import { 
  Heart, 
  Globe, 
  User, 
  PhoneCall, 
  LogOut, 
  ChevronDown, 
  FileText, 
  Wifi, 
  WifiOff, 
  ShieldCheck,
  Check
} from 'lucide-react';

export default function Navbar({ activeMode = 'text' }) {
  const { currentUser, logout } = useAuth();
  const { selectedLanguage, setSelectedLanguage, isOnline } = useConsultation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const languages = [
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'en', name: 'English' },
    { code: 'mr', name: 'मराठी (Marathi)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login.html';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E4EBE6] px-4 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left Brand Identity */}
          <a href="/text-mode.html" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-10 h-10 rounded-xl bg-[#E8F5EE] border border-[#c4e3d3] flex items-center justify-center text-[#16865B] shadow-sm group-hover:scale-105 transition-transform">
              <Heart className="w-6 h-6 fill-[#16865B]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-[#172B24]">
                  AAROGYA LINK
                </span>
                {!isOnline && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                    <WifiOff className="w-3 h-3" /> Offline Mode
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#718078] font-medium tracking-wide">
                Your Health. Your Language. Your Care.
              </span>
            </div>
          </a>

          {/* Center Mode Switcher Pill */}
          <div className="hidden sm:flex items-center bg-[#F1F5F3] p-1.5 rounded-full border border-[#E4EBE6] shadow-inner">
            <a
              href="/text-mode.html"
              id="mode-text-btn"
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeMode === 'text'
                  ? 'bg-[#16865B] text-white shadow-sm'
                  : 'text-[#172B24] hover:text-[#16865B]'
              }`}
            >
              Text Mode
            </a>
            <a
              href="/virtual-doctor.html"
              id="mode-doctor-btn"
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeMode === 'doctor'
                  ? 'bg-[#16865B] text-white shadow-sm'
                  : 'text-[#172B24] hover:text-[#16865B]'
              }`}
            >
              Virtual Doctor
            </a>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* 108 Emergency Support Button */}
            <button
              id="emergency-108-btn"
              onClick={() => setShowEmergencyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors shadow-xs active:scale-95"
              title="Emergency Medical Assistance"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              <span>108 Support</span>
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                id="language-selector-btn"
                onClick={() => {
                  setShowLanguageMenu(!showLanguageMenu);
                  setShowProfileMenu(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#172B24] bg-white hover:bg-[#F8FAF9] border border-[#E4EBE6] transition-colors shadow-xs"
              >
                <Globe className="w-3.5 h-3.5 text-[#16865B]" />
                <span className="hidden md:inline">{selectedLanguage}</span>
                <ChevronDown className="w-3 h-3 text-[#718078]" />
              </button>

              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#E4EBE6] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#718078] border-b border-[#E4EBE6]">
                    Select Consultation Language
                  </div>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang.name.split(' ')[0]);
                        setShowLanguageMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-[#172B24] hover:bg-[#E8F5EE] flex items-center justify-between"
                    >
                      <span>{lang.name}</span>
                      {selectedLanguage.includes(lang.name.split(' ')[0]) && (
                        <Check className="w-3.5 h-3.5 text-[#16865B]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile / Auth State */}
            <div className="relative">
              <button
                id="profile-dropdown-btn"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowLanguageMenu(false);
                }}
                className="w-8 h-8 rounded-full bg-[#16865B] text-white flex items-center justify-center font-bold text-xs shadow-xs hover:ring-2 hover:ring-[#16865B]/30 transition-all"
                title={currentUser ? (currentUser.displayName || currentUser.email) : 'Patient Profile'}
              >
                {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'P'}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#E4EBE6] py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#E4EBE6]">
                    <p className="text-xs font-bold text-[#172B24] truncate">
                      {currentUser?.displayName || 'Patient'}
                    </p>
                    <p className="text-[11px] text-[#718078] truncate">
                      {currentUser?.email || 'telehealth.patient@aarogya.in'}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-[#16865B] font-semibold">
                      <ShieldCheck className="w-3 h-3" /> {currentUser ? 'Firebase Authenticated' : 'Guest Patient Session'}
                    </div>
                  </div>

                  <a
                    href="/profile.html"
                    className="w-full px-4 py-2 text-xs text-[#172B24] hover:bg-[#E8F5EE] flex items-center gap-2.5 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-[#16865B]" />
                    <span>My Health Profile</span>
                  </a>

                  <div className="border-t border-[#E4EBE6] my-1"></div>

                  {currentUser ? (
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  ) : (
                    <a
                      href="/login.html"
                      className="w-full px-4 py-2 text-xs text-[#16865B] hover:bg-[#E8F5EE] flex items-center gap-2.5 transition-colors font-semibold"
                    >
                      <User className="w-4 h-4" />
                      <span>Sign In / Register</span>
                    </a>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Mobile View Mode Switcher Pill */}
        <div className="sm:hidden mt-2.5 flex items-center justify-center bg-[#F1F5F3] p-1 rounded-full border border-[#E4EBE6]">
          <a
            href="/text-mode.html"
            className={`flex-1 text-center py-1.5 rounded-full text-xs font-semibold ${
              activeMode === 'text' ? 'bg-[#16865B] text-white' : 'text-[#172B24]'
            }`}
          >
            Text Mode
          </a>
          <a
            href="/virtual-doctor.html"
            className={`flex-1 text-center py-1.5 rounded-full text-xs font-semibold ${
              activeMode === 'doctor' ? 'bg-[#16865B] text-white' : 'text-[#172B24]'
            }`}
          >
            Virtual Doctor
          </a>
        </div>
      </header>

      {/* Emergency 108 Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <PhoneCall className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="text-xl font-bold text-center text-[#172B24]">
              Emergency Tele-Triage (108)
            </h3>
            <p className="text-sm text-[#718078] text-center mt-2 leading-relaxed">
              If the patient is having chest pain, severe breathlessness, uncontrolled bleeding, or loss of consciousness, do not wait for AI analysis.
            </p>
            <div className="mt-5 p-4 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-red-900">National Emergency Ambulance</p>
                <p className="text-2xl font-black text-red-700">108 / 112</p>
              </div>
              <a
                href="tel:108"
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm shadow hover:bg-red-700 transition"
              >
                Call Now
              </a>
            </div>
            <button
              onClick={() => setShowEmergencyModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl border border-[#E4EBE6] text-xs font-semibold text-[#718078] hover:bg-gray-50 transition"
            >
              Close and Return to Consultation
            </button>
          </div>
        </div>
      )}
    </>
  );
}
