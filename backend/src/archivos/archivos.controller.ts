import { Controller, Post, Get, Param, UseGuards, UseInterceptors, UploadedFile, Req, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArchivosService } from './archivos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('archivos')
@UseGuards(JwtAuthGuard)
export class ArchivosController {
  constructor(private readonly archivosService: ArchivosService) {}

  @Post('subir')
  @UseInterceptors(FileInterceptor('archivo'))
  async subirArchivo(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: any,
  ) {
    return this.archivosService.subirArchivo(request.user, file);
  }

  @Get('mis-archivos')
  async listarMisArchivos(@Req() request: any) {
    return this.archivosService.listarMisArchivos(request.user);
  }

  @Get('historial')
  async obtenerHistorial(@Req() request: any) {
    return this.archivosService.obtenerHistorial(request.user);
  }

  @Get(':id/estado')
  async obtenerEstado(@Param('id') id: string, @Req() request: any) {
    return this.archivosService.obtenerEstado(request.user, Number(id));
  }

  @Get(':id/descargar')
  async generarDescarga(@Param('id') id: string, @Req() request: any) {
    return this.archivosService.generarDescarga(request.user, Number(id));
  }

  @Delete(':id')
  async eliminarArchivo(@Param('id') id: string, @Req() request: any) {
    return this.archivosService.eliminarArchivo(request.user, Number(id));
  }
}
