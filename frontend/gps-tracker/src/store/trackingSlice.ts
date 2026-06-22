import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Device, LocationUpdate, Alert, Geofence, RoutePoint } from '../types';
import { deviceApi, alertApi, geofenceApi } from '../services/api';

interface TrackingState {
  devices: Device[];
  liveLocations: Record<number, LocationUpdate>;
  selectedDeviceId: number | null;
  routeHistory: RoutePoint[];
  alerts: Alert[];
  geofences: Geofence[];
  simulatorRunning: boolean;
  showRoute: boolean;
  unreadAlerts: number;
}

const initialState: TrackingState = {
  devices: [],
  liveLocations: {},
  selectedDeviceId: null,
  routeHistory: [],
  alerts: [],
  geofences: [],
  simulatorRunning: false,
  showRoute: false,
  unreadAlerts: 0,
};

export const fetchDevices = createAsyncThunk('tracking/fetchDevices', () => deviceApi.getAll());
export const fetchAlerts = createAsyncThunk('tracking/fetchAlerts', () => alertApi.getAll(30));
export const fetchGeofences = createAsyncThunk('tracking/fetchGeofences', () => geofenceApi.getAll());
export const fetchRouteHistory = createAsyncThunk('tracking/fetchRoute', (deviceId: number) =>
  deviceApi.getRoute(deviceId)
);

const trackingSlice = createSlice({
  name: 'tracking',
  initialState,
  reducers: {
    updateLiveLocation(state, action: PayloadAction<LocationUpdate>) {
      const loc = action.payload;
      state.liveLocations[loc.deviceId] = loc;

      const device = state.devices.find(d => d.id === loc.deviceId);
      if (device) {
        device.lastLat = loc.latitude;
        device.lastLng = loc.longitude;
        device.lastSpeed = loc.speed;
        device.lastSeen = loc.timestamp;
        device.status = 'Active';
      }
    },
    addLiveAlert(state, action: PayloadAction<Alert>) {
      state.alerts.unshift(action.payload);
      if (state.alerts.length > 50) state.alerts.pop();
      state.unreadAlerts++;
    },
    selectDevice(state, action: PayloadAction<number | null>) {
      state.selectedDeviceId = action.payload;
      state.showRoute = false;
      state.routeHistory = [];
    },
    setSimulatorRunning(state, action: PayloadAction<boolean>) {
      state.simulatorRunning = action.payload;
    },
    setShowRoute(state, action: PayloadAction<boolean>) {
      state.showRoute = action.payload;
    },
    clearUnreadAlerts(state) {
      state.unreadAlerts = 0;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchDevices.fulfilled, (state, a) => { state.devices = a.payload; })
      .addCase(fetchAlerts.fulfilled, (state, a) => {
        state.alerts = a.payload;
        state.unreadAlerts = a.payload.filter(al => !al.isRead).length;
      })
      .addCase(fetchGeofences.fulfilled, (state, a) => { state.geofences = a.payload; })
      .addCase(fetchRouteHistory.fulfilled, (state, a) => {
        state.routeHistory = a.payload;
        state.showRoute = true;
      });
  },
});

export const { updateLiveLocation, addLiveAlert, selectDevice, setSimulatorRunning, setShowRoute, clearUnreadAlerts } = trackingSlice.actions;
export default trackingSlice.reducer;
