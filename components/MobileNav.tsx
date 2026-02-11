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
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <nav className="flex justify-around items-center h-16 px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full space-y-1',
                isActive ? 'text-blue-600' : 'text-gray-600'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
