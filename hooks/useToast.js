'use client';

import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((toast) => {
    const id = Date.now().toString();
    const newToast = {
      id,
      type: 'info',
      duration: 3000,
      autoClose: true,
      ...toast,
    };
    
    setToasts((prev) => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const error = useCallback((message, title = 'Error') => {
    return showToast({ type: 'error', message, title });
  }, [showToast]);

  const success = useCallback((message, title = 'Success') => {
    return showToast({ type: 'success', message, title });
  }, [showToast]);

  const info = useCallback((message, title = 'Info') => {
    return showToast({ type: 'info', message, title });
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    error,
    success,
    info,
  };
}

