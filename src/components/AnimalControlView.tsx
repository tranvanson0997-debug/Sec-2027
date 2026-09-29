import React, { useEffect, useRef, useState } from 'react';
import {
  AnimalControlReport,
  AnimalControlPhoto,
} from '../types';
import { AnimalControlStorage } from '../services/specialReportsStorage';
import { generateAnimalControlPDF } from '../utils/pdfGenerator';

interface Props {
  currentUser?: any;
}

const ANIMAL_TYPES = [
  'Chó/Mèo thả rông',
  'Bò sát / Rắn',
  'Rết / Bọ cạp / Ong',
  'Chim / Dơi',
  'Khỉ / Động vật hoang dã',
  'Khác',
];

const INITIAL_CONDITIONS = [
  'Bình thường / Khỏe mạnh',
  'Bị thương / Kiệt sức',
  'Hung dữ / Kích động',
  'Đã chết',
];

const CAPTURE_TOOLS = [
  'Lưới / Vợt',
  'Gậy bắt rắn chuyên dụng',
  'Lồng bẫy',
  'Găng tay bảo hộ dày',
  'Thùng chứa chuyên dụng',
];

const emptyForm = {
  reportNumber: '',
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toTimeString().slice(0, 5),
  location: '',
  area: '',

  reporterName: '',

  animalType: '',
  animalSpecies: '',
  animalColorSize: '',
  estimatedWeight: '',

  animalAppearance: '',
  initialCondition: '',

  guestImpact: '',
  employeeImpact: '',

  captureProcess: '',
  captureTools: '',
  postCaptureAction: '',

  cause: '',
  proposedMeasures: '',
};

const AnimalControlView: React.FC<Props> = ({ currentUser }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState<AnimalControlPhoto[]>([]);
  const [reports, setReports] = useState<AnimalControlReport[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadReports();

    setForm((prev) => ({
      ...prev,
      reporterName:
        currentUser?.name ||
        currentUser?.fullName ||
        'Chưa xác định',
    }));
  }, [currentUser]);

  const loadReports = () => {
    setReports(AnimalControlStorage.getAll());
  };

  const updateField = (
    field: keyof typeof emptyForm,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleCaptureTool = (tool: string) => {
    const current = form.captureTools
      ? form.captureTools
          .split('||')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    const exists = current.includes(tool);

    const next = exists
      ? current.filter((item) => item !== tool)
      : [...current, tool];

    updateField('captureTools', next.join('||'));
  };

  const captureToolsSelected = form.captureTools
    ? form.captureTools
        .split('||')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const handleFiles = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();

      reader.onload = () => {
        const photo: AnimalControlPhoto = {
          id: `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
          dataUrl: String(reader.result),
          fileName: file.name,
          capturedAt: new Date().toISOString(),
        };

        setPhotos((prev) => [...prev, photo]);
      };

      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) =>
      prev.filter((photo) => photo.id !== id)
    );
  };

  const createReport = (
    status: 'DRAFT' | 'COMPLETED'
  ) => {
    setMessage('');

    const reportNumber = form.reportNumber.trim();
    const location = form.location.trim();
    const animalType = form.animalType.trim();
    const initialCondition =
      form.initialCondition.trim();

    const reporterName =
      form.reporterName.trim() || 'Chưa xác định';

    if (!reportNumber) {
      setMessage('Vui lòng nhập mã báo cáo.');
      return;
    }

    if (reportNumber.length < 4) {
      setMessage(
        'Mã báo cáo không hợp lệ. Vui lòng nhập đầy đủ mã báo cáo.'
      );
      return;
    }

    if (!form.date) {
      setMessage('Vui lòng chọn ngày lập báo cáo.');
      return;
    }

    if (!form.time) {
      setMessage('Vui lòng nhập giờ lập báo cáo.');
      return;
    }

    if (!location) {
      setMessage(
        'Vui lòng nhập khu vực / vị trí phát hiện động vật.'
      );
      return;
    }

    if (location.length < 2) {
      setMessage(
        'Vị trí nhập chưa hợp lệ. Vui lòng nhập rõ khu vực phát hiện.'
      );
      return;
    }

    if (!animalType) {
      setMessage('Vui lòng chọn loại động vật.');
      return;
    }

    if (!initialCondition) {
      setMessage(
        'Vui lòng chọn tình trạng ban đầu của động vật.'
      );
      return;
    }

    if (
      status === 'COMPLETED' &&
      photos.length < 3
    ) {
      setMessage(
        `Không thể hoàn tất báo cáo. Hiện có ${photos.length} ảnh, cần tối thiểu 3 ảnh.`
      );
      return;
    }

    try {
      const now = new Date().toISOString();

      const appearanceParts = [
        form.animalSpecies.trim()
          ? `Chủng loại/Chủng loài: ${form.animalSpecies.trim()}`
          : '',
        form.animalColorSize.trim()
          ? `Màu sắc/Kích thước: ${form.animalColorSize.trim()}`
          : '',
        form.estimatedWeight.trim()
          ? `Trọng lượng ước tính: ${form.estimatedWeight.trim()} kg`
          : '',
      ].filter(Boolean);

      const report: AnimalControlReport = {
        id: `${Date.now()}`,
        reportNumber,

        date: form.date,
        time: form.time,
        location,
        area: form.area.trim(),

        reporterName,

        officerId: currentUser?.id || '',
        officerName:
          currentUser?.name ||
          currentUser?.fullName ||
          'Chưa xác định',
        badgeNumber:
          currentUser?.badgeNumber || '',

        animalType,

        animalSpecies:
          form.animalSpecies.trim(),

        animalColorSize:
          form.animalColorSize.trim(),

        estimatedWeight:
          form.estimatedWeight.trim(),

        animalAppearance:
          appearanceParts.join('\n'),

        initialCondition,

        guestImpact:
          form.guestImpact.trim(),

        employeeImpact:
          form.employeeImpact.trim(),

        captureProcess:
          form.captureProcess.trim(),

        captureTools:
          form.captureTools.trim(),

        postCaptureAction:
          form.postCaptureAction.trim(),

        cause:
          form.cause.trim(),

        proposedMeasures:
          form.proposedMeasures.trim(),

        photos: [...photos],

        status,

        createdAt: now,
        updatedAt: now,

        ...(status === 'COMPLETED'
          ? { completedAt: now }
          : {}),
      };

      AnimalControlStorage.save(report);

      setReports(
        AnimalControlStorage.getAll()
      );

      const currentDate =
        new Date()
          .toISOString()
          .slice(0, 10);

      const currentTime =
        new Date()
          .toTimeString()
          .slice(0, 5);

      setForm({
        ...emptyForm,
        date: currentDate,
        time: currentTime,
        reporterName:
          currentUser?.name ||
          currentUser?.fullName ||
          'Chưa xác định',
      });

      setPhotos([]);

      setMessage(
        status === 'COMPLETED'
          ? `Đã hoàn tất báo cáo ${reportNumber}.`
          : `Đã lưu nháp ${reportNumber}.`
      );

    } catch (error) {
      console.error(
        'Lỗi lưu báo cáo bắt động vật:',
        error
      );

      setMessage(
        'Không thể lưu báo cáo. Vui lòng kiểm tra lại thông tin đã nhập.'
      );
    }
  };
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          BẮT / KIỂM SOÁT ĐỘNG VẬT
        </h1>

        <p className="text-slate-400 mt-1">
          Lập báo cáo ghi nhận, bắt và xử lý động vật trong khu vực.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-300">
          {message}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-8">

        {/* 1. THÔNG TIN BIÊN BẢN */}
        <section>
          <h2 className="text-lg font-bold text-amber-400 mb-4">
            1. THÔNG TIN BIÊN BẢN
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Field
              label="Mã báo cáo *"
              value={form.reportNumber}
              placeholder="Ví dụ: DCV-2026-0001"
              onChange={(v) =>
                updateField('reportNumber', v)
              }
            />

            <Field
              label="Ngày *"
              type="date"
              value={form.date}
              onChange={(v) =>
                updateField('date', v)
              }
            />

            <Field
              label="Giờ *"
              type="time"
              value={form.time}
              onChange={(v) =>
                updateField('time', v)
              }
            />

            <Field
              label="Khu vực phát hiện *"
              value={form.location}
              placeholder="Ví dụ: Sảnh chính, hồ bơi, khu vườn..."
              onChange={(v) =>
                updateField('location', v)
              }
            />

            <Field
              label="Vị trí / khu vực cụ thể"
              value={form.area}
              placeholder="Tầng, phòng, khu vực cụ thể..."
              onChange={(v) =>
                updateField('area', v)
              }
            />

            <Field
              label="Nhân viên lập báo cáo"
              value={
                form.reporterName || 'Chưa xác định'
              }
              placeholder="Chưa xác định"
              onChange={(v) =>
                updateField('reporterName', v)
              }
            />

          </div>
        </section>

        {/* 2. THÔNG TIN ĐỘNG VẬT */}
        <section>
          <h2 className="text-lg font-bold text-amber-400 mb-4">
            2. THÔNG TIN ĐỘNG VẬT
          </h2>

          <div className="space-y-6">

            {/* LOẠI ĐỘNG VẬT */}
            <CheckboxGroup
              title="Loại động vật *"
              options={ANIMAL_TYPES}
              value={form.animalType}
              onChange={(value) =>
                updateField('animalType', value)
              }
            />

            {form.animalType === 'Khác' && (
              <Field
                label="Loại động vật khác"
                value={
                  form.animalAppearance
                    .startsWith('Loại khác: ')
                    ? form.animalAppearance.replace(
                        'Loại khác: ',
                        ''
                      )
                    : ''
                }
                placeholder="Nhập loại động vật"
                onChange={(value) =>
                  updateField(
                    'animalAppearance',
                    `Loại khác: ${value}`
                  )
                }
              />
            )}

            {/* NGOẠI HÌNH */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 mb-3">
                Ngoại hình
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <Field
                  label="Chủng loại / Chủng loài"
                  value={form.animalSpecies}
                  placeholder="Ví dụ: Rắn hổ mang..."
                  onChange={(v) =>
                    updateField(
                      'animalSpecies',
                      v
                    )
                  }
                />

                <Field
                  label="Màu sắc / Kích thước"
                  value={form.animalColorSize}
                  placeholder="Ví dụ: Đen, dài khoảng 1,2m..."
                  onChange={(v) =>
                    updateField(
                      'animalColorSize',
                      v
                    )
                  }
                />

                <Field
                  label="Trọng lượng ước tính (kg)"
                  value={form.estimatedWeight}
                  placeholder="Ví dụ: 2"
                  onChange={(v) =>
                    updateField(
                      'estimatedWeight',
                      v
                    )
                  }
                />

              </div>
            </div>

            {/* TÌNH TRẠNG */}
            <CheckboxGroup
              title="Tình trạng ban đầu *"
              options={INITIAL_CONDITIONS}
              value={form.initialCondition}
              onChange={(value) =>
                updateField(
                  'initialCondition',
                  value
                )
              }
            />

          </div>
        </section>

        {/* 3. ẢNH HƯỞNG */}
        <section>
          <h2 className="text-lg font-bold text-amber-400 mb-4">
            3. ẢNH HƯỞNG ĐẾN KHÁCH / NHÂN VIÊN
          </h2>

          <div className="space-y-4">

            <TextArea
              label="Ảnh hưởng khách"
              value={form.guestImpact}
              placeholder="Mô tả ảnh hưởng đến khách..."
              onChange={(v) =>
                updateField(
                  'guestImpact',
                  v
                )
              }
            />

            <TextArea
              label="Ảnh hưởng nhân viên"
              value={form.employeeImpact}
              placeholder="Mô tả ảnh hưởng đến nhân viên..."
              onChange={(v) =>
                updateField(
                  'employeeImpact',
                  v
                )
              }
            />

          </div>
        </section>

        {/* 4. BẮT VÀ XỬ LÝ */}
        <section>
          <h2 className="text-lg font-bold text-amber-400 mb-4">
            4. QUÁ TRÌNH BẮT VÀ XỬ LÝ
          </h2>

          <div className="space-y-6">

            {/* DỤNG CỤ */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 mb-3">
                Dụng cụ / Thiết bị sử dụng
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                {CAPTURE_TOOLS.map((tool) => (
                  <label
                    key={tool}
                    className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 cursor-pointer hover:border-amber-500 transition"
                  >
                    <input
                      type="checkbox"
                      checked={captureToolsSelected.includes(
                        tool
                      )}
                      onChange={() =>
                        toggleCaptureTool(tool)
                      }
                      className="w-5 h-5 accent-amber-500"
                    />

                    <span className="text-sm text-slate-200">
                      {tool}
                    </span>
                  </label>
                ))}

              </div>
            </div>

            <TextArea
              label="Diễn biến quá trình bắt và xử lý"
              value={form.captureProcess}
              placeholder="Mô tả quá trình phát hiện, tiếp cận, bắt và xử lý..."
              onChange={(v) =>
                updateField(
                  'captureProcess',
                  v
                )
              }
            />

            <TextArea
              label="Phương án xử lý sau khi bắt"
              value={form.postCaptureAction}
              placeholder="Bàn giao, thả về môi trường tự nhiên, bàn giao cơ quan chức năng..."
              onChange={(v) =>
                updateField(
                  'postCaptureAction',
                  v
                )
              }
            />

          </div>
        </section>

        {/* 5. NGUYÊN NHÂN */}
        <section>
          <h2 className="text-lg font-bold text-amber-400 mb-4">
            5. NGUYÊN NHÂN VÀ BIỆN PHÁP ĐỀ XUẤT
          </h2>

          <div className="space-y-4">

            <TextArea
              label="Nguyên nhân"
              value={form.cause}
              placeholder="Xác định nguyên nhân xâm nhập..."
              onChange={(v) =>
                updateField(
                  'cause',
                  v
                )
              }
            />

            <TextArea
              label="Biện pháp đề xuất"
              value={form.proposedMeasures}
              placeholder="Đề xuất biện pháp phòng ngừa / xử lý..."
              onChange={(v) =>
                updateField(
                  'proposedMeasures',
                  v
                )
              }
            />

          </div>
        </section>

        {/* 6. HÌNH ẢNH */}
        <section>
          <h2 className="text-lg font-bold text-amber-400 mb-2">
            6. HÌNH ẢNH HIỆN TRƯỜNG
          </h2>

          <p className="text-sm text-slate-400 mb-4">
            Có thể chọn hình ảnh từ điện thoại, thư viện hoặc máy tính.
            Báo cáo hoàn tất yêu cầu tối thiểu 3 hình ảnh.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
          />

          <button
            type="button"
            onClick={() =>
              fileRef.current?.click()
            }
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
          >
            + CHỌN HÌNH ẢNH
          </button>

          <div className="mt-4 text-sm text-slate-300">
            Hình ảnh đã chọn:
            <b className="ml-1 text-white">
              {photos.length}
            </b>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">

              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative bg-slate-800 rounded-xl overflow-hidden"
                >
                  <img
                    src={photo.dataUrl}
                    alt={photo.fileName}
                    className="w-full h-40 object-cover"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removePhoto(photo.id)
                    }
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white rounded-lg px-2 py-1 text-xs font-bold"
                  >
                    XÓA
                  </button>

                  <div className="p-2 text-xs text-slate-300 truncate">
                    {photo.fileName}
                  </div>
                </div>
              ))}

            </div>
          )}
        </section>

        {/* NÚT */}
        <section className="border-t border-slate-800 pt-6">

          <div className="flex flex-col md:flex-row gap-3">

            <button
              type="button"
              onClick={() =>
                createReport('DRAFT')
              }
              className="flex-1 px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold"
            >
              LƯU NHÁP
            </button>

            <button
              type="button"
              onClick={() =>
                createReport('COMPLETED')
              }
              className="flex-1 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              HOÀN TẤT BÁO CÁO
            </button>

          </div>

        </section>

      </div>

      {/* DANH SÁCH */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

        <h2 className="text-lg font-bold text-white mb-4">
          DANH SÁCH BÁO CÁO ĐỘNG VẬT
        </h2>

        {reports.length === 0 ? (
          <div className="text-slate-500 text-sm">
            Chưa có báo cáo.
          </div>
        ) : (
          <div className="space-y-3">

            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4"
              >

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                  <div>
                    <div className="font-bold text-white">
                      {report.reportNumber}
                    </div>

                    <div className="text-sm text-slate-400 mt-1">
                      {report.date} {report.time}
                      {' • '}
                      {report.animalType}
                      {' • '}
                      {report.location || 'Chưa nhập vị trí'}
                    </div>

                    <div className="text-xs text-slate-500 mt-1">
                      Nhân viên lập:
                      {' '}
                      {report.reporterName ||
                        report.officerName ||
                        'Chưa xác định'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">

                    <div className="text-xs font-bold">
                      {report.status === 'COMPLETED' ? (
                        <span className="text-emerald-400">
                          HOÀN TẤT
                        </span>
                      ) : (
                        <span className="text-amber-400">
                          NHÁP
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await generateAnimalControlPDF(
                            report
                          );
                        } catch (error) {
                          console.error(
                            'LỖI PDF ĐỘNG VẬT:',
                            error
                          );

                          const detail =
                            error instanceof Error
                              ? `${error.name}: ${error.message}`
                              : String(error);

                          alert(
                            `LỖI XUẤT PDF:\n\n${detail}`
                          );
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
                    >
                      📄 XUẤT PDF
                    </button>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
};

const CheckboxGroup = ({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) => (
  <div>
    <h3 className="text-sm font-bold text-slate-300 mb-3">
      {title}
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

      {options.map((option) => (
        <label
          key={option}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition ${
            value === option
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-slate-700 bg-slate-950 hover:border-slate-500'
          }`}
        >
          <input
            type="checkbox"
            checked={value === option}
            onChange={() =>
              onChange(
                value === option ? '' : option
              )
            }
            className="w-5 h-5 accent-amber-500"
          />

          <span className="text-sm text-slate-200">
            {option}
          </span>
        </label>
      ))}

    </div>
  </div>
);

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <label className="block">
    <span className="block text-sm font-bold text-slate-300 mb-2">
      {label}
    </span>

    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) =>
        onChange(e.target.value)
      }
      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500"
    />
  </label>
);

const TextArea = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <label className="block">
    <span className="block text-sm font-bold text-slate-300 mb-2">
      {label}
    </span>

    <textarea
      value={value}
      placeholder={placeholder}
      rows={4}
      onChange={(e) =>
        onChange(e.target.value)
      }
      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500 resize-y"
    />
  </label>
);

export default AnimalControlView;