const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'client', 'public', 'og-image.png');

async function compress() {
  const before = fs.statSync(filePath).size;
  console.log(`Before: ${(before / 1024).toFixed(1)} KB`);

  const buf = await sharp(filePath)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  // Save as .jpg alongside, then check references
  // Actually, all references use og-image.png, so save as PNG with max compression
  const pngBuf = await sharp(filePath)
    .resize({ width: 1200, withoutEnlargement: true })
    .png({ compressionLevel: 9, quality: 80 })
    .toBuffer();

  // Use whichever is smaller
  const finalBuf = pngBuf.size <= 200 * 1024 ? pngBuf : buf;
  const format = pngBuf.length <= 200 * 1024 ? 'PNG' : 'JPEG';

  // If JPEG is needed but file is .png, just overwrite with JPEG bytes (browsers don't care about extension)
  if (finalBuf.length > 200 * 1024) {
    // Try lower quality JPEG
    const lowBuf = await sharp(filePath)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 60 })
      .toBuffer();
    fs.writeFileSync(filePath, lowBuf);
    console.log(`After: ${(lowBuf.length / 1024).toFixed(1)} KB (JPEG q60)`);
  } else {
    fs.writeFileSync(filePath, finalBuf);
    console.log(`After: ${(finalBuf.length / 1024).toFixed(1)} KB (${format})`);
  }
}

compress().catch(err => { console.error(err); process.exit(1); });
