export interface Device {
  id: number;
  name: string;
  plateNumber: string;
  type: string;
  status: 'Active' | 'Idle' | 'Offline' | 'Alert';
  color: string;
  lastLat?: number;
  lastLng?: number;
  lastSpeed?: number;
  lastSeen?: string;
  isSimulated?: boolean;
}

export interface LocationUpdate {
  deviceId: number;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  altitude: number;
  timestamp: string;
  deviceName: string;
  deviceColor: string;
  deviceType: string;
  status: string;
}

export interface RoutePoint {
  id: number;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export interface Geofence {
  id: number;
  name: string;
  color: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  isCircle: boolean;
  isActive: boolean;
}

export interface Alert {
  id: number;
  type: string;
  severity: 'Info' | 'Warning' | 'Critical';
  message: string;
  deviceName: string;
  deviceId: number;
  isRead: boolean;
  createdAt: string;
}
