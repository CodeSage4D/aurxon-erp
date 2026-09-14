'use client';

import React, { useState, useMemo } from 'react';
import { Lock, ShieldAlert, CheckCircle2, XCircle, Eye, EyeOff, KeyRound, ArrowRight } from 'lucide-react';

interface MandatoryPasswordResetModalProps {
  userEmail: string;
  onSuccess: () => void;
}

export default function MandatoryPasswordResetModal({ userEmail, onSuccess }: MandatoryPasswordResetModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password criteria evaluation
  const criteria = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
      match: newPassword.length > 0 && newPassword === confirmPassword,
      differentFromCurrent: currentPassword.length > 0 && newPassword !== currentPassword,
    };
  }, [newPassword, confirmPassword, currentPassword]);

  const allPassed =
    criteria.length &&
    criteria.uppercase &&
    criteria.lowercase &&
    criteria.number &&
    criteria.special &&
    criteria.match &&
    criteria.differentFromCurrent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allPassed || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to reset password. Please check current password.');
        setSubmitting(false);
        return;
      }

      setSuccessMsg('Password updated successfully! Redirecting to institutional workspace...');
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Network error occurred. Please retry.');
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #192D55 0%, #2270AF 60%, #9E3BB3 100%)',
            padding: '24px',
            color: '#FFFFFF',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.25)',
              }}
            >
              <KeyRound size={22} color="#F7E223" />
            </div>
            <div>
              <h2 style={{ fontSize: '19px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                First-Login Password Reset Required
              </h2>
              <p style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.85)', margin: '3px 0 0' }}>
                Institutional Security & Single-Sign-On Policy
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <ShieldAlert size={18} color="#2270AF" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.5 }}>
            Your account was provisioned with a temporary password by School HR. To protect confidential student and academic records, you must set a permanent strong password before entering the ERP.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <XCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
              Current Temporary Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter password provided by HR"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
              New Permanent Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Choose a strong permanent password"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type your new password"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                outline: 'none',
              }}
            />
          </div>

          {/* Real-Time Criteria Checklist */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
              Password Complexity Requirements
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: criteria.length ? '#16a34a' : '#64748b' }}>
                {criteria.length ? <CheckCircle2 size={13} /> : <div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '1px solid #cbd5e1' }} />}
                <span>8+ Characters</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: criteria.uppercase ? '#16a34a' : '#64748b' }}>
                {criteria.uppercase ? <CheckCircle2 size={13} /> : <div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '1px solid #cbd5e1' }} />}
                <span>1 Uppercase (A-Z)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: criteria.lowercase ? '#16a34a' : '#64748b' }}>
                {criteria.lowercase ? <CheckCircle2 size={13} /> : <div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '1px solid #cbd5e1' }} />}
                <span>1 Lowercase (a-z)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: criteria.number ? '#16a34a' : '#64748b' }}>
                {criteria.number ? <CheckCircle2 size={13} /> : <div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '1px solid #cbd5e1' }} />}
                <span>1 Numeric (0-9)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: criteria.special ? '#16a34a' : '#64748b' }}>
                {criteria.special ? <CheckCircle2 size={13} /> : <div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '1px solid #cbd5e1' }} />}
                <span>1 Special (!@#$)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: criteria.match ? '#16a34a' : '#64748b' }}>
                {criteria.match ? <CheckCircle2 size={13} /> : <div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '1px solid #cbd5e1' }} />}
                <span>Passwords Match</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!allPassed || submitting}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: allPassed
                ? 'linear-gradient(135deg, #2270AF 0%, #9E3BB3 100%)'
                : '#cbd5e1',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 700,
              cursor: allPassed && !submitting ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: allPassed ? '0 4px 12px rgba(34, 112, 175, 0.25)' : 'none',
            }}
          >
            {submitting ? (
              <span>Updating & Encrypting...</span>
            ) : (
              <>
                <span>Activate Account & Continue</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
