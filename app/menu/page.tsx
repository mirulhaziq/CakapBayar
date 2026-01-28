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
    category: 'Makanan'
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
      setFormData({
        name: item.name,
        nameMalay: item.nameMalay,
        price: item.price.toString(),
        category: item.category
      })
    } else {
      setEditingItem(null)
      setFormData({
        name: '',
        nameMalay: '',
        price: '',
        category: 'Makanan'
      })
    }
    setIsDialogOpen(true)
  }

  async function handleSubmit() {
    if (!formData.name || !formData.nameMalay || !formData.price) {
      toast.error('Sila lengkapkan semua maklumat')
      return
    }

    const data = {
      name: formData.name,
      nameMalay: formData.nameMalay,
      price: parseFloat(formData.price),
      category: formData.category
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
    if (!confirm('Adakah anda pasti untuk memadam item ini?')) {
      return
    }

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pengurusan Menu</h1>
          <p className="text-gray-500 mt-1">Urus item menu anda</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Item
            </Button>
          </DialogTrigger>
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
              <Button onClick={handleSubmit} className="w-full">
                {editingItem ? 'Kemaskini' : 'Tambah'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {categories.map(category => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {menuItems
                  .filter(item => item.category === category)
                  .map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.nameMalay}</p>
                        <p className="text-sm text-gray-500">RM {Number(item.price).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`available-${item.id}`} className="text-sm">
                            {item.isAvailable ? 'Tersedia' : 'Habis'}
                          </Label>
                          <Switch
                            id={`available-${item.id}`}
                            checked={item.isAvailable}
                            onCheckedChange={() => handleToggleAvailability(item.id)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
