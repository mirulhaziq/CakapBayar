'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import BalanceSheet from '@/components/BalanceSheet'
import { getDailySummaries, getTopSellingItems, getPaymentMethodBreakdown, getExpenseBreakdown } from '@/lib/actions/analytics'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag } from 'lucide-react'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function AnalyticsPage() {
  const [summaries, setSummaries] = useState<any[]>([])
  const [topItems, setTopItems] = useState<any[]>([])
  const [paymentBreakdown, setPaymentBreakdown] = useState<any>({})
  const [expenseBreakdown, setExpenseBreakdown] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7')
  const [balanceSheetMonth, setBalanceSheetMonth] = useState(new Date().getMonth() + 1)
  const [balanceSheetYear, setBalanceSheetYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadAnalytics()
  }, [period])

  async function loadAnalytics() {
    setLoading(true)
    const days = parseInt(period)
    const [summariesData, topItemsData, paymentData, expenseData] = await Promise.all([
      getDailySummaries(days),
      getTopSellingItems(days),
      getPaymentMethodBreakdown(days),
      getExpenseBreakdown(days)
    ])
    
    setSummaries(summariesData)
    setTopItems(topItemsData)
    setPaymentBreakdown(paymentData)
    setExpenseBreakdown(expenseData)
    setLoading(false)
  }

  const totalSales = summaries.reduce((sum, s) => sum + Number(s.totalSales), 0)
  const totalExpenses = summaries.reduce((sum, s) => sum + Number(s.totalExpenses), 0)
  const netProfit = totalSales - totalExpenses
  const totalTransactions = summaries.reduce((sum, s) => sum + s.transactionCount, 0)

  const salesChartData = summaries.map(s => ({
    date: new Date(s.summaryDate).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short' }),
    sales: Number(s.totalSales),
    expenses: Number(s.totalExpenses),
    profit: Number(s.netProfit)
  }))

  const paymentChartData = Object.entries(paymentBreakdown).map(([method, amount]) => ({
    method,
    amount: Number(amount)
  }))

  const expenseChartData = Object.entries(expenseBreakdown).map(([category, amount]) => ({
    category,
    amount: Number(amount)
  }))

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analitik & Laporan</h1>
          <p className="text-gray-500 mt-1">Lihat prestasi perniagaan anda</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 Hari</SelectItem>
            <SelectItem value="14">14 Hari</SelectItem>
            <SelectItem value="30">30 Hari</SelectItem>
            <SelectItem value="90">90 Hari</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="sales">Jualan</TabsTrigger>
          <TabsTrigger value="expenses">Perbelanjaan</TabsTrigger>
          <TabsTrigger value="balance">Lembaran Imbangan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Jumlah Jualan
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  RM {totalSales.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Untung Bersih
                </CardTitle>
                {netProfit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  RM {netProfit.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Perbelanjaan
                </CardTitle>
                <DollarSign className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  RM {totalExpenses.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Transaksi
                </CardTitle>
                <ShoppingBag className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {totalTransactions}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trend Jualan & Untung</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#10B981" name="Jualan" />
                  <Line type="monotone" dataKey="profit" stroke="#3B82F6" name="Untung" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Item Terlaris</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topItems.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-400">{index + 1}</span>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{item.quantity} unit</p>
                        <p className="text-xs text-gray-500">RM {item.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kaedah Bayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      dataKey="amount"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trend Jualan Harian</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#10B981" name="Jualan" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pecahan Kaedah Bayaran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentChartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span>{item.method}</span>
                    <span className="font-bold">RM {item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Perbelanjaan Mengikut Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={expenseChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#EF4444" name="Jumlah (RM)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Perbelanjaan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenseChartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span>{item.category}</span>
                    <span className="font-bold text-red-600">RM {item.amount.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-2 border-red-200">
                  <span className="font-bold">JUMLAH</span>
                  <span className="font-bold text-red-600">RM {totalExpenses.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pilih Bulan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
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
