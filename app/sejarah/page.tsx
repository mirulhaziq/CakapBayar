'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Trash2 } from 'lucide-react'
import { getTransactions, deleteTransaction } from '@/lib/actions/transactions'
import { exportTransactionsToPDF } from '@/lib/utils/export'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Transaction {
  id: number
  items: any[]
  total: number
  paymentMethod: string
  transactionDate: Date
  notes?: string
}

export default function SejarahPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTransactions()
  }, [])

  async function loadTransactions() {
    setLoading(true)
    const data = await getTransactions(100)
    setTransactions(data as any)
    setLoading(false)
  }

  async function handleDelete(id: number) {
    if (!confirm('Adakah anda pasti untuk memadam transaksi ini?')) {
      return
    }

    const result = await deleteTransaction(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Transaksi berjaya dipadam')
      loadTransactions()
    }
  }

  function handleExport() {
    if (transactions.length === 0) {
      toast.error('Tiada transaksi untuk dieksport')
      return
    }

    const today = format(new Date(), 'yyyy-MM-dd')
    exportTransactionsToPDF(transactions, `transaksi-${today}`)
    toast.success('Transaksi berjaya dieksport')
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sejarah Transaksi</h1>
          <p className="text-gray-500 mt-1">Lihat semua transaksi lepas</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Eksport PDF
        </Button>
      </div>

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">Tiada transaksi dijumpai</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map(transaction => (
            <Card key={transaction.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm text-gray-500">
                          {format(new Date(transaction.transactionDate), 'dd MMM yyyy, HH:mm')}
                        </p>
                        <p className="text-xs text-gray-400">#{transaction.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          RM {Number(transaction.total).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">{transaction.paymentMethod}</p>
                      </div>
                    </div>

                    <div className="space-y-1 mt-4">
                      {(transaction.items as Array<{ name: string; quantity: number; price: number }>).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span>RM {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {transaction.notes && (
                      <p className="text-sm text-gray-500 mt-2">
                        Nota: {transaction.notes}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(transaction.id)}
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
