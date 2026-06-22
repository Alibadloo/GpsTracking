import * as signalR from '@microsoft/signalr';

// Connect directly to backend — Vite's WebSocket proxy doesn't reliably handle
// SignalR's HTTP→WS upgrade negotiation in newer Vite versions.
const HUB_URL = 'http://localhost:5050/hubs/tracking';

let connection: signalR.HubConnection | null = null;

export function getHubConnection(): signalR.HubConnection {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Information)
      .build();
  }
  return connection;
}

export async function startConnection(): Promise<void> {
  const conn = getHubConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    await conn.start();
  }
}

export async function stopConnection(): Promise<void> {
  if (connection) {
    await connection.stop();
    connection = null;
  }
}
