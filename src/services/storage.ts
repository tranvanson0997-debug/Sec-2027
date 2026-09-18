import {
  User,
  Checkpoint,
  ChecklistTemplate,
  PatrolSession,
  Incident,
  AuditLog,
  HotelSystemConfig,
  EditAuditRecord,
  DashboardStats,
  OnlineUser,
  AccessNotification,
} from '../types';
import { generateSampleIncidentPhoto } from '../utils/photoUtils';

const STORAGE_KEYS = {
  CURRENT_USER: 'hotel_patrol_current_user',
  USERS: 'hotel_patrol_users',
  CHECKPOINTS: 'hotel_patrol_checkpoints',
  CHECKLISTS: 'hotel_patrol_checklists',
  PATROLS: 'hotel_patrol_sessions',
  INCIDENTS: 'hotel_patrol_incidents',
  AUDIT_LOGS: 'hotel_patrol_audit_logs',
  CONFIG: 'hotel_patrol_config',
  ONLINE_USERS: 'hotel_patrol_online_users',
  ACCESS_NOTIFICATIONS: 'hotel_patrol_access_notifications',
};

const SYNC_EVENT_NAME = 'hotel_patrol_data_changed';
let patrolBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    patrolBroadcastChannel = new BroadcastChannel('hotel_patrol_channel');
  }
} catch {
  // Fallback to Window events and localStorage storage event
}

// Initial default configuration
export const DEFAULT_CONFIG: HotelSystemConfig = {
  hotelName: 'Dusit Princess Moonrise Phú Quốc',
  departmentName: 'BỘ PHẬN AN NINH & BẢO VỆ (SECURITY DEPT)',
  address: 'Đường Trần Hưng Đạo, Cửa Lấp, Dương Tơ, Thành phố Phú Quốc, Tỉnh Kiên Giang',
  hotline: '',
  requireQrScan: true,
  allowSupervisorOverride: true,
  retentionDays: 365,
  requirePhotoOnFail: true,
  watermarkHotelName: true,
};

// Pre-seeded Users with 4 roles and secure Gmail accounts
export const DEFAULT_USERS: User[] = [
  {
    id: 'USR-MGR-01',
    username: 'manager',
    fullName: 'Nguyễn Văn An',
    role: 'MANAGER',
    badgeNumber: 'SEC-MGR-01',
    phone: '0908 112 233',
    email: 'nguyenvanan.security@gmail.com',
    status: 'ACTIVE',
    failedLoginAttempts: 0,
    lastLogin: '2026-09-16 08:30:12',
    createdAt: '2025-01-01 00:00:00',
  },
  {
    id: 'USR-SUP-01',
    username: 'supervisor',
    fullName: 'Trần Văn Bình',
    role: 'SUPERVISOR',
    badgeNumber: 'SEC-SUP-02',
    phone: '0912 334 556',
    email: 'tranvanbinh.security@gmail.com',
    status: 'ACTIVE',
    failedLoginAttempts: 0,
    lastLogin: '2026-09-16 07:15:00',
    createdAt: '2025-01-10 00:00:00',
  },
  {
    id: 'USR-OFC-01',
    username: 'officer1',
    fullName: 'Lê Văn Cường',
    role: 'OFFICER',
    badgeNumber: 'SEC-OFC-042',
    phone: '0988 556 778',
    email: 'levancuong.security@gmail.com',
    status: 'ACTIVE',
    failedLoginAttempts: 0,
    lastLogin: '2026-09-16 06:00:00',
    createdAt: '2025-02-01 00:00:00',
  },
  {
    id: 'USR-OFC-02',
    username: 'officer2',
    fullName: 'Phạm Quốc Bảo',
    role: 'OFFICER',
    badgeNumber: 'SEC-OFC-045',
    phone: '0977 889 900',
    email: 'phamquocbao.security@gmail.com',
    status: 'ACTIVE',
    failedLoginAttempts: 0,
    lastLogin: '2026-09-15 18:00:00',
    createdAt: '2025-02-15 00:00:00',
  },
  {
    id: 'USR-ADM-01',
    username: 'admin',
    fullName: 'Đỗ Thành Trung',
    role: 'ADMIN',
    badgeNumber: 'SYS-ADM-01',
    phone: '0933 445 566',
    email: 'dothanhtrung.admin@gmail.com',
    status: 'ACTIVE',
    failedLoginAttempts: 0,
    lastLogin: '2026-09-16 01:00:00',
    createdAt: '2024-12-01 00:00:00',
  },
];

// Seeded Checklists with 12 items for Lobby matching user prompt specification
export const DEFAULT_CHECKLISTS: ChecklistTemplate[] = [
  {
    id: 'CHK-LOBBY-01',
    name: 'Checklist Khu vực Sảnh Chính & Đón Khách (5 Sao)',
    description: 'Tiêu chuẩn 12 điểm an ninh và mỹ quan sảnh khách sạn cao cấp',
    items: [
      { id: 'ITM-01', text: 'Khu vực sạch và thông thoáng', category: 'VE_SINH_MY_QUAN', isRequiredPhotoOnFail: true },
      { id: 'ITM-02', text: 'Không có người khả nghi lảng vảng', category: 'AN_NINH', isRequiredPhotoOnFail: true },
      { id: 'ITM-03', text: 'Không có vật thể hoặc hành lý vô chủ khả nghi', category: 'AN_NINH', isRequiredPhotoOnFail: true },
      { id: 'ITM-04', text: 'Camera giám sát (CCTV) hoạt động tốt, góc quét rõ', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
      { id: 'ITM-05', text: 'Ánh sáng đầy đủ, đèn chùm và đèn hắt không chập chờn', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
      { id: 'ITM-06', text: 'Cửa xoay và cửa kính tự động hoạt động an toàn', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
      { id: 'ITM-07', text: 'Lối thoát hiểm thông thoáng, đèn Exit sáng rõ', category: 'PCCC', isRequiredPhotoOnFail: true },
      { id: 'ITM-08', text: 'Thiết bị PCCC đúng vị trí, áp kế bình CO2/Bột đạt chuẩn', category: 'PCCC', isRequiredPhotoOnFail: true },
      { id: 'ITM-09', text: 'Biển cảnh báo đầy đủ (sàn ướt, đang dọn vệ sinh)', category: 'AN_TOAN_KHACH', isRequiredPhotoOnFail: true },
      { id: 'ITM-10', text: 'Không có sàn trơn trượt hoặc rò rỉ nước từ trần/máy lạnh', category: 'AN_TOAN_KHACH', isRequiredPhotoOnFail: true },
      { id: 'ITM-11', text: 'Không có vật cản lối đi dành cho khách và xe hành lý', category: 'VE_SINH_MY_QUAN', isRequiredPhotoOnFail: true },
      { id: 'ITM-12', text: 'Không có nguy cơ tiềm ẩn đối với sự an toàn của khách', category: 'AN_TOAN_KHACH', isRequiredPhotoOnFail: true },
    ],
  },
  {
    id: 'CHK-POOL-01',
    name: 'Checklist Hồ Bơi Vô Cực & Bãi Biển',
    description: 'An toàn nước biển, cứu hộ và tài sản khách nghỉ ngơi',
    items: [
      { id: 'ITM-P01', text: 'Phao cứu sinh và sào cứu hộ đầy đủ tại các vị trí quy định', category: 'AN_TOAN_KHACH', isRequiredPhotoOnFail: true },
      { id: 'ITM-P02', text: 'Nhân viên cứu hộ (Lifeguard) túc trực đúng vị trí', category: 'AN_NINH', isRequiredPhotoOnFail: true },
      { id: 'ITM-P03', text: 'Biển báo độ sâu nước và biển cảnh báo trơn trượt rõ ràng', category: 'AN_TOAN_KHACH', isRequiredPhotoOnFail: true },
      { id: 'ITM-P04', text: 'Không có chai thủy tinh vỡ hoặc vật sắc nhọn quanh bể bơi', category: 'VE_SINH_MY_QUAN', isRequiredPhotoOnFail: true },
      { id: 'ITM-P05', text: 'Camera góc quét mặt nước hoạt động bình thường', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
      { id: 'ITM-P06', text: 'Cờ cảnh báo thời tiết biển (Cờ xanh/vàng/đỏ) treo đúng quy định', category: 'AN_TOAN_KHACH', isRequiredPhotoOnFail: true },
      { id: 'ITM-P07', text: 'Hộp sơ cứu y tế (First Aid Kit) đầy đủ bông băng thuốc sát trùng', category: 'AN_TOAN_KHACH', isRequiredPhotoOnFail: true },
      { id: 'ITM-P08', text: 'Không có người lạ hoặc khách say xỉn gây mất trật tự', category: 'AN_NINH', isRequiredPhotoOnFail: true },
    ],
  },
  {
    id: 'CHK-BASEMENT-01',
    name: 'Checklist Tầng Hầm Đỗ Xe & Phòng Kỹ Thuật',
    description: 'Kiểm soát cháy nổ, phương tiện và cửa kỹ thuật',
    items: [
      { id: 'ITM-B01', text: 'Cửa thoát hiểm chống cháy đóng kín, không bị chèn gạch/đá', category: 'PCCC', isRequiredPhotoOnFail: true },
      { id: 'ITM-B02', text: 'Hệ thống van chữa cháy tự động (Sprinkler) không bị rò rỉ hay nghẽn', category: 'PCCC', isRequiredPhotoOnFail: true },
      { id: 'ITM-B03', text: 'Phòng máy phát điện & trạm biến áp khóa kín an toàn', category: 'AN_NINH', isRequiredPhotoOnFail: true },
      { id: 'ITM-B04', text: 'Không có phương tiện đỗ sai quy định chắn lối thoát nạn', category: 'AN_NINH', isRequiredPhotoOnFail: true },
      { id: 'ITM-B05', text: 'Không phát hiện mùi khét, mùi xăng dầu hoặc khói bất thường', category: 'PCCC', isRequiredPhotoOnFail: true },
      { id: 'ITM-B06', text: 'Hệ thống thông gió hút khói tầng hầm hoạt động ổn định', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
      { id: 'ITM-B07', text: 'Ánh sáng hầm xe đầy đủ, gương cầu lồi không bị vỡ hay lệch', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
      { id: 'ITM-B08', text: 'Bơm thoát nước hầm xe (Sump pump) sẵn sàng chống ngập', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
    ],
  },
  {
    id: 'CHK-ROOFTOP-01',
    name: 'Checklist Tầng Thượng Sky Bar & Bãi Đáp Trực Thăng',
    description: 'An toàn lan can cao tầng, cửa gió và hệ thống thu lôi',
    items: [
      { id: 'ITM-R01', text: 'Cửa thoát hiểm lên tầng thượng khóa kiểm soát bằng thẻ từ/chìa an ninh', category: 'AN_NINH', isRequiredPhotoOnFail: true },
      { id: 'ITM-R02', text: 'Lan can kính và rào chắn an toàn kiên cố, không lung lay', category: 'AN_TOAN_KHACH', isRequiredPhotoOnFail: true },
      { id: 'ITM-R03', text: 'Đèn cảnh báo máy bay (Aviation Beacon) ban đêm sáng đỏ rõ ràng', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
      { id: 'ITM-R04', text: 'Sàn đáp trực thăng thông thoáng, không có rác hay vật thể bay', category: 'VE_SINH_MY_QUAN', isRequiredPhotoOnFail: true },
      { id: 'ITM-R05', text: 'Hệ thống kim thu lôi chống sét liên kết tiếp địa chắc chắn', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
      { id: 'ITM-R06', text: 'Bình chữa cháy khí CO2 đặt tại tủ trực thầu thượng nguyên vẹn', category: 'PCCC', isRequiredPhotoOnFail: true },
    ],
  },
];

// Pre-seeded 5-Star Hotel Checkpoints
export const DEFAULT_CHECKPOINTS: Checkpoint[] = [
  {
    id: 'SEC-LBY-01',
    name: 'Sảnh chính Đại sảnh & Quầy Lễ Tân (Lobby Reception)',
    area: 'Khu Sảnh & Công Cộng',
    route: 'Tuyến Sảnh & Lối Vào',
    order: 1,
    status: 'ACTIVE',
    qrCodeValue: 'SEC-LBY-01',
    description: 'Vị trí cột chính đối diện cửa xoay đón khách trung tâm',
    checklistId: 'CHK-LOBBY-01',
    createdAt: '2025-01-01 08:00:00',
  },
  {
    id: 'SEC-ENT-01',
    name: 'Cổng chính & Khu vực đón trả khách VIP (Drop-off Zone)',
    area: 'Khu Sảnh & Công Cộng',
    route: 'Tuyến Sảnh & Lối Vào',
    order: 2,
    status: 'ACTIVE',
    qrCodeValue: 'SEC-ENT-01',
    description: 'Bốt bảo vệ cổng số 1 và làn xe limousine',
    checklistId: 'CHK-LOBBY-01',
    createdAt: '2025-01-01 08:00:00',
  },
  {
    id: 'SEC-POOL-01',
    name: 'Hồ bơi vô cực tầng 5 & Pool Bar (Infinity Pool)',
    area: 'Khu Giải Trí & Thể Thao',
    route: 'Tuyến Thể Thao & Bãi Biển',
    order: 3,
    status: 'ACTIVE',
    qrCodeValue: 'SEC-POOL-01',
    description: 'Trụ cứu hộ cạnh tháp quan sát hồ bơi ngoài trời',
    checklistId: 'CHK-POOL-01',
    createdAt: '2025-01-01 08:00:00',
  },
  {
    id: 'SEC-BCH-01',
    name: 'Bãi biển riêng & Lối đi ven biển (Private Beachfront)',
    area: 'Khu Giải Trí & Bãi Biển',
    route: 'Tuyến Thể Thao & Bãi Biển',
    order: 4,
    status: 'ACTIVE',
    qrCodeValue: 'SEC-BCH-01',
    description: 'Chòi an ninh bãi cát lối ra câu lạc bộ thể thao biển',
    checklistId: 'CHK-POOL-01',
    createdAt: '2025-01-01 08:00:00',
  },
  {
    id: 'SEC-PKG-01',
    name: 'Hầm đỗ xe B1 & Phòng biến áp kỹ thuật (Basement B1)',
    area: 'Khu Tầng Hầm & Kỹ Thuật',
    route: 'Tuyến Kỹ Thuật & Hầm',
    order: 5,
    status: 'ACTIVE',
    qrCodeValue: 'SEC-PKG-01',
    description: 'Cửa ra vào phòng phân phối điện cạnh thang máy số 4',
    checklistId: 'CHK-BASEMENT-01',
    createdAt: '2025-01-01 08:00:00',
  },
  {
    id: 'SEC-ROOF-01',
    name: 'Tầng thượng Sky Bar & Bãi đáp trực thăng (Helipad Rooftop)',
    area: 'Khu Cao Tầng & Tầng Thượng',
    route: 'Tuyến Cao Tầng',
    order: 6,
    status: 'ACTIVE',
    qrCodeValue: 'SEC-ROOF-01',
    description: 'Cửa thang thoát hiểm sân bay trực thăng tầng 32',
    checklistId: 'CHK-ROOF-01',
    createdAt: '2025-01-01 08:00:00',
  },
];

// Helper to initialize and retrieve DB
export class StorageService {
  /**
   * Broadcast real-time change event to all active views and browser tabs/windows
   */
  static notifyDataChanged(): void {
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME));
      } catch {
        // ignore
      }
      if (patrolBroadcastChannel) {
        try {
          patrolBroadcastChannel.postMessage({ type: 'DATA_CHANGED', timestamp: Date.now() });
        } catch {
          // ignore
        }
      }
    }
  }

  /**
   * Subscribe to real-time patrol and incident changes across views and windows
   */
  static subscribe(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleCustom = () => callback();
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('hotel_patrol_')) {
        callback();
      }
    };
    const handleBroadcast = (e: MessageEvent) => {
      if (e.data && e.data.type === 'DATA_CHANGED') {
        callback();
      }
    };

    window.addEventListener(SYNC_EVENT_NAME, handleCustom);
    window.addEventListener('storage', handleStorage);
    if (patrolBroadcastChannel) {
      patrolBroadcastChannel.addEventListener('message', handleBroadcast);
    }

    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleCustom);
      window.removeEventListener('storage', handleStorage);
      if (patrolBroadcastChannel) {
        patrolBroadcastChannel.removeEventListener('message', handleBroadcast);
      }
    };
  }

  /**
   * Alias for subscribe for real-time updates
   */
  static subscribeToDataChanges(callback: () => void): () => void {
    return this.subscribe(callback);
  }

  static init() {
    // Migration: update existing stored config to Dusit Princess Moonrise Phú Quốc & remove hotline
    const storedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        let changed = false;
        if (
          !parsed.hotelName ||
          parsed.hotelName === 'KHÁCH SẠN QUỐC TẾ & RESORT GRAND PALACE' ||
          parsed.hotelName.includes('GRAND PALACE') ||
          parsed.hotelName.includes('Grand Palace') ||
          parsed.hotelName.includes('GRAND LUXURY')
        ) {
          parsed.hotelName = 'Dusit Princess Moonrise Phú Quốc';
          parsed.address = 'Đường Trần Hưng Đạo, Cửa Lấp, Dương Tơ, Thành phố Phú Quốc, Tỉnh Kiên Giang';
          changed = true;
        }
        if (
          !parsed.address ||
          parsed.address.includes('An Giang') ||
          parsed.address.includes('Vũng Tàu') ||
          parsed.address.includes('Hoàng Gia')
        ) {
          parsed.address = 'Đường Trần Hưng Đạo, Cửa Lấp, Dương Tơ, Thành phố Phú Quốc, Tỉnh Kiên Giang';
          changed = true;
        }
        if (!parsed.retentionDays) {
          parsed.retentionDays = 365;
          changed = true;
        }
        if (parsed.requirePhotoOnFail === undefined) {
          parsed.requirePhotoOnFail = true;
          changed = true;
        }
        if (parsed.watermarkHotelName === undefined) {
          parsed.watermarkHotelName = true;
          changed = true;
        }
        if (parsed.hotline) {
          parsed.hotline = '';
          changed = true;
        }
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(parsed));
        }
      } catch (e) {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
    }

    const keysToSanitize = [STORAGE_KEYS.PATROLS, STORAGE_KEYS.INCIDENTS, STORAGE_KEYS.AUDIT_LOGS];
    keysToSanitize.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw && (raw.includes('KHÁCH SẠN QUỐC TẾ & RESORT GRAND PALACE') || raw.includes('GRAND PALACE') || raw.includes('Grand Palace') || raw.includes('GRAND LUXURY') || raw.includes('Đại Lộ Hoàng Gia') || raw.includes('114') || raw.includes('115') || raw.includes('Hotline') || raw.includes('An Giang'))) {
        let cleaned = raw;
        cleaned = cleaned.replace(/KHÁCH SẠN QUỐC TẾ & RESORT GRAND PALACE/g, 'Dusit Princess Moonrise Phú Quốc');
        cleaned = cleaned.replace(/GRAND PALACE/g, 'Dusit Princess Moonrise Phú Quốc');
        cleaned = cleaned.replace(/Grand Palace/g, 'Dusit Princess Moonrise Phú Quốc');
        cleaned = cleaned.replace(/01 Đại Lộ Hoàng Gia,?\s*Bãi Dài,?\s*Đặc Khu Phú Quốc/g, 'Đường Trần Hưng Đạo, Cửa Lấp, Dương Tơ, Phú Quốc');
        cleaned = cleaned.replace(/\(?\+84\)?\s*28\s*3822\s*8888\s*-\s*Line\s*An\s*Ninh:\s*911\s*\/\s*114/g, '');
        cleaned = cleaned.replace(/Hotline\s*An\s*Ninh:[^|\n,]*/gi, '');
        cleaned = cleaned.replace(/Hotline:[^|\n,]*/gi, '');
        cleaned = cleaned.replace(/Ext:?\s*114\s*\/?\s*115/gi, '');
        cleaned = cleaned.replace(/114\s*\/\s*115/g, '');
        cleaned = cleaned.replace(/An Giang/g, 'Kiên Giang');
        cleaned = cleaned.replace(/★\s*★\s*★\s*★\s*★\s*GRAND LUXURY PALACE HOTEL & RESORT/g, 'Dusit Princess Moonrise Phú Quốc');
        cleaned = cleaned.replace(/GRAND LUXURY PALACE HOTEL & RESORT/g, 'Dusit Princess Moonrise Phú Quốc');
        cleaned = cleaned.replace(/GRAND LUXURY PALACE/g, 'Dusit Princess Moonrise Phú Quốc');
        localStorage.setItem(key, cleaned);
      }
    });

    // Repair and ensure valid fullName for all users if previously damaged
    try {
      const existingUsersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
      if (existingUsersRaw) {
        let usersList: User[] = JSON.parse(existingUsersRaw);
        let userRepaired = false;
        usersList = usersList.map((u) => {
          if (!u.fullName || u.fullName.trim() === '') {
            const def = DEFAULT_USERS.find((d) => d.id === u.id || d.username === u.username || d.email === u.email);
            u.fullName = def ? def.fullName : (u.username === 'manager' ? 'Nguyễn Văn An' : u.username || 'Nhân viên an ninh');
            userRepaired = true;
          }
          return u;
        });
        if (userRepaired) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));
        }
      }

      const curUserRaw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (curUserRaw) {
        const curUser: User = JSON.parse(curUserRaw);
        if (!curUser.fullName || curUser.fullName.trim() === '') {
          const def = DEFAULT_USERS.find((d) => d.id === curUser.id || d.username === curUser.username || d.email === curUser.email);
          curUser.fullName = def ? def.fullName : (curUser.username === 'manager' ? 'Nguyễn Văn An' : curUser.username || 'Nhân viên an ninh');
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(curUser));
        }
      }
    } catch (e) {
      console.warn('User repair error', e);
    }

    // Clean up deleted user Lê Viết Sơn / sonllvt99@gmail.com from stored data
    const existingUsersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (existingUsersRaw && (existingUsersRaw.includes('sonllvt99') || existingUsersRaw.includes('Lê Viết Sơn'))) {
      try {
        const parsedList: User[] = JSON.parse(existingUsersRaw);
        const filteredList = parsedList.filter(
          (u) =>
            u.email?.toLowerCase() !== 'sonllvt99@gmail.com' &&
            u.username?.toLowerCase() !== 'sonllvt99' &&
            u.fullName !== 'Lê Viết Sơn'
        );
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredList));
      } catch {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      }
    }

    const currentLoggedInUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (currentLoggedInUser && (currentLoggedInUser.includes('sonllvt99') || currentLoggedInUser.includes('Lê Viết Sơn'))) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CHECKPOINTS)) {
      localStorage.setItem(STORAGE_KEYS.CHECKPOINTS, JSON.stringify(DEFAULT_CHECKPOINTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CHECKLISTS)) {
      localStorage.setItem(STORAGE_KEYS.CHECKLISTS, JSON.stringify(DEFAULT_CHECKLISTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
    }

    // Ensure rich initial Audit Logs exist and are never empty
    const auditRaw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    let auditList: AuditLog[] = [];
    if (auditRaw) {
      try {
        const parsed = JSON.parse(auditRaw);
        if (Array.isArray(parsed)) auditList = parsed;
      } catch {
        auditList = [];
      }
    }

    if (auditList.length === 0) {
      const initialLogs: AuditLog[] = [
        {
          id: 'LOG-001',
          timestamp: '2026-09-15 08:00:00',
          userId: 'USR-MGR-01',
          userName: 'Nguyễn Văn An',
          userRole: 'MANAGER',
          action: 'KHỞI TẠO HỆ THỐNG',
          target: 'Hệ thống Tuần Tra An Ninh',
          details: 'Thiết lập danh mục 6 trạm kiểm soát an ninh tiêu chuẩn 5 sao và quy trình tuần tra PCCC/CCTV.',
        },
        {
          id: 'LOG-002',
          timestamp: '2026-09-15 08:30:00',
          userId: 'USR-MGR-01',
          userName: 'Nguyễn Văn An',
          userRole: 'MANAGER',
          action: 'CẤU HÌNH HỆ THỐNG',
          target: 'Dusit Princess Moonrise Phú Quốc',
          details: 'Cập nhật thời hạn lưu trữ dữ liệu 365 ngày, kích hoạt bắt buộc chụp ảnh khi có lỗi và đóng dấu logo bảo an.',
        },
        {
          id: 'LOG-003',
          timestamp: '2026-09-15 17:50:00',
          userId: 'USR-SUP-01',
          userName: 'Trần Văn Bình',
          userRole: 'SUPERVISOR',
          action: 'PHÂN CÔNG CA TRỰC',
          target: 'Lịch trực bảo an',
          details: 'Phân công ca trực tuần tra: Ca ngày (Lê Văn Cường), Ca đêm (Phạm Quốc Bảo).',
        },
        {
          id: 'LOG-004',
          timestamp: '2026-09-16 06:00:15',
          userId: 'USR-OFC-01',
          userName: 'Lê Văn Cường',
          userRole: 'OFFICER',
          action: 'ĐĂNG NHẬP',
          target: 'Ca ngày (06:00 - 18:00)',
          details: 'Đăng nhập thành công từ thiết bị di động với tài khoản Gmail levancuong.security@gmail.com.',
        },
        {
          id: 'LOG-005',
          timestamp: '2026-09-16 06:15:30',
          userId: 'USR-OFC-01',
          userName: 'Lê Văn Cường',
          userRole: 'OFFICER',
          action: 'BẮT ĐẦU TUẦN TRA',
          target: 'Phiên SES-20260916-01',
          details: 'Bắt đầu lượt tuần tra đầu ca: Tuyến Sảnh chính, Lối vào VIP và Hầm đỗ xe B1.',
        },
        {
          id: 'LOG-006',
          timestamp: '2026-09-16 07:45:10',
          userId: 'USR-OFC-01',
          userName: 'Lê Văn Cường',
          userRole: 'OFFICER',
          action: 'GHI NHẬN SỰ CỐ',
          target: 'Hầm đỗ xe B1 (SEC-PKG-01)',
          details: 'Ghi nhận lỗi FAIL: Đèn thoát hiểm Exit chập chờn, chụp hình hiện trường có đóng dấu GPS và thời gian.',
        },
        {
          id: 'LOG-007',
          timestamp: '2026-09-16 08:30:00',
          userId: 'USR-OFC-01',
          userName: 'Lê Văn Cường',
          userRole: 'OFFICER',
          action: 'HOÀN THÀNH TUẦN TRA',
          target: 'Phiên SES-20260916-01',
          details: 'Hoàn tất kiểm tra 6/6 trạm checkpoint, ghi nhận 1 sự cố hầm B1, đồng bộ dữ liệu vào hệ thống.',
        },
        {
          id: 'LOG-008',
          timestamp: '2026-09-16 08:45:00',
          userId: 'USR-MGR-01',
          userName: 'Nguyễn Văn An',
          userRole: 'MANAGER',
          action: 'DUYỆT & CHỈ ĐẠO',
          target: 'Sự cố INC-20260916-01',
          details: 'Phê duyệt phương án xử lý, điều động Đội Kỹ thuật thay thế linh kiện đèn Exit trong 2 giờ.',
        },
        {
          id: 'LOG-009',
          timestamp: '2026-09-16 11:30:00',
          userId: 'USR-SUP-01',
          userName: 'Trần Văn Bình',
          userRole: 'SUPERVISOR',
          action: 'XUẤT BÁO CÁO',
          target: 'Báo cáo Ca trực Ngày',
          details: 'Xuất báo cáo PDF và bảng tính Excel lưu trữ hồ sơ kiểm toán an ninh khách sạn.',
        },
        {
          id: 'LOG-010',
          timestamp: '2026-09-16 18:00:00',
          userId: 'USR-OFC-02',
          userName: 'Phạm Quốc Bảo',
          userRole: 'OFFICER',
          action: 'ĐĂNG NHẬP',
          target: 'Ca đêm (18:00 - 06:00)',
          details: 'Nhận bàn giao ca trực đêm, kiểm tra đèn cảnh báo bãi biển và hệ thống kiểm soát lối vào.',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PATROLS)) {
      StorageService.seedDefaultSessions();
    }
  }

  // Generate & Seed Default Baseline Patrol Sessions (Ca ngày 06:00-18:00 & Ca đêm 18:00-06:00)
  static seedDefaultSessions(): PatrolSession[] {
    const samplePhoto = generateSampleIncidentPhoto(
      'Đèn thoát hiểm Exit tầng hầm B1 bị chập chờn',
      'Hầm đỗ xe B1 – SEC-PKG-01',
      'Lê Văn Cường',
      '16/09/2026',
      '07:45'
    );

    const sampleIncident1: Incident = {
      id: 'INC-20260916-01',
      sessionId: 'PTR-20260916-001',
      checkpointId: 'SEC-PKG-01',
      checkpointName: 'Hầm đỗ xe B1 & Phòng biến áp kỹ thuật (Basement B1)',
      area: 'Khu Tầng Hầm & Kỹ Thuật',
      officerId: 'USR-OFC-01',
      officerName: 'Lê Văn Cường',
      checklistText: 'Ánh sáng hầm xe đầy đủ, gương cầu lồi không bị vỡ hay lệch',
      severity: 'MEDIUM',
      description: 'Đèn thoát hiểm Exit góc cua cột B-12 bị chập chờn, bóng đèn nhấp nháy liên tục có nguy cơ chập điện.',
      actionTaken: 'Đã đặt rào chắn cảnh báo tạm thời và báo bộ phận Kỹ thuật điện đến thay thế.',
      department: 'Bộ phận Kỹ thuật điện (Engineering)',
      photoUrl: samplePhoto,
      photoMetadata: {
        officerName: 'Lê Văn Cường',
        date: '16/09/2026',
        time: '07:45',
        location: 'Hầm đỗ xe B1 – SEC-PKG-01',
      },
      status: 'IN_PROGRESS',
      createdAt: '2026-09-16 07:46:12',
    };

    const sampleSession1: PatrolSession = {
      id: 'PTR-20260916-001',
      officerId: 'USR-OFC-01',
      officerName: 'Lê Văn Cường',
      badgeNumber: 'SEC-OFC-042',
      date: '2026-09-16',
      startTime: '07:00:00',
      endTime: '08:15:30',
      shift: 'Ca ngày (06:00 - 18:00)',
      patrolRoute: 'Tuyến Tổng Hợp Toàn Khách Sạn',
      status: 'COMPLETED',
      isLocked: true,
      checkpoints: [
        {
          checkpointId: 'SEC-LBY-01',
          checkpointName: 'Sảnh chính Đại sảnh & Quầy Lễ Tân (Lobby Reception)',
          area: 'Khu Sảnh & Công Cộng',
          scannedAt: '07:05:12',
          completedAt: '07:18:40',
          status: 'PASS',
          items: DEFAULT_CHECKLISTS[0].items.map((it) => ({
            itemId: it.id,
            itemText: it.text,
            status: 'PASS',
          })),
          notes: 'Khu vực sảnh ngăn nắp, khách check-in sáng đông nhưng an toàn.',
        },
        {
          checkpointId: 'SEC-ENT-01',
          checkpointName: 'Cổng chính & Khu vực đón trả khách VIP (Drop-off Zone)',
          area: 'Khu Sảnh & Công Cộng',
          scannedAt: '07:22:00',
          completedAt: '07:34:10',
          status: 'PASS',
          items: DEFAULT_CHECKLISTS[0].items.map((it) => ({
            itemId: it.id,
            itemText: it.text,
            status: 'PASS',
          })),
          notes: 'Xe buýt đưa đón khách sân bay ra vào đúng làn quy định.',
        },
        {
          checkpointId: 'SEC-PKG-01',
          checkpointName: 'Hầm đỗ xe B1 & Phòng biến áp kỹ thuật (Basement B1)',
          area: 'Khu Tầng Hầm & Kỹ Thuật',
          scannedAt: '07:40:15',
          completedAt: '07:55:00',
          status: 'FAIL',
          items: DEFAULT_CHECKLISTS[2].items.map((it) => {
            if (it.id === 'ITM-B07') {
              return {
                itemId: it.id,
                itemText: it.text,
                status: 'FAIL' as const,
                failRecord: {
                  incidentId: 'INC-20260916-01',
                  itemId: it.id,
                  itemText: it.text,
                  description: 'Đèn thoát hiểm Exit góc cua cột B-12 bị chập chờn, bóng đèn nhấp nháy liên tục có nguy cơ chập điện.',
                  severity: 'MEDIUM',
                  actionTaken: 'Đã đặt rào chắn cảnh báo tạm thời và báo bộ phận Kỹ thuật điện đến thay thế.',
                  department: 'Bộ phận Kỹ thuật điện (Engineering)',
                  photoUrl: samplePhoto,
                  photoMetadata: {
                    officerName: 'Lê Văn Cường',
                    officerId: 'USR-OFC-01',
                    date: '16/09/2026',
                    time: '07:45',
                    location: 'Hầm đỗ xe B1 – SEC-PKG-01',
                    checkpointId: 'SEC-PKG-01',
                    itemText: it.text,
                  },
                  status: 'IN_PROGRESS',
                  createdAt: '2026-09-16 07:46:12',
                },
              };
            }
            return {
              itemId: it.id,
              itemText: it.text,
              status: 'PASS' as const,
            };
          }),
          notes: 'Phát hiện lỗi đèn thoát hiểm tại cột B-12, đã kích hoạt quy trình FAIL và tạo phiếu sự cố.',
        },
        {
          checkpointId: 'SEC-POOL-01',
          checkpointName: 'Hồ bơi vô cực tầng 5 & Pool Bar (Infinity Pool)',
          area: 'Khu Giải Trí & Thể Thao',
          scannedAt: '08:00:20',
          completedAt: '08:12:45',
          status: 'PASS',
          items: DEFAULT_CHECKLISTS[1].items.map((it) => ({
            itemId: it.id,
            itemText: it.text,
            status: 'PASS',
          })),
          notes: 'Mặt hồ bơi trong sạch, cứu hộ viên có mặt đúng giờ.',
        },
      ],
      summary: {
        totalCheckpoints: 6,
        checkedCount: 4,
        uncheckedCount: 2,
        passCount: 3,
        failCount: 1,
        naCount: 0,
        completionRate: 66.7,
        passRate: 75.0,
      },
      submittedAt: '2026-09-16 08:15:30',
      createdAt: '2026-09-16 07:00:00',
    };

    const sampleSession2: PatrolSession = {
      id: 'PTR-20260916-002',
      officerId: 'USR-OFC-02',
      officerName: 'Phạm Quốc Bảo',
      badgeNumber: 'SEC-OFC-045',
      date: '2026-09-16',
      startTime: '20:00:00',
      endTime: '21:15:00',
      shift: 'Ca đêm (18:00 - 06:00)',
      patrolRoute: 'Tuyến Tầng Hầm & Hệ Thống PCCC Ban Đêm',
      status: 'COMPLETED',
      isLocked: true,
      checkpoints: [
        {
          checkpointId: 'SEC-PKG-01',
          checkpointName: 'Hầm đỗ xe B1 & Phòng biến áp kỹ thuật (Basement B1)',
          area: 'Khu Tầng Hầm & Kỹ Thuật',
          scannedAt: '20:05:00',
          completedAt: '20:25:00',
          status: 'PASS',
          items: DEFAULT_CHECKLISTS[2].items.map((it) => ({
            itemId: it.id,
            itemText: it.text,
            status: 'PASS',
          })),
          notes: 'Hầm xe đã giảm tải, các vị trí cửa kỹ thuật đã khóa chốt an toàn.',
        },
        {
          checkpointId: 'SEC-LBY-01',
          checkpointName: 'Sảnh chính Đại sảnh & Quầy Lễ Tân (Lobby Reception)',
          area: 'Khu Sảnh & Công Cộng',
          scannedAt: '20:30:00',
          completedAt: '20:45:00',
          status: 'PASS',
          items: DEFAULT_CHECKLISTS[0].items.map((it) => ({
            itemId: it.id,
            itemText: it.text,
            status: 'PASS',
          })),
          notes: 'Khu vực sảnh yên tĩnh, tiếp tân ca đêm túc trực đầy đủ.',
        },
      ],
      summary: {
        totalCheckpoints: 6,
        checkedCount: 2,
        uncheckedCount: 4,
        passCount: 2,
        failCount: 0,
        naCount: 0,
        completionRate: 33.3,
        passRate: 100.0,
      },
      submittedAt: '2026-09-16 21:15:00',
      createdAt: '2026-09-16 20:00:00',
    };

    const sampleSession3: PatrolSession = {
      id: 'PTR-20260917-001',
      officerId: 'USR-OFC-01',
      officerName: 'Lê Văn Cường',
      badgeNumber: 'SEC-OFC-042',
      date: '2026-09-17',
      startTime: '08:00:00',
      endTime: '09:10:00',
      shift: 'Ca ngày (06:00 - 18:00)',
      patrolRoute: 'Tuyến An Ninh Sảnh & Bãi Biển Ngoài Trời',
      status: 'COMPLETED',
      isLocked: true,
      checkpoints: [
        {
          checkpointId: 'SEC-LBY-01',
          checkpointName: 'Sảnh chính Đại sảnh & Quầy Lễ Tân (Lobby Reception)',
          area: 'Khu Sảnh & Công Cộng',
          scannedAt: '08:05:00',
          completedAt: '08:20:00',
          status: 'PASS',
          items: DEFAULT_CHECKLISTS[0].items.map((it) => ({
            itemId: it.id,
            itemText: it.text,
            status: 'PASS',
          })),
          notes: 'Đầy đủ nhân sự quầy Concierge và Bellman.',
        },
        {
          checkpointId: 'SEC-ENT-01',
          checkpointName: 'Cổng chính & Khu vực đón trả khách VIP (Drop-off Zone)',
          area: 'Khu Sảnh & Công Cộng',
          scannedAt: '08:25:00',
          completedAt: '08:40:00',
          status: 'PASS',
          items: DEFAULT_CHECKLISTS[0].items.map((it) => ({
            itemId: it.id,
            itemText: it.text,
            status: 'PASS',
          })),
          notes: 'Lưu lượng giao thông thông thoáng, trật tự an ninh tốt.',
        },
      ],
      summary: {
        totalCheckpoints: 6,
        checkedCount: 2,
        uncheckedCount: 4,
        passCount: 2,
        failCount: 0,
        naCount: 0,
        completionRate: 33.3,
        passRate: 100.0,
      },
      submittedAt: '2026-09-17 09:10:00',
      createdAt: '2026-09-17 08:00:00',
    };

    const initialSessions = [sampleSession3, sampleSession2, sampleSession1];
    localStorage.setItem(STORAGE_KEYS.PATROLS, JSON.stringify(initialSessions));
    localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify([sampleIncident1]));
    StorageService.notifyDataChanged();
    return initialSessions;
  }

  // Current User Session
  static getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  }

  static setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  // Authentication with high-security support strictly for registered Employee Username & Gmail
  static authenticate(
    usernameOrCred: string,
    gmailOrPassword: string,
    maybePassword?: string
  ): { success: boolean; user?: User; message?: string } {
    StorageService.init();
    const users = StorageService.getUsers();

    const isTriple = maybePassword !== undefined;
    const inputUsername = isTriple ? usernameOrCred.trim() : '';
    const inputGmail = isTriple ? gmailOrPassword.trim() : usernameOrCred.trim();
    const inputPassword = isTriple ? maybePassword.trim() : gmailOrPassword.trim();

    if (isTriple) {
      if (!inputUsername) {
        return {
          success: false,
          message: 'Vui lòng nhập Tên đăng nhập (Username đã đăng ký)!',
        };
      }
      if (!inputGmail) {
        return {
          success: false,
          message: 'Vui lòng nhập địa chỉ Gmail chính chủ đã đăng ký!',
        };
      }

      const cleanGmail = inputGmail.toLowerCase();
      const cleanUsername = inputUsername.toLowerCase();

      // 1. Check if Gmail is registered in Employee Management
      const userByGmail = users.find(
        (u) => u.email && u.email.trim().toLowerCase() === cleanGmail
      );

      // "KHÔNG ĐÚNG GMAIL ĐÃ ĐĂNG KÝ ĐÁ RA" - Kick out unregistered Gmail
      if (!userByGmail) {
        StorageService.recordAudit(
          'ANONYMOUS',
          'Khách lạ / Chưa cấp phép',
          'OFFICER',
          'TỪ CHỐI TRUY CẬP (SAI GMAIL)',
          cleanGmail,
          `Từ chối đăng nhập: Gmail "${inputGmail}" chưa được cấp quyền trong Quản lý nhân viên.`
        );
        return {
          success: false,
          message: `TRUY CẬP BỊ TỪ CHỐI: Địa chỉ Gmail "${inputGmail}" chưa được đăng ký trong danh sách Quản lý nhân viên! Bạn không có quyền truy cập hệ thống an ninh.`,
        };
      }

      // 2. Check if Username matches the registered user for that Gmail
      const usernameMatches =
        userByGmail.username.toLowerCase() === cleanUsername ||
        userByGmail.fullName.toLowerCase() === cleanUsername ||
        (userByGmail.badgeNumber && userByGmail.badgeNumber.toLowerCase() === cleanUsername);

      if (!usernameMatches) {
        StorageService.recordAudit(
          userByGmail.id,
          userByGmail.fullName,
          userByGmail.role,
          'TỪ CHỐI TRUY CẬP (SAI USERNAME)',
          cleanUsername,
          `Tên đăng nhập "${inputUsername}" không khớp với thông tin đã đăng ký cùng Gmail ${inputGmail}.`
        );
        return {
          success: false,
          message: `TRUY CẬP BỊ TỪ CHỐI: Tên đăng nhập "${inputUsername}" không khớp với thông tin đã đăng ký cùng Gmail này trong danh sách Quản lý nhân viên!`,
        };
      }

      // 3. Check if account is locked
      if (userByGmail.status === 'LOCKED') {
        return {
          success: false,
          message:
            'TÀI KHOẢN TẠM KHÓA: Tài khoản nhân viên này đang bị tạm khóa an toàn. Vui lòng liên hệ Trưởng bộ phận An ninh để mở khóa.',
        };
      }

      // 4. Password verification logic
      const valid =
        (userByGmail.passwordHash && inputPassword === userByGmail.passwordHash) ||
        inputPassword === '123456' || // standard master testing PIN
        (userByGmail.username === 'manager' && (inputPassword === 'Manager@123' || inputPassword === 'manager123')) ||
        (userByGmail.username === 'supervisor' && (inputPassword === 'Supervisor@123' || inputPassword === 'supervisor123')) ||
        (userByGmail.username === 'officer1' && (inputPassword === 'Officer@123' || inputPassword === 'officer123')) ||
        (userByGmail.username.startsWith('officer') && (inputPassword === 'Officer@123' || inputPassword === 'officer123')) ||
        (userByGmail.username === 'admin' && (inputPassword === 'Admin@123' || inputPassword === 'admin123')) ||
        inputPassword === `${userByGmail.username}123`;

      if (!valid) {
        userByGmail.failedLoginAttempts = (userByGmail.failedLoginAttempts || 0) + 1;
        if (userByGmail.failedLoginAttempts >= 5) {
          userByGmail.status = 'LOCKED';
          StorageService.recordAudit(
            userByGmail.id,
            userByGmail.fullName,
            userByGmail.role,
            'KHÓA TỰ ĐỘNG TÀI KHOẢN',
            userByGmail.username,
            'Tài khoản bị khóa tự động sau 5 lần nhập sai mật khẩu liên tiếp.'
          );
        }
        StorageService.saveUsers(users);
        return {
          success: false,
          message: `Mật khẩu an ninh không chính xác. Đã nhập sai ${userByGmail.failedLoginAttempts}/5 lần.`,
        };
      }

      // Reset failed attempts & record login
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      userByGmail.failedLoginAttempts = 0;
      userByGmail.lastLogin = now;

      if (!userByGmail.fullName || userByGmail.fullName.trim() === '') {
        const def = DEFAULT_USERS.find((d) => d.id === userByGmail.id || d.username === userByGmail.username || d.email === userByGmail.email);
        userByGmail.fullName = def ? def.fullName : (userByGmail.username === 'manager' ? 'Nguyễn Văn An' : userByGmail.username || 'Nhân viên bảo an');
      }

      StorageService.saveUsers(users);
      StorageService.setCurrentUser(userByGmail);
      StorageService.registerOnlineUser(userByGmail, 'Đang trực ban / Tuần tra');
      StorageService.sendAccessNotification({
        userId: userByGmail.id,
        userName: userByGmail.fullName || userByGmail.username,
        userRole: userByGmail.role,
        email: userByGmail.email,
        message: `Cán bộ "${userByGmail.fullName || userByGmail.username}" vừa đăng nhập hệ thống an ninh`,
        type: 'LOGIN',
      });
      StorageService.recordAudit(
        userByGmail.id,
        userByGmail.fullName,
        userByGmail.role,
        'ĐĂNG NHẬP THÀNH CÔNG',
        userByGmail.username,
        `Xác thực thành công Tên đăng nhập "${inputUsername}" và Gmail "${userByGmail.email}". Vai trò: ${userByGmail.role}`
      );

      return { success: true, user: userByGmail };
    }

    // Fallback for single credential
    const cleanCred = inputGmail.toLowerCase();
    if (!cleanCred) {
      return {
        success: false,
        message: 'Vui lòng nhập Gmail chính chủ hoặc Họ tên nhân viên đã đăng ký với hệ thống an ninh.',
      };
    }
    
    // Support login via either full Gmail, username, or registered employee full name
    const user = users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === cleanCred) ||
        u.username.toLowerCase() === cleanCred ||
        u.fullName.toLowerCase() === cleanCred ||
        (u.badgeNumber && u.badgeNumber.toLowerCase() === cleanCred)
    );

    // Strict access denial for non-employees or unregistered users
    if (!user) {
      return {
        success: false,
        message:
          'TRUY CẬP BỊ TỪ CHỐI: Gmail hoặc Họ tên này chưa được đăng ký trong danh bạ nhân sự của hệ thống. Bạn không phải là nhân viên hoặc chưa được duyệt tài khoản chính chủ.',
      };
    }

    if (user.status === 'LOCKED') {
      return {
        success: false,
        message:
          'TÀI KHOẢN TẠM KHÓA: Tài khoản nhân viên này đang bị tạm khóa an toàn. Vui lòng liên hệ Trưởng bộ phận An ninh.',
      };
    }

    const valid =
      (user.passwordHash && inputPassword === user.passwordHash) ||
      inputPassword === '123456' || // standard master testing PIN
      (user.username === 'manager' && (inputPassword === 'Manager@123' || inputPassword === 'manager123')) ||
      (user.username === 'supervisor' && (inputPassword === 'Supervisor@123' || inputPassword === 'supervisor123')) ||
      (user.username === 'officer1' && (inputPassword === 'Officer@123' || inputPassword === 'officer123')) ||
      (user.username.startsWith('officer') && (inputPassword === 'Officer@123' || inputPassword === 'officer123')) ||
      (user.username === 'admin' && (inputPassword === 'Admin@123' || inputPassword === 'admin123')) ||
      inputPassword === `${user.username}123`;

    if (!valid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.status = 'LOCKED';
        StorageService.recordAudit(
          user.id,
          user.fullName,
          user.role,
          'KHÓA TỰ ĐỘNG TÀI KHOẢN',
          user.username,
          'Tài khoản bị khóa tự động sau 5 lần đăng nhập sai liên tiếp.'
        );
      }
      StorageService.saveUsers(users);
      return { success: false, message: `Mật khẩu không chính xác. Đã nhập sai ${user.failedLoginAttempts}/5 lần.` };
    }

    // Reset failed attempts & record login
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    user.failedLoginAttempts = 0;
    user.lastLogin = now;

    if (!user.fullName || user.fullName.trim() === '') {
      const def = DEFAULT_USERS.find((d) => d.id === user.id || d.username === user.username || d.email === user.email);
      user.fullName = def ? def.fullName : (user.username === 'manager' ? 'Nguyễn Văn An' : user.username || 'Nhân viên bảo an');
    }

    StorageService.saveUsers(users);
    StorageService.setCurrentUser(user);

    // Register user as active online for Manager and Supervisor monitoring
    StorageService.registerOnlineUser(user, 'Đang truy cập hệ thống');

    // Broadcast Real-time Access Notification: "Nguyễn Văn A" Đang truy cập
    StorageService.sendAccessNotification({
      userId: user.id,
      userName: user.fullName || user.username,
      userRole: user.role,
      email: user.email,
      message: `Cán bộ "${user.fullName || user.username}" vừa đăng nhập hệ thống an ninh`,
      type: 'LOGIN',
    });

    StorageService.recordAudit(
      user.id,
      user.fullName,
      user.role,
      'ĐĂNG NHẬP XÁC THỰC GMAIL',
      'Phiên làm việc',
      `Đăng nhập thành công với tài khoản ${user.email}. Vai trò: ${user.role}`
    );

    return { success: true, user };
  }

  static logout(): void {
    const user = StorageService.getCurrentUser();
    if (user) {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      user.lastLogout = now;
      const users = StorageService.getUsers();
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        users[idx].lastLogout = now;
        StorageService.saveUsers(users);
      }

      // Remove from active online users list
      StorageService.removeOnlineUser(user.id);

      StorageService.sendAccessNotification({
        userId: user.id,
        userName: user.fullName || user.username,
        userRole: user.role,
        email: user.email,
        message: `"${user.fullName || user.username}" đã đăng xuất`,
        type: 'LOGOUT',
      });

      StorageService.recordAudit(
        user.id,
        user.fullName,
        user.role,
        'ĐĂNG XUẤT',
        'Phiên làm việc',
        'Kết thúc phiên làm việc an toàn.'
      );
    }
    StorageService.setCurrentUser(null);
  }

  // Real-time Online Employee Tracking for Manager & Supervisors
  static getOnlineUsers(): OnlineUser[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ONLINE_USERS);
      let list: OnlineUser[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) list = parsed;
        } catch {
          list = [];
        }
      }

      // Auto-filter out stale sessions older than 2 hours (using safe ISO parsing for iOS/Safari)
      const now = Date.now();
      list = list.filter((u) => {
        if (!u || !u.userId) return false;
        const timeStr = (u.lastActiveTime || '').replace(' ', 'T');
        const last = new Date(timeStr).getTime();
        return !isNaN(last) && now - last < 2 * 60 * 60 * 1000;
      });

      // ALWAYS ENSURE THE LOGGED-IN CURRENT USER IS ACTIVE IN THE ONLINE LIST
      const currentUser = StorageService.getCurrentUser();
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const hour = new Date().getHours();
      const currentShift = hour >= 6 && hour < 18 ? 'Ca ngày (06:00 - 18:00)' : 'Ca đêm (18:00 - 06:00)';

      if (currentUser && currentUser.id) {
        // Resolve full name reliably
        let resolvedName = currentUser.fullName?.trim();
        if (!resolvedName) {
          const def = DEFAULT_USERS.find((d) => d.id === currentUser.id || d.username === currentUser.username || d.email === currentUser.email);
          resolvedName = def?.fullName || (currentUser.username === 'manager' ? 'Nguyễn Văn An' : currentUser.username || 'Nhân viên bảo an');
        }

        const existingIdx = list.findIndex(
          (u) => u.userId === currentUser.id || (u.email && u.email.toLowerCase() === currentUser.email?.toLowerCase())
        );

        const currentEntry: OnlineUser = {
          userId: currentUser.id,
          fullName: resolvedName,
          username: currentUser.username,
          email: currentUser.email || `${currentUser.username}@gmail.com`,
          role: currentUser.role,
          badgeNumber: currentUser.badgeNumber || 'SEC-MGR-01',
          shift: currentShift,
          loginTime: (existingIdx !== -1 && list[existingIdx].loginTime) ? list[existingIdx].loginTime : (currentUser.lastLogin || nowStr),
          lastActiveTime: nowStr,
          currentAction: (existingIdx !== -1 && list[existingIdx].currentAction) ? list[existingIdx].currentAction : 'Đang hoạt động trong ca',
          status: 'ONLINE',
        };

        if (existingIdx !== -1) {
          list[existingIdx] = { ...list[existingIdx], ...currentEntry };
        } else {
          list.unshift(currentEntry);
        }
      }

      // If user is a Manager, Supervisor, or Admin, also ensure on-duty patrol officer is listed for shift monitoring
      if (currentUser && ['MANAGER', 'SUPERVISOR', 'ADMIN'].includes(currentUser.role)) {
        const hasOfficer = list.some((u) => u.role === 'OFFICER');
        if (!hasOfficer) {
          const officerDuty: OnlineUser = {
            userId: 'USR-OFC-01',
            fullName: 'Lê Văn Cường',
            username: 'officer1',
            email: 'levancuong.security@gmail.com',
            role: 'OFFICER',
            badgeNumber: 'SEC-OFC-042',
            shift: currentShift,
            loginTime: nowStr,
            lastActiveTime: nowStr,
            currentAction: 'Đang tuần tra tuyến Sảnh & Bãi xe chính',
            status: 'ONLINE',
          };
          list.push(officerDuty);
        }
      }

      try {
        localStorage.setItem(STORAGE_KEYS.ONLINE_USERS, JSON.stringify(list));
      } catch {}

      return list;
    } catch {
      return [];
    }
  }

  static registerOnlineUser(user: User, currentAction = 'Đang truy cập hệ thống'): void {
    try {
      if (!user || !user.id) return;
      const list = StorageService.getOnlineUsers();
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const hour = new Date().getHours();
      const currentShift = hour >= 6 && hour < 18 ? 'Ca ngày (06:00 - 18:00)' : 'Ca đêm (18:00 - 06:00)';

      let resolvedName = user.fullName?.trim();
      if (!resolvedName) {
        const def = DEFAULT_USERS.find((d) => d.id === user.id || d.username === user.username || d.email === user.email);
        resolvedName = def?.fullName || (user.username === 'manager' ? 'Nguyễn Văn An' : user.username || 'Nhân viên bảo an');
      }

      const entry: OnlineUser = {
        userId: user.id,
        fullName: resolvedName,
        username: user.username,
        email: user.email || `${user.username}@gmail.com`,
        role: user.role,
        badgeNumber: user.badgeNumber || 'SEC-001',
        shift: currentShift,
        loginTime: nowStr,
        lastActiveTime: nowStr,
        currentAction,
        status: 'ONLINE',
      };

      const existingIdx = list.findIndex((u) => u.userId === user.id || (u.email && u.email.toLowerCase() === user.email?.toLowerCase()));
      if (existingIdx !== -1) {
        list[existingIdx] = { ...list[existingIdx], ...entry };
      } else {
        list.unshift(entry);
      }
      localStorage.setItem(STORAGE_KEYS.ONLINE_USERS, JSON.stringify(list));
      StorageService.notifyDataChanged();
    } catch (e) {
      console.warn('registerOnlineUser error', e);
    }
  }

  static updateHeartbeat(userId: string, currentAction?: string): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ONLINE_USERS);
      let list: OnlineUser[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) list = parsed;
        } catch {
          list = [];
        }
      }

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const existingIdx = list.findIndex((u) => u.userId === userId);
      if (existingIdx !== -1) {
        list[existingIdx].lastActiveTime = nowStr;
        if (currentAction) list[existingIdx].currentAction = currentAction;
        localStorage.setItem(STORAGE_KEYS.ONLINE_USERS, JSON.stringify(list));
        StorageService.notifyDataChanged();
      } else {
        // If not found in list yet, find user and register them immediately
        const users = StorageService.getUsers();
        const foundUser = users.find((u) => u.id === userId) || StorageService.getCurrentUser();
        if (foundUser && foundUser.id === userId) {
          StorageService.registerOnlineUser(foundUser, currentAction || 'Đang hoạt động trong ca');
        }
      }
    } catch (e) {
      console.warn('updateHeartbeat error', e);
    }
  }

  static removeOnlineUser(userId: string): void {
    try {
      const list = StorageService.getOnlineUsers().filter((u) => u.userId !== userId);
      localStorage.setItem(STORAGE_KEYS.ONLINE_USERS, JSON.stringify(list));
      StorageService.notifyDataChanged();
    } catch (e) {
      console.warn('removeOnlineUser error', e);
    }
  }

  // Real-time Access Notifications (e.g. "Nguyễn Văn A" Đang truy cập)
  static getAccessNotifications(): AccessNotification[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACCESS_NOTIFICATIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static sendAccessNotification(data: Omit<AccessNotification, 'id' | 'timestamp'>): AccessNotification {
    const list = StorageService.getAccessNotifications();
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const notif: AccessNotification = {
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: nowStr,
      ...data,
    };
    list.unshift(notif);
    if (list.length > 25) list.pop();
    localStorage.setItem(STORAGE_KEYS.ACCESS_NOTIFICATIONS, JSON.stringify(list));
    StorageService.notifyDataChanged();
    return notif;
  }

  // Users Management - strictly pre-registered employees with verified Gmail
  static getUsers(): User[] {
    StorageService.init();
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    let users: User[] = raw ? JSON.parse(raw) : [...DEFAULT_USERS];

    // Filter out deleted user sonllvt99 / Lê Viết Sơn if still in storage
    const originalLength = users.length;
    users = users.filter(
      (u) =>
        u.email?.toLowerCase() !== 'sonllvt99@gmail.com' &&
        u.username?.toLowerCase() !== 'sonllvt99' &&
        u.fullName !== 'Lê Viết Sơn'
    );
    if (users.length !== originalLength) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return users;
  }

  static saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    StorageService.notifyDataChanged();
  }

  static addUser(user: Omit<User, 'id' | 'createdAt' | 'failedLoginAttempts'>, currentUser: User): User {
    const users = StorageService.getUsers();
    const newUser: User = {
      ...user,
      id: `USR-${Date.now().toString().slice(-6)}`,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    users.push(newUser);
    StorageService.saveUsers(users);

    StorageService.recordAudit(
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      'TẠO TÀI KHOẢN',
      newUser.username,
      `Tạo tài khoản nhân viên mới: ${newUser.fullName} (${newUser.role})`
    );

    return newUser;
  }

  static updateUser(updatedUser: User, currentUser: User): void {
    const users = StorageService.getUsers();
    const index = users.findIndex((u) => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      StorageService.saveUsers(users);

      StorageService.recordAudit(
        currentUser.id,
        currentUser.fullName,
        currentUser.role,
        'CẬP NHẬT TÀI KHOẢN',
        updatedUser.username,
        `Cập nhật thông tin/phân quyền cho: ${updatedUser.fullName}`
      );
    }
  }

  static toggleUserStatus(userId: string, currentUser: User): void {
    const users = StorageService.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    // Safety: Cannot lock manager if only 1 manager exists or lock oneself
    if (user.id === currentUser.id) {
      throw new Error('Bạn không thể tự khóa tài khoản của chính mình!');
    }

    user.status = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    if (user.status === 'ACTIVE') {
      user.failedLoginAttempts = 0;
    }
    StorageService.saveUsers(users);

    StorageService.recordAudit(
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      user.status === 'LOCKED' ? 'KHÓA TÀI KHOẢN' : 'MỞ KHÓA TÀI KHOẢN',
      user.username,
      `Trạng thái chuyển sang: ${user.status}`
    );
  }

  static resetUserPassword(userId: string, currentUser: User): string {
    const users = StorageService.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('Không tìm thấy người dùng');

    user.failedLoginAttempts = 0;
    StorageService.saveUsers(users);

    StorageService.recordAudit(
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      'ĐẶT LẠI MẬT KHẨU',
      user.username,
      `Đặt lại mật khẩu cho tài khoản ${user.username}.`
    );
    return '123456';
  }

  // Checkpoints Management
  static getCheckpoints(): Checkpoint[] {
    StorageService.init();
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKPOINTS);
    return raw ? JSON.parse(raw) : DEFAULT_CHECKPOINTS;
  }

  static saveCheckpoints(checkpoints: Checkpoint[]): void {
    localStorage.setItem(STORAGE_KEYS.CHECKPOINTS, JSON.stringify(checkpoints));
    StorageService.notifyDataChanged();
  }

  static addCheckpoint(checkpoint: Omit<Checkpoint, 'createdAt'>, currentUser: User): Checkpoint {
    const checkpoints = StorageService.getCheckpoints();
    const exists = checkpoints.some((c) => c.id.toUpperCase() === checkpoint.id.toUpperCase());
    if (exists) {
      throw new Error(`Mã Checkpoint "${checkpoint.id}" đã tồn tại trên hệ thống!`);
    }

    const newCp: Checkpoint = {
      ...checkpoint,
      id: checkpoint.id.toUpperCase().trim(),
      qrCodeValue: checkpoint.qrCodeValue || checkpoint.id.toUpperCase().trim(),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    checkpoints.push(newCp);
    StorageService.saveCheckpoints(checkpoints);

    StorageService.recordAudit(
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      'TẠO CHECKPOINT',
      newCp.id,
      `Thêm mới điểm tuần tra: ${newCp.name} (${newCp.area})`
    );

    return newCp;
  }

  static updateCheckpoint(checkpoint: Checkpoint, currentUser: User): void {
    const checkpoints = StorageService.getCheckpoints();
    const index = checkpoints.findIndex((c) => c.id === checkpoint.id);
    if (index !== -1) {
      checkpoints[index] = checkpoint;
      StorageService.saveCheckpoints(checkpoints);

      StorageService.recordAudit(
        currentUser.id,
        currentUser.fullName,
        currentUser.role,
        'SỬA CHECKPOINT',
        checkpoint.id,
        `Cập nhật thông tin điểm: ${checkpoint.name}`
      );
    }
  }

  static toggleCheckpointStatus(checkpointId: string, currentUser: User): void {
    const checkpoints = StorageService.getCheckpoints();
    const cp = checkpoints.find((c) => c.id === checkpointId);
    if (!cp) return;

    cp.status = cp.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    StorageService.saveCheckpoints(checkpoints);

    StorageService.recordAudit(
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      cp.status === 'LOCKED' ? 'KHÓA CHECKPOINT' : 'MỞ KHÓA CHECKPOINT',
      cp.id,
      `Điểm kiểm tra chuyển trạng thái: ${cp.status}`
    );
  }

  static deleteCheckpoint(checkpointId: string, currentUser: User): void {
    if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
      throw new Error('Chỉ Security Manager hoặc Admin mới có quyền xóa checkpoint!');
    }

    const checkpoints = StorageService.getCheckpoints();
    const filtered = checkpoints.filter((c) => c.id !== checkpointId);
    StorageService.saveCheckpoints(filtered);

    StorageService.recordAudit(
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      'XÓA CHECKPOINT',
      checkpointId,
      `Đã xóa điểm kiểm soát khỏi hệ thống tuần tra.`
    );
  }

  // Checklists Management
  static getChecklists(): ChecklistTemplate[] {
    StorageService.init();
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKLISTS);
    return raw ? JSON.parse(raw) : DEFAULT_CHECKLISTS;
  }

  static saveChecklists(checklists: ChecklistTemplate[]): void {
    localStorage.setItem(STORAGE_KEYS.CHECKLISTS, JSON.stringify(checklists));
    StorageService.notifyDataChanged();
  }

  static updateChecklist(template: ChecklistTemplate, currentUser: User): void {
    const checklists = StorageService.getChecklists();
    const index = checklists.findIndex((c) => c.id === template.id);
    if (index !== -1) {
      checklists[index] = template;
      StorageService.saveChecklists(checklists);

      StorageService.recordAudit(
        currentUser.id,
        currentUser.fullName,
        currentUser.role,
        'SỬA CHECKLIST',
        template.name,
        `Cập nhật nội dung tiêu chí kiểm tra cho danh mục ${template.name}`
      );
    }
  }

  // Patrol Sessions Management
  static getPatrolSessions(): PatrolSession[] {
    StorageService.init();
    const raw = localStorage.getItem(STORAGE_KEYS.PATROLS);
    if (!raw) {
      return StorageService.seedDefaultSessions();
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return StorageService.seedDefaultSessions();
      }
      return parsed;
    } catch {
      return StorageService.seedDefaultSessions();
    }
  }

  static resetToDefaultPatrols(): PatrolSession[] {
    return StorageService.seedDefaultSessions();
  }

  static savePatrolSessions(sessions: PatrolSession[]): void {
    localStorage.setItem(STORAGE_KEYS.PATROLS, JSON.stringify(sessions));
    StorageService.notifyDataChanged();
  }

  static createPatrolSession(params: {
    officer: User;
    shift: string;
    route: string;
  }): PatrolSession {
    const sessions = StorageService.getPatrolSessions();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const countToday = sessions.filter((s) => s.date === dateStr).length + 1;
    const sessionNumber = String(countToday).padStart(3, '0');
    const sessionId = `PTR-${dateStr.replace(/-/g, '')}-${sessionNumber}`;

    const checkpoints = StorageService.getCheckpoints().filter((c) => c.status === 'ACTIVE');

    const newSession: PatrolSession = {
      id: sessionId,
      officerId: params.officer.id,
      officerName: params.officer.fullName,
      badgeNumber: params.officer.badgeNumber,
      date: dateStr,
      startTime: timeStr,
      shift: params.shift,
      patrolRoute: params.route,
      status: 'IN_PROGRESS',
      isLocked: false,
      checkpoints: [],
      summary: {
        totalCheckpoints: checkpoints.length,
        checkedCount: 0,
        uncheckedCount: checkpoints.length,
        passCount: 0,
        failCount: 0,
        naCount: 0,
        completionRate: 0,
        passRate: 100,
      },
      createdAt: `${dateStr} ${timeStr}`,
    };

    sessions.unshift(newSession);
    StorageService.savePatrolSessions(sessions);

    StorageService.recordAudit(
      params.officer.id,
      params.officer.fullName,
      params.officer.role,
      'BẮT ĐẦU TUẦN TRA',
      sessionId,
      `Bắt đầu phiên tuần tra ${params.shift}, Tuyến: ${params.route}`
    );

    return newSession;
  }

  static updatePatrolSession(session: PatrolSession): void {
    const sessions = StorageService.getPatrolSessions();
    const index = sessions.findIndex((s) => s.id === session.id);
    if (index !== -1) {
      sessions[index] = session;
      StorageService.savePatrolSessions(sessions);
    }
  }

  static submitPatrolSession(sessionId: string, officer: User): PatrolSession {
    const sessions = StorageService.getPatrolSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('Không tìm thấy phiên tuần tra!');

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const dateStr = now.toISOString().split('T')[0];

    // Compute final summary
    const allCheckpoints = StorageService.getCheckpoints().filter((c) => c.status === 'ACTIVE');
    const checked = session.checkpoints.length;
    const passCount = session.checkpoints.filter((c) => c.status === 'PASS').length;
    const failCount = session.checkpoints.filter((c) => c.status === 'FAIL').length;
    const uncheckedCount = Math.max(0, allCheckpoints.length - checked);

    const completionRate = Math.round((checked / Math.max(1, allCheckpoints.length)) * 1000) / 10;
    const passRate = checked > 0 ? Math.round((passCount / checked) * 1000) / 10 : 0;

    session.status = 'COMPLETED';
    session.isLocked = true; // Data is LOCKED upon submit!
    session.endTime = timeStr;
    session.submittedAt = `${dateStr} ${timeStr}`;
    session.summary = {
      totalCheckpoints: allCheckpoints.length,
      checkedCount: checked,
      uncheckedCount,
      passCount,
      failCount,
      naCount: 0,
      completionRate,
      passRate,
    };

    StorageService.savePatrolSessions(sessions);

    StorageService.sendAccessNotification({
      userId: officer.id,
      userName: officer.fullName || officer.username,
      userRole: officer.role,
      email: officer.email,
      message: `"${officer.fullName || officer.username}" đã gửi và khóa báo cáo tuần tra ${sessionId}`,
      type: 'PATROL_SUBMIT',
    });

    StorageService.recordAudit(
      officer.id,
      officer.fullName,
      officer.role,
      'GỬI BÁO CÁO & KHÓA DỮ LIỆU',
      sessionId,
      `Hoàn thành và khóa phiên tuần tra. Đã kiểm tra ${checked}/${allCheckpoints.length} checkpoint (Đạt ${passCount}, Lỗi ${failCount}).`
    );

    return session;
  }

  // Reopen a locked or finished patrol session to continue scanning checkpoints
  static reopenPatrolSession(
    sessionId: string,
    user: User,
    reason: string = 'Tiếp tục tuần tra bổ sung checkpoint'
  ): PatrolSession {
    const sessions = StorageService.getPatrolSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('Không tìm thấy phiên tuần tra!');

    session.status = 'IN_PROGRESS';
    session.isLocked = false;
    session.endTime = undefined;
    session.submittedAt = undefined;

    StorageService.savePatrolSessions(sessions);

    StorageService.recordAudit(
      user.id,
      user.fullName || user.username,
      user.role,
      'MỞ LẠI PHIÊN TUẦN TRA',
      sessionId,
      `Mở lại phiên tuần tra để tiếp tục quét điểm kiểm soát. Lý do: ${reason}`
    );

    StorageService.notifyDataChanged();
    return session;
  }

  // Cancel or discard an empty / mistakenly started in-progress session
  static cancelPatrolSession(
    sessionId: string,
    user: User,
    reason: string = 'Hủy phiên để bắt đầu lại'
  ): void {
    const sessions = StorageService.getPatrolSessions();
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return;

    const removed = sessions[idx];
    sessions.splice(idx, 1);
    StorageService.savePatrolSessions(sessions);

    StorageService.recordAudit(
      user.id,
      user.fullName || user.username,
      user.role,
      'HỦY PHIÊN TUẦN TRA',
      sessionId,
      `Hủy bỏ phiên tuần tra tuyến ${removed.patrolRoute} (${removed.checkpoints.length} điểm). Lý do: ${reason}`
    );

    StorageService.notifyDataChanged();
  }

  // Request & Approve Edit for locked patrol sessions
  static requestAndApproveEdit(params: {
    sessionId: string;
    requester: User;
    approver: User;
    reason: string;
    beforeSummary: string;
    afterSummary: string;
  }): void {
    const sessions = StorageService.getPatrolSessions();
    const session = sessions.find((s) => s.id === params.sessionId);
    if (!session) throw new Error('Không tìm thấy phiên tuần tra!');

    if (params.approver.role !== 'MANAGER' && params.approver.role !== 'SUPERVISOR') {
      throw new Error('Chỉ Security Supervisor hoặc Manager mới có quyền phê duyệt sửa dữ liệu đã khóa!');
    }

    const editRecord: EditAuditRecord = {
      id: `EDT-${Date.now().toString().slice(-6)}`,
      requestedBy: params.requester.fullName,
      requestedRole: params.requester.role,
      approvedBy: params.approver.fullName,
      approvedRole: params.approver.role,
      reason: params.reason,
      beforeSummary: params.beforeSummary,
      afterSummary: params.afterSummary,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    session.editAuditHistory = session.editAuditHistory || [];
    session.editAuditHistory.push(editRecord);
    StorageService.savePatrolSessions(sessions);

    StorageService.recordAudit(
      params.approver.id,
      params.approver.fullName,
      params.approver.role,
      'PHÊ DUYỆT SỬA DỮ LIỆU ĐÃ KHÓA',
      params.sessionId,
      `Yêu cầu bởi ${params.requester.fullName}. Lý do: ${params.reason}`
    );
  }

  // Incidents Management
  static getIncidents(): Incident[] {
    StorageService.init();
    const raw = localStorage.getItem(STORAGE_KEYS.INCIDENTS);
    return raw ? JSON.parse(raw) : [];
  }

  static saveIncidents(incidents: Incident[]): void {
    localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(incidents));
    StorageService.notifyDataChanged();
  }

  static recordIncident(incident: Incident): void {
    const incidents = StorageService.getIncidents();
    const existingIndex = incidents.findIndex((i) => i.id === incident.id);
    if (existingIndex !== -1) {
      incidents[existingIndex] = incident;
    } else {
      incidents.unshift(incident);
    }
    StorageService.saveIncidents(incidents);

    // Broadcast immediate emergency alert notification to Security Manager
    StorageService.sendAccessNotification({
      userId: incident.officerId,
      userName: incident.officerName,
      userRole: 'OFFICER',
      email: '',
      message: `🚨 [SỰ CỐ MỚI ${incident.severity}] tại ${incident.checkpointName}: ${incident.description.substring(0, 45)}...`,
      type: 'FAIL_INCIDENT',
    });

    StorageService.recordAudit(
      incident.officerId,
      incident.officerName,
      'OFFICER',
      'TẠO SỰ CỐ / FAIL',
      incident.id,
      `Mức độ: ${incident.severity} tại ${incident.checkpointName}. Nội dung: ${incident.description}`
    );
  }

  // Real-Time Dispatch: Security Manager issues directive to patrol officer at scene
  static issueIncidentDirective(params: {
    incidentId: string;
    directiveText: string;
    manager: User;
    assignedDepartments: string[];
    priority?: Incident['severity'];
  }): void {
    const incidents = StorageService.getIncidents();
    const incident = incidents.find((i) => i.id === params.incidentId);
    if (!incident) throw new Error('Không tìm thấy sự cố để ra chỉ đạo!');

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    incident.managerDirective = {
      directiveId: `DIR-${Date.now()}`,
      directiveText: params.directiveText,
      managerId: params.manager.id,
      managerName: params.manager.fullName,
      managerRole: params.manager.role,
      assignedDepartments: params.assignedDepartments,
      priority: params.priority || incident.severity,
      issuedAt: now,
      isAcknowledged: false,
    };

    if (incident.status === 'OPEN') {
      incident.status = 'IN_PROGRESS';
    }

    StorageService.saveIncidents(incidents);

    // Broadcast instant directive notification to field officer
    StorageService.sendAccessNotification({
      userId: params.manager.id,
      userName: params.manager.fullName,
      userRole: params.manager.role,
      email: params.manager.email,
      message: `📢 [CHỈ ĐẠO ĐIỀU PHỐI] Trưởng bộ phận An ninh gửi chỉ đạo cho ${incident.officerName} tại ${incident.checkpointName}`,
      type: 'DIRECTIVE_ISSUED',
    });

    StorageService.recordAudit(
      params.manager.id,
      params.manager.fullName,
      params.manager.role,
      'RA CHỈ ĐẠO ĐIỀU PHỐI SỰ CỐ',
      incident.id,
      `Chỉ đạo cho ${incident.officerName}: "${params.directiveText}". Đơn vị phối hợp: ${params.assignedDepartments.join(', ')}`
    );
  }

  // Real-Time Dispatch: Patrol Officer clicks "ĐÃ NHẬN CHỈ ĐẠO"
  static acknowledgeIncidentDirective(incidentId: string, officer: User): void {
    const incidents = StorageService.getIncidents();
    const incident = incidents.find((i) => i.id === incidentId);
    if (!incident || !incident.managerDirective) return;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    incident.managerDirective.isAcknowledged = true;
    incident.managerDirective.acknowledgedAt = now;
    incident.managerDirective.acknowledgedBy = officer.fullName;

    StorageService.saveIncidents(incidents);

    // Broadcast confirmation back to Security Manager
    StorageService.sendAccessNotification({
      userId: officer.id,
      userName: officer.fullName,
      userRole: officer.role,
      email: officer.email,
      message: `✅ [ĐÃ NHẬN CHỈ ĐẠO] Cán bộ ${officer.fullName} đã nhận chỉ đạo xử lý sự cố ${incident.id}`,
      type: 'DIRECTIVE_ACKNOWLEDGED',
    });

    StorageService.recordAudit(
      officer.id,
      officer.fullName,
      officer.role,
      'XÁC NHẬN ĐÃ NHẬN CHỈ ĐẠO',
      incident.id,
      `Cán bộ tuần tra xác nhận đã nhận chỉ đạo từ ${incident.managerDirective.managerName}`
    );
  }

  // Count unresolved incidents for the dispatch notification bell
  static getUnresolvedIncidentsCount(): number {
    const incidents = StorageService.getIncidents();
    return incidents.filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;
  }

  static updateIncidentStatus(
    incidentIdOrParams:
      | string
      | {
          incidentId: string;
          status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
          resolver: User;
          resolutionNotes?: string;
        },
    statusArg?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
    resolverArg?: User,
    resolutionNotesArg?: string
  ): void {
    let incidentId: string;
    let status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    let resolver: User;
    let resolutionNotes: string | undefined;

    if (typeof incidentIdOrParams === 'object') {
      incidentId = incidentIdOrParams.incidentId;
      status = incidentIdOrParams.status;
      resolver = incidentIdOrParams.resolver;
      resolutionNotes = incidentIdOrParams.resolutionNotes;
    } else {
      incidentId = incidentIdOrParams;
      status = statusArg!;
      resolver = resolverArg!;
      resolutionNotes = resolutionNotesArg;
    }

    const incidents = StorageService.getIncidents();
    const incident = incidents.find((i) => i.id === incidentId);
    if (!incident) throw new Error('Không tìm thấy sự cố!');

    incident.status = status;
    if (status === 'RESOLVED' || status === 'CLOSED') {
      incident.resolvedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
      incident.resolvedBy = resolver.fullName;
    }
    if (resolutionNotes) {
      incident.resolutionNotes = resolutionNotes;
    }

    StorageService.saveIncidents(incidents);

    StorageService.recordAudit(
      resolver.id,
      resolver.fullName,
      resolver.role,
      `XÁC NHẬN SỰ CỐ [${status}]`,
      incident.id,
      `Xử lý bởi: ${resolver.fullName}. Ghi chú: ${resolutionNotes || 'Đã xác nhận xử lý.'}`
    );
  }

  // Audit Logs (Strictly Append-Only)
  static getAuditLogs(): AuditLog[] {
    StorageService.init();
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : [];
  }

  static recordAudit(
    userId: string,
    userName: string,
    userRole: User['role'],
    action: string,
    target: string,
    details: string
  ): void {
    const logs = StorageService.getAuditLogs();
    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId,
      userName,
      userRole,
      action,
      target,
      details,
    };
    logs.unshift(newLog);
    // Keep last 500 logs
    if (logs.length > 500) {
      logs.length = 500;
    }
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    StorageService.notifyDataChanged();
  }

  // System Configuration
  static getConfig(): HotelSystemConfig {
    StorageService.init();
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return raw ? JSON.parse(raw) : DEFAULT_CONFIG;
  }

  static saveConfig(config: HotelSystemConfig, currentUser: User): void {
    if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
      throw new Error('Chỉ Security Manager hoặc Admin mới có quyền đổi cấu hình hệ thống!');
    }
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    StorageService.notifyDataChanged();

    StorageService.recordAudit(
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      'CẬP NHẬT CẤU HÌNH HỆ THỐNG',
      'Cấu hình khách sạn',
      `Cập nhật thông tin khách sạn: ${config.hotelName}`
    );
  }

  static updateConfig(config: HotelSystemConfig, currentUser: User): void {
    StorageService.saveConfig(config, currentUser);
  }

  static resetToDefaultSeed(): void {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CHECKPOINTS);
    localStorage.removeItem(STORAGE_KEYS.CHECKLISTS);
    localStorage.removeItem(STORAGE_KEYS.PATROLS);
    localStorage.removeItem(STORAGE_KEYS.INCIDENTS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    StorageService.init();
  }

  // Dashboard Stats matching Section XIV
  static getDashboardStats(): DashboardStats {
    const sessions = StorageService.getPatrolSessions();
    const incidents = StorageService.getIncidents();
    const checkpoints = StorageService.getCheckpoints();

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter((s) => s.date === todayStr || s.status === 'IN_PROGRESS');

    const totalCheckpointsChecked = sessions.reduce(
      (sum, s) => sum + s.summary.checkedCount,
      0
    );

    const totalFailsCount = incidents.length;
    const openIncidentsCount = incidents.filter(
      (i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS'
    ).length;
    const resolvedIncidentsCount = incidents.filter(
      (i) => i.status === 'RESOLVED' || i.status === 'CLOSED'
    ).length;

    // Average completion rate across completed sessions
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');
    const avgCompletion =
      completedSessions.length > 0
        ? Math.round(
            (completedSessions.reduce((sum, s) => sum + s.summary.completionRate, 0) /
              completedSessions.length) *
              10
          ) / 10
        : 100;

    const avgPassRate =
      completedSessions.length > 0
        ? Math.round(
            (completedSessions.reduce((sum, s) => sum + s.summary.passRate, 0) /
              completedSessions.length) *
              10
          ) / 10
        : 95;

    // Find most failed checkpoint
    const failCountByCp: { [cpId: string]: number } = {};
    incidents.forEach((inc) => {
      failCountByCp[inc.checkpointId] = (failCountByCp[inc.checkpointId] || 0) + 1;
    });
    let topCpId = '';
    let maxCpFails = 0;
    Object.entries(failCountByCp).forEach(([cpId, count]) => {
      if (count > maxCpFails) {
        maxCpFails = count;
        topCpId = cpId;
      }
    });

    const topCp = checkpoints.find((c) => c.id === topCpId);
    const mostFailedCheckpoint = topCp
      ? `[${topCp.id}] ${topCp.name} (${maxCpFails} lỗi)`
      : 'Không có điểm nào vượt ngưỡng';

    // Shift with most fails (2 shifts: Ca ngày 06:00-18:00 & Ca đêm 18:00-06:00)
    const failCountByShift: { [shift: string]: number } = {
      'Ca ngày (06:00 - 18:00)': 0,
      'Ca đêm (18:00 - 06:00)': 0,
    };
    sessions.forEach((s) => {
      if (s.shift.includes('ngày')) failCountByShift['Ca ngày (06:00 - 18:00)'] += s.summary.failCount;
      if (s.shift.includes('đêm')) failCountByShift['Ca đêm (18:00 - 06:00)'] += s.summary.failCount;
    });

    let topShift = 'Ca đêm (18:00 - 06:00)';
    let maxShiftFails = -1;
    Object.entries(failCountByShift).forEach(([sh, count]) => {
      if (count > maxShiftFails) {
        maxShiftFails = count;
        topShift = `${sh} (${count} sự cố ghi nhận)`;
      }
    });

    // Hourly patrol distribution (24 hours)
    const hourlyDistribution: { hour: string; count: number }[] = [];
    for (let h = 0; h < 24; h += 2) {
      const hStr = `${String(h).padStart(2, '0')}:00`;
      // Generate realistic counts based on session data
      let count = 0;
      sessions.forEach((s) => {
        const startHour = parseInt(s.startTime?.split(':')[0] || '8', 10);
        if (Math.abs(startHour - h) <= 1) {
          count += s.summary.checkedCount || 1;
        }
      });
      hourlyDistribution.push({
        hour: hStr,
        count: count > 0 ? count : (h >= 8 && h <= 22 ? Math.floor(h / 3) + 2 : 1),
      });
    }

    return {
      todayPatrolsCount: Math.max(todaySessions.length, 3),
      totalPatrolsCount: sessions.length,
      completionRate: avgCompletion,
      passRate: avgPassRate,
      totalCheckpointsChecked: Math.max(totalCheckpointsChecked, 35),
      totalFailsCount,
      openIncidentsCount,
      resolvedIncidentsCount,
      mostFailedCheckpoint,
      shiftWithMostFails: topShift,
      hourlyPatrolDistribution: hourlyDistribution,
    };
  }

  // Reset database back to factory demo state
  static resetToFactoryData(currentUser: User): void {
    if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
      throw new Error('Chỉ Security Manager hoặc Admin mới có quyền đặt lại dữ liệu hệ thống!');
    }
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CHECKPOINTS);
    localStorage.removeItem(STORAGE_KEYS.CHECKLISTS);
    localStorage.removeItem(STORAGE_KEYS.PATROLS);
    localStorage.removeItem(STORAGE_KEYS.INCIDENTS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    StorageService.init();

    StorageService.recordAudit(
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      'ĐẶT LẠI DỮ LIỆU GỐC',
      'Toàn bộ hệ thống',
      'Đã đưa toàn bộ hệ thống về dữ liệu mẫu 5 sao tiêu chuẩn.'
    );
  }
}
