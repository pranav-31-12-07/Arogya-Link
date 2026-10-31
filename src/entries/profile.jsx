import React from 'react';
import ReactDOM from 'react-dom/client';
import Profile from '../pages/Profile';
import { AuthProvider } from '../contexts/AuthContext';
import { ConsultationProvider } from '../contexts/ConsultationContext';
import '../index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ConsultationProvider>
        <Profile />
      </ConsultationProvider>
    </AuthProvider>
  </React.StrictMode>
);
