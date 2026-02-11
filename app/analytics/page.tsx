'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import BalanceSheet from '@/components/BalanceSheet'
import { getTransactionsByDateRange } from '@/lib/actions/transactions'
import { getExpensesByDateRange } from '@/lib/actions/expenses'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DollarSign, Receipt, TrendingUp, ArrowRightLeft, Clock } from 'lucide-react'
import { format, subDays, startOfDay, endOfDay, startOfMonth } from 'date-fns'

interface Transaction {
  id: number
  items: Array<{ name: string; price: number; quantity: number }>
  total: number
  paymentMethod: string
  transactionDate: string | Date
}

interface Expense {
  id: number
  amount: number
  category: string
  expenseDate: string | Date
}

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [balanceSheetMonth, setBalanceSheetMonth] = useState(new Date().getMonth() + 1)
  const [balanceSheetYear, setBalanceSheetYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    setLoading(true)
    try {
      const start = startOfDay(new Date(startDate))
      const end = endOfDay(new Date(endDate))

      const [txData, expData] = await Promise.all([
        getTransactionsByDateRange(start, end),
        getExpensesByDateRange(start, end),
      ])

      setTransactions(Array.isArray(txData) ? txData as any : [])
      setExpenses(Array.isArray(expData) ? expData as any : [])
    } catch (error) {
      console.error('Error loading analytics:', error)
      setTransactions([])
      setExpenses([])
    }
    setLoading(false)
  }

  function handleDateChange() {
    loadAnalytics()
  }

  function setQuickRange(label: string) {
    const today = new Date()
    let start: Date

    switch (label) {
      case 'today':
        start = today
        break
      case '7days':
        start = subDays(today, 7)
        break
      case '30days':
        start = subDays(today, 30)
        break
      case 'month':
        start = startOfMonth(today)
        break
      default:
        start = subDays(today, 7)
    }

    setStartDate(format(start, 'yyyy-MM-dd'))
    setEndDate(format(today, 'yyyy-MM-dd'))
    // Trigger reload after state update
    setTimeout(() => loadAnalytics(), 50)
  }

  // Computed values
  const totalSales = useMemo(() =>
    transactions.reduce((sum, t) => sum + Number(t.total), 0),
    [transactions]
  )

  const totalExpenses = useMemo(() =>
    expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses]
  )

  const netProfit = totalSales - totalExpenses
  const totalTransactions = transactions.length
  const averageOrder = totalTransactions > 0 ? totalSales / totalTransactions : 0

  // Chart data - top selling items by revenue
  const topItemsChart = useMemo(() => {
    const itemMap: Record<string, { name: string; revenue: number; quantity: number }> = {}
    transactions.forEach(t => {
      const rawItems = t.items
      let parsedItems: any
      try {
        parsedItems = typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems
      } catch {
        parsedItems = []
      }
      const items: Array<{ name: string; price: number; quantity: number }> =
        Array.isArray(parsedItems) ? parsedItems : []
      items.forEach(item => {
        if (!item || !item.name) return
        if (!itemMap[item.name]) {
          itemMap[item.name] = { name: item.name, revenue: 0, quantity: 0 }
        }
        itemMap[item.name].revenue += (item.price || 0) * (item.quantity || 0)
        itemMap[item.name].quantity += item.quantity || 0
      })
    })
    return Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(item => ({
        name: item.name,
        'Jumlah Jualan (RM)': Number(item.revenue.toFixed(2))
      }))
  }, [transactions])

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
        <h1 className="text-3xl font-bold text-gray-900">Analitik Perniagaan</h1>
        <p className="text-gray-500 mt-1">Data dan statistik untuk keputusan perniagaan yang bijak</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="balance">Lembaran Imbangan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Date Range Picker */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Pilih Tempoh</h3>
              <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Dari Tarikh</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Hingga Tarikh</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleDateChange} className="w-full md:w-auto">
                    Tukar
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setQuickRange('today')}>
                  Hari Ini
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickRange('7days')}>
                  7 Hari Lalu
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickRange('30days')}>
                  30 Hari Lalu
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickRange('month')}>
                  Bulan Ini
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 5 Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Jumlah Jualan</p>
                    <p className="text-xl font-bold mt-1">RM {totalSales.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Jumlah Perbelanjaan</p>
                    <p className="text-xl font-bold mt-1">RM {totalExpenses.toFixed(2)}</p>
                  </div>
                  <Receipt className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Untung Bersih</p>
                    <p className={`text-xl font-bold mt-1 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      RM {netProfit.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Bilangan Transaksi</p>
                    <p className="text-xl font-bold mt-1">{totalTransactions}</p>
                  </div>
                  <ArrowRightLeft className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Purata Pesanan</p>
                    <p className="text-xl font-bold mt-1">RM {averageOrder.toFixed(2)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-teal-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Selling Items Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Item Menu Paling Menguntungkan</CardTitle>
            </CardHeader>
            <CardContent>
              {topItemsChart.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Tiada data untuk tempoh ini</p>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topItemsChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Jumlah Jualan (RM)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pilih Bulan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Select value={balanceSheetMonth.toString()} onValueChange={(v) => setBalanceSheetMonth(parseInt(v))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(2024, month - 1).toLocaleDateString('ms-MY', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={balanceSheetYear.toString()} onValueChange={(v) => setBalanceSheetYear(parseInt(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <BalanceSheet year={balanceSheetYear} month={balanceSheetMonth} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
