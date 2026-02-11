'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Mic, 
  Menu, 
  Receipt, 
  Clock,
  BarChart3,
  History,
  Settings 
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Pesanan', href: '/pesanan', icon: Mic },
  { name: 'Menu', href: '/menu', icon: Menu },
  { name: 'Perbelanjaan', href: '/perbelanjaan', icon: Receipt },
  { name: 'Shift', href: '/shift', icon: Clock },
  { name: 'Analitik', href: '/analytics', icon: BarChart3 },
  { name: 'Sejarah', href: '/sejarah', icon: History },
  { name: 'Tetapan', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow border-r border-gray-200 bg-white overflow-y-auto">
        <div className="flex flex-col flex-shrink-0 px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900">CakapBayar</h1>
          <p className="text-xs text-gray-400 mt-0.5">Voice POS System</p>
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
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
        <div className="px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">CakapBayar v1.0</p>
        </div>
      </div>
    </div>
  )
}
