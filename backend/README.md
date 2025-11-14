# AI Research Assistant

## Seguridad y privacidad

- Contraseñas cifradas con `bcrypt` (rondas configurables por `BCRYPT_ROUNDS`).
- Autenticación con JWT (`JWT_SECRET`, expiración 30d).
- HTTPS recomendado en producción (ver `gestion-proyectos-frontend/nginx.conf`).
- Redirección a HTTPS desde el backend si `ENFORCE_HTTPS=true`.
- Cabeceras de seguridad básicas (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy).
- Endpoints LPDP:
  - `GET /api/users/me` (perfil del usuario autenticado)
  - `DELETE /api/users/me` (derecho de supresión: elimina cuenta y datos asociados)

Consulta `docs/privacy/LPDP.md` para más detalles.
Asistente de investigación académica desarrollado con **MERN stack** (MongoDB, Express.js, React.js, Node.js) e integración de **Inteligencia Artificial** (OpenAI API / Hugging Face).  
El sistema permite gestionar proyectos de investigación de manera colaborativa, automatizar búsquedas bibliográficas y generar resúmenes automáticos de papers.  

---

## Características principales
- **Frontend:** React.js + Redux / Context API (diseño responsive).  
- **Backend:** Node.js + Express.js (API REST).  
- **Base de datos:** MongoDB Atlas.  
- **IA:**  
  - Chatbot académico (Gemini IA API / Hugging Face).  
  - Resumen automático de papers con NLP.  
- **Automatización:** Flujos con n8n (búsqueda → descarga → notificación → resumen).  
- **Seguridad:** Autenticación con JWT y gestión de roles.  
- **Contenerización:** Docker + docker-compose.  
- **Pruebas:** Jest (unitarias) y Cypress (E2E).  

---

## Arquitectura general
```mermaid
flowchart LR
  A[Frontend: React.js] --> B[Backend: Node.js + Express.js]
  B --> C[MongoDB Atlas]
  B --> D[IA: Gemini IA API / Hugging Face]
  B --> E[Automatización n8n]
