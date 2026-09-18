import React, { useState } from 'react';
import {
  Plus,
  QrCode,
  Edit2,
  Lock,
  Unlock,
  Trash2,
  Eye,
  Printer,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Route,
} from 'lucide-react';
import { Checkpoint, User, HotelSystemConfig, ChecklistTemplate } from '../types';
import { StorageService } from '../services/storage';
import { QRModal } from './QRModal';

interface CheckpointManagementProps {
  currentUser: User;
  config: HotelSystemConfig;
  checklists: ChecklistTemplate[];
  onDataChanged: () => void;
}

export const CheckpointManagement: React.FC<CheckpointManagementProps> = ({
  currentUser,
  config,
  checklists,
  onDataChanged,
}) => {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(() => StorageService.getCheckpoints());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals state
  const [qrModalCp, setQrModalCp] = useState<Checkpoint | null>(null);
  const [editingCp, setEditingCp] = useState<Checkpoint | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewDetailCp, setViewDetailCp] = useState<Checkpoint | null>(null);
  const [deleteConfirmCp, setDeleteConfirmCp] = useState<Checkpoint | null>(null);

  // Add / Edit form fields
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formArea, setFormArea] = useState('Khu Sảnh & Công Cộng');
  const [formRoute, setFormRoute] = useState('Tuyến Sảnh & Lối Vào');
  const [formOrder, setFormOrder] = useState(1);
  const [formDescription, setFormDescription] = useState('');
  const [formChecklistId, setFormChecklistId] = useState(checklists[0]?.id || '');
  const [formError, setFormError] = useState<string | null>(null);

  const refreshData = () => {
    setCheckpoints(StorageService.getCheckpoints());
    onDataChanged();
  };

  const openAddModal = () => {
    setEditingCp(null);
    setFormId(`SEC-NEW-${String(checkpoints.length + 1).padStart(2, '0')}`);
    setFormName('');
    setFormArea('Khu Sảnh & Công Cộng');
    setFormRoute('Tuyến Sảnh & Lối Vào');
    setFormOrder(checkpoints.length + 1);
    setFormDescription('');
    setFormChecklistId(checklists[0]?.id || '');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (cp: Checkpoint) => {
    // Check role permission
    if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
      alert('Chỉ Security Manager hoặc Admin mới có quyền sửa đổi cấu hình Checkpoint!');
      return;
    }
    setEditingCp(cp);
    setFormId(cp.id);
    setFormName(cp.name);
    setFormArea(cp.area);
    setFormRoute(cp.route);
    setFormOrder(cp.order);
    setFormDescription(cp.description);
    setFormChecklistId(cp.checklistId);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formId.trim() || !formName.trim()) {
      setFormError('Vui lòng nhập đầy đủ Mã Checkpoint và Tên Vị trí!');
      return;
    }

    try {
      if (editingCp) {
        // Edit
        const updated: Checkpoint = {
          ...editingCp,
          name: formName.trim(),
          area: formArea,
          route: formRoute,
          order: Number(formOrder),
          description: formDescription.trim(),
          checklistId: formChecklistId,
          qrCodeValue: formId.trim().toUpperCase(),
        };
        StorageService.updateCheckpoint(updated, currentUser);
      } else {
        // Add
        StorageService.addCheckpoint(
          {
            id: formId.trim().toUpperCase(),
            name: formName.trim(),
            area: formArea,
            route: formRoute,
            order: Number(formOrder),
            status: 'ACTIVE',
            qrCodeValue: formId.trim().toUpperCase(),
            description: formDescription.trim(),
            checklistId: formChecklistId,
          },
          currentUser
        );
      }

      setIsAddModalOpen(false);
      refreshData();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi lưu checkpoint');
    }
  };

  const handleToggleLock = (cp: Checkpoint) => {
    if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
      alert('Chỉ Security Manager mới có quyền Khóa / Mở khóa Checkpoint!');
      return;
    }
    StorageService.toggleCheckpointStatus(cp.id, currentUser);
    refreshData();
  };

  const handleDelete = () => {
    if (!deleteConfirmCp) return;
    try {
      StorageService.deleteCheckpoint(deleteConfirmCp.id, currentUser);
      setDeleteConfirmCp(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtered checkpoints
  const filtered = checkpoints.filter((cp) => {
    const matchSearch =
      cp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cp.area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchArea = selectedArea === 'ALL' || cp.area === selectedArea;
    const matchStatus = selectedStatus === 'ALL' || cp.status === selectedStatus;
    return matchSearch && matchArea && matchStatus;
  });

  const uniqueAreas = Array.from(new Set(checkpoints.map((c) => c.area)));

  return (
    <div id="checkpoint-management-view" className="space-y-6">
      {/* Top Header Title & Actions matching Section XV */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide uppercase flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-500" />
            QUẢN LÝ CHECKPOINT
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Danh mục các điểm kiểm soát tuần tra an ninh cố định toàn khách sạn
          </p>
        </div>

        {(currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
          <button
            id="add-checkpoint-btn"
            onClick={openAddModal}
            className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 text-xs flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            [ + THÊM CHECKPOINT ]
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã (SEC-...), Vị trí..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Tất cả khu vực ({checkpoints.length})</option>
            {uniqueAreas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* Checkpoints Table matching Section XV: Mã | Khu vực | Tuyến | QR | Trạng thái | Thao tác */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <th className="py-3 px-4 font-bold">Mã</th>
                <th className="py-3 px-4 font-bold">Tên Checkpoint / Vị trí</th>
                <th className="py-3 px-4 font-bold">Khu vực</th>
                <th className="py-3 px-4 font-bold">Tuyến</th>
                <th className="py-3 px-4 font-bold text-center">Mã QR</th>
                <th className="py-3 px-4 font-bold text-center">Trạng thái</th>
                <th className="py-3 px-4 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Không tìm thấy điểm kiểm soát nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filtered.map((cp) => (
                  <tr key={cp.id} className="hover:bg-slate-850/60 transition">
                    {/* Mã */}
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {cp.id}
                    </td>

                    {/* Vị trí */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{cp.name}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{cp.description}</div>
                    </td>

                    {/* Khu vực */}
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {cp.area}
                    </td>

                    {/* Tuyến */}
                    <td className="py-3 px-4 text-slate-400">
                      {cp.route}
                    </td>

                    {/* QR Code trigger */}
                    <td className="py-3 px-4 text-center">
                      <button
                        id={`qr-btn-${cp.id}`}
                        onClick={() => setQrModalCp(cp)}
                        className="p-1.5 bg-slate-800 hover:bg-amber-600/30 text-amber-300 border border-slate-700 hover:border-amber-500/50 rounded-lg transition inline-flex items-center gap-1 text-[11px] font-mono font-bold"
                        title="Tạo / Xem / In mã QR"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR</span>
                      </button>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-4 text-center">
                      {cp.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700">
                          <CheckCircle className="w-3 h-3" /> Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          <Lock className="w-3 h-3" /> Đã khóa
                        </span>
                      )}
                    </td>

                    {/* Thao tác matching Section XV: Xem, Sửa, Tạo QR, In QR, Khóa */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Xem */}
                        <button
                          id={`view-cp-${cp.id}`}
                          onClick={() => setViewDetailCp(cp)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Tạo & In QR */}
                        <button
                          id={`print-qr-${cp.id}`}
                          onClick={() => setQrModalCp(cp)}
                          className="p-1.5 bg-slate-800 hover:bg-amber-600/30 text-amber-300 rounded-lg transition"
                          title="Tạo & In QR Thẻ dán"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Sửa */}
                        {(currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
                          <button
                            id={`edit-cp-${cp.id}`}
                            onClick={() => openEditModal(cp)}
                            className="p-1.5 bg-slate-800 hover:bg-blue-600/30 text-blue-300 rounded-lg transition"
                            title="Chỉnh sửa checkpoint"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Khóa */}
                        {(currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
                          <button
                            id={`lock-cp-${cp.id}`}
                            onClick={() => handleToggleLock(cp)}
                            className={`p-1.5 rounded-lg transition ${
                              cp.status === 'ACTIVE'
                                ? 'bg-slate-800 hover:bg-amber-950/60 text-slate-400 hover:text-amber-300'
                                : 'bg-amber-950/40 text-amber-300 hover:bg-slate-800'
                            }`}
                            title={cp.status === 'ACTIVE' ? 'Khóa checkpoint' : 'Mở khóa checkpoint'}
                          >
                            {cp.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        )}

                        {/* Xóa */}
                        {(currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
                          <button
                            id={`del-cp-${cp.id}`}
                            onClick={() => setDeleteConfirmCp(cp)}
                            className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-lg transition"
                            title="Xóa checkpoint"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Modal */}
      <QRModal
        isOpen={Boolean(qrModalCp)}
        onClose={() => setQrModalCp(null)}
        checkpoint={qrModalCp}
        config={config}
      />

      {/* Add / Edit Checkpoint Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1 uppercase tracking-wide">
              {editingCp ? 'SỬA THÔNG TIN CHECKPOINT' : 'THÊM CHECKPOINT MỚI'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Cập nhật điểm kiểm soát cố định trong hải trình tuần tra khách sạn 5 sao
            </p>

            {formError && (
              <div className="p-3 mb-4 bg-red-950 border border-red-800 rounded-xl text-xs text-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCheckpoint} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mã Checkpoint: *</label>
                  <input
                    type="text"
                    value={formId}
                    disabled={Boolean(editingCp)}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="SEC-LBY-01..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono uppercase focus:outline-none focus:border-amber-500 disabled:opacity-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Thứ tự tuần tra:</label>
                  <input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    min={1}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tên vị trí Checkpoint: *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Sảnh chính Đại sảnh & Quầy Lễ Tân"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Khu vực:</label>
                  <select
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Khu Sảnh & Công Cộng">Khu Sảnh & Công Cộng</option>
                    <option value="Khu Giải Trí & Thể Thao">Khu Giải Trí & Thể Thao</option>
                    <option value="Khu Giải Trí & Bãi Biển">Khu Giải Trí & Bãi Biển</option>
                    <option value="Khu Tầng Hầm & Kỹ Thuật">Khu Tầng Hầm & Kỹ Thuật</option>
                    <option value="Khu Cao Tầng & Tầng Thượng">Khu Cao Tầng & Tầng Thượng</option>
                    <option value="Khu Hành Lang Buồng Phòng">Khu Hành Lang Buồng Phòng</option>
                    <option value="Khu Bếp Trung Tâm & Kho Hàng">Khu Bếp Trung Tâm & Kho Hàng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tuyến tuần tra:</label>
                  <input
                    type="text"
                    value={formRoute}
                    onChange={(e) => setFormRoute(e.target.value)}
                    placeholder="Tuyến A, Tuyến B..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Áp dụng Bộ Checklist:</label>
                <select
                  value={formChecklistId}
                  onChange={(e) => setFormChecklistId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  {checklists.map((chk) => (
                    <option key={chk.id} value={chk.id}>
                      {chk.name} ({chk.items.length} tiêu chí)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mô tả vị trí & hướng dẫn dán thẻ QR:</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ghi rõ vị trí gắn thẻ QR (ví dụ: Trụ cột đối diện cửa chính, độ cao 1.5m)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow"
                >
                  {editingCp ? 'Lưu thay đổi' : 'Tạo Checkpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmCp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-red-800/80 w-full max-w-sm rounded-2xl shadow-2xl p-5 text-xs text-center">
            <div className="w-12 h-12 rounded-full bg-red-950 border border-red-700 flex items-center justify-center text-red-400 mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">XÁC NHẬN XÓA CHECKPOINT</h4>
            <p className="text-slate-300 mb-4">
              Bạn có chắc chắn muốn xóa điểm kiểm soát <strong className="text-amber-400">{deleteConfirmCp.id} - {deleteConfirmCp.name}</strong> không?
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setDeleteConfirmCp(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow"
              >
                Đồng ý Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewDetailCp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 text-xs">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-500" />
              CHI TIẾT ĐIỂM KIỂM SOÁT
            </h3>
            <div className="space-y-2.5 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block">Mã Checkpoint:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{viewDetailCp.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tên vị trí:</span>
                <span className="text-white font-semibold">{viewDetailCp.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Khu vực & Tuyến:</span>
                <span className="text-slate-300">{viewDetailCp.area} | {viewDetailCp.route}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Mô tả & Hướng dẫn:</span>
                <span className="text-slate-300">{viewDetailCp.description || 'Không có ghi chú'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Giá trị mã QR:</span>
                <span className="font-mono text-slate-300">{viewDetailCp.qrCodeValue}</span>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setViewDetailCp(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
