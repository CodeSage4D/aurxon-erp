import prisma from './prisma';

export interface AuditLogParams {
  organizationId: string;
  institutionId?: string | null;
  actorId: string;
  actorName: string;
  actorRole: string;
  resource: string;
  action: string;
  recordId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        institutionId: params.institutionId,
        actorId: params.actorId,
        actorName: params.actorName,
        actorRole: params.actorRole,
        resource: params.resource,
        action: params.action,
        recordId: params.recordId,
        detailsJson: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR]: Failed to record immutable audit log', error);
  }
}

export const recordAudit = logAudit;
