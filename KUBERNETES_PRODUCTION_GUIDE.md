# Kubernetes Production Deployment Guide - Customer Data Platform

This guide provides comprehensive instructions for deploying the Customer Data Platform to Kubernetes in production environments.

## Prerequisites

### Required Tools
- **kubectl** (Kubernetes CLI)
- **Docker** (for building images)
- **Helm** (optional, for package management)
- Access to a Kubernetes cluster (EKS, GKE, AKS, or self-managed)

### Infrastructure Requirements
- **Kubernetes cluster** (v1.20+)
- **PostgreSQL database** (managed service recommended)
- **Redis** (managed service or in-cluster)
- **Container registry** (DockerHub, ECR, GCR, ACR)
- **Load balancer** (cloud provider or ingress controller)
- **SSL/TLS certificates** (Let's Encrypt or cloud provider)

## Step 1: Prepare Container Images

### Build and Push Production Image

```bash
# Build the production image
docker build -f Dockerfile.fixed -t your-registry/cdp-platform:latest .

# Tag with version
docker tag your-registry/cdp-platform:latest your-registry/cdp-platform:v1.0.0

# Push to registry
docker push your-registry/cdp-platform:latest
docker push your-registry/cdp-platform:v1.0.0
```

### Multi-Architecture Build (Optional)

```bash
# For ARM64 and AMD64 support
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 \
  -f Dockerfile.fixed \
  -t your-registry/cdp-platform:latest \
  --push .
```

## Step 2: Kubernetes Manifests

### Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: cdp-platform
  labels:
    name: cdp-platform
    environment: production
```

### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cdp-config
  namespace: cdp-platform
data:
  NODE_ENV: "production"
  PORT: "5000"
  HOST: "0.0.0.0"
  REDIS_URL: "redis://redis-service:6379"
```

### Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: cdp-secrets
  namespace: cdp-platform
type: Opaque
data:
  # Base64 encoded values
  database-url: <base64-encoded-database-url>
  session-secret: <base64-encoded-session-secret>
  # Add other sensitive configs here
```

### PostgreSQL Service (if using in-cluster)

```yaml
# k8s/postgres.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: cdp-platform
spec:
  serviceName: postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: cdp_platform
        - name: POSTGRES_USER
          value: cdp_user
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: cdp-secrets
              key: postgres-password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 20Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: cdp-platform
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

### Redis Deployment

```yaml
# k8s/redis.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: cdp-platform
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        volumeMounts:
        - name: redis-data
          mountPath: /data
      volumes:
      - name: redis-data
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: cdp-platform
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
```

### Main Application Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cdp-platform
  namespace: cdp-platform
  labels:
    app: cdp-platform
    version: v1.0.0
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cdp-platform
  template:
    metadata:
      labels:
        app: cdp-platform
        version: v1.0.0
    spec:
      imagePullSecrets:
      - name: regcred
      containers:
      - name: cdp-platform
        image: your-registry/cdp-platform:v1.0.0
        ports:
        - containerPort: 5000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: cdp-secrets
              key: database-url
        - name: SESSION_SECRET
          valueFrom:
            secretKeyRef:
              name: cdp-secrets
              key: session-secret
        envFrom:
        - configMapRef:
            name: cdp-config
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: uploads
          mountPath: /app/uploads
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: uploads
        persistentVolumeClaim:
          claimName: uploads-pvc
      - name: logs
        persistentVolumeClaim:
          claimName: logs-pvc
```

### Service

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: cdp-platform-service
  namespace: cdp-platform
spec:
  selector:
    app: cdp-platform
  ports:
  - name: http
    port: 80
    targetPort: 5000
  type: ClusterIP
```

### Persistent Volume Claims

```yaml
# k8s/pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: uploads-pvc
  namespace: cdp-platform
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
  storageClassName: efs-sc  # Use appropriate storage class
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: logs-pvc
  namespace: cdp-platform
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 5Gi
  storageClassName: efs-sc
```

### Ingress (with SSL)

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cdp-platform-ingress
  namespace: cdp-platform
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  tls:
  - hosts:
    - cdp.yourdomain.com
    secretName: cdp-platform-tls
  rules:
  - host: cdp.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: cdp-platform-service
            port:
              number: 80
```

### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: cdp-platform-hpa
  namespace: cdp-platform
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: cdp-platform
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Step 3: Deployment Commands

### Create Secrets

```bash
# Create database URL secret
kubectl create secret generic cdp-secrets \
  --from-literal=database-url="postgresql://user:pass@host:port/db" \
  --from-literal=session-secret="your-secret-key" \
  --namespace=cdp-platform
```

### Deploy Application

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply configuration
kubectl apply -f k8s/configmap.yaml

# Deploy application
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Check deployment status
kubectl rollout status deployment/cdp-platform -n cdp-platform
```

## Step 4: Monitoring and Scaling

### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: cdp-platform-hpa
  namespace: cdp-platform
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: cdp-platform
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Health Monitoring

```bash
# Check pod status
kubectl get pods -n cdp-platform

# View logs
kubectl logs deployment/cdp-platform -n cdp-platform

# Test health endpoint
kubectl port-forward service/cdp-platform-service 8080:80 -n cdp-platform
curl http://localhost:8080/health
```

## Step 5: Security Best Practices

1. **Use non-root containers**
2. **Implement RBAC**
3. **Network policies**
4. **Regular security updates**
5. **Secrets management**

## Step 6: Backup and Recovery

### Database Backup

```bash
# If using managed PostgreSQL, use cloud provider tools
# For in-cluster PostgreSQL:
kubectl exec -it postgres-pod -n cdp-platform -- pg_dump database > backup.sql
```

### Application Recovery

```bash
# Redeploy from manifests
kubectl apply -f k8s/
```

## Troubleshooting

### Common Issues

```bash
# Pod not starting
kubectl describe pod <pod-name> -n cdp-platform

# Check logs
kubectl logs <pod-name> -n cdp-platform
```

This guide provides the foundation for a production Kubernetes deployment of the Customer Data Platform. 