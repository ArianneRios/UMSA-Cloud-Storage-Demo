import { Injectable, BadRequestException, InternalServerErrorException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { ArchivoSubido } from './archivo-subido.entity';
import { S3Service } from '../cloud-storage/s3.service';

@Injectable()
export class ArchivosService {
  constructor(
    @InjectRepository(ArchivoSubido)
    private readonly archivoRepository: Repository<ArchivoSubido>,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  async subirArchivo(usuario: any, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se envio ningun archivo');
    }

    const maxSize = 20 * 1024 * 1024; // 20 MB
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo supera el tamano permitido');
    }

    const originalName = file.originalname;
    if (!originalName || originalName.length > 255) {
      throw new BadRequestException('Nombre de archivo no valido o demasiado largo');
    }

    // Evitar rutas peligrosas en nombres de archivo
    if (originalName.includes('/') || originalName.includes('\\') || originalName.includes('..')) {
      throw new BadRequestException('Nombre de archivo contiene caracteres de ruta no permitidos');
    }

    const extension = originalName.split('.').pop()?.toLowerCase();
    if (!extension) {
      throw new BadRequestException('El archivo no tiene una extension valida');
    }

    const allowEicar = this.configService.get<string>('ALLOW_EICAR_TEST_FILES') === 'true';
    const isEicarCom = allowEicar && extension === 'com' && originalName.toLowerCase().includes('eicar');

    const ALLOWED_EXTENSIONS = ['txt', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'zip'];

    if (!ALLOWED_EXTENSIONS.includes(extension) && !isEicarCom) {
      throw new BadRequestException(`Extension de archivo no permitida: .${extension}`);
    }

    // Validar extension y MIME
    const mimeType = file.mimetype;
    let isMimeValid = false;

    if (extension === 'zip') {
      const allowedZipMimes = [
        'application/zip',
        'application/x-zip-compressed',
        'multipart/x-zip',
        'application/octet-stream'
      ];
      isMimeValid = allowedZipMimes.includes(mimeType);
    } else if (extension === 'com') {
      isMimeValid = mimeType === 'application/octet-stream';
    } else if (mimeType === 'application/octet-stream') {
      // Si recibe application/octet-stream, aceptar solo si la extension es .zip o si es .com eicar
      isMimeValid = false;
    } else {
      const allowedMimes = [
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
        'image/jpg'
      ];
      isMimeValid = allowedMimes.includes(mimeType);
    }

    if (!isMimeValid) {
      throw new BadRequestException(`MIME type no valido para la extension .${extension}: ${mimeType || 'desconocido'}`);
    }

    // Sanitizar el nombre original
    const nombreOriginalLimpio = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    
    // Cambiado a UUID-nombreOriginal.ext tal como se solicitó
    const key = `${uuidv4()}-${nombreOriginalLimpio}`;

    const bucketEntrada = this.s3Service.getInputBucket();
    const bucketLimpio = this.s3Service.getCleanBucket();
    const bucketCuarentena = this.s3Service.getQuarantineBucket();
    
    // Estado inicial de subida
    const estado = 'PENDIENTE';
    const resultadoEscaneo = 'Archivo registrado con estado PENDIENTE. Subiendo a S3.';
    const tamanoBytes = file.size;
    const tipoMime = file.mimetype;

    console.log(`[UPLOAD LOG] Usuario autenticado: ID ${usuario.idUsuario}, Correo: ${usuario.correo}`);
    console.log(`[UPLOAD LOG] Archivo recibido: '${originalName}', MIME: '${file.mimetype}', Tamaño: ${file.size} bytes`);
    console.log(`[UPLOAD LOG] s3_key generado: '${key}'`);

    let idArchivo;
    try {
      console.log(`[UPLOAD LOG] Registrando archivo en PostgreSQL mediante fn_registrar_archivo_subido...`);
      const result = await this.archivoRepository.query(
        `SELECT fn_registrar_archivo_subido($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) AS id_archivo;`,
        [
          usuario.idUsuario,
          nombreOriginalLimpio,
          key,
          bucketEntrada,
          bucketLimpio,
          bucketCuarentena,
          estado,
          resultadoEscaneo,
          tamanoBytes,
          tipoMime
        ]
      );
      idArchivo = result[0].id_archivo;
      console.log(`[UPLOAD LOG] Resultado de PostgreSQL: Guardado exitoso con ID ${idArchivo}`);
    } catch (error: any) {
      console.error(`[UPLOAD ERROR] Falló el registro en base de datos para '${nombreOriginalLimpio}':`, error.message || error);
      if (error.message && error.message.includes('Ya existe un archivo')) {
        throw new BadRequestException('Ya existe un archivo con ese nombre. Cambie el nombre del archivo.');
      }
      if (error.message && error.message.includes('El nombre')) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(error.message || 'Error al registrar el archivo en la base de datos');
    }

    const isEicar = originalName.toLowerCase().includes('eicar') || isEicarCom;
    const demoAutoQuarantine = this.configService.get<string>('DEMO_AUTO_QUARANTINE_EICAR') === 'true';
    const disableAlertSpam = this.configService.get<string>('DISABLE_DEMO_ALERT_SPAM') === 'true';

    let initialStatus = 'PENDIENTE';
    let initialResult = 'El archivo fue subido correctamente y está en proceso de análisis.';

    if (demoAutoQuarantine && isEicar) {
      initialStatus = 'CUARENTENA';
      initialResult = 'Archivo enviado a cuarentena por seguridad.';
      console.log(`[UPLOAD LOG] DEMO_AUTO_QUARANTINE_EICAR está en true y el archivo es EICAR. Forzando estado CUARENTENA.`);
    }

    try {
      console.log(`[UPLOAD LOG] Subiendo archivo físico a S3. Región: ${this.configService.get('AWS_REGION')}, Bucket: '${bucketEntrada}', Key: '${key}'`);
      await this.s3Service.subirArchivoEntrada(key, file.buffer, file.mimetype, disableAlertSpam);
      console.log(`[UPLOAD S3 SUCCESS] Archivo subido con éxito. Región: ${this.configService.get('AWS_REGION')}, Bucket: '${bucketEntrada}', Key: '${key}'`);
      
      // Actualizamos al estado correspondiente tras la subida exitosa a S3
      await this.archivoRepository.update(idArchivo, {
        estado: initialStatus,
        resultadoEscaneo: initialResult,
      });
    } catch (error: any) {
      console.error(`[UPLOAD S3 ERROR] Error al subir archivo. Región: ${this.configService.get('AWS_REGION')}, Bucket: '${bucketEntrada}', Key: '${key}', Error Name: ${error.name || 'S3Error'}, Error Message: ${error.message || error}`);
      
      // Actualizamos estado en base de datos para notificar el fallo de S3
      await this.archivoRepository.update(idArchivo, {
        estado: 'ERROR_S3',
        resultadoEscaneo: `Error al subir el archivo al bucket de entrada S3: ${error.message || error}`,
      });
      throw new InternalServerErrorException('Error al subir archivo a AWS S3');
    }

    const archivoGuardado = await this.archivoRepository.findOne({ where: { idArchivo } });

    return {
      mensaje: 'Archivo subido correctamente. El escaneo se ejecutara en AWS.',
      archivo: {
        idArchivo: archivoGuardado!.idArchivo,
        nombreOriginal: archivoGuardado!.nombreOriginal,
        estado: archivoGuardado!.estado,
        fechaSubida: archivoGuardado!.fechaSubida,
        resultadoEscaneo: archivoGuardado!.resultadoEscaneo,
      },
    };
  }

  async listarMisArchivos(usuario: any) {
    console.log(`[LIST LOG] Consultando archivos activos en base de datos para usuario ID: ${usuario.idUsuario}`);
    
    // Obtenemos solo los archivos del usuario que NO tengan estado 'ELIMINADO'
    const archivos = await this.archivoRepository.find({
      where: { idUsuario: usuario.idUsuario, estado: Not('ELIMINADO') },
      order: { fechaSubida: 'DESC' },
    });

    const listaActualizada: any[] = [];

    for (const archivo of archivos) {
      // Sincronizar estado real con S3 de forma dinámica
      if (archivo.estado === 'PENDIENTE' || archivo.estado === 'ESCANEANDO' || archivo.estado === 'ACTIVO') {
        const estadoS3 = await this.s3Service.obtenerEstadoPorBuckets(archivo.nombreS3);
        if (estadoS3 !== archivo.estado) {
          archivo.estado = estadoS3;
          if (estadoS3 === 'LIMPIO') {
            archivo.resultadoEscaneo = 'Archivo limpio detectado en bucket de salida.';
          } else if (estadoS3 === 'CUARENTENA') {
            archivo.resultadoEscaneo = 'Archivo malicioso detectado en bucket de cuarentena (aislado).';
          } else if (estadoS3 === 'ESCANEANDO') {
            archivo.resultadoEscaneo = 'El archivo fue subido correctamente y está en proceso de análisis.';
          }
          await this.archivoRepository.save(archivo);
        }
      }

      listaActualizada.push({
        idArchivo: archivo.idArchivo,
        nombreOriginal: archivo.nombreOriginal,
        estado: archivo.estado,
        tamanoBytes: Number(archivo.tamanoBytes),
        tipoMime: archivo.tipoMime,
        fechaSubida: archivo.fechaSubida,
        fechaActualizacion: archivo.fechaActualizacion,
        resultadoEscaneo: archivo.resultadoEscaneo,
      });
    }

    return listaActualizada;
  }

  async obtenerEstado(usuario: any, idArchivo: number) {
    console.log(`[STATE LOG] Consultando estado del archivo ID ${idArchivo} para usuario ID ${usuario.idUsuario}`);
    
    const archivo = await this.archivoRepository.findOne({
      where: { idArchivo, estado: Not('ELIMINADO') }
    });

    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado');
    }

    if (archivo.idUsuario !== usuario.idUsuario) {
      throw new ForbiddenException('No tienes permiso para ver este archivo');
    }

    if (archivo.estado === 'PENDIENTE' || archivo.estado === 'ESCANEANDO' || archivo.estado === 'ACTIVO') {
      const estadoS3 = await this.s3Service.obtenerEstadoPorBuckets(archivo.nombreS3);
      if (estadoS3 !== archivo.estado) {
        archivo.estado = estadoS3;
        if (estadoS3 === 'LIMPIO') {
          archivo.resultadoEscaneo = 'Archivo limpio detectado en bucket de salida.';
        } else if (estadoS3 === 'CUARENTENA') {
          archivo.resultadoEscaneo = 'Archivo malicioso detectado en bucket de cuarentena (aislado).';
        } else if (estadoS3 === 'ESCANEANDO') {
          archivo.resultadoEscaneo = 'El archivo fue subido correctamente y está en proceso de análisis.';
        }
        await this.archivoRepository.save(archivo);
      }
    }

    return {
      idArchivo: archivo.idArchivo,
      nombreOriginal: archivo.nombreOriginal,
      estado: archivo.estado,
      resultadoEscaneo: archivo.resultadoEscaneo,
    };
  }

  async generarDescarga(usuario: any, idArchivo: number) {
    console.log(`[DOWNLOAD LOG] Generando descarga de archivo ID ${idArchivo} para usuario ID ${usuario.idUsuario}`);
    
    const archivo = await this.archivoRepository.findOne({
      where: { idArchivo, estado: Not('ELIMINADO') }
    });

    if (!archivo) {
      console.warn(`[DOWNLOAD WARNING] Archivo ID ${idArchivo} no existe o fue eliminado.`);
      throw new NotFoundException('Archivo no encontrado');
    }

    if (archivo.idUsuario !== usuario.idUsuario) {
      console.warn(`[DOWNLOAD WARNING] Intento de acceso no autorizado de usuario ID ${usuario.idUsuario} a archivo de usuario ID ${archivo.idUsuario}`);
      throw new ForbiddenException('No tienes permiso para descargar este archivo');
    }

    console.log(`[DOWNLOAD LOG] s3_key a buscar: '${archivo.nombreS3}'`);

    // Usar el método semántico específico para generar URL firmada de descarga
    const url = await this.s3Service.obtenerUrlDescargaArchivoLimpio(archivo.nombreS3);

    return {
      url,
      expiraEnSegundos: 300,
    };
  }

  async obtenerHistorial(usuario: any) {
    console.log(`[HISTORY LOG] Consultando historial completo para usuario ID: ${usuario.idUsuario}`);
    
    // Obtenemos solo los archivos del usuario que NO tengan estado 'ELIMINADO'
    const archivos = await this.archivoRepository.find({
      where: { idUsuario: usuario.idUsuario, estado: Not('ELIMINADO') },
      order: { fechaSubida: 'DESC' },
    });

    return archivos.map(archivo => ({
      idArchivo: archivo.idArchivo,
      nombreOriginal: archivo.nombreOriginal,
      nombreS3: archivo.nombreS3,
      estado: archivo.estado,
      tamanoBytes: Number(archivo.tamanoBytes),
      tipoMime: archivo.tipoMime,
      fechaSubida: archivo.fechaSubida,
      fechaActualizacion: archivo.fechaActualizacion,
      resultadoEscaneo: archivo.resultadoEscaneo,
    }));
  }

  async eliminarArchivo(usuario: any, idArchivo: number) {
    console.log(`[DELETE LOG] Iniciando eliminación del archivo ID ${idArchivo} para usuario ID ${usuario.idUsuario}`);
    
    const archivo = await this.archivoRepository.findOne({
      where: { idArchivo, estado: Not('ELIMINADO') },
    });

    if (!archivo) {
      console.warn(`[DELETE WARNING] Archivo ID ${idArchivo} no encontrado o ya eliminado.`);
      throw new NotFoundException('Archivo no encontrado o ya eliminado');
    }

    if (archivo.idUsuario !== usuario.idUsuario) {
      console.warn(`[DELETE WARNING] Intento de borrado no autorizado del archivo perteneciente al usuario ID ${archivo.idUsuario}`);
      throw new ForbiddenException('No tienes permiso para eliminar este archivo');
    }

    // Realizar eliminación lógica
    archivo.estado = 'ELIMINADO';
    await this.archivoRepository.save(archivo);
    console.log(`[DELETE LOG] Archivo ID ${idArchivo} marcado con estado 'ELIMINADO' en PostgreSQL.`);

    // Opcionalmente eliminar físicamente de S3
    const deleteFromS3 = this.configService.get<string>('DELETE_FROM_S3_ON_LOGICAL_DELETE') === 'true';
    console.log(`[DELETE LOG] DELETE_FROM_S3_ON_LOGICAL_DELETE está en: ${deleteFromS3}`);
    
    if (deleteFromS3) {
      try {
        console.log(`[DELETE LOG] Eliminando objeto físico en S3 con clave: '${archivo.nombreS3}'`);
        await this.s3Service.eliminarArchivoSiCorresponde(archivo.nombreS3);
      } catch (s3Error: any) {
        console.error('Error al intentar borrar archivo de S3 durante eliminación lógica:', s3Error.message || s3Error);
      }
    }

    return {
      mensaje: 'Archivo eliminado correctamente (eliminación lógica)',
    };
  }
}
