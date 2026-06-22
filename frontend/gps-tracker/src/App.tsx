import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useAppDispatch, useAppSelector } from './hooks/useAppDispatch';
import { fetchDevices, fetchAlerts, fetchGeofences } from './store/trackingSlice';
import { useSignalR } from './hooks/useSignalR';
import TrackingMap from './components/map/TrackingMap';
import DeviceList from './components/sidebar/DeviceList';
import AlertPanel from './components/sidebar/AlertPanel';
import SimulationTab from './components/simulation/SimulationTab';
import RealGpsTab from './components/realgps/RealGpsTab';
import { MapPin, Bell, Cpu, Satellite, RefreshCw, Activity, Crosshair, X } from 'lucide-react';
import { selectDevice } from './store/trackingSlice';

type Tab = 'fleet' | 'simulation' | 'realgps' | 'alerts';

const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: 'fleet',      icon: <MapPin size={13} />,    label: 'Fleet' },
  { id: 'simulation', icon: <Cpu size={13} />,       label: 'Simulation' },
  { id: 'realgps',   icon: <Satellite size={13} />,  label: 'Real GPS' },
  { id: 'alerts',    icon: <Bell size={13} />,       label: 'Alerts' },
];

function AppContent() {
  const dispatch = useAppDispatch();
  const { simulatorRunning, unreadAlerts, selectedDeviceId, devices } = useAppSelector(s => s.tracking);
  const trackedDevice = selectedDeviceId ? devices.find(d => d.id === selectedDeviceId) : null;
  const [tab, setTab] = useState<Tab>('fleet');

  useSignalR();

  useEffect(() => {
    dispatch(fetchDevices());
    dispatch(fetchAlerts());
    dispatch(fetchGeofences());
  }, [dispatch]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-5 border-b border-slate-800 bg-slate-900 flex-shrink-0 z-10" style={{ height: '52px' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <MapPin size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">GPS Fleet Tracker</h1>
            <p className="text-xs text-slate-400 mt-0.5 leading-none">Real-time Asset Tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {trackedDevice && (
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              <Crosshair size={11} className="animate-pulse" />
              <span>Following <span className="font-bold text-white">{trackedDevice.name}</span></span>
              <button onClick={() => dispatch(selectDevice(null))} className="ml-0.5 text-indigo-400 hover:text-white">
                <X size={11} />
              </button>
            </div>
          )}
          {simulatorRunning && !trackedDevice && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <Activity size={11} className="animate-pulse" />Live Simulation
            </div>
          )}
          <button
            onClick={() => { dispatch(fetchDevices()); dispatch(fetchAlerts()); dispatch(fetchGeofences()); }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 flex flex-col border-r border-slate-800 bg-slate-900 flex-shrink-0">
          {/* Tab bar */}
          <div className="flex border-b border-slate-800 flex-shrink-0">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                  tab === t.id ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t.icon}
                <span style={{ fontSize: '9px' }}>{t.label}</span>
                {tab === t.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t" />
                )}
                {t.id === 'alerts' && unreadAlerts > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center px-0.5" style={{ fontSize: '9px' }}>
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {tab === 'fleet'      && <DeviceList />}
            {tab === 'simulation' && <SimulationTab />}
            {tab === 'realgps'   && <RealGpsTab />}
            {tab === 'alerts'    && <AlertPanel />}
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <TrackingMap />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
