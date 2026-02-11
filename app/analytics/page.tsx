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
import { 
  getDailySummaries, 
  getPaymentMethodBreakdown, 
  getExpenseBreakdown,
  getTodaySummary 
} from '@/lib/actions/analytics'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
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
  const [dailySummaries, setDailySummaries] = useState<any[]>([])
  const [paymentBreakdown, setPaymentBreakdown] = useState<Record<string, number>>({})
  const [expenseBreakdown, setExpenseBreakdown] = useState<Record<string, number>>({})
  const [todaySummary, setTodaySummary] = useState<any>(null)
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
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 30

      const [txData, expData, summaries, payments, expensesByCat, today] = await Promise.all([
        getTransactionsByDateRange(start, end),
        getExpensesByDateRange(start, end),
        getDailySummaries(Math.min(daysDiff, 30)),
        getPaymentMethodBreakdown(daysDiff),
        getExpenseBreakdown(daysDiff),
        getTodaySummary(),
      ])

      setTransactions(Array.isArray(txData) ? txData as any : [])
      setExpenses(Array.isArray(expData) ? expData as any : [])
      setDailySummaries(Array.isArray(summaries) ? summaries as any : [])
      setPaymentBreakdown(payments || {})
      setExpenseBreakdown(expensesByCat || {})
      setTodaySummary(today)
    } catch (error) {
      console.error('Error loading analytics:', error)
      setTransactions([])
      setExpenses([])
      setDailySummaries([])
      setPaymentBreakdown({})
      setExpenseBreakdown({})
      setTodaySummary(null)
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

  // Chart data - top selling items by revenue (enhanced with quantity)
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
        'Jumlah Jualan (RM)': Number(item.revenue.toFixed(2)),
        'Kuantiti': item.quantity
      }))
  }, [transactions])

  // Sales trend chart data
  const salesTrendData = useMemo(() => {
    return dailySummaries.map(s => ({
      date: format(new Date(s.summaryDate + 'T00:00:00'), 'dd/MM'),
      'Jualan (RM)': Number(s.totalSales || 0),
      'Perbelanjaan (RM)': Number(s.totalExpenses || 0),
      'Untung (RM)': Number(s.netProfit || 0)
    }))
  }, [dailySummaries])

  // Payment methods pie chart data
  const paymentPieData = useMemo(() => {
    const colors = { Tunai: '#10b981', Kad: '#f59e0b', 'E-Wallet': '#8b5cf6', 'QR Pay': '#3b82f6' }
    return Object.entries(paymentBreakdown)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
        color: colors[name as keyof typeof colors] || '#6b7280'
      }))
  }, [paymentBreakdown])

  // Expense categories pie chart data
  const expensePieData = useMemo(() => {
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
      '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6'
    ]
    const entries = Object.entries(expenseBreakdown)
      .filter(([_, value]) => value > 0)
      .map(([name, value], idx) => ({
        name,
        value: Number(value.toFixed(2)),
        color: colors[idx % colors.length]
      }))
    return entries.sort((a, b) => b.value - a.value)
  }, [expenseBreakdown])

  // Day-to-day comparison data
  const dayComparisonData = useMemo(() => {
    if (!todaySummary) return []
    
    const today = new Date()
    const yesterday = subDays(today, 1)
    const lastWeek = subDays(today, 7)
    
    // Get yesterday and last week summaries from dailySummaries
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd')
    const lastWeekStr = format(lastWeek, 'yyyy-MM-dd')
    
    const yesterdayData = dailySummaries.find(s => s.summaryDate === yesterdayStr)
    const lastWeekData = dailySummaries.find(s => s.summaryDate === lastWeekStr)
    
    return [
      {
        hari: 'Hari Ini',
        'Jualan': Number(todaySummary.totalSales || 0),
        'Perbelanjaan': Number(todaySummary.totalExpenses || 0),
        'Untung': Number(todaySummary.netProfit || 0)
      },
      {
        hari: 'Semalam',
        'Jualan': Number(yesterdayData?.totalSales || 0),
        'Perbelanjaan': Number(yesterdayData?.totalExpenses || 0),
        'Untung': Number(yesterdayData?.netProfit || 0)
      },
      {
        hari: 'Minggu Lalu',
        'Jualan': Number(lastWeekData?.totalSales || 0),
        'Perbelanjaan': Number(lastWeekData?.totalExpenses || 0),
        'Untung': Number(lastWeekData?.netProfit || 0)
      }
    ]
  }, [todaySummary, dailySummaries])

  // Cash flow area chart data
  const cashFlowData = useMemo(() => {
    return dailySummaries.map(s => ({
      date: format(new Date(s.summaryDate + 'T00:00:00'), 'dd/MM'),
      'Wang Masuk (RM)': Number(s.totalSales || 0),
      'Wang Keluar (RM)': Number(s.totalExpenses || 0)
    }))
  }, [dailySummaries])

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
          <TabsTrigger value="charts">Graf</TabsTrigger>
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

          {/* Top Selling Items Chart - Enhanced */}
          <Card>
            <CardHeader>
              <CardTitle>Item Menu Paling Menguntungkan</CardTitle>
              <p className="text-sm text-gray-500">Menunjukkan jumlah jualan dan kuantiti terjual</p>
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
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="Jumlah Jualan (RM)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="Kuantiti" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          {/* Sales Trend Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Jualan Mengikut Masa</CardTitle>
              <p className="text-sm text-gray-500">Perkembangan jualan, perbelanjaan, dan untung dari masa ke masa</p>
            </CardHeader>
            <CardContent>
              {salesTrendData.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Tiada data untuk tempoh ini</p>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={salesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Jualan (RM)" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="Perbelanjaan (RM)" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="Untung (RM)" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Kaedah Pembayaran</CardTitle>
              <p className="text-sm text-gray-500">Perbandingan kaedah pembayaran yang digunakan pelanggan</p>
            </CardHeader>
            <CardContent>
              {paymentPieData.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Tiada data untuk tempoh ini</p>
              ) : (
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `RM ${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {paymentPieData.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: entry.color }} />
                        <span className="text-sm">{entry.name}: RM {entry.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Categories Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Kategori Perbelanjaan</CardTitle>
              <p className="text-sm text-gray-500">Perbelanjaan mengikut kategori untuk memahami di mana wang dibelanjakan</p>
            </CardHeader>
            <CardContent>
              {expensePieData.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Tiada perbelanjaan untuk tempoh ini</p>
              ) : (
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `RM ${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {expensePieData.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: entry.color }} />
                        <span className="text-sm">{entry.name}: RM {entry.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Day-to-Day Comparison Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Perbandingan Hari ke Hari</CardTitle>
              <p className="text-sm text-gray-500">Bandingkan prestasi hari ini dengan semalam dan minggu lalu</p>
            </CardHeader>
            <CardContent>
              {dayComparisonData.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Tiada data untuk perbandingan</p>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dayComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hari" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Jualan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Perbelanjaan" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Untung" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Cash Flow Area Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Aliran Tunai</CardTitle>
              <p className="text-sm text-gray-500">Visualisasi wang masuk (jualan) vs wang keluar (perbelanjaan)</p>
            </CardHeader>
            <CardContent>
              {cashFlowData.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Tiada data untuk tempoh ini</p>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={cashFlowData}>
                    <defs>
                      <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorKeluar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="Wang Masuk (RM)" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorMasuk)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Wang Keluar (RM)" 
                      stroke="#ef4444" 
                      fillOpacity={1} 
                      fill="url(#colorKeluar)" 
                    />
                  </AreaChart>
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
