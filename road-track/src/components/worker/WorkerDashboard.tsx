'use client';

import { useState, useEffect } from 'react';
import { Report, ReportStatus, DamageType, DAMAGE_TYPE_LABELS, REPORT_STATUS_LABELS, REPORT_STATUS_COLORS, WorkerTab } from '@/types';
import toast from 'react-hot-toast';

interface WorkerDashboardProps {
  workerId: string;
  workerName: string;
  workerZone?: string;
}

export default function WorkerDashboard({ workerId, workerName, workerZone }: WorkerDashboardProps) {
  const [tab, setTab] = useState<WorkerTab>('tasks');

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex gap-1 bg-zinc-800/50 rounded-xl p-1 mb-6">
        {([['tasks', '📋 Tasks'], ['offline', '📡 Offline'], ['resources', '🔧 Resources']] as [WorkerTab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === key ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'tasks' && <TaskQueueTab workerId={workerId} workerName={workerName} />}
      {tab === 'offline' && <OfflineTab workerId={workerId} />}
      {tab === 'resources' && <ResourceTab workerId={workerId} />}
    </div>
  );
}

function TaskQueueTab({ workerId, workerName }: { workerId: string; workerName: string }) {
  const [tasks, setTasks] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Report | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await fetch('/api/reports?limit=100');
      const data = await res.json();
      const unassigned = (data.reports || []).filter(
        (r: Report) => r.status === ReportStatus.ACTIVE || r.status === ReportStatus.VERIFIED
      );
      const myTasks = (data.reports || []).filter(
        (r: Report) => r.assignedTo === workerId && r.status !== ReportStatus.RESOLVED
      );
      setTasks([...myTasks, ...unassigned].sort((a, b) => b.priority - a.priority));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const acceptTask = async (report: Report) => {
    try {
      await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: report.id,
          assignedTo: workerId,
          assignedAt: Date.now(),
          status: ReportStatus.IN_PROGRESS,
        }),
      });
      toast.success('Task accepted!');
      loadTasks();
    } catch {
      toast.error('Failed to accept task');
    }
  };

  const completeTask = async (report: Report, afterImage: string) => {
    try {
      const res = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: report.id,
          status: ReportStatus.RESOLVED,
          afterImages: [...(report.afterImages || []), afterImage],
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Task completed! Great work!');
        setShowDetail(false);
        setSelectedTask(null);
        loadTasks();
      }
    } catch {
      toast.error('Failed to complete task');
    }
  };

  if (loading) return <div className="text-center py-12 text-zinc-500">Loading tasks...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{tasks.length} Tasks Available</h3>
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
          <p className="text-zinc-400">No tasks available right now.</p>
        </div>
      )}

      {tasks.map(task => (
        <div key={task.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-600">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 10,15" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{DAMAGE_TYPE_LABELS[task.damageType]}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                  P{task.priority}
                </span>
              </div>
              {task.description && <p className="text-xs text-zinc-400 truncate">{task.description}</p>}
              {task.address && <p className="text-xs text-zinc-500 mt-1">📍 {task.address}</p>}
              <p className="text-xs text-zinc-500 mt-1">
                {task.assignedTo === workerId ? '✅ Your Task' : 'Unassigned'}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { setSelectedTask(task); setShowDetail(true); }}
              className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors"
            >
              View Details
            </button>
            {task.assignedTo !== workerId && (
              <button
                onClick={() => acceptTask(task)}
                className="flex-1 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors"
              >
                Accept Task
              </button>
            )}
          </div>
        </div>
      ))}

      {showDetail && selectedTask && (
        <TaskDetailModal
          report={selectedTask}
          workerId={workerId}
          workerName={workerName}
          onComplete={completeTask}
          onClose={() => { setShowDetail(false); setSelectedTask(null); }}
        />
      )}
    </div>
  );
}

function TaskDetailModal({ report, workerId, workerName, onComplete, onClose }: {
  report: Report;
  workerId: string;
  workerName: string;
  onComplete: (report: Report, image: string) => void;
  onClose: () => void;
}) {
  const [afterImage, setAfterImage] = useState('');
  const [notes, setNotes] = useState('');

  const handleAfterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      setAfterImage(data.url);
      toast.success('After photo uploaded');
    } catch {
      toast.error('Upload failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-800 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Task Details</h3>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
          </div>

          <div className="space-y-4">
            <div className="w-full h-48 rounded-xl bg-zinc-800 flex items-center justify-center">
              <div className="text-center text-zinc-500">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 10,15" />
                </svg>
                <p className="text-sm">Photo reference</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-zinc-800">
                <div className="text-zinc-400 text-xs">Type</div>
                <div className="font-medium">{DAMAGE_TYPE_LABELS[report.damageType]}</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800">
                <div className="text-zinc-400 text-xs">Priority</div>
                <div className="font-medium text-red-400">{report.priority}/10</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800">
                <div className="text-zinc-400 text-xs">Severity</div>
                <div className="font-medium">{report.severity}/10</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800">
                <div className="text-zinc-400 text-xs">Verifications</div>
                <div className="font-medium">{report.verificationCount}</div>
              </div>
            </div>

            {report.description && (
              <div className="p-3 rounded-lg bg-zinc-800">
                <div className="text-zinc-400 text-xs mb-1">Description</div>
                <div className="text-sm">{report.description}</div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-zinc-800">
              <div className="text-zinc-400 text-xs mb-1">Location</div>
              <div className="text-sm">{report.lat.toFixed(6)}, {report.lng.toFixed(6)}</div>
              {report.address && <div className="text-xs text-zinc-400 mt-1">{report.address}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">After Photo (Required to Complete)</label>
              <div className="p-4 rounded-lg border-2 border-dashed border-zinc-700 text-center">
                {afterImage ? (
                  <div className="max-h-48 mx-auto bg-zinc-800 rounded-lg flex items-center justify-center p-8">
                    <div className="text-center text-zinc-400">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <p className="text-sm">After photo uploaded</p>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer text-zinc-400">
                    <span className="text-2xl">📷</span>
                    <p className="text-sm mt-2">Upload after photo</p>
                    <input type="file" accept="image/*" onChange={handleAfterUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-white resize-none"
                placeholder="Work notes..."
              />
            </div>

            <button
              onClick={() => onComplete(report, afterImage)}
              disabled={!afterImage}
              className="w-full py-3 rounded-lg bg-green-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-500 transition-colors"
            >
              ✅ Mark as Resolved
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OfflineTab({ workerId }: { workerId: string }) {
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const stored = localStorage.getItem('rt-offline-queue');
    if (stored) setOfflineQueue(JSON.parse(stored));

    const handleOnline = () => {
      setIsOnline(true);
      syncOffline();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOffline = async () => {
    const queue = JSON.parse(localStorage.getItem('rt-offline-queue') || '[]');
    for (const item of queue) {
      try {
        await fetch('/api/reports', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      } catch (e) {
        console.error('Sync failed for', item.id);
      }
    }
    localStorage.removeItem('rt-offline-queue');
    setOfflineQueue([]);
    toast.success('Offline data synced!');
  };

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-xl ${isOnline ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{isOnline ? '🟢' : '🔴'}</span>
          <div>
            <p className="font-semibold">{isOnline ? 'Online' : 'Offline Mode'}</p>
            <p className="text-xs text-zinc-400">
              {isOnline ? 'All changes sync automatically' : 'Changes will sync when back online'}
            </p>
          </div>
        </div>
      </div>

      {offlineQueue.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Pending Sync ({offlineQueue.length})</h4>
          {offlineQueue.map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-zinc-800 text-sm mb-2">
              {item.status} — {item.id?.slice(0, 12)}...
            </div>
          ))}
          {isOnline && (
            <button onClick={syncOffline} className="w-full py-2.5 rounded-lg bg-white text-black font-semibold text-sm">
              Sync Now
            </button>
          )}
        </div>
      )}

      {offlineQueue.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <p>No offline data pending</p>
        </div>
      )}
    </div>
  );
}

function ResourceTab({ workerId }: { workerId: string }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [reportId, setReportId] = useState('');
  const [resource, setResource] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('bags');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetch(`/api/resources?workerId=${workerId}`)
      .then(res => res.json())
      .then(data => setRequests(data.resourceRequests || []));
  }, [workerId]);

  const submitRequest = async () => {
    if (!reportId || !resource) {
      toast.error('Report and resource required');
      return;
    }
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, resource, quantity, unit, notes }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Resource request submitted');
        setShowForm(false);
        setRequests(prev => [...prev, data.resourceRequest]);
      }
    } catch {
      toast.error('Failed to submit request');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Resource Requests</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold"
        >
          + New Request
        </button>
      </div>

      {showForm && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
          <input
            type="text"
            value={reportId}
            onChange={e => setReportId(e.target.value)}
            placeholder="Report ID"
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm"
          />
          <input
            type="text"
            value={resource}
            onChange={e => setResource(e.target.value)}
            placeholder="Resource needed (e.g., asphalt, cement)"
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm"
          />
          <div className="flex gap-3">
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value))}
              className="w-24 px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm"
              min="1"
            />
            <select
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm"
            >
              <option value="bags">Bags</option>
              <option value="tons">Tons</option>
              <option value="liters">Liters</option>
              <option value="pieces">Pieces</option>
              <option value="meters">Meters</option>
            </select>
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Additional notes..."
            rows={2}
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm resize-none"
          />
          <button onClick={submitRequest} className="w-full py-2.5 rounded-lg bg-white text-black font-semibold text-sm">
            Submit Request
          </button>
        </div>
      )}

      {requests.length === 0 && !showForm && (
        <div className="text-center py-12 text-zinc-500">
          <p>No resource requests yet</p>
        </div>
      )}

      {requests.map(req => (
        <div key={req.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">{req.resource}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              req.status === 'approved' ? 'bg-green-500/20 text-green-400' :
              req.status === 'denied' ? 'bg-red-500/20 text-red-400' :
              req.status === 'fulfilled' ? 'bg-blue-500/20 text-blue-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {req.status}
            </span>
          </div>
          <p className="text-xs text-zinc-400">{req.quantity} {req.unit} • {req.reportId?.slice(0, 12)}...</p>
          {req.notes && <p className="text-xs text-zinc-500 mt-1">{req.notes}</p>}
        </div>
      ))}
    </div>
  );
}
