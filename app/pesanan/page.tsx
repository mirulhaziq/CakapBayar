'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mic, Plus, Minus, Trash2, Check } from 'lucide-react'
import { getAvailableMenuItems } from '@/lib/actions/menu'
import { createTransaction } from '@/lib/actions/transactions'
import { toast } from 'sonner'

interface MenuItem {
  id: number
  name: string
  nameMalay: string
  price: number
  category: string
}

interface OrderItem {
  item: MenuItem
  quantity: number
}

export default function PesananPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [paymentReceived, setPaymentReceived] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  useEffect(() => {
    loadMenuItems()
  }, [])

  async function loadMenuItems() {
    const items = await getAvailableMenuItems()
    setMenuItems(items as any)
  }

  function addItem(item: MenuItem) {
    const existingItem = orderItems.find(oi => oi.item.id === item.id)
    if (existingItem) {
      setOrderItems(orderItems.map(oi =>
        oi.item.id === item.id ? { ...oi, quantity: oi.quantity + 1 } : oi
      ))
    } else {
      setOrderItems([...orderItems, { item, quantity: 1 }])
    }
  }

  function updateQuantity(itemId: number, quantity: number) {
    if (quantity === 0) {
      setOrderItems(orderItems.filter(oi => oi.item.id !== itemId))
    } else {
      setOrderItems(orderItems.map(oi =>
        oi.item.id === itemId ? { ...oi, quantity } : oi
      ))
    }
  }

  function removeItem(itemId: number) {
    setOrderItems(orderItems.filter(oi => oi.item.id !== itemId))
  }

  const subtotal = orderItems.reduce((sum, oi) => sum + (oi.item.price * oi.quantity), 0)
  const tax = 0 // No tax for now
  const total = subtotal + tax

  async function handleSubmit() {
    if (orderItems.length === 0) {
      toast.error('Sila tambah item ke pesanan')
      return
    }

    if (paymentMethod === 'Tunai' && !paymentReceived) {
      toast.error('Sila masukkan jumlah bayaran diterima')
      return
    }

    setIsLoading(true)

    const items = orderItems.map(oi => ({
      item_id: oi.item.id,
      name: oi.item.nameMalay,
      price: oi.item.price,
      quantity: oi.quantity
    }))

    const paymentRec = paymentMethod === 'Tunai' ? parseFloat(paymentReceived) : total
    const change = paymentMethod === 'Tunai' ? paymentRec - total : 0

    const result = await createTransaction({
      items,
      subtotal,
      tax,
      total,
      paymentMethod,
      paymentReceived: paymentRec,
      changeGiven: change
    })

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Pesanan berjaya disimpan!')
      setOrderItems([])
      setPaymentReceived('')
    }
  }

  async function handleVoiceOrder() {
    setIsRecording(true)
    toast.info('Fungsi suara akan tersedia tidak lama lagi')
    setTimeout(() => setIsRecording(false), 2000)
  }

  const categories = Array.from(new Set(menuItems.map(item => item.category)))

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pesanan Baru</h1>
          <p className="text-gray-500 mt-1">Rekod pesanan dengan suara atau manual</p>
        </div>
        <Button
          onClick={handleVoiceOrder}
          disabled={isRecording}
          className="bg-red-600 hover:bg-red-700"
        >
          <Mic className={`mr-2 h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
          {isRecording ? 'Merakam...' : 'Pesanan Suara'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {categories.map(category => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {menuItems
                    .filter(item => item.category === category)
                    .map(item => (
                      <button
                        key={item.id}
                        onClick={() => addItem(item)}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-left">
                          <p className="font-medium">{item.nameMalay}</p>
                          <p className="text-sm text-gray-500">RM {item.price.toFixed(2)}</p>
                        </div>
                        <Plus className="h-5 w-5 text-blue-600" />
                      </button>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Pesanan Semasa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderItems.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Tiada item dalam pesanan
                </p>
              ) : (
                <>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {orderItems.map(oi => (
                      <div key={oi.item.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{oi.item.nameMalay}</p>
                          <p className="text-xs text-gray-500">RM {oi.item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(oi.item.id, oi.quantity - 1)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{oi.quantity}</span>
                          <button
                            onClick={() => updateQuantity(oi.item.id, oi.quantity + 1)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeItem(oi.item.id)}
                            className="p-1 hover:bg-red-50 text-red-600 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subjumlah</span>
                      <span>RM {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cukai</span>
                      <span>RM {tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Jumlah</span>
                      <span>RM {total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Kaedah Bayaran</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tunai">Tunai</SelectItem>
                          <SelectItem value="Kad">Kad</SelectItem>
                          <SelectItem value="E-Wallet">E-Wallet</SelectItem>
                          <SelectItem value="QR Pay">QR Pay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {paymentMethod === 'Tunai' && (
                      <div>
                        <Label>Bayaran Diterima</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={paymentReceived}
                          onChange={(e) => setPaymentReceived(e.target.value)}
                          placeholder="0.00"
                        />
                        {paymentReceived && parseFloat(paymentReceived) >= total && (
                          <p className="text-sm text-green-600 mt-1">
                            Baki: RM {(parseFloat(paymentReceived) - total).toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {isLoading ? 'Menyimpan...' : 'Selesai Pesanan'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
