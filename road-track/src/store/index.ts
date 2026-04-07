import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Report, GPSData, AppMode, DamageType, ReportStatus } from '@/types';

const API_BASE = '/api';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

interface AppStore {
  mode: AppMode;
  reports: Report[];
  gps: GPSData | null;
  deviceId: string;
  selectedReportId: string | null;
  loading: boolean;
  lastUpdated: number;
  online: boolean;
  realTimeEnabled: boolean;
  
  setMode: (mode: AppMode) => void;
  setGPS: (gps: GPSData) => void;
  setOnline: (online: boolean) => void;
  setRealTimeEnabled: (enabled: boolean) => void;
  addReport: (data: { imageUrl: string; lat: number; lng: number; address?: string; damageType: DamageType; severity: number; description?: string }) => Promise<{ success: boolean; merged?: boolean }>;
  updateReport: (id: string, updates: Partial<Report>) => Promise<void>;
  selectReport: (id: string | null) => void;
  loadReports: () => Promise<void>;
  refreshReports: () => Promise<void>;
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      mode: 'report',
      reports: [],
      gps: null,
      deviceId: generateId(),
      selectedReportId: null,
      loading: false,
      lastUpdated: 0,
      online: true,
      realTimeEnabled: false,

      setMode: (mode) => set({ mode }),
      
      setGPS: (gps) => set({ gps }),
      
      setOnline: (online) => set({ online }),
      
      setRealTimeEnabled: (enabled) => set({ realTimeEnabled: enabled }),

      addReport: async (data) => {
        const { deviceId } = get();
        
        try {
          const res = await fetch(`${API_BASE}/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, deviceId }),
          });

          const result = await res.json();

          if (result.success) {
            await get().loadReports();
            return result;
          }

          throw new Error(result.error);
        } catch (error) {
          console.error('Failed to create report:', error);
          set({ loading: false });
          return { success: false };
        }
      },

      updateReport: async (id, updates) => {
        try {
          const res = await fetch(`${API_BASE}/reports`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates }),
          });

          const result = await res.json();

          if (result.success) {
            set((state) => ({
              reports: state.reports.map((r) => r.id === id ? result.report : r),
            }));
          }
        } catch (error) {
          console.error('Failed to update report:', error);
        }
      },

      selectReport: (id) => set({ selectedReportId: id }),

      loadReports: async () => {
        set({ loading: true });
        
        try {
          const res = await fetch(`${API_BASE}/reports?limit=100`);
          const data = await res.json();
          
          if (data.reports) {
            set({ 
              reports: data.reports,
              lastUpdated: data.lastUpdated || Date.now(),
            });
          }
        } catch (error) {
          console.error('Failed to load reports:', error);
        } finally {
          set({ loading: false });
        }
      },

      refreshReports: async () => {
        try {
          const res = await fetch(`${API_BASE}/reports?limit=100`);
          const data = await res.json();
          
          if (data.reports) {
            set({ 
              reports: data.reports,
              lastUpdated: data.lastUpdated || Date.now(),
            });
          }
        } catch (error) {
          console.error('Failed to refresh:', error);
        }
      },
    }),
    {
      name: 'roadtrack-v1',
      partialize: (state) => ({ 
        deviceId: state.deviceId,
      }),
    }
  )
);

let refreshInterval: ReturnType<typeof setInterval> | null = null;
let lastDataHash = '';

function hashData(data: any[]): string {
  return JSON.stringify(data.map(r => r.id + '-' + r.status + '-' + r.updatedAt).sort());
}

export function startAutoRefresh() {
  if (refreshInterval) return;
  
  const checkAndSync = async () => {
    if (useStore.getState().realTimeEnabled) {
      try {
        const res = await fetch(`${API_BASE}/reports?limit=100`);
        const data = await res.json();
        if (data.reports) {
          const newHash = hashData(data.reports);
          if (newHash !== lastDataHash) {
            lastDataHash = newHash;
            useStore.setState({ 
              reports: data.reports,
              lastUpdated: data.lastUpdated || Date.now(),
            });
          }
        }
      } catch (e) {
        console.error('Sync error:', e);
      }
    }
  };
  
  checkAndSync();
  refreshInterval = setInterval(checkAndSync, 3000);
}

export function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}
