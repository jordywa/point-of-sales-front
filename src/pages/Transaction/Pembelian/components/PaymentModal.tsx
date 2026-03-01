// src/pages/Transaction/Pembelian/components/PaymentModal.tsx

import React, { useState } from "react";
import {
  ArrowLeft,
  ShoppingCart,
  Calculator,
  Building2,
} from "lucide-react";
import type { Supplier } from "../../../../types/index";
import type { ExtendedCartItem, TransactionMode } from "../../../../types/pembelian.types";

interface PaymentModalProps {
  isOpen: boolean;
  cart: ExtendedCartItem[];
  subTotal: number;
  transactionMode: TransactionMode;
  selectedSupplier: Supplier | null;
  currentInvoiceNo: string;
  paymentAmount: number;
  setPaymentAmount: (amount: number) => void;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;
  jatuhTempoDate: string;
  setJatuhTempoDate: (date: string) => void;
  dpAmount: number;
  setDpAmount: (amount: number) => void;
  onClose: () => void;
  onProcessPayment: () => void;
  formatRupiah: (num: number) => string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  cart,
  subTotal,
  transactionMode,
  selectedSupplier,
  currentInvoiceNo,
  paymentAmount,
  setPaymentAmount,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  jatuhTempoDate,
  setJatuhTempoDate,
  dpAmount,
  setDpAmount,
  onClose,
  onProcessPayment,
  formatRupiah,
}) => {
  const [isPaymentNumpadOpen, setIsPaymentNumpadOpen] = useState(false);
  const [paymentNumpadValue, setPaymentNumpadValue] = useState("0");
  const [isDpNumpadOpen, setIsDpNumpadOpen] = useState(false);
  const [dpNumpadValue, setDpNumpadValue] = useState("0");

  if (!isOpen) return null;

  const isHutang = selectedPaymentMethod === "HUTANG";
  const sisaTagihan = isHutang
    ? Math.max(0, subTotal - dpAmount)
    : Math.max(0, subTotal - paymentAmount);
  const kembalian = isHutang ? 0 : Math.max(0, paymentAmount - subTotal);

  // Payment Numpad Handlers
  const handleOpenPaymentNumpad = () => {
    setPaymentNumpadValue("0");
    setIsPaymentNumpadOpen(true);
  };

  const appendPaymentDigit = (digit: string) => {
    setPaymentNumpadValue((prev) => (prev === "0" ? digit : prev + digit));
  };

  const backspacePaymentDigit = () => {
    setPaymentNumpadValue((prev) => {
      const next = prev.slice(0, -1);
      return next === "" ? "0" : next;
    });
  };

  const confirmPaymentNumpad = () => {
    setPaymentAmount(parseInt(paymentNumpadValue));
    setIsPaymentNumpadOpen(false);
    setSelectedPaymentMethod("LAINNYA");
  };

  // DP Numpad Handlers
  const handleOpenDpNumpad = () => {
    setDpNumpadValue(String(dpAmount) || "0");
    setIsDpNumpadOpen(true);
  };

  const appendDpDigit = (digit: string) => {
    setDpNumpadValue((prev) => (prev === "0" ? digit : prev + digit));
  };

  const backspaceDpDigit = () => {
    setDpNumpadValue((prev) => {
      const next = prev.slice(0, -1);
      return next === "" ? "0" : next;
    });
  };

  const confirmDpNumpad = () => {
    const newDp = parseInt(dpNumpadValue) || 0;
    if (newDp > subTotal) {
      alert("DP tidak boleh melebihi total tagihan!");
      return;
    }
    setDpAmount(newDp);
    setIsDpNumpadOpen(false);
  };

  const handleQuickPayment = (methodName: string) => {
    if (methodName === "HUTANG") {
      setPaymentAmount(0);
      setDpAmount(0);
    } else {
      setPaymentAmount(subTotal);
      setDpAmount(0);
    }
    setSelectedPaymentMethod(methodName);
  };

  return (
    <div className="fixed inset-0 z-80 bg-blue-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="h-14 bg-blue-50 flex items-center px-4 border-b border-gray-200">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-gray-700 hover:text-black"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="font-bold text-lg">Pembayaran Pembelian</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden overflow-y-auto">
        {/* LEFT COLUMN - Cart Summary */}
        <div className="w-full lg:w-1/3 bg-white border-b lg:border-r border-gray-300 flex flex-col p-4 shrink-0">
          <div className="border border-black p-2 rounded-sm h-full flex flex-col max-h-[300px] lg:max-h-none overflow-y-auto lg:overflow-visible">
            {/* Header */}
            <div className="relative border-b border-black pb-2 mb-2 h-14 shrink-0">
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-center items-center w-16">
                <div className="border border-black rounded-full p-0.5">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-center leading-none mt-1 truncate w-full">
                  {selectedSupplier?.name}
                </span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <h2 className="text-xl font-bold uppercase">
                  {transactionMode === "KREDIT" ? "PEMBELIAN PO" : "PEMBELIAN"}
                </h2>
              </div>
              <div className="absolute right-0 bottom-0 text-xs font-bold">
                {currentInvoiceNo}
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 text-base font-bold border-b border-gray-200 pb-1 mb-2">
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2">Unit</div>
              <div className="col-span-4">Name</div>
              <div className="col-span-4 text-right">@Harga / Total</div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto min-h-[100px]">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 text-base py-3 border-b border-gray-100 items-center"
                >
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    <span className="font-bold">
                      {item.qty + (item.qtyPO || 0)}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm">{item.unit}</div>
                  <div className="col-span-4 leading-tight font-medium text-sm">
                    {item.name}
                    <div className="text-xs text-gray-400 font-normal">
                      {item.size}
                    </div>
                    {item.note && (
                      <div className="text-[10px] text-gray-500 italic">
                        "{item.note}"
                      </div>
                    )}
                  </div>
                  <div className="col-span-4 text-right text-sm">
                    <div className="text-gray-900 font-medium">
                      {formatRupiah(item.price)}
                    </div>
                    <div className="font-bold text-green-700">
                      {formatRupiah(
                        item.price * (item.qty + (item.qtyPO || 0))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="bg-blue-100 p-3 flex justify-between items-center mt-2 shrink-0">
              <span className="font-bold text-2xl lg:text-3xl uppercase">
                TOTAL
              </span>
              <span className="font-bold text-2xl lg:text-3xl text-green-700">
                {formatRupiah(subTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN - Payment Info */}
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
                <span>Bayar</span>
                {selectedPaymentMethod === "HUTANG" ? (
                  <span className="text-red-500 font-bold">HUTANG</span>
                ) : (
                  <span>{formatRupiah(paymentAmount)}</span>
                )}
              </div>
              {selectedPaymentMethod === "HUTANG" && (
                <>
                  <div className="flex justify-between">
                    <span>DP</span>
                    <span className="font-bold">{formatRupiah(dpAmount)}</span>
                  </div>
                  <div className="flex justify-between text-red-500 font-bold">
                    <span>Sisa Tagihan</span>
                    <span>{formatRupiah(sisaTagihan)}</span>
                  </div>
                </>
              )}
              {selectedPaymentMethod !== "HUTANG" && (
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

        {/* RIGHT COLUMN - Payment Methods */}
        <div className="w-full lg:w-1/3 p-4 lg:p-6 flex flex-col gap-6 bg-white relative pb-32 lg:pb-6">
          <div className="space-y-4">
            {/* TUNAI */}
            <div className="flex items-center gap-4">
              <span className="text-xl lg:text-2xl w-24">TUNAI</span>
              <button
                onClick={() => handleQuickPayment("UANG_PAS")}
                className={`border border-black px-4 py-2 text-lg lg:text-xl w-40 ${
                  selectedPaymentMethod === "UANG_PAS"
                    ? "bg-[#87C3FE]"
                    : "hover:bg-gray-100"
                }`}
              >
                UANG PAS
              </button>
            </div>
            <div className="flex items-center gap-4 pl-0 lg:pl-28">
              <button
                onClick={handleOpenPaymentNumpad}
                className={`border border-black px-4 py-2 text-xl flex items-center gap-2 w-40 ${
                  selectedPaymentMethod === "LAINNYA"
                    ? "bg-[#87C3FE]"
                    : "hover:bg-gray-100"
                }`}
              >
                {selectedPaymentMethod === "LAINNYA" && paymentAmount > 0 ? (
                  formatRupiah(paymentAmount)
                ) : (
                  <>
                    <Calculator className="w-5 h-5" /> Lainnya
                  </>
                )}
              </button>
            </div>

            {/* TRANSFER */}
            <div className="flex items-center gap-4 mt-8">
              <span className="text-xl lg:text-2xl w-24">Transfer</span>
              <button
                onClick={() => handleQuickPayment("TRANSFER")}
                className={`border border-black px-4 py-2 text-lg ${
                  selectedPaymentMethod === "TRANSFER"
                    ? "bg-[#87C3FE]"
                    : "hover:bg-gray-100"
                }`}
              >
                BANK TRANSFER
              </button>
            </div>

            {/* HUTANG */}
            <div className="flex flex-col gap-2 mt-4 border-t border-gray-200 pt-4">
              <div className="flex items-center gap-4">
                <span className="text-xl lg:text-2xl w-24 font-bold text-red-600">
                  HUTANG
                </span>
                <button
                  onClick={() => {
                    setSelectedPaymentMethod("HUTANG");
                    setPaymentAmount(0);
                    setDpAmount(0);
                  }}
                  className={`border border-black px-4 py-2 text-lg w-40 font-bold ${
                    selectedPaymentMethod === "HUTANG"
                      ? "bg-[#87C3FE]"
                      : "hover:bg-gray-100"
                  }`}
                >
                  TEMPO
                </button>
              </div>
              {selectedPaymentMethod === "HUTANG" && (
                <div className="pl-0 lg:pl-28 mt-2 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Tanggal Jatuh Tempo:
                    </label>
                    <input
                      type="date"
                      value={jatuhTempoDate}
                      onChange={(e) => setJatuhTempoDate(e.target.value)}
                      className="w-40 border border-gray-400 rounded px-2 py-1 font-bold text-gray-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Down Payment (DP):
                    </label>
                    <button
                      onClick={handleOpenDpNumpad}
                      className={`border border-black px-4 py-2 text-lg w-40 flex items-center gap-2 ${
                        dpAmount > 0 ? "bg-[#87C3FE]" : "hover:bg-gray-100"
                      }`}
                    >
                      {dpAmount > 0 ? (
                        formatRupiah(dpAmount)
                      ) : (
                        <>
                          <Calculator className="w-5 h-5" /> Input DP
                        </>
                      )}
                    </button>
                    {dpAmount > 0 && (
                      <div className="mt-1 text-xs text-gray-600">
                        Sisa Tagihan: {formatRupiah(subTotal - dpAmount)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Process Button */}
          <div className="lg:absolute lg:bottom-6 lg:right-6 lg:left-6 mt-6 lg:mt-0">
            <button
              onClick={onProcessPayment}
              disabled={
                selectedPaymentMethod !== "HUTANG" && sisaTagihan > 0
              }
              className={`w-full py-4 text-2xl font-bold flex items-center justify-center gap-2 rounded-lg ${
                selectedPaymentMethod !== "HUTANG" && sisaTagihan > 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#87C3FE] text-black hover:bg-blue-400 shadow-lg"
              }`}
            >
              <ShoppingCart className="w-6 h-6" /> Proses Bayar
            </button>
          </div>

          {/* Payment Numpad Overlay */}
          {isPaymentNumpadOpen && (
            <div className="absolute inset-0 bg-white z-20 p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Input Nominal</h3>
                <button
                  onClick={() => setIsPaymentNumpadOpen(false)}
                  className="text-red-500 font-bold"
                >
                  Batal
                </button>
              </div>
              <div className="bg-gray-100 p-4 text-right text-3xl font-bold mb-4 rounded">
                {formatRupiah(parseInt(paymentNumpadValue))}
              </div>
              <div className="grid grid-cols-3 gap-3 flex-1">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                  <button
                    key={d}
                    onClick={() => appendPaymentDigit(d)}
                    className="bg-white border border-gray-300 text-2xl font-bold rounded shadow-sm hover:bg-gray-50"
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={backspacePaymentDigit}
                  className="bg-red-50 border border-red-200 text-2xl font-bold rounded text-red-500"
                >
                  ⌫
                </button>
                <button
                  onClick={() => appendPaymentDigit("0")}
                  className="bg-white border border-gray-300 text-2xl font-bold rounded"
                >
                  0
                </button>
                <button
                  onClick={confirmPaymentNumpad}
                  className="bg-green-500 text-white text-2xl font-bold rounded"
                >
                  OK
                </button>
              </div>
            </div>
          )}

          {/* DP Numpad Overlay */}
          {isDpNumpadOpen && (
            <div className="absolute inset-0 bg-white z-20 p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Input Down Payment (DP)</h3>
                <button
                  onClick={() => setIsDpNumpadOpen(false)}
                  className="text-red-500 font-bold"
                >
                  Batal
                </button>
              </div>
              <div className="bg-gray-100 p-4 text-right text-3xl font-bold mb-4 rounded">
                {formatRupiah(parseInt(dpNumpadValue))}
              </div>
              <div className="mb-2 text-sm text-gray-600">
                Total Tagihan: {formatRupiah(subTotal)}
              </div>
              <div className="grid grid-cols-3 gap-3 flex-1">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                  <button
                    key={d}
                    onClick={() => appendDpDigit(d)}
                    className="bg-white border border-gray-300 text-2xl font-bold rounded shadow-sm hover:bg-gray-50"
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={backspaceDpDigit}
                  className="bg-red-50 border border-red-200 text-2xl font-bold rounded text-red-500"
                >
                  ⌫
                </button>
                <button
                  onClick={() => appendDpDigit("0")}
                  className="bg-white border border-gray-300 text-2xl font-bold rounded"
                >
                  0
                </button>
                <button
                  onClick={confirmDpNumpad}
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