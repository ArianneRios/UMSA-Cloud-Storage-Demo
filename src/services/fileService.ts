import type { UploadedFile, FileCategory, FileStatus } from '../types';
import { apiClient } from '../api/client';
import { logService } from './logService';

// Allowed file types for upload
export const ALLOWED_FILE_TYPES = [
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

class FileService {
  /**
   * Calculate SHA-256 hash of a file using Web Crypto API
   */
  async calculateSHA256(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const allowEicar = import.meta.env.VITE_ALLOW_EICAR_TEST_FILES === 'true';

    // Base extensions allowed
    const baseExtensions = ['txt', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'zip'];
    const isEicarCom = allowEicar && extension === 'com' && file.name.toLowerCase().includes('eicar');

    if (!baseExtensions.includes(extension) && !isEicarCom) {
      let allowedMsg = 'TXT, PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, PNG, JPG, JPEG, ZIP';
      if (allowEicar) {
        allowedMsg += ', COM (only for EICAR testing)';
      }
      return {
        valid: false,
        error: `File type not allowed. Allowed: ${allowedMsg}`,
      };
    }

    // Validate MIME type based on extension
    let isMimeValid = false;
    const mime = file.type;

    if (extension === 'zip') {
      const allowedZipMimes = [
        'application/zip',
        'application/x-zip-compressed',
        'multipart/x-zip',
        'application/octet-stream'
      ];
      isMimeValid = allowedZipMimes.includes(mime);
    } else if (extension === 'com') {
      isMimeValid = mime === 'application/octet-stream' || mime === '';
    } else {
      isMimeValid = ALLOWED_FILE_TYPES.includes(mime);
    }

    if (!isMimeValid) {
      return {
        valid: false,
        error: `Invalid MIME type for .${extension} file: ${mime || 'unknown'}`,
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds maximum of 20 MB`,
      };
    }

    return { valid: true };
  }

  private mapBackendStatus(estado: string): FileStatus {
    switch (estado) {
      case 'ESCANEANDO':
      case 'PENDIENTE':
      case 'ACTIVO':
        return 'ANALYZING';
      case 'LIMPIO':
      case 'ESCANEADO':
        return 'CLEAN';
      case 'CUARENTENA':
      case 'INFECTADO':
      case 'MALICIOSO':
        return 'QUARANTINED';
      case 'ERROR':
      case 'ERROR_S3':
      case 'ERROR_ANALISIS':
        return 'ERROR';
      case 'ELIMINADO':
        return 'ERROR';
      default:
        return 'UPLOADED';
    }
  }

  /**
   * Create a new file record
   */
  async createFile(
    file: File,
    category: FileCategory,
    studentId: string,
    studentName: string
  ): Promise<UploadedFile> {
    const response = await apiClient.uploadArchivo(file);
    const backendFile = response.archivo;
    
    let sha256 = '';
    try {
      sha256 = await this.calculateSHA256(file);
    } catch {
      // ignore
    }

    const uploadedFile: UploadedFile = {
      id: String(backendFile.idArchivo),
      student_id: studentId,
      student_name: studentName,
      original_name: backendFile.nombreOriginal,
      file_type: file.type,
      size: file.size,
      category: category,
      status: this.mapBackendStatus(backendFile.estado),
      sha256: sha256,
      s3_input_key: '',
      bucket_destination: '',
      uploaded_at: backendFile.fechaSubida,
      scanned_at: null,
      result: backendFile.resultadoEscaneo || null,
      virustotal_summary: null,
    };

    // Create upload log locally (can be removed if backend does it)
    logService.createLog({
      student_id: studentId,
      student_name: studentName,
      file_id: uploadedFile.id,
      file_name: file.name,
      action: 'FILE_UPLOADED',
      description: 'User uploaded file to backend',
      source: 'WEB_APP',
      status: 'SUCCESS',
    });

    return uploadedFile;
  }

  /**
   * Get files for a specific user
   */
  async getFilesByUserId(userId: string): Promise<UploadedFile[]> {
    const backendFiles = await apiClient.getMisArchivos();
    return backendFiles.map((bf: any) => ({
      id: String(bf.idArchivo),
      student_id: userId,
      student_name: 'User', // Note: backend doesn't return this, but frontend needs something. The pages will get it.
      original_name: bf.nombreOriginal,
      file_type: bf.tipoMime,
      size: Number(bf.tamanoBytes),
      category: 'Documents' as FileCategory,
      status: this.mapBackendStatus(bf.estado),
      sha256: '',
      s3_input_key: '',
      bucket_destination: '',
      uploaded_at: bf.fechaSubida,
      scanned_at: (bf.estado === 'LIMPIO' || bf.estado === 'MALICIOSO') ? bf.fechaActualizacion : null,
      result: bf.resultadoEscaneo || null,
      virustotal_summary: null,
    }));
  }

  /**
   * Get history for a specific user
   */
  async getHistory(userId: string): Promise<UploadedFile[]> {
    const backendFiles = await apiClient.getHistorial();
    return backendFiles.map((bf: any) => ({
      id: String(bf.idArchivo),
      student_id: userId,
      student_name: 'User',
      original_name: bf.nombreOriginal,
      file_type: bf.tipoMime,
      size: Number(bf.tamanoBytes),
      category: 'Documents' as FileCategory,
      status: this.mapBackendStatus(bf.estado),
      sha256: '',
      s3_input_key: bf.nombreS3,
      bucket_destination: '',
      uploaded_at: bf.fechaSubida,
      scanned_at: bf.fechaActualizacion,
      result: bf.resultadoEscaneo || null,
      virustotal_summary: null,
    }));
  }

  /**
   * Get a file by ID
   */
  async getFileById(fileId: string): Promise<UploadedFile | null> {
    try {
      const stateResponse = await apiClient.getEstadoArchivo(fileId);
      // Backend returns { idArchivo, nombreOriginal, estado, resultadoEscaneo }
      // To get full info, we might need to get all files or just return partial info
      const files = await this.getFilesByUserId('current'); // user ID doesn't matter much for this API
      const file = files.find((f) => f.id === String(fileId)) || null;
      if (file && stateResponse) {
        file.status = this.mapBackendStatus(stateResponse.estado);
        file.result = stateResponse.resultadoEscaneo || file.result;
      }
      return file;
    } catch {
      return null;
    }
  }

  /**
   * Download a file
   */
  async downloadFile(fileId: string): Promise<string> {
    const response = await apiClient.getUrlDescarga(fileId);
    return response.url;
  }

  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<{
    total_files: number;
    clean_files: number;
    quarantined_files: number;
    analyzing_files: number;
    error_files: number;
    storage_used: number;
    registered_students: number;
  }> {
    try {
      const files = await this.getFilesByUserId('current');
      return {
        total_files: files.length,
        clean_files: files.filter((f) => f.status === 'CLEAN').length,
        quarantined_files: files.filter((f) => f.status === 'QUARANTINED').length,
        analyzing_files: files.filter((f) => f.status === 'ANALYZING' || f.status === 'UPLOADED').length,
        error_files: files.filter((f) => f.status === 'ERROR').length,
        storage_used: files.reduce((sum, f) => sum + f.size, 0),
        registered_students: 1,
      };
    } catch {
      return {
        total_files: 0,
        clean_files: 0,
        quarantined_files: 0,
        analyzing_files: 0,
        error_files: 0,
        storage_used: 0,
        registered_students: 1,
      };
    }
  }

  /**
   * Get storage used by a specific user
   */
  async getUserStorageUsed(userId: string): Promise<number> {
    try {
      const files = await this.getFilesByUserId(userId);
      return files.reduce((sum, f) => sum + f.size, 0);
    } catch {
      return 0;
    }
  }

  /**
   * Delete a file logically via the API client
   */
  async deleteFile(fileId: string, userId: string, userName: string): Promise<boolean> {
    try {
      await apiClient.deleteArchivo(fileId);
      
      logService.createLog({
        student_id: userId,
        student_name: userName,
        file_id: fileId,
        file_name: null,
        action: 'FILE_DELETED',
        description: `Archivo con ID ${fileId} eliminado lógicamente`,
        source: 'WEB_APP',
        status: 'SUCCESS',
      });
      return true;
    } catch (error) {
      console.error('Error al eliminar el archivo:', error);
      return false;
    }
  }
}

export const fileService = new FileService();
