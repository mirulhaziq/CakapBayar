'use client';

import { motion } from 'framer-motion';

export function MenuSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="h-16 bg-white/20 rounded-xl"
        />
      ))}
    </div>
  );
}

export function OrderItemSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="h-20 bg-white/10 rounded-xl"
        />
      ))}
    </div>
  );
}

