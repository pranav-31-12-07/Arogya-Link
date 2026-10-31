import React from 'react';
import ReactDOM from 'react-dom/client';
import VirtualDoctor from '../pages/VirtualDoctor';
import { AuthProvider } from '../contexts/AuthContext';
import { ConsultationProvider } from '../contexts/ConsultationContext';
import '../index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ConsultationProvider>
        <VirtualDoctor />
      </ConsultationProvider>
    </AuthProvider>
  </React.StrictMode>
);
