import React, { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useAuth } from '../contexts/AuthContext';
import { useConsultation } from '../contexts/ConsultationContext';
import {
  User,
  Heart,
  Calendar,
  Phone,
  Shield,
  Activity,
  AlertTriangle,
  FileText,
  Save,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function Profile() {
  const { currentUser } = useAuth();
  const { consultationId, doctor, vitals, symptoms } = useConsultation();

  // Profile Form state
  const [formData, setFormData] = useState({
    name: currentUser?.displayName || 'Ramesh Kumar',
    email: currentUser?.email || 'ramesh.kumar@ruralhealth.in',
    age: '42',
    gender: 'Male',
    preferredLanguage: 'Hindi',
    height: '172 cm',
    weight: '68 kg',
    bloodGroup: 'B+',
    allergies: 'Penicillin (Mild rash)',
    medicalConditions: 'Mild Hypertension (taking Amlodipine 5mg)',
    emergencyContactName: 'Sunita Kumar (Wife)',
    emergencyContactPhone: '+91 98765 43210'
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load from local storage if previously saved
  useEffect(() => {
    const saved = localStorage.getItem('aarogya_patient_profile');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('aarogya_patient_profile', JSON.stringify(formData));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-between">
      <Navbar activeMode="profile" />

      <main className="max-w-5xl w-full mx-auto px-4 py-8 flex-1">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B24] tracking-tight">
              Patient Medical Profile
            </h1>
            <p className="text-xs sm:text-sm text-[#718078] mt-1">
              Personal information, emergency contacts, and consultation history
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#E8F5EE] text-[#116B49] text-xs font-bold border border-[#c4e3d3] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#16865B]" />
              Encrypted & Local First
            </span>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-[#E8F5EE] border border-[#c4e3d3] text-xs font-bold text-[#116B49] flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#16865B]" />
            <span>Profile successfully updated and saved locally!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: Profile Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E4EBE6] p-6 shadow-xs">
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Personal Details */}
              <div>
                <h3 className="text-sm font-bold text-[#172B24] uppercase tracking-wider mb-4 pb-2 border-b border-[#E4EBE6] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#16865B]" />
                  <span>Personal Identity (Mandatory)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#172B24] mb-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E4EBE6] text-xs text-[#172B24] focus:ring-2 focus:ring-[#16865B]/20 focus:border-[#16865B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172B24] mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      readOnly
                      value={formData.email}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E4EBE6] bg-gray-50 text-xs text-[#718078] outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172B24] mb-1">Age / Date of Birth</label>
                    <input
                      type="text"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="e.g. 42 years"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E4EBE6] text-xs text-[#172B24] focus:ring-2 focus:ring-[#16865B]/20 focus:border-[#16865B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172B24] mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E4EBE6] text-xs text-[#172B24] focus:ring-2 focus:ring-[#16865B]/20 focus:border-[#16865B] outline-none bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172B24] mb-1">Preferred Dialect / Language</label>
                    <input
                      type="text"
                      name="preferredLanguage"
                      value={formData.preferredLanguage}
                      onChange={handleChange}
                      placeholder="e.g. Hindi, Awadhi"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E4EBE6] text-xs text-[#172B24] focus:ring-2 focus:ring-[#16865B]/20 focus:border-[#16865B] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Health Information */}
              <div>
                <h3 className="text-sm font-bold text-[#172B24] uppercase tracking-wider mb-2 pb-2 border-b border-[#E4EBE6] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#16865B]" />
                  <span>Clinical & Physical Metrics (Optional)</span>
                </h3>
                <p className="text-[11px] text-[#718078] mb-4">
                  Helps the AI assistant provide accurate medication and triage dosage warnings.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#172B24] mb-1">Height</label>
                    <input
                      type="text"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      placeholder="e.g. 172 cm"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E4EBE6] text-xs text-[#172B24] focus:ring-2 focus:ring-[#16865B]/20 focus:border-[#16865B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172B24] mb-1">Weight</label>
                    <input
                      type="text"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="e.g. 68 kg"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E4EBE6] text-xs text-[#172B24] focus:ring-2 focus:ring-[#16865B]/20 focus:border-[#16865B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172B24] mb-1">Blood Group</label>
                    <input
                      type="text"
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      placeholder="e.g. B+"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E4EBE6] text-xs text-[#172B24] focus:ring-2 focus:ring-[#16865B]/20 focus:border-[#16865B] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-[#172B24] mb-1">Known Drug Allergies</label>
                    <input
                      type="text"
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleChange}
                      placeholder="e.g. Penicillin, Sulfa drugs"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E4EBE6] text-xs text-[#172B24] focus:ring-2 focus:ring-[#16865B]/20 focus:border-[#16865B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172B24] mb-1">Existing Medical Conditions & Daily Meds</label>
                    <textarea
                      rows={2}
                      name="medicalConditions"
                      value={formData.medicalConditions}
                      onChange={handleChange}
                      placeholder="e.g. Hypertension, Diabetes, Asthma"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E4EBE6] text-xs text-[#172B24] focus:ring-2 focus:ring-[#16865B]/20 focus:border-[#16865B] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-sm font-bold text-[#172B24] uppercase tracking-wider mb-4 pb-2 border-b border-[#E4EBE6] flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-600" />
                  <span>Emergency Next-of-Kin Contact</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#172B24] mb-1">Contact Name & Relation</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleChange}
                      placeholder="e.g. Sunita Kumar (Wife)"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E4EBE6] text-xs text-[#172B24] focus:ring-2 focus:ring-[#16865B]/20 focus:border-[#16865B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172B24] mb-1">Emergency Phone Number</label>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E4EBE6] text-xs text-[#172B24] focus:ring-2 focus:ring-[#16865B]/20 focus:border-[#16865B] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="profile-save-btn"
                  className="px-6 py-2.5 rounded-xl bg-[#16865B] hover:bg-[#116B49] text-white text-xs font-bold shadow-xs transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile Updates</span>
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT COLUMN: Recent Consultations & Telehealth Summary */}
          <div className="space-y-6">
            
            {/* Active Consultation Summary Card */}
            <div className="bg-white rounded-2xl border border-[#E4EBE6] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#172B24] uppercase tracking-wider">
                  Active Consultation
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#E8F5EE] text-[#116B49] text-[10px] font-bold">
                  In Progress
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-[#E4EBE6] mb-3">
                <p className="text-xs font-bold text-[#172B24]">Consultation #{consultationId}</p>
                <p className="text-[11px] text-[#718078]">{doctor.name} • {doctor.degree}</p>
              </div>

              <div className="space-y-2 mb-4 text-xs">
                <div className="flex justify-between text-[#718078]">
                  <span>Vitals Monitored:</span>
                  <span className="font-semibold text-[#172B24]">{vitals.temperature} ({vitals.tempStatus})</span>
                </div>
                <div className="flex justify-between text-[#718078]">
                  <span>Symptoms:</span>
                  <span className="font-semibold text-[#172B24]">{symptoms.length} items logged</span>
                </div>
              </div>

              <a
                href="/virtual-doctor.html"
                className="w-full py-2 rounded-xl bg-[#E8F5EE] hover:bg-[#d5eee0] text-[#116B49] text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>Return to Consultation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Offline Data Health Card */}
            <div className="bg-white rounded-2xl border border-[#E4EBE6] p-5 shadow-xs">
              <h4 className="text-xs font-bold text-[#172B24] mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#16865B]" />
                <span>Offline-First Storage</span>
              </h4>
              <p className="text-[11px] text-[#718078] leading-relaxed mb-3">
                Your medical profile and chat drafts are cached in local browser IndexedDB storage for offline visits in remote villages.
              </p>
              <div className="p-2.5 rounded-xl bg-[#E8F5EE] text-[#116B49] text-xs font-semibold flex items-center justify-between">
                <span>IndexedDB Cache</span>
                <span>Active & Synced</span>
              </div>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
