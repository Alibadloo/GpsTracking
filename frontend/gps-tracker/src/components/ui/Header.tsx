import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch';
import { fetchDevices, fetchAlerts, fetchGeofences, clearUnreadAlerts } from '../../store/trackingSlice';
import { MapPin, Bell, RefreshCw, Activity } from 'lucide-react';

export default function Header() {
  const dispatch = useAppDispatch();
  const { devices, simulatorRunning, unreadAlerts } = useAppSelector(s => s.tracking);
  const activeCount = devices.filter(d => d.status === 'Active').length;

  const handleRefresh = () => {
    dispatch(fetchDevices());
    dispatch(fetchAlerts());
    dispatch(fetchGeofences());
  };

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-slate-700/50 bg-slate-900 flex-shrink-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
          <MapPin size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-none">GPS Tracker</h1>
          <p className="text-xs text-slate-400 mt-0.5">Fleet & Asset Tracking</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {simulatorRunning && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
            <Activity size={12} className="animate-pulse" />
            Live — {activeCount} vehicles
          </div>
        )}

        <button onClick={handleRefresh} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <RefreshCw size={15} />
        </button>

        <button
          onClick={() => dispatch(clearUnreadAlerts())}
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Bell size={15} />
          {unreadAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-0.5">
              {unreadAlerts > 9 ? '9+' : unreadAlerts}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
