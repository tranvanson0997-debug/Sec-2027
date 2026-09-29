import React, { useMemo, useRef, useState } from 'react';
import {
  LostFoundReport,
  LostFoundStatus,
  LostFoundPhoto,
} from '../types';
import { LostFoundStorage } from '../services/specialReportsStorage';
import { generateLostFoundPdf } from '../utils/lostFoundPdfGenerator';

interface LostFoundViewProps {
  currentUser?: any;
}

const STATUS_LABELS: Record<LostFoundStatus, string> = {
  DRAFT: 'Báº£n nhÃ¡p',
  FOUND: 'ÄÃ£ tiáº¿p nháº­n',
  IN_CUSTODY: 'Äang lÆ°u giá»¯',
  RETURNED: 'ÄÃ£ tráº£',
  CLOSED: 'ÄÃ£ Ä‘Ã³ng',
  CANCELLED: 'ÄÃ£ há»§y',
};

const ITEM_CATEGORIES = [
  'VÃ­ / Tiá»n',
  'Äiá»‡n thoáº¡i / Thiáº¿t bá»‹ Ä‘iá»‡n tá»­',
  'Giáº¥y tá» / Tháº»',
  'ChÃ¬a khÃ³a',
  'Trang sá»©c',
  'Quáº§n Ã¡o / Phá»¥ kiá»‡n',
  'HÃ nh lÃ½ / TÃºi xÃ¡ch',
  'Äá»“ dÃ¹ng cÃ¡ nhÃ¢n',
  'KhÃ¡c',
];

const ITEM_CONDITIONS = [
  'NguyÃªn váº¹n',
  'Tá»‘t',
  'CÃ³ dáº¥u hiá»‡u sá»­ dá»¥ng',
  'HÆ° há»ng nháº¹',
  'HÆ° há»ng náº·ng',
  'KhÃ´ng xÃ¡c Ä‘á»‹nh',
];

const emptyForm: LostFoundReport = {
  id: '',
  reportNumber: '',
  type: 'FOUND',
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toTimeString().slice(0, 5),
  location: '',
  area: '',

  reporterName: '',
  reporterPhone: '',
  reporterEmail: '',

  officerId: '',
  officerName: 'ChÆ°a xÃ¡c Ä‘á»‹nh',
  badgeNumber: '',

  itemName: '',
  itemCategory: '',
  itemDescription: '',
  itemColor: '',
  itemBrand: '',
  itemSerialNumber: '',
  itemQuantity: 1,

  itemCondition: '',

  photos: [],

  storageLocation: '',
  receivedBy: '',
  receivedAt: '',

  returnedTo: '',
  returnedPhone: '',
  returnedAt: '',
  returnNotes: '',

  status: 'DRAFT',

  notes: '',

  createdAt: '',
  updatedAt: '',
  closedAt: '',
};

const LostFoundView: React.FC<LostFoundViewProps> = ({
  currentUser,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const [reports, setReports] = useState<LostFoundReport[]>(
    () => LostFoundStorage.getAll()
  );

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<'ALL' | LostFoundStatus>('ALL');

  const [editing, setEditing] =
    useState<LostFoundReport | null>(null);

  const [form, setForm] =
    useState<LostFoundReport>(emptyForm);

  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');

  const filteredReports = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        report.status === statusFilter;

      if (!keyword) return matchesStatus;

      const text = [
        report.reportNumber,
        report.itemName,
        report.itemCategory,
        report.location,
        report.area,
        report.reporterName,
        report.officerName,
        report.returnedTo,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        matchesStatus &&
        text.includes(keyword)
      );
    });
  }, [reports, search, statusFilter]);

  const updateField = <K extends keyof LostFoundReport>(
    field: K,
    value: LostFoundReport[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const startCreate = () => {
    const now = new Date();

    setEditing(null);
    setMessage('');

    setForm({
      ...emptyForm,
      id: '',
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      officerId: currentUser?.id || '',
      officerName:
        currentUser?.name ||
        currentUser?.fullName ||
        'ChÆ°a xÃ¡c Ä‘á»‹nh',
      badgeNumber:
        currentUser?.badgeNumber || '',
    });

    setShowForm(true);
  };

  const startEdit = (report: LostFoundReport) => {
    setEditing(report);
    setMessage('');
    setForm({
      ...report,
      photos: [...(report.photos || [])],
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditing(null);
    setMessage('');
  };

  const handleFiles = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(
      event.target.files || []
    );

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const photo: LostFoundPhoto = {
          id: `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
          dataUrl: String(reader.result),
          fileName: file.name,
          capturedAt: new Date().toISOString(),
        };

        setForm((prev) => ({
          ...prev,
          photos: [
            ...(prev.photos || []),
            photo,
          ],
        }));
      };

      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const removePhoto = (id: string) => {
    setForm((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter(
        (photo) => photo.id !== id
      ),
    }));
  };

  const saveReport = () => {
    setMessage('');

    const reportNumber =
      form.reportNumber.trim();

    const itemName =
      form.itemName.trim();

    const location =
      form.location.trim();

    if (!reportNumber) {
      setMessage(
        'Vui lÃ²ng nháº­p Sá» BÃO CÃO.'
      );
      return;
    }

    if (!itemName) {
      setMessage(
        'Vui lÃ²ng nháº­p TÃŠN TÃ€I Sáº¢N / Äá»’ Váº¬T.'
      );
      return;
    }

    if (!form.date) {
      setMessage(
        'Vui lÃ²ng chá»n ngÃ y láº­p bÃ¡o cÃ¡o.'
      );
      return;
    }

    if (!form.time) {
      setMessage(
        'Vui lÃ²ng nháº­p giá» láº­p bÃ¡o cÃ¡o.'
      );
      return;
    }

    if (!location) {
      setMessage(
        'Vui lÃ²ng nháº­p khu vá»±c / vá»‹ trÃ­.'
      );
      return;
    }

    if (!form.itemCategory) {
      setMessage(
        'Vui lÃ²ng chá»n loáº¡i tÃ i sáº£n / Ä‘á»“ váº­t.'
      );
      return;
    }

    if (!form.itemCondition) {
      setMessage(
        'Vui lÃ²ng chá»n tÃ¬nh tráº¡ng tÃ i sáº£n / Ä‘á»“ váº­t.'
      );
      return;
    }

    try {
      const now = new Date().toISOString();

      const report: LostFoundReport = {
        ...form,

        id:
          form.id ||
          `LF-${Date.now()}`,

        reportNumber,

        location,

        area:
          form.area?.trim() || '',

        reporterName:
          form.reporterName?.trim() ||
          'ChÆ°a xÃ¡c Ä‘á»‹nh',

        reporterPhone:
          form.reporterPhone?.trim() || '',

        reporterEmail:
          form.reporterEmail?.trim() || '',

        officerId:
          form.officerId ||
          currentUser?.id ||
          '',

        officerName:
          form.officerName ||
          currentUser?.name ||
          currentUser?.fullName ||
          'ChÆ°a xÃ¡c Ä‘á»‹nh',

        badgeNumber:
          form.badgeNumber ||
          currentUser?.badgeNumber ||
          '',

        itemName,

        itemDescription:
          form.itemDescription?.trim() || '',

        itemColor:
          form.itemColor?.trim() || '',

        itemBrand:
          form.itemBrand?.trim() || '',

        itemSerialNumber:
          form.itemSerialNumber?.trim() || '',

        itemQuantity:
          Number(form.itemQuantity) > 0
            ? Number(form.itemQuantity)
            : 1,

        storageLocation:
          form.storageLocation?.trim() || '',

        receivedBy:
          form.receivedBy?.trim() || '',

        returnedTo:
          form.returnedTo?.trim() || '',

        returnedPhone:
          form.returnedPhone?.trim() || '',

        returnNotes:
          form.returnNotes?.trim() || '',

        notes:
          form.notes?.trim() || '',

        photos: [...(form.photos || [])],

        createdAt:
          form.createdAt || now,

        updatedAt: now,

        ...(form.status === 'CLOSED'
          ? {
              closedAt:
                form.closedAt || now,
            }
          : {}),
      };

      LostFoundStorage.save(report);

      setReports(
        LostFoundStorage.getAll()
      );

      setMessage(
        editing
          ? `ÄÃ£ cáº­p nháº­t bÃ¡o cÃ¡o ${reportNumber}.`
          : `ÄÃ£ lÆ°u bÃ¡o cÃ¡o ${reportNumber}.`
      );

      setEditing(report);
      setForm(report);
    } catch (error) {
      console.error(
        'Lá»—i lÆ°u bÃ¡o cÃ¡o Lost & Found:',
        error
      );

      setMessage(
        'KhÃ´ng thá»ƒ lÆ°u bÃ¡o cÃ¡o. Vui lÃ²ng kiá»ƒm tra láº¡i thÃ´ng tin.'
      );
    }
  };

  const deleteReport = (
    report: LostFoundReport
  ) => {
    const confirmed = window.confirm(
      `Báº¡n cÃ³ cháº¯c muá»‘n xÃ³a bÃ¡o cÃ¡o ${report.reportNumber}?`
    );

    if (!confirmed) return;

    LostFoundStorage.delete(
      report.id
    );

    setReports(
      LostFoundStorage.getAll()
    );

    if (editing?.id === report.id) {
      setEditing(null);
      setShowForm(false);
    }

    setMessage(
      `ÄÃ£ xÃ³a bÃ¡o cÃ¡o ${report.reportNumber}.`
    );
  };

  const exportPdf = async (
    report: LostFoundReport
  ) => {
    try {
      await generateLostFoundPdf(report);
    } catch (error) {
      console.error(
        'Lá»–I PDF LOST & FOUND:',
        error
      );

      const detail =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error);

      alert(
        `Lá»–I XUáº¤T PDF:\n\n${detail}`
      );
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            BÃO CÃO LOST & FOUND
          </h1>

          <p className="text-slate-400 mt-1">
            Ghi nháº­n, lÆ°u giá»¯ vÃ  bÃ n giao tÃ i sáº£n / Ä‘á»“ váº­t tháº¥t láº¡c.
          </p>
        </div>

        <button
          type="button"
          onClick={startCreate}
          className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
        >
          + Táº O BÃO CÃO
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-300">
          {message}
        </div>
      )}

      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-8">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">
                {editing
                  ? 'CHá»ˆNH Sá»¬A BÃO CÃO'
                  : 'Táº O BÃO CÃO Má»šI'}
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                Nháº­p Ä‘áº§y Ä‘á»§ thÃ´ng tin Lost & Found.
              </p>
            </div>

            <button
              type="button"
              onClick={cancelForm}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold"
            >
              ÄÃ“NG
            </button>
          </div>

          {/* 1. THÃ”NG TIN BÃO CÃO */}
          <section>
            <h2 className="text-lg font-bold text-amber-400 mb-4">
              1. THÃ”NG TIN BÃO CÃO
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <Field
                label="Sá»‘ bÃ¡o cÃ¡o *"
                value={form.reportNumber}
                placeholder="VÃ­ dá»¥: LF-2026-0001"
                onChange={(v) =>
                  updateField(
                    'reportNumber',
                    v
                  )
                }
              />

              <CheckboxGroup
                title="Loáº¡i bÃ¡o cÃ¡o *"
                options={[
                  'FOUND',
                  'LOST',
                ]}
                value={form.type}
                labels={{
                  FOUND: 'TÃ¬m tháº¥y',
                  LOST: 'BÃ¡o máº¥t',
                }}
                onChange={(value) =>
                  updateField(
                    'type',
                    value as 'FOUND' | 'LOST'
                  )
                }
              />

              <Field
                label="NgÃ y *"
                type="date"
                value={form.date}
                onChange={(v) =>
                  updateField(
                    'date',
                    v
                  )
                }
              />

              <Field
                label="Giá» *"
                type="time"
                value={form.time}
                onChange={(v) =>
                  updateField(
                    'time',
                    v
                  )
                }
              />

              <Field
                label="Khu vá»±c / vá»‹ trÃ­ *"
                value={form.location}
                placeholder="VÃ­ dá»¥: Sáº£nh chÃ­nh, phÃ²ng 201..."
                onChange={(v) =>
                  updateField(
                    'location',
                    v
                  )
                }
              />

              <Field
                label="Vá»‹ trÃ­ cá»¥ thá»ƒ"
                value={form.area || ''}
                placeholder="Táº§ng, phÃ²ng, khu vá»±c..."
                onChange={(v) =>
                  updateField(
                    'area',
                    v
                  )
                }
              />

            </div>
          </section>

          {/* 2. NGÆ¯á»œI BÃO / NHÃ‚N VIÃŠN */}
          <section>
            <h2 className="text-lg font-bold text-amber-400 mb-4">
              2. THÃ”NG TIN NGÆ¯á»œI BÃO / NHÃ‚N VIÃŠN
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <Field
                label="TÃªn ngÆ°á»i bÃ¡o"
                value={
                  form.reporterName || ''
                }
                placeholder="Há» vÃ  tÃªn"
                onChange={(v) =>
                  updateField(
                    'reporterName',
                    v
                  )
                }
              />

              <Field
                label="Sá»‘ Ä‘iá»‡n thoáº¡i"
                value={
                  form.reporterPhone || ''
                }
                placeholder="Sá»‘ Ä‘iá»‡n thoáº¡i"
                onChange={(v) =>
                  updateField(
                    'reporterPhone',
                    v
                  )
                }
              />

              <Field
                label="Email"
                value={
                  form.reporterEmail || ''
                }
                placeholder="Email"
                onChange={(v) =>
                  updateField(
                    'reporterEmail',
                    v
                  )
                }
              />

              <Field
                label="NhÃ¢n viÃªn láº­p bÃ¡o cÃ¡o"
                value={
                  form.officerName ||
                  'ChÆ°a xÃ¡c Ä‘á»‹nh'
                }
                onChange={(v) =>
                  updateField(
                    'officerName',
                    v
                  )
                }
              />

              <Field
                label="MÃ£ nhÃ¢n viÃªn"
                value={
                  form.badgeNumber || ''
                }
                onChange={(v) =>
                  updateField(
                    'badgeNumber',
                    v
                  )
                }
              />

            </div>
          </section>

          {/* 3. THÃ”NG TIN TÃ€I Sáº¢N */}
          <section>
            <h2 className="text-lg font-bold text-amber-400 mb-4">
              3. THÃ”NG TIN TÃ€I Sáº¢N / Äá»’ Váº¬T
            </h2>

            <div className="space-y-5">

              <Field
                label="TÃªn tÃ i sáº£n / Ä‘á»“ váº­t *"
                value={form.itemName}
                placeholder="VÃ­ dá»¥: Äiá»‡n thoáº¡i iPhone..."
                onChange={(v) =>
                  updateField(
                    'itemName',
                    v
                  )
                }
              />

              <CheckboxGroup
                title="Loáº¡i tÃ i sáº£n *"
                options={ITEM_CATEGORIES}
                value={
                  form.itemCategory
                }
                onChange={(value) =>
                  updateField(
                    'itemCategory',
                    value
                  )
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <Field
                  label="MÃ u sáº¯c"
                  value={
                    form.itemColor || ''
                  }
                  placeholder="VÃ­ dá»¥: Äen"
                  onChange={(v) =>
                    updateField(
                      'itemColor',
                      v
                    )
                  }
                />

                <Field
                  label="ThÆ°Æ¡ng hiá»‡u"
                  value={
                    form.itemBrand || ''
                  }
                  placeholder="VÃ­ dá»¥: Apple"
                  onChange={(v) =>
                    updateField(
                      'itemBrand',
                      v
                    )
                  }
                />

                <Field
                  label="Sá»‘ serial / IMEI"
                  value={
                    form.itemSerialNumber || ''
                  }
                  placeholder="Náº¿u cÃ³"
                  onChange={(v) =>
                    updateField(
                      'itemSerialNumber',
                      v
                    )
                  }
                />

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <label className="block">
                  <span className="block text-sm font-bold text-slate-300 mb-2">
                    Sá»‘ lÆ°á»£ng
                  </span>

                  <input
                    type="number"
                    min={1}
                    value={
                      form.itemQuantity || 1
                    }
                    onChange={(e) =>
                      updateField(
                        'itemQuantity',
                        Number(e.target.value) || 1
                      )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500"
                  />
                </label>

                <CheckboxGroup
                  title="TÃ¬nh tráº¡ng *"
                  options={ITEM_CONDITIONS}
                  value={
                    form.itemCondition
                  }
                  onChange={(value) =>
                    updateField(
                      'itemCondition',
                      value
                    )
                  }
                />

              </div>

              <TextArea
                label="MÃ´ táº£ chi tiáº¿t"
                value={
                  form.itemDescription
                }
                placeholder="Äáº·c Ä‘iá»ƒm nháº­n dáº¡ng, kÃ­ch thÆ°á»›c, phá»¥ kiá»‡n Ä‘i kÃ¨m..."
                onChange={(v) =>
                  updateField(
                    'itemDescription',
                    v
                  )
                }
              />

            </div>
          </section>

          {/* 4. HÃŒNH áº¢NH */}
          <section>
            <h2 className="text-lg font-bold text-amber-400 mb-2">
              4. HÃŒNH áº¢NH TÃ€I Sáº¢N / HIá»†N TRÆ¯á»œNG
            </h2>

            <p className="text-sm text-slate-400 mb-4">
              CÃ³ thá»ƒ chá»n hÃ¬nh áº£nh tá»« Ä‘iá»‡n thoáº¡i, thÆ° viá»‡n hoáº·c mÃ¡y tÃ­nh.
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
              + CHá»ŒN HÃŒNH áº¢NH
            </button>

            <div className="mt-4 text-sm text-slate-300">
              HÃ¬nh áº£nh Ä‘Ã£ chá»n:
              <b className="ml-1 text-white">
                {form.photos?.length || 0}
              </b>
            </div>

            {(form.photos?.length || 0) > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">

                {(form.photos || []).map(
                  (photo) => (
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
                          removePhoto(
                            photo.id
                          )
                        }
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white rounded-lg px-2 py-1 text-xs font-bold"
                      >
                        XÃ“A
                      </button>

                      <div className="p-2 text-xs text-slate-300 truncate">
                        {photo.fileName}
                      </div>
                    </div>
                  )
                )}

              </div>
            )}
          </section>

          {/* 5. LÆ¯U GIá»® */}
          <section>
            <h2 className="text-lg font-bold text-amber-400 mb-4">
              5. TIáº¾P NHáº¬N VÃ€ LÆ¯U GIá»®
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <Field
                label="Äá»‹a Ä‘iá»ƒm lÆ°u giá»¯"
                value={
                  form.storageLocation || ''
                }
                placeholder="Tá»§, kho, phÃ²ng lÆ°u giá»¯..."
                onChange={(v) =>
                  updateField(
                    'storageLocation',
                    v
                  )
                }
              />

              <Field
                label="NgÆ°á»i tiáº¿p nháº­n"
                value={
                  form.receivedBy || ''
                }
                placeholder="Há» vÃ  tÃªn"
                onChange={(v) =>
                  updateField(
                    'receivedBy',
                    v
                  )
                }
              />

              <Field
                label="Thá»i gian tiáº¿p nháº­n"
                type="datetime-local"
                value={
                  form.receivedAt
                    ? form.receivedAt.slice(
                        0,
                        16
                      )
                    : ''
                }
                onChange={(v) =>
                  updateField(
                    'receivedAt',
                    v
                  )
                }
              />

            </div>
          </section>

          {/* 6. BÃ€N GIAO */}
          <section>
            <h2 className="text-lg font-bold text-amber-400 mb-4">
              6. BÃ€N GIAO / TRáº¢ TÃ€I Sáº¢N
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <Field
                label="NgÆ°á»i nháº­n láº¡i"
                value={
                  form.returnedTo || ''
                }
                placeholder="Há» vÃ  tÃªn"
                onChange={(v) =>
                  updateField(
                    'returnedTo',
                    v
                  )
                }
              />

              <Field
                label="Sá»‘ Ä‘iá»‡n thoáº¡i ngÆ°á»i nháº­n"
                value={
                  form.returnedPhone || ''
                }
                placeholder="Sá»‘ Ä‘iá»‡n thoáº¡i"
                onChange={(v) =>
                  updateField(
                    'returnedPhone',
                    v
                  )
                }
              />

              <Field
                label="Thá»i gian tráº£"
                type="datetime-local"
                value={
                  form.returnedAt
                    ? form.returnedAt.slice(
                        0,
                        16
                      )
                    : ''
                }
                onChange={(v) =>
                  updateField(
                    'returnedAt',
                    v
                  )
                }
              />

            </div>

            <div className="mt-4">
              <TextArea
                label="Ghi chÃº bÃ n giao"
                value={
                  form.returnNotes || ''
                }
                placeholder="ThÃ´ng tin xÃ¡c minh, ngÆ°á»i nháº­n, giáº¥y tá» Ä‘á»‘i chiáº¿u..."
                onChange={(v) =>
                  updateField(
                    'returnNotes',
                    v
                  )
                }
              />
            </div>
          </section>

          {/* 7. TRáº NG THÃI */}
          <section>
            <h2 className="text-lg font-bold text-amber-400 mb-4">
              7. TRáº NG THÃI BÃO CÃO
            </h2>

            <select
              value={form.status}
              onChange={(e) =>
                updateField(
                  'status',
                  e.target.value as LostFoundStatus
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500"
            >
              {Object.entries(
                STATUS_LABELS
              ).map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>
          </section>

          {/* 8. GHI CHÃš */}
          <section>
            <h2 className="text-lg font-bold text-amber-400 mb-4">
              8. GHI CHÃš
            </h2>

            <TextArea
              label="Ghi chÃº khÃ¡c"
              value={
                form.notes || ''
              }
              placeholder="ThÃ´ng tin bá»• sung..."
              onChange={(v) =>
                updateField(
                  'notes',
                  v
                )
              }
            />
          </section>

          <section className="border-t border-slate-800 pt-6">

            <div className="flex flex-col md:flex-row gap-3">

              <button
                type="button"
                onClick={saveReport}
                className="flex-1 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                {editing
                  ? 'Cáº¬P NHáº¬T BÃO CÃO'
                  : 'LÆ¯U BÃO CÃO'}
              </button>

              <button
                type="button"
                onClick={() => editing && exportPdf(editing)}
                disabled={!editing}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold"
              >
                ðŸ“„ XUáº¤T PDF
              </button>

              <button
                type="button"
                onClick={cancelForm}
                className="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold"
              >
                Há»¦Y
              </button>

            </div>

          </section>

        </div>
      )}

      {/* DANH SÃCH */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-5">

          <div className="flex-1">
            <label className="block">
              <span className="block text-sm font-bold text-slate-300 mb-2">
                TÃ¬m kiáº¿m
              </span>

              <input
                type="text"
                value={search}
                placeholder="Sá»‘ bÃ¡o cÃ¡o, tÃ i sáº£n, vá»‹ trÃ­, ngÆ°á»i bÃ¡o..."
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500"
              />
            </label>
          </div>

          <div className="md:w-64">
            <label className="block">
              <span className="block text-sm font-bold text-slate-300 mb-2">
                Lá»c tráº¡ng thÃ¡i
              </span>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | 'ALL'
                      | LostFoundStatus
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-500"
              >
                <option value="ALL">
                  Táº¥t cáº£
                </option>

                {Object.entries(
                  STATUS_LABELS
                ).map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

        </div>

        <h2 className="text-lg font-bold text-white mb-4">
          DANH SÃCH BÃO CÃO LOST & FOUND
        </h2>

        {filteredReports.length === 0 ? (
          <div className="text-slate-500 text-sm">
            ChÆ°a cÃ³ bÃ¡o cÃ¡o phÃ¹ há»£p.
          </div>
        ) : (
          <div className="space-y-3">

            {filteredReports.map(
              (report) => (
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
                        {report.date}{' '}
                        {report.time}
                        {' â€¢ '}
                        {report.type ===
                        'FOUND'
                          ? 'TÃŒM THáº¤Y'
                          : 'BÃO Máº¤T'}
                        {' â€¢ '}
                        {report.itemName}
                      </div>

                      <div className="text-xs text-slate-500 mt-1">
                        {report.location ||
                          'ChÆ°a nháº­p vá»‹ trÃ­'}
                        {' â€¢ '}
                        {report.reporterName ||
                          report.officerName ||
                          'ChÆ°a xÃ¡c Ä‘á»‹nh'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">

                      <div className="text-xs font-bold text-amber-400">
                        {STATUS_LABELS[
                          report.status
                        ] || report.status}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          startEdit(report)
                        }
                        className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold"
                      >
                        Sá»¬A
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          exportPdf(report)
                        }
                        className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                      >
                        ðŸ“„ XUáº¤T PDF
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteReport(report)
                        }
                        className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                      >
                        XÃ“A
                      </button>

                    </div>

                  </div>

                </div>
              )
            )}

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
  labels,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  labels?: Record<string, string>;
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
                value === option
                  ? ''
                  : option
              )
            }
            className="w-5 h-5 accent-amber-500"
          />

          <span className="text-sm text-slate-200">
            {labels?.[option] ||
              option}
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

export default LostFoundView;
