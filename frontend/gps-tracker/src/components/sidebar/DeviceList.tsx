import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { selectDevice, fetchRouteHistory, setShowRoute } from '../../store/trackingSlice';
import { Navigation, WifiOff, Route, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG = {
  Active:  { color: '#10B981', bg: 'bg-emerald-500/10', label: 'Active' },
  Idle:    { color: '#F59E0B', bg: 'bg-amber-500/10',   label: 'Idle' },
  Offline: { color: '#475569', bg: 'bg-slate-700/50',   label: 'Offline' },
  Alert:   { color: '#EF4444', bg: 'bg-red-500/10',     label: 'Alert!' },
};

const TYPE_ICONS: Record<string, string> = {
  Car: '🚗', Truck: '🚛', Van: '🚐', Motorcycle: '🏍️', Equipment: '⚙️', Person: '🧍',
};

export default function DeviceList() {
  const dispatch = useAppDispatch();
  const { devices, selectedDeviceId, liveLocations, showRoute } = useAppSelector(s => s.tracking);

  const handleSelect = (id: number) => {
    dispatch(selectDevice(id === selectedDeviceId ? null : id));
  };

  const handleRouteHistory = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (showRoute && selectedDeviceId === id) {
      dispatch(setShowRoute(false));
    } else {
      dispatch(selectDevice(id));
      dispatch(fetchRouteHistory(id));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Fleet Vehicles</h2>
          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            {devices.filter(d => d.status === 'Active').length}/{devices.length} active
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {devices.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-xs">
            <WifiOff size={24} className="mb-2 opacity-50" />
            Start simulation to see vehicles
          </div>
        )}

        {devices.map(device => {
          const live = liveLocations[device.id];
          const st = STATUS_CONFIG[device.status] ?? STATUS_CONFIG.Offline;
          const isSelected = selectedDeviceId === device.id;
          const speed = live?.speed ?? device.lastSpeed ?? 0;
          const lastSeen = device.lastSeen ? formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true }) : 'never';

          return (
            <div
              key={device.id}
              onClick={() => handleSelect(device.id)}
              className={`p-3 border-b border-slate-700/30 cursor-pointer transition-all ${
                isSelected ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' : 'hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: `${device.color}18`, border: `1px solid ${device.color}40` }}>
                  {TYPE_ICONS[device.type] ?? '📍'}
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900"
                    style={{ background: st.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-white truncate">{device.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{device.plateNumber}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${st.bg}`} style={{ color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                </div>
              </div>

              {device.status === 'Active' && (
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Navigation size={10} />
                    {Math.round(speed)} km/h
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock size={10} />
                    {lastSeen}
                  </span>
                  <button
                    onClick={e => handleRouteHistory(e, device.id)}
                    className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                      showRoute && isSelected
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'text-slate-500 hover:text-indigo-400'
                    }`}
                  >
                    <Route size={10} />
                    Route
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
