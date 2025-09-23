# 🚀 Déploiement sur Netlify - BrandFou Image Generator

## 📋 Prérequis
- Compte GitHub
- Compte Netlify (gratuit)
- Votre clé API Seedream

## 🔧 Étapes de déploiement

### 1. Préparer le repository GitHub
```bash
# Initialiser Git si pas déjà fait
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - BrandFou Image Generator"

# Créer un repository sur GitHub et l'ajouter
git remote add origin https://github.com/VOTRE_USERNAME/brandfou-image-generator.git
git branch -M main
git push -u origin main
```

### 2. Déployer sur Netlify

#### Option A: Via l'interface Netlify (Recommandé)
1. Allez sur [netlify.com](https://netlify.com)
2. Cliquez sur "New site from Git"
3. Choisissez "GitHub" et connectez votre compte
4. Sélectionnez votre repository `brandfou-image-generator`
5. Configurez les paramètres :
   - **Build command**: `npm run build`
   - **Publish directory**: `public`
   - **Functions directory**: `netlify/functions`

#### Option B: Via Netlify CLI
```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter à Netlify
netlify login

# Déployer depuis le dossier du projet
netlify deploy

# Pour un déploiement en production
netlify deploy --prod
```

### 3. Configurer les variables d'environnement

Dans le dashboard Netlify :
1. Allez dans **Site settings** > **Environment variables**
2. Ajoutez les variables suivantes :

```
SEEDREAM_API_KEY=4048d7f1-78e9-4361-87c1-34b665eb8b5c
SEEDREAM_BASE_URL=https://ark.ap-southeast.bytepluses.com/api/v3
NODE_ENV=production
```

### 4. Redéployer après configuration
- Allez dans **Deploys** > **Trigger deploy** > **Deploy site**

## 🌐 Votre site sera disponible sur :
- URL Netlify : `https://votre-site-name.netlify.app`
- Domaine personnalisé possible (gratuit)

## ✅ Vérification du déploiement

1. **Test de l'API** : `https://votre-site.netlify.app/api/status`
2. **Test de génération** : Utilisez l'interface web
3. **Logs** : Consultez les logs dans Netlify Dashboard

## 🔧 Dépannage

### Problème : API non accessible
- Vérifiez les variables d'environnement
- Redéployez le site
- Consultez les logs de build

### Problème : Fonctions non trouvées
- Vérifiez que `netlify/functions/server.js` existe
- Vérifiez la configuration `netlify.toml`

### Problème : Images ne se chargent pas
- Vérifiez les CORS
- Testez l'API Seedream directement

## 📊 Avantages Netlify
- ✅ **Gratuit** pour les sites personnels
- ✅ **SSL automatique**
- ✅ **CDN global**
- ✅ **Déploiement automatique** depuis GitHub
- ✅ **Fonctions serverless** incluses
- ✅ **Formulaires** et **analytics** disponibles

## 🎉 Félicitations !
Votre application BrandFou Image Generator est maintenant en ligne !
