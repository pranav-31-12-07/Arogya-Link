import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign up with Name, Email, Password
  const signup = async (email, password, name) => {
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(userCredential.user, {
          displayName: name
        });
        // Force refresh current user to reflect updated displayName
        setCurrentUser({ ...userCredential.user, displayName: name });
      }
      return userCredential.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Sign in with Email and Password
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Sign out
  const logout = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Password Reset
  const resetPassword = async (email) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Get Firebase ID token for FastAPI backend communication
  const getIdToken = async (forceRefresh = false) => {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken(forceRefresh);
  };

  const value = {
    currentUser,
    loading,
    authError,
    setAuthError,
    signup,
    login,
    logout,
    resetPassword,
    getIdToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
