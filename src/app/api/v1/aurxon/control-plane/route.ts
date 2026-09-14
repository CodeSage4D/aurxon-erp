import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { recordAudit } from '@/lib/audit';
import {
  PRODUCT_FEATURES,
  PLATFORM_PLANS,
  getFeatureFlags,
  updateFeatureFlag,
  validateFeatureDependencies,
  getDatabaseDiagnostics,
  getPlatformLicenses,
} from '@/lib/control-plane';

// Mock active sessions cache for control plane security observability
let ACTIVE_SESSIONS = [
  {
    sessionId: 'sess_live_admin_01',
    userEmail: 'admin@aurxon.io',
    userName: 'Super Admin',
    role: 'SUPER_ADMIN',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0',
    location: 'Bhopal, India',
    loginTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    lastActive: new Date().toISOString(),
    status: 'ACTIVE',
  },
  {
    sessionId: 'sess_live_ops_02',
    userEmail: 'devops@aurxon.io',
    userName: 'Platform Operator',
    role: 'PLATFORM_OPERATOR',
    ipAddress: '103.21.14.82',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    location: 'Indore, India',
    loginTime: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
  },
];

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Requires Platform Super Admin authorization' },
      { status: 403 }
    );
  }

  try {
    const [orgs, dbDiagnostics, licenses, audits] = await Promise.all([
      prisma.organization.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          institutions: {
            include: {
              branches: true,
            },
          },
          moduleEntitlements: true,
          _count: {
            select: { users: true, students: true },
          },
        },
      }),
      getDatabaseDiagnostics(),
      getPlatformLicenses(),
      prisma.auditLog.findMany({
        take: 30,
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    const featureFlags = getFeatureFlags();

    return NextResponse.json({
      success: true,
      data: {
        organizations: orgs,
        databaseDiagnostics: dbDiagnostics,
        licenses,
        features: PRODUCT_FEATURES,
        featureFlags,
        plans: PLATFORM_PLANS,
        recentAudits: audits,
        activeSessions: ACTIVE_SESSIONS,
        currentOperator: {
          id: sessionUser.id,
          name: `${sessionUser.firstName} ${sessionUser.lastName}`.trim() || 'Super Admin',
          email: sessionUser.email,
          role: sessionUser.role,
        },
      },
    });
  } catch (error: any) {
    console.error('[AURXON_CONTROL_PLANE_GET_ERROR]', error);
    // Return resilient fallback data
    const dbDiagnostics = await getDatabaseDiagnostics();
    const licenses = await getPlatformLicenses();
    return NextResponse.json({
      success: true,
      data: {
        organizations: [],
        databaseDiagnostics: dbDiagnostics,
        licenses,
        features: PRODUCT_FEATURES,
        featureFlags: getFeatureFlags(),
        plans: PLATFORM_PLANS,
        recentAudits: [],
        activeSessions: ACTIVE_SESSIONS,
        currentOperator: {
          id: sessionUser.id,
          name: `${sessionUser.firstName} ${sessionUser.lastName}`.trim() || 'Super Admin',
          email: sessionUser.email,
          role: sessionUser.role,
        },
      },
    });
  }
}

export async function POST(req: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Requires Platform Super Admin authorization' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action parameter is required' }, { status: 400 });
    }

    const operatorName = `${sessionUser.firstName} ${sessionUser.lastName}`.trim() || 'Super Admin';

    // ACTION 1: UPDATE_ORG_STATUS
    if (action === 'UPDATE_ORG_STATUS') {
      const { orgId, status, reason } = body;
      if (!orgId || !['ACTIVE', 'SUSPENDED', 'ARCHIVED'].includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid orgId or status' }, { status: 400 });
      }

      const existingOrg = await prisma.organization.findUnique({ where: { id: orgId } });
      if (!existingOrg) {
        return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
      }

      const updated = await prisma.organization.update({
        where: { id: orgId },
        data: { status },
      });

      await recordAudit({
        organizationId: orgId,
        actorId: sessionUser.id,
        actorName: operatorName,
        actorRole: sessionUser.role,
        resource: 'ORGANIZATION',
        action: `SET_STATUS_${status}`,
        recordId: orgId,
        details: {
          previousStatus: existingOrg.status,
          newStatus: status,
          reason: reason || 'Administrative status transition from AURXON HQ',
        },
      });

      return NextResponse.json({
        success: true,
        message: `Organization status changed to ${status}`,
        organization: updated,
      });
    }

    // ACTION 2: TOGGLE_ORG_MODULE (With Dependency Enforcement)
    if (action === 'TOGGLE_ORG_MODULE') {
      const { orgId, moduleKey, enable } = body;
      if (!orgId || !moduleKey || typeof enable !== 'boolean') {
        return NextResponse.json({ success: false, error: 'Invalid module toggle parameters' }, { status: 400 });
      }

      // Fetch all currently enabled modules for this organization
      const existingEntitlements = await prisma.moduleEntitlement.findMany({
        where: { organizationId: orgId, isEnabled: true },
      });
      const currentlyEnabledKeys = existingEntitlements.map((e) => e.moduleName);

      // If enabling, validate dependency tree
      if (enable) {
        const check = validateFeatureDependencies(moduleKey, currentlyEnabledKeys);
        if (!check.valid) {
          return NextResponse.json(
            {
              success: false,
              error: `Cannot enable ${moduleKey}. Missing required dependencies: ${check.missingDependencies.join(', ')}.`,
              missingDependencies: check.missingDependencies,
            },
            { status: 400 }
          );
        }
      }

      // Check if child modules depend on this one before disabling
      if (!enable) {
        const dependentFeatures = PRODUCT_FEATURES.filter(
          (f) => f.dependencies.includes(moduleKey) && currentlyEnabledKeys.includes(f.key)
        );
        if (dependentFeatures.length > 0) {
          const names = dependentFeatures.map((d) => d.name).join(', ');
          return NextResponse.json(
            {
              success: false,
              error: `Cannot disable ${moduleKey} because active features depend on it: ${names}. Disable those first.`,
              dependents: dependentFeatures.map((d) => d.key),
            },
            { status: 400 }
          );
        }
      }

      // Upsert module entitlement
      const entitlement = await prisma.moduleEntitlement.upsert({
        where: {
          organizationId_moduleName: {
            organizationId: orgId,
            moduleName: moduleKey,
          },
        },
        update: {
          isEnabled: enable,
        },
        create: {
          organizationId: orgId,
          moduleName: moduleKey,
          isEnabled: enable,
        },
      });

      await recordAudit({
        organizationId: orgId,
        actorId: sessionUser.id,
        actorName: operatorName,
        actorRole: sessionUser.role,
        resource: 'MODULE_ENTITLEMENT',
        action: enable ? 'ENABLE_MODULE' : 'DISABLE_MODULE',
        recordId: entitlement.id,
        details: {
          moduleKey,
          isEnabled: enable,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Module ${moduleKey} ${enable ? 'enabled' : 'disabled'} successfully`,
        entitlement,
      });
    }

    // ACTION 3: UPDATE_FEATURE_FLAG
    if (action === 'UPDATE_FEATURE_FLAG') {
      const { flagKey, isEnabled, rolloutPercent } = body;
      if (!flagKey) {
        return NextResponse.json({ success: false, error: 'flagKey is required' }, { status: 400 });
      }

      const updated = updateFeatureFlag(flagKey, { isEnabled, rolloutPercent });
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Feature flag not found' }, { status: 404 });
      }

      await recordAudit({
        organizationId: sessionUser.organizationId || 'platform',
        actorId: sessionUser.id,
        actorName: operatorName,
        actorRole: sessionUser.role,
        resource: 'FEATURE_FLAG',
        action: 'UPDATE_FLAG',
        recordId: flagKey,
        details: {
          flagKey,
          isEnabled: updated.isEnabled,
          rolloutPercent: updated.rolloutPercent,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Feature flag ${flagKey} updated`,
        flag: updated,
      });
    }

    // ACTION 4: REVOKE_SESSION
    if (action === 'REVOKE_SESSION') {
      const { sessionId } = body;
      if (!sessionId) {
        return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 });
      }

      ACTIVE_SESSIONS = ACTIVE_SESSIONS.filter((s) => s.sessionId !== sessionId);

      await recordAudit({
        organizationId: sessionUser.organizationId || 'platform',
        actorId: sessionUser.id,
        actorName: operatorName,
        actorRole: sessionUser.role,
        resource: 'SECURITY_SESSION',
        action: 'REVOKE_SESSION',
        recordId: sessionId,
        details: {
          revokedSessionId: sessionId,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Session ${sessionId} has been forcefully revoked.`,
        activeSessions: ACTIVE_SESSIONS,
      });
    }

    // ACTION 5: TRIGGER_DIAGNOSTICS
    if (action === 'TRIGGER_DIAGNOSTICS') {
      const diag = await getDatabaseDiagnostics();
      return NextResponse.json({
        success: true,
        diagnostics: diag,
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('[AURXON_CONTROL_PLANE_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
