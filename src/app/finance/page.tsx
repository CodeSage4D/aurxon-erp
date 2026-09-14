'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import DataTable, { Column } from '@/components/ui/DataTable';
import MetricCard from '@/components/ui/MetricCard';
import Drawer from '@/components/ui/Drawer';
import Badge from '@/components/ui/Badge';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from 'lucide-react';

export default function FinancePage() {
  const [user, setUser] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Transaction Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [txData, setTxData] = useState({
    type: 'EXPENSE',
    category: 'UTILITIES',
    amount: 5000,
    paymentMethod: 'NET_BANKING',
    referenceNo: '',
    description: '',
  });

  const loadFinance = async () => {
    try {
      const res = await fetch('/api/v1/finance');
      if (res.ok) {
        const json = await res.json();
        setSummary(json.summary);
        setTransactions(json.transactions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const [meRes, finRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/finance'),
        ]);

        if (meRes.ok) {
          const meJson = await meRes.json();
          setUser(meJson.user);
        }

        if (finRes.ok) {
          const finJson = await finRes.json();
          setSummary(finJson.summary);
          setTransactions(finJson.transactions || []);
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...txData,
          amount: Number(txData.amount),
        }),
      });

      if (res.ok) {
        setDrawerOpen(false);
        setTxData({
          type: 'EXPENSE',
          category: 'UTILITIES',
          amount: 5000,
          paymentMethod: 'NET_BANKING',
          referenceNo: '',
          description: '',
        });
        await loadFinance();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => (
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {new Date(row.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge variant={row.type === 'INCOME' ? 'success' : 'danger'}>
          {row.type === 'INCOME' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {row.type}
        </Badge>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.category.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => <span>{row.description}</span>,
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      render: (row) => <Badge variant="neutral">{row.paymentMethod}</Badge>,
    },
    {
      key: 'referenceNo',
      header: 'Reference #',
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
          {row.referenceNo || 'N/A'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <span
          style={{
            fontWeight: 700,
            fontSize: '14px',
            color: row.type === 'INCOME' ? '#059669' : '#dc2626',
          }}
        >
          {row.type === 'INCOME' ? '+' : '-'}₹{row.amount.toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading Financial Ledger...</div>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Institutional Financial Ledger</h1>
            <p className="page-subtitle">
              Comprehensive ledger of revenues, fee inflows, utility expenses, maintenance, and net operational balance
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setDrawerOpen(true)}>
            <PlusCircle size={16} /> Record Transaction
          </button>
        </div>

        {/* Financial Summary Metric Cards */}
        {summary && (
          <div className="metric-grid">
            <MetricCard
              label="Total Revenue Inflow"
              value={`₹${summary.totalIncome.toLocaleString('en-IN')}`}
              subtext="Fees & Operational Inflow"
              icon={<TrendingUp size={20} color="#059669" />}
              trend={{ value: 'Positive', isUp: true, isUpwardPositive: true }}
            />
            <MetricCard
              label="Total Institutional Expenses"
              value={`₹${summary.totalExpense.toLocaleString('en-IN')}`}
              subtext="Utilities, Maintenance, Salaries"
              icon={<TrendingDown size={20} color="#dc2626" />}
              trend={{ value: 'Expenditure', isUp: false, isUpwardPositive: false }}
            />
            <MetricCard
              label="Net Operating Balance"
              value={`₹${summary.netOperatingBalance.toLocaleString('en-IN')}`}
              subtext="Surplus / Reserves"
              icon={<Wallet size={20} color="var(--primary)" />}
              trend={{ value: summary.netOperatingBalance >= 0 ? 'Surplus' : 'Deficit', isUp: summary.netOperatingBalance >= 0, isUpwardPositive: true }}
            />
          </div>
        )}

        {/* Ledger Data Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Transaction Ledger History</h3>
          </div>
          <div style={{ padding: 'var(--space-4)' }}>
            <DataTable
              columns={columns}
              data={transactions}
              searchPlaceholder="Search category or description..."
              searchKey={(r) => `${r.category} ${r.description} ${r.referenceNo || ''}`}
              filterOptions={{
                label: 'Type',
                key: 'type',
                options: [
                  { label: 'Income Only', value: 'INCOME' },
                  { label: 'Expense Only', value: 'EXPENSE' },
                ],
              }}
            />
          </div>
        </div>

        {/* Record Transaction Drawer */}
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Record Financial Transaction"
          subtitle="Log expenditure voucher or non-fee income to institutional ledger"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDrawerOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateTransaction}
                disabled={submitting}
              >
                {submitting ? 'Recording...' : 'Record to Ledger'}
              </button>
            </>
          }
        >
          <form onSubmit={handleCreateTransaction}>
            <div className="form-group">
              <label className="form-label">Transaction Type *</label>
              <select
                className="form-select"
                value={txData.type}
                onChange={(e) => setTxData({ ...txData, type: e.target.value as any })}
              >
                <option value="EXPENSE">Expense / Outflow</option>
                <option value="INCOME">Income / Inflow</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={txData.category}
                  onChange={(e) => setTxData({ ...txData, category: e.target.value })}
                >
                  <option value="UTILITIES">Campus Utilities (Electricity/Water/Net)</option>
                  <option value="MAINTENANCE">Maintenance & Repairs</option>
                  <option value="SUPPLIES">Stationery & Lab Supplies</option>
                  <option value="SALARY">Faculty & Staff Payroll</option>
                  <option value="FEE_COLLECTION">Fee Collection</option>
                  <option value="OTHER">Other Contingency</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="form-input"
                  value={txData.amount}
                  onChange={(e) => setTxData({ ...txData, amount: Number(e.target.value) })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Payment Method *</label>
                <select
                  className="form-select"
                  value={txData.paymentMethod}
                  onChange={(e) => setTxData({ ...txData, paymentMethod: e.target.value })}
                >
                  <option value="NET_BANKING">Net Banking / NEFT</option>
                  <option value="CHEQUE">Bank Cheque</option>
                  <option value="UPI">UPI Digital</option>
                  <option value="CASH">Petty Cash</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reference / Bill / Cheque #</label>
                <input
                  type="text"
                  className="form-input"
                  value={txData.referenceNo}
                  onChange={(e) => setTxData({ ...txData, referenceNo: e.target.value })}
                  placeholder="e.g. INV-88291 or CHQ-00124"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description / Purpose *</label>
              <textarea
                required
                className="form-textarea"
                rows={3}
                value={txData.description}
                onChange={(e) => setTxData({ ...txData, description: e.target.value })}
                placeholder="Explain the purpose and department authorization for this transaction"
              />
            </div>
          </form>
        </Drawer>
      </div>
    </AppShell>
  );
}
