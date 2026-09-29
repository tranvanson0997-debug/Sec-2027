const fs = require('fs');

const file = './src/components/LostFoundView.tsx';
const text = fs.readFileSync(file, 'utf8');
const lines = text.split(/\r?\n/);

const markers = [
  'BÃ', 'Ä', 'Â', 'á»', 'áº', 'Ã', 'Æ', 'Å', 'â'
];

function badScore(s) {
  return markers.reduce(
    (n, marker) => n + (s.split(marker).length - 1),
    0
  );
}

let changed = 0;

const fixed = lines.map(line => {
  if (!markers.some(marker => line.includes(marker))) {
    return line;
  }

  try {
    const candidate = Buffer.from(line, 'latin1').toString('utf8');

    if (badScore(candidate) < badScore(line)) {
      changed++;
      return candidate;
    }
  } catch {}

  return line;
});

fs.writeFileSync(
  file,
  fixed.join('\n'),
  'utf8'
);

const result = fs.readFileSync(file, 'utf8');

console.log('DA SUA LOST & FOUND');
console.log('DONG THAY DOI:', changed);
console.log('CON BÃ:', result.includes('BÃ'));
console.log('CON Ä:', result.includes('Ä'));
console.log('CON �:', result.includes('�'));
console.log('BYTES:', Buffer.byteLength(result, 'utf8'));
