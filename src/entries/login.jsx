import React from 'react';
import ReactDOM from 'react-dom/client';
import Login from '../pages/Login';
import { AuthProvider } from '../contexts/AuthContext';
import { ConsultationProvider } from '../contexts/ConsultationContext';
import '../index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ConsultationProvider>
        <Login />
      </ConsultationProvider>
    </AuthProvider>
  </React.StrictMode>
);
