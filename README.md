El Campito - Sistema de Gestión de Reservas

Una aplicación web completa para la gestión y reserva de canchas de fútbol 5. Desarrollada con una arquitectura Serverless utilizando Supabase como backend.

 Demo en vivo: https://sebasouzaa01.github.io/el-campito/

 Características Principales

Para el Cliente (Frontend Público)

Interfaz Inmersiva: Diseño "Dark Mode" con temática deportiva y Glassmorphism.

Reserva en Tiempo Real: Verificación instantánea de disponibilidad contra base de datos.

Validación Inteligente: Detección de horarios pasados, bloqueados o ya reservados.

UX/UI Moderna: Feedback visual de carga, modales interactivos y mapa integrado.

Para el Administrador (Backoffice)

Autenticación Segura: Login gestionado por Supabase Auth.

Dashboard de Gestión: Visualización de todas las reservas futuras.

Control de Stock: Capacidad de bloquear días (feriados/mantenimiento).

CMS de Precios: Edición de precios y horarios base sin tocar código.

 Stack Tecnológico

Frontend: HTML5, CSS3 (CSS Variables, Flexbox/Grid), JavaScript (ES6+).

Backend (BaaS): Supabase.

Base de Datos: PostgreSQL.

Seguridad: Row Level Security (RLS) para protección de datos a nivel de base de datos.

Despliegue: GitHub Pages.

 Arquitectura de Base de Datos

El proyecto utiliza PostgreSQL con las siguientes tablas y relaciones:

horarios_disponibles: Plantilla maestra de horarios y precios semanales.

reservas: Registros transaccionales de clientes.

bloqueos: Excepciones de calendario (feriados, lluvia).

perfiles_admin: Tabla de seguridad vinculada a auth.users.


 Instalación Local

Clonar el repositorio:

git clone [https://github.com/sebasouzaa01/el-campito.git](https://github.com/sebasouzaa01/el-campito.git)


Configurar variables de entorno:

Crear proyecto en Supabase.

Ejecutar el script SQL proporcionado en database.sql (si lo incluyeras).

Reemplazar SUPABASE_URL y SUPABASE_KEY en script.js.

Ejecutar servidor local:

python -m http.server
# O usar Live Server en VS Code


 Licencia

Este proyecto es de uso libre para fines educativos.
