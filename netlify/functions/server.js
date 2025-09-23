const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const { OpenAI } = require('openai');
const config = require('../../config');

const app = express();

// Configuration OpenAI pour Seedream
let isApiValid = false;

// Test de l'API au démarrage
async function testApiConnection() {
  try {
    console.log('🔍 Test de connexion à l\'API Seedream...');
    
    // Test direct avec l'API BytePlus
    const response = await axios.post(
      `${config.seedream.baseUrl}/images/generations`,
      {
        model: config.seedream.model,
        prompt: "test image",
        sequential_image_generation: "disabled",
        response_format: "url",
        size: "1K",
        watermark: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.seedream.apiKey}`
        }
      }
    );
    
    console.log('✅ API Seedream validée - Mode PRODUCTION activé');
    isApiValid = true;
    
  } catch (error) {
    console.log('⚠️  API Seedream non accessible:', error.response?.data?.error?.message || error.message);
    console.log('🎭 Activation du mode DÉMONSTRATION');
    isApiValid = false;
  }
}

// Initialiser la connexion API
testApiConnection();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Fonction pour générer une image avec Seedream
async function generateImage(prompt, index) {
  try {
    console.log(`Génération de l'image ${index + 1}: ${prompt.substring(0, 50)}...`);
    
    if (!isApiValid) {
      // Mode démonstration avec des images aléatoires
      console.log('🎭 Mode démonstration - utilisation d\'images de test');
      
      // Simuler un délai de génération
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const imageUrl = config.demoImages[index] || `https://picsum.photos/1920/1080?random=${index + 10}&blur=1`;
      
      return {
        success: true,
        imageUrl: imageUrl,
        prompt: prompt,
        index: index,
        demoMode: true,
        message: 'Image de démonstration générée'
      };
    } else {
      // Mode production avec l'API Seedream
      console.log('🚀 Mode production - génération avec Seedream API');
      
      const response = await axios.post(
        `${config.seedream.baseUrl}/images/generations`,
        {
          model: config.seedream.model,
          prompt: prompt,
          sequential_image_generation: "disabled",
          response_format: "url",
          size: "2K",
          watermark: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.seedream.apiKey}`
          }
        }
      );

      console.log('✅ Image générée avec succès via Seedream');
      
      // Récupérer l'URL de l'image générée depuis la réponse
      const imageUrl = response.data.data[0]?.url || 
                      `https://via.placeholder.com/1920x1080/00FF00/FFFFFF?text=Seedream+${index + 1}`;
      
      return {
        success: true,
        imageUrl: imageUrl,
        prompt: prompt,
        index: index,
        demoMode: false,
        message: 'Image générée avec Seedream API'
      };
    }
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error.message);
    
    // En cas d'erreur, utiliser une image de démonstration
    const fallbackImage = config.demoImages[index] || `https://via.placeholder.com/1920x1080/FF6B6B/FFFFFF?text=Erreur+${index + 1}`;
    
    return {
      success: false,
      imageUrl: fallbackImage,
      prompt: prompt,
      index: index,
      demoMode: true,
      error: error.message,
      message: 'Erreur lors de la génération - Image de démonstration'
    };
  }
}

// Fonction pour parser plusieurs prompts
function parseMultiplePrompts(text) {
  if (!text || text.trim() === '') return [];
  
  // Diviser par lignes et filtrer les vides
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Essayer de détecter les patterns de numérotation
  const prompts = [];
  
  for (const line of lines) {
    // Pattern: "1. Titre - Description"
    const match1 = line.match(/^\d+\.\s*(.+)$/);
    if (match1) {
      prompts.push(match1[1]);
      continue;
    }
    
    // Pattern: "Titre:" suivi de description
    const match2 = line.match(/^(.+?):\s*(.+)$/);
    if (match2) {
      prompts.push(match2[2]);
      continue;
    }
    
    // Si pas de pattern spécifique, ajouter la ligne telle quelle
    prompts.push(line);
  }
  
  return prompts;
}

// Routes API
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    apiValid: isApiValid,
    mode: isApiValid ? 'production' : 'demo',
    message: isApiValid ? 'API Seedream active' : 'Mode démonstration - Images de test'
  });
});

app.get('/api/prompts', (req, res) => {
  res.json({
    success: true,
    prompts: config.prompts
  });
});

app.post('/api/generate-series', async (req, res) => {
  try {
    console.log('Démarrage de la génération de la série d\'images...');
    const results = [];
    
    for (let i = 0; i < config.prompts.length; i++) {
      const result = await generateImage(config.prompts[i], i);
      results.push(result);
    }
    
    res.json({
      success: true,
      message: `Génération terminée. ${results.length} images générées.`,
      results: results
    });
    
  } catch (error) {
    console.error('Erreur lors de la génération de la série:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération',
      error: error.message
    });
  }
});

app.post('/api/generate-multiple', async (req, res) => {
  try {
    const { prompts } = req.body;
    
    if (!prompts) {
      return res.status(400).json({
        success: false,
        message: 'Aucun prompt fourni'
      });
    }
    
    console.log('📝 Traitement de plusieurs prompts...');
    const parsedPrompts = parseMultiplePrompts(prompts);
    console.log(`🎨 ${parsedPrompts.length} prompts détectés`);
    
    const results = [];
    
    for (let i = 0; i < parsedPrompts.length; i++) {
      console.log(`Génération ${i + 1}/${parsedPrompts.length}: ${parsedPrompts[i].substring(0, 30)}...`);
      const result = await generateImage(parsedPrompts[i], i);
      results.push(result);
    }
    
    res.json({
      success: true,
      message: `Génération terminée. ${results.length} images générées.`,
      results: results
    });
    
  } catch (error) {
    console.error('Erreur lors de la génération multiple:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération',
      error: error.message
    });
  }
});

// Fonction pour générer des prompts de mise en scène automatiquement
function generateProductScenePrompts() {
  return [
    "Product lifestyle shot - Premium product in elegant home setting, natural lighting, minimalist interior design, luxury atmosphere, professional photography, clean background, focus on product details",
    "Product hero shot - Dramatic product photography, studio lighting, clean white background, professional commercial style, product centered, high-end presentation, commercial grade",
    "Product in context - Product being used in real-life situation, lifestyle photography, authentic moment, natural environment, storytelling approach, relatable scene",
    "Product detail close-up - Macro photography style, extreme close-up of product details, texture and material focus, professional studio setup, commercial photography quality",
    "Product seasonal theme - Product styled with seasonal elements, festive atmosphere, creative composition, lifestyle photography, seasonal color palette, engaging visual story",
    "Product premium presentation - Luxury product showcase, high-end environment, premium materials, sophisticated lighting, editorial photography style, aspirational lifestyle"
  ];
}

// Route pour la génération de mises en scène de produit
app.post('/api/generate-product-scenes', async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Aucune image fournie'
      });
    }
    
    console.log('📸 Génération de mises en scène de produit...');
    const scenePrompts = generateProductScenePrompts();
    console.log(`🎬 ${scenePrompts.length} mises en scène à générer`);
    
    const results = [];
    
    for (let i = 0; i < scenePrompts.length; i++) {
      console.log(`Génération ${i + 1}/${scenePrompts.length}: ${scenePrompts[i].substring(0, 30)}...`);
      const result = await generateProductScene(image, scenePrompts[i], i);
      results.push(result);
    }
    
    res.json({
      success: true,
      message: `Génération terminée. ${results.length} mises en scène générées.`,
      results: results
    });
    
  } catch (error) {
    console.error('Erreur lors de la génération des mises en scène:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération des mises en scène',
      error: error.message
    });
  }
});

// Fonction pour générer une mise en scène de produit avec image-to-image
async function generateProductScene(baseImage, prompt, index) {
  try {
    console.log(`Génération de la mise en scène ${index + 1}: ${prompt.substring(0, 50)}...`);
    
    if (!isApiValid) {
      // Mode démonstration
      console.log('🎭 Mode démonstration - utilisation d\'images de test');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const imageUrl = config.demoImages[index] || `https://picsum.photos/1920/1080?random=${index + 20}&blur=1`;
      
      return {
        success: true,
        imageUrl: imageUrl,
        prompt: prompt,
        index: index,
        demoMode: true,
        title: `Mise en scène ${index + 1}`,
        description: prompt,
        message: 'Mise en scène de démonstration générée'
      };
    } else {
      // Mode production avec l'API Seedream (image-to-image)
      console.log('🚀 Mode production - génération avec Seedream API (image-to-image)');
      
      const response = await axios.post(
        `${config.seedream.baseUrl}/images/generations`,
        {
          model: config.seedream.model,
          prompt: prompt,
          image: baseImage, // Image de base en base64
          sequential_image_generation: "disabled",
          response_format: "url",
          size: "2K",
          watermark: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.seedream.apiKey}`
          }
        }
      );

      console.log('✅ Mise en scène générée avec succès via Seedream');
      
      const imageUrl = response.data.data[0]?.url || 
                      `https://via.placeholder.com/1920x1080/00FF00/FFFFFF?text=Scene+${index + 1}`;
      
      return {
        success: true,
        imageUrl: imageUrl,
        prompt: prompt,
        index: index,
        demoMode: false,
        title: `Mise en scène ${index + 1}`,
        description: prompt,
        message: 'Mise en scène générée avec Seedream API'
      };
    }
  } catch (error) {
    console.error('❌ Erreur lors de la génération de la mise en scène:', error.message);
    
    const fallbackImage = config.demoImages[index] || `https://via.placeholder.com/1920x1080/FF6B6B/FFFFFF?text=Erreur+${index + 1}`;
    
    return {
      success: false,
      imageUrl: fallbackImage,
      prompt: prompt,
      index: index,
      demoMode: true,
      title: `Mise en scène ${index + 1}`,
      description: prompt,
      error: error.message,
      message: 'Erreur lors de la génération - Image de démonstration'
    };
  }
}

// Route pour servir l'application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Export pour Netlify Functions
exports.handler = app;
