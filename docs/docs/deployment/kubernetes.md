---
sidebar_position: 2
---

# Kubernetes Deployment

Deploy Opsbot to a Kubernetes cluster.

## Quick Start

```bash
# Apply all manifests
kubectl apply -k deploy/kubernetes/

# Or individually
kubectl apply -f deploy/kubernetes/namespace.yaml
kubectl apply -f deploy/kubernetes/configmap.yaml
kubectl apply -f deploy/kubernetes/secret.yaml
kubectl apply -f deploy/kubernetes/rbac.yaml
kubectl apply -f deploy/kubernetes/pvc.yaml
kubectl apply -f deploy/kubernetes/deployment.yaml
kubectl apply -f deploy/kubernetes/service.yaml
```

## Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- Container registry access

## Configuration

### Secrets

Edit `deploy/kubernetes/secret.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: opsbot-secrets
  namespace: opsbot
stringData:
  anthropic-api-key: "sk-ant-..."
  telegram-bot-token: "123456:ABC..."  # Optional
  slack-bot-token: "xoxb-..."          # Optional
```

Apply secrets:

```bash
kubectl apply -f deploy/kubernetes/secret.yaml
```

### ConfigMap

Edit `deploy/kubernetes/configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: opsbot-config
  namespace: opsbot
data:
  config.json: |
    {
      "version": 1,
      "safety": {
        "mode": "plan-mode"
      },
      "skills": {
        "allowBundled": ["docker", "kubernetes", "terraform"]
      }
    }
```

## RBAC

Opsbot uses a read-only ClusterRole by default:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: opsbot-reader
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps", "events", "nodes"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "statefulsets", "daemonsets"]
    verbs: ["get", "list", "watch"]
```

### Enable Write Access

For plan-mode with actual execution, create an operator role:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: opsbot-operator
rules:
  - apiGroups: [""]
    resources: ["pods", "configmaps"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: ["apps"]
    resources: ["deployments", "statefulsets"]
    verbs: ["get", "list", "watch", "update", "patch"]
```

## Deployment

### Basic Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: opsbot
  namespace: opsbot
spec:
  replicas: 1
  selector:
    matchLabels:
      app: opsbot
  template:
    spec:
      serviceAccountName: opsbot
      containers:
        - name: opsbot
          image: ghcr.io/agenticdevops/opsbot:latest
          ports:
            - containerPort: 3000
          env:
            - name: ANTHROPIC_API_KEY
              valueFrom:
                secretKeyRef:
                  name: opsbot-secrets
                  key: anthropic-api-key
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 1Gi
```

### With Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: opsbot
  namespace: opsbot
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - opsbot.example.com
      secretName: opsbot-tls
  rules:
    - host: opsbot.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: opsbot
                port:
                  number: 80
```

## Kustomize

Use Kustomize for environment-specific configurations:

```yaml
# deploy/kubernetes/overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: opsbot-prod

resources:
  - ../../

images:
  - name: ghcr.io/agenticdevops/opsbot
    newTag: v1.0.0

patchesStrategicMerge:
  - deployment-patch.yaml
```

Apply:

```bash
kubectl apply -k deploy/kubernetes/overlays/production/
```

## Monitoring

### Health Checks

The deployment includes liveness and readiness probes:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

### View Logs

```bash
kubectl logs -f deployment/opsbot -n opsbot

# Previous container
kubectl logs deployment/opsbot -n opsbot --previous
```

### Check Status

```bash
kubectl get pods -n opsbot
kubectl describe pod -l app=opsbot -n opsbot
```

## Troubleshooting

### Pod not starting

```bash
# Check events
kubectl describe pod -l app=opsbot -n opsbot

# Check logs
kubectl logs -l app=opsbot -n opsbot
```

### RBAC issues

```bash
# Check service account
kubectl auth can-i list pods --as=system:serviceaccount:opsbot:opsbot

# Verify bindings
kubectl get clusterrolebindings | grep opsbot
```

### Secret not found

```bash
# Verify secret exists
kubectl get secrets -n opsbot

# Check secret content
kubectl get secret opsbot-secrets -n opsbot -o yaml
```
