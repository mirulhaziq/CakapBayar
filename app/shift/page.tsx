'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Clock, DollarSign, TrendingUp, Receipt, ArrowRightLeft } from 'lucide-react'
import { getActiveShift, openShift, closeShift, getShiftHistory } from '@/lib/actions/shifts'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function ShiftPage() {
  const [activeShift, setActiveShift] = useState<any>(null)
  const [shiftHistory, setShiftHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialogVisible, setOpenDialogVisible] = useState(false)
  const [closeDialogVisible, setCloseDialogVisible] = useState(false)
  const [openingCash, setOpeningCash] = useState('')
  const [closingCash, setClosingCash] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [shift, history] = await Promise.all([
      getActiveShift(),
      getShiftHistory(20)
    ])
    setActiveShift(shift)
    setShiftHistory(history)
    setLoading(false)
  }

  async function handleOpenShift() {
    if (!openingCash) {
      toast.error('Sila masukkan jumlah tunai permulaan')
      return
    }

    const result = await openShift(parseFloat(openingCash))
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Shift berjaya dibuka')
      setOpenDialogVisible(false)
      setOpeningCash('')
      loadData()
    }
  }

  async function handleCloseShift() {
    if (!closingCash || !activeShift) {
      toast.error('Sila masukkan jumlah tunai penutupan')
      return
    }

    const result = await closeShift(activeShift.id, parseFloat(closingCash), notes)
    if (result.error) {
      toast.error(result.error)
    } else {
      const diff = result.cashDifference || 0
      if (Math.abs(diff) > 0.01) {
        toast.warning(`Shift ditutup. Perbezaan tunai: RM ${diff.toFixed(2)}`)
      } else {
        toast.success('Shift berjaya ditutup')
      }
      setCloseDialogVisible(false)
      setClosingCash('')
      setNotes('')
      loadData()
    }
  }

  // Active shift calculations
  const totalSales = useMemo(() =>
    activeShift?.transactions?.reduce((sum: number, t: any) => sum + Number(t.total), 0) || 0,
    [activeShift]
  )

  const totalExpenses = useMemo(() =>
    activeShift?.expenses?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0,
    [activeShift]
  )

  const netProfit = totalSales - totalExpenses
  const transactionCount = activeShift?.transactions?.length || 0

  // Payment breakdown
  const paymentBreakdown = useMemo(() => {
    if (!activeShift?.transactions) return []
    const methods: Record<string, number> = { 'Tunai': 0, 'Kad': 0, 'E-Wallet': 0, 'QR Pay': 0 }
    activeShift.transactions.forEach((t: any) => {
      const method = t.paymentMethod as string
      if (methods[method] !== undefined) {
        methods[method] += Number(t.total)
      }
    })
    const total = Object.values(methods).reduce((a, b) => a + b, 0)
    return Object.entries(methods).map(([method, amount]) => ({
      method,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0
    }))
  }, [activeShift])

  const cashSales = paymentBreakdown.find(p => p.method === 'Tunai')?.amount || 0
  const expectedCash = activeShift ? Number(activeShift.openingCash) + cashSales - totalExpenses : 0

  const paymentBarColors: Record<string, string> = {
    'Tunai': 'bg-blue-500',
    'Kad': 'bg-blue-600',
    'E-Wallet': 'bg-blue-400',
    'QR Pay': 'bg-blue-300',
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
          <h1 className="text-3xl font-bold text-gray-900">Shift</h1>
        </div>
        {activeShift ? (
          <span className="px-3 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full border border-green-200 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Shift Aktif
          </span>
        ) : (
          <Button onClick={() => setOpenDialogVisible(true)}>
            <Clock className="mr-2 h-4 w-4" />
            Buka Shift
          </Button>
        )}
      </div>

      {/* Active Shift Banner */}
      {activeShift ? (
        <>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Shift Dibuka</p>
                <p className="text-2xl font-bold mt-1">
                  {format(new Date(activeShift.openedAt), 'dd MMMM yyyy, hh:mm a')}
                </p>
                <div className="flex gap-8 mt-4">
                  <div>
                    <p className="text-green-100 text-xs">Wang Permulaan</p>
                    <p className="font-bold text-lg">RM {Number(activeShift.openingCash).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-green-100 text-xs">Transaksi</p>
                    <p className="font-bold text-lg">{transactionCount}</p>
                  </div>
                  <div>
                    <p className="text-green-100 text-xs">Jualan</p>
                    <p className="font-bold text-lg">RM {totalSales.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setCloseDialogVisible(true)}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                Tutup Shift
              </Button>
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Jualan</p>
                    <p className="text-2xl font-bold">RM {totalSales.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Untung</p>
                    <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                    <p className="text-xs text-gray-500">Transaksi</p>
                    <p className="text-2xl font-bold">{transactionCount}</p>
                  </div>
                  <ArrowRightLeft className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Perbelanjaan</p>
                    <p className="text-2xl font-bold text-red-600">RM {totalExpenses.toFixed(2)}</p>
                  </div>
                  <Receipt className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Pecahan Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentBreakdown.map(pb => (
                  <div key={pb.method} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span>{pb.method}</span>
                      <span className="font-medium">
                        RM {pb.amount.toFixed(2)} ({pb.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${paymentBarColors[pb.method] || 'bg-blue-500'}`}
                        style={{ width: `${pb.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Clock className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Tiada Shift Aktif</h3>
              <p className="text-gray-500 mb-6">
                Sila buka shift baru untuk mula merekod transaksi
              </p>
              <Button onClick={() => setOpenDialogVisible(true)}>
                <Clock className="mr-2 h-4 w-4" />
                Buka Shift Baru
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shift History */}
      <Card>
        <CardHeader>
          <CardTitle>Shift Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          {shiftHistory.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Tiada sejarah shift</p>
          ) : (
            <div className="space-y-4">
              {shiftHistory.map(shift => {
                const shiftSales = shift.transactions?.reduce((sum: number, t: any) => sum + Number(t.total), 0) || 0
                const shiftExpenses = shift.expenses?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0
                const shiftProfit = shiftSales - shiftExpenses

                return (
                  <div key={shift.id} className="border rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {format(new Date(shift.openedAt), 'EEEE, dd MMMM yyyy')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(shift.openedAt), 'hh:mm a')} - {shift.closedAt ? format(new Date(shift.closedAt), 'hh:mm a') : 'Aktif'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {shift.transactions?.length || 0} transaksi
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">RM {shiftSales.toFixed(2)}</p>
                        <p className="text-sm text-green-600">+RM {shiftSales.toFixed(2)}</p>
                        {shiftExpenses > 0 && (
                          <p className="text-sm text-red-600">-RM {shiftExpenses.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                    {shift.notes && (
                      <p className="text-sm text-gray-600 mt-3 pt-3 border-t">Nota: {shift.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Shift Dialog */}
      <Dialog open={openDialogVisible} onOpenChange={setOpenDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buka Shift Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tunai Permulaan (RM)</Label>
              <Input
                type="number"
                step="0.01"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-sm text-gray-500 mt-1">
                Masukkan jumlah tunai di dalam laci daftar
              </p>
            </div>
            <Button onClick={handleOpenShift} className="w-full">
              Buka Shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Shift Dialog */}
      <Dialog open={closeDialogVisible} onOpenChange={setCloseDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tutup Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">Tunai dijangka dalam laci:</p>
              <p className="text-2xl font-bold text-blue-600">
                RM {expectedCash.toFixed(2)}
              </p>
            </div>
            <div>
              <Label>Tunai Sebenar (RM)</Label>
              <Input
                type="number"
                step="0.01"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-sm text-gray-500 mt-1">
                Kira tunai fizikal di dalam laci daftar
              </p>
            </div>
            {closingCash && (
              <div className={`p-4 rounded-lg ${
                Math.abs(parseFloat(closingCash) - expectedCash) < 0.01
                  ? 'bg-green-50'
                  : 'bg-yellow-50'
              }`}>
                <p className="text-sm text-gray-700">Perbezaan:</p>
                <p className={`text-xl font-bold ${
                  Math.abs(parseFloat(closingCash) - expectedCash) < 0.01
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }`}>
                  RM {(parseFloat(closingCash) - expectedCash).toFixed(2)}
                </p>
              </div>
            )}
            <div>
              <Label>Nota (Opsional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan"
              />
            </div>
            <Button onClick={handleCloseShift} className="w-full">
              Tutup Shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
