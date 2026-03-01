// src/pages/Transaction/Kasir/components/PaymentModal.tsx

import React from 'react';
import { ArrowLeft, User, ShoppingCart, Calculator, QrCode } from 'lucide-react';
import type { CartItem, Customer } from '../../../../types/index';

interface ExtendedCartItem extends CartItem {
  qtyPO?: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  cart: ExtendedCartItem[];
  subTotal: number;
  transactionMode: 'SALES' | 'PO';
  selectedCustomer: Customer | null;
  currentInvoiceNo: string;
  paymentAmount: number;
  selectedPaymentMethod: string;
  sisaTagihan: number;
  kembalian: number;
  isPaymentNumpadOpen: boolean;
  paymentNumpadValue: string;
  onClose: () => void;
  onOpenPaymentNumpad: () => void;
  onAppendPaymentDigit: (digit: string) => void;
  onBackspacePaymentDigit: () => void;
  onConfirmPaymentNumpad: () => void;
  onClosePaymentNumpad: () => void;
  onQuickPayment: (method: string) => void;
  onProcessPayment: () => void;
  formatRupiah: (num: number) => string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  cart,
  subTotal,
  transactionMode,
  selectedCustomer,
  currentInvoiceNo,
  paymentAmount,
  selectedPaymentMethod,
  sisaTagihan,
  kembalian,
  isPaymentNumpadOpen,
  paymentNumpadValue,
  onClose,
  onOpenPaymentNumpad,
  onAppendPaymentDigit,
  onBackspacePaymentDigit,
  onConfirmPaymentNumpad,
  onClosePaymentNumpad,
  onQuickPayment,
  onProcessPayment,
  formatRupiah,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-80 bg-blue-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="h-14 bg-blue-50 flex items-center px-4 border-b border-gray-200">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-gray-700 hover:text-black"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="font-bold text-lg">Rincian Pembayaran</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden overflow-y-auto">

        {/* KOLOM KIRI: Rincian Belanja */}
        <div className="w-full lg:w-1/3 bg-white border-b lg:border-r border-gray-300 flex flex-col p-4 shrink-0">
          <div className="border border-black p-2 rounded-sm h-full flex flex-col max-h-[300px] lg:max-h-none overflow-y-auto lg:overflow-visible">

            {/* Header Modal */}
            <div className="relative border-b border-black pb-2 mb-2 h-14 shrink-0">
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-center items-center w-16">
                <div className="border border-black rounded-full p-0.5">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-center leading-none mt-1 truncate w-full">
                  {selectedCustomer?.name}
                </span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <h2 className="text-xl font-bold uppercase">
                  {transactionMode === 'PO' ? 'PENJUALAN KREDIT' : 'PENJUALAN'}
                </h2>
              </div>
              <div className="absolute right-0 bottom-0 text-xs font-bold">
                {currentInvoiceNo}
              </div>
            </div>

            {/* Header Tabel */}
            <div className="grid grid-cols-12 text-base font-bold border-b border-gray-200 pb-1 mb-2">
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2">Unit</div>
              <div className="col-span-4">Name</div>
              <div className="col-span-4 text-right">@Harga / Total</div>
            </div>

            {/* Item List */}
            <div className="flex-1 overflow-y-auto min-h-[100px]">
              {cart.map(item => (
                <div key={item.id} className="grid grid-cols-12 text-base py-3 border-b border-gray-100 items-center">
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    <span className="font-bold">{item.qty + (item.qtyPO || 0)}</span>
                  </div>
                  <div className="col-span-2 text-sm">{item.unit}</div>
                  <div className="col-span-4 leading-tight font-medium text-sm">
                    {item.name}
                    <div className="text-xs text-gray-400 font-normal">{item.size}</div>
                    {item.note && (
                      <div className="text-[10px] text-gray-500 italic">"{item.note}"</div>
                    )}
                  </div>
                  <div className="col-span-4 text-right text-sm">
                    <div className="text-gray-900 font-medium">{formatRupiah(item.price)}</div>
                    <div className="font-bold text-green-700">
                      {formatRupiah(item.price * (item.qty + (item.qtyPO || 0)))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="bg-blue-100 p-3 flex justify-between items-center mt-2 shrink-0">
              <span className="font-bold text-2xl lg:text-3xl uppercase">TOTAL</span>
              <span className="font-bold text-2xl lg:text-3xl text-green-700">
                {formatRupiah(subTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* KOLOM TENGAH: Info Tagihan */}
        <div className="w-full lg:w-1/3 p-4 lg:p-6 flex flex-col justify-between border-b lg:border-r border-gray-300">
          <div className="border border-gray-300 shadow-sm">
            <div className="bg-[#87C3FE] p-4 text-2xl font-bold text-black border-b border-gray-300">
              Pembayaran
            </div>
            <div className="bg-white p-6 space-y-6 text-xl">
              <div className="flex justify-between">
                <span>Tagihan</span>
                <span>{formatRupiah(subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pembayaran</span>
                {selectedPaymentMethod === 'HUTANG' ? (
                  <span className="text-red-500 font-bold">HUTANG</span>
                ) : (
                  <span>{formatRupiah(paymentAmount)}</span>
                )}
              </div>
              {selectedPaymentMethod !== 'HUTANG' && (
                <>
                  <div className="flex justify-between text-red-500 font-bold">
                    <span>Sisa</span>
                    <span>{formatRupiah(sisaTagihan)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kembalian</span>
                    <span>{formatRupiah(kembalian)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Metode Pembayaran */}
        <div className="w-full lg:w-1/3 p-4 lg:p-6 flex flex-col gap-6 bg-white relative pb-32 lg:pb-6">
          <div className="space-y-4">
            {/* Tunai - Uang Pas */}
            <div className="flex items-center gap-4">
              <span className="text-xl lg:text-2xl w-24">TUNAI</span>
              <button
                onClick={() => onQuickPayment('UANG_PAS')}
                className={`border border-black px-4 py-2 text-lg lg:text-xl w-40 ${
                  selectedPaymentMethod === 'UANG_PAS' ? 'bg-[#87C3FE]' : 'hover:bg-gray-100'
                }`}
              >
                UANG PAS
              </button>
            </div>

            {/* Tunai - Lainnya */}
            <div className="flex items-center gap-4 pl-0 lg:pl-28">
              <button
                onClick={onOpenPaymentNumpad}
                className={`border border-black px-4 py-2 text-xl flex items-center gap-2 w-40 ${
                  selectedPaymentMethod === 'LAINNYA' ? 'bg-[#87C3FE]' : 'hover:bg-gray-100'
                }`}
              >
                {selectedPaymentMethod === 'LAINNYA' && paymentAmount > 0 ? (
                  formatRupiah(paymentAmount)
                ) : (
                  <><Calculator className="w-5 h-5" /> Lainnya</>
                )}
              </button>
            </div>

            {/* QRIS */}
            <div className="flex items-center gap-4 mt-8">
              <span className="text-xl lg:text-2xl w-24">Qris</span>
              <button
                onClick={() => onQuickPayment('QRIS')}
                className={`border border-black px-2 py-1 ${
                  selectedPaymentMethod === 'QRIS' ? 'bg-[#87C3FE]' : 'hover:bg-gray-100'
                }`}
              >
                <QrCode className="w-10 h-8" />
              </button>
            </div>
          </div>

          {/* Proses Bayar Button */}
          <div className="lg:absolute lg:bottom-6 lg:right-6 lg:left-6 mt-6 lg:mt-0">
            <button
              onClick={onProcessPayment}
              disabled={selectedPaymentMethod !== 'HUTANG' && sisaTagihan > 0}
              className={`w-full py-4 text-2xl font-bold flex items-center justify-center gap-2 rounded-lg ${
                selectedPaymentMethod !== 'HUTANG' && sisaTagihan > 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#87C3FE] text-black hover:bg-blue-400 shadow-lg'
              }`}
            >
              <ShoppingCart className="w-6 h-6" /> Proses Bayar
            </button>
          </div>

          {/* Payment Numpad Overlay */}
          {isPaymentNumpadOpen && (
            <div className="absolute inset-0 bg-white z-20 p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Input Uang Tunai</h3>
                <button onClick={onClosePaymentNumpad} className="text-red-500 font-bold">
                  Batal
                </button>
              </div>
              <div className="bg-gray-100 p-4 text-right text-3xl font-bold mb-4 rounded">
                {formatRupiah(parseInt(paymentNumpadValue))}
              </div>
              <div className="grid grid-cols-3 gap-3 flex-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                  <button
                    key={d}
                    onClick={() => onAppendPaymentDigit(d)}
                    className="bg-white border border-gray-300 text-2xl font-bold rounded shadow-sm hover:bg-gray-50"
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={onBackspacePaymentDigit}
                  className="bg-red-50 border border-red-200 text-2xl font-bold rounded text-red-500"
                >
                  ⌫
                </button>
                <button
                  onClick={() => onAppendPaymentDigit('0')}
                  className="bg-white border border-gray-300 text-2xl font-bold rounded"
                >
                  0
                </button>
                <button
                  onClick={onConfirmPaymentNumpad}
                  className="bg-green-500 text-white text-2xl font-bold rounded"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
