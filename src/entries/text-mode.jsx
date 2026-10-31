import React from 'react';
import ReactDOM from 'react-dom/client';
import TextMode from '../pages/TextMode';
import { AuthProvider } from '../contexts/AuthContext';
import { ConsultationProvider } from '../contexts/ConsultationContext';
import '../index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ConsultationProvider>
        <TextMode />
      </ConsultationProvider>
    </AuthProvider>
  </React.StrictMode>
);
