'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useEffect } from 'react';

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast.autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, toast.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  const icons = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info,
  };

  const colors = {
    error: 'bg-red-500',
    success: 'bg-green-500',
    info: 'bg-blue-500',
  };

  const Icon = icons[toast.type] || Info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`
        fixed top-4 left-1/2 transform -translate-x-1/2 z-50
        max-w-md w-full mx-4
        ${colors[toast.type] || colors.info} text-white
        rounded-xl shadow-2xl p-4
        flex items-start gap-3
        safe-area-top
      `}
      role="alert"
      aria-live="assertive"
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-sm mb-1">{toast.title}</p>
        )}
        <p className="text-sm">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none safe-area-top">
      <div className="max-w-md mx-auto">
        <AnimatePresence>
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <Toast toast={toast} onClose={() => onClose(toast.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

