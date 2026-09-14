'use client';

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';

export default function FeesPage() {
  const [user, setUser] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [structures, setStructures] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      await loadFeeData();
      setTimeout(() => {
        setCollectDrawerOpen(false);
      }, 1500);
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
        <div className="page-header">
          <div>
            <h1 className="page-title">Fees & Revenue Management</h1>
            <p className="page-subtitle">
              Fee schedules, student ledger accounts, payment collections, and official printable receipts
            </p>
          </div>
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
                <div style={{ padding: '12px 14px', backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 600 }}>
                  {collectSuccess}
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
      </div>
    </AppShell>
  );
}
