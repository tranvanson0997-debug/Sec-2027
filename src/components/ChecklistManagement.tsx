import React, { useState } from 'react';
import { ClipboardList, Plus, Trash2, Edit2, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { ChecklistTemplate, ChecklistItem, User } from '../types';
import { StorageService } from '../services/storage';

interface ChecklistManagementProps {
  currentUser: User;
  onDataChanged: () => void;
}

export const ChecklistManagement: React.FC<ChecklistManagementProps> = ({
  currentUser,
  onDataChanged,
}) => {
  const [checklists, setChecklists] = useState<ChecklistTemplate[]>(() =>
    StorageService.getChecklists()
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(checklists[0]?.id || '');
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ChecklistItem['category']>('AN_NINH');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeTemplate = checklists.find((c) => c.id === selectedTemplateId) || checklists[0];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || !activeTemplate) return;

    if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
      alert('Chỉ Security Manager hoặc Admin mới có quyền sửa danh mục Checklist!');
      return;
    }

    const newItem: ChecklistItem = {
      id: `ITM-${Date.now().toString().slice(-4)}`,
      text: newItemText.trim(),
      category: newItemCategory,
      isRequiredPhotoOnFail: true,
    };

    const updatedTemplate: ChecklistTemplate = {
      ...activeTemplate,
      items: [...activeTemplate.items, newItem],
    };

    StorageService.updateChecklist(updatedTemplate, currentUser);
    const updatedAll = StorageService.getChecklists();
    setChecklists(updatedAll);
    setNewItemText('');
    setStatusMessage('Đã thêm tiêu chí kiểm tra mới thành công!');
    setTimeout(() => setStatusMessage(null), 3000);
    onDataChanged();
  };

  const handleRemoveItem = (itemId: string) => {
    if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
      alert('Chỉ Security Manager hoặc Admin mới có quyền xóa tiêu chí Checklist!');
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn xóa tiêu chí kiểm tra này?')) return;

    const updatedTemplate: ChecklistTemplate = {
      ...activeTemplate,
      items: activeTemplate.items.filter((i) => i.id !== itemId),
    };

    StorageService.updateChecklist(updatedTemplate, currentUser);
    setChecklists(StorageService.getChecklists());
    setStatusMessage('Đã cập nhật bộ checklist.');
    setTimeout(() => setStatusMessage(null), 3000);
    onDataChanged();
  };

  const getCategoryBadge = (cat?: ChecklistItem['category']) => {
    switch (cat) {
      case 'AN_NINH':
        return <span className="bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded text-[10px] font-bold">AN NINH</span>;
      case 'PCCC':
        return <span className="bg-orange-950 text-orange-300 border border-orange-800 px-2 py-0.5 rounded text-[10px] font-bold">PCCC</span>;
      case 'AN_TOAN_KHACH':
        return <span className="bg-yellow-950 text-yellow-300 border border-yellow-800 px-2 py-0.5 rounded text-[10px] font-bold">AN TOÀN KHÁCH</span>;
      case 'KY_THUAT':
        return <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">KỸ THUẬT</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">MỸ QUAN</span>;
    }
  };

  return (
    <div id="checklist-management-view" className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide uppercase flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-500" />
            QUẢN LÝ TIÊU CHÍ CHECKLIST TUẦN TRA
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cấu hình danh mục tiêu chuẩn kiểm tra an ninh, phòng ngừa rủi ro cho từng khu vực
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Select Template Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {checklists.map((tpl) => (
          <button
            key={tpl.id}
            id={`tab-checklist-${tpl.id}`}
            onClick={() => setSelectedTemplateId(tpl.id)}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
              activeTemplate?.id === tpl.id
                ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850'
            }`}
          >
            {tpl.name} ({tpl.items.length})
          </button>
        ))}
      </div>

      {/* Active Template Item List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">{activeTemplate?.name}</h3>
            <p className="text-xs text-slate-400">{activeTemplate?.description}</p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            {activeTemplate?.items.length} Tiêu chí kiểm soát
          </span>
        </div>

        {/* List of items */}
        <div className="space-y-2 text-xs">
          {activeTemplate?.items.map((item, index) => (
            <div
              key={item.id}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition"
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-slate-400 text-[11px] shrink-0">
                  {index + 1}
                </span>
                <div>
                  <div className="font-semibold text-white text-xs">{item.text}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {getCategoryBadge(item.category)}
                    {item.isRequiredPhotoOnFail && (
                      <span className="text-[10px] text-red-400 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3" /> Yêu cầu ảnh nếu FAIL
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {(currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
                <button
                  id={`del-checklist-item-${item.id}`}
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition"
                  title="Xóa tiêu chí này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add new Item Form */}
        {(currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
          <form onSubmit={handleAddItem} className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3 text-xs">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Nhập nội dung tiêu chí kiểm tra mới..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              required
            />
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="AN_NINH">An ninh & Trật tự</option>
              <option value="PCCC">PCCC & Thoát hiểm</option>
              <option value="AN_TOAN_KHACH">An toàn cho Khách</option>
              <option value="KY_THUAT">Hệ thống Kỹ thuật</option>
              <option value="VE_SINH_MY_QUAN">Vệ sinh & Mỹ quan</option>
            </select>
            <button
              id="add-checklist-item-btn"
              type="submit"
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow transition"
            >
              <Plus className="w-4 h-4" /> Thêm tiêu chí
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
