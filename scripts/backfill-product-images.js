const fs = require('fs');
const path = require('path');

// Allow local script to connect to Supabase/Cloudinary through SSL proxy if needed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;
const { createClient } = require('@supabase/supabase-js');

// 1. Load .env file
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex !== -1) {
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value.replace(/^["']|["']$/g, '');
        }
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase credentials missing in .env');
  process.exit(1);
}

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('❌ Cloudinary credentials missing in .env');
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PRODUCT_IMAGE_VARIANT_WIDTHS = [400, 800, 1200, 1600];

function extractCloudinaryPublicId(url) {
  if (!url || !url.startsWith('https://res.cloudinary.com/')) return null;
  const uploadIndex = url.indexOf('/image/upload/');
  if (uploadIndex === -1) return null;

  let rest = url.slice(uploadIndex + '/image/upload/'.length);
  if (rest.includes('/') && !rest.startsWith('v') && !rest.startsWith('rawflex/')) {
    const firstSlash = rest.indexOf('/');
    const segment = rest.slice(0, firstSlash);
    if (segment.includes(',') || segment.startsWith('w_') || segment.startsWith('c_') || segment.startsWith('f_')) {
      rest = rest.slice(firstSlash + 1);
    }
  }

  rest = rest.replace(/^v\d+\//, '');
  const publicId = rest.replace(/\.[a-zA-Z0-9]+$/, '');
  return publicId.replace(/_w(400|800|1200|1600)$/, '');
}

async function checkVariantExists(publicId, width) {
  try {
    const variantId = `${publicId}_w${width}`;
    const result = await cloudinary.api.resource(variantId, { resource_type: 'image' });
    return !!result;
  } catch (err) {
    return false;
  }
}

async function processImage(imageUrl, basePublicId) {
  // Check which of the 4 variants exist
  const existingVariants = {};
  for (const width of PRODUCT_IMAGE_VARIANT_WIDTHS) {
    existingVariants[width] = await checkVariantExists(basePublicId, width);
  }

  const missingWidths = PRODUCT_IMAGE_VARIANT_WIDTHS.filter(w => !existingVariants[w]);
  
  if (missingWidths.length === 0) {
    return {
      neededReprocessing: false,
      hadFewerThan4: false,
      generated: PRODUCT_IMAGE_VARIANT_WIDTHS.map(width => ({
        width,
        size: null,
        skipped: true,
        publicId: `${basePublicId}_w${width}`,
      })),
      originalSize: null,
    };
  }

  const hadFewerThan4 = Object.values(existingVariants).some(Boolean);

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image (${response.status} ${response.statusText})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);
  const originalSize = inputBuffer.length;

  const generated = [];

  // Approach A: Always generate all 4 variants.
  // With withoutEnlargement: true, sharp will not upscale small images,
  // ensuring the largest un-upscaled WebP is available under wider variant filenames.
  for (const width of PRODUCT_IMAGE_VARIANT_WIDTHS) {
    const variantPublicId = `${basePublicId}_w${width}`;
    
    if (existingVariants[width]) {
      generated.push({ width, size: null, skipped: true, publicId: variantPublicId });
      continue;
    }

    const resizedBuffer = await sharp(inputBuffer)
      .resize(width, null, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: variantPublicId,
          format: 'webp',
          resource_type: 'image',
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(resizedBuffer);
    });

    generated.push({ width, size: resizedBuffer.length, skipped: false, publicId: variantPublicId });
  }

  return {
    neededReprocessing: true,
    hadFewerThan4,
    originalSize,
    generated,
  };
}

async function verifySpecificImage(publicId) {
  console.log(`\n🔍 Verifying all 4 variants for ${publicId}:`);
  const baseUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${publicId}`;
  for (const w of PRODUCT_IMAGE_VARIANT_WIDTHS) {
    const variantUrl = `${baseUrl}_w${w}.webp`;
    try {
      const res = await fetch(variantUrl, { method: 'HEAD' });
      const sizeHeader = res.headers.get('content-length');
      const sizeStr = sizeHeader ? `${(parseInt(sizeHeader, 10) / 1024).toFixed(1)} KB` : 'size unknown';
      console.log(`   - _w${w}.webp: HTTP ${res.status} (${sizeStr}) -> ${variantUrl}`);
    } catch (e) {
      console.log(`   - _w${w}.webp: Fetch Error: ${e.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting Product Images Backfill (Approach A: Guarantee All 4 Variants Exist)...\n');

  // Fetch product_images
  const { data: images, error: imagesError } = await supabase
    .from('product_images')
    .select('id, product_id, image_url, cloudinary_public_id');

  if (imagesError) {
    console.error('❌ Failed to fetch product_images:', imagesError.message);
    process.exit(1);
  }

  // Fetch products for featured_image_url
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, featured_image_url');

  if (productsError) {
    console.warn('⚠️ Could not fetch products table:', productsError.message);
  }

  const allItems = [];
  const seenUrls = new Set();

  if (images) {
    for (const img of images) {
      if (img.image_url && !seenUrls.has(img.image_url)) {
        seenUrls.add(img.image_url);
        allItems.push({
          type: 'product_image',
          id: img.id,
          productId: img.product_id,
          url: img.image_url,
          publicId: img.cloudinary_public_id,
        });
      }
    }
  }

  if (products) {
    for (const p of products) {
      if (p.featured_image_url && !seenUrls.has(p.featured_image_url)) {
        seenUrls.add(p.featured_image_url);
        allItems.push({
          type: 'featured_image',
          id: p.id,
          productId: p.id,
          url: p.featured_image_url,
          publicId: null,
        });
      }
    }
  }

  console.log(`📊 Found ${allItems.length} unique images across catalog to verify/process.\n`);

  let processedCount = 0;
  let reprocessedPartialCount = 0;
  let newlyProcessedCount = 0;
  let alreadyCompleteCount = 0;
  let failureCount = 0;
  const failures = [];
  const fixedImages = [];

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    processedCount++;
    const progressStr = `[${processedCount}/${allItems.length}]`;
    const basePublicId = item.publicId || extractCloudinaryPublicId(item.url);

    if (!basePublicId || !item.url.startsWith('https://res.cloudinary.com/')) {
      console.log(`${progressStr} ⏩ Skipping non-Cloudinary image: ${item.url}`);
      continue;
    }

    try {
      const result = await processImage(item.url, basePublicId);
      
      // Update database if cloudinary_public_id was missing in product_images
      if (item.type === 'product_image' && !item.publicId) {
        await supabase
          .from('product_images')
          .update({ cloudinary_public_id: basePublicId })
          .eq('id', item.id);
      }

      if (!result.neededReprocessing) {
        alreadyCompleteCount++;
        console.log(`${progressStr} ⚡ All 4 variants already exist: ${basePublicId}`);
      } else {
        const generatedSummary = result.generated
          .map((g) => (g.skipped ? `w${g.width} (cached)` : `w${g.width}: ${(g.size / 1024).toFixed(1)} KB`))
          .join(', ');

        if (result.hadFewerThan4) {
          reprocessedPartialCount++;
          fixedImages.push({ publicId: basePublicId, generated: result.generated.filter(g => !g.skipped) });
          console.log(`${progressStr} 🛠️  FIXED partial image (added missing variants): ${basePublicId} -> [${generatedSummary}]`);
        } else {
          newlyProcessedCount++;
          console.log(`${progressStr} 🆕 Generated all 4 variants: ${basePublicId} -> [${generatedSummary}]`);
        }
      }
    } catch (err) {
      console.error(`${progressStr} ❌ Failed on ${basePublicId}:`, err.message);
      failureCount++;
      failures.push({ id: item.id, url: item.url, error: err.message });
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🎉 BACKFILL & FIX SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Images Checked         : ${processedCount}`);
  console.log(`Already Complete (4 variants): ${alreadyCompleteCount}`);
  console.log(`Fixed Partial (<4 variants)  : ${reprocessedPartialCount}`);
  console.log(`Newly Processed (0 variants) : ${newlyProcessedCount}`);
  console.log(`Failures                     : ${failureCount}`);

  if (fixedImages.length > 0) {
    console.log(`\n📋 Images that had fewer than 4 variants and were fixed (${fixedImages.length}):`);
    fixedImages.forEach(f => {
      const added = f.generated.map(g => `w${g.width}`).join(', ');
      console.log(`- ${f.publicId} (added: ${added})`);
    });
  }

  // Explicit verification of target image: rawflex/products/inbzfyalqwnnhmlubhpj
  await verifySpecificImage('rawflex/products/inbzfyalqwnnhmlubhpj');
}

main().catch(console.error);
