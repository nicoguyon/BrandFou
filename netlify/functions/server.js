const axios = require('axios');
const config = require('../../config');

// Cache pour les images uploadées
const imageCache = new Map();

// Configuration pour l'API Seedream
let isApiValid = false;

// Test de l'API au démarrage
async function testApiConnection() {
  try {
    console.log('🔍 Test de connexion à l\'API Seedream...');
    
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

// Fonction pour générer des prompts de mise en scène automatiquement
function generateProductScenePrompts(style = 'professional', productDescription = '') {
  // Base des prompts avec description du produit
  const productContext = productDescription ? `The uploaded product (${productDescription})` : "The uploaded product";
  
  const styles = {
    professional: [
      `Professional lifestyle shot - ${productContext} placed in an elegant home setting with natural lighting, minimalist interior design, luxury atmosphere, professional photography, clean background, maintaining the original product appearance`,
      `Hero product shot - ${productContext} with dramatic studio lighting, clean white background, professional commercial style, product centered and clearly visible, high-end presentation, commercial grade photography`,
      `Product in use context - ${productContext} being used in a real-life situation, lifestyle photography, authentic moment, natural environment, storytelling approach, relatable scene while keeping the product recognizable`,
      `Detail close-up - ${productContext} with macro photography style, extreme close-up of product details, texture and material focus, professional studio setup, commercial photography quality, preserving product identity`,
      `Seasonal theme - ${productContext} styled with seasonal elements, festive atmosphere, creative composition, lifestyle photography, seasonal color palette, engaging visual story, product remains the focal point`,
      `Premium presentation - ${productContext} in luxury showcase, high-end environment, premium materials, sophisticated lighting, editorial photography style, aspirational lifestyle, maintaining product integrity`
    ],
    lifestyle: [
      "Lifestyle product photography - Product in natural environment, authentic lifestyle setting, warm lighting, relatable scene, casual atmosphere, everyday use context",
      "Home lifestyle setting - Cozy home environment, warm domestic lighting, comfortable atmosphere, family-friendly scene, residential setting, home product use",
      "Outdoor lifestyle scene - Natural outdoor environment, sunlight, casual outdoor setting, recreational context, nature background, outdoor product use",
      "Social lifestyle moment - People using product, social interaction, candid photography, real-life moment, authentic emotion, social context",
      "Modern lifestyle aesthetic - Contemporary living space, modern design elements, trendy atmosphere, current lifestyle trends, fashionable setting, modern life",
      "Casual lifestyle setting - Relaxed environment, informal atmosphere, everyday life, natural lighting, comfortable setting, casual product use"
    ],
    creative: [
      "Creative artistic composition - Artistic lighting, creative angles, unique perspective, artistic photography, creative composition, imaginative presentation",
      "Surreal product concept - Imaginative setting, creative concept, artistic interpretation, surreal elements, creative photography, conceptual art",
      "Dynamic action shot - Movement, action photography, dynamic composition, energetic lighting, motion blur effects, action-oriented presentation",
      "Artistic color palette - Creative color scheme, artistic color grading, unique color composition, creative visual style, artistic presentation",
      "Abstract product art - Abstract composition, artistic interpretation, creative abstraction, artistic photography, conceptual presentation, creative vision",
      "Experimental photography - Creative techniques, experimental composition, innovative approach, artistic experimentation, creative photography style"
    ],
    minimalist: [
      "Minimalist clean design - Simple composition, clean lines, minimal elements, minimalist aesthetic, simple background, clean design principles",
      "Scandinavian minimalism - Clean Nordic design, simple composition, light colors, minimalist furniture, clean aesthetic, Scandinavian style",
      "Monochrome minimalism - Black and white composition, simple tones, minimal color palette, clean monochrome, minimalist black and white",
      "Geometric minimalism - Clean geometric shapes, simple forms, geometric composition, minimalist geometry, clean lines, simple shapes",
      "Negative space design - Lots of white space, minimal composition, clean negative space, simple design, minimalist spacing, clean layout",
      "Simple product focus - Clean product presentation, simple composition, minimal distractions, product-centered design, clean focus, simple presentation"
    ]
  };

  return styles[style] || styles.professional;
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
        
        // Utiliser directement l'image base64 avec l'API Seedream
        // L'API Seedream accepte les images base64 directement
        payload.image = baseImage;
        console.log('✅ Image-to-image activé avec image base64 directe');
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
        imageBase64: imageBase64,
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

// Handler principal pour Netlify Functions
exports.handler = async (event, context) => {
  // Configuration des headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Gestion des requêtes OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { path, httpMethod, body } = event;
    const data = body ? JSON.parse(body) : {};

    // Routes API
    if (path === '/api/status') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          apiValid: isApiValid,
          mode: isApiValid ? 'production' : 'demo',
          message: isApiValid ? 'API Seedream active' : 'Mode démonstration - Images de test'
        })
      };
    }

    if (path === '/api/prompts') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          prompts: config.prompts
        })
      };
    }

    if (path === '/api/generate-series' && httpMethod === 'POST') {
      console.log('Démarrage de la génération de la série d\'images...');
      const results = [];
      
      for (let i = 0; i < config.prompts.length; i++) {
        const result = await generateImage(config.prompts[i], i);
        results.push(result);
        
        // Pause entre les générations
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Génération terminée. ${results.length} images générées.`,
          results: results
        })
      };
    }

    if (path === '/api/generate-multiple' && httpMethod === 'POST') {
      const { prompts } = data;
      
      if (!prompts) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Aucun prompt fourni'
          })
        };
      }
      
      console.log('📝 Traitement de plusieurs prompts...');
      const parsedPrompts = parseMultiplePrompts(prompts);
      console.log(`🎨 ${parsedPrompts.length} prompts détectés`);
      
      const results = [];
      
      for (let i = 0; i < parsedPrompts.length; i++) {
        console.log(`Génération ${i + 1}/${parsedPrompts.length}: ${parsedPrompts[i].substring(0, 30)}...`);
        const result = await generateImage(parsedPrompts[i], i);
        results.push(result);
        
        // Pause entre les générations
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Génération terminée. ${results.length} images générées.`,
          results: results
        })
      };
    }

    if (path === '/api/generate-product-scenes' && httpMethod === 'POST') {
      const { image, customPrompt, options = {} } = data;
      
      if (!image) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Aucune image fournie'
          })
        };
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
        
        // Pause entre les générations
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Génération terminée. ${results.length} mises en scène générées.`,
          results: results,
          options: options
        })
      };
    }

    // Route pour servir les images (simplifiée)
    if (path.startsWith('/api/serve-image/') && httpMethod === 'GET') {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Route d\'image non disponible' })
      };
    }

    // Route par défaut
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Route non trouvée'
      })
    };

  } catch (error) {
    console.error('❌ Erreur dans le handler:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Erreur serveur',
        error: error.message
      })
    };
  }
};