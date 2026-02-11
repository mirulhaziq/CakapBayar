'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemAvailability } from '@/lib/actions/menu'
import { toast } from 'sonner'

interface MenuItem {
  id: number
  name: string
  nameMalay: string
  price: number
  category: string
  aliases: string[]
  isAvailable: boolean
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    nameMalay: '',
    price: '',
    category: 'Makanan',
    aliases: ''
  })

  useEffect(() => {
    loadMenuItems()
  }, [])

  async function loadMenuItems() {
    setLoading(true)
    const items = await getMenuItems()
    setMenuItems(items as any)
    setLoading(false)
  }

  function openDialog(item?: MenuItem) {
    if (item) {
      setEditingItem(item)
      const aliasArr = Array.isArray(item.aliases) ? item.aliases : []
      setFormData({
        name: item.name,
        nameMalay: item.nameMalay,
        price: String(Number(item.price)),
        category: item.category,
        aliases: aliasArr.join(', ')
      })
    } else {
      setEditingItem(null)
      setFormData({
        name: '',
        nameMalay: '',
        price: '',
        category: 'Makanan',
        aliases: ''
      })
    }
    setIsDialogOpen(true)
  }

  async function handleSubmit() {
    if (!formData.name || !formData.nameMalay || !formData.price) {
      toast.error('Sila lengkapkan semua maklumat')
      return
    }

    const aliases = formData.aliases
      ? formData.aliases.split(',').map(a => a.trim()).filter(a => a)
      : []

    const data = {
      name: formData.name,
      nameMalay: formData.nameMalay,
      price: parseFloat(formData.price),
      category: formData.category,
      aliases
    }

    let result
    if (editingItem) {
      result = await updateMenuItem(editingItem.id, data)
    } else {
      result = await createMenuItem(data)
    }

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(editingItem ? 'Item berjaya dikemaskini' : 'Item berjaya ditambah')
      setIsDialogOpen(false)
      loadMenuItems()
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Adakah anda pasti untuk memadam item ini?')) return

    const result = await deleteMenuItem(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Item berjaya dipadam')
      loadMenuItems()
    }
  }

  async function handleToggleAvailability(id: number) {
    const result = await toggleMenuItemAvailability(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      loadMenuItems()
    }
  }

  const categories = Array.from(new Set(menuItems.map(item => item.category)))

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
          <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Item
        </Button>
      </div>

      {/* Menu Items by Category */}
      <div className="space-y-6">
        {categories.map(category => {
          const catItems = menuItems.filter(item => item.category === category)
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {category}
                  <span className="text-sm font-normal text-gray-400">{catItems.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {catItems.map(item => {
                    const aliasArr = Array.isArray(item.aliases) ? item.aliases : []
                    const aliasStr = aliasArr.length > 0
                      ? 'Alias: ' + aliasArr.join(', ')
                      : ''

                    return (
                      <div key={item.id} className="border rounded-xl p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{item.nameMalay}</h3>
                            <p className="text-lg font-bold text-blue-600">
                              RM {Number(item.price).toFixed(2)}
                            </p>
                            {aliasStr && (
                              <p className="text-xs text-gray-400 mt-1 truncate" title={aliasStr}>
                                {aliasStr}
                              </p>
                            )}
                          </div>
                          <Switch
                            checked={item.isAvailable}
                            onCheckedChange={() => handleToggleAvailability(item.id)}
                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => openDialog(item)}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Item' : 'Tambah Item Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama (English)</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nasi Lemak"
              />
            </div>
            <div>
              <Label>Nama (Malay)</Label>
              <Input
                value={formData.nameMalay}
                onChange={(e) => setFormData({ ...formData, nameMalay: e.target.value })}
                placeholder="Nasi Lemak"
              />
            </div>
            <div>
              <Label>Harga (RM)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="5.00"
              />
            </div>
            <div>
              <Label>Kategori</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Makanan">Makanan</SelectItem>
                  <SelectItem value="Minuman">Minuman</SelectItem>
                  <SelectItem value="Kuih">Kuih</SelectItem>
                  <SelectItem value="Lain-lain">Lain-lain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Alias (pisahkan dengan koma)</Label>
              <Input
                value={formData.aliases}
                onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                placeholder="nasi lemak, nasik lemak"
              />
              <p className="text-xs text-gray-400 mt-1">
                Nama alternatif untuk pengecaman suara
              </p>
            </div>
            <Button onClick={handleSubmit} className="w-full">
              {editingItem ? 'Kemaskini' : 'Tambah'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
