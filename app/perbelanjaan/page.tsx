'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Receipt } from 'lucide-react'
import { getExpenses, createExpense, deleteExpense, getExpenseCategories } from '@/lib/actions/expenses'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Expense {
  id: number
  amount: number
  category: string
  description?: string
  expenseDate: string | Date
}

export default function PerbelanjaanPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    amount: '',
    category: 'Bahan Mentah',
    description: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [expensesData, categoriesData] = await Promise.all([
        getExpenses(100),
        getExpenseCategories()
      ])
      setExpenses(Array.isArray(expensesData) ? expensesData as any : [])
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (error) {
      console.error('Error loading perbelanjaan data:', error)
      setExpenses([])
      setCategories([])
    }
    setLoading(false)
  }

  async function handleSubmit() {
    if (!formData.amount) {
      toast.error('Sila masukkan jumlah perbelanjaan')
      return
    }

    const result = await createExpense({
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Perbelanjaan berjaya ditambah')
      setIsDialogOpen(false)
      setFormData({ amount: '', category: 'Bahan Mentah', description: '' })
      loadData()
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Adakah anda pasti untuk memadam perbelanjaan ini?')) return

    const result = await deleteExpense(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Perbelanjaan berjaya dipadam')
      loadData()
    }
  }

  // Today's expenses
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayExpenses = useMemo(() =>
    expenses.filter(e => {
      const expDate = format(new Date(e.expenseDate), 'yyyy-MM-dd')
      return expDate === todayStr
    }),
    [expenses, todayStr]
  )

  const totalToday = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  // Group by category
  const categoryTotals = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {}
    todayExpenses.forEach(e => {
      if (!map[e.category]) map[e.category] = { total: 0, count: 0 }
      map[e.category].total += Number(e.amount)
      map[e.category].count += 1
    })
    return map
  }, [todayExpenses])

  const categoryColors: Record<string, string> = {
    'Bahan Mentah': 'bg-orange-100 text-orange-700',
    'Gaji': 'bg-blue-100 text-blue-700',
    'Sewa': 'bg-purple-100 text-purple-700',
    'Utiliti': 'bg-yellow-100 text-yellow-700',
    'Pengangkutan': 'bg-green-100 text-green-700',
    'Penyelenggaraan': 'bg-teal-100 text-teal-700',
    'Pemasaran': 'bg-pink-100 text-pink-700',
    'Lain-lain': 'bg-gray-100 text-gray-700',
  }

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
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">Pengurusan</p>
          <h1 className="text-3xl font-bold text-gray-900">Perbelanjaan</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Perbelanjaan Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Jumlah (RM)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Kategori</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Penerangan (Opsional)</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Butiran perbelanjaan"
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                Tambah
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Total Banner */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-red-100">Jumlah Perbelanjaan Hari Ini</p>
            <p className="text-3xl font-bold">RM {totalToday.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Category Summary Cards */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(categoryTotals).map(([category, data]) => (
            <Card key={category}>
              <CardContent className="pt-4 pb-3">
                <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full mb-2 ${categoryColors[category] || 'bg-gray-100 text-gray-700'}`}>
                  {category}
                </span>
                <p className="text-xl font-bold">RM {data.total.toFixed(2)}</p>
                <p className="text-xs text-gray-400">{data.count} item</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Expense List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Senarai Perbelanjaan</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Tiada perbelanjaan dijumpai</p>
          ) : (
            <div className="space-y-3">
              {expenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${categoryColors[expense.category] || 'bg-gray-100 text-gray-700'}`}>
                      {expense.category}
                    </span>
                    <div>
                      <p className="text-sm text-gray-500">
                        {format(new Date(expense.expenseDate), 'hh:mm a')}
                      </p>
                      {expense.description && (
                        <p className="text-sm text-gray-700">{expense.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-red-600">
                      -RM {Number(expense.amount).toFixed(2)}
                    </p>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
