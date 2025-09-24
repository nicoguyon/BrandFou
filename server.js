const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const { OpenAI } = require('openai');
const config = require('./config');

const app = express();
const PORT = config.server.port;

// Configuration OpenAI pour Seedream
let seedreamClient = null;
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// Créer le dossier pour les images générées
const imagesDir = path.join(__dirname, 'public', 'generated-images');
fs.ensureDirSync(imagesDir);

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
      success: true, // On considère comme succès même en mode démo
      imageUrl: fallbackImage,
      prompt: prompt,
      index: index,
      demoMode: true,
      message: 'Image de démonstration utilisée (erreur API)',
      error: error.message
    };
  }
}

// Route pour générer toutes les images de la série
app.post('/api/generate-series', async (req, res) => {
  try {
    console.log('Démarrage de la génération de la série d\'images...');
    
    const results = [];
    
    for (let i = 0; i < config.prompts.length; i++) {
      const result = await generateImage(config.prompts[i], i);
      results.push(result);
      
      // Pause entre les générations pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    res.json({
      success: true,
      message: `Génération terminée. ${results.filter(r => r.success).length} images générées.`,
      results: results
    });
    
  } catch (error) {
    console.error('Erreur lors de la génération de la série:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour générer une image unique
app.post('/api/generate-single', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Le prompt est requis'
      });
    }
    
    const result = await generateImage(prompt, 0);
    res.json(result);
    
  } catch (error) {
    console.error('Erreur lors de la génération unique:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour récupérer la liste des prompts
app.get('/api/prompts', (req, res) => {
  res.json({
    success: true,
    prompts: config.prompts,
    apiStatus: isApiValid ? 'production' : 'demo'
  });
});

// Route pour vérifier le statut de l'API
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    apiValid: isApiValid,
    mode: isApiValid ? 'production' : 'demo',
    message: isApiValid ? 'API Seedream active' : 'Mode démonstration - Images de test'
  });
});

// Route pour uploader et servir les images localement
app.post('/api/upload-image', async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image || !image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Image base64 manquante' });
    }
    
    // Générer un ID unique pour l'image
    const imageId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Stocker l'image en base64 (dans une vraie app, vous utiliseriez un stockage persistant)
    imageCache.set(imageId, image);
    
    // Retourner l'URL locale
    const imageUrl = `http://localhost:3000/api/serve-image/${imageId}`;
    
    console.log('✅ Image uploadée localement:', imageUrl);
    res.json({ success: true, imageUrl });
    
  } catch (error) {
    console.error('❌ Erreur upload local:', error.message);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
});

// Route pour servir les images uploadées localement
app.get('/api/serve-image/:imageId', (req, res) => {
  try {
    const { imageId } = req.params;
    const imageBase64 = imageCache.get(imageId);
    
    if (!imageBase64) {
      return res.status(404).json({ error: 'Image non trouvée' });
    }
    
    // Déterminer le type MIME
    const mimeMatch = imageBase64.match(/^data:([^;]+);/);
    const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    // Convertir base64 en buffer
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    });
    
    res.send(buffer);
    
  } catch (error) {
    console.error('❌ Erreur serve image:', error.message);
    res.status(500).json({ error: 'Erreur lors du chargement de l\'image' });
  }
});

// Route proxy pour servir les images Seedream
app.get('/api/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'URL d\'image manquante' });
    }
    
    console.log('🖼️ Proxy image request:', imageUrl);
    
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'BrandFou-ImageProxy/1.0'
      },
      timeout: 10000
    });
    
    // Copier les headers de la réponse
    res.set({
      'Content-Type': response.headers['content-type'],
      'Cache-Control': 'public, max-age=3600', // Cache 1 heure
      'Access-Control-Allow-Origin': '*'
    });
    
    // Streamer l'image
    response.data.pipe(res);
    
  } catch (error) {
    console.error('❌ Erreur proxy image:', error.message);
    res.status(500).json({ error: 'Erreur lors du chargement de l\'image' });
  }
});

// Fonction pour séparer et nettoyer les prompts
function parseMultiplePrompts(text) {
  const prompts = [];
  
  // Séparer par numérotation (1., 2., 3., etc.)
  const sections = text.split(/(?=\d+\.)/);
  
  sections.forEach(section => {
    const lines = section.trim().split('\n');
    if (lines.length >= 2) {
      const title = lines[0].replace(/^\d+\.\s*/, '').trim();
      const description = lines.slice(1).join(' ').trim();
      
      if (title && description) {
        prompts.push({
          title: title,
          description: description,
          fullPrompt: `${title} - ${description}`
        });
      }
    }
  });
  
  return prompts;
}

// Route pour générer plusieurs images à partir de prompts multiples
app.post('/api/generate-multiple', async (req, res) => {
  try {
    const { promptsText } = req.body;
    
    if (!promptsText) {
      return res.status(400).json({
        success: false,
        error: 'Le texte des prompts est requis'
      });
    }
    
    console.log('📝 Traitement de plusieurs prompts...');
    
    // Parser les prompts
    const parsedPrompts = parseMultiplePrompts(promptsText);
    
    if (parsedPrompts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun prompt valide trouvé. Format attendu: 1. Titre\nDescription...'
      });
    }
    
    console.log(`🎨 ${parsedPrompts.length} prompts détectés`);
    
    const results = [];
    
    for (let i = 0; i < parsedPrompts.length; i++) {
      const prompt = parsedPrompts[i];
      console.log(`Génération ${i + 1}/${parsedPrompts.length}: ${prompt.title}`);
      
      const result = await generateImage(prompt.fullPrompt, i);
      
      // Ajouter les informations du prompt parsé
      result.title = prompt.title;
      result.description = prompt.description;
      
      results.push(result);
      
      // Pause entre les générations
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    res.json({
      success: true,
      message: `Génération terminée. ${results.filter(r => r.success).length} images générées à partir de ${parsedPrompts.length} prompts.`,
      results: results,
      parsedPrompts: parsedPrompts
    });
    
  } catch (error) {
    console.error('Erreur lors de la génération multiple:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Fonction pour générer des prompts de mise en scène avec styles et description du produit
function generateProductScenePrompts(style = 'professional', productDescription = '') {
  const styles = {
    professional: [
      `Place the uploaded product in an elegant modern home setting, natural lighting, minimalist interior design, luxury atmosphere, clean background, high-end presentation, commercial photography quality, maintain exact product appearance`,
      `Studio hero shot with dramatic lighting, clean white background, professional commercial style, product centered and prominently displayed, high-end presentation, commercial grade photography, preserve product details exactly`,
      `Real-world lifestyle scene, authentic moment, natural environment, storytelling photography, relatable scene, maintain exact product appearance, professional lifestyle photography`,
      `Macro detail shot, extreme close-up photography, texture and material focus, professional studio setup, commercial photography quality, preserve exact product features and details, premium presentation`,
      `Seasonal themed photography, creative composition with seasonal elements, festive atmosphere, lifestyle photography, seasonal color palette, engaging visual story, keep exact product appearance`,
      `Premium luxury presentation in high-end showcase environment, sophisticated lighting, editorial photography style, aspirational lifestyle setting, maintain exact product integrity, commercial photography quality`
    ],
    lifestyle: [
      `Place the uploaded product in a natural environment, authentic lifestyle setting, warm lighting, relatable scene, casual atmosphere, everyday use context, maintain exact product appearance`,
      `Cozy home environment, warm domestic lighting, comfortable atmosphere, family-friendly scene, residential setting, keep exact product appearance`,
      `Natural outdoor environment, sunlight, casual outdoor setting, recreational context, nature background, preserve exact product details`,
      `Social interaction scene with people using the product, candid photography, real-life moment, authentic emotion, social context, maintain exact product appearance`,
      `Contemporary living space, modern design elements, trendy atmosphere, current lifestyle trends, fashionable setting, preserve exact product details`,
      `Relaxed environment, informal atmosphere, everyday life, natural lighting, comfortable setting, casual product use, maintain exact product appearance`
    ],
    creative: [
      `Artistic lighting, creative angles, unique perspective, artistic photography, creative composition, imaginative presentation, maintain exact product appearance`,
      `Imaginative setting, creative concept, artistic interpretation, surreal elements, creative photography, conceptual art, preserve exact product details`,
      `Movement, action photography, dynamic composition, energetic lighting, motion blur effects, action-oriented presentation, keep exact product appearance`,
      `Creative color scheme, artistic color grading, unique color composition, creative visual style, artistic presentation, maintain exact product integrity`,
      `Abstract composition, artistic interpretation, creative abstraction, artistic photography, conceptual presentation, creative vision, preserve exact product details`,
      `Creative techniques, experimental composition, innovative approach, artistic experimentation, creative photography style, maintain exact product appearance`
    ],
    minimalist: [
      `Simple composition, clean lines, minimal elements, minimalist aesthetic, simple background, clean design principles, maintain exact product appearance`,
      `Clean Nordic design, simple composition, light colors, minimalist furniture, clean aesthetic, Scandinavian style, preserve exact product details`,
      `Black and white composition, simple tones, minimal color palette, clean monochrome, minimalist black and white, keep exact product appearance`,
      `Clean geometric shapes, simple forms, geometric composition, minimalist geometry, clean lines, simple shapes, maintain exact product appearance`,
      `Lots of white space, minimal composition, clean negative space, simple design, minimalist spacing, clean layout, preserve exact product details`,
      `Clean product presentation, simple composition, minimal distractions, product-centered design, clean focus, simple presentation, maintain exact product appearance`
    ]
  };

  return styles[style] || styles.professional;
}

// Route pour la génération de mises en scène de produit
app.post('/api/generate-product-scenes', async (req, res) => {
  try {
    const { image, customPrompt, options = {} } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Aucune image fournie'
      });
    }
    
    console.log('📸 Génération de mises en scène de produit...');
    console.log('Options reçues:', options);
    
    let scenePrompts;
    
    // Si un prompt personnalisé est fourni, l'utiliser
    if (customPrompt) {
      console.log('🎨 Utilisation du prompt personnalisé:', customPrompt);
      scenePrompts = [customPrompt];
    } else {
      // Utiliser les prompts prédéfinis selon le style
      const style = options.sceneStyle || 'professional';
      const productDescription = options.productDescription || '';
      scenePrompts = generateProductScenePrompts(style, productDescription);
      console.log(`🎬 Style "${style}" - ${scenePrompts.length} mises en scène à générer`);
    }
    
    const results = [];
    
    for (let i = 0; i < scenePrompts.length; i++) {
      console.log(`Génération ${i + 1}/${scenePrompts.length}: ${scenePrompts[i].substring(0, 50)}...`);
      
      // Appliquer les options de qualité et vitesse
      const result = await generateProductScene(image, scenePrompts[i], i, options);
      results.push(result);
    }
    
    res.json({
      success: true,
      message: `Génération terminée. ${results.length} mises en scène générées.`,
      results: results,
      options: options
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

// Fonction pour uploader une image temporairement vers le serveur local
async function uploadImageTemporarily(base64Image) {
  try {
    console.log('📤 Upload de l\'image vers le serveur local...');
    
    const response = await axios.post('http://localhost:3000/api/upload-image', {
      image: base64Image
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.data.success) {
      const imageUrl = response.data.imageUrl;
      console.log('✅ Image uploadée avec succès:', imageUrl);
      return imageUrl;
    } else {
      console.log('❌ Erreur upload local:', response.data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur lors de l\'upload local:', error.message);
    return null;
  }
}

// Fonction alternative pour uploader vers un service de stockage temporaire
async function uploadImageToTempService(base64Image) {
  try {
    console.log('📤 Upload vers service temporaire...');
    
    // Utiliser un service de stockage temporaire gratuit
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const response = await axios.post('https://tmpfiles.org/api/v1/upload', {
      file: base64Data
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.data.status === 'success') {
      const imageUrl = response.data.data.url;
      console.log('✅ Image uploadée vers service temporaire:', imageUrl);
      return imageUrl;
    } else {
      console.log('❌ Erreur upload service temporaire');
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur service temporaire:', error.message);
    return null;
  }
}

// Cache pour éviter les uploads multiples de la même image
const imageCache = new Map();

// Fonction pour uploader une image vers un service public temporaire
async function uploadImageToPublicService(base64Image) {
  try {
    console.log('📤 Upload vers service public temporaire...');
    
    // Extraire les données base64
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Essayer imgbb.com (service gratuit)
    const formData = new FormData();
    formData.append('image', base64Data);
    
    const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
      params: {
        key: 'YOUR_IMGBB_API_KEY' // Vous devrez obtenir une clé API gratuite
      },
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 15000
    });
    
    if (response.data.success) {
      const imageUrl = response.data.data.url;
      console.log('✅ Image uploadée vers service public:', imageUrl);
      return imageUrl;
    } else {
      console.log('❌ Erreur upload service public:', response.data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur service public:', error.message);
    return null;
  }
}

// Fonction pour convertir une image base64 en URL publique via proxy
async function convertBase64ToPublicUrl(base64Image) {
  try {
    console.log('🔄 Conversion base64 vers URL publique...');
    
    // Générer un ID unique pour l'image
    const imageId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Stocker l'image dans le cache
    imageCache.set(imageId, base64Image);
    
    // Retourner une URL publique (utiliser ngrok ou un service similaire en production)
    const publicUrl = `${config.server.host}:${config.server.port}/api/public-image/${imageId}`;
    
    console.log('✅ URL publique générée:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.log('❌ Erreur conversion URL publique:', error.message);
    return null;
  }
}

// Fonction pour générer une mise en scène de produit avec image-to-image
async function generateProductScene(baseImage, prompt, index, options = {}) {
  try {
    console.log(`Génération de la mise en scène ${index + 1}: ${prompt.substring(0, 50)}...`);
    
    if (!isApiValid) {
      // Mode démonstration
      console.log('🎭 Mode démonstration - utilisation d\'images de test');
      console.log('Options appliquées:', options);
      
      // Simuler différents délais selon la vitesse
      const delay = options.generationSpeed === 'fast' ? 800 : 
                   options.generationSpeed === 'quality' ? 2500 : 1500;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const imageUrl = config.demoImages[index] || `https://picsum.photos/1920/1080?random=${index + 20}&blur=1`;
      
      return {
        success: true,
        imageUrl: imageUrl,
        prompt: prompt,
        index: index,
        demoMode: true,
        title: `Mise en scène ${index + 1}`,
        description: prompt,
        message: 'Mise en scène de démonstration générée',
        options: options
      };
    } else {
      // Mode production avec l'API Seedream (image-to-image)
      console.log('🚀 Mode production - génération avec Seedream API (image-to-image)');
      console.log('Options appliquées:', options);
      
      // Déterminer la taille selon les options
      const size = options.imageQuality === '4K' ? '4K' : 
                   options.imageQuality === '1K' ? '1K' : '2K';
      
      // Ajuster les paramètres selon la vitesse
      const sequentialGeneration = options.generationSpeed === 'quality' ? "enabled" : "disabled";
      
      console.log('Paramètres de génération:', { size, sequentialGeneration });
      
      // Préparer le payload pour l'image-to-image
      const payload = {
        model: config.seedream.model,
        prompt: prompt,
        sequential_image_generation: sequentialGeneration,
        response_format: "url",
        size: size,
        stream: false,
        watermark: false
      };

      // Gérer l'image de base pour l'image-to-image
      if (baseImage && baseImage.startsWith('data:image/')) {
        console.log('🖼️ Traitement de l\'image pour image-to-image...');
        
        // Essayer d'abord avec l'URL publique via proxy
        let imageUrl = await convertBase64ToPublicUrl(baseImage);
        
        if (imageUrl) {
          payload.image = imageUrl;
          console.log('✅ Image-to-image activé avec URL publique:', imageUrl);
        } else {
          console.log('⚠️ Impossible de créer URL publique, génération sans image-to-image');
        }
      } else {
        console.log('📝 Génération avec prompts détaillés uniquement');
      }

      const response = await axios.post(
        `${config.seedream.baseUrl}/images/generations`,
        payload,
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
      
      // Convertir l'image en base64 pour l'affichage
      let imageBase64 = null;
      try {
        console.log('🔄 Conversion de l\'image en base64...');
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(imageResponse.data);
        imageBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        console.log('✅ Image convertie en base64');
      } catch (error) {
        console.log('⚠️ Impossible de convertir l\'image en base64:', error.message);
      }
      
      return {
        success: true,
        imageUrl: imageUrl,
        imageBase64: imageBase64, // Ajouter l'image en base64
        prompt: prompt,
        index: index,
        demoMode: false,
        title: `Mise en scène ${index + 1}`,
        description: prompt,
        message: 'Mise en scène générée avec Seedream API',
        options: options,
        generationParams: { size, sequentialGeneration }
      };
    }
  } catch (error) {
    console.error('❌ Erreur lors de la génération de la mise en scène:', error.message);
    console.error('Détails de l\'erreur:', error.response?.data);
    
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
      errorDetails: error.response?.data,
      message: 'Erreur lors de la génération - Image de démonstration'
    };
  }
}

// Route pour servir la page principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📱 Accédez à l'application: http://localhost:${PORT}`);
  console.log(`🎨 Prêt à générer des images avec Seedream!`);
});
