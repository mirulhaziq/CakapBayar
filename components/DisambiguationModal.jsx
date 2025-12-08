'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Coffee, Utensils, Cake, Package } from 'lucide-react';

export default function DisambiguationModal({
  possibleMatches = [],
  originalQuery = '',
  originalTranscript = '',
  requestedQuantity = 1,
  onSelect,
  onCancel
}) {
  const [selectedItem, setSelectedItem] = useState(null);

  // Get category icon and emoji
  const getCategoryIcon = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('minuman') || cat.includes('drink')) {
      return { icon: Coffee, emoji: '🥤' };
    } else if (cat.includes('kuih') || cat.includes('dessert')) {
      return { icon: Cake, emoji: '🍰' };
    } else if (cat.includes('makanan') || cat.includes('food')) {
      return { icon: Utensils, emoji: '🍽️' };
    }
    return { icon: Package, emoji: '📦' };
  };

  // Get category color
  const getCategoryColor = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('minuman') || cat.includes('drink')) {
      return 'bg-blue-100 text-blue-700';
    } else if (cat.includes('kuih') || cat.includes('dessert')) {
      return 'bg-pink-100 text-pink-700';
    } else if (cat.includes('makanan') || cat.includes('food')) {
      return 'bg-yellow-100 text-yellow-700';
    }
    return 'bg-gray-100 text-gray-700';
  };

  const handleConfirm = () => {
    if (selectedItem && onSelect) {
      onSelect({
        ...selectedItem,
        quantity: requestedQuantity
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 safe-area-bottom"
        onClick={(e) => {
          if (e.target === e.currentTarget) onCancel?.();
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-800">
                Pilih Item Yang Betul
              </h2>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600">
              Pelanggan sebut: <span className="font-semibold text-orange-600">"{originalQuery || originalTranscript}"</span>
            </p>
            {requestedQuantity > 1 && (
              <p className="text-sm text-gray-500 mt-1">
                Kuantiti: <span className="font-semibold">{requestedQuantity}</span>
              </p>
            )}
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {possibleMatches.map((item, index) => {
              const isSelected = selectedItem?.name === item.name;
              const { emoji } = getCategoryIcon(item.category);
              const categoryColor = getCategoryColor(item.category);

              return (
                <motion.button
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedItem(item)}
                  className={`
                    w-full p-4 rounded-xl border-2 text-left transition-all
                    ${isSelected
                      ? 'border-orange-500 bg-orange-50 ring-4 ring-orange-200 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Emoji/Icon */}
                    <div className={`text-4xl flex-shrink-0 ${isSelected ? 'scale-110' : ''} transition-transform`}>
                      {emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-800 truncate">
                          {item.name}
                        </h3>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-orange-500 rounded-full p-1"
                          >
                            <Check size={14} className="text-white" />
                          </motion.div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {item.nameMalay}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${categoryColor}`}>
                          {item.category}
                        </span>
                        <span className="text-lg font-bold text-orange-600">
                          RM {item.price.toFixed(2)}
                        </span>
                      </div>
                      {item.confidence && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-green-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${item.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {Math.round(item.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 safe-area-bottom">
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-4 px-6 bg-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-300 transition-colors active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedItem}
                className={`
                  flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all
                  flex items-center justify-center gap-2
                  ${selectedItem
                    ? 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                <Check size={20} />
                Pilih
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


