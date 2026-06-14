import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ArchivoSubido } from './archivo-subido.entity';
import { ArchivosService } from './archivos.service';
import { ArchivosController } from './archivos.controller';

import { CloudStorageModule } from '../cloud-storage/cloud-storage.module';
import { AuthModule } from '../auth/auth.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArchivoSubido]),
    CloudStorageModule,
    AuthModule,
    UsuariosModule,
  ],
  controllers: [ArchivosController],
  providers: [ArchivosService],
  exports: [ArchivosService],
})
export class ArchivosModule { }