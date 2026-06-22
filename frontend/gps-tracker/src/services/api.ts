import axios from 'axios';
import type { Device, RoutePoint, Geofence, Alert } from '../types';

const api = axios.create({ baseURL: '/api' });

export const deviceApi = {
  getAll: () => api.get<Device[]>('/devices').then(r => r.data),
  create: (data: Partial<Device>) => api.post<Device>('/devices', data).then(r => r.data),
  delete: (id: number) => api.delete(`/devices/${id}`),
  getRoute: (id: number, from?: string, to?: string) =>
    api.get<RoutePoint[]>(`/devices/${id}/route`, { params: { from, to } }).then(r => r.data),
};

export const geofenceApi = {
  getAll: () => api.get<Geofence[]>('/geofences').then(r => r.data),
  create: (data: Partial<Geofence>) => api.post<Geofence>('/geofences', data).then(r => r.data),
  delete: (id: number) => api.delete(`/geofences/${id}`),
};

export const alertApi = {
  getAll: (limit?: number) => api.get<Alert[]>('/alerts', { params: { limit } }).then(r => r.data),
  markRead: (id: number) => api.put(`/alerts/${id}/read`),
  markAllRead: () => api.put('/alerts/read-all'),
};

export const simulatorApi = {
  start: () => api.post('/simulator/start').then(r => r.data),
  stop: () => api.post('/simulator/stop').then(r => r.data),
  status: () => api.get<{ running: boolean }>('/simulator/status').then(r => r.data),
};
