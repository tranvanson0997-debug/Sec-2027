export type UserRole = 'MANAGER' | 'SUPERVISOR' | 'OFFICER' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  badgeNumber: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'LOCKED';
  failedLoginAttempts: number;
  lastLogin?: string;
  lastLogout?: string;
  passwordHash?: string; // Stored hash or simulation string
  createdAt: string;
}

export type CheckpointStatus = 'ACTIVE' | 'LOCKED';

export interface Checkpoint {
  id: string; // e.g. SEC-LBY-01
  name: string; // Sảnh chính
  area: string; // Khu vực: Khu công cộng, Tầng hầm, Hồ bơi...
  route: string; // Tuyến A, Tuyến B...
  order: number;
  status: CheckpointStatus;
  qrCodeValue: string;
  description: string;
  checklistId: string;
  createdAt: string;
}

export type ChecklistItemStatus = 'PASS' | 'FAIL' | 'NA';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface ChecklistItem {
  id: string;
  text: string;
  category?: 'AN_NINH' | 'PCCC' | 'AN_TOAN_KHACH' | 'VE_SINH_MY_QUAN' | 'KY_THUAT';
  isRequiredPhotoOnFail: boolean;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  items: ChecklistItem[];
}

export interface FailRecord {
  incidentId: string;
  itemId: string;
  itemText: string;
  description: string;
  severity: SeverityLevel;
  actionTaken: string;
  department: string;
  photoUrl: string; // Base64 data URL
  photoMetadata: {
    officerName: string;
    officerId: string;
    date: string;
    time: string;
    location: string;
    checkpointId: string;
    itemText: string;
    gpsCoordinates?: string;
  };
  status: IncidentStatus;
  supervisorConfirmed?: boolean;
  supervisorName?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface CheckpointInspectionResult {
  checkpointId: string;
  checkpointName: string;
  area: string;
  scannedAt: string;
  completedAt?: string;
  status: 'PASS' | 'FAIL' | 'INCOMPLETE';
  items: {
    itemId: string;
    itemText: string;
    status: ChecklistItemStatus;
    failRecord?: FailRecord;
  }[];
  notes?: string;
}

export interface EditAuditRecord {
  id: string;
  requestedBy: string;
  requestedRole: UserRole;
  approvedBy: string;
  approvedRole: UserRole;
  reason: string;
  beforeSummary: string;
  afterSummary: string;
  timestamp: string;
}

export interface PatrolSession {
  id: string; // PTR-YYYYMMDD-XXX
  officerId: string;
  officerName: string;
  badgeNumber: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss
  endTime?: string;
  shift: string; // Ca ngày (06:00 - 18:00) / Ca đêm (18:00 - 06:00)
  patrolRoute: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  isLocked: boolean; // Locked upon submit!
  checkpoints: CheckpointInspectionResult[];
  summary: {
    totalCheckpoints: number;
    checkedCount: number;
    uncheckedCount: number;
    passCount: number;
    failCount: number;
    naCount: number;
    completionRate: number;
    passRate: number;
  };
  editAuditHistory?: EditAuditRecord[];
  submittedAt?: string;
  createdAt: string;
  lastInspectedCheckpointId?: string;
  lastInspectedCheckpointName?: string;
  lastInspectedAt?: string;
  lastInspectedStatus?: 'PASS' | 'FAIL';
  currentActiveCheckpointId?: string;
}

export interface ManagerDirective {
  directiveId: string;
  directiveText: string;
  managerId: string;
  managerName: string;
  managerRole: UserRole;
  assignedDepartments: string[]; // e.g. ['Kỹ thuật PCCC', 'Housekeeping', 'Lễ tân', 'Đội cơ động']
  priority: SeverityLevel;
  issuedAt: string;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface Incident {
  id: string; // INC-YYYYMMDD-XXX
  sessionId: string;
  checkpointId: string;
  checkpointName: string;
  area: string;
  officerId: string;
  officerName: string;
  checklistText: string;
  severity: SeverityLevel;
  description: string;
  actionTaken: string;
  department: string;
  photoUrl: string;
  photoMetadata: {
    officerName: string;
    date: string;
    time: string;
    location: string;
    gpsCoordinates?: string;
  };
  status: IncidentStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  incidentType?: 'FAIL_ITEM' | 'EMERGENCY_REPORT';
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    displayString: string;
  };
  managerDirective?: ManagerDirective;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  target: string;
  details: string;
}

export interface DashboardStats {
  todayPatrolsCount: number;
  totalPatrolsCount: number;
  completionRate: number;
  passRate: number;
  totalCheckpointsChecked: number;
  totalFailsCount: number;
  openIncidentsCount: number;
  resolvedIncidentsCount: number;
  mostFailedCheckpoint: string;
  shiftWithMostFails: string;
  hourlyPatrolDistribution: { hour: string; count: number }[];
}

export interface HotelSystemConfig {
  hotelName: string;
  departmentName: string;
  address: string;
  hotline: string;
  logoUrl?: string;
  requireQrScan: boolean;
  allowSupervisorOverride: boolean;
  retentionDays?: number;
  requirePhotoOnFail?: boolean;
  watermarkHotelName?: boolean;
}

export interface OnlineUser {
  userId: string;
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  badgeNumber: string;
  shift: string;
  loginTime: string;
  lastActiveTime: string;
  currentAction?: string;
  status: 'ONLINE' | 'AWAY' | 'OFFLINE';
}

export interface AccessNotification {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  email: string;
  message: string;
  timestamp: string;
  type:
    | 'LOGIN'
    | 'PATROL_SUBMIT'
    | 'FAIL_INCIDENT'
    | 'LOGOUT'
    | 'DIRECTIVE_ISSUED'
    | 'DIRECTIVE_ACKNOWLEDGED';
}

