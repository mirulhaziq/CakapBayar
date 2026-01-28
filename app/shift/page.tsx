'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  const totalSales = activeShift?.transactions?.reduce((sum: number, t: any) => sum + Number(t.total), 0) || 0
  const totalExpenses = activeShift?.expenses?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0
  const cashSales = activeShift?.transactions?.filter((t: any) => t.paymentMethod === 'Tunai').reduce((sum: number, t: any) => sum + Number(t.total), 0) || 0
  const expectedCash = activeShift ? Number(activeShift.openingCash) + cashSales - totalExpenses : 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pengurusan Shift</h1>
          <p className="text-gray-500 mt-1">Pantau shift dan tunai harian</p>
        </div>
        {!activeShift && (
          <Button onClick={() => setOpenDialogVisible(true)}>
            <Clock className="mr-2 h-4 w-4" />
            Buka Shift
          </Button>
        )}
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current">Shift Semasa</TabsTrigger>
          <TabsTrigger value="history">Sejarah</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {activeShift ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Tunai Permulaan
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      RM {Number(activeShift.openingCash).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Jualan Tunai
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      RM {cashSales.toFixed(2)}
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
                      Tunai Dijangka
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      RM {expectedCash.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Maklumat Shift</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dibuka pada</span>
                    <span className="font-medium">
                      {format(new Date(activeShift.openedAt), 'dd MMM yyyy, HH:mm')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jumlah Transaksi</span>
                    <span className="font-medium">{activeShift.transactions?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jumlah Jualan</span>
                    <span className="font-medium">RM {totalSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jumlah Perbelanjaan</span>
                    <span className="font-medium">RM {totalExpenses.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={() => setCloseDialogVisible(true)} 
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Tutup Shift
              </Button>
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
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {shiftHistory.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-gray-500">Tiada sejarah shift</p>
              </CardContent>
            </Card>
          ) : (
            shiftHistory.map(shift => {
              const shiftSales = shift.transactions?.reduce((sum: number, t: any) => sum + Number(t.total), 0) || 0
              const shiftExpenses = shift.expenses?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0
              
              return (
                <Card key={shift.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-semibold">
                              {format(new Date(shift.openedAt), 'dd MMM yyyy')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(shift.openedAt), 'HH:mm')} - {format(new Date(shift.closedAt), 'HH:mm')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              RM {shiftSales.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {shift.transactions?.length || 0} transaksi
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Tunai Mula</p>
                            <p className="font-medium">RM {Number(shift.openingCash).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Tunai Akhir</p>
                            <p className="font-medium">RM {Number(shift.closingCash).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Dijangka</p>
                            <p className="font-medium">RM {Number(shift.expectedCash).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Perbezaan</p>
                            <p className={`font-medium ${Number(shift.cashDifference) !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                              RM {Number(shift.cashDifference).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        
                        {shift.notes && (
                          <p className="text-sm text-gray-600 mt-3">Nota: {shift.notes}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>

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
              <div className={`p-4 rounded-lg ${Math.abs(parseFloat(closingCash) - expectedCash) < 0.01 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <p className="text-sm text-gray-700">Perbezaan:</p>
                <p className={`text-xl font-bold ${Math.abs(parseFloat(closingCash) - expectedCash) < 0.01 ? 'text-green-600' : 'text-yellow-600'}`}>
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
