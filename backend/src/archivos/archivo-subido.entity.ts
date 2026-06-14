import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';


@Entity({ name: 'mis_guardados' })
export class ArchivoSubido {
  @PrimaryGeneratedColumn({ name: 'id_mg' })
  idArchivo!: number;

  @Column({ name: 'id_user' })
  idUsuario!: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.archivos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_user' })
  usuario!: Usuario;

  @Column({ type: 'varchar', length: 255, name: 'nombre_ori' })
  nombreOriginal!: string;

  @Column({ type: 'varchar', length: 500, name: 's3_key', unique: true })
  nombreS3!: string;

  @Column({ type: 'varchar', length: 150, name: 'bucket_entrada', nullable: true })
  bucketEntrada!: string;

  @Column({ type: 'varchar', length: 150, name: 'bucket_limpio', nullable: true })
  bucketLimpio!: string;

  @Column({ type: 'varchar', length: 150, name: 'bucket_cuarentena', nullable: true })
  bucketCuarentena!: string;

  @Column({ type: 'varchar', length: 30, default: 'ACTIVO' })
  estado!: string;

  @Column({ type: 'text', name: 'resultado_escaneo', nullable: true })
  resultadoEscaneo!: string;

  @Column({ type: 'bigint', name: 'tamano_bytes', nullable: true })
  tamanoBytes!: number;

  @Column({ type: 'varchar', length: 100, name: 'tipo_mime', nullable: true })
  tipoMime!: string;

  @CreateDateColumn({ name: 'fecha_hora', type: 'timestamp' })
  fechaSubida!: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamp' })
  fechaActualizacion!: Date;
}
