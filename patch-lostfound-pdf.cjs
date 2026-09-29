const fs = require('fs');

const path = 'src/utils/lostFoundPdfGenerator.ts';
let s = fs.readFileSync(path, 'utf8');

s = s.replace(
`  doc.addFont(
    'NotoSans-Regular.ttf',
    'NotoSans',
    'normal'
  );`,
`  doc.addFont(
    'NotoSans-Regular.ttf',
    'NotoSans',
    'normal',
    'Identity-H'
  );`
);

s = s.replace(
`  doc.addFont(
    'NotoSans-Bold.ttf',
    'NotoSans',
    'bold'
  );`,
`  doc.addFont(
    'NotoSans-Bold.ttf',
    'NotoSans',
    'bold',
    'Identity-H'
  );`
);

const marker = `  /*
   * BẢNG CHI TIẾT
   */`;

const checkboxBlock = `  /*
   * LỰA CHỌN / CHECKBOX
   * Vẽ ô trực tiếp bằng hình học để không phụ thuộc font.
   */
  const drawCheckbox = (
    x: number,
    y: number,
    checked: boolean,
    label: string
  ) => {
    const size = 4;

    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.35);
    doc.rect(x, y - size + 0.8, size, size);

    if (checked) {
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.7);

      doc.line(
        x + 0.8,
        y - 1.2,
        x + 1.7,
        y - 0.3
      );

      doc.line(
        x + 1.7,
        y - 0.3,
        x + 3.3,
        y - 3.0
      );
    }

    doc.setTextColor(30, 41, 59);
    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(8);
    doc.text(label, x + 6, y);
  };

  const checkboxY = 69;

  doc.setFont('NotoSans', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  doc.text('LOẠI BÁO CÁO', 14, checkboxY);

  drawCheckbox(
    42,
    checkboxY,
    report.type === 'LOST',
    'Mất tài sản'
  );

  drawCheckbox(
    78,
    checkboxY,
    report.type === 'FOUND',
    'Tìm thấy tài sản'
  );

  doc.text('TRẠNG THÁI', 116, checkboxY);

  drawCheckbox(
    144,
    checkboxY,
    report.status === 'DRAFT',
    'Bản nháp'
  );

  drawCheckbox(
    171,
    checkboxY,
    report.status === 'FOUND',
    'Tìm thấy'
  );

  const checkboxY2 = 77;

  drawCheckbox(
    14,
    checkboxY2,
    report.status === 'IN_CUSTODY',
    'Đang lưu giữ'
  );

  drawCheckbox(
    55,
    checkboxY2,
    report.status === 'RETURNED',
    'Đã bàn giao'
  );

  drawCheckbox(
    91,
    checkboxY2,
    report.status === 'CLOSED',
    'Đã đóng'
  );

  drawCheckbox(
    122,
    checkboxY2,
    report.status === 'CANCELLED',
    'Đã hủy'
  );

  doc.setFont('NotoSans', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TÌNH TRẠNG TÀI SẢN', 14, 86);

  drawCheckbox(
    55,
    86,
    report.itemCondition === 'Tốt',
    'Tốt'
  );

  drawCheckbox(
    78,
    86,
    report.itemCondition === 'Có dấu hiệu sử dụng',
    'Có dấu hiệu sử dụng'
  );

  drawCheckbox(
    130,
    86,
    report.itemCondition === 'Hư hỏng',
    'Hư hỏng'
  );

  drawCheckbox(
    163,
    86,
    report.itemCondition === 'Không xác định',
    'Không xác định'
  );

`;

if (!s.includes('const drawCheckbox')) {
  s = s.replace(marker, checkboxBlock + marker);
}

s = s.replace(
`    startY: 69,`,
`    startY: 93,`
);

fs.writeFileSync(path, s, 'utf8');

console.log('DA CAP NHAT LOST & FOUND PDF');
console.log('UNICODE_ENCODING:', s.includes("'Identity-H'"));
console.log('CHECKBOX:', s.includes('const drawCheckbox'));
console.log('TABLE_START:', s.includes('startY: 93'));
console.log('BYTES:', Buffer.byteLength(s, 'utf8'));
