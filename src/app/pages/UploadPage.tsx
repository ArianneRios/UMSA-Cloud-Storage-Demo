import { useState } from 'react';
import { Link } from 'react-router';
import { Layout } from '../components/Layout';
import {
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Shield,
  Database,
  Cloud,
  AlertCircle,
  Hash,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { fileService, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../../services/fileService';
import { logService } from '../../services/logService';
import type { FileCategory, FileStatus, UploadedFile } from '../../types';

type UploadStage = 'idle' | 'hashing' | 'uploading' | 'scanning' | 'complete' | 'timeout';

export function UploadPage() {
  const { user, updateUserStorage } = useAuth();
  const allowEicar = import.meta.env.VITE_ALLOW_EICAR_TEST_FILES === 'true';
  const demoAutoQuarantine = import.meta.env.VITE_DEMO_AUTO_QUARANTINE_EICAR === 'true';
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<FileCategory>('Documents');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState<FileStatus | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const [sha256Hash, setSha256Hash] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories: FileCategory[] = [
    'Documents',
    'Assignments',
    'Research',
    'Presentations',
    'Images',
    'Spreadsheets',
    'Other',
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const file = e.dataTransfer.files[0];
    validateAndSetFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validation = fileService.validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'File validation failed');
      toast.error('Invalid file', { description: validation.error });
      return;
    }
    setSelectedFile(file);
  };

  const simulateUpload = async () => {
    if (!selectedFile || !user) return;

    setError(null);
    setUploadStage('hashing');

    try {
      // Step 1: Calculate SHA-256 hash
      const hash = await fileService.calculateSHA256(selectedFile);
      setSha256Hash(hash);
      
      toast.info('SHA-256 Calculated', {
        description: 'File fingerprint generated for malware verification',
      });

      // Step 2: Upload to backend
      setUploadStage('uploading');
      
      // Simulate progress bar visually while uploading
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 200);

      const file = await fileService.createFile(
        selectedFile,
        category,
        user.id,
        user.name
      );

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadedFile(file);
      setScanStatus('ANALYZING');

      // Step 3: Wait for AWS scanning workflow
      setUploadStage('scanning');
      
      toast.info('Scanning in progress', {
        description: 'AWS Lambda and VirusTotal are analyzing your file...',
      });

      // Poll the backend for the real status for up to 30 seconds (15 iterations of 2 seconds)
      let finalStatus: FileStatus = 'ANALYZING';
      let updatedFile = file;
      let isTimeout = true;

      for (let i = 0; i < 15; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        const checkFile = await fileService.getFileById(file.id);
        if (checkFile && checkFile.status !== 'ANALYZING' && checkFile.status !== 'UPLOADED') {
          finalStatus = checkFile.status;
          updatedFile = checkFile;
          isTimeout = false;
          break;
        }
      }

      setScanStatus(finalStatus);
      setUploadedFile(updatedFile);

      // Update user storage
      const newStorageUsed = await fileService.getUserStorageUsed(user.id);
      updateUserStorage(newStorageUsed);

      if (isTimeout) {
        setUploadStage('timeout');
        toast.info('Análisis en segundo plano', {
          description: 'El análisis continúa en segundo plano. Revisa el historial más tarde.',
        });
      } else {
        setUploadStage('complete');
        if (finalStatus === 'CLEAN') {
          toast.success('File is Clean!', {
            description: 'Your file passed security scanning and is now available.',
          });
        } else if (finalStatus === 'QUARANTINED') {
          toast.error('File Quarantined', {
            description: 'A potential threat was detected. The file has been isolated.',
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload. Please try again.');
      setUploadStage('idle');
      toast.error('Upload failed', {
        description: err.message || 'An error occurred during the upload process.',
      });
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setScanStatus(null);
    setUploadStage('idle');
    setSha256Hash(null);
    setUploadedFile(null);
    setError(null);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const isUploading = uploadStage !== 'idle' && uploadStage !== 'complete';

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Upload File</h1>
          <p className="text-slate-400">
            Upload your academic files securely to UMSA Cloud Storage
          </p>
        </div>

        {/* Security info banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300 space-y-2">
              <p>
                <strong className="text-white">
                  Every file is scanned before becoming available in UMSA Cloud Storage.
                </strong>
              </p>
              <p className="text-xs text-slate-400">
                Upload record is stored in PostgreSQL before being sent to AWS S3.
              </p>
              <p className="text-xs text-slate-400">
                SHA-256 is used to generate a unique file fingerprint for malware verification.
              </p>
              <p className="text-xs text-cyan-400 font-medium">
                El análisis de malware se realiza de forma asíncrona mediante una Lambda externa. Si la Lambda no está activa, el archivo permanecerá en estado ESCANEANDO o PENDIENTE.
              </p>
            </div>
          </div>
        </div>

        {/* Upload card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-8">
          {!selectedFile ? (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-300">{error}</div>
                </div>
              )}
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                  isDragging
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <Upload className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Drag and drop your file here
                </h3>
                <p className="text-sm text-slate-400 mb-4">or click to browse</p>

                <label className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-lg cursor-pointer transition-all">
                  Select File
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept={`.txt,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.zip${allowEicar ? ',.com' : ''}`}
                  />
                </label>

                <div className="mt-6 text-xs text-slate-500 space-y-1">
                  <div>Allowed: TXT, PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, PNG, JPG, JPEG, ZIP</div>
                  {allowEicar && (
                    <div className="text-cyan-400 font-medium">
                      COM files allowed only for EICAR testing.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {/* File info */}
              <div className="flex items-start gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                <FileText className="w-10 h-10 text-cyan-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {selectedFile.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {formatBytes(selectedFile.size)} · {selectedFile.type || 'Unknown type'}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Category: {category}</div>
                </div>
                {uploadStage === 'idle' && (
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Category selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FileCategory)}
                  disabled={isUploading || uploadStage === 'complete'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* SHA-256 Hash display */}
              {sha256Hash && (
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-cyan-400 uppercase">
                      SHA-256 File Hash
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-300 break-all">{sha256Hash}</div>
                </div>
              )}

              {/* Stage: Hashing */}
              {uploadStage === 'hashing' && (
                <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                  <div className="text-sm text-slate-300">
                    Calculating SHA-256 hash...
                  </div>
                </div>
              )}

              {/* Stage: Uploading */}
              {uploadStage === 'uploading' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-medium text-white">
                        Uploading to AWS S3...
                      </span>
                    </div>
                    <span className="text-sm text-slate-400">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Stage: Scanning */}
              {uploadStage === 'scanning' && scanStatus === 'ANALYZING' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        El archivo fue subido correctamente y está en proceso de análisis.
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        This may take a few moments
                      </div>
                    </div>
                  </div>

                  {allowEicar && selectedFile && selectedFile.name.toLowerCase().includes('eicar') && !demoAutoQuarantine && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
                      Archivo de prueba EICAR detectado. El análisis puede finalizar en CUARENTENA cuando la Lambda procese el archivo.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                      <Cloud className="w-4 h-4 text-orange-400" />
                      <span className="text-xs text-slate-300">AWS Lambda</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                      <Shield className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs text-slate-300">VirusTotal API</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stage: Timeout / Background Analysis */}
              {uploadStage === 'timeout' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-blue-400 mb-1">
                        El archivo fue subido correctamente.
                      </div>
                      <div className="text-xs text-slate-300">
                        El análisis continúa en segundo plano. Revisa el historial más tarde.
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={resetUpload}
                      className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      Upload Another
                    </button>
                    <Link
                      to="/storage"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all text-center"
                    >
                      View My Files
                    </Link>
                  </div>

                  <Link
                    to="/history"
                    className="flex items-center justify-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <History className="w-4 h-4" />
                    View upload history
                  </Link>
                </div>
              )}

              {/* Stage: Complete - Clean */}
              {uploadStage === 'complete' && scanStatus === 'CLEAN' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-emerald-400 mb-1">
                        File is Clean!
                      </div>
                      <div className="text-xs text-slate-300">
                        This file passed the security scan and is available for download.
                      </div>
                      {uploadedFile?.virustotal_summary && (
                        <div className="text-xs text-slate-400 mt-2">
                          {uploadedFile.virustotal_summary}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={resetUpload}
                      className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      Upload Another
                    </button>
                    <Link
                      to="/storage"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all text-center"
                    >
                      View My Files
                    </Link>
                  </div>

                  <Link
                    to="/history"
                    className="flex items-center justify-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <History className="w-4 h-4" />
                    View upload history
                  </Link>
                </div>
              )}

              {/* Stage: Complete - Quarantined */}
              {uploadStage === 'complete' && scanStatus === 'QUARANTINED' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border-2 border-red-500/20 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-red-400 mb-1">
                        File Quarantined
                      </div>
                      <div className="text-xs text-slate-300">
                        {uploadedFile?.result || "Archivo enviado a cuarentena por seguridad."}
                      </div>
                      {uploadedFile?.virustotal_summary && (
                        <div className="text-xs text-red-300 mt-2 font-medium">
                          {uploadedFile.virustotal_summary}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={resetUpload}
                    className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Upload Another File
                  </button>

                  <Link
                    to="/history"
                    className="flex items-center justify-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <History className="w-4 h-4" />
                    View upload history
                  </Link>
                </div>
              )}

              {/* Start upload button */}
              {uploadStage === 'idle' && (
                <button
                  onClick={simulateUpload}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
                >
                  Start Upload
                </button>
              )}
            </div>
          )}
        </div>

        {/* Workflow info */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="font-bold text-white mb-4">Security Workflow</h3>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full flex-shrink-0"></div>
              <span>{'Student -> Web App -> NestJS API'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full flex-shrink-0"></div>
              <span>{'PostgreSQL -> AWS S3 Input Bucket'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full flex-shrink-0"></div>
              <span>{'AWS Lambda -> SHA-256 Hash -> VirusTotal'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0"></div>
              <span>{'Clean -> S3 Clean Bucket'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0"></div>
              <span>{'Threat -> S3 Quarantine + SNS Alert'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full flex-shrink-0"></div>
              <span>{'CloudWatch Logs'}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
