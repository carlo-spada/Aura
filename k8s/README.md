## Kubernetes Manifests (Lightweight)

These example manifests deploy the AURA API and Dashboard to a cluster with an Ingress controller (e.g., NGINX) and cert-manager for TLS.

Prereqs
- Ingress controller installed (e.g., ingress-nginx)
- cert-manager with a `ClusterIssuer` named `letsencrypt-prod`
- A container image built and pushed (override the image in the manifests)
- External Postgres (recommended) and a `DATABASE_URL` secret

Quickstart
```
kubectl create namespace aura
# Create secret with DATABASE_URL
kubectl -n aura create secret generic aura-env \
  --from-literal=DATABASE_URL='postgresql+psycopg://user:pass@host:5432/db' \
  --from-literal=LOG_LEVEL='INFO'

# Edit the image and host in the YAML files, then:
kubectl -n aura apply -f aura-api-deployment.yaml
kubectl -n aura apply -f aura-api-service.yaml
kubectl -n aura apply -f aura-dashboard-deployment.yaml
kubectl -n aura apply -f aura-dashboard-service.yaml
kubectl -n aura apply -f aura-ingress.yaml
```

