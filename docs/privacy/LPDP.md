# Cumplimiento LPDP (Ley de Protección de Datos Personales)

Este documento resume medidas técnicas y organizativas en el proyecto para cumplir con principios de seguridad y privacidad, y facilitar el ejercicio de derechos por parte de los titulares de los datos.

## Medidas implementadas

- Cifrado de contraseñas: bcrypt con rondas configurables (`BCRYPT_ROUNDS`).
- Autenticación: JWT con expiración y secreto en variable de entorno (`JWT_SECRET`).
- Tránsito seguro: Soporte para HTTPS mediante proxy inverso (Nginx) y redirección opcional en backend (`ENFORCE_HTTPS=true`).
- Cabeceras de seguridad: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy (backend y Nginx).
- Minimización de datos: Usuario almacena `name`, `email`, `password (hash)` únicamente.
- Derechos del titular:
  - Ver sus datos: `GET /api/users/me` (autenticado)
  - Supresión (eliminar cuenta): `DELETE /api/users/me` (autenticado, elimina usuario y datos asociados)

## Recomendaciones operativas

- HTTPS en todas las conexiones (producción):
  - Montar certificados en Nginx y habilitar bloque 80→443 (ver `gestion-proyectos-frontend/nginx.conf`).
  - Establecer `ENFORCE_HTTPS=true` en el servicio `api` para redirección desde HTTP a HTTPS.
- Gestión de secretos: No versionar secretos. Usar variables de entorno seguras (dotenv en local, secretos en CI/CD/infra en prod).
- Retención y borrado:
  - Definir políticas de retención para proyectos/tareas/biblioteca si aplica.
  - El endpoint de supresión elimina datos asociados (`Project`, `Task`, `LibraryItem`). Ajustar si se agregan nuevos recursos.
- Registros y monitoreo:
  - Evitar registrar datos personales y cuerpos de petición.
  - Establecer alertas y procedimiento de notificación de incidentes.
- Transferencias y encargados:
  - Documentar terceros (p. ej., proveedores IA, almacenamiento) y firmar acuerdos correspondientes.

## Variables de entorno relevantes

- `JWT_SECRET` (obligatoria en producción)
- `BCRYPT_ROUNDS` (opcional, por defecto 10; se recomienda ≥12 en prod)
- `ENFORCE_HTTPS` (`true` en producción tras habilitar TLS en el proxy)

## Textos legales

- Añadir página de Política de Privacidad y Términos en el frontend con:
  - Finalidades del tratamiento
  - Base legal/consentimiento
  - Derechos ARCO/ARCO-POL (acceso, rectificación, cancelación/supresión, oposición, portabilidad, limitación)
  - Contacto para ejercicio de derechos y DPO si aplica
  - Transferencias internacionales y terceros
  - Plazos de conservación

