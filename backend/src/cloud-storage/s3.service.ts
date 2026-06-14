import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly inputBucket: string;
  private readonly cleanBucket: string;
  private readonly quarantineBucket: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION', 'us-west-2');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID', '');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY', '');

    console.log(`[S3 INIT] Inicializando cliente S3 en región: ${region}`);

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.inputBucket = this.configService.get<string>('AWS_BUCKET_INPUT') || this.configService.get<string>('AWS_S3_INPUT_BUCKET') || '';
    this.cleanBucket = this.configService.get<string>('AWS_BUCKET_CLEAN') || this.configService.get<string>('AWS_S3_CLEAN_BUCKET') || '';
    this.quarantineBucket = this.configService.get<string>('AWS_BUCKET_QUARANTINE') || this.configService.get<string>('AWS_S3_QUARANTINE_BUCKET') || '';

    const fallbackBucket = this.configService.get<string>('AWS_S3_BUCKET_NAME', '');
    if (!this.inputBucket) this.inputBucket = fallbackBucket;
    if (!this.cleanBucket) this.cleanBucket = fallbackBucket;
    if (!this.quarantineBucket) this.quarantineBucket = fallbackBucket;

    console.log(`[S3 INIT] Buckets configurados - Entrada: '${this.inputBucket}', Limpio: '${this.cleanBucket}', Cuarentena: '${this.quarantineBucket}'`);
  }

  async subirArchivoEntrada(key: string, buffer: Buffer, mimetype: string, disableAlertSpam = false): Promise<void> {
    try {
      console.log(`[S3 LOG] Subiendo archivo al bucket de entrada '${this.inputBucket}' con clave '${key}' (Alerta spam deshabilitada: ${disableAlertSpam})`);
      const command = new PutObjectCommand({
        Bucket: this.inputBucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
        Metadata: disableAlertSpam ? { 'disable-alert-spam': 'true' } : undefined,
      });
      await this.s3Client.send(command);
      console.log(`[S3 LOG] Archivo subido exitosamente a S3.`);
    } catch (error: any) {
      console.error(`[S3 ERROR] Error al subir a S3 en bucket '${this.inputBucket}':`, error.message || error);
      throw new InternalServerErrorException('Error al subir archivo a AWS S3');
    }
  }

  async obtenerUrlDescargaArchivoLimpio(key: string): Promise<string> {
    try {
      console.log(`[S3 LOG] Generando URL firmada para descarga desde bucket limpio '${this.cleanBucket}' con clave '${key}'`);
      
      const existe = await this.existeEnBucket(this.cleanBucket, key);
      if (!existe) {
        console.warn(`[S3 WARNING] El archivo '${key}' no existe en el bucket limpio '${this.cleanBucket}'`);
        throw new NotFoundException('El archivo todavía está en proceso de escaneo o no está disponible para descarga.');
      }
      
      const command = new GetObjectCommand({
        Bucket: this.cleanBucket,
        Key: key,
      });
      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });
      console.log(`[S3 LOG] URL firmada generada con éxito.`);
      return url;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`[S3 ERROR] Error al generar URL de descarga en bucket '${this.cleanBucket}':`, error.message || error);
      throw new InternalServerErrorException('Error al generar la URL de descarga de S3');
    }
  }

  async eliminarArchivoSiCorresponde(key: string): Promise<void> {
    try {
      console.log(`[S3 LOG] Intentando eliminar objeto de S3 con clave '${key}'`);
      if (this.cleanBucket) {
        const commandClean = new DeleteObjectCommand({
          Bucket: this.cleanBucket,
          Key: key,
        });
        await this.s3Client.send(commandClean);
        console.log(`[S3 LOG] Objeto eliminado del bucket limpio '${this.cleanBucket}'.`);
      }
      if (this.inputBucket && this.inputBucket !== this.cleanBucket) {
        const commandInput = new DeleteObjectCommand({
          Bucket: this.inputBucket,
          Key: key,
        });
        await this.s3Client.send(commandInput);
        console.log(`[S3 LOG] Objeto eliminado del bucket de entrada '${this.inputBucket}'.`);
      }
    } catch (error: any) {
      console.error(`[S3 ERROR] Error al eliminar de S3 con clave '${key}':`, error.message || error);
    }
  }

  async existeEnBucket(bucket: string, key: string): Promise<boolean> {
    if (!bucket) return false;
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  async obtenerEstadoPorBuckets(key: string): Promise<string> {
    const existeEnLimpio = await this.existeEnBucket(this.cleanBucket, key);
    if (existeEnLimpio) {
      return 'LIMPIO';
    }

    const existeEnCuarentena = await this.existeEnBucket(this.quarantineBucket, key);
    if (existeEnCuarentena) {
      return 'CUARENTENA';
    }

    const existeEnEntrada = await this.existeEnBucket(this.inputBucket, key);
    if (existeEnEntrada) {
      return 'ESCANEANDO';
    }

    return 'PENDIENTE';
  }

  getInputBucket(): string {
    return this.inputBucket;
  }

  getCleanBucket(): string {
    return this.cleanBucket;
  }

  getQuarantineBucket(): string {
    return this.quarantineBucket;
  }
}
