import type { Settings } from '../types';
import { logService } from './logService';

const SETTINGS_STORAGE_KEY = 'umsa_cloud_settings';

const defaultSettings: Settings = {
  id: 'settings_001',
  postgres_host: 'postgres.umsa.internal',
  postgres_port: '5432',
  postgres_database: 'umsa_cloud_storage',
  postgres_username: 'umsa_admin',
  postgres_password_masked: '••••••••••••••••',
  aws_region: 'us-east-1',
  s3_input_bucket: 'umsa-cloud-input',
  s3_clean_bucket: 'umsa-cloud-clean',
  s3_quarantine_bucket: 'umsa-cloud-quarantine',
  lambda_function_name: 'umsa-malware-scanner',
  lambda_timeout: '300',
  sns_topic_arn_masked: 'arn:aws:sns:us-east-1:***:umsa-security-alerts',
  sns_alert_email: 'security@umsa.bo',
  cloudwatch_log_group: '/aws/lambda/umsa-malware-scanner',
  cloudwatch_retention_days: '30',
  virustotal_api_key_masked: '••••••••••••••••••••••••••••••••',
  virustotal_endpoint: 'https://www.virustotal.com/api/v3/',
  virustotal_rate_limit: '500',
  max_file_size_mb: '100',
  student_quota_gb: '5',
  admin_quota_gb: '10',
  auto_scan_enabled: true,
  auto_quarantine_enabled: true,
  sns_alerts_enabled: true,
  updated_at: new Date().toISOString(),
};

class SettingsService {
  /**
   * Get settings from localStorage
   */
  getSettings(): Settings {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore parse errors
    }
    return defaultSettings;
  }

  /**
   * Save settings to localStorage
   */
  saveSettings(settings: Partial<Settings>, userId?: string, userName?: string): Settings {
    const current = this.getSettings();
    const updated: Settings = {
      ...current,
      ...settings,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));

    // Create settings update log
    if (userId && userName) {
      logService.createLog({
        student_id: userId,
        student_name: userName,
        file_id: null,
        file_name: null,
        action: 'SETTINGS_UPDATED',
        description: 'System settings were updated',
        source: 'WEB_APP',
        status: 'SUCCESS',
      });
    }

    return updated;
  }

  /**
   * Reset settings to default
   */
  resetSettings(): Settings {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings));
    return defaultSettings;
  }
}

export const settingsService = new SettingsService();
