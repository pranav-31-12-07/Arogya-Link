import React from 'react';
import ReactDOM from 'react-dom/client';
import Signup from '../pages/Signup';
import { AuthProvider } from '../contexts/AuthContext';
import { ConsultationProvider } from '../contexts/ConsultationContext';
import '../index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ConsultationProvider>
        <Signup />
      </ConsultationProvider>
    </AuthProvider>
  </React.StrictMode>
);
