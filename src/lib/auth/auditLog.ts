/**
 * StudySaathi AI - Security Audit Logging Module
 * SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
 *
 * Records authentication events, failed credential attempts, OTP operations,
 * session revocations, and rate limit blocks. Zero emojis in code, logs, and messages.
 */

export type SecurityEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGIN_RATE_LIMITED"
  | "OTP_SENT"
  | "OTP_VERIFIED"
  | "OTP_FAILED"
  | "OTP_RATE_LIMITED"
  | "SIGNUP_SUCCESS"
  | "SIGNUP_FAILED"
  | "ROLE_ESCALATION_BLOCKED"
  | "SESSION_REVOKED"
  | "PASSWORD_RESET_REQUESTED";

export interface SecurityAuditRecord {
  id: string;
  timestamp: string;
  eventType: SecurityEventType;
  identifier: string;
  ip: string;
  userAgent?: string;
  role?: string;
  details?: Record<string, unknown>;
  status: "success" | "warning" | "failure";
}

class SecurityAuditLogger {
  private inMemoryLogs: SecurityAuditRecord[] = [];
  private maxRecords = 2000;

  record(event: Omit<SecurityAuditRecord, "id" | "timestamp">): SecurityAuditRecord {
    const record: SecurityAuditRecord = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };

    this.inMemoryLogs.unshift(record);
    if (this.inMemoryLogs.length > this.maxRecords) {
      this.inMemoryLogs.pop();
    }

    if (event.status === "failure" || event.eventType === "ROLE_ESCALATION_BLOCKED") {
      console.warn(
        `[SECURITY AUDIT - ${record.eventType}] Target: ${record.identifier} IP: ${record.ip} Details:`,
        record.details || ""
      );
    }

    return record;
  }

  getRecentLogs(limit = 50, filterType?: SecurityEventType): SecurityAuditRecord[] {
    if (filterType) {
      return this.inMemoryLogs.filter((log) => log.eventType === filterType).slice(0, limit);
    }
    return this.inMemoryLogs.slice(0, limit);
  }

  getFailedAttemptsForIdentifier(identifier: string, sinceMs = 15 * 60 * 1000): number {
    const cutoff = Date.now() - sinceMs;
    return this.inMemoryLogs.filter(
      (log) =>
        log.identifier.toLowerCase() === identifier.toLowerCase() &&
        log.status === "failure" &&
        new Date(log.timestamp).getTime() > cutoff
    ).length;
  }
}

export const securityAudit = new SecurityAuditLogger();
