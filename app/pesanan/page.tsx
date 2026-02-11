'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, Plus, Minus, Trash2, Banknote, CreditCard, Smartphone, QrCode, Lock, Volume2 } from 'lucide-react'
import { getAvailableMenuItems } from '@/lib/actions/menu'
import { getActiveShift } from '@/lib/actions/shifts'
import { createTransaction } from '@/lib/actions/transactions'
import { toTtsMalayOrderSummary, toTtsMalayPaymentConfirmation } from '@/lib/utils/tts-malay'
import { toast } from 'sonner'

interface MenuItem {
  id: number
  name: string
  nameMalay: string
  price: number
  category: string
  aliases: string[]
}

interface OrderItem {
  item: MenuItem
  quantity: number
}

const paymentMethods = [
  { id: 'Tunai', label: 'Tunai', icon: Banknote },
  { id: 'Kad', label: 'Kad', icon: CreditCard },
  { id: 'E-Wallet', label: 'E-Wallet', icon: Smartphone },
  { id: 'QR Pay', label: 'QR Pay', icon: QrCode },
]

export default function PesananPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [hasActiveShift, setHasActiveShift] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [aiProvider, setAiProvider] = useState('Anthropic')
  const [lastTranscript, setLastTranscript] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Sync AI provider from localStorage (set in Tetapan page)
  useEffect(() => {
    const saved = localStorage.getItem('ai_provider')
    if (saved === 'groq') setAiProvider('Groq')
    else setAiProvider('Anthropic')
  }, [])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setPageLoading(true)
    try {
      const [items, shift] = await Promise.all([
        getAvailableMenuItems(),
        getActiveShift()
      ])
      setMenuItems(Array.isArray(items) ? items as any : [])
      setHasActiveShift(!!shift)
    } catch (error) {
      console.error('Error loading data:', error)
      setMenuItems([])
      setHasActiveShift(false)
    }
    setPageLoading(false)
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

  // Memoize calculations for better performance
  const subtotal = useMemo(() => 
    orderItems.reduce((sum, oi) => sum + (Number(oi.item.price) * oi.quantity), 0),
    [orderItems]
  )
  const total = subtotal

  // Use runtime-injected key (from layout) so Vercel works without redeploy; fallback to build-time or localStorage
  const getApiKey = () =>
    (typeof window !== 'undefined' && (window as unknown as { __CB_API_KEY__?: string }).__CB_API_KEY__) ||
    process.env.NEXT_PUBLIC_INTERNAL_API_KEY ||
    (typeof window !== 'undefined' ? localStorage.getItem('internal_api_key') : null) ||
    ''

  // --- ElevenLabs TTS: speak order summary ---
  async function speakOrderSummary(text: string) {
    try {
      const apiKey = getApiKey()
      const res = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        console.warn('TTS failed:', res.status)
        if (res.status === 401) {
          toast.error('TTS: Kunci API tidak sah. Pastikan INTERNAL_API_KEY dan NEXT_PUBLIC_INTERNAL_API_KEY diset di Vercel, kemudian redeploy.')
        }
        return
      }

      const audioBlob = await res.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audio.play().catch(() => {
        // Autoplay blocked - ignore silently
      })
      audio.onended = () => URL.revokeObjectURL(audioUrl)
    } catch (error) {
      console.warn('TTS error (non-critical):', error)
    }
  }

  async function handleVoiceStart() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())
        await processVoiceOrder(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch {
      toast.error('Tidak dapat mengakses mikrofon')
    }
  }

  function handleVoiceStop() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  async function processVoiceOrder(audioBlob: Blob) {
    setIsProcessingVoice(true)
    try {
      // Get API key once for this function
      const apiKey = getApiKey()
      
      // Step 1: Transcribe audio using Groq Whisper
      const formData = new FormData()
      // FIXED: API expects 'file' field, not 'audio'. Also add filename for proper MIME detection.
      formData.append('file', audioBlob, 'recording.webm')

      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey
        },
        body: formData,
      })

      if (!transcribeRes.ok) {
        const errData = await transcribeRes.json().catch(() => ({}))
        const msg = transcribeRes.status === 401
          ? 'Transkripsi: Kunci API tidak sah. Pastikan INTERNAL_API_KEY dan NEXT_PUBLIC_INTERNAL_API_KEY diset di Vercel, kemudian redeploy.'
          : (errData.error || 'Gagal mentranskripsikan audio')
        toast.error(msg)
        setIsProcessingVoice(false)
        return
      }

      const { text } = await transcribeRes.json()
      
      if (!text || text.trim().length === 0) {
        toast.error('Tiada pertuturan dikesan. Sila cuba lagi.')
        setIsProcessingVoice(false)
        return
      }

      setLastTranscript(text)
      toast.info(`Dikesan: "${text}"`)

      // Step 2: Parse order using AI (Groq or Anthropic)
      // FIXED: Send correct field names matching the API (transcript, provider, currentOrderItems)
      const currentOrderForAI = orderItems.map(oi => ({
        name: oi.item.nameMalay,
        quantity: oi.quantity,
        price: Number(oi.item.price)
      }))

      const providerKey = aiProvider === 'Groq' ? 'groq' : 'anthropic'

      const parseRes = await fetch('/api/parse-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          transcript: text,
          menuItems,
          currentOrderItems: currentOrderForAI,
          provider: providerKey
        }),
      })

      if (!parseRes.ok) {
        toast.error('Gagal memproses pesanan')
        setIsProcessingVoice(false)
        return
      }

      const parsed = await parseRes.json()

      // Handle ambiguous response
      if (parsed.ambiguous) {
        const matchNames = (parsed.possibleMatches || []).map((m: any) => m.nameMalay || m.name).join(', ')
        toast.warning(`Pesanan tidak jelas: "${parsed.ambiguousQuery}". Adakah anda bermaksud: ${matchNames}?`, {
          duration: 5000
        })
        setIsProcessingVoice(false)
        return
      }

      // Handle actions (add, update, remove) in ONE state update to avoid stale state clearing the cart
      if (parsed.actions) {
        let changesMade = false
        const toRemove = parsed.actions.remove && Array.isArray(parsed.actions.remove) ? parsed.actions.remove : []
        const toUpdate = parsed.actions.update && Array.isArray(parsed.actions.update) ? parsed.actions.update : []
        const toAdd = parsed.actions.add && Array.isArray(parsed.actions.add) ? parsed.actions.add : []

        const removeNames = new Set(toRemove.map((r: { name?: string }) => r.name?.toLowerCase().trim()).filter(Boolean))
        const updateMap = new Map<string, number>(
          toUpdate
            .map((u: { name?: string; quantity?: number }) => [u.name?.toLowerCase().trim(), Math.max(1, Number(u.quantity) || 1)] as [string, number])
            .filter(([k]) => k)
        )
        const newOrderItemsFromAdd: OrderItem[] = []
        for (const addItem of toAdd) {
          const menuItem = menuItems.find(mi =>
            mi.name.toLowerCase() === addItem.name?.toLowerCase() ||
            mi.nameMalay.toLowerCase() === addItem.name?.toLowerCase()
          )
          if (menuItem) {
            const qty = Math.max(1, Math.min(99, Number(addItem.quantity) || 1))
            newOrderItemsFromAdd.push({ item: menuItem, quantity: qty })
          }
        }

        if (toRemove.length > 0 || toUpdate.length > 0 || newOrderItemsFromAdd.length > 0) {
          setOrderItems(prev => {
            let next = prev
            if (removeNames.size > 0) {
              next = next.filter(oi => {
                const nameMalay = oi.item.nameMalay?.toLowerCase().trim()
                const name = oi.item.name?.toLowerCase().trim()
                return !removeNames.has(nameMalay) && !removeNames.has(name)
              })
            }
            if (updateMap.size > 0) {
              next = next.map(oi => {
                const nameMalay = oi.item.nameMalay?.toLowerCase().trim()
                const name = oi.item.name?.toLowerCase().trim()
                const newQty = (updateMap.get(nameMalay) ?? updateMap.get(name)) as number | undefined
                if (newQty !== undefined && typeof newQty === 'number') return { ...oi, quantity: newQty }
                return oi
              })
            }
            for (const newItem of newOrderItemsFromAdd) {
              const idx = next.findIndex(m => m.item.id === newItem.item.id)
              if (idx >= 0) {
                next = next.map((oi, i) => i === idx ? { ...oi, quantity: oi.quantity + newItem.quantity } : oi)
              } else {
                next = [...next, newItem]
              }
            }
            return next
          })
          changesMade = true
        }

        // Show confirmations from AI
        if (parsed.confirmations && Array.isArray(parsed.confirmations)) {
          for (const msg of parsed.confirmations) {
            toast.success(msg)
          }
        }

        if (changesMade) {
          const summaryItems = parsed.items || []
          if (Array.isArray(summaryItems) && summaryItems.length > 0) {
            const total = Number(parsed.total) || 0
            const speechText = toTtsMalayOrderSummary(
              summaryItems.map((i: any) => ({ name: i.name || '', quantity: Number(i.quantity) || 1 })),
              total
            )
            speakOrderSummary(speechText)
          }
        }

        if (!changesMade) {
          toast.error('Tiada item ditemui dari pesanan suara')
        }
      } else {
        // Fallback: process items array directly
        const parsedItems = Array.isArray(parsed.items) ? parsed.items : []
        if (parsedItems.length > 0) {
          const newOrderItems: OrderItem[] = []
          for (const parsedItem of parsedItems) {
            const menuItem = menuItems.find(mi =>
              mi.id === parsedItem.item_id ||
              mi.name.toLowerCase() === parsedItem.name?.toLowerCase() ||
              mi.nameMalay.toLowerCase() === parsedItem.name?.toLowerCase()
            )
            if (menuItem) {
              newOrderItems.push({ item: menuItem, quantity: parsedItem.quantity || 1 })
            }
          }
          if (newOrderItems.length > 0) {
            setOrderItems(prev => {
              const merged = prev.map(oi => ({ ...oi }))
              for (const newItem of newOrderItems) {
                const idx = merged.findIndex(m => m.item.id === newItem.item.id)
                if (idx >= 0) {
                  merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + newItem.quantity }
                } else {
                  merged.push(newItem)
                }
              }
              return merged
            })
            toast.success(`${newOrderItems.length} item ditambah dari pesanan suara`)

            const totalAmt = newOrderItems.reduce((sum, oi) => sum + Number(oi.item.price) * oi.quantity, 0)
            const speechText = toTtsMalayOrderSummary(
              newOrderItems.map(oi => ({ name: oi.item.nameMalay, quantity: oi.quantity })),
              totalAmt
            )
            speakOrderSummary(speechText)
          } else {
            toast.error('Tiada item ditemui dari pesanan suara')
          }
        } else {
          toast.error('Tiada item ditemui dari pesanan suara')
        }
      }
    } catch (error) {
      console.error('Voice order error:', error)
      toast.error('Ralat memproses pesanan suara')
    }
    setIsProcessingVoice(false)
  }

  async function handleSubmit() {
    if (orderItems.length === 0) {
      toast.error('Sila tambah item ke pesanan')
      return
    }

    if (!paymentMethod) {
      toast.error('Sila pilih kaedah pembayaran')
      return
    }

    setIsLoading(true)

    const items = orderItems.map(oi => ({
      item_id: oi.item.id,
      name: oi.item.nameMalay,
      price: Number(oi.item.price),
      quantity: oi.quantity
    }))

    const result = await createTransaction({
      items,
      subtotal,
      tax: 0,
      total,
      paymentMethod,
      paymentReceived: total,
      changeGiven: 0
    })

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Pesanan berjaya disimpan!')
      const paymentSummary = toTtsMalayPaymentConfirmation(
        orderItems.map(oi => ({ name: oi.item.nameMalay, quantity: oi.quantity })),
        total,
        paymentMethod
      )
      speakOrderSummary(paymentSummary)
      setOrderItems([])
      setPaymentMethod('')
    }
  }

  const categories = Array.from(new Set(menuItems.map(item => item.category)))

  // --- Loading state ---
  if (pageLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // --- Shift not active: Block access ---
  if (!hasActiveShift) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Lock className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Shift Belum Dibuka</h1>
          <p className="text-gray-500 max-w-md mb-6">
            Sila buka shift terlebih dahulu sebelum membuat pesanan. Pergi ke halaman Shift untuk memulakan.
          </p>
          <a
            href="/shift"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Buka Shift
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">Pesanan</p>
          <h1 className="text-3xl font-bold text-gray-900">Buat Pesanan</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full border">
            {aiProvider}
          </span>
          <span className="px-3 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full border border-green-200">
            Shift Aktif
          </span>
        </div>
      </div>

      {/* Voice Recorder */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white text-center">
        {isProcessingVoice ? (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto bg-white/20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
            </div>
            <p className="mt-4 font-medium text-lg">Memproses pesanan suara...</p>
            {lastTranscript && (
              <p className="text-blue-100 text-sm mt-1">
                &quot;{lastTranscript}&quot;
              </p>
            )}
          </div>
        ) : (
          <>
            <button
              onMouseDown={handleVoiceStart}
              onMouseUp={handleVoiceStop}
              onTouchStart={handleVoiceStart}
              onTouchEnd={handleVoiceStop}
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all ${
                isRecording
                  ? 'bg-red-500 scale-110 animate-pulse'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <Mic className="h-10 w-10 text-white" />
            </button>
            <p className="mt-4 font-medium text-lg">
              {isRecording ? 'Merakam...' : 'Tekan dan Tahan untuk Rakam'}
            </p>
            <p className="text-blue-100 text-sm mt-1">
              Contoh: &quot;Dua nasi lemak, satu milo ais&quot;
            </p>
          </>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Order */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">Pesanan Semasa</CardTitle>
          </CardHeader>
          <CardContent>
            {orderItems.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                Tiada item dalam pesanan
              </p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {orderItems.map(oi => (
                    <div key={oi.item.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{oi.item.nameMalay}</p>
                        <p className="text-sm text-gray-500">
                          RM {Number(oi.item.price).toFixed(2)} x {oi.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(oi.item.id, oi.quantity - 1)}
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{oi.quantity}</span>
                        <button
                          onClick={() => updateQuantity(oi.item.id, oi.quantity + 1)}
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeItem(oi.item.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>RM {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Jumlah</span>
                    <span>RM {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Kaedah Pembayaran</p>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                          paymentMethod === method.id
                            ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                            : 'border-gray-300 bg-gray-900 text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        <method.icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => { setOrderItems([]); setPaymentMethod('') }}
                    className="flex-1"
                  >
                    Kembali
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !paymentMethod}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? 'Menyimpan...' : 'Selesaikan'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Menu */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">Menu Pantas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {categories.map(category => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">{category}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {menuItems
                      .filter(item => item.category === category)
                      .map(item => (
                        <button
                          key={item.id}
                          onClick={() => addItem(item)}
                          className="text-left p-3 border rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        >
                          <p className="font-medium text-sm">{item.nameMalay}</p>
                          <p className="text-xs text-gray-500">RM {Number(item.price).toFixed(2)}</p>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
