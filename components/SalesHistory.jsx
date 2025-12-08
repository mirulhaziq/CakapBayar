'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  ShoppingBag, 
  Clock,
  TrendingUp,
  X
} from 'lucide-react';

export default function SalesHistory({ onClose, onSelectDate }) {
  const recentSummaries = useQuery(api.dailySummaries.getRecent, { limit: 30 });
  const [selectedSummary, setSelectedSummary] = useState(null);

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('ms-MY', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Check if date is today
  const isToday = (dateStr) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateStr === todayStr;
  };

  // Get day name in Malay
  const getDayName = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
    return days[date.getDay()];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-40 safe-area-bottom">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Sejarah Jualan</h1>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Weekly Summary Card */}
        <WeeklySummaryCard />

        {/* Recent Days List */}
        <div className="mt-6">
          <h2 className="font-semibold text-gray-600 mb-3">Rekod Harian</h2>
          
          {!recentSummaries ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentSummaries.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Tiada rekod jualan lagi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSummaries.map((summary, index) => (
                <motion.button
                  key={summary._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setSelectedSummary(summary);
                    if (onSelectDate) onSelectDate(summary.date);
                  }}
                  className="w-full bg-white rounded-xl p-4 shadow-sm text-left hover:shadow-md transition-all active:scale-98"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">
                          {getDayName(summary.date)}
                        </span>
                        {isToday(summary.date) && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Hari Ini
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-800">
                        {formatDate(summary.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">
                        RM {summary.totalSales.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {summary.transactionCount} transaksi
                      </p>
                    </div>
                  </div>
                  
                  {/* Mini Stats */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock size={14} />
                      <span>{summary.shiftCount} shift</span>
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      Math.abs(summary.cashDifference) < 1 
                        ? 'text-green-600' 
                        : Math.abs(summary.cashDifference) < 10 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                    }`}>
                      <DollarSign size={14} />
                      <span>
                        {Math.abs(summary.cashDifference) < 1 
                          ? 'Tepat' 
                          : `Beza: RM ${Math.abs(summary.cashDifference).toFixed(2)}`
                        }
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Day Detail Modal */}
        <AnimatePresence>
          {selectedSummary && (
            <DayDetailModal 
              summary={selectedSummary} 
              onClose={() => setSelectedSummary(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Weekly Summary Card
function WeeklySummaryCard() {
  const weeklyStats = useQuery(api.dailySummaries.getWeeklyStats);

  if (!weeklyStats) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white animate-pulse">
        <div className="h-4 bg-white/30 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-white/30 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={24} />
        <h3 className="font-semibold">Minggu Ini</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-blue-100">Jumlah Jualan</p>
          <p className="text-2xl font-bold">RM {weeklyStats.totalSales.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-blue-100">Transaksi</p>
          <p className="text-2xl font-bold">{weeklyStats.totalTransactions}</p>
        </div>
        <div>
          <p className="text-sm text-blue-100">Purata Harian</p>
          <p className="text-xl font-bold">RM {weeklyStats.averageDaily.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-blue-100">Hari Direkod</p>
          <p className="text-xl font-bold">{weeklyStats.daysRecorded} hari</p>
        </div>
      </div>
    </div>
  );
}

// Day Detail Modal
function DayDetailModal({ summary, onClose }) {
  const shifts = useQuery(api.shifts.getByDate, { date: summary.date });
  const transactions = useQuery(api.transactions.getByDate, { date: summary.date });

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ms-MY', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('ms-MY', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center safe-area-bottom"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-white w-full max-w-md rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Ringkasan Harian</h2>
            <p className="text-sm text-gray-500">{formatDate(summary.date)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Summary Stats */}
          <div className="bg-green-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Jumlah Jualan</p>
                <p className="text-2xl font-bold text-green-600">
                  RM {summary.totalSales.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transaksi</p>
                <p className="text-2xl font-bold text-gray-800">
                  {summary.transactionCount}
                </p>
              </div>
            </div>
          </div>

          {/* Cash Reconciliation */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Penyesuaian Tunai</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tunai Awal</span>
                <span className="font-medium">RM {summary.openingCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tunai Akhir</span>
                <span className="font-medium">RM {summary.closingCash.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between pt-2 border-t ${
                Math.abs(summary.cashDifference) < 1 
                  ? 'text-green-600' 
                  : Math.abs(summary.cashDifference) < 10 
                  ? 'text-yellow-600' 
                  : 'text-red-600'
              }`}>
                <span className="font-medium">Beza</span>
                <span className="font-bold">
                  {Math.abs(summary.cashDifference) < 1 
                    ? '✅ Tepat!' 
                    : `RM ${summary.cashDifference.toFixed(2)}`
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Pecahan Bayaran</h3>
            <div className="space-y-2">
              {Object.entries(summary.byPaymentMethod || {}).map(([method, data]) => {
                if (data.count === 0) return null;
                const labels = {
                  cash: 'Tunai',
                  debit: 'Kad Debit',
                  credit: 'Kad Kredit',
                  qr: 'QR Code',
                  ewallet: 'E-Wallet'
                };
                return (
                  <div key={method} className="flex justify-between text-sm">
                    <span className="text-gray-600">{labels[method] || method}</span>
                    <span className="font-medium">
                      RM {data.total.toFixed(2)} ({data.count})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shifts for this day */}
          {shifts && shifts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Shift ({shifts.length})
              </h3>
              <div className="space-y-3">
                {shifts.map((shift) => (
                  <div key={shift._id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">
                          Shift {shift.shiftNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(shift.openedAt)} 
                          {shift.closedAt && ` - ${formatTime(shift.closedAt)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          RM {(shift.totalSales || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {shift.transactionCount || 0} transaksi
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}


