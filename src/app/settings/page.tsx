'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import {
  Settings,
  Building2,
  Calendar,
  Layers,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Save,
  Download,
  Database,
  Lock,
  Smartphone,
  Globe,
  Check,
} from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'modules' | 'gateway' | 'security'>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile Form State
  const [instName, setInstName] = useState('');
  const [affNumber, setAffNumber] = useState('');
  const [board, setBoard] = useState('CBSE');
  const [udiseCode, setUdiseCode] = useState('07080300411');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Modules State
  const [entitlements, setEntitlements] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, setRes] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/settings'),
        ]);

        if (meRes.ok) {
          const meJson = await meRes.json();
          setUser(meJson.user);
        } else {
          window.location.href = '/login';
          return;
        }

        if (setRes.ok) {
          const sJson = await setRes.json();
          setData(sJson);
          if (sJson.institution) {
            setInstName(sJson.institution.name || '');
            setAffNumber(sJson.institution.affiliationNumber || '');
            setBoard(sJson.institution.board || 'CBSE');
            setEmail(sJson.institution.email || '');
            setPhone(sJson.institution.phone || '');
            setAddress(sJson.institution.address || '');
            setCity(sJson.institution.city || '');
            setState(sJson.institution.state || '');
            setPincode(sJson.institution.pincode || '');
          }
          setEntitlements(sJson.entitlements || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggleModule = (moduleName: string) => {
    setEntitlements((prev) =>
      prev.map((e) => (e.moduleName === moduleName ? { ...e, isEnabled: !e.isEnabled } : e))
    );
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', color: '#0284c7' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e0f2fe', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600 }}>Loading Institutional Configuration & Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div style={{ padding: '28px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#ffffff' }}>
        {/* Header Title Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bae6fd' }}>
                <Settings size={20} />
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Institutional Configuration & Settings
              </h1>
            </div>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '4px 0 0 46px' }}>
              School board affiliation, academic sessions, modular entitlement switchboard & telecom gateways
            </p>
          </div>

          {saveSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '13px', fontWeight: 700, backgroundColor: '#f0fdf4', padding: '6px 14px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
              <Check size={16} />
              <span>Settings Saved Successfully</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'profile' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Building2 size={16} />
            <span>School Profile & Board</span>
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'modules' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'modules' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers size={16} />
            <span>Module Entitlements</span>
          </button>
          <button
            onClick={() => setActiveTab('academic')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'academic' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'academic' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Calendar size={16} />
            <span>Academic Sessions</span>
          </button>
          <button
            onClick={() => setActiveTab('gateway')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'gateway' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'gateway' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Smartphone size={16} />
            <span>SMS & WhatsApp Gateway</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'security' ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'security' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={16} />
            <span>Data Security & Backup</span>
          </button>
        </div>

        {/* TAB 1: SCHOOL PROFILE */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveSettings} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '28px', backgroundColor: '#ffffff' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Official Affiliation & Identity</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Institution Name</label>
                <input
                  type="text"
                  required
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Education Board</label>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', backgroundColor: '#ffffff' }}
                >
                  <option value="CBSE">Central Board of Secondary Education (CBSE)</option>
                  <option value="ICSE">Council for the Indian School Certificate Examinations (ICSE)</option>
                  <option value="STATE">State Secondary Education Board</option>
                  <option value="CAMBRIDGE">Cambridge International (IGCSE)</option>
                  <option value="IB">International Baccalaureate (IB)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Board Affiliation Number</label>
                <input
                  type="text"
                  value={affNumber}
                  onChange={(e) => setAffNumber(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>National UDISE+ Code</label>
                <input
                  type="text"
                  value={udiseCode}
                  onChange={(e) => setUdiseCode(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Official Contact Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Campus Helpline Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Campus Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Postal Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Save size={15} />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: MODULE ENTITLEMENTS */}
        {activeTab === 'modules' && (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', backgroundColor: '#ffffff' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Modular Feature Switchboard</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Enable or disable specialized education ERP modules based on institutional subscription tier
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {entitlements.map((mod: any) => (
                <div
                  key={mod.moduleName}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: mod.isEnabled ? '#f0f9ff' : '#f8fafc',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: mod.isEnabled ? '#0c4a6e' : '#64748b' }}>
                        {mod.title}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: mod.isEnabled ? '#ecfdf5' : '#f1f5f9',
                          color: mod.isEnabled ? '#047857' : '#64748b',
                        }}
                      >
                        {mod.isEnabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>{mod.desc}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleModule(mod.moduleName)}
                    style={{
                      width: '48px',
                      height: '26px',
                      borderRadius: '9999px',
                      backgroundColor: mod.isEnabled ? '#0284c7' : '#cbd5e1',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 200ms ease',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: mod.isEnabled ? '25px' : '3px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        transition: 'left 200ms ease',
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ACADEMIC SESSIONS */}
        {activeTab === 'academic' && (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', backgroundColor: '#ffffff' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Academic Calendar & Sessions</h3>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>Session Name</th>
                    <th style={{ padding: '12px 16px' }}>Start Date</th>
                    <th style={{ padding: '12px 16px' }}>End Date</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0c4a6e' }}>2025-2026</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>01 April 2025</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>31 March 2026</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#ecfdf5', color: '#047857' }}>
                        CURRENT ACTIVE SESSION
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>2024-2025</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>01 April 2024</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>31 March 2025</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                        ARCHIVED
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: GATEWAYS */}
        {activeTab === 'gateway' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', backgroundColor: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Smartphone size={18} color="#0284c7" />
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>DLT Telecom SMS Gateway</h4>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                TRAI / DLT registered Indian SMS pipe for automated attendance alerts & fee reminders.
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '12.5px', marginBottom: '16px' }}>
                <div><strong>Provider:</strong> NIC / Telemarketer Gateway</div>
                <div><strong>Approved Sender ID:</strong> DPSRKP</div>
                <div><strong>Account Balance:</strong> 48,500 SMS Credits</div>
                <div><strong>Status:</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>ONLINE & CONNECTED</span></div>
              </div>
              <button style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
                Configure DLT Templates
              </button>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', backgroundColor: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <MessageSquare size={18} color="#16a34a" />
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>WhatsApp Business Cloud API</h4>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                Official Meta verified enterprise channel for report card deliveries and urgent circulars.
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '12.5px', marginBottom: '16px' }}>
                <div><strong>Official Number:</strong> +91 11 4911 5500</div>
                <div><strong>Verified Display:</strong> DPS R.K. Puram Official</div>
                <div><strong>Quality Rating:</strong> Green (High)</div>
                <div><strong>Status:</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>VERIFIED ENTERPRISE</span></div>
              </div>
              <button style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
                Manage WhatsApp Templates
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: SECURITY & BACKUP */}
        {activeTab === 'security' && (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', backgroundColor: '#ffffff' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>MeitY Cloud Compliance & Data Protection</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1' }}>DATA RESIDENCY</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0c4a6e', marginTop: '4px' }}>100% Indian Sovereign Cloud</div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>Stored in MeitY empanelled datacenter (Mumbai Region)</div>
              </div>
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d' }}>ENCRYPTION STANDARD</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#166534', marginTop: '4px' }}>AES-256 GCM + TLS 1.3</div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>Zero-plaintext storage for student PII and credentials</div>
              </div>
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#7e22ce' }}>RECOVERY OBJECTIVE</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#581c87', marginTop: '4px' }}>Continuous WAL Replication</div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>RPO &lt; 5 seconds, RTO &lt; 2 minutes</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => alert('Generating full institutional snapshot JSON...')}
                style={{
                  padding: '9px 18px',
                  borderRadius: '6px',
                  border: '1px solid #0284c7',
                  backgroundColor: '#ffffff',
                  color: '#0284c7',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Download size={15} />
                <span>Export Complete School Data Snapshot</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
