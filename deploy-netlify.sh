#!/bin/bash

echo "🚀 Déploiement BrandFou sur Netlify"
echo "=================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: package.json non trouvé. Assurez-vous d'être dans le bon répertoire.${NC}"
    exit 1
fi

# Vérifier que Git est initialisé
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git n'est pas initialisé. Initialisation...${NC}"
    git init
fi

# Ajouter tous les fichiers
echo -e "${BLUE}📦 Ajout des fichiers au repository Git...${NC}"
git add .

# Commit des changements
echo -e "${BLUE}💾 Création du commit...${NC}"
git commit -m "Deploy to Netlify - $(date)"

# Vérifier si un remote existe
if ! git remote get-url origin > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Aucun remote GitHub configuré.${NC}"
    echo -e "${BLUE}📝 Créez un repository sur GitHub et ajoutez-le :${NC}"
    echo -e "   git remote add origin https://github.com/VOTRE_USERNAME/brandfou-image-generator.git"
    echo -e "   git branch -M main"
    echo -e "   git push -u origin main"
    echo ""
    echo -e "${GREEN}✅ Fichiers prêts pour le déploiement !${NC}"
    echo ""
    echo -e "${BLUE}🔧 Prochaines étapes :${NC}"
    echo -e "1. Créez un repository sur GitHub"
    echo -e "2. Ajoutez le remote : git remote add origin YOUR_GITHUB_URL"
    echo -e "3. Pushez : git push -u origin main"
    echo -e "4. Allez sur netlify.com"
    echo -e "5. Créez un nouveau site depuis Git"
    echo -e "6. Sélectionnez votre repository"
    echo -e "7. Configurez les variables d'environnement"
    echo ""
    echo -e "${BLUE}🔑 Variables d'environnement Netlify :${NC}"
    echo -e "   SEEDREAM_API_KEY=4048d7f1-78e9-4361-87c1-34b665eb8b5c"
    echo -e "   SEEDREAM_BASE_URL=https://ark.ap-southeast.bytepluses.com/api/v3"
    echo -e "   NODE_ENV=production"
    exit 0
fi

# Pousser vers GitHub
echo -e "${BLUE}🚀 Push vers GitHub...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Code poussé vers GitHub avec succès !${NC}"
    echo ""
    echo -e "${BLUE}🌐 Votre site sera automatiquement déployé sur Netlify !${NC}"
    echo -e "${BLUE}📊 Consultez le dashboard Netlify pour suivre le déploiement.${NC}"
else
    echo -e "${RED}❌ Erreur lors du push vers GitHub.${NC}"
    echo -e "${YELLOW}💡 Vérifiez votre configuration Git et vos permissions.${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Déploiement terminé !${NC}"
echo -e "${BLUE}📱 Votre application sera disponible sur votre URL Netlify.${NC}"
