'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Settings, Bell, User, Database } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  function handleSave() {
    toast.success('Tetapan berjaya disimpan')
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tetapan</h1>
        <p className="text-gray-500 mt-1">Urus tetapan aplikasi anda</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Maklumat Perniagaan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nama Perniagaan</Label>
              <Input placeholder="Warung Makan Sedap" />
            </div>
            <div>
              <Label>Jenis Perniagaan</Label>
              <Input placeholder="Warung" />
            </div>
            <div>
              <Label>Nombor Telefon</Label>
              <Input placeholder="+60123456789" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="contoh@email.com" />
            </div>
            <Button onClick={handleSave} className="w-full">
              Simpan Maklumat
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Notifikasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notifikasi Pesanan</Label>
                <p className="text-sm text-gray-500">Terima notifikasi untuk pesanan baru</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Notifikasi Shift</Label>
                <p className="text-sm text-gray-500">Peringatan untuk tutup shift</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Laporan Email</Label>
                <p className="text-sm text-gray-500">Terima laporan harian via email</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Notifikasi WhatsApp</Label>
                <p className="text-sm text-gray-500">Terima notifikasi via WhatsApp</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Tetapan Sistem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Mod Gelap</Label>
                <p className="text-sm text-gray-500">Tukar kepada tema gelap</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Bunyi Notifikasi</Label>
                <p className="text-sm text-gray-500">Mainkan bunyi untuk notifikasi</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Backup</Label>
                <p className="text-sm text-gray-500">Backup data secara automatik</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Data & Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Eksport Data</Label>
              <p className="text-sm text-gray-500 mb-2">Muat turun semua data anda</p>
              <Button variant="outline" className="w-full">
                Eksport ke Excel
              </Button>
            </div>
            <div>
              <Label>Backup Database</Label>
              <p className="text-sm text-gray-500 mb-2">Buat sandaran pangkalan data</p>
              <Button variant="outline" className="w-full">
                Backup Sekarang
              </Button>
            </div>
            <div>
              <Label className="text-red-600">Padam Semua Data</Label>
              <p className="text-sm text-gray-500 mb-2">Tindakan ini tidak boleh dibatalkan</p>
              <Button variant="destructive" className="w-full">
                Padam Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maklumat Aplikasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Versi</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-medium text-green-600">Aktif</p>
            </div>
            <div>
              <p className="text-gray-500">Database</p>
              <p className="font-medium">PostgreSQL (Supabase)</p>
            </div>
            <div>
              <p className="text-gray-500">Framework</p>
              <p className="font-medium">Next.js 16 + Prisma</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
