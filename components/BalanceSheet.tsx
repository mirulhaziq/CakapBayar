'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { getBalanceSheet } from '@/lib/actions/balanceSheet'
import { exportBalanceSheetToPDF, exportBalanceSheetToExcel } from '@/lib/utils/export'
import type { BalanceSheetData } from '@/lib/types/balanceSheet'
import { format } from 'date-fns'

interface BalanceSheetProps {
  year: number
  month: number
}

export default function BalanceSheet({ year, month }: BalanceSheetProps) {
  const [data, setData] = useState<BalanceSheetData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBalanceSheet()
  }, [year, month])

  async function loadBalanceSheet() {
    setLoading(true)
    const result = await getBalanceSheet(year, month)
    setData(result)
    setLoading(false)
  }

  function handleExportPDF() {
    if (data) {
      exportBalanceSheetToPDF(data, `lembaran-imbangan-${year}-${month}`)
    }
  }

  function handleExportExcel() {
    if (data) {
      exportBalanceSheetToExcel(data, `lembaran-imbangan-${year}-${month}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-500">Tiada data untuk bulan ini</p>
      </div>
    )
  }

  const asOfDate = format(new Date(data.period.asOfDate), 'dd MMMM yyyy')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Lembaran Imbangan</h2>
          <p className="text-gray-500">
            As of {asOfDate}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Eksport PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Eksport Excel
          </Button>
        </div>
      </div>

      {/* Balance Verification */}
      {data.balances ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Lembaran Imbangan Seimbang</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Aset (RM {data.assets.total.toFixed(2)}) = Liabiliti (RM {data.liabilities.total.toFixed(2)}) + Ekuiti (RM {data.equity.total.toFixed(2)})
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Lembaran Imbangan Tidak Seimbang</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              Perbezaan: RM {Math.abs(data.difference).toFixed(2)}. Sila semak pengiraan.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Explanation Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Apa itu Lembaran Imbangan?</p>
              <p>Lembaran Imbangan menunjukkan kedudukan kewangan perniagaan anda pada satu tarikh tertentu. Ia menunjukkan apa yang anda miliki (Aset), apa yang anda hutang (Liabiliti), dan nilai pemilikan anda (Ekuiti). Formula asas: <strong>Aset = Liabiliti + Ekuiti</strong></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Sheet */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">ASET</CardTitle>
            <p className="text-xs text-gray-500 mt-1">Apa yang anda miliki</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 text-sm">Aset Semasa</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tunai</span>
                  <span className="font-medium">RM {data.assets.current.cash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Akaun Belum Terima</span>
                  <span className="font-medium">RM {data.assets.current.accountsReceivable.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Inventori</span>
                  <span className="font-medium">RM {data.assets.current.inventory.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                  <span>Jumlah Aset Semasa</span>
                  <span>RM {data.assets.current.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            {data.assets.nonCurrent.total > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-sm">Aset Bukan Semasa</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Peralatan</span>
                    <span className="font-medium">RM {data.assets.nonCurrent.equipment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Harta</span>
                    <span className="font-medium">RM {data.assets.nonCurrent.property.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                    <span>Jumlah Aset Bukan Semasa</span>
                    <span>RM {data.assets.nonCurrent.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-4">
              <span>JUMLAH ASET</span>
              <span className="text-green-600">RM {data.assets.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Liabilities & Equity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">LIABILITI & EKUITI</CardTitle>
            <p className="text-xs text-gray-500 mt-1">Apa yang anda hutang + nilai pemilikan</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 text-sm">Liabiliti Semasa</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Akaun Belum Bayar</span>
                  <span className="font-medium">RM {data.liabilities.current.accountsPayable.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pinjaman Jangka Pendek</span>
                  <span className="font-medium">RM {data.liabilities.current.shortTermLoans.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                  <span>Jumlah Liabiliti Semasa</span>
                  <span>RM {data.liabilities.current.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            {data.liabilities.nonCurrent.total > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-sm">Liabiliti Bukan Semasa</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Pinjaman Jangka Panjang</span>
                    <span className="font-medium">RM {data.liabilities.nonCurrent.longTermLoans.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                    <span>Jumlah Liabiliti Bukan Semasa</span>
                    <span>RM {data.liabilities.nonCurrent.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>JUMLAH LIABILITI</span>
              <span>RM {data.liabilities.total.toFixed(2)}</span>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-sm">Ekuiti</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Modal Permulaan</span>
                  <span className="font-medium">RM {data.equity.openingCapital.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">(Modal awal anda)</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span>Pendapatan Tertahan</span>
                  <span className={`font-medium ${data.equity.retainedEarnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    RM {data.equity.retainedEarnings.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">(Keuntungan terkumpul semua masa)</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                  <span>Jumlah Ekuiti</span>
                  <span>RM {data.equity.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-4">
              <span>JUMLAH LIABILITI & EKUITI</span>
              <span className="text-red-600">
                RM {(data.liabilities.total + data.equity.total).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Statement (Separate Section) */}
      <Card>
        <CardHeader>
          <CardTitle>PENDAPATAN & PERBELANJAAN</CardTitle>
          <p className="text-xs text-gray-500 mt-1">Penyata Pendapatan untuk bulan {month}/{year}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Revenue */}
          <div>
            <h3 className="font-semibold mb-2 text-sm">Hasil (Revenue)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Jualan Tunai</span>
                <span className="font-medium">RM {data.incomeStatement.revenue.byPaymentMethod['Tunai']?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Jualan Kad</span>
                <span className="font-medium">RM {data.incomeStatement.revenue.byPaymentMethod['Kad']?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Jualan E-Wallet</span>
                <span className="font-medium">RM {data.incomeStatement.revenue.byPaymentMethod['E-Wallet']?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Jualan QR Pay</span>
                <span className="font-medium">RM {data.incomeStatement.revenue.byPaymentMethod['QR Pay']?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                <span>Jumlah Hasil</span>
                <span className="text-green-600">RM {data.incomeStatement.revenue.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div>
            <h3 className="font-semibold mb-2 text-sm">Perbelanjaan (Expenses)</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(data.incomeStatement.expenses.byCategory).length > 0 ? (
                Object.entries(data.incomeStatement.expenses.byCategory).map(([category, amount]) => (
                  <div key={category} className="flex justify-between">
                    <span>{category}</span>
                    <span className="font-medium">RM {amount.toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-sm">Tiada perbelanjaan untuk bulan ini</div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                <span>Jumlah Perbelanjaan</span>
                <span className="text-red-600">RM {data.incomeStatement.expenses.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Net Income */}
          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>PENDAPATAN BERSIH (Net Income)</span>
              <span className={data.incomeStatement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                RM {data.incomeStatement.netIncome.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Untung/rugi untuk bulan ini sahaja (bukan kumulatif)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>RINGKASAN</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Jumlah Transaksi</p>
              <p className="text-2xl font-bold">{data.transactionCount}</p>
            </div>
            <div>
              <p className="text-gray-500">Margin Keuntungan</p>
              <p className="text-2xl font-bold">
                {data.incomeStatement.revenue.total > 0 
                  ? ((data.incomeStatement.netIncome / data.incomeStatement.revenue.total) * 100).toFixed(1) 
                  : '0.0'}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
