'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, Receipt } from 'lucide-react'
import { getTransactions } from '@/lib/actions/transactions'
import { getDailySummaries } from '@/lib/actions/analytics'
import { format } from 'date-fns'

interface Transaction {
  id: number
  items: Array<{ name: string; price: number; quantity: number }>
  total: number
  paymentMethod: string
  transactionDate: string | Date
  notes?: string
}

interface DailySummary {
  id: number
  summaryDate: string
  totalSales: number
  totalExpenses: number
  netProfit: number
  transactionCount: number
}

const paymentMethodColors: Record<string, string> = {
  'Tunai': 'bg-green-100 text-green-700',
  'Kad': 'bg-orange-100 text-orange-700',
  'E-Wallet': 'bg-purple-100 text-purple-700',
  'QR Pay': 'bg-blue-100 text-blue-700',
}

export default function SejarahPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summaries, setSummaries] = useState<DailySummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [txData, sumData] = await Promise.all([
        getTransactions(200),
        getDailySummaries(30)
      ])
      setTransactions(Array.isArray(txData) ? txData as any : [])
      setSummaries(Array.isArray(sumData) ? sumData as any : [])
    } catch (error) {
      console.error('Error loading sejarah data:', error)
      setTransactions([])
      setSummaries([])
    }
    setLoading(false)
  }

  const totalSales = useMemo(() =>
    transactions.reduce((sum, t) => sum + Number(t.total), 0),
    [transactions]
  )

  const totalTransactions = transactions.length

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-500">Laporan</p>
        <h1 className="text-3xl font-bold text-gray-900">Sejarah Transaksi</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Jumlah Jualan</p>
                <p className="text-2xl font-bold">RM {totalSales.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Transaksi</p>
                <p className="text-2xl font-bold">{totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transaksi">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="transaksi">Transaksi</TabsTrigger>
          <TabsTrigger value="ringkasan">Ringkasan Harian</TabsTrigger>
        </TabsList>

        <TabsContent value="transaksi" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Transaksi Terkini</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Tiada transaksi dijumpai</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-3 text-sm font-medium text-gray-500">Tarikh/Masa</th>
                        <th className="py-3 text-sm font-medium text-gray-500">Item</th>
                        <th className="py-3 text-sm font-medium text-gray-500 text-center">Kaedah</th>
                        <th className="py-3 text-sm font-medium text-gray-500 text-right">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => {
                        const rawItems = tx.items
                        let parsedItems: any
                        try {
                          parsedItems = typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems
                        } catch {
                          parsedItems = []
                        }
                        const items: Array<{ name: string; price: number; quantity: number }> =
                          Array.isArray(parsedItems) ? parsedItems : []
                        const itemsStr = items.map(i => `${i.quantity}x ${i.name}`).join(', ')
                        const displayItems = items.length > 2
                          ? items.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ') + ` +${items.length - 2} lagi`
                          : itemsStr

                        return (
                          <tr key={tx.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-4">
                              <p className="text-sm font-medium">
                                {format(new Date(tx.transactionDate), 'dd MMMM yyyy')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(tx.transactionDate), 'hh:mm a')}
                              </p>
                            </td>
                            <td className="py-4">
                              <p className="text-sm">{displayItems}</p>
                            </td>
                            <td className="py-4 text-center">
                              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${paymentMethodColors[tx.paymentMethod] || 'bg-gray-100 text-gray-700'}`}>
                                {tx.paymentMethod}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <p className="font-semibold text-blue-600">
                                RM {Number(tx.total).toFixed(2)}
                              </p>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ringkasan" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Ringkasan Harian</CardTitle>
            </CardHeader>
            <CardContent>
              {summaries.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Tiada ringkasan dijumpai</p>
              ) : (
                <div className="space-y-4">
                  {[...summaries].reverse().map(summary => (
                    <div key={summary.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{summary.summaryDate}</p>
                        <p className="text-sm text-gray-500">{summary.transactionCount} transaksi</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">RM {Number(summary.totalSales).toFixed(2)}</p>
                        <p className="text-sm text-gray-500">
                          Untung: RM {Number(summary.netProfit).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
