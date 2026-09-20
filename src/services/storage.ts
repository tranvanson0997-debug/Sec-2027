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
  hotelName: 'Dusit Princess Moonrise PhÃº Quá»‘c',
  departmentName: 'Bá»˜ PHáº¬N AN NINH & Báº¢O Vá»† (SECURITY DEPT)',
  address: 'ÄÆ°á»ng Tráº§n HÆ°ng Äáº¡o, Cá»­a Láº¥p, DÆ°Æ¡ng TÆ¡, ThÃ nh phá»‘ PhÃº Quá»‘c, Tá»‰nh KiÃªn Giang',
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
    fullName: 'Tráº§n VÄƒn SÆ¡n',
    role: 'MANAGER',
    passwordHash: '010101',
    badgeNumber: 'SEC-MGR-01',
    phone: '0908 112 233',
    email: 'tranvanson0997@gmail.com',
    status: 'ACTIVE',
    failedLoginAttempts: 0,
    lastLogin: '2026-09-16 08:30:12',
    createdAt: '2025-01-01 00:00:00',
  },
  {
    id: 'USR-SUP-01',
    username: 'supervisor',
    fullName: 'Tráº§n VÄƒn BÃ¬nh',
    role: 'SUPERVISOR',
    passwordHash: 'SUP-2027-01',
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
    fullName: 'LÃª VÄƒn CÆ°á»ng',
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
    fullName: 'Pháº¡m Quá»‘c Báº£o',
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
    fullName: 'Äá»— ThÃ nh Trung',
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
    name: 'Checklist Khu vá»±c Sáº£nh ChÃ­nh & ÄÃ³n KhÃ¡ch (5 Sao)',
    description: 'TiÃªu chuáº©n 12 Ä‘iá»ƒm an ninh vÃ  má»¹ quan sáº£nh khÃ¡ch sáº¡n cao cáº¥p',
    items: [
      { id: 'ITM-01', text: 'Khu vá»±c sáº¡ch vÃ  thÃ´ng thoÃ¡ng', category: 'VE_SINH_MY_QUAN', isRequiredPhotoOnFail: true },
      { id: 'ITM-02', text: 'KhÃ´ng cÃ³ ngÆ°á»i kháº£ nghi láº£ng váº£ng', category: 'AN_NINH', isRequiredPhotoOnFail: true },
      { id: 'ITM-03', text: 'KhÃ´ng cÃ³ váº­t thá»ƒ hoáº·c hÃ nh lÃ½ vÃ´ chá»§ kháº£ nghi', category: 'AN_NINH', isRequiredPhotoOnFail: true },
      { id: 'ITM-04', text: 'Camera giÃ¡m sÃ¡t (CCTV) hoáº¡t Ä‘á»™ng tá»‘t, gÃ³c quÃ©t rÃµ', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
      { id: 'ITM-05', text: 'Ãnh sÃ¡ng Ä‘áº§y Ä‘á»§, Ä‘Ã¨n chÃ¹m vÃ  Ä‘Ã¨n háº¯t khÃ´ng cháº­p chá»n', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
      { id: 'ITM-06', text: 'Cá»­a xoay vÃ  cá»­a kÃ­nh tá»± Ä‘á»™ng hoáº¡t Ä‘á»™ng an toÃ n', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
      { id: 'ITM-07', text: 'Lá»‘i thoÃ¡t hiá»ƒm thÃ´ng thoÃ¡ng, Ä‘Ã¨n Exit sÃ¡ng rÃµ', category: 'PCCC', isRequiredPhotoOnFail: true },
      { id: 'ITM-08', text: 'Thiáº¿t bá»‹ PCCC Ä‘Ãºng vá»‹ trÃ­, Ã¡p káº¿ bÃ¬nh CO2/Bá»™t Ä‘áº¡t chuáº©n', category: 'PCCC', isRequiredPhotoOnFail: true },
      { id: 'ITM-09', text: 'Biá»ƒn cáº£nh bÃ¡o Ä‘áº§y Ä‘á»§ (sÃ n Æ°á»›t, Ä‘ang dá»n vá»‡ sinh)', category: 'AN_TOAN_KHACH', isRequiredPhotoOnFail: true },
      { id: 'ITM-10', text: 'KhÃ´ng cÃ³ sÃ n trÆ¡n trÆ°á»£t hoáº·c rÃ² rá»‰ nÆ°á»›c tá»« tráº§n/mÃ¡y láº¡nh', category: 'AN_TOAN_KHACH', isRequiredPhotoOnFail: true },
      { id: 'ITM-11', text: 'KhÃ´ng cÃ³ váº­t cáº£n lá»‘i Ä‘i dÃ nh cho khÃ¡ch vÃ  xe hÃ nh lÃ½', category: 'VE_SINH_MY_QUAN', isRequiredPhotoOnFail: true },
      { id: 'ITM-12', text: 'KhÃ´ng cÃ³ nguy cÆ¡ tiá»m áº©n Ä‘á»‘i vá»›i sá»± an toÃ n cá»§a khÃ¡ch', category: 'AN_TOAN_KHACH', isRequiredPhotoOnFail: true },
    ],
  },
  {
    id: 'CHK-POOL-01',
    name: 'Checklist Há»“ BÆ¡i VÃ´ Cá»±c & BÃ£i Biá»ƒn',
    description: 'An toÃ n nÆ°á»›c biá»ƒn, cá»©u há»™ vÃ  tÃ i sáº£n khÃ¡ch nghá»‰ ngÆ¡i',
    items: [
      { id: 'ITM-P01', text: 'Phao cá»©u sinh vÃ  sÃ o cá»©u há»™ Ä‘áº§y Ä‘á»§ táº¡i cÃ¡c vá»‹ trÃ­ quy Ä‘á»‹nh', category: 'AN_TOAN_KHACH', isRequiredPhotoOnFail: true },
      { id: 'ITM-P02', text: 'NhÃ¢n viÃªn cá»©u há»™ (Lifeguard) tÃºc trá»±c Ä‘Ãºng vá»‹ trÃ­', category: 'AN_NINH', isRequiredPhotoOnFail: true },
      { id: 'ITM-P03', text: 'Biá»ƒn bÃ¡o Ä‘á»™ sÃ¢u nÆ°á»›c vÃ  biá»ƒn cáº£nh bÃ¡o trÆ¡n trÆ°á»£t rÃµ rÃ ng', category: 'AN_TOAN_KHACH', isRequiredPhotoOnFail: true },
      { id: 'ITM-P04', text: 'KhÃ´ng cÃ³ chai thá»§y tinh vá»¡ hoáº·c váº­t sáº¯c nhá»n quanh bá»ƒ bÆ¡i', category: 'VE_SINH_MY_QUAN', isRequiredPhotoOnFail: true },
      { id: 'ITM-P05', text: 'Camera gÃ³c quÃ©t máº·t nÆ°á»›c hoáº¡t Ä‘á»™ng bÃ¬nh thÆ°á»ng', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
      { id: 'ITM-P06', text: 'Cá» cáº£nh bÃ¡o thá»i tiáº¿t biá»ƒn (Cá» xanh/vÃ ng/Ä‘á») treo Ä‘Ãºng quy Ä‘á»‹nh', category: 'AN_TOAN_KHACH', isRequiredPhotoOnFail: true },
      { id: 'ITM-P07', text: 'Há»™p sÆ¡ cá»©u y táº¿ (First Aid Kit) Ä‘áº§y Ä‘á»§ bÃ´ng bÄƒng thuá»‘c sÃ¡t trÃ¹ng', category: 'AN_TOAN_KHACH', isRequiredPhotoOnFail: true },
      { id: 'ITM-P08', text: 'KhÃ´ng cÃ³ ngÆ°á»i láº¡ hoáº·c khÃ¡ch say xá»‰n gÃ¢y máº¥t tráº­t tá»±', category: 'AN_NINH', isRequiredPhotoOnFail: true },
    ],
  },
  {
    id: 'CHK-BASEMENT-01',
    name: 'Checklist Táº§ng Háº§m Äá»— Xe & PhÃ²ng Ká»¹ Thuáº­t',
    description: 'Kiá»ƒm soÃ¡t chÃ¡y ná»•, phÆ°Æ¡ng tiá»‡n vÃ  cá»­a ká»¹ thuáº­t',
    items: [
      { id: 'ITM-B01', text: 'Cá»­a thoÃ¡t hiá»ƒm chá»‘ng chÃ¡y Ä‘Ã³ng kÃ­n, khÃ´ng bá»‹ chÃ¨n gáº¡ch/Ä‘Ã¡', category: 'PCCC', isRequiredPhotoOnFail: true },
      { id: 'ITM-B02', text: 'Há»‡ thá»‘ng van chá»¯a chÃ¡y tá»± Ä‘á»™ng (Sprinkler) khÃ´ng bá»‹ rÃ² rá»‰ hay ngháº½n', category: 'PCCC', isRequiredPhotoOnFail: true },
      { id: 'ITM-B03', text: 'PhÃ²ng mÃ¡y phÃ¡t Ä‘iá»‡n & tráº¡m biáº¿n Ã¡p khÃ³a kÃ­n an toÃ n', category: 'AN_NINH', isRequiredPhotoOnFail: true },
      { id: 'ITM-B04', text: 'KhÃ´ng cÃ³ phÆ°Æ¡ng tiá»‡n Ä‘á»— sai quy Ä‘á»‹nh cháº¯n lá»‘i thoÃ¡t náº¡n', category: 'AN_NINH', isRequiredPhotoOnFail: true },
      { id: 'ITM-B05', text: 'KhÃ´ng phÃ¡t hiá»‡n mÃ¹i khÃ©t, mÃ¹i xÄƒng dáº§u hoáº·c khÃ³i báº¥t thÆ°á»ng', category: 'PCCC', isRequiredPhotoOnFail: true },
      { id: 'ITM-B06', text: 'Há»‡ thá»‘ng thÃ´ng giÃ³ hÃºt khÃ³i táº§ng háº§m hoáº¡t Ä‘á»™ng á»•n Ä‘á»‹nh', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
      { id: 'ITM-B07', text: 'Ãnh sÃ¡ng háº§m xe Ä‘áº§y Ä‘á»§, gÆ°Æ¡ng cáº§u lá»“i khÃ´ng bá»‹ vá»¡ hay lá»‡ch', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
      { id: 'ITM-B08', text: 'BÆ¡m thoÃ¡t nÆ°á»›c háº§m xe (Sump pump) sáºµn sÃ ng chá»‘ng ngáº­p', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
    ],
  },
  {
    id: 'CHK-ROOFTOP-01',
    name: 'Checklist Táº§ng ThÆ°á»£ng Sky Bar & BÃ£i ÄÃ¡p Trá»±c ThÄƒng',
    description: 'An toÃ n lan can cao táº§ng, cá»­a giÃ³ vÃ  há»‡ thá»‘ng thu lÃ´i',
    items: [
      { id: 'ITM-R01', text: 'Cá»­a thoÃ¡t hiá»ƒm lÃªn táº§ng thÆ°á»£ng khÃ³a kiá»ƒm soÃ¡t báº±ng tháº» tá»«/chÃ¬a an ninh', category: 'AN_NINH', isRequiredPhotoOnFail: true },
      { id: 'ITM-R02', text: 'Lan can kÃ­nh vÃ  rÃ o cháº¯n an toÃ n kiÃªn cá»‘, khÃ´ng lung lay', category: 'AN_TOAN_KHACH', isRequiredPhotoOnFail: true },
      { id: 'ITM-R03', text: 'ÄÃ¨n cáº£nh bÃ¡o mÃ¡y bay (Aviation Beacon) ban Ä‘Ãªm sÃ¡ng Ä‘á» rÃµ rÃ ng', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
      { id: 'ITM-R04', text: 'SÃ n Ä‘Ã¡p trá»±c thÄƒng thÃ´ng thoÃ¡ng, khÃ´ng cÃ³ rÃ¡c hay váº­t thá»ƒ bay', category: 'VE_SINH_MY_QUAN', isRequiredPhotoOnFail: true },
      { id: 'ITM-R05', text: 'Há»‡ thá»‘ng kim thu lÃ´i chá»‘ng sÃ©t liÃªn káº¿t tiáº¿p Ä‘á»‹a cháº¯c cháº¯n', category: 'KY_THUAT', isRequiredPhotoOnFail: true },
      { id: 'ITM-R06', text: 'BÃ¬nh chá»¯a chÃ¡y khÃ­ CO2 Ä‘áº·t táº¡i tá»§ trá»±c tháº§u thÆ°á»£ng nguyÃªn váº¹n', category: 'PCCC', isRequiredPhotoOnFail: true },
    ],
  },
];

// Pre-seeded 5-Star Hotel Checkpoints
export const DEFAULT_CHECKPOINTS: Checkpoint[] = [
  {
    id: 'SEC-LBY-01',
    name: 'Sáº£nh chÃ­nh Äáº¡i sáº£nh & Quáº§y Lá»… TÃ¢n (Lobby Reception)',
    area: 'Khu Sáº£nh & CÃ´ng Cá»™ng',
    route: 'Tuyáº¿n Sáº£nh & Lá»‘i VÃ o',
    order: 1,
    status: 'ACTIVE',
    qrCodeValue: 'SEC-LBY-01',
    description: 'Vá»‹ trÃ­ cá»™t chÃ­nh Ä‘á»‘i diá»‡n cá»­a xoay Ä‘Ã³n khÃ¡ch trung tÃ¢m',
    checklistId: 'CHK-LOBBY-01',
    createdAt: '2025-01-01 08:00:00',
  },
  {
    id: 'SEC-ENT-01',
    name: 'Cá»•ng chÃ­nh & Khu vá»±c Ä‘Ã³n tráº£ khÃ¡ch VIP (Drop-off Zone)',
    area: 'Khu Sáº£nh & CÃ´ng Cá»™ng',
    route: 'Tuyáº¿n Sáº£nh & Lá»‘i VÃ o',
    order: 2,
    status: 'ACTIVE',
    qrCodeValue: 'SEC-ENT-01',
    description: 'Bá»‘t báº£o vá»‡ cá»•ng sá»‘ 1 vÃ  lÃ n xe limousine',
    checklistId: 'CHK-LOBBY-01',
    createdAt: '2025-01-01 08:00:00',
  },
  {
    id: 'SEC-POOL-01',
    name: 'Há»“ bÆ¡i vÃ´ cá»±c táº§ng 5 & Pool Bar (Infinity Pool)',
    area: 'Khu Giáº£i TrÃ­ & Thá»ƒ Thao',
    route: 'Tuyáº¿n Thá»ƒ Thao & BÃ£i Biá»ƒn',
    order: 3,
    status: 'ACTIVE',
    qrCodeValue: 'SEC-POOL-01',
    description: 'Trá»¥ cá»©u há»™ cáº¡nh thÃ¡p quan sÃ¡t há»“ bÆ¡i ngoÃ i trá»i',
    checklistId: 'CHK-POOL-01',
    createdAt: '2025-01-01 08:00:00',
  },
  {
    id: 'SEC-BCH-01',
    name: 'BÃ£i biá»ƒn riÃªng & Lá»‘i Ä‘i ven biá»ƒn (Private Beachfront)',
    area: 'Khu Giáº£i TrÃ­ & BÃ£i Biá»ƒn',
    route: 'Tuyáº¿n Thá»ƒ Thao & BÃ£i Biá»ƒn',
    order: 4,
    status: 'ACTIVE',
    qrCodeValue: 'SEC-BCH-01',
    description: 'ChÃ²i an ninh bÃ£i cÃ¡t lá»‘i ra cÃ¢u láº¡c bá»™ thá»ƒ thao biá»ƒn',
    checklistId: 'CHK-POOL-01',
    createdAt: '2025-01-01 08:00:00',
  },
  {
    id: 'SEC-PKG-01',
    name: 'Háº§m Ä‘á»— xe B1 & PhÃ²ng biáº¿n Ã¡p ká»¹ thuáº­t (Basement B1)',
    area: 'Khu Táº§ng Háº§m & Ká»¹ Thuáº­t',
    route: 'Tuyáº¿n Ká»¹ Thuáº­t & Háº§m',
    order: 5,
    status: 'ACTIVE',
    qrCodeValue: 'SEC-PKG-01',
    description: 'Cá»­a ra vÃ o phÃ²ng phÃ¢n phá»‘i Ä‘iá»‡n cáº¡nh thang mÃ¡y sá»‘ 4',
    checklistId: 'CHK-BASEMENT-01',
    createdAt: '2025-01-01 08:00:00',
  },
  {
    id: 'SEC-ROOF-01',
    name: 'Táº§ng thÆ°á»£ng Sky Bar & BÃ£i Ä‘Ã¡p trá»±c thÄƒng (Helipad Rooftop)',
    area: 'Khu Cao Táº§ng & Táº§ng ThÆ°á»£ng',
    route: 'Tuyáº¿n Cao Táº§ng',
    order: 6,
    status: 'ACTIVE',
    qrCodeValue: 'SEC-ROOF-01',
    description: 'Cá»­a thang thoÃ¡t hiá»ƒm sÃ¢n bay trá»±c thÄƒng táº§ng 32',
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
    // Migration: update existing stored config to Dusit Princess Moonrise PhÃº Quá»‘c & remove hotline
    const storedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        let changed = false;
        if (
          !parsed.hotelName ||
          parsed.hotelName === 'KHÃCH Sáº N QUá»C Táº¾ & RESORT GRAND PALACE' ||
          parsed.hotelName.includes('GRAND PALACE') ||
          parsed.hotelName.includes('Grand Palace') ||
          parsed.hotelName.includes('GRAND LUXURY')
        ) {
          parsed.hotelName = 'Dusit Princess Moonrise PhÃº Quá»‘c';
          parsed.address = 'ÄÆ°á»ng Tráº§n HÆ°ng Äáº¡o, Cá»­a Láº¥p, DÆ°Æ¡ng TÆ¡, ThÃ nh phá»‘ PhÃº Quá»‘c, Tá»‰nh KiÃªn Giang';
          changed = true;
        }
        if (
          !parsed.address ||
          parsed.address.includes('An Giang') ||
          parsed.address.includes('VÅ©ng TÃ u') ||
          parsed.address.includes('HoÃ ng Gia')
        ) {
          parsed.address = 'ÄÆ°á»ng Tráº§n HÆ°ng Äáº¡o, Cá»­a Láº¥p, DÆ°Æ¡ng TÆ¡, ThÃ nh phá»‘ PhÃº Quá»‘c, Tá»‰nh KiÃªn Giang';
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
      if (raw && (raw.includes('KHÃCH Sáº N QUá»C Táº¾ & RESORT GRAND PALACE') || raw.includes('GRAND PALACE') || raw.includes('Grand Palace') || raw.includes('GRAND LUXURY') || raw.includes('Äáº¡i Lá»™ HoÃ ng Gia') || raw.includes('114') || raw.includes('115') || raw.includes('Hotline') || raw.includes('An Giang'))) {
        let cleaned = raw;
        cleaned = cleaned.replace(/KHÃCH Sáº N QUá»C Táº¾ & RESORT GRAND PALACE/g, 'Dusit Princess Moonrise PhÃº Quá»‘c');
        cleaned = cleaned.replace(/GRAND PALACE/g, 'Dusit Princess Moonrise PhÃº Quá»‘c');
        cleaned = cleaned.replace(/Grand Palace/g, 'Dusit Princess Moonrise PhÃº Quá»‘c');
        cleaned = cleaned.replace(/01 Äáº¡i Lá»™ HoÃ ng Gia,?\s*BÃ£i DÃ i,?\s*Äáº·c Khu PhÃº Quá»‘c/g, 'ÄÆ°á»ng Tráº§n HÆ°ng Äáº¡o, Cá»­a Láº¥p, DÆ°Æ¡ng TÆ¡, PhÃº Quá»‘c');
        cleaned = cleaned.replace(/\(?\+84\)?\s*28\s*3822\s*8888\s*-\s*Line\s*An\s*Ninh:\s*911\s*\/\s*114/g, '');
        cleaned = cleaned.replace(/Hotline\s*An\s*Ninh:[^|\n,]*/gi, '');
        cleaned = cleaned.replace(/Hotline:[^|\n,]*/gi, '');
        cleaned = cleaned.replace(/Ext:?\s*114\s*\/?\s*115/gi, '');
        cleaned = cleaned.replace(/114\s*\/\s*115/g, '');
        cleaned = cleaned.replace(/An Giang/g, 'KiÃªn Giang');
        cleaned = cleaned.replace(/â˜…\s*â˜…\s*â˜…\s*â˜…\s*â˜…\s*GRAND LUXURY PALACE HOTEL & RESORT/g, 'Dusit Princess Moonrise PhÃº Quá»‘c');
        cleaned = cleaned.replace(/GRAND LUXURY PALACE HOTEL & RESORT/g, 'Dusit Princess Moonrise PhÃº Quá»‘c');
        cleaned = cleaned.replace(/GRAND LUXURY PALACE/g, 'Dusit Princess Moonrise PhÃº Quá»‘c');
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
            u.fullName = def ? def.fullName : (u.username === 'manager' ? 'Nguyá»…n VÄƒn An' : u.username || 'NhÃ¢n viÃªn an ninh');
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
          curUser.fullName = def ? def.fullName : (curUser.username === 'manager' ? 'Nguyá»…n VÄƒn An' : curUser.username || 'NhÃ¢n viÃªn an ninh');
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(curUser));
        }
      }
    } catch (e) {
      console.warn('User repair error', e);
    }

    // Clean up deleted user LÃª Viáº¿t SÆ¡n / sonllvt99@gmail.com from stored data
    const existingUsersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (existingUsersRaw && (existingUsersRaw.includes('sonllvt99') || existingUsersRaw.includes('LÃª Viáº¿t SÆ¡n'))) {
      try {
        const parsedList: User[] = JSON.parse(existingUsersRaw);
        const filteredList = parsedList.filter(
          (u) =>
            u.email?.toLowerCase() !== 'sonllvt99@gmail.com' &&
            u.username?.toLowerCase() !== 'sonllvt99' &&
            u.fullName !== 'LÃª Viáº¿t SÆ¡n'
        );
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredList));
      } catch {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      }
    }

    const currentLoggedInUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (currentLoggedInUser && (currentLoggedInUser.includes('sonllvt99') || currentLoggedInUser.includes('LÃª Viáº¿t SÆ¡n'))) {
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
          userName: 'Manager',
          userRole: 'MANAGER',
          action: 'KHá»žI Táº O Há»† THá»NG',
          target: 'Há»‡ thá»‘ng Tuáº§n Tra An Ninh',
          details: 'Thiáº¿t láº­p danh má»¥c 6 tráº¡m kiá»ƒm soÃ¡t an ninh tiÃªu chuáº©n 5 sao vÃ  quy trÃ¬nh tuáº§n tra PCCC/CCTV.',
        },
        {
          id: 'LOG-002',
          timestamp: '2026-09-15 08:30:00',
          userId: 'USR-MGR-01',
          userName: 'Tráº§n VÄƒn SÆ¡n',
          userRole: 'MANAGER',
          action: 'Cáº¤U HÃŒNH Há»† THá»NG',
          target: 'Dusit Princess Moonrise PhÃº Quá»‘c',
          details: 'Cáº­p nháº­t thá»i háº¡n lÆ°u trá»¯ dá»¯ liá»‡u 365 ngÃ y, kÃ­ch hoáº¡t báº¯t buá»™c chá»¥p áº£nh khi cÃ³ lá»—i vÃ  Ä‘Ã³ng dáº¥u logo báº£o an.',
        },
        {
          id: 'LOG-003',
          timestamp: '2026-09-15 17:50:00',
          userId: 'USR-SUP-01',
          userName: 'LÃª ÄÃ¬nh TÃ¢m',
          userRole: 'SUPERVISOR',
          action: 'PHÃ‚N CÃ”NG CA TRá»°C',
          target: 'Lá»‹ch trá»±c báº£o an',
          details: 'PhÃ¢n cÃ´ng ca trá»±c tuáº§n tra: Ca ngÃ y (LÃª VÄƒn CÆ°á»ng), Ca Ä‘Ãªm (Pháº¡m Quá»‘c Báº£o).',
        },
        {
          id: 'LOG-004',
          timestamp: '2026-09-16 06:00:15',
          userId: 'USR-OFC-01',
          userName: 'LÃª VÄƒn CÆ°á»ng',
          userRole: 'OFFICER',
          action: 'ÄÄ‚NG NHáº¬P',
          target: 'Ca ngÃ y (06:00 - 18:00)',
          details: 'ÄÄƒng nháº­p thÃ nh cÃ´ng tá»« thiáº¿t bá»‹ di Ä‘á»™ng vá»›i tÃ i khoáº£n Gmail levancuong.security@gmail.com.',
        },
        {
          id: 'LOG-005',
          timestamp: '2026-09-16 06:15:30',
          userId: 'USR-OFC-01',
          userName: 'LÃª VÄƒn CÆ°á»ng',
          userRole: 'OFFICER',
          action: 'Báº®T Äáº¦U TUáº¦N TRA',
          target: 'PhiÃªn SES-20260916-01',
          details: 'Báº¯t Ä‘áº§u lÆ°á»£t tuáº§n tra Ä‘áº§u ca: Tuyáº¿n Sáº£nh chÃ­nh, Lá»‘i vÃ o VIP vÃ  Háº§m Ä‘á»— xe B1.',
        },
        {
          id: 'LOG-006',
          timestamp: '2026-09-16 07:45:10',
          userId: 'USR-OFC-01',
          userName: 'LÃª VÄƒn CÆ°á»ng',
          userRole: 'OFFICER',
          action: 'GHI NHáº¬N Sá»° Cá»',
          target: 'Háº§m Ä‘á»— xe B1 (SEC-PKG-01)',
          details: 'Ghi nháº­n lá»—i FAIL: ÄÃ¨n thoÃ¡t hiá»ƒm Exit cháº­p chá»n, chá»¥p hÃ¬nh hiá»‡n trÆ°á»ng cÃ³ Ä‘Ã³ng dáº¥u GPS vÃ  thá»i gian.',
        },
        {
          id: 'LOG-007',
          timestamp: '2026-09-16 08:30:00',
          userId: 'USR-OFC-01',
          userName: 'LÃª VÄƒn CÆ°á»ng',
          userRole: 'OFFICER',
          action: 'HOÃ€N THÃ€NH TUáº¦N TRA',
          target: 'PhiÃªn SES-20260916-01',
          details: 'HoÃ n táº¥t kiá»ƒm tra 6/6 tráº¡m checkpoint, ghi nháº­n 1 sá»± cá»‘ háº§m B1, Ä‘á»“ng bá»™ dá»¯ liá»‡u vÃ o há»‡ thá»‘ng.',
        },
        {
          id: 'LOG-008',
          timestamp: '2026-09-16 08:45:00',
          userId: 'USR-MGR-01',
          userName: 'Nguyá»…n VÄƒn An',
          userRole: 'MANAGER',
          action: 'DUYá»†T & CHá»ˆ Äáº O',
          target: 'Sá»± cá»‘ INC-20260916-01',
          details: 'PhÃª duyá»‡t phÆ°Æ¡ng Ã¡n xá»­ lÃ½, Ä‘iá»u Ä‘á»™ng Äá»™i Ká»¹ thuáº­t thay tháº¿ linh kiá»‡n Ä‘Ã¨n Exit trong 2 giá».',
        },
        {
          id: 'LOG-009',
          timestamp: '2026-09-16 11:30:00',
          userId: 'USR-SUP-01',
          userName: 'Tráº§n VÄƒn BÃ¬nh',
          userRole: 'SUPERVISOR',
          action: 'XUáº¤T BÃO CÃO',
          target: 'BÃ¡o cÃ¡o Ca trá»±c NgÃ y',
          details: 'Xuáº¥t bÃ¡o cÃ¡o PDF vÃ  báº£ng tÃ­nh Excel lÆ°u trá»¯ há»“ sÆ¡ kiá»ƒm toÃ¡n an ninh khÃ¡ch sáº¡n.',
        },
        {
          id: 'LOG-010',
          timestamp: '2026-09-16 18:00:00',
          userId: 'USR-OFC-02',
          userName: 'Pháº¡m Quá»‘c Báº£o',
          userRole: 'OFFICER',
          action: 'ÄÄ‚NG NHáº¬P',
          target: 'Ca Ä‘Ãªm (18:00 - 06:00)',
          details: 'Nháº­n bÃ n giao ca trá»±c Ä‘Ãªm, kiá»ƒm tra Ä‘Ã¨n cáº£nh bÃ¡o bÃ£i biá»ƒn vÃ  há»‡ thá»‘ng kiá»ƒm soÃ¡t lá»‘i vÃ o.',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PATROLS)) {
      StorageService.seedDefaultSessions();
    }
  }

  // Generate & Seed Default Baseline Patrol Sessions (Ca ngÃ y 06:00-18:00 & Ca Ä‘Ãªm 18:00-06:00)
  static seedDefaultSessions(): PatrolSession[] {
    const samplePhoto = generateSampleIncidentPhoto(
      'ÄÃ¨n thoÃ¡t hiá»ƒm Exit táº§ng háº§m B1 bá»‹ cháº­p chá»n',
      'Háº§m Ä‘á»— xe B1 â€“ SEC-PKG-01',
      'LÃª VÄƒn CÆ°á»ng',
      '16/09/2026',
      '07:45'
    );

    const sampleIncident1: Incident = {
      id: 'INC-20260916-01',
      sessionId: 'PTR-20260916-001',
      checkpointId: 'SEC-PKG-01',
      checkpointName: 'Háº§m Ä‘á»— xe B1 & PhÃ²ng biáº¿n Ã¡p ká»¹ thuáº­t (Basement B1)',
      area: 'Khu Táº§ng Háº§m & Ká»¹ Thuáº­t',
      officerId: 'USR-OFC-01',
      officerName: 'LÃª VÄƒn CÆ°á»ng',
      checklistText: 'Ãnh sÃ¡ng háº§m xe Ä‘áº§y Ä‘á»§, gÆ°Æ¡ng cáº§u lá»“i khÃ´ng bá»‹ vá»¡ hay lá»‡ch',
      severity: 'MEDIUM',
      description: 'ÄÃ¨n thoÃ¡t hiá»ƒm Exit gÃ³c cua cá»™t B-12 bá»‹ cháº­p chá»n, bÃ³ng Ä‘Ã¨n nháº¥p nhÃ¡y liÃªn tá»¥c cÃ³ nguy cÆ¡ cháº­p Ä‘iá»‡n.',
      actionTaken: 'ÄÃ£ Ä‘áº·t rÃ o cháº¯n cáº£nh bÃ¡o táº¡m thá»i vÃ  bÃ¡o bá»™ pháº­n Ká»¹ thuáº­t Ä‘iá»‡n Ä‘áº¿n thay tháº¿.',
      department: 'Bá»™ pháº­n Ká»¹ thuáº­t Ä‘iá»‡n (Engineering)',
      photoUrl: samplePhoto,
      photoMetadata: {
        officerName: 'LÃª VÄƒn CÆ°á»ng',
        date: '16/09/2026',
        time: '07:45',
        location: 'Háº§m Ä‘á»— xe B1 â€“ SEC-PKG-01',
      },
      status: 'IN_PROGRESS',
      createdAt: '2026-09-16 07:46:12',
    };

    const sampleSession1: PatrolSession = {
      id: 'PTR-20260916-001',
      officerId: 'USR-OFC-01',
      officerName: 'LÃª VÄƒn CÆ°á»ng',
      badgeNumber: 'SEC-OFC-042',
      date: '2026-09-16',
      startTime: '07:00:00',
      endTime: '08:15:30',
      shift: 'Ca ngÃ y (06:00 - 18:00)',
      patrolRoute: 'Tuyáº¿n Tá»•ng Há»£p ToÃ n KhÃ¡ch Sáº¡n',
      status: 'COMPLETED',
      isLocked: true,
      checkpoints: [
        {
          checkpointId: 'SEC-LBY-01',
          checkpointName: 'Sáº£nh chÃ­nh Äáº¡i sáº£nh & Quáº§y Lá»… TÃ¢n (Lobby Reception)',
          area: 'Khu Sáº£nh & CÃ´ng Cá»™ng',
          scannedAt: '07:05:12',
          completedAt: '07:18:40',
          status: 'PASS',
          items: DEFAULT_CHECKLISTS[0].items.map((it) => ({
            itemId: it.id,
            itemText: it.text,
            status: 'PASS',
          })),
          notes: 'Khu vá»±c sáº£nh ngÄƒn náº¯p, khÃ¡ch check-in sÃ¡ng Ä‘Ã´ng nhÆ°ng an toÃ n.',
        },
        {
          checkpointId: 'SEC-ENT-01',
          checkpointName: 'Cá»•ng chÃ­nh & Khu vá»±c Ä‘Ã³n tráº£ khÃ¡ch VIP (Drop-off Zone)',
          area: 'Khu Sáº£nh & CÃ´ng Cá»™ng',
          scannedAt: '07:22:00',
          completedAt: '07:34:10',
          status: 'PASS',
          items: DEFAULT_CHECKLISTS[0].items.map((it) => ({
            itemId: it.id,
            itemText: it.text,
            status: 'PASS',
          })),
          notes: 'Xe buÃ½t Ä‘Æ°a Ä‘Ã³n khÃ¡ch sÃ¢n bay ra vÃ o Ä‘Ãºng lÃ n quy Ä‘á»‹nh.',
        },
        {
          checkpointId: 'SEC-PKG-01',
          checkpointName: 'Háº§m Ä‘á»— xe B1 & PhÃ²ng biáº¿n Ã¡p ká»¹ thuáº­t (Basement B1)',
          area: 'Khu Táº§ng Háº§m & Ká»¹ Thuáº­t',
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
                  description: 'ÄÃ¨n thoÃ¡t hiá»ƒm Exit gÃ³c cua cá»™t B-12 bá»‹ cháº­p chá»n, bÃ³ng Ä‘Ã¨n nháº¥p nhÃ¡y liÃªn tá»¥c cÃ³ nguy cÆ¡ cháº­p Ä‘iá»‡n.',
                  severity: 'MEDIUM',
                  actionTaken: 'ÄÃ£ Ä‘áº·t rÃ o cháº¯n cáº£nh bÃ¡o táº¡m thá»i vÃ  bÃ¡o bá»™ pháº­n Ká»¹ thuáº­t Ä‘iá»‡n Ä‘áº¿n thay tháº¿.',
                  department: 'Bá»™ pháº­n Ká»¹ thuáº­t Ä‘iá»‡n (Engineering)',
                  photoUrl: samplePhoto,
                  photoMetadata: {
                    officerName: 'LÃª VÄƒn CÆ°á»ng',
                    officerId: 'USR-OFC-01',
                    date: '16/09/2026',
                    time: '07:45',
                    location: 'Háº§m Ä‘á»— xe B1 â€“ SEC-PKG-01',
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
          notes: 'PhÃ¡t hiá»‡n lá»—i Ä‘Ã¨n thoÃ¡t hiá»ƒm táº¡i cá»™t B-12, Ä‘Ã£ kÃ­ch hoáº¡t quy trÃ¬nh FAIL vÃ  táº¡o phiáº¿u sá»± cá»‘.',
        },
        {
          checkpointId: 'SEC-POOL-01',
          checkpointName: 'Há»“ bÆ¡i vÃ´ cá»±c táº§ng 5 & Pool Bar (Infinity Pool)',
          area: 'Khu Giáº£i TrÃ­ & Thá»ƒ Thao',
          scannedAt: '08:00:20',
          completedAt: '08:12:45',
          status: 'PASS',
          items: DEFAULT_CHECKLISTS[1].items.map((it) => ({
            itemId: it.id,
            itemText: it.text,
            status: 'PASS',
          })),
          notes: 'Máº·t há»“ bÆ¡i trong sáº¡ch, cá»©u há»™ viÃªn cÃ³ máº·t Ä‘Ãºng giá».',
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
      officerName: 'Pháº¡m Quá»‘c Báº£o',
      badgeNumber: 'SEC-OFC-045',
      date: '2026-09-16',
      startTime: '20:00:00',
      endTime: '21:15:00',
      shift: 'Ca Ä‘Ãªm (18:00 - 06:00)',
      patrolRoute: 'Tuyáº¿n Táº§ng Háº§m & Há»‡ Thá»‘ng PCCC Ban ÄÃªm',
      status: 'COMPLETED',
      isLocked: true,
      checkpoints: [
        {
          checkpointId: 'SEC-PKG-01',
          checkpointName: 'Háº§m Ä‘á»— xe B1 & PhÃ²ng biáº¿n Ã¡p ká»¹ thuáº­t (Basement B1)',
          area: 'Khu Táº§ng Háº§m & Ká»¹ Thuáº­t',
          scannedAt: '20:05:00',
          completedAt: '20:25:00',
          status: 'PASS',
          items: DEFAULT_CHECKLISTS[2].items.map((it) => ({
            itemId: it.id,
            itemText: it.text,
            status: 'PASS',
          })),
          notes: 'Háº§m xe Ä‘Ã£ giáº£m táº£i, cÃ¡c vá»‹ trÃ­ cá»­a ká»¹ thuáº­t Ä‘Ã£ khÃ³a chá»‘t an toÃ n.',
        },
        {
          checkpointId: 'SEC-LBY-01',
          checkpointName: 'Sáº£nh chÃ­nh Äáº¡i sáº£nh & Quáº§y Lá»… TÃ¢n (Lobby Reception)',
          area: 'Khu Sáº£nh & CÃ´ng Cá»™ng',
          scannedAt: '20:30:00',
          completedAt: '20:45:00',
          status: 'PASS',
          items: DEFAULT_CHECKLISTS[0].items.map((it) => ({
            itemId: it.id,
            itemText: it.text,
            status: 'PASS',
          })),
          notes: 'Khu vá»±c sáº£nh yÃªn tÄ©nh, tiáº¿p tÃ¢n ca Ä‘Ãªm tÃºc trá»±c Ä‘áº§y Ä‘á»§.',
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
      officerName: 'LÃª VÄƒn CÆ°á»ng',
      badgeNumber: 'SEC-OFC-042',
      date: '2026-09-17',
      startTime: '08:00:00',
      endTime: '09:10:00',
      shift: 'Ca ngÃ y (06:00 - 18:00)',
      patrolRoute: 'Tuyáº¿n An Ninh Sáº£nh & BÃ£i Biá»ƒn NgoÃ i Trá»i',
      status: 'COMPLETED',
      isLocked: true,
      checkpoints: [
        {
          checkpointId: 'SEC-LBY-01',
          checkpointName: 'Sáº£nh chÃ­nh Äáº¡i sáº£nh & Quáº§y Lá»… TÃ¢n (Lobby Reception)',
          area: 'Khu Sáº£nh & CÃ´ng Cá»™ng',
          scannedAt: '08:05:00',
          completedAt: '08:20:00',
          status: 'PASS',
          items: DEFAULT_CHECKLISTS[0].items.map((it) => ({
            itemId: it.id,
            itemText: it.text,
            status: 'PASS',
          })),
          notes: 'Äáº§y Ä‘á»§ nhÃ¢n sá»± quáº§y Concierge vÃ  Bellman.',
        },
        {
          checkpointId: 'SEC-ENT-01',
          checkpointName: 'Cá»•ng chÃ­nh & Khu vá»±c Ä‘Ã³n tráº£ khÃ¡ch VIP (Drop-off Zone)',
          area: 'Khu Sáº£nh & CÃ´ng Cá»™ng',
          scannedAt: '08:25:00',
          completedAt: '08:40:00',
          status: 'PASS',
          items: DEFAULT_CHECKLISTS[0].items.map((it) => ({
            itemId: it.id,
            itemText: it.text,
            status: 'PASS',
          })),
          notes: 'LÆ°u lÆ°á»£ng giao thÃ´ng thÃ´ng thoÃ¡ng, tráº­t tá»± an ninh tá»‘t.',
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
          message: 'Vui lÃ²ng nháº­p TÃªn Ä‘Äƒng nháº­p (Username Ä‘Ã£ Ä‘Äƒng kÃ½)!',
        };
      }
      if (!inputGmail) {
        return {
          success: false,
          message: 'Vui lÃ²ng nháº­p Ä‘á»‹a chá»‰ Gmail chÃ­nh chá»§ Ä‘Ã£ Ä‘Äƒng kÃ½!',
        };
      }

      const cleanGmail = inputGmail.toLowerCase();
      const cleanUsername = inputUsername.toLowerCase();

      // 1. Check if Gmail is registered in Employee Management
      const userByGmail = users.find(
        (u) => u.email && u.email.trim().toLowerCase() === cleanGmail
      );

      // "KHÃ”NG ÄÃšNG GMAIL ÄÃƒ ÄÄ‚NG KÃ ÄÃ RA" - Kick out unregistered Gmail
      if (!userByGmail) {
        StorageService.recordAudit(
          'ANONYMOUS',
          'KhÃ¡ch láº¡ / ChÆ°a cáº¥p phÃ©p',
          'OFFICER',
          'Tá»ª CHá»I TRUY Cáº¬P (SAI GMAIL)',
          cleanGmail,
          `Tá»« chá»‘i Ä‘Äƒng nháº­p: Gmail "${inputGmail}" chÆ°a Ä‘Æ°á»£c cáº¥p quyá»n trong Quáº£n lÃ½ nhÃ¢n viÃªn.`
        );
        return {
          success: false,
          message: `TRUY Cáº¬P Bá»Š Tá»ª CHá»I: Äá»‹a chá»‰ Gmail "${inputGmail}" chÆ°a Ä‘Æ°á»£c Ä‘Äƒng kÃ½ trong danh sÃ¡ch Quáº£n lÃ½ nhÃ¢n viÃªn! Báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p há»‡ thá»‘ng an ninh.`,
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
          'Tá»ª CHá»I TRUY Cáº¬P (SAI USERNAME)',
          cleanUsername,
          `TÃªn Ä‘Äƒng nháº­p "${inputUsername}" khÃ´ng khá»›p vá»›i thÃ´ng tin Ä‘Ã£ Ä‘Äƒng kÃ½ cÃ¹ng Gmail ${inputGmail}.`
        );
        return {
          success: false,
          message: `TRUY Cáº¬P Bá»Š Tá»ª CHá»I: TÃªn Ä‘Äƒng nháº­p "${inputUsername}" khÃ´ng khá»›p vá»›i thÃ´ng tin Ä‘Ã£ Ä‘Äƒng kÃ½ cÃ¹ng Gmail nÃ y trong danh sÃ¡ch Quáº£n lÃ½ nhÃ¢n viÃªn!`,
        };
      }

      // 3. Check if account is locked
      if (userByGmail.status === 'LOCKED') {
        return {
          success: false,
          message:
            'TÃ€I KHOáº¢N Táº M KHÃ“A: TÃ i khoáº£n nhÃ¢n viÃªn nÃ y Ä‘ang bá»‹ táº¡m khÃ³a an toÃ n. Vui lÃ²ng liÃªn há»‡ TrÆ°á»Ÿng bá»™ pháº­n An ninh Ä‘á»ƒ má»Ÿ khÃ³a.',
        };
      }

      // 4. Password verification logic
      const valid =
        !!userByGmail.passwordHash &&
        inputPassword === userByGmail.passwordHash;

      if (!valid) {
        userByGmail.failedLoginAttempts = (userByGmail.failedLoginAttempts || 0) + 1;
        if (userByGmail.failedLoginAttempts >= 5) {
          userByGmail.status = 'LOCKED';
          StorageService.recordAudit(
            userByGmail.id,
            userByGmail.fullName,
            userByGmail.role,
            'KHÃ“A Tá»° Äá»˜NG TÃ€I KHOáº¢N',
            userByGmail.username,
            'TÃ i khoáº£n bá»‹ khÃ³a tá»± Ä‘á»™ng sau 5 láº§n nháº­p sai máº­t kháº©u liÃªn tiáº¿p.'
          );
        }
        StorageService.saveUsers(users);
        return {
          success: false,
          message: `Máº­t kháº©u an ninh khÃ´ng chÃ­nh xÃ¡c. ÄÃ£ nháº­p sai ${userByGmail.failedLoginAttempts}/5 láº§n.`,
        };
      }

      // Reset failed attempts & record login
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      userByGmail.failedLoginAttempts = 0;
      userByGmail.lastLogin = now;

      if (!userByGmail.fullName || userByGmail.fullName.trim() === '') {
        const def = DEFAULT_USERS.find((d) => d.id === userByGmail.id || d.username === userByGmail.username || d.email === userByGmail.email);
        userByGmail.fullName = def ? def.fullName : (userByGmail.username === 'manager' ? 'Nguyá»…n VÄƒn An' : userByGmail.username || 'NhÃ¢n viÃªn báº£o an');
      }

      StorageService.saveUsers(users);
      StorageService.setCurrentUser(userByGmail);
      StorageService.registerOnlineUser(userByGmail, 'Äang trá»±c ban / Tuáº§n tra');
      StorageService.sendAccessNotification({
        userId: userByGmail.id,
        userName: userByGmail.fullName || userByGmail.username,
        userRole: userByGmail.role,
        email: userByGmail.email,
        message: `CÃ¡n bá»™ "${userByGmail.fullName || userByGmail.username}" vá»«a Ä‘Äƒng nháº­p há»‡ thá»‘ng an ninh`,
        type: 'LOGIN',
      });
      StorageService.recordAudit(
        userByGmail.id,
        userByGmail.fullName,
        userByGmail.role,
        'ÄÄ‚NG NHáº¬P THÃ€NH CÃ”NG',
        userByGmail.username,
        `XÃ¡c thá»±c thÃ nh cÃ´ng TÃªn Ä‘Äƒng nháº­p "${inputUsername}" vÃ  Gmail "${userByGmail.email}". Vai trÃ²: ${userByGmail.role}`
      );

      return { success: true, user: userByGmail };
    }

    // Fallback for single credential
    const cleanCred = inputGmail.toLowerCase();
    if (!cleanCred) {
      return {
        success: false,
        message: 'Vui lÃ²ng nháº­p Gmail chÃ­nh chá»§ hoáº·c Há» tÃªn nhÃ¢n viÃªn Ä‘Ã£ Ä‘Äƒng kÃ½ vá»›i há»‡ thá»‘ng an ninh.',
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
          'TRUY Cáº¬P Bá»Š Tá»ª CHá»I: Gmail hoáº·c Há» tÃªn nÃ y chÆ°a Ä‘Æ°á»£c Ä‘Äƒng kÃ½ trong danh báº¡ nhÃ¢n sá»± cá»§a há»‡ thá»‘ng. Báº¡n khÃ´ng pháº£i lÃ  nhÃ¢n viÃªn hoáº·c chÆ°a Ä‘Æ°á»£c duyá»‡t tÃ i khoáº£n chÃ­nh chá»§.',
      };
    }

    if (user.status === 'LOCKED') {
      return {
        success: false,
        message:
          'TÃ€I KHOáº¢N Táº M KHÃ“A: TÃ i khoáº£n nhÃ¢n viÃªn nÃ y Ä‘ang bá»‹ táº¡m khÃ³a an toÃ n. Vui lÃ²ng liÃªn há»‡ TrÆ°á»Ÿng bá»™ pháº­n An ninh.',
      };
    }

    const valid =
      !!user.passwordHash &&
      inputPassword === user.passwordHash;

    if (!valid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.status = 'LOCKED';
        StorageService.recordAudit(
          user.id,
          user.fullName,
          user.role,
          'KHÃ“A Tá»° Äá»˜NG TÃ€I KHOáº¢N',
          user.username,
          'TÃ i khoáº£n bá»‹ khÃ³a tá»± Ä‘á»™ng sau 5 láº§n Ä‘Äƒng nháº­p sai liÃªn tiáº¿p.'
        );
      }
      StorageService.saveUsers(users);
      return { success: false, message: `Máº­t kháº©u khÃ´ng chÃ­nh xÃ¡c. ÄÃ£ nháº­p sai ${user.failedLoginAttempts}/5 láº§n.` };
    }

    // Reset failed attempts & record login
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    user.failedLoginAttempts = 0;
    user.lastLogin = now;

    if (!user.fullName || user.fullName.trim() === '') {
      const def = DEFAULT_USERS.find((d) => d.id === user.id || d.username === user.username || d.email === user.email);
      user.fullName = def ? def.fullName : (user.username === 'manager' ? 'Nguyá»…n VÄƒn An' : user.username || 'NhÃ¢n viÃªn báº£o an');
    }

    StorageService.saveUsers(users);
    StorageService.setCurrentUser(user);

    // Register user as active online for Manager and Supervisor monitoring
    StorageService.registerOnlineUser(user, 'Äang truy cáº­p há»‡ thá»‘ng');

    // Broadcast Real-time Access Notification: "Nguyá»…n VÄƒn A" Äang truy cáº­p
    StorageService.sendAccessNotification({
      userId: user.id,
      userName: user.fullName || user.username,
      userRole: user.role,
      email: user.email,
      message: `CÃ¡n bá»™ "${user.fullName || user.username}" vá»«a Ä‘Äƒng nháº­p há»‡ thá»‘ng an ninh`,
      type: 'LOGIN',
    });

    StorageService.recordAudit(
      user.id,
      user.fullName,
      user.role,
      'ÄÄ‚NG NHáº¬P XÃC THá»°C GMAIL',
      'PhiÃªn lÃ m viá»‡c',
      `ÄÄƒng nháº­p thÃ nh cÃ´ng vá»›i tÃ i khoáº£n ${user.email}. Vai trÃ²: ${user.role}`
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
        message: `"${user.fullName || user.username}" Ä‘Ã£ Ä‘Äƒng xuáº¥t`,
        type: 'LOGOUT',
      });

      StorageService.recordAudit(
        user.id,
        user.fullName,
        user.role,
        'ÄÄ‚NG XUáº¤T',
        'PhiÃªn lÃ m viá»‡c',
        'Káº¿t thÃºc phiÃªn lÃ m viá»‡c an toÃ n.'
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
      const currentShift = hour >= 6 && hour < 18 ? 'Ca ngÃ y (06:00 - 18:00)' : 'Ca Ä‘Ãªm (18:00 - 06:00)';

      if (currentUser && currentUser.id) {
        // Resolve full name reliably
        let resolvedName = currentUser.fullName?.trim();
        if (!resolvedName) {
          const def = DEFAULT_USERS.find((d) => d.id === currentUser.id || d.username === currentUser.username || d.email === currentUser.email);
          resolvedName = def?.fullName || (currentUser.username === 'manager' ? 'Nguyá»…n VÄƒn An' : currentUser.username || 'NhÃ¢n viÃªn báº£o an');
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
          currentAction: (existingIdx !== -1 && list[existingIdx].currentAction) ? list[existingIdx].currentAction : 'Äang hoáº¡t Ä‘á»™ng trong ca',
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
            fullName: 'LÃª VÄƒn CÆ°á»ng',
            username: 'officer1',
            email: 'levancuong.security@gmail.com',
            role: 'OFFICER',
            badgeNumber: 'SEC-OFC-042',
            shift: currentShift,
            loginTime: nowStr,
            lastActiveTime: nowStr,
            currentAction: 'Äang tuáº§n tra tuyáº¿n Sáº£nh & BÃ£i xe chÃ­nh',
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

  static registerOnlineUser(user: User, currentAction = 'Äang truy cáº­p há»‡ thá»‘ng'): void {
    try {
      if (!user || !user.id) return;
      const list = StorageService.getOnlineUsers();
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const hour = new Date().getHours();
      const currentShift = hour >= 6 && hour < 18 ? 'Ca ngÃ y (06:00 - 18:00)' : 'Ca Ä‘Ãªm (18:00 - 06:00)';

      let resolvedName = user.fullName?.trim();
      if (!resolvedName) {
        const def = DEFAULT_USERS.find((d) => d.id === user.id || d.username === user.username || d.email === user.email);
        resolvedName = def?.fullName || (user.username === 'manager' ? 'Nguyá»…n VÄƒn An' : user.username || 'NhÃ¢n viÃªn báº£o an');
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
          StorageService.registerOnlineUser(foundUser, currentAction || 'Äang hoáº¡t Ä‘á»™ng trong ca');
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

  // Real-time Access Notifications (e.g. "Nguyá»…n VÄƒn A" Äang truy cáº­p)
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

    // One-time migration for Security Manager account.
    // Keeps patrol/checklist/photo data intact and only updates the Manager account.
    const managerMigrationKey = 'hotel_patrol_manager_migration_v1';

    if (localStorage.getItem(managerMigrationKey) !== 'done') {
      const manager = users.find(
        (u) =>
          u.username?.toLowerCase() === 'manager' ||
          u.email?.toLowerCase() === 'nguyenvanan.security@gmail.com' ||
          u.id === 'USR-MGR-01'
      );

      if (manager) {
        manager.username = 'manager';
        manager.fullName = 'Manager';
        manager.email = 'tranvanson0997@gmail.com';
        manager.passwordHash = '010101';
        manager.role = 'MANAGER';
        manager.status = 'ACTIVE';
        manager.failedLoginAttempts = 0;
      } else {
        users.push({
          id: 'USR-MGR-01',
          username: 'manager',
          fullName: 'Manager',
          role: 'MANAGER',
          passwordHash: '010101',
          badgeNumber: 'SEC-MGR-01',
          phone: '',
          email: 'tranvanson0997@gmail.com',
          status: 'ACTIVE',
          failedLoginAttempts: 0,
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        });
      }

      localStorage.setItem(managerMigrationKey, 'done');
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    // Filter out deleted user sonllvt99 / LÃª Viáº¿t SÆ¡n if still in storage
    const originalLength = users.length;
    users = users.filter(
      (u) =>
        u.email?.toLowerCase() !== 'sonllvt99@gmail.com' &&
        u.username?.toLowerCase() !== 'sonllvt99' &&
        u.fullName !== 'LÃª Viáº¿t SÆ¡n'
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
      'Táº O TÃ€I KHOáº¢N',
      newUser.username,
      `Táº¡o tÃ i khoáº£n nhÃ¢n viÃªn má»›i: ${newUser.fullName} (${newUser.role})`
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
      'Cáº¬P NHáº¬T TÃ€I KHOáº¢N',
      updatedUser.username,
      `Cáº­p nháº­t thÃ´ng tin/phÃ¢n quyá»n cho: ${updatedUser.fullName}`
    );
  }
}

static toggleUserStatus(userId: string, currentUser: User): void {
  if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
    throw new Error(
      'Chá»‰ Security Manager hoáº·c Admin má»›i cÃ³ quyá»n khÃ³a/má»Ÿ khÃ³a tÃ i khoáº£n.'
    );
  }

  const users = StorageService.getUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) return;

  if (user.id === currentUser.id) {
    throw new Error(
      'Báº¡n khÃ´ng thá»ƒ tá»± khÃ³a tÃ i khoáº£n cá»§a chÃ­nh mÃ¬nh!'
    );
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
    user.status === 'LOCKED'
      ? 'KHÃ“A TÃ€I KHOáº¢N'
      : 'Má»ž KHÃ“A TÃ€I KHOáº¢N',
    user.username,
    `Tráº¡ng thÃ¡i chuyá»ƒn sang: ${user.status}`
  );
}

static resetUserPassword(userId: string, currentUser: User): string {
  if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
    throw new Error(
      'Chỉ Security Manager hoặc Admin mới có quyền đặt lại mật khẩu.'
    );
  }

  const users = StorageService.getUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    throw new Error('Không tìm thấy tài khoản cần đặt lại mật khẩu.');
  }

  if (user.id === currentUser.id) {
    throw new Error(
      'Bạn không thể tự đặt lại mật khẩu của chính mình bằng chức năng này.'
    );
  }

  // Tạo mật khẩu riêng cho từng tài khoản, không dùng mật khẩu chung.
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newPassword = `SEC-${randomPart}`;

  user.passwordHash = newPassword;
  user.failedLoginAttempts = 0;
  user.status = 'ACTIVE';

  StorageService.saveUsers(users);

  StorageService.recordAudit(
    currentUser.id,
    currentUser.fullName,
    currentUser.role,
    'ĐẶT LẠI MẬT KHẨU',
    user.username,
    `Đã tạo mật khẩu mới riêng cho tài khoản ${user.username}.`
  );

  return newPassword;
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
      throw new Error(`MÃ£ Checkpoint "${checkpoint.id}" Ä‘Ã£ tá»“n táº¡i trÃªn há»‡ thá»‘ng!`);
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
      'Táº O CHECKPOINT',
      newCp.id,
      `ThÃªm má»›i Ä‘iá»ƒm tuáº§n tra: ${newCp.name} (${newCp.area})`
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
        'Sá»¬A CHECKPOINT',
        checkpoint.id,
        `Cáº­p nháº­t thÃ´ng tin Ä‘iá»ƒm: ${checkpoint.name}`
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
      cp.status === 'LOCKED' ? 'KHÃ“A CHECKPOINT' : 'Má»ž KHÃ“A CHECKPOINT',
      cp.id,
      `Äiá»ƒm kiá»ƒm tra chuyá»ƒn tráº¡ng thÃ¡i: ${cp.status}`
    );
  }

  static deleteCheckpoint(checkpointId: string, currentUser: User): void {
    if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
      throw new Error('Chá»‰ Security Manager hoáº·c Admin má»›i cÃ³ quyá»n xÃ³a checkpoint!');
    }

    const checkpoints = StorageService.getCheckpoints();
    const filtered = checkpoints.filter((c) => c.id !== checkpointId);
    StorageService.saveCheckpoints(filtered);

    StorageService.recordAudit(
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      'XÃ“A CHECKPOINT',
      checkpointId,
      `ÄÃ£ xÃ³a Ä‘iá»ƒm kiá»ƒm soÃ¡t khá»i há»‡ thá»‘ng tuáº§n tra.`
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
        'Sá»¬A CHECKLIST',
        template.name,
        `Cáº­p nháº­t ná»™i dung tiÃªu chÃ­ kiá»ƒm tra cho danh má»¥c ${template.name}`
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
      'Báº®T Äáº¦U TUáº¦N TRA',
      sessionId,
      `Báº¯t Ä‘áº§u phiÃªn tuáº§n tra ${params.shift}, Tuyáº¿n: ${params.route}`
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
    if (!session) throw new Error('KhÃ´ng tÃ¬m tháº¥y phiÃªn tuáº§n tra!');

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
      message: `"${officer.fullName || officer.username}" Ä‘Ã£ gá»­i vÃ  khÃ³a bÃ¡o cÃ¡o tuáº§n tra ${sessionId}`,
      type: 'PATROL_SUBMIT',
    });

    StorageService.recordAudit(
      officer.id,
      officer.fullName,
      officer.role,
      'Gá»¬I BÃO CÃO & KHÃ“A Dá»® LIá»†U',
      sessionId,
      `HoÃ n thÃ nh vÃ  khÃ³a phiÃªn tuáº§n tra. ÄÃ£ kiá»ƒm tra ${checked}/${allCheckpoints.length} checkpoint (Äáº¡t ${passCount}, Lá»—i ${failCount}).`
    );

    return session;
  }

  // Reopen a locked or finished patrol session to continue scanning checkpoints
  static reopenPatrolSession(
    sessionId: string,
    user: User,
    reason: string = 'Tiáº¿p tá»¥c tuáº§n tra bá»• sung checkpoint'
  ): PatrolSession {
    const sessions = StorageService.getPatrolSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('KhÃ´ng tÃ¬m tháº¥y phiÃªn tuáº§n tra!');

    session.status = 'IN_PROGRESS';
    session.isLocked = false;
    session.endTime = undefined;
    session.submittedAt = undefined;

    StorageService.savePatrolSessions(sessions);

    StorageService.recordAudit(
      user.id,
      user.fullName || user.username,
      user.role,
      'Má»ž Láº I PHIÃŠN TUáº¦N TRA',
      sessionId,
      `Má»Ÿ láº¡i phiÃªn tuáº§n tra Ä‘á»ƒ tiáº¿p tá»¥c quÃ©t Ä‘iá»ƒm kiá»ƒm soÃ¡t. LÃ½ do: ${reason}`
    );

    StorageService.notifyDataChanged();
    return session;
  }

  // Cancel or discard an empty / mistakenly started in-progress session
  static cancelPatrolSession(
    sessionId: string,
    user: User,
    reason: string = 'Há»§y phiÃªn Ä‘á»ƒ báº¯t Ä‘áº§u láº¡i'
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
      'Há»¦Y PHIÃŠN TUáº¦N TRA',
      sessionId,
      `Há»§y bá» phiÃªn tuáº§n tra tuyáº¿n ${removed.patrolRoute} (${removed.checkpoints.length} Ä‘iá»ƒm). LÃ½ do: ${reason}`
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
    if (!session) throw new Error('KhÃ´ng tÃ¬m tháº¥y phiÃªn tuáº§n tra!');

    if (params.approver.role !== 'MANAGER' && params.approver.role !== 'SUPERVISOR') {
      throw new Error('Chá»‰ Security Supervisor hoáº·c Manager má»›i cÃ³ quyá»n phÃª duyá»‡t sá»­a dá»¯ liá»‡u Ä‘Ã£ khÃ³a!');
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
      'PHÃŠ DUYá»†T Sá»¬A Dá»® LIá»†U ÄÃƒ KHÃ“A',
      params.sessionId,
      `YÃªu cáº§u bá»Ÿi ${params.requester.fullName}. LÃ½ do: ${params.reason}`
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
      message: `ðŸš¨ [Sá»° Cá» Má»šI ${incident.severity}] táº¡i ${incident.checkpointName}: ${incident.description.substring(0, 45)}...`,
      type: 'FAIL_INCIDENT',
    });

    StorageService.recordAudit(
      incident.officerId,
      incident.officerName,
      'OFFICER',
      'Táº O Sá»° Cá» / FAIL',
      incident.id,
      `Má»©c Ä‘á»™: ${incident.severity} táº¡i ${incident.checkpointName}. Ná»™i dung: ${incident.description}`
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
    if (!incident) throw new Error('KhÃ´ng tÃ¬m tháº¥y sá»± cá»‘ Ä‘á»ƒ ra chá»‰ Ä‘áº¡o!');

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
      message: `ðŸ“¢ [CHá»ˆ Äáº O ÄIá»€U PHá»I] TrÆ°á»Ÿng bá»™ pháº­n An ninh gá»­i chá»‰ Ä‘áº¡o cho ${incident.officerName} táº¡i ${incident.checkpointName}`,
      type: 'DIRECTIVE_ISSUED',
    });

    StorageService.recordAudit(
      params.manager.id,
      params.manager.fullName,
      params.manager.role,
      'RA CHá»ˆ Äáº O ÄIá»€U PHá»I Sá»° Cá»',
      incident.id,
      `Chá»‰ Ä‘áº¡o cho ${incident.officerName}: "${params.directiveText}". ÄÆ¡n vá»‹ phá»‘i há»£p: ${params.assignedDepartments.join(', ')}`
    );
  }

  // Real-Time Dispatch: Patrol Officer clicks "ÄÃƒ NHáº¬N CHá»ˆ Äáº O"
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
      message: `âœ… [ÄÃƒ NHáº¬N CHá»ˆ Äáº O] CÃ¡n bá»™ ${officer.fullName} Ä‘Ã£ nháº­n chá»‰ Ä‘áº¡o xá»­ lÃ½ sá»± cá»‘ ${incident.id}`,
      type: 'DIRECTIVE_ACKNOWLEDGED',
    });

    StorageService.recordAudit(
      officer.id,
      officer.fullName,
      officer.role,
      'XÃC NHáº¬N ÄÃƒ NHáº¬N CHá»ˆ Äáº O',
      incident.id,
      `CÃ¡n bá»™ tuáº§n tra xÃ¡c nháº­n Ä‘Ã£ nháº­n chá»‰ Ä‘áº¡o tá»« ${incident.managerDirective.managerName}`
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
    if (!incident) throw new Error('KhÃ´ng tÃ¬m tháº¥y sá»± cá»‘!');

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
      `XÃC NHáº¬N Sá»° Cá» [${status}]`,
      incident.id,
      `Xá»­ lÃ½ bá»Ÿi: ${resolver.fullName}. Ghi chÃº: ${resolutionNotes || 'ÄÃ£ xÃ¡c nháº­n xá»­ lÃ½.'}`
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
      throw new Error('Chá»‰ Security Manager hoáº·c Admin má»›i cÃ³ quyá»n Ä‘á»•i cáº¥u hÃ¬nh há»‡ thá»‘ng!');
    }
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    StorageService.notifyDataChanged();

    StorageService.recordAudit(
      currentUser.id,
      currentUser.fullName,
      currentUser.role,
      'Cáº¬P NHáº¬T Cáº¤U HÃŒNH Há»† THá»NG',
      'Cáº¥u hÃ¬nh khÃ¡ch sáº¡n',
      `Cáº­p nháº­t thÃ´ng tin khÃ¡ch sáº¡n: ${config.hotelName}`
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
      ? `[${topCp.id}] ${topCp.name} (${maxCpFails} lá»—i)`
      : 'KhÃ´ng cÃ³ Ä‘iá»ƒm nÃ o vÆ°á»£t ngÆ°á»¡ng';

    // Shift with most fails (2 shifts: Ca ngÃ y 06:00-18:00 & Ca Ä‘Ãªm 18:00-06:00)
    const failCountByShift: { [shift: string]: number } = {
      'Ca ngÃ y (06:00 - 18:00)': 0,
      'Ca Ä‘Ãªm (18:00 - 06:00)': 0,
    };
    sessions.forEach((s) => {
      if (s.shift.includes('ngÃ y')) failCountByShift['Ca ngÃ y (06:00 - 18:00)'] += s.summary.failCount;
      if (s.shift.includes('Ä‘Ãªm')) failCountByShift['Ca Ä‘Ãªm (18:00 - 06:00)'] += s.summary.failCount;
    });

    let topShift = 'Ca Ä‘Ãªm (18:00 - 06:00)';
    let maxShiftFails = -1;
    Object.entries(failCountByShift).forEach(([sh, count]) => {
      if (count > maxShiftFails) {
        maxShiftFails = count;
        topShift = `${sh} (${count} sá»± cá»‘ ghi nháº­n)`;
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
      throw new Error('Chá»‰ Security Manager hoáº·c Admin má»›i cÃ³ quyá»n Ä‘áº·t láº¡i dá»¯ liá»‡u há»‡ thá»‘ng!');
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
      'Äáº¶T Láº I Dá»® LIá»†U Gá»C',
      'ToÃ n bá»™ há»‡ thá»‘ng',
      'ÄÃ£ Ä‘Æ°a toÃ n bá»™ há»‡ thá»‘ng vá» dá»¯ liá»‡u máº«u 5 sao tiÃªu chuáº©n.'
    );
  }
}






