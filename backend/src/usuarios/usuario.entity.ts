import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ArchivoSubido } from '../archivos/archivo-subido.entity';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  idUsuario!: number;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  correo!: string;

  @Column({ type: 'text', name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 30, default: 'ESTUDIANTE' })
  rol!: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVO' })
  estado!: string;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamp' })
  fechaCreacion!: Date;

  @OneToMany(() => ArchivoSubido, (archivo) => archivo.usuario)
  archivos!: ArchivoSubido[];
}
