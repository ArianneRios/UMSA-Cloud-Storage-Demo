import type { AuditLog, LogAction, LogSource, LogStatus } from '../types';
import { mockLogs } from '../data/mockData';

const LOGS_STORAGE_KEY = 'umsa_cloud_logs';

interface CreateLogParams {
  student_id: string | null;
  student_name: string | null;
  file_id: string | null;
  file_name: string | null;
  action: LogAction;
  description: string;
  source: LogSource;
  status: LogStatus;
}

class LogService {
  private initialized = false;

  /**
   * Initialize storage with mock data if empty
   */
  private initializeIfNeeded(): void {
    if (this.initialized) return;
    
    const stored = localStorage.getItem(LOGS_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(mockLogs));
    }
    this.initialized = true;
  }

  /**
   * Get all logs from localStorage
   */
  getAllLogs(): AuditLog[] {
    this.initializeIfNeeded();
    try {
      const stored = localStorage.getItem(LOGS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save logs to localStorage
   */
  private saveLogs(logs: AuditLog[]): void {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  }

  /**
   * Generate a log ID
   */
  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 6);
    return `l${timestamp}${randomPart}`;
  }

  /**
   * Create a new audit log entry
   */
  createLog(params: CreateLogParams): AuditLog {
    const log: AuditLog = {
      id: this.generateId(),
      student_id: params.student_id,
      student_name: params.student_name,
      file_id: params.file_id,
      file_name: params.file_name,
      action: params.action,
      description: params.description,
      source: params.source,
      status: params.status,
      created_at: new Date().toISOString(),
    };

    const logs = this.getAllLogs();
    logs.unshift(log);
    this.saveLogs(logs);

    return log;
  }

  /**
   * Create multiple logs for the AWS scanning workflow
   */
  createScanWorkflowLogs(
    studentId: string,
    studentName: string,
    fileId: string,
    fileName: string,
    sha256: string,
    isClean: boolean
  ): void {
    const baseTime = Date.now();
    
    const workflowLogs: CreateLogParams[] = [
      {
        student_id: studentId,
        student_name: studentName,
        file_id: fileId,
        file_name: fileName,
        action: 'FILE_SENT_TO_S3',
        description: 'File sent to AWS S3 input bucket',
        source: 'NESTJS_API',
        status: 'SUCCESS',
      },
      {
        student_id: studentId,
        student_name: studentName,
        file_id: fileId,
        file_name: fileName,
        action: 'LAMBDA_TRIGGERED',
        description: 'AWS Lambda malware scanner triggered',
        source: 'AWS_LAMBDA',
        status: 'SUCCESS',
      },
      {
        student_id: studentId,
        student_name: studentName,
        file_id: fileId,
        file_name: fileName,
        action: 'SHA256_CALCULATED',
        description: `SHA-256 hash calculated: ${sha256.substring(0, 32)}...`,
        source: 'AWS_LAMBDA',
        status: 'SUCCESS',
      },
      {
        student_id: studentId,
        student_name: studentName,
        file_id: fileId,
        file_name: fileName,
        action: 'VIRUSTOTAL_CHECKED',
        description: 'File hash verified with VirusTotal API',
        source: 'VIRUSTOTAL',
        status: 'SUCCESS',
      },
      {
        student_id: studentId,
        student_name: studentName,
        file_id: fileId,
        file_name: fileName,
        action: isClean ? 'FILE_CLEAN' : 'FILE_QUARANTINED',
        description: isClean
          ? 'File marked as clean and moved to clean bucket'
          : 'File quarantined due to security threat',
        source: 'AWS_S3',
        status: isClean ? 'SUCCESS' : 'WARNING',
      },
    ];

    // Add SNS alert if quarantined
    if (!isClean) {
      workflowLogs.push({
        student_id: studentId,
        student_name: studentName,
        file_id: fileId,
        file_name: fileName,
        action: 'SNS_ALERT_SENT',
        description: 'Security alert sent via Amazon SNS',
        source: 'SNS',
        status: 'WARNING',
      });
    }

    // Add CloudWatch log
    workflowLogs.push({
      student_id: studentId,
      student_name: studentName,
      file_id: fileId,
      file_name: fileName,
      action: 'CLOUDWATCH_LOG_CREATED',
      description: 'Scan results logged to CloudWatch',
      source: 'CLOUDWATCH',
      status: 'SUCCESS',
    });

    // Create all logs with slight time delays
    workflowLogs.forEach((logParams, index) => {
      const log: AuditLog = {
        id: this.generateId(),
        student_id: logParams.student_id,
        student_name: logParams.student_name,
        file_id: logParams.file_id,
        file_name: logParams.file_name,
        action: logParams.action,
        description: logParams.description,
        source: logParams.source,
        status: logParams.status,
        created_at: new Date(baseTime + index * 500).toISOString(),
      };

      const logs = this.getAllLogs();
      logs.unshift(log);
      this.saveLogs(logs);
    });
  }

  /**
   * Get logs by file ID
   */
  getLogsByFileId(fileId: string): AuditLog[] {
    return this.getAllLogs().filter((log) => log.file_id === fileId);
  }

  /**
   * Get logs by user ID
   */
  getLogsByUserId(userId: string): AuditLog[] {
    return this.getAllLogs().filter((log) => log.student_id === userId);
  }

  /**
   * Get recent security alerts (WARNING status)
   */
  getSecurityAlerts(): AuditLog[] {
    return this.getAllLogs().filter((log) => log.status === 'WARNING');
  }
}

export const logService = new LogService();
