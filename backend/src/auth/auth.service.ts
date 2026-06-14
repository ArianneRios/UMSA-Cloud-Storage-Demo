import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const usuario = await this.usuariosService.buscarPorCorreo(loginDto.correo);

    if (!usuario) {
      throw new UnauthorizedException('Correo o password incorrectos');
    }

    if (usuario.estado !== 'ACTIVO') {
      throw new UnauthorizedException('Correo o password incorrectos');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, usuario.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Correo o password incorrectos');
    }

    const payload = {
      sub: usuario.idUsuario,
      correo: usuario.correo,
      rol: usuario.rol,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      usuario: {
        idUsuario: usuario.idUsuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    };
  }
}
