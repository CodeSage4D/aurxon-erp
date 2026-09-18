'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import DataTable, { Column } from '@/components/ui/DataTable';
import MetricCard from '@/components/ui/MetricCard';
import Drawer from '@/components/ui/Drawer';
import Badge from '@/components/ui/Badge';
import {
  DollarSign,
  Receipt,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  CreditCard,
  Building,
  User,
  Printer,
  Download,
  X,
  ExternalLink,
} from 'lucide-react';

function numberToWords(num: number): string {
  if (!num || num <= 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertChunk(n: number): string {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ';
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '') + ' ';
    return a[Math.floor(n / 100)] + ' Hundred ' + (n % 100 !== 0 ? convertChunk(n % 100) : '');
  }

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = Math.floor(num % 1000);

  let result = '';
  if (crore > 0) result += convertChunk(crore) + 'Crore ';
  if (lakh > 0) result += convertChunk(lakh) + 'Lakh ';
  if (thousand > 0) result += convertChunk(thousand) + 'Thousand ';
  if (remainder > 0) result += convertChunk(remainder);

  return `Rupees ${result.trim()} Only`;
}

export default function FeesPage() {
  const [user, setUser] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [structures, setStructures] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fee Receipt Print State
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<any>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Collect Payment Drawer
  const [collectDrawerOpen, setCollectDrawerOpen] = useState(false);
  const [selectedAlloc, setSelectedAlloc] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'CASH' | 'UPI' | 'NET_BANKING' | 'CHEQUE' | 'CARD'>('UPI');
  const [payRef, setPayRef] = useState('');
  const [payRemarks, setPayRemarks] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [collectSuccess, setCollectSuccess] = useState('');
  const [collectError, setCollectError] = useState('');

  const loadFeeData = async () => {
    try {
      const res = await fetch('/api/v1/fees');
      if (res.ok) {
        const json = await res.json();
        setMetrics(json.metrics);
        setStructures(json.structures || []);
        setAllocations(json.allocations || []);
        setPayments(json.payments || []);
        if (json.organization) setOrganization(json.organization);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const [meRes, feeRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/fees'),
        ]);

        if (meRes.ok) {
          const meJson = await meRes.json();
          setUser(meJson.user);
        } else {
          window.location.href = '/login';
          return;
        }

        if (feeRes.ok) {
          const feeJson = await feeRes.json();
          setMetrics(feeJson.metrics);
          setStructures(feeJson.structures || []);
          setAllocations(feeJson.allocations || []);
          setPayments(feeJson.payments || []);
          if (feeJson.organization) setOrganization(feeJson.organization);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const openCollectDrawer = (alloc: any) => {
    setSelectedAlloc(alloc);
    setPayAmount(alloc.balanceAmount);
    setPayRef('');
    setPayRemarks('');
    setCollectSuccess('');
    setCollectError('');
    setCollectDrawerOpen(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlloc) return;
    setCollecting(true);
    setCollectError('');
    setCollectSuccess('');

    try {
      const res = await fetch('/api/v1/fees/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocationId: selectedAlloc.id,
          amount: Number(payAmount),
          paymentMethod: payMethod,
          transactionRef: payRef,
          remarks: payRemarks,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setCollectError(json.error || 'Failed to collect payment');
        setCollecting(false);
        return;
      }

      setCollectSuccess(`Payment recorded! Receipt: ${json.payment.receiptNumber}`);
      if (json.payment) {
        setSelectedPaymentForReceipt({
          ...json.payment,
          student: selectedAlloc.student,
          allocation: selectedAlloc,
        });
      }
      await loadFeeData();
    } catch {
      setCollectError('Network error while processing payment');
    } finally {
      setCollecting(false);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'admissionNumber',
      header: 'Admission No',
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
          {row.student.admissionNumber}
        </span>
      ),
    },
    {
      key: 'studentName',
      header: 'Student Name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.student.firstName} {row.student.lastName}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {row.student.section ? `${row.student.section.classLevel?.name} - ${row.student.section.name}` : (row.student.batch?.name || '')}
          </div>
        </div>
      ),
    },
    {
      key: 'feeStructure',
      header: 'Fee Structure',
      render: (row) => <span style={{ fontSize: '13px' }}>{row.feeStructure.name}</span>,
    },
    {
      key: 'netAmount',
      header: 'Total Payable',
      render: (row) => <span>₹{row.netAmount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'paidAmount',
      header: 'Paid Amount',
      render: (row) => <span style={{ color: '#059669', fontWeight: 600 }}>₹{row.paidAmount.toLocaleString('en-IN')}</span>,
    },
    {
      key: 'balanceAmount',
      header: 'Outstanding Balance',
      render: (row) => (
        <span style={{ color: row.balanceAmount > 0 ? '#dc2626' : '#059669', fontWeight: 700 }}>
          ₹{row.balanceAmount.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'PAID' ? 'success' : row.status === 'PARTIAL' ? 'warning' : 'danger'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        row.balanceAmount > 0 ? (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => openCollectDrawer(row)}
          >
            Collect Fee
          </button>
        ) : (
          <Badge variant="neutral">Cleared</Badge>
        )
      ),
    },
  ];

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading Fees & Billing Hub...</div>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="page-container">
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="page-title">Fees & Revenue Management</h1>
            <p className="page-subtitle">
              Fee schedules, student ledger accounts, payment collections, and official printable receipts
            </p>
          </div>
          <Link
            href="/fees/collect"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 700 }}
          >
            <CreditCard size={16} />
            <span>Open Collection Terminal</span>
          </Link>
        </div>

        {/* Top Metric Cards */}
        {metrics && (
          <div className="metric-grid">
            <MetricCard
              label="Expected Fee Revenue"
              value={`₹${metrics.totalGross.toLocaleString('en-IN')}`}
              subtext="Academic Session Inflow"
              icon={<DollarSign size={20} />}
            />
            <MetricCard
              label="Collected Revenue"
              value={`₹${metrics.totalCollected.toLocaleString('en-IN')}`}
              subtext="Deposited to Ledger"
              icon={<CheckCircle2 size={20} />}
              trend={{ value: `${metrics.collectionRate}% Rate`, isUp: true, isUpwardPositive: true }}
            />
            <MetricCard
              label="Outstanding Dues"
              value={`₹${metrics.totalOutstanding.toLocaleString('en-IN')}`}
              subtext="Uncollected Receivables"
              icon={<AlertCircle size={20} />}
              trend={{ value: 'Pending', isUp: false, isUpwardPositive: false }}
            />
          </div>
        )}

        {/* Student Fee Ledger Table */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Student Fee Accounts & Dues</h2>
          </div>

          <DataTable
            columns={columns}
            data={allocations}
            searchPlaceholder="Search student name or admission number..."
            searchKey={(r) => `${r.student.firstName} ${r.student.lastName} ${r.student.admissionNumber}`}
          />
        </div>

        {/* Recent Payment Receipts */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Payment Receipts & Transactions</h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt Number</th>
                  <th>Student Name</th>
                  <th>Fee Category</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Reference / Cheque</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                      {p.receiptNumber}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {p.student.firstName} {p.student.lastName}
                    </td>
                    <td style={{ fontSize: '13px' }}>{p.allocation?.feeStructure?.name || 'Academic Fee'}</td>
                    <td style={{ fontWeight: 700, color: '#059669' }}>
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <Badge variant="info">{p.paymentMethod}</Badge>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {p.transactionRef || 'Counter Payment'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          padding: '5px 11px',
                          backgroundColor: '#f0f9ff',
                          color: '#0284c7',
                          borderColor: '#bae6fd',
                          fontWeight: 600,
                        }}
                        onClick={() => {
                          setSelectedPaymentForReceipt(p);
                          setReceiptModalOpen(true);
                        }}
                      >
                        <Printer size={13} />
                        <span>Print Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* -------------------------------------------------------------
            COLLECT PAYMENT SLIDE-OVER DRAWER
           ------------------------------------------------------------- */}
        <Drawer
          isOpen={collectDrawerOpen}
          onClose={() => setCollectDrawerOpen(false)}
          title="Collect Fee Payment"
          subtitle={selectedAlloc ? `Student: ${selectedAlloc.student.firstName} ${selectedAlloc.student.lastName} (${selectedAlloc.student.admissionNumber})` : ''}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setCollectDrawerOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleProcessPayment}
                disabled={collecting || payAmount <= 0}
              >
                {collecting ? 'Processing Transaction...' : 'Confirm Payment & Issue Receipt'}
              </button>
            </>
          }
        >
          {selectedAlloc && (
            <form onSubmit={handleProcessPayment}>
              {collectSuccess && (
                <div style={{ padding: '14px', backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <CheckCircle2 size={16} />
                    <span>{collectSuccess}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px' }}
                    onClick={() => {
                      setCollectDrawerOpen(false);
                      setReceiptModalOpen(true);
                    }}
                  >
                    <Printer size={13} />
                    <span>View & Print Official Receipt</span>
                  </button>
                </div>
              )}
              {collectError && (
                <div style={{ padding: '12px 14px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                  {collectError}
                </div>
              )}

              {/* Outstanding Balance Banner */}
              <div style={{ padding: '16px', backgroundColor: 'var(--surface-subtle)', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Fee Structure:</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{selectedAlloc.feeStructure.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Net Fee:</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>₹{selectedAlloc.netAmount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Already Paid:</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>₹{selectedAlloc.paidAmount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>Current Balance Due:</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>₹{selectedAlloc.balanceAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedAlloc.balanceAmount}
                  className="form-input"
                  style={{ fontSize: '16px', fontWeight: 700 }}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Mode *</label>
                <select
                  className="form-select"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="CASH">Cash Counter Payment</option>
                  <option value="NET_BANKING">Net Banking (NEFT / RTGS / IMPS)</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="CHEQUE">Bank Cheque / Demand Draft</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Transaction Reference / UTR / Cheque Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. UPI Ref # or Bank Cheque No"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cashier Remarks</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  placeholder="Optional remarks (e.g. Second installment paid by father)"
                />
              </div>
            </form>
          )}
        </Drawer>

        {/* -------------------------------------------------------------
            FORMAL PRINTABLE FEE RECEIPT MODAL WITH UPLOADED LOGO
           ------------------------------------------------------------- */}
        {receiptModalOpen && selectedPaymentForReceipt && (
          <div
            className="receipt-modal-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '840px',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '92vh',
                overflow: 'hidden',
              }}
            >
              {/* Modal Top Controls (Hidden in Print) */}
              <div
                className="no-print"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 24px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  borderBottom: '1px solid #1e293b',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Receipt size={20} style={{ color: '#38bdf8' }} />
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>
                    Official Fee Receipt — {selectedPaymentForReceipt.receiptNumber}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
                    }}
                  >
                    <Printer size={15} />
                    <span>Print Receipt / PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReceiptModalOpen(false)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      color: '#94a3b8',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Scrollable Receipt Body */}
              <div style={{ overflowY: 'auto', padding: '24px' }}>
                <div
                  id="printable-fee-receipt"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    border: '2px solid #0f172a',
                    borderRadius: '8px',
                    padding: '24px',
                    fontFamily: 'var(--font-sans, Arial, sans-serif)',
                  }}
                >
                  {/* Receipt Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      borderBottom: '2px solid #0f172a',
                      paddingBottom: '16px',
                    }}
                  >
                    {/* School / Organization Logo */}
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {organization?.logoUrl ? (
                        <img
                          src={organization.logoUrl}
                          alt={organization?.name || 'School Crest'}
                          style={{
                            maxWidth: '80px',
                            maxHeight: '80px',
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        /* High-Definition Crisp Vector Emblem */
                        <svg width="76" height="76" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="50" cy="50" r="46" fill="#192D55" stroke="#F7E223" strokeWidth="4" />
                          <path d="M50 16 L76 30 L76 60 C76 75 50 86 50 86 C50 86 24 75 24 60 L24 30 Z" fill="#2270AF" stroke="#F7E223" strokeWidth="2" />
                          <circle cx="50" cy="44" r="12" fill="#F7E223" />
                          <text x="50" y="48" fontFamily="Arial" fontSize="10" fontWeight="bold" fill="#192D55" textAnchor="middle">
                            AURXON
                          </text>
                          <path d="M38 68 L50 62 L62 68 L50 65 Z" fill="#F7E223" />
                        </svg>
                      )}
                    </div>

                    {/* School Details */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <h1
                        style={{
                          fontSize: '20px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: '#192D55',
                          letterSpacing: '-0.01em',
                          margin: 0,
                        }}
                      >
                        {organization?.name || 'AURXON EDUCATIONAL INSTITUTION'}
                      </h1>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#2270AF', marginTop: '2px' }}>
                        {organization?.institutions?.[0]?.name || 'Senior Secondary Wing'} • {organization?.institutions?.[0]?.board || 'CBSE'} AFFILIATED
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                        Campus: {organization?.institutions?.[0]?.branches?.[0]?.name || 'Main Campus'}, {organization?.institutions?.[0]?.city || 'Indore'}, {organization?.institutions?.[0]?.state || 'Madhya Pradesh'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px' }}>
                        Affiliation No: {organization?.code}-CBSE-2025 • U-DISE Code: 23260100412 • Email: accounts@{organization?.code?.toLowerCase() || 'school'}.edu
                      </div>
                    </div>

                    {/* Copy Box */}
                    <div
                      style={{
                        border: '2px solid #192D55',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        textAlign: 'center',
                        backgroundColor: '#f8fafc',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        FEE VOUCHER
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#192D55' }}>
                        STUDENT COPY
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
                        PAID & SETTLED
                      </div>
                    </div>
                  </div>

                  {/* Ribbon */}
                  <div
                    style={{
                      textAlign: 'center',
                      backgroundColor: '#192D55',
                      color: '#ffffff',
                      padding: '5px',
                      margin: '12px 0 16px',
                      borderRadius: '4px',
                      fontWeight: 800,
                      fontSize: '12px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    FEE PAYMENT RECEIPT / ACKNOWLEDGEMENT (2025 - 2026)
                  </div>

                  {/* Metadata 2-Column Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr',
                      gap: '12px 24px',
                      fontSize: '12px',
                      backgroundColor: '#f8fafc',
                      padding: '14px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <div style={{ marginBottom: '5px' }}>
                        <span style={{ color: '#64748b' }}>Receipt Number: </span>
                        <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                          {selectedPaymentForReceipt.receiptNumber}
                        </strong>
                      </div>
                      <div style={{ marginBottom: '5px' }}>
                        <span style={{ color: '#64748b' }}>Student Name: </span>
                        <strong style={{ color: '#0f172a' }}>
                          {selectedPaymentForReceipt.student?.firstName} {selectedPaymentForReceipt.student?.lastName}
                        </strong>
                      </div>
                      <div style={{ marginBottom: '5px' }}>
                        <span style={{ color: '#64748b' }}>Admission (UID) No: </span>
                        <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                          {selectedPaymentForReceipt.student?.admissionNumber}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Class & Section: </span>
                        <strong style={{ color: '#0f172a' }}>
                          {selectedPaymentForReceipt.student?.section
                            ? `${selectedPaymentForReceipt.student.section.classLevel?.name || 'Class 10'} - ${selectedPaymentForReceipt.student.section.name || 'A'}`
                            : (selectedPaymentForReceipt.student?.batch?.name || 'Academic Batch')}
                        </strong>
                        {selectedPaymentForReceipt.student?.rollNumber && (
                          <span style={{ color: '#64748b', marginLeft: '10px' }}>
                            Roll No: <strong style={{ color: '#0f172a' }}>{selectedPaymentForReceipt.student.rollNumber}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div style={{ marginBottom: '5px' }}>
                        <span style={{ color: '#64748b' }}>Receipt Date: </span>
                        <strong style={{ color: '#0f172a' }}>
                          {new Date(selectedPaymentForReceipt.paymentDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </strong>
                      </div>
                      <div style={{ marginBottom: '5px' }}>
                        <span style={{ color: '#64748b' }}>Parent / Guardian: </span>
                        <strong style={{ color: '#0f172a' }}>
                          {selectedPaymentForReceipt.student?.studentParents?.[0]?.parent
                            ? `${selectedPaymentForReceipt.student.studentParents[0].parent.firstName} ${selectedPaymentForReceipt.student.studentParents[0].parent.lastName}`
                            : 'Guardian on Record'}
                        </strong>
                      </div>
                      <div style={{ marginBottom: '5px' }}>
                        <span style={{ color: '#64748b' }}>Payment Mode: </span>
                        <strong style={{ color: '#059669' }}>
                          {selectedPaymentForReceipt.paymentMethod}
                        </strong>
                        <span style={{ color: '#64748b', marginLeft: '8px' }}>
                          Ref: <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedPaymentForReceipt.transactionRef || 'Counter Cash'}</span>
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Fee Category: </span>
                        <strong style={{ color: '#0f172a' }}>
                          {selectedPaymentForReceipt.allocation?.feeStructure?.name || 'Annual Academic Fee'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Fee Items Table */}
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '12px',
                      marginBottom: '16px',
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #0f172a', borderBottom: '1px solid #0f172a' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', width: '40px' }}>#</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Particulars / Fee Component</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', width: '120px' }}>Period / Term</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', width: '120px' }}>Total Due (₹)</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', width: '140px' }}>Paid Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPaymentForReceipt.allocation?.feeStructure?.feeHeads && selectedPaymentForReceipt.allocation.feeStructure.feeHeads.length > 0 ? (
                        selectedPaymentForReceipt.allocation.feeStructure.feeHeads.map((head: any, idx: number) => (
                          <tr key={head.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '8px 10px' }}>{idx + 1}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 600 }}>{head.title || head.name}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b', textTransform: 'capitalize' }}>
                              {head.frequency ? head.frequency.toLowerCase().replace('_', ' ') : 'Annual'}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{head.amount?.toLocaleString('en-IN') || '0'}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>
                              ₹{head.amount?.toLocaleString('en-IN') || '0'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px 10px' }}>1</td>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                            {selectedPaymentForReceipt.allocation?.feeStructure?.name || 'Academic Tuition & Institutional Dues'}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>Academic Year 2025-26</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                            ₹{selectedPaymentForReceipt.allocation?.netAmount?.toLocaleString('en-IN') || selectedPaymentForReceipt.amount.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>
                            ₹{selectedPaymentForReceipt.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}

                      {/* Total Row */}
                      <tr style={{ borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a', backgroundColor: '#f8fafc' }}>
                        <td colSpan={3} style={{ padding: '10px', fontWeight: 800, textAlign: 'right' }}>
                          NET AMOUNT COLLECTED:
                        </td>
                        <td colSpan={2} style={{ padding: '10px', fontWeight: 800, textAlign: 'right', fontSize: '14px', color: '#059669' }}>
                          ₹{selectedPaymentForReceipt.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Amount in Words */}
                  <div
                    style={{
                      border: '1px dashed #94a3b8',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      marginBottom: '16px',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <span style={{ color: '#64748b' }}>Amount in Words: </span>
                    <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>
                      {numberToWords(selectedPaymentForReceipt.amount)}
                    </strong>
                    {selectedPaymentForReceipt.allocation?.balanceAmount > 0 && (
                      <div style={{ marginTop: '4px', fontSize: '11.5px', color: '#dc2626' }}>
                        Outstanding Ledger Balance Remaining: <strong>₹{selectedPaymentForReceipt.allocation.balanceAmount.toLocaleString('en-IN')}</strong>
                      </div>
                    )}
                  </div>

                  {/* Terms / Remarks */}
                  <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '32px' }}>
                    <div>1. All fees paid are subject to institutional terms and non-refundable.</div>
                    <div>2. Cheque and electronic bank transfer payments are valid subject to final credit realization.</div>
                    <div>3. This receipt constitutes valid proof of tuition fee deposit for statutory Section 80C tax exemption.</div>
                  </div>

                  {/* Signatures & Seal Section */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      paddingTop: '16px',
                    }}
                  >
                    <div style={{ textAlign: 'center', width: '180px' }}>
                      <div style={{ height: '40px' }} />
                      <div style={{ borderTop: '1px solid #475569', paddingTop: '4px', fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                        Depositor / Student Sign
                      </div>
                    </div>

                    <div
                      style={{
                        width: '90px',
                        height: '90px',
                        border: '2px dashed #94a3b8',
                        borderRadius: '50%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: '9px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '4px',
                      }}
                    >
                      <span>OFFICIAL</span>
                      <span>SEAL & STAMP</span>
                    </div>

                    <div style={{ textAlign: 'center', width: '200px' }}>
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, marginBottom: '20px' }}>
                        ✓ Digitally Verified
                      </div>
                      <div style={{ borderTop: '1px solid #475569', paddingTop: '4px', fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                        Authorized Accounts Officer
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                        {organization?.name || 'AURXON ERP'}
                      </div>
                    </div>
                  </div>

                  {/* Footer Notice */}
                  <div
                    style={{
                      marginTop: '20px',
                      borderTop: '1px solid #e2e8f0',
                      paddingTop: '8px',
                      textAlign: 'center',
                      fontSize: '9px',
                      color: '#94a3b8',
                    }}
                  >
                    System Generated Document • AURXON Educational OS • Timestamp: {new Date().toISOString()} • Receipt Hash: {selectedPaymentForReceipt.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print Stylesheet */}
        <style>{`
          @media print {
            @page {
              margin: 10mm;
              size: A4 portrait;
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
            }
            body * {
              visibility: hidden !important;
            }
            #printable-fee-receipt,
            #printable-fee-receipt * {
              visibility: visible !important;
            }
            #printable-fee-receipt {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 20px !important;
              box-shadow: none !important;
              border: 2px solid #000000 !important;
              background: #ffffff !important;
              z-index: 999999 !important;
            }
            .no-print,
            .receipt-modal-backdrop {
              background: transparent !important;
              backdrop-filter: none !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </AppShell>
  );
}

