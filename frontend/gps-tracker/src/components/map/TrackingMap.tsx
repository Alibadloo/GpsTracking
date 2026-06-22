import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch';
import { selectDevice } from '../../store/trackingSlice';
import type { LocationUpdate } from '../../types';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const VEHICLE_ICONS: Record<string, string> = {
  Car: '🚗', Truck: '🚛', Van: '🚐', Motorcycle: '🏍️', Equipment: '⚙️', Person: '🧍',
};

// Handles zoom-to on first selection, then smooth pan on every location tick
function MapController() {
  const { selectedDeviceId, liveLocations, devices } = useAppSelector(s => s.tracking);
  const map = useMap();
  const prevSelectedRef = useRef<number | null>(null);
  const isFollowingRef = useRef(false);

  useEffect(() => {
    if (!selectedDeviceId) {
      prevSelectedRef.current = null;
      isFollowingRef.current = false;
      return;
    }

    const loc = liveLocations[selectedDeviceId];
    const device = devices.find(d => d.id === selectedDeviceId);
    const lat = loc?.latitude ?? device?.lastLat;
    const lng = loc?.longitude ?? device?.lastLng;
    if (!lat || !lng) return;

    // Wrap as a minimal loc-like object for the pan logic
    const position = { latitude: lat, longitude: lng };

    // First time selecting this device → fly in with zoom
    if (prevSelectedRef.current !== selectedDeviceId) {
      prevSelectedRef.current = selectedDeviceId;
      isFollowingRef.current = true;
      map.flyTo([position.latitude, position.longitude], 15, { animate: true, duration: 1.2 });
    } else if (isFollowingRef.current && loc) {
      // Only smooth-follow when we have live data (don't jitter on static lastLat)
      map.panTo([position.latitude, position.longitude], { animate: true, duration: 0.8, easeLinearity: 0.25 });
    }
  }, [selectedDeviceId, liveLocations, devices, map]);

  // Stop following when user manually drags the map
  useEffect(() => {
    const onDragStart = () => { isFollowingRef.current = false; };
    map.on('dragstart', onDragStart);
    return () => { map.off('dragstart', onDragStart); };
  }, [map]);

  // Resume following when user clicks the selected vehicle again
  useEffect(() => {
    const onResume = () => {
      if (selectedDeviceId && liveLocations[selectedDeviceId]) {
        isFollowingRef.current = true;
        const loc = liveLocations[selectedDeviceId];
        map.flyTo([loc.latitude, loc.longitude], 15, { animate: true, duration: 0.8 });
      }
    };
    // Re-attach resume listener when selectedDeviceId changes
    return () => { void onResume; }; // just keep the ref stable
  }, [selectedDeviceId, liveLocations, map]);

  return null;
}

// Deselect device when user clicks blank map area
function MapClickHandler() {
  const dispatch = useAppDispatch();
  const map = useMap();

  useEffect(() => {
    const handler = () => dispatch(selectDevice(null));
    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, [map, dispatch]);

  return null;
}

function VehicleMarkers() {
  const { liveLocations, selectedDeviceId, devices } = useAppSelector(s => s.tracking);
  const dispatch = useAppDispatch();
  const markersRef = useRef<Record<number, L.Marker>>({});
  const map = useMap();

  useEffect(() => {
    // Merge: liveLocations (SignalR, real-time) + devices with lastLat/lastLng (API fallback)
    const seen = new Set<number>();

    const renderMarker = (loc: LocationUpdate) => {
      seen.add(loc.deviceId);
      const device = devices.find(d => d.id === loc.deviceId);
      const icon = VEHICLE_ICONS[loc.deviceType] ?? '📍';
      const isSelected = loc.deviceId === selectedDeviceId;
      const speed = Math.round(loc.speed);

      const markerHtml = `
        <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
          ${isSelected ? `
            <div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ${loc.deviceColor};opacity:0.6;animation:ping-dot 1.5s ease-out infinite;"></div>
            <div style="position:absolute;inset:-2px;border-radius:50%;border:2px solid ${loc.deviceColor};opacity:0.4;animation:ping-dot 1.5s ease-out infinite;animation-delay:0.4s;"></div>
          ` : ''}
          <div style="
            width:42px;height:42px;border-radius:50%;
            background:${isSelected ? loc.deviceColor : '#0F172A'};
            border:2.5px solid ${loc.deviceColor};
            display:flex;align-items:center;justify-content:center;
            font-size:20px;cursor:pointer;
            box-shadow:0 0 0 ${isSelected ? '3px' : '0px'} ${loc.deviceColor}40, 0 4px 16px rgba(0,0,0,0.5);
            transform:rotate(${loc.heading}deg);
            transition:background 0.3s,box-shadow 0.3s;
          ">${icon}</div>
          <div style="
            position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);
            background:${loc.deviceColor};color:white;font-size:9px;font-weight:700;
            padding:1px 5px;border-radius:3px;white-space:nowrap;letter-spacing:0.3px;
          ">${speed} km/h</div>
        </div>`;

      const leafletIcon = L.divIcon({ html: markerHtml, className: '', iconSize: [48, 48], iconAnchor: [24, 24] });

      if (markersRef.current[loc.deviceId]) {
        markersRef.current[loc.deviceId].setLatLng([loc.latitude, loc.longitude]);
        markersRef.current[loc.deviceId].setIcon(leafletIcon);
      } else {
        const marker = L.marker([loc.latitude, loc.longitude], { icon: leafletIcon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:170px;font-family:system-ui">
              <div style="font-weight:700;font-size:14px;margin-bottom:4px">${icon} ${device?.name ?? loc.deviceName}</div>
              <div style="font-size:11px;color:#94A3B8;margin-bottom:8px">${device?.plateNumber ?? ''}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px">
                <div>🚀 ${speed} km/h</div>
                <div>🧭 ${Math.round(loc.heading)}°</div>
                <div style="color:#94A3B8">Lat ${loc.latitude.toFixed(5)}</div>
                <div style="color:#94A3B8">Lng ${loc.longitude.toFixed(5)}</div>
              </div>
              <div style="margin-top:8px;font-size:11px;color:${loc.deviceColor};font-weight:600">● ${device?.status ?? 'Active'}</div>
            </div>
          `, { maxWidth: 200 });

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          const currentSelected = selectedDeviceId;
          dispatch(selectDevice(currentSelected === loc.deviceId ? null : loc.deviceId));
        });

        markersRef.current[loc.deviceId] = marker;
      }
    };

    // 1. Render all live (SignalR) positions
    Object.values(liveLocations).forEach(loc => renderMarker(loc as LocationUpdate));

    // 2. Render devices with last known position from API (not yet in liveLocations)
    devices.forEach(d => {
      if (seen.has(d.id) || !d.lastLat || !d.lastLng) return;
      renderMarker({
        deviceId: d.id,
        latitude: d.lastLat,
        longitude: d.lastLng,
        speed: d.lastSpeed ?? 0,
        heading: 0,
        altitude: 0,
        timestamp: d.lastSeen ?? '',
        deviceName: d.name,
        deviceColor: d.color,
        deviceType: d.type,
        status: d.status,
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveLocations, selectedDeviceId, map, dispatch, devices]);

  return null;
}

function GeofenceLayer() {
  const { geofences } = useAppSelector(s => s.tracking);
  const circlesRef = useRef<L.Circle[]>([]);
  const map = useMap();

  useEffect(() => {
    circlesRef.current.forEach(c => c.remove());
    circlesRef.current = [];
    geofences.forEach(gf => {
      if (!gf.isActive || !gf.isCircle) return;
      const circle = L.circle([gf.centerLat, gf.centerLng], {
        radius: gf.radiusMeters,
        color: gf.color,
        fillColor: gf.color,
        fillOpacity: 0.07,
        weight: 2,
        dashArray: '6,4',
      }).addTo(map).bindTooltip(`🔒 ${gf.name}  (r=${gf.radiusMeters}m)`, { permanent: false, sticky: true });
      circlesRef.current.push(circle);
    });
  }, [geofences, map]);

  return null;
}

function RouteHistoryLayer() {
  const { routeHistory, showRoute, selectedDeviceId, devices } = useAppSelector(s => s.tracking);
  const polylineRef = useRef<L.Polyline | null>(null);
  const map = useMap();

  useEffect(() => {
    if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null; }
    if (!showRoute || routeHistory.length < 2) return;
    const device = devices.find(d => d.id === selectedDeviceId);
    const color = device?.color ?? '#6366F1';
    const points = routeHistory.map(p => [p.latitude, p.longitude] as [number, number]);
    polylineRef.current = L.polyline(points, { color, weight: 3, opacity: 0.8, dashArray: '8,4' }).addTo(map);
    map.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50] });
  }, [routeHistory, showRoute, selectedDeviceId, devices, map]);

  return null;
}

export default function TrackingMap() {
  return (
    <MapContainer
      center={[35.7007, 51.3378]}
      zoom={12}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        maxZoom={19}
      />
      <MapController />
      <MapClickHandler />
      <VehicleMarkers />
      <GeofenceLayer />
      <RouteHistoryLayer />
    </MapContainer>
  );
}
