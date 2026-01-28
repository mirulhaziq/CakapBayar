'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Download, Trash2 } from 'lucide-react'
import { getExpenses, createExpense, deleteExpense, getExpenseCategories } from '@/lib/actions/expenses'
import { exportExpensesToPDF } from '@/lib/utils/export'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Expense {
  id: number
  amount: number
  category: string
  description?: string
  expenseDate: Date
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
    const [expensesData, categoriesData] = await Promise.all([
      getExpenses(100),
      getExpenseCategories()
    ])
    setExpenses(expensesData as any)
    setCategories(categoriesData)
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
    if (!confirm('Adakah anda pasti untuk memadam perbelanjaan ini?')) {
      return
    }

    const result = await deleteExpense(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Perbelanjaan berjaya dipadam')
      loadData()
    }
  }

  function handleExport() {
    if (expenses.length === 0) {
      toast.error('Tiada perbelanjaan untuk dieksport')
      return
    }

    const today = format(new Date(), 'yyyy-MM-dd')
    exportExpensesToPDF(expenses, `perbelanjaan-${today}`)
    toast.success('Perbelanjaan berjaya dieksport')
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

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
          <h1 className="text-3xl font-bold text-gray-900">Perbelanjaan</h1>
          <p className="text-gray-500 mt-1">Rekod dan pantau perbelanjaan</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Eksport
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Perbelanjaan
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jumlah Perbelanjaan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-red-600">
            RM {totalExpenses.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      {expenses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">Tiada perbelanjaan dijumpai</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {expenses.map(expense => (
            <Card key={expense.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-lg">{expense.category}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(expense.expenseDate), 'dd MMM yyyy, HH:mm')}
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-red-600">
                        RM {Number(expense.amount).toFixed(2)}
                      </p>
                    </div>
                    {expense.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {expense.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(expense.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
