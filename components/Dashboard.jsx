'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  CreditCard,
  Smartphone,
  Clock,
  Calendar,
  X,
  History,
  Play,
  Square
} from 'lucide-react';
import SalesHistory from './SalesHistory';
import { hapticFeedback } from '../utils/haptic';

export default function Dashboard() {
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Queries
  const currentShift = useQuery(api.shifts.getCurrentShift);
  const shiftStats = useQuery(api.shifts.getShiftStats);
  const todaySummary = useQuery(api.dailySummaries.getToday);
  const todayTransactions = useQuery(api.transactions.getToday);
  const selectedDateSummary = useQuery(
    api.dailySummaries.getByDate,
    selectedDate ? { date: selectedDate } : 'skip'
  );
  
  // Mutations
  const openShift = useMutation(api.shifts.openShift);
  const closeShift = useMutation(api.shifts.closeShift);

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('ms-MY', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Get today's date string
  const getTodayDateString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  // Use selected date summary or today's summary
  const displaySummary = selectedDate && selectedDateSummary 
    ? selectedDateSummary 
    : todaySummary;

  const paymentMethodConfig = {
    cash: { icon: DollarSign, label: 'Tunai', color: 'bg-green-100 text-green-700' },
    debit: { icon: CreditCard, label: 'Kad Debit', color: 'bg-blue-100 text-blue-700' },
    credit: { icon: CreditCard, label: 'Kad Kredit', color: 'bg-blue-100 text-blue-700' },
    qr: { icon: Smartphone, label: 'QR Code', color: 'bg-purple-100 text-purple-700' },
    ewallet: { icon: Smartphone, label: 'E-Wallet', color: 'bg-purple-100 text-purple-700' },
  };

  if (showHistory) {
    return (
      <SalesHistory 
        onClose={() => setShowHistory(false)}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setShowHistory(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-40 safe-area-bottom">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* Header with Date Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-slate-900">Laporan</h1>
            <button
              onClick={() => setShowHistory(true)}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <History size={20} className="text-slate-600" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-500" />
            <p className="text-sm text-slate-500">
              {selectedDate ? formatDate(selectedDate) : formatDate(getTodayDateString())}
            </p>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="ml-2 text-xs text-blue-600 hover:underline"
              >
                Kembali ke hari ini
              </button>
            )}
          </div>
        </div>

        {/* Shift Status Banner */}
        <ShiftStatusBanner
          currentShift={currentShift}
          shiftStats={shiftStats}
          onOpenShift={() => setShowOpenShiftModal(true)}
          onCloseShift={() => setShowCloseShiftModal(true)}
        />

        {/* Stats Cards */}
        {!displaySummary ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-200 rounded-2xl p-4 h-32 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {/* Total Sales */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl p-4 text-white shadow-md"
              >
                <DollarSign size={28} className="mb-2 opacity-80" />
                <p className="text-xs text-white/80">Jualan</p>
                <p className="text-2xl font-bold">
                  RM {displaySummary.totalSales?.toFixed(2) || '0.00'}
                </p>
              </motion.div>

              {/* Transaction Count */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 }}
                className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-4 text-white shadow-md"
              >
                <ShoppingBag size={28} className="mb-2 opacity-80" />
                <p className="text-xs text-white/80">Transaksi</p>
                <p className="text-2xl font-bold">{displaySummary.transactionCount || 0}</p>
              </motion.div>

              {/* Average Order */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-4 text-white shadow-md"
              >
                <TrendingUp size={28} className="mb-2 opacity-80" />
                <p className="text-xs text-white/80">Purata</p>
                <p className="text-2xl font-bold">
                  RM {displaySummary.transactionCount > 0 
                    ? (displaySummary.totalSales / displaySummary.transactionCount).toFixed(2) 
                    : '0.00'}
                </p>
              </motion.div>

              {/* Shift Count */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-4 text-white shadow-md"
              >
                <Clock size={28} className="mb-2 opacity-80" />
                <p className="text-xs text-white/80">Shift</p>
                <p className="text-2xl font-bold">{displaySummary.shiftCount || 0}</p>
              </motion.div>
            </div>

            {/* Cash Reconciliation (if closed) */}
            {displaySummary.exists && displaySummary.shiftCount > 0 && (
              <div className="card-elevated p-4 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-3">Penyesuaian Tunai</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tunai Awal</span>
                    <span className="font-medium">RM {displaySummary.openingCash.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tunai Akhir</span>
                    <span className="font-medium">RM {displaySummary.closingCash.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between pt-2 border-t font-bold ${
                    Math.abs(displaySummary.cashDifference) < 1 
                      ? 'text-green-600' 
                      : Math.abs(displaySummary.cashDifference) < 10 
                      ? 'text-yellow-600' 
                      : 'text-red-600'
                  }`}>
                    <span>Beza</span>
                    <span>
                      {Math.abs(displaySummary.cashDifference) < 1 
                        ? '✅ Tepat!' 
                        : `RM ${displaySummary.cashDifference.toFixed(2)}`
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Payment Method Breakdown */}
        {displaySummary && displaySummary.byPaymentMethod && (
          <div className="card-elevated p-4">
            <h3 className="font-bold text-slate-900 mb-3">Pecahan Mengikut Kaedah Bayaran</h3>
            <div className="space-y-2">
              {Object.entries(displaySummary.byPaymentMethod || {}).map(([method, data]) => {
                if (data.count === 0) return null;
                const config = paymentMethodConfig[method];
                const Icon = config?.icon || CreditCard;
                const percentage = displaySummary.totalSales > 0 
                  ? (data.total / displaySummary.totalSales) * 100 
                  : 0;
                
                return (
                  <div key={method} className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config?.color || 'bg-gray-100'}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-700">{config?.label || method}</span>
                        <span className="font-medium">RM {data.total.toFixed(2)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full transition-all" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{data.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {!todayTransactions ? (
          <div className="card-elevated p-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border-b pb-3 last:border-0">
                  <div className="h-4 bg-slate-200 rounded w-full mb-1 animate-pulse"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ) : todayTransactions.length === 0 ? (
          <div className="card-elevated p-8 text-center">
            <ShoppingBag size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">Tiada transaksi hari ini</p>
          </div>
        ) : (
          <div className="card-elevated p-4">
            <h3 className="font-bold text-slate-900 mb-3">Transaksi Terkini</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {todayTransactions.slice(0, 10).map((t) => {
                const method = t.paymentMethod?.toLowerCase();
                const config = paymentMethodConfig[method] || paymentMethodConfig.cash;
                const Icon = config.icon;
                
                return (
                  <div key={t._id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm text-slate-700 truncate">
                        {t.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                      <p className="text-xs text-slate-400">{t.formattedTime}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-green-600">RM {t.total.toFixed(2)}</p>
                      <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 ${config.color}`}>
                        <Icon size={12} />
                        <span>{config.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Open Shift Modal */}
      <AnimatePresence>
        {showOpenShiftModal && (
          <OpenShiftModal
            onClose={() => setShowOpenShiftModal(false)}
            onOpen={async (openingCash, openedBy) => {
              try {
                await openShift({ openingCash, openedBy });
                hapticFeedback('success');
                setShowOpenShiftModal(false);
              } catch (error) {
                alert('Ralat: ' + error.message);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Close Shift Modal */}
      <AnimatePresence>
        {showCloseShiftModal && currentShift && (
          <CloseShiftModal
            currentShift={currentShift}
            shiftStats={shiftStats}
            todayTransactions={todayTransactions}
            onClose={() => setShowCloseShiftModal(false)}
            onCloseShift={async (closingCash, closedBy, notes) => {
              try {
                const result = await closeShift({ closingCash, closedBy, notes });
                hapticFeedback('success');
                setShowCloseShiftModal(false);
              } catch (error) {
                alert('Ralat: ' + error.message);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Shift Status Banner Component
function ShiftStatusBanner({ currentShift, shiftStats, onOpenShift, onCloseShift }) {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ms-MY', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getShiftDuration = () => {
    if (!currentShift) return null;
    const now = Date.now();
    const openedAt = currentShift.openedAt;
    const duration = now - openedAt;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}j ${minutes}m`;
  };

  if (!currentShift) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-yellow-800">Shift Ditutup</p>
            <p className="text-sm text-yellow-600">Tiada shift aktif</p>
          </div>
          <button
            onClick={onOpenShift}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors"
          >
            <Play size={16} />
            Buka Shift
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-green-50 border-2 border-green-300 rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-bold text-green-800">
            Shift {currentShift.shiftNumber} Dibuka
          </p>
          <p className="text-sm text-green-600">
            Dibuka pada {formatTime(currentShift.openedAt)}
          </p>
          {getShiftDuration() && (
            <p className="text-xs text-green-500 mt-1">
              Tempoh: {getShiftDuration()}
            </p>
          )}
        </div>
        <button
          onClick={onCloseShift}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors"
        >
          <Square size={16} />
          Tutup Shift
        </button>
      </div>
      
      {shiftStats && (
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-green-200">
          <div>
            <p className="text-xs text-green-600">Jualan</p>
            <p className="font-bold text-green-800">
              RM {shiftStats.totalSales.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-green-600">Transaksi</p>
            <p className="font-bold text-green-800">{shiftStats.transactionCount}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Open Shift Modal
function OpenShiftModal({ onClose, onOpen }) {
  const [openingCash, setOpeningCash] = useState('');
  const [openedBy, setOpenedBy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!openingCash || parseFloat(openingCash) < 0) {
      alert('Sila masukkan tunai awal yang sah');
      return;
    }
    setIsSubmitting(true);
    try {
      await onOpen(parseFloat(openingCash), openedBy || undefined);
    } catch (error) {
      alert('Ralat: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 safe-area-bottom"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Buka Shift</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tunai Awal (RM)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none text-lg"
              placeholder="0.00"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Operator (Pilihan)
            </label>
            <input
              type="text"
              value={openedBy}
              onChange={(e) => setOpenedBy(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none"
              placeholder="Nama operator"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Membuka...' : 'Buka Shift'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Close Shift Modal
function CloseShiftModal({ currentShift, shiftStats, todayTransactions, onClose, onCloseShift }) {
  const [closingCash, setClosingCash] = useState('');
  const [closedBy, setClosedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expectedCash = shiftStats?.expectedCash || currentShift?.expectedCash || 0;
  const currentSales = shiftStats?.totalSales || currentShift?.currentSales || 0;
  const transactionCount = shiftStats?.transactionCount || currentShift?.currentTransactionCount || 0;
  const closingCashNumber = Number(closingCash || 0);
  const cashDelta = closingCashNumber - expectedCash;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!closingCash || parseFloat(closingCash) < 0) {
      alert('Sila masukkan tunai akhir yang sah');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await onCloseShift(
        parseFloat(closingCash),
        closedBy || undefined,
        notes || undefined
      );

      const shiftData = {
        shiftNumber: currentShift.shiftNumber,
        date: currentShift.date,
        openedAt: currentShift.openedAt,
        closedAt: Date.now(),
        openingCash: currentShift.openingCash,
        closingCash: parseFloat(closingCash),
        totalSales: result?.totalSales ?? shiftStats?.totalSales ?? 0,
        transactionCount: result?.transactionCount ?? shiftStats?.transactionCount ?? 0,
        byPaymentMethod: result?.byPaymentMethod ?? shiftStats?.byPaymentMethod ?? {
          cash: { count: 0, total: 0 },
          debit: { count: 0, total: 0 },
          credit: { count: 0, total: 0 },
          qr: { count: 0, total: 0 },
          ewallet: { count: 0, total: 0 },
        },
        openedBy: currentShift.openedBy,
        closedBy: closedBy || currentShift.closedBy,
        notes: notes || '',
      };

      const shiftTx = (todayTransactions || []).filter((t) => t.shiftId === currentShift._id);

      // fire-and-forget email
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        fetch('/api/email/send-shift-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shiftData, transactions: shiftTx }),
          signal: controller.signal,
        }).catch((err) => console.error('Email error (non-blocking):', err))
          .finally(() => clearTimeout(timeoutId));
      } catch (err) {
        console.error('Email trigger error:', err);
      }

      alert('✅ Shift ditutup berjaya! Laporan dihantar ke email (jika dikonfigurasi).');
      setClosingCash('');
      setClosedBy('');
      setNotes('');
      onClose();
    } catch (error) {
      alert('Ralat: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ms-MY', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 safe-area-bottom"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl h-[92vh] max-h-[92vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Tutup Shift</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={24} />
            </button>
          </div>

          {/* Shift Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shift {currentShift.shiftNumber}</span>
              <span className="text-gray-600">
                {formatTime(currentShift.openedAt)} - Sekarang
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Jualan</span>
              <span className="font-bold text-green-600">RM {currentSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Transaksi</span>
              <span className="font-bold">{transactionCount}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-700">Tunai Dijangka</span>
              <span className="font-bold">RM {expectedCash.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <form
          id="close-shift-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5 pb-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tunai Akhir (RM) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none text-lg"
              placeholder="0.00"
              required
              autoFocus
            />
            <div className="mt-2 text-xs flex items-center gap-2">
              <span className="text-gray-500">Dijangka:</span>
              <span className="font-semibold text-gray-800">RM {expectedCash.toFixed(2)}</span>
              <span
                className={`px-2 py-1 rounded-full font-semibold ${
                  cashDelta >= -0.009 && cashDelta <= 0.009
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : cashDelta > 0
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {cashDelta >= -0.009 && cashDelta <= 0.009
                  ? 'Tepat'
                  : cashDelta > 0
                  ? `+RM ${cashDelta.toFixed(2)}`
                  : `-RM ${Math.abs(cashDelta).toFixed(2)}`}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Operator (Pilihan)
            </label>
            <input
              type="text"
              value={closedBy}
              onChange={(e) => setClosedBy(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none"
              placeholder="Nama operator"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nota (Pilihan)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none resize-none"
              rows={3}
              placeholder="Nota tambahan..."
            />
          </div>

          <div className="h-2" aria-hidden="true"></div>
        </form>

        <div className="sticky bottom-0 left-0 right-0 p-4 pb-6 border-t bg-white shadow-[0_-6px_18px_rgba(0,0,0,0.06)] safe-area-bottom">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-300 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              form="close-shift-form"
              className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Menutup...
                </>
              ) : (
                <>
                  <X size={20} />
                  Tutup Shift
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
