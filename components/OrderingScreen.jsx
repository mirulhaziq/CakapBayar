'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Mic, MicOff, Minus, Plus, Trash2, Volume2 } from 'lucide-react';
import DisambiguationModal from './DisambiguationModal';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { generateOrderAnnouncement } from '../utils/orderAnnouncement';
import { hapticFeedback } from '../utils/haptic';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function OrderingScreen({ menuItems = [], onConfirm, currentShift }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [quickMode, setQuickMode] = useState(false);

  // Disambiguation state
  const [showDisambiguation, setShowDisambiguation] = useState(false);
  const [disambiguationData, setDisambiguationData] = useState(null);

  // TTS state
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);

  // Quantity accumulation highlight
  const [highlightedItem, setHighlightedItem] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const { playAudio, isPlaying, unlockAudioPlayback } = useAudioPlayer();
  const recentTransactions = useQuery(api.transactions.getRecent);

  // Unlock audio on mount (iOS compatibility)
  useEffect(() => {
    unlockAudioPlayback();
    const saved = typeof window !== 'undefined' ? localStorage.getItem('announcementEnabled') : null;
    if (saved !== null) setAnnouncementEnabled(saved === 'true');
  }, [unlockAudioPlayback]);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const streamRef = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          streamRef.getTracks().forEach((track) => track.stop());
          await processAudio(audioBlob);
        } catch (err) {
          setError(`Error processing recording: ${err.message}`);
          setIsProcessing(false);
        }
      };

      mediaRecorder.onerror = () => {
        setError('Recording error occurred');
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript('');
      setError(null);
      hapticFeedback('light');
    } catch (err) {
      setError('Microphone access denied. Please enable microphone permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      hapticFeedback('medium');
    }
  };

  // Add items to order with quantity accumulation
  const addItemsToOrder = (newItems) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      let hasAccumulation = false;
      let accumulatedItem = null;

      newItems.forEach((newItem) => {
        const existingIndex = updated.findIndex((item) => item.name === newItem.name);

        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + newItem.quantity,
          };
          hasAccumulation = true;
          accumulatedItem = updated[existingIndex];
        } else {
          updated.push(newItem);
        }
      });

      if (hasAccumulation && accumulatedItem) {
        setHighlightedItem(accumulatedItem.name);
        setTimeout(() => setHighlightedItem(null), 2000);
      }

      return updated;
    });
  };

  // Process audio: transcribe and parse
  const processAudio = async (audioBlob) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      const transcribeResponse = await fetch('/api/transcribe', { method: 'POST', body: formData });
      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json().catch(() => ({
          error: `Transcription failed: ${transcribeResponse.status}`,
        }));
        throw new Error(errorData.error || 'Transcription failed');
      }

      const { text } = await transcribeResponse.json();
      setTranscript(text);

      const parseResponse = await fetch('/api/parse-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, menuItems, currentOrderItems: orderItems }),
      });

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json().catch(() => ({
          error: `Order parsing failed: ${parseResponse.status}`,
        }));
        throw new Error(errorData.error || 'Order parsing failed');
      }

      const parsedOrder = await parseResponse.json();

      if (parsedOrder.ambiguous && parsedOrder.possibleMatches) {
        setDisambiguationData({
          possibleMatches: parsedOrder.possibleMatches,
          originalQuery: parsedOrder.originalQuery || text,
          originalTranscript: text,
          requestedQuantity: parsedOrder.requestedQuantity || 1,
        });
        setShowDisambiguation(true);
      } else if (parsedOrder.actions || parsedOrder.items?.length) {
        applyParsedActions(parsedOrder);
      } else if (parsedOrder.error) {
        setError(parsedOrder.error);
      } else {
        setError('No items found in order. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Error processing order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisambiguationSelect = (item) => {
    addItemsToOrder([item]);
    setShowDisambiguation(false);
    setDisambiguationData(null);
    hapticFeedback('success');
  };

  const handleDisambiguationCancel = () => {
    setShowDisambiguation(false);
    setDisambiguationData(null);
  };

  const handleDeleteItem = (index) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
    hapticFeedback('light');
  };

  const handleDecrementItem = (index) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      const nextQty = updated[index].quantity - 1;
      if (nextQty <= 0) {
        updated.splice(index, 1);
      } else {
        updated[index] = { ...updated[index], quantity: nextQty };
      }
      return updated;
    });
    hapticFeedback('light');
  };

  // Announce order using TTS
  const announceOrder = async () => {
    if (!announcementEnabled || orderItems.length === 0) return;
    try {
      setIsAnnouncing(true);
      const announcementText = generateOrderAnnouncement(orderItems, calculatedTotal);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: announcementText }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('TTS API failed');
      const audioBlob = await response.blob();
      await playAudio(audioBlob);
    } catch (err) {
      console.error('Announcement error:', err);
    } finally {
      setIsAnnouncing(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (announcementEnabled && !isAnnouncing) {
      await announceOrder();
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    onConfirm?.({
      items: orderItems,
      total: calculatedTotal,
      transcript,
    });
  };

  const handleMicClick = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleAddMore = () => {
    setTranscript('');
    setOrderItems([]);
    setError(null);
    hapticFeedback('light');
  };

  const calculatedTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shiftLocked = !currentShift;
  const [confirmation, setConfirmation] = useState(null);
  const showConfirmation = (msg) => {
    setConfirmation(msg);
    setTimeout(() => setConfirmation(null), 2000);
  };

  // Derive popular items from recent transactions, fallback to defaults
  const popularFallback = ['Teh Tarik', 'Kopi O', 'Roti Canai', 'Nasi Lemak', 'Mee Goreng', 'Air Kosong'];
  const popularity = {};
  if (recentTransactions) {
    recentTransactions.forEach((t) => {
      t.items.forEach((it) => {
        const key = it.name;
        popularity[key] = (popularity[key] || 0) + it.quantity;
      });
    });
  }
  const popularSorted = Object.entries(popularity)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
  const popularNames = (popularSorted.length > 0 ? popularSorted : popularFallback).slice(0, 6);

  const quickItems = popularNames.map((name) => {
    const menu = menuItems.find((m) => m.name.toLowerCase() === name.toLowerCase());
    return {
      name,
      price: menu?.price ?? 0,
      nameMalay: menu?.nameMalay ?? '',
    };
  });

  const quickAddItem = (item) => {
    addItemsToOrder([{ name: item.name, price: item.price, quantity: 1, nameMalay: item.nameMalay }]);
    showConfirmation(`Ditambah: 1 ${item.name}`);
  };

  const applyParsedActions = (parsed) => {
    const actions = parsed.actions || {};
    const confirmations = parsed.confirmations || [];

    if (actions.remove?.length) {
      setOrderItems((prev) =>
        prev.filter(
          (it) => !actions.remove.some((rem) => rem.name?.toLowerCase() === it.name.toLowerCase())
        )
      );
    }

    if (actions.update?.length) {
      setOrderItems((prev) => {
        const updated = [...prev];
        actions.update.forEach((u) => {
          const idx = updated.findIndex((it) => it.name.toLowerCase() === u.name.toLowerCase());
          if (idx >= 0) {
            updated[idx] = {
              ...updated[idx],
              quantity: u.quantity,
              price: u.price ?? updated[idx].price,
            };
          }
        });
        return updated;
      });
    }

    if (actions.add?.length) {
      addItemsToOrder(actions.add);
    } else if (parsed.items?.length) {
      addItemsToOrder(parsed.items);
    }

    const msg = confirmations[0];
    if (msg) showConfirmation(msg);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-36 safe-area-bottom">
      {/* Announcement Indicator */}
      <AnimatePresence>
        {(isAnnouncing || isPlaying) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
          >
            <Volume2 size={16} className="animate-pulse" />
            <span className="text-sm font-semibold">Announcing order...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-8 pb-4"
      >
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">CakapBayar</p>
              <h1 className="text-3xl font-bold text-slate-900">Voice POS</h1>
            </div>
            {currentShift ? (
              <span className="pill bg-green-50 text-green-700 border border-green-200">
                Shift #{currentShift.shiftNumber}
              </span>
            ) : (
              <span className="pill bg-amber-50 text-amber-700 border border-amber-200">
                Shift belum dibuka
              </span>
            )}
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Shift locked notice */}
          {shiftLocked && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-elevated p-4 border border-amber-200 bg-amber-50 text-amber-900"
            >
              <p className="text-sm font-semibold">Shift belum dibuka</p>
              <p className="text-sm text-amber-800">
                Sila buka shift di tab Laporan sebelum mengambil pesanan.
              </p>
            </motion.div>
          )}

          {/* Mode toggle */}
          <div className="flex items-center gap-2 justify-center">
            <button
              onClick={() => setQuickMode(false)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                !quickMode ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              Voice
            </button>
            <button
              onClick={() => setQuickMode(true)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                quickMode ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              Quick
            </button>
          </div>

          {/* Mic card (hidden in quick mode) */}
          {!quickMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-elevated p-5 text-center"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-700">Rakaman suara</p>
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={announcementEnabled}
                    onChange={(e) => {
                      setAnnouncementEnabled(e.target.checked);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('announcementEnabled', String(e.target.checked));
                      }
                    }}
                    className="accent-blue-600"
                  />
                  Auto announce
                </label>
              </div>

              <motion.button
                onClick={!shiftLocked ? handleMicClick : undefined}
                disabled={isProcessing || shiftLocked}
                className={`relative mx-auto w-[120px] h-[120px] rounded-full flex items-center justify-center transition-all ${
                  isRecording ? 'bg-red-50 ring-4 ring-red-200' : 'bg-blue-50 ring-4 ring-blue-100'
                } ${isProcessing || shiftLocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                whileTap={!isProcessing && !shiftLocked ? { scale: 0.96 } : {}}
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-9 w-9 border-2 border-blue-600 border-t-transparent" />
                ) : isRecording ? (
                  <MicOff className="w-14 h-14 text-red-600" />
                ) : (
                  <Mic className="w-14 h-14 text-blue-600" />
                )}
                {isRecording && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-red-200"
                    animate={{ scale: [1, 1.5, 1.5], opacity: [0.8, 0, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
              </motion.button>

              <p className="mt-4 text-sm font-semibold text-slate-800">
                {shiftLocked
                  ? 'Buka shift dahulu'
                  : isRecording
                  ? 'Mendengar...'
                  : isProcessing
                  ? 'Memproses...'
                  : 'Tekan untuk mula'}
              </p>
              <p className="text-xs text-slate-500">
                {shiftLocked ? 'Shift diperlukan untuk mula mengambil pesanan.' : 'Cakap dalam Melayu atau English, campur pun boleh.'}
              </p>
            </motion.div>
          )}

          {/* Quick-add popular items */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-elevated p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-800">Item Popular (Tambah Pantas)</p>
              <span className="text-xs text-slate-500">Tap to add</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quickItems.map((item) => {
                const existing = orderItems.find((o) => o.name.toLowerCase() === item.name.toLowerCase());
                return (
                  <button
                    key={item.name}
                    onClick={!shiftLocked ? () => quickAddItem(item) : undefined}
                    disabled={shiftLocked}
                    className="relative h-20 rounded-xl bg-orange-500 text-white font-semibold text-left px-4 py-3 shadow-md hover:scale-[1.01] transition-transform disabled:opacity-60"
                  >
                    <div className="text-base leading-tight">{item.name}</div>
                    <div className="text-xs opacity-90">{item.nameMalay}</div>
                    {existing && (
                      <span className="absolute top-2 right-2 bg-white text-orange-600 text-xs font-bold px-2 py-1 rounded-full">
                        {existing.quantity}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="card-soft p-3 text-sm text-red-700 border border-red-200 bg-red-50"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcript */}
          <AnimatePresence>
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="card-elevated p-4"
              >
                <p className="text-slate-700 text-sm">
                  <span className="font-semibold text-slate-900">Anda berkata:</span> {transcript}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

      {/* Confirmation message */}
      <AnimatePresence>
        {confirmation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card-soft p-3 text-sm text-green-700 border border-green-200 bg-green-50"
          >
            {confirmation}
          </motion.div>
        )}
      </AnimatePresence>

          {/* Order items */}
          {orderItems.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-elevated p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Pesanan</p>
                <span className="text-xs text-slate-500">{orderItems.length} item</span>
              </div>
              <AnimatePresence>
                {orderItems.map((item, index) => {
                  const isHighlighted = highlightedItem === item.name;
                  return (
                    <motion.div
                      key={`${item.name}-${index}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 ${
                        isHighlighted ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 truncate">
                            {item.quantity} x {item.name}
                          </p>
                          {isHighlighted && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-[10px] font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full"
                            >
                              +{item.quantity}
                            </motion.span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{item.nameMalay || ''}</p>
                      </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecrementItem(index)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                        aria-label="Kurangkan kuantiti"
                      >
                        <Minus size={16} />
                      </button>
                      <p className="font-semibold text-slate-900 min-w-[70px] text-right">
                        RM{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleDeleteItem(index)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                        aria-label="Buang item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Total */}
          {orderItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-elevated p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Jumlah</p>
                <p className="text-3xl font-bold text-slate-900">RM{calculatedTotal.toFixed(2)}</p>
              </div>
              <span className="pill bg-blue-50 text-blue-700 border border-blue-100">
                {orderItems.reduce((sum, i) => sum + i.quantity, 0)} item
              </span>
            </motion.div>
          )}

          {/* Actions */}
          {orderItems.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pb-4">
              <button
                onClick={!shiftLocked ? handleAddMore : undefined}
                disabled={shiftLocked}
                className="w-full py-4 bg-white border border-gray-200 text-slate-900 font-semibold rounded-xl shadow-sm hover:bg-gray-50 transition-all"
              >
                Reset Pesanan
              </button>
              <button
                onClick={!shiftLocked ? handleConfirmOrder : undefined}
                disabled={isAnnouncing || isPlaying || shiftLocked}
                className={`w-full py-4 text-white font-semibold rounded-xl shadow-md transition-all ${
                  shiftLocked
                    ? 'bg-slate-300 cursor-not-allowed'
                    : isAnnouncing || isPlaying
                    ? 'bg-amber-400 cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {shiftLocked ? 'Buka shift untuk meneruskan' : isAnnouncing || isPlaying ? 'Mengumumkan...' : 'Sahkan & Bayar'}
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Disambiguation Modal */}
      <AnimatePresence>
        {showDisambiguation && disambiguationData && (
          <DisambiguationModal
            possibleMatches={disambiguationData.possibleMatches}
            originalQuery={disambiguationData.originalQuery}
            originalTranscript={disambiguationData.originalTranscript}
            requestedQuantity={disambiguationData.requestedQuantity}
            onSelect={handleDisambiguationSelect}
            onCancel={handleDisambiguationCancel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
