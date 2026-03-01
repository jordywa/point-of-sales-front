// src/pages/MasterSetting/tabs/PaymentMethodTab.tsx

import React, { useEffect, useState } from 'react';
import { CreditCard, Plus, Save, Edit, X as XIcon, ToggleLeft, ToggleRight, Wallet, Percent, BadgeDollarSign, Timer } from 'lucide-react';
import LoadingOverlay from '../../../components/LoadingOverlay';
import ConfirmationDialog from '../../../components/ConfirmationDialog';

type DiscountType = 'NOMINAL' | 'PERCENT';
type SettlementType = 'INSTANT' | 'WAIT_DAYS';

interface PaymentMethod {
  id: string;
  name: string;
  targetFundName: string; // contoh sementara: BCA/BRI/Mandiri
  discountType: DiscountType;
  discountValue: number;
  settlementType: SettlementType;
  settlementDays: number; // hanya kepake kalau settlementType === 'WAIT_DAYS'
  isActive: boolean;
  createdAt: string; // ISO string (mock)
  updatedAt: string; // ISO string (mock)
}

interface PaymentMethodForm {
  id: string | null; // null berarti add new
  name: string;
  targetFundName: string;
  discountType: DiscountType;
  discountValue: string; // input string biar enak ketik
  settlementType: SettlementType;
  settlementDays: string; // input string
}

type PendingAction =
  | { kind: 'ADD' }
  | { kind: 'SAVE_EDIT' }
  | { kind: 'TOGGLE_ACTIVE'; id: string; nextActive: boolean }
  | null;

const nowIso = () => new Date().toISOString();

const PaymentMethodTab: React.FC = () => {
  const [loading, setLoading] = useState<{ show: boolean; message?: string }>({ show: false, message: undefined });

  // NOTE: contoh sementara. Nanti bisa diambil dari Cash/Bank master atau table bank kamu.
  // WOI BACKEND: GET daftar tujuan dana (bank/cash) untuk dropdown
  // GET /api/fund-targets (response: [{ name: "BCA" }, ...])
  const FUND_TARGETS = ['BCA', 'BRI', 'MANDIRI'] as const;

  // Mock data awal (nanti diganti dari backend)
  // WOI BACKEND: GET list payment method
  // GET /api/payment-methods (response: [{ id, name, targetFundName, discountType, discountValue, settlementType, settlementDays, isActive, createdAt, updatedAt }])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: 'pm-1', name: 'TRANSFER', targetFundName: 'BCA', discountType: 'NOMINAL', discountValue: 0, settlementType: 'INSTANT', settlementDays: 0, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
    { id: 'pm-2', name: 'QRIS', targetFundName: 'MANDIRI', discountType: 'PERCENT', discountValue: 0, settlementType: 'WAIT_DAYS', settlementDays: 2, isActive: true, createdAt: nowIso(), updatedAt: nowIso() },
  ]);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentMethodForm>({
    id: null,
    name: '',
    targetFundName: FUND_TARGETS[0] ?? '',
    discountType: 'NOMINAL',
    discountValue: '0',
    settlementType: 'INSTANT',
    settlementDays: '0',
  });

  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type: 'warning' | 'danger' | 'info';
    pendingAction: PendingAction;
  }>({
    open: false,
    title: 'Konfirmasi',
    message: '',
    pendingAction: null,
    type: 'info',
  });

  useEffect(() => {
    // Jangan auto-select saat user sedang add/edit,
    // karena akan meng-override mode "Tambah Baru"
    if (!isEditing && paymentMethods.length > 0 && !selectedId) {
      const first = paymentMethods[0];
      setSelectedId(first.id);
      setForm({
        id: first.id,
        name: first.name,
        targetFundName: first.targetFundName,
        discountType: first.discountType,
        discountValue: String(first.discountValue ?? 0),
        settlementType: first.settlementType,
        settlementDays: String(first.settlementDays ?? 0),
      });
      setIsEditing(false);
    }
  }, [paymentMethods, selectedId, isEditing]);

  const openConfirm = (next: Omit<(typeof confirm), 'open'>) => setConfirm({ ...next, open: true });
  const closeConfirm = () => setConfirm(prev => ({ ...prev, open: false, pendingAction: null }));

  const simulateBackend = async (message: string, fn: () => void) => {
    setLoading({ show: true, message });
    try {
      // Simulasi request network
      await new Promise(res => setTimeout(res, 650));
      fn();
    } finally {
      setLoading({ show: false, message: undefined });
    }
  };

  const handleSelectRow = (pm: PaymentMethod) => {
    if (isEditing) return;
    setSelectedId(pm.id);
    setForm({
      id: pm.id,
      name: pm.name,
      targetFundName: pm.targetFundName,
      discountType: pm.discountType,
      discountValue: String(pm.discountValue ?? 0),
      settlementType: pm.settlementType,
      settlementDays: String(pm.settlementDays ?? 0),
    });
  };

  const handleAdd = () => {
    setSelectedId(null);
    setIsEditing(true);
    setForm({
      id: null,
      name: '',
      targetFundName: FUND_TARGETS[0] ?? '',
      discountType: 'NOMINAL',
      discountValue: '0',
      settlementType: 'INSTANT',
      settlementDays: '0',
    });
  };

  const handleEdit = () => {
    if (!selectedId) return;
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (!selectedId) {
      const first = paymentMethods[0];
      if (first) {
        setSelectedId(first.id);
        setForm({
          id: first.id,
          name: first.name,
          targetFundName: first.targetFundName,
          discountType: first.discountType,
          discountValue: String(first.discountValue ?? 0),
          settlementType: first.settlementType,
          settlementDays: String(first.settlementDays ?? 0),
        });
      }
      return;
    }
    const current = paymentMethods.find(p => p.id === selectedId);
    if (current) {
      setForm({
        id: current.id,
        name: current.name,
        targetFundName: current.targetFundName,
        discountType: current.discountType,
        discountValue: String(current.discountValue ?? 0),
        settlementType: current.settlementType,
        settlementDays: String(current.settlementDays ?? 0),
      });
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Nama Metode Pembayaran wajib diisi.';
    if (!form.targetFundName) return 'Tujuan Dana wajib dipilih.';
    const disc = Number(form.discountValue);
    if (Number.isNaN(disc) || disc < 0) return 'Potongan harus angka (>= 0).';
    if (form.discountType === 'PERCENT' && disc > 100) return 'Potongan persen maksimal 100%.';
    if (form.settlementType === 'WAIT_DAYS') {
      const days = Number(form.settlementDays);
      if (Number.isNaN(days) || days < 1) return 'Menunggu harus minimal 1 hari.';
    }
    return null;
  };

  const requestSave = () => {
    const err = validateForm();
    if (err) {
      alert(err);
      return;
    }

    if (form.id === null) {
      openConfirm({
        title: 'Tambah Metode Pembayaran',
        message: `Simpan metode pembayaran baru "${form.name}"?`,
        confirmText: 'Ya, Simpan',
        cancelText: 'Batal',
        type: 'info',
        pendingAction: { kind: 'ADD' },
      });
      return;
    }

    openConfirm({
      title: 'Simpan Perubahan',
      message: `Simpan perubahan metode pembayaran "${form.name}"?`,
      confirmText: 'Ya, Simpan',
      cancelText: 'Batal',
      type: 'info',
      pendingAction: { kind: 'SAVE_EDIT' },
    });
  };

  const requestToggleActive = (pm: PaymentMethod) => {
    openConfirm({
      title: pm.isActive ? 'Nonaktifkan Metode' : 'Aktifkan Metode',
      message: `${pm.isActive ? 'Nonaktifkan' : 'Aktifkan'} metode pembayaran "${pm.name}"?`,
      confirmText: pm.isActive ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan',
      cancelText: 'Batal',
      type: pm.isActive ? 'warning' : 'info',
      pendingAction: { kind: 'TOGGLE_ACTIVE', id: pm.id, nextActive: !pm.isActive },
    });
  };

  const onConfirmAction = async () => {
    const action = confirm.pendingAction;
    closeConfirm();
    if (!action) return;

    if (action.kind === 'ADD') {
      await simulateBackend('Menyimpan metode pembayaran...', () => {
        const newId = `pm-${Date.now()}`;
        const parsedDiscount = Number(form.discountValue) || 0;
        const parsedDays = form.settlementType === 'WAIT_DAYS' ? Number(form.settlementDays) || 0 : 0;
        const payload: PaymentMethod = {
          id: newId,
          name: form.name.trim(),
          targetFundName: form.targetFundName,
          discountType: form.discountType,
          discountValue: parsedDiscount,
          settlementType: form.settlementType,
          settlementDays: parsedDays,
          isActive: true,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };

        // WOI BACKEND: INSERT payment method baru
        // POST /api/payment-methods
        // body: { name, targetFundName, discountType, discountValue, settlementType, settlementDays, isActive }
        console.log('[BACKEND_CMD] POST /api/payment-methods', {
          name: payload.name,
          targetFundName: payload.targetFundName,
          discountType: payload.discountType,
          discountValue: payload.discountValue,
          settlementType: payload.settlementType,
          settlementDays: payload.settlementDays,
          isActive: payload.isActive,
        });

        setPaymentMethods(prev => [...prev, payload]);
        setSelectedId(newId);
        setForm({
          id: newId,
          name: payload.name,
          targetFundName: payload.targetFundName,
          discountType: payload.discountType,
          discountValue: String(payload.discountValue ?? 0),
          settlementType: payload.settlementType,
          settlementDays: String(payload.settlementDays ?? 0),
        });
        setIsEditing(false);
      });
      return;
    }

    if (action.kind === 'SAVE_EDIT') {
      if (!form.id) return;
      await simulateBackend('Menyimpan perubahan...', () => {
        const parsedDiscount = Number(form.discountValue) || 0;
        const parsedDays = form.settlementType === 'WAIT_DAYS' ? Number(form.settlementDays) || 0 : 0;
        // WOI BACKEND: UPDATE payment method
        // PUT /api/payment-methods/{id}
        // body: { name, targetFundName, discountType, discountValue, settlementType, settlementDays }
        console.log(`[BACKEND_CMD] PUT /api/payment-methods/${form.id}`, {
          name: form.name.trim(),
          targetFundName: form.targetFundName,
          discountType: form.discountType,
          discountValue: parsedDiscount,
          settlementType: form.settlementType,
          settlementDays: parsedDays,
        });

        setPaymentMethods(prev =>
          prev.map(p =>
            p.id === form.id
              ? {
                  ...p,
                  name: form.name.trim(),
                  targetFundName: form.targetFundName,
                  discountType: form.discountType,
                  discountValue: parsedDiscount,
                  settlementType: form.settlementType,
                  settlementDays: parsedDays,
                  updatedAt: nowIso(),
                }
              : p
          )
        );
        setIsEditing(false);
      });
      return;
    }

    if (action.kind === 'TOGGLE_ACTIVE') {
      await simulateBackend(action.nextActive ? 'Mengaktifkan metode...' : 'Menonaktifkan metode...', () => {
        // WOI BACKEND: TOGGLE active/nonactive payment method
        // PATCH /api/payment-methods/{id}/status
        // body: { isActive: boolean }
        console.log(`[BACKEND_CMD] PATCH /api/payment-methods/${action.id}/status`, { isActive: action.nextActive });

        setPaymentMethods(prev =>
          prev.map(p => (p.id === action.id ? { ...p, isActive: action.nextActive, updatedAt: nowIso() } : p))
        );
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in flex flex-col p-1 pb-20 relative">
      <LoadingOverlay show={loading.show} message={loading.message} />

      <h2 className="text-2xl font-bold text-gray-800 text-center mb-6 uppercase tracking-wider">METODE PEMBAYARAN</h2>

      {/* FORM INPUT AREA */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="space-y-5">
          {/* Row 1: Metode (kiri) + Tujuan Dana (kanan) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-gray-800 font-bold mb-1 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" /> Metode Pembayaran <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none transition-colors ${
                  isEditing ? 'border-blue-400 focus:border-blue-600 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
                placeholder="Contoh: QRIS, E-Wallet, Transfer..."
              />
            </div>

            <div>
              <label className="text-gray-800 font-bold mb-1 text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4 text-green-600" /> Tujuan Dana <span className="text-red-500">*</span>
              </label>
              <select
                disabled={!isEditing}
                value={form.targetFundName}
                onChange={(e) => setForm({ ...form, targetFundName: e.target.value })}
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none transition-colors appearance-none cursor-pointer ${
                  isEditing ? 'border-blue-400 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                {FUND_TARGETS.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Potongan + Dana masuk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-gray-800 font-bold mb-1 text-sm flex items-center gap-2">
                {form.discountType === 'PERCENT' ? <Percent className="w-4 h-4 text-purple-600" /> : <BadgeDollarSign className="w-4 h-4 text-purple-600" />}
                Potongan
              </label>
              <div className="flex gap-2">
                <select
                  disabled={!isEditing}
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value as DiscountType })}
                  className={`w-40 border rounded-lg px-3 py-2 focus:outline-none transition-colors appearance-none cursor-pointer ${
                    isEditing ? 'border-blue-400 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                >
                  <option value="NOMINAL">Nominal</option>
                  <option value="PERCENT">Persentase</option>
                </select>
                <input
                  type="number"
                  disabled={!isEditing}
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  className={`flex-1 border rounded-lg px-4 py-2 focus:outline-none transition-colors ${
                    isEditing ? 'border-blue-400 focus:border-blue-600 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                  placeholder={form.discountType === 'PERCENT' ? '0 - 100' : '0'}
                  min={0}
                />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {form.discountType === 'PERCENT' ? 'Contoh: 2 = 2%' : 'Contoh: 1500 = Rp 1.500'}
              </div>
            </div>

            <div>
              <label className="text-gray-800 font-bold mb-1 text-sm flex items-center gap-2">
                <Timer className="w-4 h-4 text-orange-600" /> Dana Masuk
              </label>
              <div className="flex gap-2">
                <select
                  disabled={!isEditing}
                  value={form.settlementType}
                  onChange={(e) => {
                    const next = e.target.value as SettlementType;
                    setForm(prev => ({
                      ...prev,
                      settlementType: next,
                      settlementDays: next === 'WAIT_DAYS' ? (prev.settlementDays === '0' ? '1' : prev.settlementDays) : '0',
                    }));
                  }}
                  className={`w-56 border rounded-lg px-3 py-2 focus:outline-none transition-colors appearance-none cursor-pointer ${
                    isEditing ? 'border-blue-400 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                >
                  <option value="INSTANT">Langsung</option>
                  <option value="WAIT_DAYS">Menunggu ... hari</option>
                </select>
                <input
                  type="number"
                  disabled={!isEditing || form.settlementType !== 'WAIT_DAYS'}
                  value={form.settlementDays}
                  onChange={(e) => setForm({ ...form, settlementDays: e.target.value })}
                  className={`flex-1 border rounded-lg px-4 py-2 focus:outline-none transition-colors ${
                    isEditing && form.settlementType === 'WAIT_DAYS'
                      ? 'border-blue-400 focus:border-blue-600 bg-white'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                  placeholder="Hari"
                  min={1}
                />
              </div>
              <div className="mt-1 text-xs text-gray-500">Jika menunggu, isi jumlah hari.</div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-center gap-4">
        {!isEditing ? (
          <>
            <button
              onClick={handleAdd}
              className="bg-[#BEDFFF] hover:bg-blue-300 text-black px-8 py-2.5 rounded-full flex items-center gap-2 font-bold shadow-md transition-transform hover:scale-105"
            >
              <Plus className="w-5 h-5" /> Tambah Baru
            </button>
            <button
              onClick={handleEdit}
              disabled={!selectedId}
              className={`px-8 py-2.5 rounded-full flex items-center gap-2 font-bold shadow-md transition-transform hover:scale-105 ${
                selectedId ? 'bg-[#FFE167] hover:bg-yellow-400 text-black' : 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-sm'
              }`}
            >
              <Edit className="w-5 h-5" /> Edit Data
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleCancel}
              className="bg-gray-200 hover:bg-gray-300 text-black px-6 py-2.5 rounded-full flex items-center gap-2 font-bold shadow-sm transition-transform hover:scale-105"
            >
              <XIcon className="w-5 h-5" /> Batal
            </button>
            <button
              onClick={requestSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full flex items-center gap-2 font-bold shadow-md transition-transform hover:scale-105"
            >
              <Save className="w-5 h-5" /> Simpan
            </button>
          </>
        )}
      </div>

      {/* TABLE LIST */}
      <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm bg-white mt-4">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left min-w-[900px]">
            <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-xs border-b border-gray-300">
              <tr>
                <th className="px-6 py-4">Metode Pembayaran</th>
                <th className="px-6 py-4">Tujuan Dana</th>
                <th className="px-6 py-4">Potongan</th>
                <th className="px-6 py-4">Dana Masuk</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paymentMethods.map(pm => {
                return (
                  <tr
                    key={pm.id}
                    onClick={() => handleSelectRow(pm)}
                    className={`cursor-pointer transition-colors hover:bg-blue-50 ${selectedId === pm.id ? 'bg-blue-100' : ''}`}
                  >
                    <td className="px-6 py-3 font-bold text-gray-800">{pm.name}</td>
                    <td className="px-6 py-3">
                      <div className="text-gray-900 font-bold">{pm.targetFundName || '-'}</div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-gray-900 font-bold">
                        {pm.discountType === 'PERCENT'
                          ? `${pm.discountValue}%`
                          : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(pm.discountValue)}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-gray-900 font-bold">
                        {pm.settlementType === 'INSTANT' ? 'Langsung' : `Menunggu ${pm.settlementDays} hari`}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold border ${
                          pm.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-300'
                        }`}
                      >
                        {pm.isActive ? 'AKTIF' : 'NON AKTIF'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          requestToggleActive(pm);
                        }}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold border transition-colors ${
                          pm.isActive
                            ? 'bg-white hover:bg-red-50 text-red-600 border-red-200'
                            : 'bg-white hover:bg-green-50 text-green-700 border-green-200'
                        }`}
                        title={pm.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {pm.isActive ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                        {pm.isActive ? 'Nonaktif' : 'Aktif'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION DIALOG */}
      <ConfirmationDialog
        isOpen={confirm.open}
        onCancel={closeConfirm}
        onConfirm={onConfirmAction}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        type={confirm.type}
      />
    </div>
  );
};

export default PaymentMethodTab;