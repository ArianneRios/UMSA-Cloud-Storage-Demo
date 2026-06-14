import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { fileService } from '../../services/fileService';
import { useAuth } from '../../contexts/AuthContext';
import {
  Grid3X3,
  List,
  Download,
  Trash2,
  Eye,
  FileText,
  Search,
  HardDrive,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import type { FileCategory, FileStatus, UploadedFile } from '../../types';

export function StoragePage() {
  const { user, updateUserStorage } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<FileStatus | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);

  const loadFiles = async () => {
    if (!user) return;
    setIsLoading(true);
    const userFiles = await fileService.getFilesByUserId(user.id);
    setFiles(userFiles);
    setIsLoading(false);
  };

  useEffect(() => {
    loadFiles();
  }, [user]);

  const filteredFiles = files.filter((file) => {
    const matchesCategory = selectedCategory === 'All' || file.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || file.status === selectedStatus;
    const matchesSearch = file.original_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

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

  const statuses: Array<FileStatus | 'All'> = ['All', 'CLEAN', 'ANALYZING', 'QUARANTINED', 'ERROR'];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('presentation')) return '📊';
    if (type.includes('spreadsheet') || type.includes('excel')) return '📈';
    if (type.includes('image')) return '🖼️';
    return '📎';
  };

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
      window.open(url, '_blank');
      toast.success('Download started', { description: file.original_name });
    } catch (error: any) {
      toast.error('Download failed', {
        description: error.message || 'Could not generate download URL.',
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

    // Simulate deletion delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = await fileService.deleteFile(fileToDelete.id, user.id, user.name);

    if (success) {
      toast.success('File deleted', {
        description: `"${fileToDelete.original_name}" has been deleted.`,
      });
      loadFiles();
      
      // Update user storage
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

  // Calculate storage usage
  const totalStorage = user?.max_storage || 5368709120;
  const usedStorage = files.reduce((sum, f) => sum + f.size, 0);
  const storagePercentage = Math.round((usedStorage / totalStorage) * 100);

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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Cloud Storage</h1>
            <p className="text-slate-400">Manage and organize your academic files</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-800 border border-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <Link
              to="/upload"
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
            >
              Upload File
            </Link>
          </div>
        </div>

        {/* Storage usage */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-medium text-white">Storage Usage</span>
            </div>
            <span className="text-sm text-slate-400">
              {formatBytes(usedStorage)} / {formatBytes(totalStorage)}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                storagePercentage > 80
                  ? 'bg-red-500'
                  : storagePercentage > 60
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as FileCategory | 'All')}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'All' ? 'All Categories' : category}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as FileStatus | 'All')}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === 'All' ? 'All Statuses' : status}
              </option>
            ))}
          </select>
        </div>

        {/* Files display */}
        {filteredFiles.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-12 text-center">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {files.length === 0 ? 'No files yet' : 'No files match your filters'}
            </h3>
            <p className="text-slate-400 mb-4">
              {files.length === 0
                ? 'Upload your first file to get started'
                : 'Try adjusting your search or filters'}
            </p>
            {files.length === 0 && (
              <Link
                to="/upload"
                className="inline-block px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
              >
                Upload File
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{getFileIcon(file.file_type)}</div>
                  <StatusBadge status={file.status} size="sm" />
                </div>

                <h3 className="text-sm font-semibold text-white mb-1 truncate">
                  {file.original_name}
                </h3>

                {file.status === 'QUARANTINED' && (
                  <div className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2 mb-3">
                    Este archivo fue bloqueado por seguridad.
                  </div>
                )}

                <div className="text-xs text-slate-400 space-y-1 mb-4">
                  <div>{formatBytes(file.size)}</div>
                  <div>{file.category}</div>
                  <div>{new Date(file.uploaded_at).toLocaleDateString()}</div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/files/${file.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </Link>

                  {canDownload(file) ? (
                    <button
                      onClick={() => handleDownload(file)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 text-slate-600 rounded-lg text-xs font-medium cursor-not-allowed"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  )}

                  <button
                    onClick={() => confirmDelete(file)}
                    disabled={deletingFileId === file.id}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingFileId === file.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    File
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    Type
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    Size
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    Category
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    Uploaded
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getFileIcon(file.file_type)}</div>
                        <div className="text-sm font-medium text-white truncate max-w-xs">
                          {file.original_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {file.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{formatBytes(file.size)}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{file.category}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={file.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(file.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/files/${file.id}`}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {canDownload(file) ? (
                          <button
                            onClick={() => handleDownload(file)}
                            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="p-2 text-slate-600 rounded-lg cursor-not-allowed"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => confirmDelete(file)}
                          disabled={deletingFileId === file.id}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-sm text-slate-400">
          Showing {filteredFiles.length} of {files.length} files
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
