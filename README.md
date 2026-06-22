# GPS Fleet & Asset Tracking System

A real-time fleet tracking dashboard built with **.NET 8**, **React**, **SignalR WebSockets**, and **Leaflet** maps. Includes a built-in demo simulator — no GPS hardware required to try it out.

## Screenshots

| Live Tracking | Simulation Running |
|---|---|
| ![Tracking](screenshots/Screenshot%202026-06-22%20101903.png) | ![Simulation](screenshots/Screenshot%202026-06-22%20101938.png) |

## Demo Video

https://github.com/Alibadloo/GpsTracking/raw/master/screenshots/Tracking_video.mp4

## Features

- **Live Map Tracking** — Vehicles move in real-time on a dark Leaflet map via SignalR WebSocket
- **Demo Simulator** — 5 vehicles pre-programmed on Tehran routes; start/stop from the dashboard with one click
- **Real GPS Support** — Register real hardware devices (GPSLogger, Teltonika FMB, custom IoT/GSM) and get a step-by-step integration guide
- **Speed Alerts** — Automatic alerts when a vehicle exceeds its speed limit
- **Geofencing** — Circle-based geofences with Entry/Exit alerts
- **Route History** — View any vehicle's past route drawn on the map
- **Alert Panel** — Severity-coded alerts (Info / Warning / Critical) with mark-read support
- **Follow Mode** — Click a vehicle to lock the map and follow it as it moves

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | C# .NET 8 Web API |
| Real-time | ASP.NET Core SignalR (WebSocket) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | Entity Framework Core 8 |
| Frontend | React 18 + TypeScript + Vite |
| State | Redux Toolkit |
| Map | Leaflet + react-leaflet |
| Styling | Tailwind CSS v3 |

## Project Structure

```
GpsTracking/
├── backend/GpsTracker.API/
│   ├── Controllers/       # Devices, Alerts, Geofences, Simulator, Locations
│   ├── Hubs/              # TrackingHub (SignalR)
│   ├── Models/            # Device, Location, Geofence, Alert
│   ├── Services/
│   │   ├── TrackingService.cs   # Location processing, geofence/speed checks, SignalR broadcast
│   │   └── SimulatorService.cs  # Background demo — 5 vehicles on Tehran routes
│   └── Data/              # EF Core DbContext + migrations
└── frontend/gps-tracker/
    └── src/
        ├── components/
        │   ├── map/           # TrackingMap, vehicle markers, geofence circles, route polyline
        │   ├── sidebar/       # Fleet list, AlertPanel
        │   ├── simulation/    # SimulationTab (start/stop + live vehicle list)
        │   └── realgps/       # RealGpsTab (register device + integration guide)
        ├── store/             # Redux trackingSlice
        ├── services/          # REST API clients + SignalR hub connection
        └── hooks/             # useSignalR, useAppDispatch
```

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org)

### 1 — Run the Backend

```bash
cd backend/GpsTracker.API
dotnet run
```

API starts at `http://localhost:5050`. SQLite database and demo data (5 vehicles, 2 geofences) are created automatically on first run.

### 2 — Run the Frontend

```bash
cd frontend/gps-tracker
npm install
npm run dev
```

Open `http://localhost:5173`. Go to the **Simulation** tab and click **Start Simulation** to see live vehicle movement on the map.

## Connecting a Real GPS Device

1. Go to the **Real GPS** tab in the sidebar
2. Click **Register New GPS Device** and fill in the device name, type and color
3. Note the **Device ID** you receive
4. Configure your GPS hardware or app using one of the built-in guides:

| Device | Method |
|--------|--------|
| **GPSLogger (Android)** | Custom URL → POST with JSON body |
| **Teltonika FMB920/FMB130** | Configurator → GPRS → HTTP Data Sending |
| **Custom IoT / SIM7600 / Arduino** | AT+HTTP commands |

All guides are shown inside the app with the correct Device ID and endpoint already filled in.

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/devices` | List all devices with last known position |
| `POST` | `/api/devices` | Register a new device |
| `DELETE` | `/api/devices/{id}` | Remove a device |
| `GET` | `/api/devices/{id}/route` | Location history (last 500 points) |
| `POST` | `/api/locations` | **Receive GPS data from hardware** |
| `GET` | `/api/alerts` | List alerts |
| `PUT` | `/api/alerts/{id}/read` | Mark alert as read |
| `PUT` | `/api/alerts/read-all` | Mark all alerts as read |
| `GET` | `/api/geofences` | List geofences |
| `POST` | `/api/geofences` | Create a geofence |
| `POST` | `/api/simulator/start` | Start the demo simulation |
| `POST` | `/api/simulator/stop` | Stop the demo simulation |
| `GET` | `/api/simulator/status` | Simulation running state |
| `WS` | `/hubs/tracking` | SignalR hub — real-time location & alerts |

### Location Payload (POST `/api/locations`)

```json
{
  "deviceId": 1,
  "latitude": 35.7007,
  "longitude": 51.3378,
  "speed": 60.5,
  "heading": 90,
  "altitude": 1200,
  "timestamp": "2026-06-22T10:00:00Z"
}
```

### SignalR Events (WebSocket)

| Event | Direction | Description |
|-------|-----------|-------------|
| `LocationUpdate` | Server → Client | Real-time position for all active devices |
| `NewAlert` | Server → Client | Speed exceeded / geofence entry or exit |
