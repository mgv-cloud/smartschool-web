'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Item { id: string; name: string; category: string | null; unitPrice: number; quantityInStock: number; reorderLevel: number | null; }

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [lowStock, setLowStock] = useState<Item[]>([]);
  const [itemForm, setItemForm] = useState({ name: '', category: '', unitPriceNaira: 0, reorderLevel: 10 });
  const [moveForm, setMoveForm] = useState({ itemId: '', type: 'PURCHASE', quantity: 0, note: '' });
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiRequest<Item[]>('/inventory/items').then(setItems).catch(() => {});
    apiRequest<Item[]>('/inventory/items/low-stock').then(setLowStock).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/inventory/items', { method: 'POST', body: { name: itemForm.name, category: itemForm.category || undefined, unitPrice: Math.round(itemForm.unitPriceNaira * 100), reorderLevel: itemForm.reorderLevel } });
      setItemForm({ name: '', category: '', unitPriceNaira: 0, reorderLevel: 10 });
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  };

  const recordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/inventory/movements', { method: 'POST', body: { ...moveForm, note: moveForm.note || undefined } });
      setMoveForm({ ...moveForm, quantity: 0, note: '' });
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Inventory / Tuckshop</h1>
      <p className="text-gray-500 mb-6">Stock only ever changes through a recorded movement — never edited directly.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="font-medium text-sm text-amber-900 mb-1">⚠ Low stock alert</div>
          {lowStock.map((i) => <div key={i.id} className="text-xs text-amber-800">{i.name}: {i.quantityInStock} left (reorder at {i.reorderLevel})</div>)}
        </div>
      )}

      <form onSubmit={addItem} className="grid grid-cols-4 gap-2 bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="Item name" required className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <input value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} placeholder="Category" className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <input type="number" value={itemForm.unitPriceNaira} onChange={(e) => setItemForm({ ...itemForm, unitPriceNaira: Number(e.target.value) })} placeholder="₦ price" required className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <input type="number" value={itemForm.reorderLevel} onChange={(e) => setItemForm({ ...itemForm, reorderLevel: Number(e.target.value) })} placeholder="Reorder at" className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <button className="col-span-4 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded-lg">Add Item</button>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-6">
        {items.length === 0 ? <div className="px-4 py-3 text-sm text-gray-400">No items yet.</div> : items.map((i) => (
          <div key={i.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
            <span>{i.name} {i.category && <span className="text-gray-400">· {i.category}</span>}</span>
            <span className="text-gray-400">{naira(i.unitPrice)} · {i.quantityInStock} in stock</span>
          </div>
        ))}
      </div>

      <form onSubmit={recordMovement} className="grid grid-cols-4 gap-2 bg-white border border-gray-200 rounded-xl p-4">
        <select value={moveForm.itemId} onChange={(e) => setMoveForm({ ...moveForm, itemId: e.target.value })} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option value="">Item…</option>
          {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
        <select value={moveForm.type} onChange={(e) => setMoveForm({ ...moveForm, type: e.target.value })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option value="PURCHASE">Purchase (+)</option>
          <option value="SALE">Sale (-)</option>
          <option value="ADJUSTMENT">Adjustment (-)</option>
        </select>
        <input type="number" value={moveForm.quantity} onChange={(e) => setMoveForm({ ...moveForm, quantity: Number(e.target.value) })} placeholder="Quantity" required className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <input value={moveForm.note} onChange={(e) => setMoveForm({ ...moveForm, note: e.target.value })} placeholder="Note (optional)" className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <button className="col-span-4 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium py-2 rounded-lg">Record Movement</button>
      </form>
    </div>
  );
}
