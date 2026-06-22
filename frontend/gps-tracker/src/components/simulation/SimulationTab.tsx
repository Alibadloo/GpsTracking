import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { setSimulatorRunning, fetchDevices, fetchAlerts, fetchRouteHistory, setShowRoute } from '../../store/trackingSlice';
import { simulatorApi } from '../../services/api';
import { Play, Square, Radio, Cpu, MapPin, Zap, Info, Navigation, Route, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TYPE_ICONS: Record<string, string> = {
  Car: '🚗', Truck: '🚛', Van: '🚐', Motorcycle: '🏍️', Equipment: '⚙️', Person: '🧍',
};

export default function SimulationTab() {
  const dispatch = useAppDispatch();
  const { simulatorRunning, devices, liveLocations, selectedDeviceId, showRoute } = useAppSelector(s => s.tracking);
  const [loading, setLoading] = useState(false);

  const simDevices = devices.filter(d => d.isSimulated);

  useEffect(() => {
    simulatorApi.status().then(s => dispatch(setSimulatorRunning(s.running))).catch(() => {});
  }, [dispatch]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (simulatorRunning) {
        await simulatorApi.stop();
        dispatch(setSimulatorRunning(false));
      } else {
        await simulatorApi.start();
        dispatch(setSimulatorRunning(true));
        setTimeout(() => { dispatch(fetchDevices()); dispatch(fetchAlerts()); }, 2000);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleRouteHistory = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (showRoute && selectedDeviceId === id) {
      dispatch(setShowRoute(false));
    } else {
      dispatch({ type: 'tracking/selectDevice', payload: id });
      dispatch(fetchRouteHistory(id));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={14} className="text-indigo-400" />
          <span className="text-xs font-semibold text-white uppercase tracking-wider">Demo Simulator</span>
          {simulatorRunning && (
            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live
            </span>
          )}
        </div>

        {!simulatorRunning && (
          <div className="mb-3 p-2.5 bg-slate-800 rounded-lg text-xs text-slate-400 flex items-start gap-2">
            <Info size={12} className="flex-shrink-0 mt-0.5 text-indigo-400" />
            <span>
              Simulates 5 vehicles on real Tehran routes in real-time via WebSocket. No GPS hardware needed.
            </span>
          </div>
        )}

        {simulatorRunning && (
          <div className="mb-3 grid grid-cols-3 gap-2 text-center">
            {[
              { icon: <Radio size={11} />, label: 'WebSocket', color: 'text-emerald-400' },
              { icon: <MapPin size={11} />, label: `${simDevices.length} Vehicles`, color: 'text-indigo-400' },
              { icon: <Zap size={11} />, label: '1.5s tick', color: 'text-amber-400' },
            ].map((item, i) => (
              <div key={i} className="bg-slate-800 rounded-lg py-2 px-1">
                <div className={`flex justify-center mb-1 ${item.color}`}>{item.icon}</div>
                <div className="text-xs text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleToggle}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            simulatorRunning
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
              : 'bg-indigo-500 hover:bg-indigo-600 text-white'
          } disabled:opacity-50`}
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : simulatorRunning
              ? <><Square size={14} /> Stop Simulation</>
              : <><Play size={14} /> Start Simulation</>
          }
        </button>
      </div>

      {/* Simulated vehicle list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-3 pb-1">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Demo Vehicles</span>
        </div>

        {!simulatorRunning && simDevices.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-slate-600 text-xs text-center px-4">
            <Play size={20} className="mb-2 opacity-40" />
            Start simulation to see vehicles appear on the map
          </div>
        )}

        {simDevices.map(device => {
          const live = liveLocations[device.id];
          const isSelected = selectedDeviceId === device.id;
          const speed = live?.speed ?? device.lastSpeed ?? 0;
          const isActive = device.status === 'Active';
          const lastSeen = device.lastSeen
            ? formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })
            : '—';

          return (
            <div
              key={device.id}
              onClick={() => dispatch({ type: 'tracking/selectDevice', payload: isSelected ? null : device.id })}
              className={`p-3 mx-2 mb-1 rounded-xl cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-indigo-500/10 border-indigo-500/40'
                  : 'border-transparent hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: `${device.color}20`, border: `1.5px solid ${device.color}50` }}>
                  {TYPE_ICONS[device.type] ?? '📍'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{device.name}</p>
                  <p className="text-xs text-slate-500">{device.plateNumber}</p>
                </div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              </div>

              {isActive && (
                <div className="mt-2 flex items-center gap-3 text-xs pl-10">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Navigation size={10} />{Math.round(speed)} km/h
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock size={10} />{lastSeen}
                  </span>
                  <button
                    onClick={e => handleRouteHistory(e, device.id)}
                    className={`ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors text-xs ${
                      showRoute && isSelected ? 'text-indigo-400' : 'text-slate-600 hover:text-indigo-400'
                    }`}
                  >
                    <Route size={10} />Route
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
