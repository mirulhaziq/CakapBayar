'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { getBalanceSheet } from '@/lib/actions/balanceSheet'
import { exportBalanceSheetToPDF } from '@/lib/utils/export'
import type { BalanceSheetData } from '@/lib/types/balanceSheet'

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

  function handleExport() {
    if (data) {
      exportBalanceSheetToPDF(data, `lembaran-imbangan-${year}-${month}`)
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Lembaran Imbangan</h2>
          <p className="text-gray-500">
            Bulan {month}/{year}
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Eksport PDF
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">ASET</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Aset Semasa</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tunai</span>
                  <span>RM {data.assets.current.cash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Akaun Belum Terima</span>
                  <span>RM {data.assets.current.accountsReceivable.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Jumlah Aset Semasa</span>
                  <span>RM {data.assets.current.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Liabiliti Semasa</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Akaun Belum Bayar</span>
                  <span>RM {data.liabilities.current.accountsPayable.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Jumlah Liabiliti</span>
                  <span>RM {data.liabilities.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Ekuiti</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Pendapatan Tertahan</span>
                  <span>RM {data.equity.retainedEarnings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
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

      {/* Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>HASIL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Jualan Tunai</span>
              <span>RM {data.revenue.sales.cash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Jualan Kad</span>
              <span>RM {data.revenue.sales.card.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Jualan E-Wallet</span>
              <span>RM {data.revenue.sales.ewallet.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Jualan QR Pay</span>
              <span>RM {data.revenue.sales.qr.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2 text-lg">
              <span>JUMLAH HASIL</span>
              <span className="text-green-600">RM {data.revenue.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>PERBELANJAAN</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {Object.entries(data.expenses.byCategory).map(([category, amount]) => (
              <div key={category} className="flex justify-between">
                <span>{category}</span>
                <span>RM {amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold border-t pt-2 text-lg">
              <span>JUMLAH PERBELANJAAN</span>
              <span className="text-red-600">RM {data.expenses.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net Income */}
      <Card>
        <CardHeader>
          <CardTitle>PENDAPATAN BERSIH</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Jumlah Hasil</span>
              <span>RM {data.revenue.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Jumlah Perbelanjaan</span>
              <span>RM {data.expenses.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2 text-2xl">
              <span>PENDAPATAN BERSIH</span>
              <span className={data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                RM {data.netIncome.toFixed(2)}
              </span>
            </div>
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
                {((data.netIncome / data.revenue.total) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
