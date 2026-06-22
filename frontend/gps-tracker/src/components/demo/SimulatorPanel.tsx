import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { setSimulatorRunning, fetchDevices, fetchAlerts } from '../../store/trackingSlice';
import { simulatorApi } from '../../services/api';
import { Play, Square, Radio, Cpu, MapPin, Zap, Info } from 'lucide-react';

export default function SimulatorPanel() {
  const dispatch = useAppDispatch();
  const { simulatorRunning } = useAppSelector(s => s.tracking);
  const [loading, setLoading] = useState(false);

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
        setTimeout(() => {
          dispatch(fetchDevices());
          dispatch(fetchAlerts());
        }, 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border-t border-slate-700/50 bg-slate-900">
      <div className="flex items-center gap-2 mb-3">
        <Cpu size={14} className="text-indigo-400" />
        <span className="text-xs font-semibold text-white uppercase tracking-wider">Demo Simulator</span>
        {simulatorRunning && (
          <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        )}
      </div>

      {!simulatorRunning && (
        <div className="mb-3 p-2.5 bg-slate-800 rounded-lg text-xs text-slate-400 flex items-start gap-2">
          <Info size={12} className="flex-shrink-0 mt-0.5 text-indigo-400" />
          <span>Press Start to simulate 5 GPS vehicles moving across Tehran in real-time via WebSocket.</span>
        </div>
      )}

      {simulatorRunning && (
        <div className="mb-3 grid grid-cols-3 gap-2 text-center">
          {[
            { icon: <Radio size={12} />, label: 'Streaming', color: 'text-emerald-400' },
            { icon: <MapPin size={12} />, label: '5 Vehicles', color: 'text-indigo-400' },
            { icon: <Zap size={12} />, label: '1.5s tick', color: 'text-amber-400' },
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
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : simulatorRunning ? (
          <><Square size={14} /> Stop Simulation</>
        ) : (
          <><Play size={14} /> Start Simulation</>
        )}
      </button>
    </div>
  );
}
