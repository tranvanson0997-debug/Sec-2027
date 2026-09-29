const fs = require('fs');

const file = './src/components/LostFoundView.tsx';
let s = fs.readFileSync(file, 'utf8');

const r = {
  "Ä£ Ä‘óng": "Đã đóng",
  "Ä»“ dùng cá nhân": "Đồ dùng cá nhân",

  "Vui lÃ²ng nháºp TÊN TÀI SẢN / Ä»’ VẬT.": "Vui lòng nhập TÊN TÀI SẢN / ĐỒ VẬT.",
  "Vui lÃ²ng nháºp khu vá»±c / vá»‹ trí.": "Vui lòng nhập khu vực / vị trí.",
  "Vui lÃ²ng chá»n loáº¡i tÃ i sáº£n / đồ vật.": "Vui lòng chọn loại tài sản / đồ vật.",
  "Vui lÃ²ng chá»n tÃ¬nh tráº¡ng tÃ i sáº£n / đồ vật.": "Vui lòng chọn tình trạng tài sản / đồ vật.",

  "Ghi nháºn, lÆ°u giá»¯ vÃ  bÃ n giao tÃ i sáº£n / đồ vật thất lạc.": "Ghi nhận, lưu giữ và bàn giao tài sản / đồ vật thất lạc.",

  "Táº O BÃO CÃO Má»šI": "TẠO BÁO CÁO MỚI",
  "Nháºp Ä‘áº§y Ä‘ủ thông tin Lost & Found.": "Nhập đầy đủ thông tin Lost & Found.",
  "Ä“NG": "ĐÓNG",

  "Vá»‹ trÃ cá»¥ thá»ƒ": "Vị trí cụ thể",

  "NGÆ¯á»œI BÃO / NHÃ‚N VIÃŠN": "NGƯỜI BÁO / NHÂN VIÊN",
  "2. THÃ”NG TIN NGÆ¯á»œI BÃO / NHÃ‚N VIÃŠN": "2. THÔNG TIN NGƯỜI BÁO / NHÂN VIÊN",

  "3. THÔNG TIN TÃ€I SẢN / Ä»’ VẬT": "3. THÔNG TIN TÀI SẢN / ĐỒ VẬT",
  "TÃ€I Sáº¢N / Ä»’ VẬT": "TÀI SẢN / ĐỒ VẬT",
  "TÃªn tÃ i sáº£n / đồ vật": "Tên tài sản / đồ vật",

  "VÃ dá»¥: Äº·c Ä‘iá»ƒm nháºn dáº¡ng, kÃch thÆ°á»›c, phá»¥ kiá": "Ví dụ: đặc điểm nhận dạng, kích thước, phụ kiện",

  "CÃ³ thá»ƒ chá»n hÃ¬nh áº£nh tá»« Ä‘iá»‡n thoáº¡i, thÆ° viá»‡n hoặc má": "Có thể chọn hình ảnh từ điện thoại, thư viện hoặc máy",

  "Ä»‹a Ä‘iá»ƒm lưu giữ": "Địa điểm lưu giữ",

  "6. BÀN GIAO / TRáº¢ TÃ€I SẢN": "6. BÀN GIAO / TRẢ TÀI SẢN",

  "Thông tin xác minh, người": "Thông tin xác minh, người"
};

let changed = 0;

for (const [bad, good] of Object.entries(r)) {
  const count = s.split(bad).length - 1;
  if (count > 0) {
    s = s.split(bad).join(good);
    changed += count;
  }
}

fs.writeFileSync(file, s, 'utf8');

console.log('LOST & FOUND EXACT FIX 3');
console.log('THAY DOI:', changed);
console.log('BÁO CÁO=', s.includes('BÁO CÁO'));
console.log('BÃ=', /BÃ/.test(s));
console.log('Ä=', /Ä/.test(s));
console.log('�=', s.includes('�'));
console.log('BYTES=', Buffer.byteLength(s, 'utf8'));
