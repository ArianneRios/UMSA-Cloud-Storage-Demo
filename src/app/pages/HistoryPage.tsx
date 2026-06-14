import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { fileService } from '../../services/fileService';
import { useAuth } from '../../contexts/AuthContext';
import {
  Search,
  Eye,
  Download,
  Trash2,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import type { FileStatus, FileCategory, UploadedFile } from '../../types';

export function HistoryPage() {
  const { user, updateUserStorage } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FileStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<FileCategory | 'All'>('All');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const historyFiles = await fileService.getHistory(user?.id || 'current');
      setFiles(historyFiles);
    } catch (error) {
      toast.error('Error loading history');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.student_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || file.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || file.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const categories: Array<FileCategory | 'All'> = [
    'All',
    'Documents',
    'Assignments',
    'Research',
    'Presentations',
    'Images',
    'Spreadsheets',
    'Other',
  ];

  const statuses: Array<FileStatus | 'All'> = [
    'All',
    'UPLOADED',
    'ANALYZING',
    'CLEAN',
    'QUARANTINED',
    'ERROR',
  ];

  const canDownload = (file: UploadedFile) => file.status === 'CLEAN';

  const handleDownload = async (file: UploadedFile) => {
    if (file.status === 'QUARANTINED') {
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
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = file.original_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started', { description: file.original_name });
    } catch (error: any) {
      toast.error('Download failed', {
        description: error.message || 'Failed to generate download URL.',
      });
    }
  };

  const confirmDelete = (file: UploadedFile) => {
    setFileToDelete(file);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!fileToDelete || !user) return;

    setDeletingFileId(fileToDelete.id);
    setShowDeleteDialog(false);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = await fileService.deleteFile(fileToDelete.id, user.id, user.name);

    if (success) {
      toast.success('File deleted', {
        description: `"${fileToDelete.original_name}" has been deleted.`,
      });
      loadFiles();
      const newStorageUsed = await fileService.getUserStorageUsed(user.id);
      updateUserStorage(newStorageUsed);
    } else {
      toast.error('Delete failed', {
        description: 'Could not delete the file. Please try again.',
      });
    }

    setDeletingFileId(null);
    setFileToDelete(null);
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">File History</h1>
            <p className="text-slate-400">Complete file upload and scan history</p>
          </div>
          <button
            onClick={loadFiles}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search files or students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FileStatus | 'All')}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === 'All' ? 'All Statuses' : status}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as FileCategory | 'All')}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'All' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Nombre Original
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Nombre S3 (UUID)
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Tamaño
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Tipo de Archivo
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Fecha y Hora de Carga
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.length > 0 ? (
                  filteredFiles.map((file) => (
                    <tr key={file.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="px-4 py-4 text-sm font-medium text-white truncate max-w-xs">
                        {file.original_name}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400 font-mono truncate max-w-xs">
                        {file.s3_input_key}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-400">{formatBytes(file.size)}</td>
                      <td className="px-4 py-4 text-sm text-slate-400">{file.file_type || file.category}</td>
                      <td className="px-4 py-4 text-sm font-medium">
                        {file.status === 'CLEAN' ? (
                          <span className="text-emerald-400">Limpio</span>
                        ) : file.status === 'QUARANTINED' ? (
                          <span className="text-red-400">Bloqueado por seguridad</span>
                        ) : file.status === 'ERROR' ? (
                          <span className="text-red-500">Error</span>
                        ) : (
                          <span className="text-cyan-400 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> En análisis
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-400">
                        {new Date(file.uploaded_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/files/${file.id}`}
                            className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {canDownload(file) ? (
                            <button
                              onClick={() => handleDownload(file)}
                              className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-2 text-slate-600 cursor-not-allowed"
                              title="Download not available"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => confirmDelete(file)}
                            disabled={deletingFileId === file.id}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingFileId === file.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <div className="text-slate-400">No files found matching your filters</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-slate-400">
            Showing {filteredFiles.length} of {files.length} files
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && fileToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Delete File?</h3>
                <p className="text-sm text-slate-400">
                  Are you sure you want to delete "{fileToDelete.original_name}"? This action
                  cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setFileToDelete(null);
                }}
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
