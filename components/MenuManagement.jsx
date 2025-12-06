'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function MenuManagement() {
  const menuItems = useQuery(api.menu.getAll);
  const createItem = useMutation(api.menu.create);
  const updateItem = useMutation(api.menu.update);
  const removeItem = useMutation(api.menu.remove);
  const toggleAvail = useMutation(api.menu.toggleAvailability);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-48 safe-area-bottom">
      <div className="max-w-md mx-auto pb-16 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500">Pengurusan</p>
            <h1 className="text-2xl font-bold text-slate-900">Menu</h1>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Tambah item
          </button>
        </div>

        {/* Loading State */}
        {!menuItems && (
          <div className="card-elevated p-10 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-500">Memuatkan menu...</p>
          </div>
        )}

        {/* Empty State */}
        {menuItems && menuItems.length === 0 && (
          <div className="card-elevated text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Menu Kosong
            </h3>
            <p className="text-slate-500 mb-6">
              Tambah item menu pertama anda!
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-all inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Tambah Item
            </button>
          </div>
        )}

        {/* Menu Items List */}
        {menuItems && menuItems.length > 0 && (
          <div className="space-y-3">
            {menuItems.map((item) => (
              <div
                key={item._id}
                className={`card-elevated p-4 border-2 transition-all ${
                  item.isAvailable ? 'border-green-100' : 'border-slate-200 opacity-70'
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-slate-900">{item.name}</h3>
                      {!item.isAvailable && (
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                          Habis
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm">{item.nameMalay}</p>
                    <p className="text-blue-700 font-bold text-xl mt-1">RM {item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Aliases: {item.aliases.join(', ')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-1">
                    <button
                      onClick={() => toggleAvail({ id: item._id })}
                      className={`p-2 rounded-lg transition-all border ${
                        item.isAvailable
                          ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                      }`}
                      title={item.isAvailable ? 'Tandakan habis' : 'Tandakan ada'}
                    >
                      {item.isAvailable ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm(`Padam "${item.name}"?`)) {
                          removeItem({ id: item._id });
                        }
                      }}
                      className="p-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                      title="Padam"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {(showAddForm || editingItem) && (
          <MenuItemForm
            item={editingItem}
            onSave={async (data) => {
              try {
                if (editingItem) {
                  await updateItem({ id: editingItem._id, ...data });
                } else {
                  await createItem(data);
                }
                setShowAddForm(false);
                setEditingItem(null);
              } catch (error) {
                alert('Ralat: ' + error.message);
              }
            }}
            onCancel={() => {
              setShowAddForm(false);
              setEditingItem(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// FORM COMPONENT
// ============================================

function MenuItemForm({ item, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    nameMalay: item?.nameMalay || '',
    price: item?.price || 0,
    category: item?.category || 'Makanan',
    aliases: item?.aliases?.join(', ') || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      alert('Sila masukkan nama item');
      return;
    }
    if (!formData.nameMalay.trim()) {
      alert('Sila masukkan nama Melayu');
      return;
    }
    if (formData.price <= 0) {
      alert('Harga mesti lebih dari RM0');
      return;
    }
    if (!formData.aliases.trim()) {
      alert('Sila masukkan sekurang-kurangnya satu alias');
      return;
    }

    setIsSaving(true);
    
    try {
      await onSave({
        name: formData.name.trim(),
        nameMalay: formData.nameMalay.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        aliases: formData.aliases
          .split(',')
          .map(a => a.trim())
          .filter(a => a.length > 0),
      });
    } catch (error) {
      alert('Ralat menyimpan: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slideUp shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {item ? 'Edit Item' : 'Tambah Item Baru'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          
          {/* Name (English) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nama (English) *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-lg focus:border-blue-500 focus:outline-none transition-all"
              placeholder="Teh Tarik"
            />
          </div>

          {/* Name (Malay) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nama (Malay) *
            </label>
            <input
              type="text"
              value={formData.nameMalay}
              onChange={(e) => setFormData({...formData, nameMalay: e.target.value})}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-lg focus:border-blue-500 focus:outline-none transition-all"
              placeholder="Teh Tarik"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Harga (RM) *
            </label>
            <input
              type="number"
              step="0.10"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-lg focus:border-blue-500 focus:outline-none transition-all"
              placeholder="2.50"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Kategori *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-lg focus:border-blue-500 focus:outline-none transition-all bg-white"
            >
              <option value="Makanan">Makanan</option>
              <option value="Minuman">Minuman</option>
              <option value="Kuih">Kuih</option>
              <option value="Tambahan">Tambahan</option>
              <option value="Lain-lain">Lain-lain</option>
            </select>
          </div>

          {/* Aliases */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Aliases (pisahkan dengan koma) *
            </label>
            <input
              type="text"
              value={formData.aliases}
              onChange={(e) => setFormData({...formData, aliases: e.target.value})}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-lg focus:border-blue-500 focus:outline-none transition-all"
              placeholder="teh, tea, tarik, teh tarik"
            />
            <p className="text-xs text-slate-500 mt-1">
              💡 Ini membantu AI mengenali item. Contoh: "teh, tea, tarik"
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8 pt-4 border-t border-slate-200">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  {item ? 'Simpan' : 'Tambah'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
