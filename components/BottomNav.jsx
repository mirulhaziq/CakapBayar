'use client';

import { Home, Menu, BarChart3 } from 'lucide-react';

export default function BottomNav({ currentTab, onTabChange }) {
  const tabs = [
    { id: 'orders', label: 'Pesanan', icon: Home },
    { id: 'menu', label: 'Menu', icon: Menu },
    { id: 'dashboard', label: 'Laporan', icon: BarChart3 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="max-w-md mx-auto px-4 pb-[max(1rem,var(--safe-area-inset-bottom))]">
        <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-2xl shadow-lg h-16 flex items-center px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex-1 h-full flex items-center justify-center"
              >
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                  <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {tab.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

