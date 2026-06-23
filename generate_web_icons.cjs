const Jimp = require('jimp');
const path = require('path');

async function generateIcons() {
  const sourceImage = 'public/icons/icon.png';
  const sizes = [16, 32, 48, 72, 96, 128, 192, 256, 512];
  
  try {
    const image = await Jimp.read(sourceImage);
    
    // Generate icon-N.png
    for (const size of sizes) {
      const clone = image.clone();
      await clone.resize(size, size).writeAsync(`public/icons/icon-${size}x${size}.png`);
      console.log(`Generated icon-${size}x${size}.png`);
    }

    // Generate favicon.png
    const favicon = image.clone();
    await favicon.resize(32, 32).writeAsync('public/favicon.png');
    console.log('Generated favicon.png');

    // Generate logo.png
    const logo = image.clone();
    await logo.resize(512, 512).writeAsync('public/logo.png');
    console.log('Generated logo.png');

    // Generate icon-cuba.png, logo-c.png
    const logoC = image.clone();
    await logoC.resize(512, 512).writeAsync('public/logo-c.png');
    await logoC.writeAsync('public/icon-cuba.png');

    console.log('All PWA/Web icons successfully generated!');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generateIcons();
