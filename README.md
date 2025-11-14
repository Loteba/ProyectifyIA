# ProyectifyIA

Monorepo con backend Node/Express y frontend React.

## Ejecutar localmente

```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd ../gestion-proyectos-frontend
npm install
npm start
```

## Despliegue en Railway

Crea **dos servicios separados** desde este repositorio:

1. **API**
   - Root directory: `backend`
   - Start command: `npm start`
   - Define todas las variables de `.env` (Mongo, JWT, Dropbox, etc.)

2. **Frontend**
   - Root directory: `gestion-proyectos-frontend`
   - Build command: `npm run build`
   - Start command: `npm run start:prod`
   - Variable `REACT_APP_API_URL` apuntando al dominio del backend

El script `start:prod` usa `serve` para publicar la carpeta `build` en el puerto especificado por Railway.
