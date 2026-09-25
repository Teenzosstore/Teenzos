const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const imagesToOptimize = [
  { input: 'OVERSIZED..png', output: 'OVERSIZED..webp', width: 1920, quality: 80 },
  { input: 'hero-img.png', output: 'hero-img.webp', width: 1920, quality: 80 },
  { input: 'OVERSIZED_person.png', output: 'OVERSIZED_person.webp', width: 1920, quality: 80 },
  { input: 'hero-parts.png', output: 'hero-parts.webp', width: 1200, quality: 80 },
];

async function optimizeImage(inputName, outputName, width, quality) {
  const inputPath = path.join(PUBLIC_DIR, inputName);
  const outputPath = path.join(PUBLIC_DIR, outputName);

  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️  Input not found: ${inputName}`);
    return;
  }

  try {
    const stats = fs.statSync(inputPath);
    console.log(`📦 Optimizing ${inputName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);

    await sharp(inputPath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toFile(outputPath);

    const outStats = fs.statSync(outputPath);
    const savings = ((stats.size - outStats.size) / stats.size * 100).toFixed(1);
    console.log(`✅ ${outputName} created (${(outStats.size / 1024 / 1024).toFixed(2)} MB, ${savings}% smaller)`);
  } catch (error) {
    console.error(`❌ Failed to optimize ${inputName}:`, error.message);
  }
}

async function optimizeCategoryImages() {
  const catDir = path.join(PUBLIC_DIR, 'Catagories');
  if (!fs.existsSync(catDir)) return;

  const categories = fs.readdirSync(catDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const category of categories) {
    const categoryPath = path.join(catDir, category);
    const files = fs.readdirSync(categoryPath)
      .filter(f => f.match(/\.(png|jpg|jpeg)$/i));

    for (const file of files) {
      const inputPath = path.join(categoryPath, file);
      const stats = fs.statSync(inputPath);

      // Skip if already small enough
      if (stats.size < 500 * 1024) continue;

      const outputName = file.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      const outputPath = path.join(categoryPath, outputName);

      try {
        console.log(`📦 Optimizing ${category}/${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);
        await sharp(inputPath)
          .resize({ width: 1200, withoutEnlargement: true })
          .webp({ quality: 75, effort: 6 })
          .toFile(outputPath);

        const outStats = fs.statSync(outputPath);
        const savings = ((stats.size - outStats.size) / stats.size * 100).toFixed(1);
        console.log(`✅ ${category}/${outputName} created (${(outStats.size / 1024 / 1024).toFixed(2)} MB, ${savings}% smaller)`);
      } catch (error) {
        console.error(`❌ Failed to optimize ${category}/${file}:`, error.message);
      }
    }
  }
}

async function main() {
  console.log('🚀 Starting image optimization...\n');

  for (const img of imagesToOptimize) {
    await optimizeImage(img.input, img.output, img.width, img.quality);
  }

  console.log('\n📁 Optimizing category images...');
  await optimizeCategoryImages();

  console.log('\n✨ Image optimization complete!');
}

main().catch(console.error);