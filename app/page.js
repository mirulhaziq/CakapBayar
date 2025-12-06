'use client';

import { useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import OrderingScreen from "../components/OrderingScreen";
import PaymentScreen from "../components/PaymentScreen";
import MenuManagement from "../components/MenuManagement";
import Dashboard from "../components/Dashboard";
import BottomNav from "../components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const menuItems = useQuery(api.menu.getAvailable) || [];
  const currentShift = useQuery(api.shifts.getCurrentShift);
  const [currentTab, setCurrentTab] = useState('orders');
  const [currentScreen, setCurrentScreen] = useState('ordering'); // 'ordering' or 'payment'
  const [currentOrder, setCurrentOrder] = useState(null);

  const handleConfirmOrder = (orderData) => {
    setCurrentOrder(orderData);
    setCurrentScreen('payment');
  };

  const handlePaymentComplete = () => {
    setCurrentOrder(null);
    setCurrentScreen('ordering');
    setCurrentTab('orders');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTab + currentScreen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 pb-20"
        >
          {/* Content based on tab */}
          {currentTab === 'orders' && (
            <>
              {currentScreen === 'ordering' && (
                <OrderingScreen
                  menuItems={menuItems}
                  onConfirm={handleConfirmOrder}
                  currentShift={currentShift}
                />
              )}
              {currentScreen === 'payment' && currentOrder && (
                <PaymentScreen
                  order={currentOrder}
                  onComplete={handlePaymentComplete}
                />
              )}
            </>
          )}
          
          {currentTab === 'menu' && <MenuManagement />}
          
          {currentTab === 'dashboard' && <Dashboard />}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}
