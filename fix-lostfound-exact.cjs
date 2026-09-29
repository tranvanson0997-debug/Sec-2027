const fs = require('fs');

const file = './src/components/LostFoundView.tsx';

const replacements = {
  "Ä£ Ä‘óng": "Đã đóng",
  "Ä»“ dùng cá nhân": "Đồ dùng cá nhân",
  "Tá»‘t": "Tốt",
  "CÃ³ dáº¥u hiá»‡u sử dụng": "Có dấu hiệu sử dụng",
  "KhÃ´ng xÃ¡c Ä‘á»‹nh": "Không xác định",
  "ChÆ°a xÃ¡c Ä‘á»‹nh": "Chưa xác định",

  "Vui lÃ²ng nháºp TÃŠN TÃ€I Sáº¢N / Ä»’ VẬT.": "Vui lòng nhập TÊN TÀI SẢN / ĐỒ VẬT.",
  "Vui lÃ²ng nháºp khu vá»±c / vá»‹ trí.": "Vui lòng nhập khu vực / vị trí.",
  "Vui lÃ²ng chá»n loáº¡i tÃ i sáº£n / Ä‘á»“ vật.": "Vui lòng chọn loại tài sản / đồ vật.",
  "Vui lÃ²ng chá»n tÃ¬nh tráº¡ng tÃ i sáº£n / Ä‘á»“ vật.": "Vui lòng chọn tình trạng tài sản / đồ vật.",

  "Lá»—i lưu báo cáo Lost & Found:": "Lỗi lưu báo cáo Lost & Found:",
  "KhÃ´ng thá»ƒ lÆ°u bÃ¡o cÃ¡o. Vui lÃ²ng kiá»ƒm tra lại thông tin.": "Không thể lưu báo cáo. Vui lòng kiểm tra lại thông tin.",
  "Báº¡n cÃ³ cháº¯c muá»‘n xóa báo cáo": "Bạn có chắc muốn xóa báo cáo",
  "Lá»–I PDF LOST & FOUND:": "LỖI PDF LOST & FOUND:",
  "Lá»–I XUẤT PDF:": "LỖI XUẤT PDF:",

  "Ghi nháºn, lÆ°u giá»¯ vÃ  bÃ n giao tÃ i sáº£n / Ä‘á»“ vật thất lạc.": "Ghi nhận, lưu giữ và bàn giao tài sản / đồ vật thất lạc.",

  "CHá»ˆNH SỬA BÁO CÁO": "CHỈNH SỬA BÁO CÁO",
  "Táº O BÃO CÃO Má»šI": "TẠO BÁO CÁO MỚI",
  "Nháºp Ä‘áº§y Ä‘ủ thông tin Lost & Found.": "Nhập đầy đủ thông tin Lost & Found.",
  "Ä“NG": "ĐÓNG",

  "THÃ”NG TIN BÁO CÁO": "THÔNG TIN BÁO CÁO",
  "Sá»‘ báo cáo": "Số báo cáo",
  "Khu vá»±c / vá»‹ trí": "Khu vực / vị trí",
  "Vá»‹ trÃ cá»¥ thá»ƒ": "Vị trí cụ thể",

  "NGÆ¯á»œI BÃO / NHÃ‚N VIÃŠN": "NGƯỜI BÁO / NHÂN VIÊN",
  "Sá»‘ Ä‘iá»‡n thoại": "Số điện thoại",

  "THÃ”NG TIN TÃ€I SẢN": "THÔNG TIN TÀI SẢN",
  "TÃŠN TÃ€I Sáº¢N": "TÊN TÀI SẢN",
  "TÃªn tÃ i sáº£n / Ä‘á»“ vật": "Tên tài sản / đồ vật",

  "HÃŒNH ẢNH": "HÌNH ẢNH",
  "HÃŒNH áº¢NH TÃ€I Sáº¢N / HIá»†N TRÆ¯á»œNG": "HÌNH ẢNH TÀI SẢN / HIỆN TRƯỜNG",
  "CÃ³ thá»ƒ chá»n hÃ¬nh áº£nh tá»« Ä‘iá»‡n thoáº¡i, thÆ° viá»‡n": "Có thể chọn hình ảnh từ điện thoại, thư viện",
  "CHá»ŒN HÃŒNH ẢNH": "CHỌN HÌNH ẢNH",
  "HÃ¬nh áº£nh Ä‘ã chọn:": "Hình ảnh đã chọn:",
  "XÃ“A": "XÓA",

  "TIáº¾P NHáº¬N VÃ€ LƯU GIỮ": "TIẾP NHẬN VÀ LƯU GIỮ",
  "Ä»‹a Ä‘iá»ƒm lưu giữ": "Địa điểm lưu giữ",

  "BÃ€N GIAO": "BÀN GIAO",
  "BÃ€N GIAO / TRáº¢ TÃ€I SẢN": "BÀN GIAO / TRẢ TÀI SẢN",

  "ThÃ´ng tin xÃ¡c minh": "Thông tin xác minh"
};

let text = fs.readFileSync(file, 'utf8');

const before = text;

for (const [bad, good] of Object.entries(replacements)) {
  text = text.split(bad).join(good);
}

fs.writeFileSync(file, text, 'utf8');

const result = fs.readFileSync(file, 'utf8');

console.log('LOST & FOUND MOJIBAKE FIX');
console.log('THAY DOI:', before === result ? 0 : 1);
console.log('BÁO CÁO=', result.includes('BÁO CÁO'));
console.log('BÃ=', result.includes('BÃ'));
console.log('Ä=', result.includes('Ä'));
console.log('�=', result.includes('�'));
console.log('BYTES=', Buffer.byteLength(result, 'utf8'));
