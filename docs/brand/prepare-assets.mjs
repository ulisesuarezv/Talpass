// Recortes deterministas de la referencia: sin redibujar ni recolorear la marca.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const directory = readdirSync('node_modules/.pnpm').find((name) =>
  name.startsWith('sharp@'),
);
const sharp = require(
  resolve('node_modules/.pnpm', directory, 'node_modules/sharp'),
);
const source = 'docs/brand/reference/talpass-logo-board.png';

await sharp(source)
  .extract({ left: 310, top: 105, width: 930, height: 250 })
  .resize(744, 200)
  .webp({ quality: 92 })
  .toFile('public/brand/talpass-logo-provisional.webp');
await sharp(source)
  .extract({ left: 1310, top: 488, width: 164, height: 164 })
  .resize(128, 128)
  .ensureAlpha()
  .png()
  .toFile('public/brand/talpass-icon-provisional.png');

// ICO con imagen PNG: reemplaza el favicon inicial sin otro paquete.
const icon = readFileSync('public/brand/talpass-icon-provisional.png');
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 128;
header[7] = 128;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(icon.length, 14);
header.writeUInt32LE(22, 18);
writeFileSync('src/app/favicon.ico', Buffer.concat([header, icon]));

const logo = await sharp('public/brand/talpass-logo-provisional.webp')
  .resize(780)
  .png()
  .toBuffer();
for (const locale of ['es', 'en']) {
  const text =
    locale === 'es'
      ? [
          'Conecta con tu próximo paso.',
          'Candidatos y agencias. Revisión documental humana.',
        ]
      : [
          'Connect with your next step.',
          'Candidates and agencies. Human document review.',
        ];
  const overlay = Buffer.from(`<svg width="1200" height="630">
    <rect x="60" y="54" width="72" height="8" rx="4" fill="#F97316"/>
    <text x="60" y="445" font-family="Arial,sans-serif" font-size="46" font-weight="bold" fill="#0B2E2D">${text[0]}</text>
    <text x="60" y="504" font-family="Arial,sans-serif" font-size="28" fill="#4A5654">${text[1]}</text>
  </svg>`);
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: '#F6F7F5',
    },
  })
    .composite([{ input: logo, left: 54, top: 130 }, { input: overlay }])
    .png()
    .toFile(`public/brand/share-${locale}.png`);
}
