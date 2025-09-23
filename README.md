# 🎨 BrandFou - Générateur d'Images Automatique

Une application web qui génère automatiquement des images à partir de prompts en utilisant l'API Seedream et les met en ligne sur un site internet simple.

## ✨ Fonctionnalités

- **Génération automatique** : Crée une série d'images à partir de prompts prédéfinis
- **Prompts personnalisés** : Permet de générer des images avec vos propres descriptions
- **Interface moderne** : Interface web élégante et responsive
- **API Seedream** : Utilise la technologie de génération d'images Seedream
- **Mise en ligne automatique** : Les images générées sont immédiatement disponibles sur le site

## 🚀 Installation

1. **Cloner le projet** :
   ```bash
   git clone <votre-repo>
   cd BrandFou
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Configurer l'API** :
   - Votre clé API Seedream est déjà configurée : `4048d7f1-78e9-4361-87c1-34b665eb8b5c`
   - L'URL de base est configurée pour Poe.com

## 🎯 Utilisation

1. **Démarrer le serveur** :
   ```bash
   npm start
   # ou pour le développement
   npm run dev
   ```

2. **Accéder à l'application** :
   - Ouvrez votre navigateur sur `http://localhost:3000`

3. **Générer des images** :
   - **Série complète** : Cliquez sur "Générer la Série Complète" pour créer toutes les images prédéfinies
   - **Image personnalisée** : Entrez votre propre prompt et cliquez sur "Générer Image Personnalisée"

## 📝 Prompts Prédéfinis

L'application inclut une série de 8 prompts créatifs :

1. Un paysage montagneux avec des couleurs vives au coucher du soleil
2. Une ville futuriste avec des gratte-ciels lumineux et des voitures volantes
3. Un océan paisible avec des dauphins jouant dans les vagues
4. Une forêt magique avec des créatures fantastiques et des lueurs mystérieuses
5. Un désert avec des pyramides anciennes et un ciel étoilé
6. Une scène de space opera avec des vaisseaux spatiaux et des planètes lointaines
7. Un jardin zen japonais avec des cerisiers en fleurs
8. Une architecture gothique sombre avec des gargouilles et des vitraux

## 🛠️ API Endpoints

- `POST /api/generate-series` - Génère toutes les images de la série
- `POST /api/generate-single` - Génère une image unique à partir d'un prompt personnalisé
- `GET /api/prompts` - Récupère la liste des prompts prédéfinis

## 🎨 Personnalisation

### Ajouter de nouveaux prompts

Modifiez le tableau `promptSeries` dans `server.js` :

```javascript
const promptSeries = [
  "Votre nouveau prompt ici",
  // ... autres prompts
];
```

### Modifier le style

L'interface est entièrement stylée dans le fichier `public/index.html`. Vous pouvez :
- Changer les couleurs dans les variables CSS
- Modifier la disposition de la grille
- Ajouter de nouveaux éléments d'interface

## 📁 Structure du Projet

```
BrandFou/
├── server.js              # Serveur Express principal
├── package.json           # Configuration npm
├── public/               # Dossier frontend
│   ├── index.html        # Interface utilisateur
│   └── generated-images/ # Images générées (créé automatiquement)
└── README.md             # Documentation
```

## 🔧 Configuration Avancée

### Variables d'environnement

Créez un fichier `.env` pour personnaliser :

```env
SEEDREAM_API_KEY=votre_clé_api
SEEDREAM_BASE_URL=https://api.poe.com/v1
PORT=3000
NODE_ENV=production
```

### Déploiement

Pour mettre en ligne votre application :

1. **Heroku** :
   ```bash
   heroku create votre-app-name
   git push heroku main
   ```

2. **Vercel** :
   ```bash
   vercel --prod
   ```

3. **Serveur VPS** :
   ```bash
   pm2 start server.js --name "brandfou"
   ```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Proposer de nouveaux prompts
- Améliorer l'interface utilisateur
- Optimiser les performances
- Ajouter de nouvelles fonctionnalités

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails.

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez que votre clé API Seedream est valide
2. Assurez-vous que le serveur est démarré correctement
3. Consultez les logs du serveur pour plus d'informations

---

**Créé avec ❤️ par BrandFou**
