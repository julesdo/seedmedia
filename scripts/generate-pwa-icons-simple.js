/**
 * Script simple pour créer des icônes PWA de base
 * Utilise Canvas API de Node.js (pas besoin de sharp)
 * 
 * Usage: node scripts/generate-pwa-icons-simple.js
 */

const fs = require('fs');
const path = require('path');

// Si sharp n'est pas disponible, créer des icônes SVG simples
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(__dirname, '..', 'public');
const backgroundColor = '#246BFD';
const textColor = '#FFFFFF';

function generateSVGIcon(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="${size * 0.2}"/>
  <text 
    x="50%" 
    y="50%" 
    font-family="Arial, sans-serif" 
    font-size="${size * 0.4}" 
    font-weight="bold" 
    fill="${textColor}" 
    text-anchor="middle" 
    dominant-baseline="middle"
  >S</text>
</svg>`;
}

async function generateIcons() {
  console.log('🎨 Génération des icônes PWA (SVG simples)...\n');

  for (const size of sizes) {
    try {
      const outputPath = path.join(publicDir, `icon-${size}x${size}.png`);
      const svgPath = path.join(publicDir, `icon-${size}x${size}.svg`);
      
      // Créer un SVG temporaire
      const svgContent = generateSVGIcon(size);
      fs.writeFileSync(svgPath, svgContent);
      
      console.log(`✅ Généré: icon-${size}x${size}.svg`);
      console.log(`   ⚠️  Note: Pour une meilleure qualité, convertissez en PNG avec un outil externe`);
    } catch (error) {
      console.error(`❌ Erreur pour ${size}x${size}:`, error.message);
    }
  }

  console.log('\n✨ Les icônes SVG ont été générées!');
  console.log('📱 Pour les convertir en PNG, utilisez un outil comme:');
  console.log('   - ImageMagick: convert icon-192x192.svg icon-192x192.png');
  console.log('   - En ligne: https://cloudconvert.com/svg-to-png');
}

generateIcons().catch(console.error);

