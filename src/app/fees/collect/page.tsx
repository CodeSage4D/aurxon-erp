'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import {
  CreditCard,
  Receipt,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Printer,
  DollarSign,
  User,
  Building,
  Calendar,
  ShieldCheck,
  RefreshCw,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';

interface FeeAllocation {
  id: string;
  studentId: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    contactPhone?: string;
    email?: string;
    section?: {
      name: string;
      classLevel?: { name: string };
    };
  };
  feeStructure: {
    id: string;
    name: string;
    feeHeads?: Array<{ name: string; amount: number }>;
  };
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
}

export default function FeeCollectionTerminalPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [allocations, setAllocations] = useState<FeeAllocation[]>([]);
  const [selectedAlloc, setSelectedAlloc] = useState<FeeAllocation | null>(null);

  // Payment Form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'UPI' | 'CASH' | 'NET_BANKING' | 'CARD' | 'CHEQUE'>('UPI');
  const [payRef, setPayRef] = useState('');
  const [payRemarks, setPayRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const [meRes, feeRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/fees'),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.user);
        } else {
          router.replace('/login');
          return;
        }

        if (feeRes.ok) {
          const feeData = await feeRes.json();
          setAllocations(feeData.allocations || []);
        }
      } catch (err) {
        console.error('Failed to initialize fee terminal:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const filteredAllocations = allocations.filter((alloc) => {
    if (!alloc.student) return false;
    const name = `${alloc.student.firstName} ${alloc.student.lastName}`.toLowerCase();
    const adm = (alloc.student.admissionNumber || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    if (!q) return alloc.balanceAmount > 0;
    return name.includes(q) || adm.includes(q);
  });

  const handleSelectStudent = (alloc: FeeAllocation) => {
    setSelectedAlloc(alloc);
    setPayAmount(alloc.balanceAmount);
    setPayRef('');
    setPayRemarks('');
    setSuccessReceipt(null);
    setErrorMessage('');
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlloc) return;
    if (payAmount <= 0) {
      setErrorMessage('Payment amount must be greater than zero.');
      return;
    }
    if (payAmount > selectedAlloc.balanceAmount) {
      setErrorMessage(`Payment amount cannot exceed outstanding balance of ₹${selectedAlloc.balanceAmount.toLocaleString('en-IN')}`);
      return;
    }

    setProcessing(true);
    setErrorMessage('');
    setSuccessReceipt(null);

    try {
      const res = await fetch('/api/v1/fees/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocationId: selectedAlloc.id,
          amount: Number(payAmount),
          paymentMethod: payMethod,
          transactionRef: payRef || undefined,
          remarks: payRemarks || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessReceipt(json.payment);
        // Update local allocation state
        setAllocations((prev) =>
          prev.map((a) =>
            a.id === selectedAlloc.id
              ? {
                  ...a,
                  paidAmount: a.paidAmount + Number(payAmount),
                  balanceAmount: a.balanceAmount - Number(payAmount),
                  status: a.balanceAmount - Number(payAmount) <= 0 ? 'PAID' : 'PARTIAL',
                }
              : a
          )
        );
        setSelectedAlloc((prev) =>
          prev
            ? {
                ...prev,
                paidAmount: prev.paidAmount + Number(payAmount),
                balanceAmount: prev.balanceAmount - Number(payAmount),
                status: prev.balanceAmount - Number(payAmount) <= 0 ? 'PAID' : 'PARTIAL',
              }
            : null
        );
      } else {
        setErrorMessage(json.error || 'Failed to collect payment. Please verify transaction details.');
      }
    } catch {
      setErrorMessage('Network error while processing payment. Please check your connection.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-500 font-medium">Loading Fee Collection Terminal...</div>
      </div>
    );
  }

  return (
    <AppShell user={user || { id: '', name: 'Bursar', email: '', role: 'ACCOUNTANT', organizationName: 'AURXON' }}>
      <div className="min-h-screen bg-slate-50/70 pb-16">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#192D55] via-[#2270AF] to-[#0284c7] text-white pt-7 pb-12 px-6 sm:px-8 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Link
                  href="/fees"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Fee Management
                </Link>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  Point of Collection (PoS)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Fee Collection & Cashier Terminal
              </h1>
              <p className="text-blue-100 text-sm mt-1 max-w-2xl">
                Real-time fee reconciliation, automated receipt dispatch, atomic double-entry ledger posting, and instant printouts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/fees"
                className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2.5 rounded-xl border border-white/20 backdrop-blur-sm transition-all flex items-center gap-2 text-sm"
              >
                <FileText className="w-4 h-4" />
                Ledger Statements
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 -mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Student Selection & Search */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Select Student Account
                  </h2>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                    {filteredAllocations.length} dues pending
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by student name or admission no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                </div>

                <div className="mt-3 space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {filteredAllocations.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                      No matching student fee accounts found.
                    </div>
                  ) : (
                    filteredAllocations.map((alloc) => {
                      const isSelected = selectedAlloc?.id === alloc.id;
                      return (
                        <div
                          key={alloc.id}
                          onClick={() => handleSelectStudent(alloc)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-500 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm truncate">
                                {alloc.student.firstName} {alloc.student.lastName}
                              </span>
                              <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {alloc.student.admissionNumber}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {alloc.feeStructure.name}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-extrabold text-red-600">
                              ₹{alloc.balanceAmount.toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              {alloc.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Collection Form / Receipt Viewer */}
            <div className="lg:col-span-7">
              {selectedAlloc ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                        Active Fee Transaction
                      </span>
                      <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                        {selectedAlloc.student.firstName} {selectedAlloc.student.lastName}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>Adm #: {selectedAlloc.student.admissionNumber}</span>
                        <span>•</span>
                        <span>{selectedAlloc.feeStructure.name}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500">Total Outstanding</div>
                      <div className="text-xl font-black text-red-600">
                        ₹{selectedAlloc.balanceAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Payment Notification States */}
                  {successReceipt && (
                    <div className="p-5 bg-emerald-50 border-b border-emerald-200 text-emerald-900">
                      <div className="flex items-center gap-2 font-bold text-emerald-800 mb-1">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        Fee Collected Successfully!
                      </div>
                      <p className="text-xs text-emerald-700">
                        Receipt <strong>{successReceipt.receiptNumber}</strong> generated for ₹{successReceipt.amount.toLocaleString('en-IN')}.
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print Official Receipt
                        </button>
                        <button
                          type="button"
                          onClick={() => setSuccessReceipt(null)}
                          className="bg-white text-slate-700 hover:bg-slate-100 text-xs font-medium px-3.5 py-2 rounded-lg border border-slate-200"
                        >
                          Collect Next Installment
                        </button>
                      </div>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Payment Form */}
                  <form onSubmit={handleProcessPayment} className="p-6 space-y-5">
                    {/* Amount Input */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                        Amount to Collect (₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          required
                          min={1}
                          max={selectedAlloc.balanceAmount}
                          value={payAmount}
                          onChange={(e) => setPayAmount(Number(e.target.value))}
                          className="w-full pl-8 pr-4 py-3 text-lg font-extrabold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                        <span>Max Payable: ₹{selectedAlloc.balanceAmount.toLocaleString('en-IN')}</span>
                        <button
                          type="button"
                          onClick={() => setPayAmount(selectedAlloc.balanceAmount)}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          Pay Full Balance
                        </button>
                      </div>
                    </div>

                    {/* Payment Mode Selection */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                        Payment Mode *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          { key: 'UPI', label: 'UPI / QR' },
                          { key: 'CASH', label: 'Cash Desk' },
                          { key: 'NET_BANKING', label: 'Net Banking' },
                          { key: 'CARD', label: 'Card (PoS)' },
                          { key: 'CHEQUE', label: 'Cheque / DD' },
                        ].map((m) => (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => setPayMethod(m.key as any)}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                              payMethod === m.key
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Transaction Reference */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                        Transaction Reference / UTR / Cheque Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. UPI-1234567890 or Cheque #987654"
                        value={payRef}
                        onChange={(e) => setPayRef(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Remarks */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                        Cashier Notes / Remarks
                      </label>
                      <input
                        type="text"
                        placeholder="Optional remarks (e.g. Paid by Mother at Counter 2)"
                        value={payRemarks}
                        onChange={(e) => setPayRemarks(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedAlloc(null)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={processing || payAmount <= 0}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm"
                      >
                        <CreditCard className="w-4 h-4" />
                        {processing ? 'Processing Transaction...' : `Confirm & Collect ₹${payAmount.toLocaleString('en-IN')}`}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">No Student Selected</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Select a student from the pending dues list on the left to initiate fee collection, generate computer-signed receipts, and post ledger entries.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
