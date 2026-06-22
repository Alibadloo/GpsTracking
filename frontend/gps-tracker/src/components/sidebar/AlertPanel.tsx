import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchAlerts, clearUnreadAlerts } from '../../store/trackingSlice';
import { alertApi } from '../../services/api';
import { AlertTriangle, Info, Zap, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SEVERITY_CONFIG = {
  Info:     { icon: <Info size={13} />,           color: '#3B82F6', bg: 'bg-blue-500/10' },
  Warning:  { icon: <AlertTriangle size={13} />,  color: '#F59E0B', bg: 'bg-amber-500/10' },
  Critical: { icon: <Zap size={13} />,            color: '#EF4444', bg: 'bg-red-500/10' },
};

export default function AlertPanel() {
  const dispatch = useAppDispatch();
  const { alerts, unreadAlerts } = useAppSelector(s => s.tracking);

  useEffect(() => {
    dispatch(fetchAlerts());
    dispatch(clearUnreadAlerts());
  }, [dispatch]);

  const handleMarkAllRead = async () => {
    await alertApi.markAllRead();
    dispatch(fetchAlerts());
    dispatch(clearUnreadAlerts());
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">Alerts</h2>
          {unreadAlerts > 0 && (
            <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unreadAlerts}</span>
          )}
        </div>
        {alerts.some(a => !a.isRead) && (
          <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
            <CheckCheck size={12} /> Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-xs">
            <CheckCheck size={24} className="mb-2 opacity-50" />
            No alerts yet
          </div>
        )}

        {alerts.map(alert => {
          const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.Info;
          return (
            <div
              key={alert.id}
              className={`p-3 border-b border-slate-700/20 ${!alert.isRead ? 'border-l-2 border-l-amber-500' : ''}`}
            >
              <div className="flex items-start gap-2">
                <div className={`p-1 rounded ${cfg.bg} flex-shrink-0 mt-0.5`} style={{ color: cfg.color }}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{alert.deviceName}</span>
                    <span className="text-xs text-slate-600">
                      {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
