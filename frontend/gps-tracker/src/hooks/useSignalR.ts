import { useEffect, useRef } from 'react';
import { useAppDispatch } from './useAppDispatch';
import { updateLiveLocation, addLiveAlert } from '../store/trackingSlice';
import { startConnection, getHubConnection, stopConnection } from '../services/hubConnection';
import type { LocationUpdate, Alert } from '../types';

export function useSignalR() {
  const dispatch = useAppDispatch();
  const mountedRef = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-invoke
    if (mountedRef.current) return;
    mountedRef.current = true;

    const conn = getHubConnection();

    conn.on('LocationUpdate', (data: LocationUpdate) => {
      dispatch(updateLiveLocation(data));
    });

    conn.on('NewAlert', (alert: Alert) => {
      dispatch(addLiveAlert(alert));
    });

    conn.onreconnected(() => {
      console.info('[SignalR] Reconnected');
    });

    startConnection()
      .then(() => console.info('[SignalR] Connected to hub'))
      .catch(err => console.error('[SignalR] Connection failed:', err));

    return () => {
      mountedRef.current = false;
      conn.off('LocationUpdate');
      conn.off('NewAlert');
      stopConnection();
    };
  }, [dispatch]);
}
