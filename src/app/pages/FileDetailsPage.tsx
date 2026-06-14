import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { fileService } from '../../services/fileService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Database,
  Shield,
  CheckCircle2,
  XCircle,
  Cloud,
  Download,
  Trash2,
  AlertCircle,
  Loader2,
  Hash,
  AlertTriangle,
} from 'lucide-react';
import type { UploadedFile, FileTimelineEvent } from '../../types';

export function FileDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUserStorage } = useAuth();
  const allowEicar = import.meta.env.VITE_ALLOW_EICAR_TEST_FILES === 'true';
  const demoAutoQuarantine = import.meta.env.VITE_DEMO_AUTO_QUARANTINE_EICAR === 'true';
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      if (id) {
        const foundFile = await fileService.getFileById(id);
        setFile(foundFile);
      }
      setIsLoading(false);
    };
    fetchFile();
  }, [id]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async () => {
    if (!file || file.status === 'QUARANTINED') {
      toast.error('Download not available', {
        description: 'This file cannot be downloaded because it is quarantined.',
      });
      return;
    }

    if (file.status !== 'CLEAN') {
      toast.error('Download not available', {
        description: 'El archivo todavía está en proceso de análisis o no está disponible para descarga.',
      });
      return;
    }

    try {
      const url = await fileService.downloadFile(file.id);
      window.open(url, '_blank');
      toast.success('Download started', { description: file.original_name });
    } catch (error: any) {
      toast.error('Download failed', {
        description: error.message || 'Could not generate download URL.',
      });
    }
  };

  const handleDelete = async () => {
    if (!file || !user) return;

    setIsDeleting(true);
    setShowDeleteDialog(false);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = await fileService.deleteFile(file.id, user.id, user.name);

    if (success) {
      toast.success('File deleted', {
        description: `"${file.original_name}" has been deleted.`,
      });
      const newStorageUsed = await fileService.getUserStorageUsed(user.id);
      updateUserStorage(newStorageUsed);
      navigate('/storage');
    } else {
      toast.error('Delete failed', {
        description: 'Could not delete the file. Please try again.',
      });
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!file) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">File Not Found</h2>
          <p className="text-slate-400 mb-4">
            The file you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Link
            to="/history"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to History
          </Link>
        </div>
      </Layout>
    );
  }

  // Build timeline
  const timeline: FileTimelineEvent[] = [
    {
      title: 'Record created in PostgreSQL',
      description: `File ID: ${file.id}`,
      timestamp: file.uploaded_at,
      status: 'success',
    },
    {
      title: 'File uploaded to S3 input bucket',
      description: file.s3_input_key,
      timestamp: file.uploaded_at,
      status: 'success',
    },
    {
      title: 'Lambda scanner triggered',
      description: 'AWS Lambda function initiated malware scan',
      timestamp: file.uploaded_at,
      status: 'success',
    },
    {
      title: 'SHA-256 hash calculated',
      description: file.sha256,
      timestamp: file.uploaded_at,
      status: 'success',
    },
    {
      title: 'VirusTotal consulted',
      description: file.virustotal_summary || 'Scan in progress',
      timestamp: file.scanned_at || file.uploaded_at,
      status: file.status === 'ANALYZING' ? 'processing' : 'success',
    },
    {
      title: 'File classified',
      description: file.result || 'Awaiting results',
      timestamp: file.scanned_at || file.uploaded_at,
      status:
        file.status === 'CLEAN'
          ? 'success'
          : file.status === 'QUARANTINED'
          ? 'error'
          : file.status === 'ERROR'
          ? 'warning'
          : 'processing',
    },
    {
      title: 'PostgreSQL record updated',
      description: 'Scan results saved to database',
      timestamp: file.scanned_at || file.uploaded_at,
      status: file.scanned_at ? 'success' : 'processing',
    },
    {
      title: file.status === 'CLEAN' ? 'File moved to clean storage' : 'File moved to quarantine',
      description: file.bucket_destination || 'Pending classification',
      timestamp: file.scanned_at || file.uploaded_at,
      status:
        file.status === 'CLEAN'
          ? 'success'
          : file.status === 'QUARANTINED'
          ? 'error'
          : 'processing',
    },
  ];

  if (file.status === 'QUARANTINED') {
    timeline.push({
      title: 'SNS alert sent',
      description: 'Security team notified of threat',
      timestamp: file.scanned_at || file.uploaded_at,
      status: 'warning',
    });
  }

  timeline.push({
    title: 'CloudWatch log generated',
    description: 'Event logged for audit trail',
    timestamp: file.scanned_at || file.uploaded_at,
    status: 'success',
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            to="/history"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">File Details</h1>
            <p className="text-slate-400">Complete information and security scan timeline</p>
          </div>
        </div>

        {/* Status alerts */}
        {file.status === 'QUARANTINED' && (
          <div className="bg-red-500/10 border-2 border-red-500/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-red-400 mb-2">Security Alert</h3>
                <p className="text-slate-300 font-medium">
                  Este archivo fue bloqueado por seguridad.
                </p>
                {file.result && (
                  <p className="text-xs text-slate-400 mt-2">
                    {file.result}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {file.status === 'CLEAN' && (
          <div className="bg-emerald-500/10 border-2 border-emerald-500/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-emerald-400 mb-2">File is Clean</h3>
                <p className="text-slate-300">
                  This file passed the security scan and is available for download.
                </p>
              </div>
            </div>
          </div>
        )}

        {file.status === 'ANALYZING' && (
          <div className="space-y-4 w-full">
            <div className="bg-blue-500/10 border-2 border-blue-500/20 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Loader2 className="w-8 h-8 text-blue-400 flex-shrink-0 animate-spin" />
                <div>
                  <h3 className="text-lg font-bold text-blue-400 mb-2">Analysis in Progress</h3>
                  <p className="text-slate-300">
                    This file is still being analyzed and is not available yet.
                  </p>
                </div>
              </div>
            </div>

            {allowEicar && file.original_name.toLowerCase().includes('eicar') && !demoAutoQuarantine && (
              <div className="bg-amber-500/10 border-2 border-amber-500/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-8 h-8 text-amber-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-amber-400 mb-2">Advertencia</h3>
                    <p className="text-slate-300">
                      Archivo de prueba EICAR detectado. El análisis puede finalizar en CUARENTENA cuando la Lambda procese el archivo.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {file.status === 'ERROR' && (
          <div className="bg-amber-500/10 border-2 border-amber-500/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-amber-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-amber-400 mb-2">Scan Error</h3>
                <p className="text-slate-300">
                  The file could not be scanned correctly. Please try again or contact support.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* File metadata */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                File Metadata
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    PostgreSQL ID
                  </div>
                  <div className="text-sm text-white font-mono">{file.id}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Student</div>
                  <div className="text-sm text-white">{file.student_name}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    File Name
                  </div>
                  <div className="text-sm text-white break-all">{file.original_name}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    File Type
                  </div>
                  <div className="text-sm text-white">{file.file_type}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Size</div>
                  <div className="text-sm text-white">{formatBytes(file.size)}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    Category
                  </div>
                  <div className="text-sm text-white">{file.category}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Status</div>
                  <StatusBadge status={file.status} />
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    Upload Date
                  </div>
                  <div className="text-sm text-white">
                    {new Date(file.uploaded_at).toLocaleString()}
                  </div>
                </div>

                {file.scanned_at && (
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase mb-1">
                      Scan Date
                    </div>
                    <div className="text-sm text-white">
                      {new Date(file.scanned_at).toLocaleString()}
                    </div>
                  </div>
                )}

                <div className="col-span-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    SHA-256 Hash
                  </div>
                  <div className="text-xs text-white font-mono break-all bg-slate-800/50 p-2 rounded">
                    {file.sha256}
                  </div>
                </div>

                {file.virustotal_summary && (
                  <div className="col-span-2">
                    <div className="text-xs font-semibold text-slate-400 uppercase mb-1">
                      VirusTotal Result
                    </div>
                    <div
                      className={`text-sm ${
                        file.status === 'QUARANTINED' ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {file.virustotal_summary}
                    </div>
                  </div>
                )}

                <div className="col-span-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">
                    Destination Bucket
                  </div>
                  <div className="text-xs text-white font-mono break-all">
                    {file.bucket_destination || 'Pending classification'}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                Security Scan Timeline
              </h2>

              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          event.status === 'success'
                            ? 'bg-emerald-500/10 border border-emerald-500/20'
                            : event.status === 'error'
                            ? 'bg-red-500/10 border border-red-500/20'
                            : event.status === 'warning'
                            ? 'bg-amber-500/10 border border-amber-500/20'
                            : 'bg-blue-500/10 border border-blue-500/20'
                        }`}
                      >
                        {event.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : event.status === 'error' ? (
                          <XCircle className="w-4 h-4 text-red-400" />
                        ) : event.status === 'warning' ? (
                          <Shield className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Cloud className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-700 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="text-sm font-semibold text-white">{event.title}</div>
                      <div className="text-xs text-slate-400 mt-1 break-all">
                        {event.description}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Quick actions */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {file.status !== 'QUARANTINED' && (
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-medium rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </button>
                )}

                <Link
                  to="/storage"
                  className="block w-full px-4 py-2.5 text-center bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium rounded-lg transition-colors"
                >
                  Back to Storage
                </Link>

                <button
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete File
                </button>
              </div>
            </div>

            {/* Storage location */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h3 className="font-bold text-white mb-3">Storage Location</h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Input Bucket</div>
                  <div className="text-xs font-mono break-all">{file.s3_input_key}</div>
                </div>

                {file.bucket_destination && (
                  <div>
                    <div className="text-xs text-slate-400 mb-1">
                      {file.status === 'CLEAN' ? 'Clean Storage' : 'Quarantine'}
                    </div>
                    <div className="text-xs font-mono break-all">{file.bucket_destination}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Delete File?</h3>
                <p className="text-sm text-slate-400">
                  Are you sure you want to delete "{file.original_name}"? This action cannot be
                  undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
