const fs = require('fs');

const file = './src/components/LostFoundView.tsx';
let lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

lines[28] = "  'Quần áo / Phụ kiện',";
lines[30] = "  'Đồ dùng cá nhân',";

lines[706] = '                placeholder="Ví dụ: đặc điểm nhận dạng, kích thước, phụ kiện..."';

lines[838] = '              Có thể chọn hình ảnh từ điện thoại, thư viện hoặc máy tính.';

fs.writeFileSync(file, lines.join('\n'), 'utf8');

console.log('FIX 4 DONG CUOI');
console.log('BYTES:', Buffer.byteLength(lines.join('\n'), 'utf8'));
