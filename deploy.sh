#!/bin/bash

echo "🚀 Déploiement de BrandFou Image Generator"
echo "=========================================="

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé. Assurez-vous d'être dans le bon répertoire."
    exit 1
fi

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Erreur: Node.js n'est pas installé."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Vérifier que le serveur démarre
echo "🧪 Test de démarrage du serveur..."
timeout 10s npm start &
SERVER_PID=$!

sleep 5

# Tester l'API
echo "🔍 Test de l'API..."
if curl -s http://localhost:3000/api/status > /dev/null; then
    echo "✅ API fonctionnelle"
else
    echo "⚠️  API non accessible (normal si pas de clé API)"
fi

# Arrêter le serveur de test
kill $SERVER_PID 2>/dev/null

echo ""
echo "🎉 Préparation terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Créez un repository GitHub"
echo "2. Pushez votre code :"
echo "   git init"
echo "   git add ."
echo "   git commit -m 'Initial commit'"
echo "   git remote add origin YOUR_GITHUB_URL"
echo "   git push -u origin main"
echo ""
echo "3. Déployez sur Render :"
echo "   - Allez sur render.com"
echo "   - Connectez votre GitHub"
echo "   - Créez un nouveau Web Service"
echo "   - Sélectionnez votre repository"
echo "   - Configurez les variables d'environnement"
echo ""
echo "🔑 Variables d'environnement à ajouter :"
echo "   SEEDREAM_API_KEY=4048d7f1-78e9-4361-87c1-34b665eb8b5c"
echo "   SEEDREAM_BASE_URL=https://ark.ap-southeast.bytepluses.com/api/v3"
echo "   PORT=3000"
echo "   HOST=0.0.0.0"
echo "   DEMO_MODE=false"
