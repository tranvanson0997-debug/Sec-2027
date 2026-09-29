const fs = require('fs');

const file = './src/components/LostFoundView.tsx';
let lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

const fixes = {
  19: "  CLOSED: 'Đã đóng',",
  25: "  'Đồ dùng cá nhân',",
  262: "        'Vui lòng nhập TÊN TÀI SẢN / ĐỒ VẬT.'",
  283: "        'Vui lòng nhập khu vực / vị trí.'",
  290: "        'Vui lòng chọn loại tài sản / đồ vật.'",
  297: "        'Vui lòng chọn tình trạng tài sản / đồ vật.'",
  482: "            Ghi nhận, lưu giữ và bàn giao tài sản / đồ vật thất lạc.",
  509: "                  : 'TẠO BÁO CÁO MỚI'}",
  513: "                Nhập đầy đủ thông tin Lost & Found.",
  522: "              ĐÓNG",
  602: '                label="Vị trí cụ thể"',
  616: '          {/* 2. NGƯỜI BÁO / NHÂN VIÊN */}',
  619: '              2. THÔNG TIN NGƯỜI BÁO / NHÂN VIÊN',
  699: '              3. THÔNG TIN TÀI SẢN / ĐỒ VẬT',
  705: '                label="Tên tài sản / đồ vật *"',
  915: '                label="Địa điểm lưu giữ"',
  967: '              6. BÀN GIAO / TRẢ TÀI SẢN'
};

for (const [num, replacement] of Object.entries(fixes)) {
  const index = Number(num) - 1;
  if (index >= 0 && index < lines.length) {
    lines[index] = replacement;
  }
}

fs.writeFileSync(file, lines.join('\n'), 'utf8');

console.log('FIX THEO DONG');
console.log('DA SUA:', Object.keys(fixes).length, 'DONG');
console.log('BYTES:', Buffer.byteLength(lines.join('\n'), 'utf8'));
