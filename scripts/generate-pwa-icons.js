/**
 * Script pour générer les icônes PWA à partir du logo SVG
 * 
 * Usage: node scripts/generate-pwa-icons.js
 * 
 * Prérequis: 
 * - sharp: npm install sharp --save-dev
 * - Le logo SVG doit être dans public/logo.svg
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(__dirname, '..', 'public');
const logoPath = path.join(publicDir, 'logo.svg');

// Vérifier que le logo existe
if (!fs.existsSync(logoPath)) {
  console.error('❌ Logo SVG introuvable:', logoPath);
  process.exit(1);
}

// Couleur de fond (theme-color)
const backgroundColor = '#246BFD';

async function generateIcons() {
  console.log('🎨 Génération des icônes PWA...\n');

  // Lire le SVG
  const svgBuffer = fs.readFileSync(logoPath);

  for (const size of sizes) {
    try {
      const outputPath = path.join(publicDir, `icon-${size}x${size}.png`);
      
      // Générer l'icône avec fond coloré
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: backgroundColor,
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Généré: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Erreur pour ${size}x${size}:`, error.message);
    }
  }

  console.log('\n✨ Toutes les icônes ont été générées avec succès!');
  console.log('📱 Les icônes sont maintenant disponibles dans le dossier public/');
}

generateIcons().catch(console.error);

