const fs = require('fs');

const file = './src/components/LostFoundView.tsx';
let lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

lines[760] = '                  label="Số serial / IMEI"';
lines[779] = '                    Số lượng';

fs.writeFileSync(file, lines.join('\n'), 'utf8');

console.log('FIX 2 DONG');
console.log('BYTES:', Buffer.byteLength(lines.join('\n'), 'utf8'));
