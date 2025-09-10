const fs = require('fs');
const { createCanvas } = require('canvas');

// Canvas가 없으면 간단한 SVG 아이콘 생성
function createSimpleIcon(size) {
  const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3B82F6" rx="${size/8}"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.35em" font-family="Arial, sans-serif" font-size="${size/3}" fill="white" font-weight="bold">AI</text>
</svg>`;
  return svg;
}

// 아이콘 크기들
const sizes = [16, 32, 48, 72, 96, 144, 192, 512];

sizes.forEach(size => {
  const svg = createSimpleIcon(size);
  fs.writeFileSync(`icon-${size}x${size}.png`, svg);
  console.log(`Created icon-${size}x${size}.png`);
});

// Apple touch icon
const appleSvg = createSimpleIcon(180);
fs.writeFileSync('apple-touch-icon.png', appleSvg);
console.log('Created apple-touch-icon.png');

console.log('All icons created successfully!');
