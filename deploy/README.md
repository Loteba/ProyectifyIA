Alta disponibilidad (HA) y despliegue en Kubernetes

Resumen
- API y Web con réplicas (2+) detrás de un Ingress con TLS.
- Liveness/Readiness probes: /healthz y /readyz en API; / en Web.
- HPA para autoescalado por CPU; PDB para evitar caídas por mantenimiento.
- MongoDB recomendado: Atlas replicaset (multi AZ) administrado.

Arquitectura
- Ingress → Service web (React/Nginx)
- Ingress /api → Service api (Node/Express)
- MongoDB Atlas (externo)

Preparación
1) Crea un cluster (GKE/AKS/EKS) y un Ingress Controller (nginx). Instala cert-manager si deseas TLS automático.
2) Ajusta deploy/k8s/config-secret.yaml con tus valores reales (JWT_SECRET, MONGO_URI, RESEND_* etc.).
3) Publica imágenes en un registry (reemplaza ghcr.io/your-org/... en los deployments).

Despliegue
kubectl apply -f deploy/k8s/namespace.yaml
kubectl apply -f deploy/k8s/config-secret.yaml
kubectl apply -f deploy/k8s/api-deployment.yaml
kubectl apply -f deploy/k8s/web-deployment.yaml
kubectl apply -f deploy/k8s/hpa-pdb.yaml
kubectl apply -f deploy/k8s/ingress.yaml

Comprobación
- kubectl get pods -n proyectify
- kubectl get ingress -n proyectify
- Probar /healthz y /readyz del API mediante Ingress.

SLO y monitoreo
- Objetivo: ≥99% disponibilidad (máx. ~7h/mes de indisponibilidad).
- Añade Prometheus/Grafana (o Cloud Monitoring) y alertas en /healthz y tasa de errores 5xx.
- Uptime checks externos (Pingdom, Cloud Monitoring Uptime).

Backups y DR
- MongoDB Atlas con backups automáticos y política de retención.
- Export de ConfigMaps/Secrets y manifiestos versionados.

Deploy sin downtime
- RollingUpdate por defecto en Deployments.
- Preparar readiness para esperar conexión a MongoDB.

