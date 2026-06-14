# UMSA Cloud Storage

Sistema web de almacenamiento en la nube para estudiantes de la Universidad Mayor de San Andrés, con una capa de seguridad para el escaneo automático de archivos antes de que estén disponibles para el usuario.

## Descripción

UMSA Cloud Storage permite a los estudiantes iniciar sesión, subir archivos académicos, organizarlos por categorías, revisar el uso de almacenamiento y consultar el estado de seguridad de cada archivo.

El proyecto está basado en una arquitectura cloud donde los archivos se suben a AWS S3, son analizados por AWS Lambda mediante hash SHA-256 y verificados con VirusTotal. Según el resultado, los archivos se clasifican como limpios o se aíslan en cuarentena. Además, se consideran alertas con SNS y monitoreo con CloudWatch.

## Flujo general

Estudiante → Web App → NestJS API → PostgreSQL → AWS S3 Input Bucket → AWS Lambda Scanner → VirusTotal → S3 Clean Bucket / S3 Quarantine Bucket → SNS Alerts → CloudWatch Logs

> [!IMPORTANT]
> El análisis de malware se realiza de forma asíncrona mediante una Lambda externa. Si la Lambda no está activa, el archivo permanecerá en estado ESCANEANDO o PENDIENTE.

## Tecnologías actuales

### Frontend

- Vite
- React
- TypeScript
- Tailwind CSS
- React Router
- LocalStorage para modo demo

### Backend esperado

- NestJS
- PostgreSQL
- AWS SDK
- AWS S3
- AWS Lambda
- VirusTotal API
- Amazon SNS
- Amazon CloudWatch

## Funcionalidades actuales

- Login demo
- Rutas protegidas
- Dashboard principal
- Subida de archivos
- Cálculo de hash SHA-256
- Simulación del escaneo de malware
- Clasificación de archivos como limpios o en cuarentena
- Historial de archivos
- Detalle de archivo
- Logs de auditoría
- Configuración visual de PostgreSQL y AWS
- Persistencia con LocalStorage

## Seguridad

El sistema considera dos tipos de hash:

1. Hash de contraseña:
   - En el backend real, las contraseñas se guardarán como `password_hash`.
   - Se recomienda usar bcrypt o Argon2.
   - No se deben guardar contraseñas en texto plano.

2. Hash de archivo:
   - Cada archivo subido genera un hash SHA-256.
   - Este hash funciona como huella digital del archivo.
   - En la integración real, será usado para consultar VirusTotal.

## Modo demo

Actualmente el sistema funciona en modo demo usando LocalStorage.

Esto significa que:

- No existe conexión real todavía con PostgreSQL.
- No existe conexión real todavía con AWS S3.
- No existe consulta real todavía a VirusTotal.
- El flujo de escaneo está simulado.
- Los datos se guardan localmente en el navegador.

## Instalación

Instalar dependencias y ejecutar en modo desarrollo:

```bash
npm install
npm run dev
```

### Backend (Carpeta `backend`)

Instalar dependencias y ejecutar en modo desarrollo:

```bash
cd backend
npm install
npm run start:dev
```