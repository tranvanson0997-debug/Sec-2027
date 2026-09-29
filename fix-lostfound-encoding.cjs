const fs = require('fs');

const path = 'src/components/LostFoundView.tsx';
const s = fs.readFileSync(path, 'utf8');

const fixes = new Map([
  [19, "  CLOSED: 'Đã đóng',"],
  [25, "  'Điện thoại / Thiết bị điện tử',"],
  [29, "  'Quần áo / Phụ kiện',"],
  [31, "  'Đồ dùng cá nhân',"],
  [37, "  'Tốt',"],
  [38, "  'Có dấu hiệu sử dụng',"],
  [41, "  'Không xác định',"],
  [58, "    officerName: 'Chưa xác định',"],
  [169, "        'Chưa xác định',"],
  [262, "        'Vui lòng nhập TÊN TÀI SẢN / ĐỒ VẬT.'"],
  [283, "        'Vui lòng nhập khu vực / vị trí.'"],
  [290, "        'Vui lòng chọn loại tài sản / đồ vật.'"],
  [297, "        'Vui lòng chọn tình trạng tài sản / đồ vật.'"],
  [321, "          'Chưa xác định',"],
  [338, "          'Chưa xác định',"],
  [413, "      'Lỗi lưu báo cáo Lost & Found:',"],
  [427, "      `Bạn có chắc muốn xóa báo cáo ${report.reportNumber}?`"],
  [457, "        'LỖI PDF LOST & FOUND:',"],
  [467, "        `LỖI XUẤT PDF:\\n\\n${detail}`"],
  [482, "            Ghi nhận, lưu giữ và bàn giao tài sản / đồ vật thất lạc."],
  [508, "                  ? 'CHỈNH SỬA BÁO CÁO'"],
  [509, "                  : 'TẠO BÁO CÁO MỚI'}"],
  [513, "                Nhập đầy đủ thông tin Lost & Found."],
  [522, "              ĐÓNG"],
  [526, "          {/* 1. THÔNG TIN BÁO CÁO */}"],
  [529, "              1. THÔNG TIN BÁO CÁO"],
  [535, "                label=\"Số báo cáo *\""],
  [590, "                label=\"Khu vực / vị trí *\""],
  [602, "                label=\"Vị trí cụ thể\""],
  [616, "          {/* 2. NGƯỜI BÁO / NHÂN VIÊN */}"],
  [619, "              2. THÔNG TIN NGƯỜI BÁO / NHÂN VIÊN"],
  [639, "                label=\"Số điện thoại\""],
  [643, "                placeholder=\"Số điện thoại\""],
  [670, "                  'Chưa xác định'"],
  [696, "          {/* 3. THÔNG TIN TÀI SẢN */}"],
  [699, "              3. THÔNG TIN TÀI SẢN / ĐỒ VẬT"],
  [705, "                label=\"Tên tài sản / đồ vật *\""],
  [707, "                placeholder=\"Ví dụ: Điện thoại iPhone...\""],
  [747, "                  label=\"Thương hiệu\""],
  [761, "                  label=\"Số serial / IMEI\""],
  [780, "                    Số lượng"],
  [820, "                placeholder=\"Đặc điểm nhận dạng, kích thước, phụ kiện đi kèm...\""],
  [832, "          {/* 4. HÌNH ẢNH */}"],
  [835, "              4. HÌNH ẢNH TÀI SẢN / HIỆN TRƯỜNG"],
  [839, "              Có thể chọn hình ảnh từ điện thoại, thư viện hoặc máy tính."],
  [858, "              + CHỌN HÌNH ẢNH"],
  [862, "              Hình ảnh đã chọn:"],
  [892, "                        XÓA"],
  [915, "                label=\"Địa điểm lưu giữ\""],
  [987, "                label=\"Số điện thoại người nhận\""],
  [991, "                placeholder=\"Số điện thoại\""],
  [1027, "                placeholder=\"Thông tin xác minh, người nhận, giấy tờ đối chiếu...\""],
  [1069, "          {/* 8. GHI CHÚ */}"],
  [1072, "              8. GHI CHÚ"],
  [1080, "              placeholder=\"Thông tin bổ sung...\""],
  [1110, "                📄 XUẤT PDF"],
  [1142, "                placeholder=\"Số báo cáo, tài sản, vị trí, người báo...\""],
  [1223, "                          ? 'TÌM THẤY'"],
  [1231, "                          'Chưa nhập vị trí'}"],
  [1235, "                          'Chưa xác định'}"],
  [1264, "                         📄 XUẤT PDF"],
  [1274, "                         XÓA"]
]);

const eol = s.includes('\r\n') ? '\r\n' : '\n';
const trailing = s.endsWith('\r\n') ? '\r\n' : s.endsWith('\n') ? '\n' : '';

const lines = s.split(/\r?\n/);

if (lines.length !== 1406) {
  console.error('DUNG LAI - SO DONG KHONG DUNG:', lines.length);
  process.exit(1);
}

for (const [lineNumber, replacement] of fixes) {
  lines[lineNumber - 1] = replacement;
}

const output = lines.join(eol) + trailing;
fs.writeFileSync(path, output, 'utf8');

const verify = fs.readFileSync(path, 'utf8');
const verifyLines = verify.split(/\r?\n/);

const bad = verifyLines
  .map((text, i) => ({ line: i + 1, text }))
  .filter(x => x.text.includes('\uFFFD'));

console.log('DA SUA XONG');
console.log('TOTAL_BAD_LINES:', bad.length);
console.log('TOTAL_LINES:', verifyLines.length);
console.log('BYTES:', Buffer.byteLength(verify, 'utf8'));
console.log('PDF:', verify.includes('generateLostFoundPdf'));
console.log('SAVE:', verify.includes('saveReport'));
console.log('PHOTOS:', verify.includes('handleFiles'));

if (bad.length > 0) {
  console.log('CAC DONG CON LOI:');
  for (const x of bad) {
    console.log(x.line + ': ' + x.text);
  }
}
