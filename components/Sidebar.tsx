'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  History, 
  Menu, 
  Receipt, 
  BarChart3, 
  Clock,
  Settings 
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Pesanan', href: '/pesanan', icon: ShoppingCart },
  { name: 'Sejarah', href: '/sejarah', icon: History },
  { name: 'Menu', href: '/menu', icon: Menu },
  { name: 'Perbelanjaan', href: '/perbelanjaan', icon: Receipt },
  { name: 'Analitik', href: '/analytics', icon: BarChart3 },
  { name: 'Shift', href: '/shift', icon: Clock },
  { name: 'Tetapan', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow border-r border-gray-200 bg-white overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 py-6">
          <h1 className="text-2xl font-bold text-blue-600">CakapNBayar</h1>
        </div>
        <nav className="flex-1 px-3 pb-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 flex-shrink-0 h-5 w-5',
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
