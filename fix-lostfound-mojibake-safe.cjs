const fs = require('fs');

const file = './src/components/LostFoundView.tsx';
const backup = './src/components/LostFoundView.tsx.before-mojibake-safe';

fs.copyFileSync(file, backup);

const text = fs.readFileSync(file, 'utf8');

function score(s) {
  const markers = ['Ã', 'Â', 'Ä', 'Å', 'Æ', 'áº', 'á»', 'â', 'ð'];
  return markers.reduce((n, m) => n + (s.split(m).length - 1), 0);
}

function repairLine(line) {
  const re = /[\x00-\xFF]+/g;

  return line.replace(re, run => {
    if (score(run) === 0) return run;

    const bytes = Uint8Array.from(
      [...run].map(ch => ch.charCodeAt(0))
    );

    try {
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);

      if (!decoded.includes('�') && score(decoded) < score(run)) {
        return decoded;
      }
    } catch {}

    return run;
  });
}

const repaired = text
  .split(/\r?\n/)
  .map(repairLine)
  .join('\n');

fs.writeFileSync(file, repaired, 'utf8');

const result = fs.readFileSync(file, 'utf8');

console.log('SAFE MOJIBAKE FIX');
console.log('BYTES:', Buffer.byteLength(result, 'utf8'));
console.log('BÁO CÁO=', result.includes('BÁO CÁO'));
console.log('BÃ=', result.includes('BÃ'));
console.log('Ä=', result.includes('Ä'));
console.log('�=', result.includes('�'));
console.log('BACKUP:', backup);
