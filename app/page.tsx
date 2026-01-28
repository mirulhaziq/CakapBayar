import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTodaySummary } from '@/lib/actions/analytics'
import { getActiveShift } from '@/lib/actions/shifts'
import { DollarSign, TrendingUp, ShoppingCart, Clock, Menu } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const [summary, activeShift] = await Promise.all([
    getTodaySummary(),
    getActiveShift()
  ])

  const stats = [
    {
      name: 'Jualan Hari Ini',
      value: `RM ${summary ? Number(summary.totalSales).toFixed(2) : '0.00'}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      name: 'Untung Bersih',
      value: `RM ${summary ? Number(summary.netProfit).toFixed(2) : '0.00'}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Transaksi',
      value: summary?.transactionCount || 0,
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      name: 'Status Shift',
      value: activeShift ? 'Aktif' : 'Tutup',
      icon: Clock,
      color: activeShift ? 'text-green-600' : 'text-gray-600',
      bgColor: activeShift ? 'bg-green-50' : 'bg-gray-50'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Selamat datang ke CakapNBayar</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.name}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!activeShift && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-yellow-900">
                  Tiada shift aktif
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Sila buka shift untuk mula merekod transaksi
                </p>
              </div>
              <Link
                href="/shift"
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Buka Shift
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pecahan Kaedah Bayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tunai</span>
                <span className="font-semibold">
                  RM {summary ? Number(summary.cashPayments).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Kad</span>
                <span className="font-semibold">
                  RM {summary ? Number(summary.cardPayments).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">E-Wallet</span>
                <span className="font-semibold">
                  RM {summary ? Number(summary.ewalletPayments).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">QR Pay</span>
                <span className="font-semibold">
                  RM {summary ? Number(summary.qrPayments).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Item Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.topSellingItems && Array.isArray(summary.topSellingItems) && summary.topSellingItems.length > 0 ? (
              <div className="space-y-3">
                {(summary.topSellingItems as Array<{ name: string; quantity: number; revenue: number }>)
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-400">
                          {index + 1}
                        </span>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{item.quantity} unit</p>
                        <p className="text-xs text-gray-500">
                          RM {item.revenue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Tiada data jualan hari ini
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/pesanan">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-blue-600 mb-3" />
                <h3 className="font-semibold text-lg">Pesanan Baru</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Rekod pesanan dengan suara atau manual
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/menu">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <Menu className="h-12 w-12 mx-auto text-green-600 mb-3" />
                <h3 className="font-semibold text-lg">Urus Menu</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Tambah atau ubah item menu
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/analytics">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-purple-600 mb-3" />
                <h3 className="font-semibold text-lg">Analitik</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Lihat laporan dan lembaran imbangan
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
