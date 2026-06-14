export type FileStatus = 'UPLOADED' | 'ANALYZING' | 'CLEAN' | 'QUARANTINED' | 'ERROR';

export type UserRole = 'ADMIN' | 'STUDENT' | 'TECHNICAL';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type FileCategory = 'Documents' | 'Assignments' | 'Research' | 'Presentations' | 'Images' | 'Spreadsheets' | 'Other';

export type LogAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'FILE_UPLOADED'
  | 'FILE_SENT_TO_S3'
  | 'LAMBDA_TRIGGERED'
  | 'SHA256_CALCULATED'
  | 'VIRUSTOTAL_CHECKED'
  | 'FILE_CLEAN'
  | 'FILE_QUARANTINED'
  | 'SNS_ALERT_SENT'
  | 'CLOUDWATCH_LOG_CREATED'
  | 'FILE_DELETED'
  | 'SETTINGS_UPDATED';

export type LogSource =
  | 'WEB_APP'
  | 'NESTJS_API'
  | 'POSTGRESQL'
  | 'AWS_S3'
  | 'AWS_LAMBDA'
  | 'VIRUSTOTAL'
  | 'SNS'
  | 'CLOUDWATCH';

export type LogStatus = 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';

export interface Student {
  id: string;
  name: string;
  email: string;
  password_hash: string; // bcrypt hash - never store plain text passwords
  career: string;
  role: UserRole;
  status: UserStatus;
  storage_used: number;
  max_storage: number;
  created_at: string;
}

export interface UploadedFile {
  id: string;
  student_id: string;
  student_name: string;
  original_name: string;
  file_type: string;
  size: number;
  category: FileCategory;
  status: FileStatus;
  sha256: string;
  s3_input_key: string;
  bucket_destination: string;
  uploaded_at: string;
  scanned_at: string | null;
  result: string | null;
  virustotal_summary: string | null;
  // For local file storage (demo only)
  file_data_url?: string;
}

export interface AuditLog {
  id: string;
  student_id: string | null;
  student_name: string | null;
  file_id: string | null;
  file_name: string | null;
  action: LogAction;
  description: string;
  source: LogSource;
  status: LogStatus;
  created_at: string;
}

export interface StorageUsage {
  id: string;
  student_id: string;
  total_files: number;
  used_space: number;
  max_space: number;
  updated_at: string;
}

export interface DashboardStats {
  total_files: number;
  clean_files: number;
  quarantined_files: number;
  analyzing_files: number;
  error_files: number;
  storage_used: number;
  registered_students: number;
}

export interface FileTimelineEvent {
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'processing' | 'error' | 'warning';
}

export interface Settings {
  id: string;
  postgres_host: string;
  postgres_port: string;
  postgres_database: string;
  postgres_username: string;
  postgres_password_masked: string;
  aws_region: string;
  s3_input_bucket: string;
  s3_clean_bucket: string;
  s3_quarantine_bucket: string;
  lambda_function_name: string;
  lambda_timeout: string;
  sns_topic_arn_masked: string;
  sns_alert_email: string;
  cloudwatch_log_group: string;
  cloudwatch_retention_days: string;
  virustotal_api_key_masked: string;
  virustotal_endpoint: string;
  virustotal_rate_limit: string;
  max_file_size_mb: string;
  student_quota_gb: string;
  admin_quota_gb: string;
  auto_scan_enabled: boolean;
  auto_quarantine_enabled: boolean;
  sns_alerts_enabled: boolean;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  career: string;
  role: UserRole;
  status: UserStatus;
  storage_used: number;
  max_storage: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
