# Guide de Déploiement - BrandFou Image Generator

## 🚀 Déploiement sur Render (Recommandé)

### 1. Préparation
- Forkez ce repository sur GitHub
- Créez un compte sur [render.com](https://render.com)

### 2. Variables d'environnement à configurer
```
SEEDREAM_API_KEY=4048d7f1-78e9-4361-87c1-34b665eb8b5c
SEEDREAM_BASE_URL=https://ark.ap-southeast.bytepluses.com/api/v3
PORT=3000
HOST=0.0.0.0
DEMO_MODE=false
```

### 3. Configuration Render
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: Node
- **Node Version**: 18.x

## 🌐 Déploiement sur Vercel

### 1. Installation Vercel CLI
```bash
npm i -g vercel
```

### 2. Configuration
```bash
vercel
```

### 3. Variables d'environnement
Ajoutez dans le dashboard Vercel :
- `SEEDREAM_API_KEY`
- `SEEDREAM_BASE_URL`

## 🚄 Déploiement sur Railway

### 1. Connectez votre GitHub
- Allez sur [railway.app](https://railway.app)
- Connectez votre repository

### 2. Variables d'environnement
Ajoutez les variables dans Railway dashboard

## 📋 Checklist de déploiement

- [ ] Repository GitHub créé
- [ ] Variables d'environnement configurées
- [ ] API Seedream fonctionnelle
- [ ] Test local réussi
- [ ] Déploiement effectué
- [ ] Test en production
