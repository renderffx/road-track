export enum ReportStatus {
  GHOST = 'ghost',
  ACTIVE = 'active',
  VERIFIED = 'verified',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
}

export enum DamageType {
  POTHOLE = 'pothole',
  CRACK = 'crack',
  SINKHOLE = 'sinkhole',
  ROAD = 'road',
  LIGHT = 'light',
  DRAINAGE = 'drainage',
  OTHER = 'other',
}

export enum UserRole {
  CITIZEN = 'citizen',
  FIELD_WORKER = 'field_worker',
  ADMIN = 'admin',
}

export enum AnnouncementType {
  BLAST = 'blast',
  NEIGHBORHOOD = 'neighborhood',
  SYSTEM = 'system',
}

export enum ChatRole {
  CITIZEN = 'citizen',
  WORKER = 'worker',
  SYSTEM = 'system',
}

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  [DamageType.POTHOLE]: 'Pothole',
  [DamageType.CRACK]: 'Road Crack',
  [DamageType.SINKHOLE]: 'Sinkhole',
  [DamageType.ROAD]: 'Road Damage',
  [DamageType.LIGHT]: 'Street Light',
  [DamageType.DRAINAGE]: 'Drainage Issue',
  [DamageType.OTHER]: 'Other',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.GHOST]: 'Unverified',
  [ReportStatus.ACTIVE]: 'Pending',
  [ReportStatus.VERIFIED]: 'Verified',
  [ReportStatus.IN_PROGRESS]: 'In Progress',
  [ReportStatus.RESOLVED]: 'Resolved',
};

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  [ReportStatus.GHOST]: '#9CA3AF',
  [ReportStatus.ACTIVE]: '#F97316',
  [ReportStatus.VERIFIED]: '#3B82F6',
  [ReportStatus.IN_PROGRESS]: '#EAB308',
  [ReportStatus.RESOLVED]: '#22C55E',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CITIZEN]: 'Citizen',
  [UserRole.FIELD_WORKER]: 'Field Worker',
  [UserRole.ADMIN]: 'Administrator',
};

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: number;
  lastLogin?: number;
  isActive: boolean;
  workerZone?: string;
  workerSkills?: string[];
  citizenPoints: number;
  citizenReports: number;
  citizenResolved: number;
  citizenBadges: string[];
}

export interface Report {
  id: string;
  imageUrl: string;
  beforeImages?: string[];
  afterImages?: string[];
  videoUrl?: string;
  voiceNoteUrl?: string;
  lat: number;
  lng: number;
  address?: string;
  damageType: DamageType;
  severity: number;
  status: ReportStatus;
  priority: number;
  description?: string;
  userId?: string;
  deviceId: string;
  isAnonymous: boolean;
  verificationCount: number;
  verifiedBy?: string[];
  upvotes: string[];
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  assignedTo?: string;
  assignedAt?: number;
  notes?: string;
  aiValidated?: boolean;
  aiConfidence?: number;
  aiDetectedType?: DamageType;
  duplicateOf?: string;
  mergedCount?: number;
  predictedDate?: number;
  fraudFlag?: boolean;
  fraudReason?: string;
  workerLocationVerified?: boolean;
  resourceRequests?: ResourceRequest[];
  slaDeadline?: number;
  slaBreached?: boolean;
  repairCost?: number;
  neighborhood?: string;
  chatId?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  reportId: string;
  senderId: string;
  senderName: string;
  senderRole: ChatRole;
  content: string;
  timestamp: number;
  isRead: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  neighborhood?: string;
  createdBy: string;
  createdAt: number;
  expiresAt?: number;
  isActive: boolean;
  recipientCount?: number;
}

export interface BudgetEntry {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  month: number;
  year: number;
  createdAt: number;
}

export interface ResourceRequest {
  id: string;
  reportId: string;
  workerId: string;
  resource: string;
  quantity: number;
  unit: string;
  status: 'pending' | 'approved' | 'denied' | 'fulfilled';
  createdAt: number;
  notes?: string;
}

export interface GamificationRecord {
  userId: string;
  points: number;
  reportsSubmitted: number;
  reportsVerified: number;
  reportsResolved: number;
  badges: string[];
  rank: string;
  streakDays: number;
  lastActivity: number;
  leaderboardPosition?: number;
}

export interface PredictiveInsight {
  id: string;
  damageType: DamageType;
  lat: number;
  lng: number;
  neighborhood?: string;
  probability: number;
  predictedDate: number;
  basis: string;
  createdAt: number;
}

export interface GPSData {
  lat: number;
  lng: number;
  accuracy: number;
  speed?: number;
  timestamp: number;
}

export interface AdminStats {
  total: number;
  byStatus: Record<ReportStatus, number>;
  byType: Record<DamageType, number>;
  recentActivity: Report[];
  avgResolutionTime?: number;
  criticalCount: number;
}

export type AppMode = 'report' | 'reports';
export type DashboardTab = 'overview' | 'reports' | 'analytics' | 'dispatch' | 'budget' | 'announcements' | 'godmode';
export type CitizenTab = 'report' | 'tracker' | 'feed' | 'profile';
export type WorkerTab = 'tasks' | 'offline' | 'resources';
