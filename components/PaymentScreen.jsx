'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { DollarSign, CreditCard, Smartphone, Check } from 'lucide-react';
import { hapticFeedback } from '../utils/haptic';

export default function PaymentScreen({ order, onComplete, onError }) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const createTransaction = useMutation(api.transactions.create);

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: DollarSign, color: 'bg-green-500' },
    { id: 'card', label: 'Card', icon: CreditCard, color: 'bg-blue-500' },
    { id: 'ewallet', label: 'E-Wallet', icon: Smartphone, color: 'bg-purple-500' },
  ];

  const handleConfirmPayment = async () => {
    if (isProcessing) return;
    
    hapticFeedback('medium');
    setIsProcessing(true);
    
    try {
      // Save transaction to Convex
      await createTransaction({
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: order.total,
        paymentMethod: selectedPaymentMethod,
      });

      hapticFeedback('success');
      // Show success animation
      setShowSuccess(true);
      
      // Wait for animation, then call onComplete
      setTimeout(() => {
        onComplete();
      }, 2000);
      
    } catch (error) {
      console.error('Payment error:', error);
      hapticFeedback('error');
      const errorMsg = 'Payment failed. Please try again. / Pembayaran gagal. Sila cuba lagi.';
      
      if (onError) {
        onError({
          title: 'Payment Error / Ralat Pembayaran',
          message: errorMsg,
        });
      }
      setIsProcessing(false);
    }
  };

  // Confetti particles for success animation
  const ConfettiParticle = ({ delay, x, color }) => (
    <motion.div
      className={`absolute w-3 h-3 ${color} rounded-full`}
      initial={{ y: -20, x: x, opacity: 0, rotate: 0 }}
      animate={{ 
        y: 800,
        x: x + (Math.random() - 0.5) * 200,
        opacity: [0, 1, 1, 0],
        rotate: 360,
      }}
      transition={{
        duration: 2,
        delay: delay,
        ease: "easeOut"
      }}
      aria-hidden="true"
    />
  );

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center p-4 safe-area-top safe-area-bottom"
      >
        <div className="text-center relative w-full max-w-md">
          {[...Array(40)].map((_, i) => (
            <ConfettiParticle
              key={i}
              delay={i * 0.05}
              x={(i % 10) * 40 - 180}
              color={['bg-amber-300', 'bg-white', 'bg-emerald-200', 'bg-blue-200'][i % 4]}
            />
          ))}
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 16 }}
            className="mb-8"
          >
            <div className="w-28 h-28 mx-auto bg-white rounded-full flex items-center justify-center shadow-2xl">
              <Check className="w-14 h-14 text-emerald-500" aria-hidden="true" />
            </div>
          </motion.div>
          
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-3"
            role="status"
            aria-live="polite"
          >
            Pembayaran diterima
          </motion.h2>
          
          <motion.p
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/90 text-lg"
            aria-label={`Total amount: RM${order.total.toFixed(2)}`}
          >
            RM{order.total.toFixed(2)}
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-slate-50 p-4 sm:p-6 safe-area-top safe-area-bottom"
    >
      <div className="max-w-md mx-auto space-y-4 pb-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between"
        >
          <div>
            <p className="text-sm text-slate-500">Langkah 2</p>
            <h1 className="text-3xl font-bold text-slate-900">Sahkan pembayaran</h1>
            <p className="text-sm text-slate-600 mt-1">Semak pesanan dan pilih kaedah bayaran</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Jumlah</p>
            <p className="text-2xl font-bold text-slate-900">RM{order.total.toFixed(2)}</p>
          </div>
        </motion.div>

        {/* Order Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-5 space-y-3"
          role="region"
          aria-label="Order summary / Ringkasan pesanan"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Ringkasan</h2>
            <span className="pill bg-slate-100 text-slate-700 border border-slate-200">
              {order.items.length} item
            </span>
          </div>

          <div className="space-y-3" role="list" aria-label="Order items / Item pesanan">
            <AnimatePresence>
              {order.items.map((item, index) => (
                <motion.div
                  key={`${item.name}-${index}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-between items-start border border-slate-200 rounded-xl px-3 py-2"
                  role="listitem"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 font-semibold">
                      {item.quantity} x {item.name}
                    </p>
                    {item.notes && <p className="text-xs text-slate-500 mt-1">{item.notes}</p>}
                  </div>
                  <p className="text-slate-900 font-bold" aria-label={`Price: RM${(item.price * item.quantity).toFixed(2)}`}>
                    RM{(item.price * item.quantity).toFixed(2)}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <p className="text-sm text-slate-600">Jumlah perlu dibayar</p>
            <p className="text-2xl font-bold text-slate-900">RM{order.total.toFixed(2)}</p>
          </div>
        </motion.div>

        {/* Payment Method Selection */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-5 space-y-3"
          role="region"
          aria-label="Payment method selection / Pilihan kaedah pembayaran"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Kaedah pembayaran</h3>
            <span className="text-xs text-slate-500">Pilih satu</span>
          </div>
          <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Select payment method">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedPaymentMethod === method.id;
              
              return (
                <motion.button
                  key={method.id}
                  onClick={() => {
                    hapticFeedback('light');
                    setSelectedPaymentMethod(method.id);
                  }}
                  aria-label={`Select ${method.label}`}
                  aria-pressed={isSelected}
                  role="radio"
                  className={`p-4 rounded-xl border transition-all text-center ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className={`w-7 h-7 mx-auto mb-2 ${isSelected ? 'text-blue-600' : 'text-slate-600'}`} aria-hidden="true" />
                  <p className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                    {method.label}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Confirm Payment Button */}
        <motion.button
          onClick={handleConfirmPayment}
          disabled={isProcessing}
          aria-label="Confirm payment / Sahkan pembayaran"
          className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-md transition-all ${
            isProcessing ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          whileHover={!isProcessing ? { scale: 1.01 } : {}}
          whileTap={!isProcessing ? { scale: 0.99 } : {}}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                aria-hidden="true"
              />
              Memproses...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5" aria-hidden="true" />
              Terima bayaran
            </div>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

