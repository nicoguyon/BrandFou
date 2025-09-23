// Configuration de l'application Rosaia
module.exports = {
  // Configuration de l'API Seedream
  seedream: {
    apiKey: process.env.SEEDREAM_API_KEY || '4048d7f1-78e9-4361-87c1-34b665eb8b5c',
    baseUrl: process.env.SEEDREAM_BASE_URL || 'https://ark.ap-southeast.bytepluses.com/api/v3',
    model: 'seedream-4-0-250828'
  },
  
  // Configuration du serveur
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  
  // Mode de fonctionnement
  demoMode: process.env.DEMO_MODE === 'true',
  
  // Images de démonstration
  demoImages: [
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1920&h=1080&fit=crop&crop=center', // Robot Rosaia - Appartement parisien
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920&h=1080&fit=crop&crop=center', // Vue technique exploded view
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center', // Interaction humaine - Champagne
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1920&h=1080&fit=crop&crop=center', // Moodboard artistique
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=1080&fit=crop&crop=center'  // Logo design
  ],
  
  // Prompts Rosaia
  prompts: [
    "Robot dans un appartement parisien - Humanoid robot Rosaia, sleek pink chrome design, reclining elegantly on a Haussmann-style luxury Parisian sofa, high ceilings, golden light from tall windows, minimal futuristic interior touches, cinematic wide shot 21:9",
    "Vue technique (exploded view) - Exploded technical render of humanoid robot Rosaia in glossy pink and chrome, mechanical joints, servos, electronic boards visible, labeled engineering illustration, cinematic lighting, hyper-detailed, blueprint style",
    "Rosaia en interaction humaine - Rosaia humanoid robot, pink chrome, offering a glass of champagne in a Parisian penthouse at night, Eiffel Tower glowing through the window, elegant dinner party atmosphere, futuristic luxury, cinematic 21:9",
    "Moodboard artistique - Collage style moodboard for Rosaia brand, combining Parisian luxury interior design (Haussmann, marble, gold), futuristic humanoid robot in pink chrome, fashion photography aesthetic, Vogue meets sci-fi, soft cinematic film grain",
    "Logo - Minimalist luxury logo design for Rosaia, futuristic serif typography, rose-gold metallic gradient, sophisticated brand identity, clean geometric elements, premium feel"
  ]
};
