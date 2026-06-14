import { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  HardDrive,
  Users,
  Database,
  ArrowUpRight,
  Shield,
  Activity,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { Layout } from '../components/Layout';
import { Link } from 'react-router';
import { fileService } from '../../services/fileService';
import { useAuth } from '../../contexts/AuthContext';
import type { UploadedFile, AuditLog, DashboardStats } from '../../types';

export function DashboardPage() {
  const { updateUserStorage } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentFiles, setRecentFiles] = useState<UploadedFile[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<AuditLog[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    // Get stats from backend
    const fileStats = await fileService.getStats();
    setStats(fileStats);
    updateUserStorage(fileStats.storage_used);

    // Get recent files using real history
    const files = await fileService.getHistory('current');
    setRecentFiles(files.slice(0, 5));

    // Map real backend files to alerts (quarantined)
    const quarantinedFiles = files.filter((f) => f.status === 'QUARANTINED');
    const mappedAlerts: AuditLog[] = quarantinedFiles.map((f) => ({
      id: f.id,
      student_id: f.student_id,
      student_name: f.student_name,
      file_id: f.id,
      file_name: f.original_name,
      action: 'FILE_QUARANTINED',
      description: `Amenaza detectada en el archivo: ${f.original_name}`,
      source: 'AWS_LAMBDA',
      status: 'WARNING',
      created_at: f.scanned_at || f.uploaded_at,
    }));
    setRecentAlerts(mappedAlerts.slice(0, 3));

    // Map real backend files to activities (upload, clean, quarantine)
    const activities: AuditLog[] = [];
    files.forEach((f) => {
      activities.push({
        id: `upload-${f.id}`,
        student_id: f.student_id,
        student_name: f.student_name,
        file_id: f.id,
        file_name: f.original_name,
        action: 'FILE_UPLOADED',
        description: `Archivo subido: ${f.original_name}`,
        source: 'WEB_APP',
        status: 'INFO',
        created_at: f.uploaded_at,
      });

      if (f.status === 'CLEAN') {
        activities.push({
          id: `clean-${f.id}`,
          student_id: f.student_id,
          student_name: f.student_name,
          file_id: f.id,
          file_name: f.original_name,
          action: 'FILE_CLEAN',
          description: `Archivo analizado y limpio: ${f.original_name}`,
          source: 'AWS_LAMBDA',
          status: 'SUCCESS',
          created_at: f.scanned_at || f.uploaded_at,
        });
      } else if (f.status === 'QUARANTINED') {
        activities.push({
          id: `quarantine-${f.id}`,
          student_id: f.student_id,
          student_name: f.student_name,
          file_id: f.id,
          file_name: f.original_name,
          action: 'FILE_QUARANTINED',
          description: `Amenaza detectada: ${f.original_name}`,
          source: 'AWS_LAMBDA',
          status: 'WARNING',
          created_at: f.scanned_at || f.uploaded_at,
        });
      }
    });

    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRecentActivity(activities.slice(0, 5));

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading || !stats) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-slate-400">Resumen del almacenamiento seguro y estado de escaneo en AWS.</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.total_files}</div>
            <div className="text-sm text-slate-400">Total Files</div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.clean_files}</div>
            <div className="text-sm text-slate-400">Clean Files</div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.quarantined_files}</div>
            <div className="text-sm text-slate-400">Quarantined Files</div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.analyzing_files}</div>
            <div className="text-sm text-slate-400">Files Analyzing</div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.error_files}</div>
            <div className="text-sm text-slate-400">Errors</div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-purple-400" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {formatBytes(stats.storage_used)}
            </div>
            <div className="text-sm text-slate-400">Storage Used</div>
          </div>
        </div>

        {/* Students card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{stats.registered_students}</div>
                <div className="text-sm text-slate-400">Registered Students</div>
              </div>
            </div>
            <Link
              to="/students"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View all
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent files */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Recent Files</h2>
              <Link
                to="/history"
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentFiles.length > 0 ? (
                recentFiles.map((file) => (
                  <Link
                    key={file.id}
                    to={`/files/${file.id}`}
                    className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {file.original_name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {file.student_name} · {formatBytes(file.size)}
                      </div>
                    </div>
                    <StatusBadge status={file.status} size="sm" />
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">No files uploaded yet</div>
                </div>
              )}
            </div>
          </div>

          {/* Security alerts */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Security Alerts</h2>
              <Link
                to="/logs"
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{alert.action}</div>
                      <div className="text-xs text-slate-400 mt-1">{alert.description}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">No hay amenazas detectadas actualmente.</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity timeline */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Activity Timeline</h2>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.status === 'WARNING'
                            ? 'bg-red-500/10 border border-red-500/20'
                            : activity.status === 'ERROR'
                            ? 'bg-amber-500/10 border border-amber-500/20'
                            : 'bg-emerald-500/10 border border-emerald-500/20'
                        }`}
                      >
                        <Activity
                          className={`w-4 h-4 ${
                            activity.status === 'WARNING'
                              ? 'text-red-400'
                              : activity.status === 'ERROR'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        />
                      </div>
                      {index < recentActivity.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-700 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="text-sm font-medium text-white">{activity.action}</div>
                      <div className="text-xs text-slate-400 mt-1">{activity.description}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">Sin actividad reciente.</div>
                </div>
              )}
            </div>
          </div>

          {/* Info cards */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-blue-400" />
                <h3 className="font-bold text-white">PostgreSQL</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                PostgreSQL stores students, uploaded files, password hashes, scan results, storage
                usage and audit logs.
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="font-bold text-white mb-4">Architecture Flow</h3>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>{'Student -> Web App'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>{'NestJS API -> PostgreSQL'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>{'AWS S3 -> Lambda'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>VirusTotal Scan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  <span>Clean / Quarantine</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>SNS / CloudWatch</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-emerald-400" />
                <h3 className="font-bold text-white">System Health</h3>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-emerald-400">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
