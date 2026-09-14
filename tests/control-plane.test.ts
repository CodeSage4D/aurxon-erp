import { describe, it, expect } from 'vitest';
import {
  PRODUCT_FEATURES,
  PLATFORM_PLANS,
  validateFeatureDependencies,
  getFeatureFlags,
  updateFeatureFlag,
  getDatabaseDiagnostics,
  getPlatformLicenses,
} from '../src/lib/control-plane';

describe('AURXON SaaS Control Plane Engine', () => {
  it('contains canonical product feature catalog with valid dependencies', () => {
    expect(PRODUCT_FEATURES.length).toBeGreaterThanOrEqual(10);
    const sis = PRODUCT_FEATURES.find((f) => f.key === 'SIS');
    expect(sis).toBeDefined();
    expect(sis?.dependencies).toEqual([]);

    const exams = PRODUCT_FEATURES.find((f) => f.key === 'EXAMINATIONS');
    expect(exams).toBeDefined();
    expect(exams?.dependencies).toContain('ACADEMICS');
  });

  it('validates feature dependencies correctly when enabling features', () => {
    // Attempting to enable EXAMINATIONS without ACADEMICS should fail
    const invalidCheck = validateFeatureDependencies('EXAMINATIONS', ['SIS']);
    expect(invalidCheck.valid).toBe(false);
    expect(invalidCheck.missingDependencies).toContain('ACADEMICS');

    // Enabling EXAMINATIONS when ACADEMICS is already enabled should succeed
    const validCheck = validateFeatureDependencies('EXAMINATIONS', ['SIS', 'ACADEMICS']);
    expect(validCheck.valid).toBe(true);
    expect(validCheck.missingDependencies).toEqual([]);

    // Advanced analytics requires both FEES and ACADEMICS
    const analyticsCheck = validateFeatureDependencies('ADVANCED_ANALYTICS', ['FEES']);
    expect(analyticsCheck.valid).toBe(false);
    expect(analyticsCheck.missingDependencies).toContain('ACADEMICS');

    const analyticsCheck2 = validateFeatureDependencies('ADVANCED_ANALYTICS', ['FEES', 'ACADEMICS']);
    expect(analyticsCheck2.valid).toBe(true);
  });

  it('updates feature flag rollout percentage and enabled state', () => {
    const flags = getFeatureFlags();
    expect(flags.length).toBeGreaterThanOrEqual(4);

    const updated = updateFeatureFlag('ATTENDANCE_V2', {
      rolloutPercent: 50,
      isEnabled: true,
    });

    expect(updated).not.toBeNull();
    expect(updated?.rolloutPercent).toBe(50);
    expect(updated?.isEnabled).toBe(true);
  });

  it('executes database diagnostics and returns real table metrics and storage', async () => {
    const diagnostics = await getDatabaseDiagnostics();
    expect(diagnostics.status).toBe('HEALTHY');
    expect(diagnostics.latencyMs).toBeGreaterThanOrEqual(0);
    expect(diagnostics.tables.length).toBe(9);
    expect(diagnostics.totalRecords).toBeGreaterThan(0);

    const orgTable = diagnostics.tables.find((t) => t.name === 'Organization');
    expect(orgTable).toBeDefined();
    expect(orgTable?.records).toBeGreaterThan(0);
  });

  it('generates platform licenses with deterministic IDs, plans and seat limits', async () => {
    const licenses = await getPlatformLicenses();
    expect(licenses.length).toBeGreaterThan(0);

    const firstLic = licenses[0];
    expect(firstLic.licenseId).toMatch(/^LIC-2026-/);
    expect(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']).toContain(firstLic.planKey);
    expect(firstLic.status).toBe('ACTIVE');
    expect(firstLic.autoRenew).toBe(true);
  });
});
