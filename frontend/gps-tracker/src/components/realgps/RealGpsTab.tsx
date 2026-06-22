import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchDevices, selectDevice } from '../../store/trackingSlice';
import { deviceApi } from '../../services/api';
import {
  Plus, Satellite, Copy, Check, Navigation, Clock,
  ChevronDown, ChevronUp, Smartphone, Cpu, Radio, Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const DEVICE_TYPES = ['Car', 'Truck', 'Van', 'Motorcycle', 'Equipment', 'Person'];
const TYPE_ICONS: Record<string, string> = {
  Car: '🚗', Truck: '🚛', Van: '🚐', Motorcycle: '🏍️', Equipment: '⚙️', Person: '🧍',
};
const PRESET_COLORS = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

const API_BASE = window.location.origin.replace('5173', '5050');

interface CreatedDevice { id: number; name: string; }

// ─────────────────────────────────────────────
// GPS hardware integration guide
// ─────────────────────────────────────────────
const GUIDES = [
  {
    id: 'gpslogger',
    icon: <Smartphone size={14} />,
    title: 'GPSLogger (Android)',
    subtitle: 'Free app · Easy setup · Good for testing',
    badge: 'Recommended for testing',
    badgeColor: 'text-emerald-400 bg-emerald-500/10',
    steps: (deviceId: number) => [
      {
        label: 'Install GPSLogger',
        detail: 'Download "GPSLogger for Android" from Google Play (free, open source).',
      },
      {
        label: 'Open Logging Details → Custom URL',
        detail: 'In the app go to: Logging Details → Log to Custom URL.',
      },
      {
        label: 'Set the URL',
        detail: `${API_BASE}/api/locations`,
        isCode: true,
      },
      {
        label: 'Set HTTP Method to POST',
        detail: 'Change method from GET to POST.',
      },
      {
        label: 'Set the Body (JSON)',
        detail: `{"deviceId":${deviceId},"latitude":%LAT,"longitude":%LON,"speed":%SPD,"heading":%DIR,"altitude":%ALT,"timestamp":"%TIME"}`,
        isCode: true,
      },
      {
        label: 'Set Content-Type header',
        detail: 'Add header: Content-Type = application/json',
        isCode: false,
      },
      {
        label: 'Enable logging',
        detail: 'Start logging from the main screen. Your location will appear on the map in real time.',
      },
    ],
  },
  {
    id: 'teltonika',
    icon: <Cpu size={14} />,
    title: 'Teltonika FMB920 / FMB130',
    subtitle: 'Professional tracker · Direct HTTP support',
    badge: 'Professional hardware',
    badgeColor: 'text-indigo-400 bg-indigo-500/10',
    steps: (deviceId: number) => [
      {
        label: 'Connect via Teltonika Configurator',
        detail: 'Open Teltonika Configurator software. Connect the device via USB or Bluetooth.',
      },
      {
        label: 'Go to GPRS → Data Sending',
        detail: 'Navigate to: GPRS → Data Sending → Add New Record.',
      },
      {
        label: 'Set Protocol to HTTP',
        detail: 'Select "HTTP" as the protocol type.',
      },
      {
        label: 'Set server address',
        detail: `${API_BASE}/api/locations`,
        isCode: true,
      },
      {
        label: 'Set HTTP Method to POST',
        detail: 'Set Method = POST, Content-Type = application/json.',
      },
      {
        label: 'Configure JSON body',
        detail: `{"deviceId":${deviceId},"latitude":#{lat},"longitude":#{lon},"speed":#{speed},"heading":#{heading},"altitude":#{alt},"timestamp":"#{timestamp}"}`,
        isCode: true,
      },
      {
        label: 'Set data sending period',
        detail: 'Recommended: every 5–15 seconds for real-time tracking.',
      },
      {
        label: 'Save and upload configuration',
        detail: 'Click Save to device. The tracker will start POSTing data immediately once it has a GSM signal.',
      },
    ],
  },
  {
    id: 'custom',
    icon: <Radio size={14} />,
    title: 'Custom Hardware / IoT Module',
    subtitle: 'SIM7600 · SIM800 · ESP32 + GSM · Arduino',
    badge: 'Developer guide',
    badgeColor: 'text-amber-400 bg-amber-500/10',
    steps: (deviceId: number) => [
      {
        label: 'Required: GSM + GPS module',
        detail: 'Any module with HTTP AT commands: SIM7600, SIM800L, SIM7080G, A9G, or ESP32 with SIM module.',
      },
      {
        label: 'Read GPS coordinates',
        detail: 'Use AT+CGNSINF (SIM7600) or AT+CGNSPWR / AT+CGPSINF to get lat/lon/speed/heading.',
      },
      {
        label: 'Open HTTP connection',
        detail: [
          'AT+HTTPINIT',
          `AT+HTTPPARA="URL","${API_BASE}/api/locations"`,
          'AT+HTTPPARA="CONTENT","application/json"',
        ].join('\n'),
        isCode: true,
      },
      {
        label: 'Send POST request',
        detail: [
          'AT+HTTPDATA=<body_length>,10000',
          `{"deviceId":${deviceId},"latitude":<LAT>,"longitude":<LON>,"speed":<SPD>,"heading":<HDG>,"altitude":<ALT>}`,
          'AT+HTTPACTION=1',
          'AT+HTTPTERM',
        ].join('\n'),
        isCode: true,
      },
      {
        label: 'Repeat on interval',
        detail: 'Loop every 5–30 seconds depending on your power and data budget.',
      },
    ],
  },
];

function GuidePanel({ deviceId }: { deviceId: number }) {
  const [activeGuide, setActiveGuide] = useState<string | null>('gpslogger');
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(key);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="p-4 border-b border-slate-700/50">
      <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
        Integration Guide — Device ID: <span className="text-white bg-indigo-500/20 px-1.5 py-0.5 rounded">{deviceId}</span>
      </p>

      <div className="space-y-2">
        {GUIDES.map(guide => {
          const isOpen = activeGuide === guide.id;
          const steps = guide.steps(deviceId);
          return (
            <div key={guide.id} className="rounded-xl border border-slate-700/60 overflow-hidden">
              <button
                onClick={() => setActiveGuide(isOpen ? null : guide.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
              >
                <span className="text-slate-400">{guide.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{guide.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${guide.badgeColor}`}>
                      {guide.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{guide.subtitle}</p>
                </div>
                {isOpen ? <ChevronUp size={14} className="text-slate-500 flex-shrink-0" /> : <ChevronDown size={14} className="text-slate-500 flex-shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-3 py-3 space-y-3 bg-slate-900/40">
                  {steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-300 mb-1">{step.label}</p>
                        {step.isCode ? (
                          <div className="relative group">
                            <pre className="text-xs font-mono text-emerald-300 bg-slate-950 rounded-lg p-2.5 whitespace-pre-wrap break-all leading-relaxed border border-slate-800">
                              {step.detail}
                            </pre>
                            <button
                              onClick={() => copy(step.detail, `${guide.id}-${i}`)}
                              className="absolute top-1.5 right-1.5 p-1 rounded bg-slate-800 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                            >
                              {copiedStep === `${guide.id}-${i}`
                                ? <Check size={11} className="text-emerald-400" />
                                : <Copy size={11} />}
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 leading-relaxed">{step.detail}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function RealGpsTab() {
  const dispatch = useAppDispatch();
  const { devices, liveLocations, selectedDeviceId } = useAppSelector(s => s.tracking);
  const realDevices = devices.filter(d => !d.isSimulated);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', plateNumber: '', type: 'Car', color: '#6366F1' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdDevice, setCreatedDevice] = useState<CreatedDevice | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Device name is required.'); return; }
    setLoading(true); setError('');
    try {
      const device = await deviceApi.create(form);
      setCreatedDevice({ id: device.id, name: device.name });
      setForm({ name: '', plateNumber: '', type: 'Car', color: '#6366F1' });
      setShowForm(false);
      dispatch(fetchDevices());
    } catch {
      setError('Failed to create device. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deviceApi.delete(id);
      if (selectedDeviceId === id) dispatch(selectDevice(null));
      dispatch(fetchDevices());
      if (createdDevice?.id === id) setCreatedDevice(null);
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* ── Add device button ── */}
      <div className="p-4 border-b border-slate-700/50 flex-shrink-0">
        <button
          onClick={() => { setShowForm(v => !v); setCreatedDevice(null); }}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            showForm
              ? 'bg-slate-700 text-slate-300'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          <Plus size={15} />
          {showForm ? 'Cancel' : 'Register New GPS Device'}
        </button>
      </div>

      {/* ── Registration form ── */}
      {showForm && (
        <form onSubmit={handleCreate} className="p-4 border-b border-slate-700/50 space-y-3 bg-slate-800/20 flex-shrink-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Device Details</p>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Device Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              placeholder="e.g. Delivery Truck #1"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">License Plate / Serial</label>
            <input
              type="text"
              placeholder="e.g. ABC-1234 (optional)"
              value={form.plateNumber}
              onChange={e => setForm(f => ({ ...f, plateNumber: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Vehicle Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {DEVICE_TYPES.map(t => (
                <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-2">Map Color</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  title={c}
                  className={`w-7 h-7 rounded-full transition-all ${
                    form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Registering...' : 'Register Device & Get ID'}
          </button>
        </form>
      )}

      {/* ── Integration guide (shown after device creation) ── */}
      {createdDevice && (
        <div className="flex-shrink-0">
          <div className="px-4 pt-3 pb-2 flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            <span className="text-sm font-semibold text-white">
              "{createdDevice.name}" registered
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 ml-auto">
              ID: {createdDevice.id}
            </span>
          </div>
          <p className="px-4 pb-3 text-xs text-slate-400">
            Follow one of the guides below to connect your GPS hardware. Once configured, this device will appear live on the map.
          </p>
          <GuidePanel deviceId={createdDevice.id} />
        </div>
      )}

      {/* ── How it works (shown when no real devices and no guide open) ── */}
      {!createdDevice && !showForm && realDevices.length === 0 && (
        <div className="p-4 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <Satellite size={14} className="text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">How it works</span>
          </div>
          <ol className="space-y-3 text-xs text-slate-400">
            {[
              { n: '1', text: 'Register your GPS device above to get a unique Device ID.' },
              { n: '2', text: 'Configure your hardware or app with the Device ID and the API endpoint.' },
              { n: '3', text: 'Your device POSTs location updates to the server.' },
              { n: '4', text: 'Position appears on the map in real time via WebSocket.' },
            ].map(s => (
              <li key={s.n} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold flex-shrink-0 mt-0.5">{s.n}</span>
                <span className="leading-relaxed">{s.text}</span>
              </li>
            ))}
          </ol>

          <div className="mt-4 p-3 bg-slate-800/60 rounded-xl text-xs space-y-1">
            <p className="text-slate-400 font-semibold mb-2">API Endpoint</p>
            <p className="font-mono text-emerald-400">POST {API_BASE}/api/locations</p>
            <p className="text-slate-500 mt-2">Supported devices: GPSLogger Android, Teltonika FMB series, custom IoT/GSM modules</p>
          </div>
        </div>
      )}

      {/* ── Registered real devices list ── */}
      {realDevices.length > 0 && (
        <div className="flex-1">
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              Registered Devices ({realDevices.length})
            </span>
          </div>

          {realDevices.map(device => {
            const live = liveLocations[device.id];
            const speed = live?.speed ?? device.lastSpeed ?? 0;
            const isActive = device.status === 'Active';
            const isSelected = selectedDeviceId === device.id;
            const lastSeen = device.lastSeen
              ? formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })
              : 'No data received yet';

            return (
              <div
                key={device.id}
                onClick={() => dispatch(selectDevice(isSelected ? null : device.id))}
                className={`group p-3 mx-2 mb-1 rounded-xl cursor-pointer border transition-all ${
                  isSelected
                    ? 'bg-indigo-500/10 border-indigo-500/40'
                    : 'border-transparent hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${device.color}18`, border: `1.5px solid ${device.color}40` }}
                  >
                    {TYPE_ICONS[device.type] ?? '📍'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-white truncate">{device.name}</p>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 flex-shrink-0">
                        #{device.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{device.plateNumber || 'No plate'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(device.id); }}
                      disabled={deletingId === device.id}
                      className="p-1 rounded text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove device"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="mt-1.5 pl-11 flex items-center gap-3 text-xs">
                  {isActive ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Navigation size={10} />{Math.round(speed)} km/h
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock size={10} />{lastSeen}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Show guide for the most recently added device */}
          {createdDevice && realDevices.some(d => d.id === createdDevice.id) && (
            <div className="mt-2 border-t border-slate-700/50">
              <GuidePanel deviceId={createdDevice.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
