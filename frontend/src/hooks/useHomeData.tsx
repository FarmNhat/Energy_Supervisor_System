import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useRealtimeMetrics } from './useRealtimeMetrics';

export type DeviceIconType =
  | 'Tv'
  | 'Lamp'
  | 'Fan'
  | 'Refrigerator'
  | 'AirVent'
  | 'Monitor'
  | 'Speaker'
  | 'Purifier'
  | 'Dishwasher'
  | 'CoffeeMaker'
  | 'Lightbulb';

export type RoomIconType = 'Sofa' | 'Bed' | 'CookingPot';
export type SensorKind = 'temperature' | 'humidity' | 'light' | 'voltage';
export type SensorSeverity = 'healthy' | 'warning' | 'critical';
export type ConnectionState = 'live' | 'stale' | 'offline';

export interface Device {
  id: string;
  name: string;
  iconType: DeviceIconType;
  isOn: boolean;
  powerDraw: number;
  room: string;
}

export interface Room {
  id: string;
  name: string;
  iconType: RoomIconType;
  devices: Device[];
}

export interface EnergyDistribution {
  name: string;
  value: number;
  color: string;
}

export interface SensorCardData {
  id: SensorKind;
  label: string;
  unit: string;
  value: number;
  displayValue: string;
  description: string;
  statusLabel: string;
  helperText: string;
  rangeLabel: string;
  fillPercent: number;
  severity: SensorSeverity;
  sourceLabel: string;
}

export interface SensorSummary {
  maxSensors: number;
  activeSensors: number;
  online: boolean;
  state: ConnectionState;
  lastUpdatedLabel: string;
  freshnessLabel: string;
  headline: string;
  note: string;
  watchlist: string[];
}

export interface HomeData {
  homeName: string;
  monthlyCost: number;
  costTrend: number;
  currentDate: string;
  rooms: Room[];
  energyDistribution: EnergyDistribution[];
  temperature: {
    current: number;
    target: number;
    comfortLevel: 'Comfortable' | 'Warm' | 'Cool';
  };
  lightLevel: {
    percentage: number;
    timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  };
  aiTips: string[];
  sensors: SensorCardData[];
  sensorSummary: SensorSummary;
}

export interface SensorSnapshot {
  temperature: number;
  humidity: number;
  light: number;
  voltage: number;
  timestamp?: string;
}

export interface TelemetryPoint extends SensorSnapshot {
  sequence: number;
  chartLabel: string;
}

export interface SensorTransport {
  receiverUrl: string;
  topic: string;
  brokerLabel: string;
  pollIntervalSeconds: number;
  staleAfterSeconds: number;
  updateCount: number;
  connectionState: ConnectionState;
  voltageMode: 'volts' | 'raw_adc';
  temperatureUnit: '°C' | '°F';
}

export interface SensorAlert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
}

interface HomeDataContextType {
  data: HomeData;
  devices: Device[];
  latestSnapshot: SensorSnapshot;
  sensorHistory: TelemetryPoint[];
  sensorTransport: SensorTransport;
  sensorAlerts: SensorAlert[];
  toggleDevice: (id: string) => void;
  addDevice: (device: Omit<Device, 'id'>) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  deleteDevice: (id: string) => void;
}

interface BackendSummaryResponse {
  connection_state: string;
  last_update?: string | null;
  mqtt_topic: string;
  mqtt_host: string;
  poll_interval_seconds: number;
  stale_after_seconds: number;
  update_count: number;
}

interface BackendAlertResponse {
  record_id: number;
  level: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
  key: string;
  value?: number | null;
  unit?: string | null;
  created_at: string;
}

interface BackendRecentSampleResponse {
  sequence: number;
  temperature: number;
  humidity: number;
  light: number;
  voltage: number;
  timestamp: string;
}

interface BackendOverviewResponse {
  summary: BackendSummaryResponse;
  metrics: SensorSnapshot;
  alerts: BackendAlertResponse[];
  recent_samples: BackendRecentSampleResponse[];
}

interface BackendRealtimeMessage {
  event: string;
  snapshot: SensorSnapshot;
  alerts: BackendAlertResponse[];
  summary: BackendSummaryResponse;
  recent_records: BackendRecentSampleResponse[];
  sent_at: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');
const DASHBOARD_OVERVIEW_URL = `${API_BASE_URL}/api/dashboard/overview`;
const REALTIME_URL = `${API_BASE_URL.replace(/^http/, 'ws')}/ws/realtime`;
const SENSOR_RECEIVER_URL = 'http://localhost:8080/sensors.json';
const MQTT_TOPIC = 'sensors/data';
const MQTT_BROKER_LABEL = 'broker.hivemq.com';
const SENSOR_POLL_INTERVAL_MS = 2000;
const STALE_AFTER_SECONDS = 6;
const MAX_SENSOR_CHANNELS = 4;
const HISTORY_LIMIT = 24;

const initialDevices: Device[] = [
  {
    id: 'lr-1',
    name: 'Smart TV',
    iconType: 'Tv',
    isOn: true,
    powerDraw: 120,
    room: 'Living Room',
  },
  {
    id: 'lr-2',
    name: 'Floor Lamp',
    iconType: 'Lamp',
    isOn: true,
    powerDraw: 15,
    room: 'Living Room',
  },
  {
    id: 'lr-3',
    name: 'AC Unit',
    iconType: 'AirVent',
    isOn: true,
    powerDraw: 850,
    room: 'Living Room',
  },
  {
    id: 'lr-4',
    name: 'Smart Speaker',
    iconType: 'Speaker',
    isOn: true,
    powerDraw: 5,
    room: 'Living Room',
  },
  {
    id: 'br-1',
    name: 'Bedside Lamp',
    iconType: 'Lamp',
    isOn: false,
    powerDraw: 10,
    room: 'Bedroom',
  },
  {
    id: 'br-2',
    name: 'Ceiling Fan',
    iconType: 'Fan',
    isOn: true,
    powerDraw: 45,
    room: 'Bedroom',
  },
  {
    id: 'br-3',
    name: 'Air Purifier',
    iconType: 'Purifier',
    isOn: true,
    powerDraw: 30,
    room: 'Bedroom',
  },
  {
    id: 'k-1',
    name: 'Refrigerator',
    iconType: 'Refrigerator',
    isOn: true,
    powerDraw: 150,
    room: 'Kitchen',
  },
  {
    id: 'k-2',
    name: 'Dishwasher',
    iconType: 'Dishwasher',
    isOn: false,
    powerDraw: 1200,
    room: 'Kitchen',
  },
  {
    id: 'k-3',
    name: 'Coffee Maker',
    iconType: 'CoffeeMaker',
    isOn: false,
    powerDraw: 800,
    room: 'Kitchen',
  },
  {
    id: 'k-4',
    name: 'Cabinet Lights',
    iconType: 'Lightbulb',
    isOn: true,
    powerDraw: 20,
    room: 'Kitchen',
  },
];

const fallbackSensorSnapshot: SensorSnapshot = {
  temperature: 23.4,
  humidity: 47.3,
  light: 72,
  voltage: 3.3,
};

const HomeDataContext = createContext<HomeDataContextType | undefined>(undefined);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const inferTemperatureUnit = (value: number): '°C' | '°F' => (value > 55 ? '°F' : '°C');

const inferVoltageMode = (value: number): 'volts' | 'raw_adc' => (value > 20 ? 'raw_adc' : 'volts');

const toCelsius = (value: number) =>
  inferTemperatureUnit(value) === '°F' ? (value - 32) * (5 / 9) : value;

const normalizeConnectionState = (value?: string): ConnectionState =>
  value === 'live' || value === 'stale' || value === 'offline' ? value : 'offline';

const parseReceiverTimestamp = (timestamp?: string) => {
  if (!timestamp) {
    return null;
  }

  const parsed = new Date(timestamp.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatHistoryLabel = (timestamp?: string) => {
  const parsed = parseReceiverTimestamp(timestamp);

  if (!parsed) {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  return parsed.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatTimestampLabel = (timestamp?: string) =>
  timestamp ? timestamp.replace(' ', ' · ') : 'Waiting for first live packet';

const isSameSnapshot = (left?: SensorSnapshot | null, right?: SensorSnapshot | null) => {
  if (!left || !right) {
    return false;
  }

  return (
    left.temperature === right.temperature &&
    left.humidity === right.humidity &&
    left.light === right.light &&
    left.voltage === right.voltage &&
    left.timestamp === right.timestamp
  );
};

const resolveTimeOfDay = (
  lightLevel: number,
): 'Morning' | 'Afternoon' | 'Evening' | 'Night' => {
  if (lightLevel >= 75) {
    return 'Afternoon';
  }

  if (lightLevel >= 45) {
    return 'Morning';
  }

  if (lightLevel >= 20) {
    return 'Evening';
  }

  return 'Night';
};

const getSnapshotAgeSeconds = (snapshot: SensorSnapshot | null, lastSuccessAt: number | null, now: number) => {
  const parsedTimestamp = parseReceiverTimestamp(snapshot?.timestamp);

  if (parsedTimestamp) {
    return Math.max(0, Math.round((now - parsedTimestamp.getTime()) / 1000));
  }

  if (!lastSuccessAt) {
    return null;
  }

  return Math.max(0, Math.round((now - lastSuccessAt) / 1000));
};

const getConnectionState = (
  receiverReachable: boolean,
  hasSuccessfulFetch: boolean,
  snapshot: SensorSnapshot | null,
  lastSuccessAt: number | null,
  now: number,
): ConnectionState => {
  if (!receiverReachable || !hasSuccessfulFetch || !snapshot) {
    return 'offline';
  }

  const ageSeconds = getSnapshotAgeSeconds(snapshot, lastSuccessAt, now);

  if (ageSeconds !== null && ageSeconds > STALE_AFTER_SECONDS) {
    return 'stale';
  }

  return 'live';
};

function buildTemperatureCard(value: number): SensorCardData {
  const unit = inferTemperatureUnit(value);
  const temperatureC = toCelsius(value);
  const fillPercent =
    unit === '°F' ? clamp(((value - 32) / 72) * 100, 0, 100) : clamp((value / 50) * 100, 0, 100);

  if (temperatureC < 18) {
    return {
      id: 'temperature',
      label: 'Temperature',
      unit,
      value,
      displayValue: value.toFixed(1),
      description: 'Ambient air around the ESP32 node.',
      statusLabel: 'Cool',
      helperText: 'Below the preferred comfort band. Check drafts or sensor placement.',
      rangeLabel: unit === '°F' ? 'Target 68-79°F' : 'Target 20-26°C',
      fillPercent,
      severity: 'warning',
      sourceLabel: 'DHT sensor · MQTT temperature field',
    };
  }

  if (temperatureC > 30) {
    return {
      id: 'temperature',
      label: 'Temperature',
      unit,
      value,
      displayValue: value.toFixed(1),
      description: 'Ambient air around the ESP32 node.',
      statusLabel: 'Hot',
      helperText: 'Above the safe comfort band. Reduce heat buildup or add ventilation.',
      rangeLabel: unit === '°F' ? 'Target 68-79°F' : 'Target 20-26°C',
      fillPercent,
      severity: 'critical',
      sourceLabel: 'DHT sensor · MQTT temperature field',
    };
  }

  if (temperatureC > 26) {
    return {
      id: 'temperature',
      label: 'Temperature',
      unit,
      value,
      displayValue: value.toFixed(1),
      description: 'Ambient air around the ESP32 node.',
      statusLabel: 'Warm',
      helperText: 'Slightly elevated. Watch this during longer runs or direct sun exposure.',
      rangeLabel: unit === '°F' ? 'Target 68-79°F' : 'Target 20-26°C',
      fillPercent,
      severity: 'warning',
      sourceLabel: 'DHT sensor · MQTT temperature field',
    };
  }

  return {
    id: 'temperature',
    label: 'Temperature',
    unit,
    value,
    displayValue: value.toFixed(1),
    description: 'Ambient air around the ESP32 node.',
    statusLabel: 'Stable',
    helperText: 'Inside the expected operating band for a room monitor.',
    rangeLabel: unit === '°F' ? 'Target 68-79°F' : 'Target 20-26°C',
    fillPercent,
    severity: 'healthy',
    sourceLabel: 'DHT sensor · MQTT temperature field',
  };
}

function buildHumidityCard(value: number): SensorCardData {
  const fillPercent = clamp(value, 0, 100);

  if (value < 35) {
    return {
      id: 'humidity',
      label: 'Humidity',
      unit: '%',
      value,
      displayValue: value.toFixed(1),
      description: 'Relative moisture reported by the DHT sensor.',
      statusLabel: 'Dry',
      helperText: 'Below the preferred range. Check airflow or nearby heat sources.',
      rangeLabel: 'Target 40-60%',
      fillPercent,
      severity: 'warning',
      sourceLabel: 'DHT sensor · MQTT humidity field',
    };
  }

  if (value > 70) {
    return {
      id: 'humidity',
      label: 'Humidity',
      unit: '%',
      value,
      displayValue: value.toFixed(1),
      description: 'Relative moisture reported by the DHT sensor.',
      statusLabel: 'High',
      helperText: 'Moisture is elevated. Check airflow before condensation becomes a risk.',
      rangeLabel: 'Target 40-60%',
      fillPercent,
      severity: 'critical',
      sourceLabel: 'DHT sensor · MQTT humidity field',
    };
  }

  if (value > 60) {
    return {
      id: 'humidity',
      label: 'Humidity',
      unit: '%',
      value,
      displayValue: value.toFixed(1),
      description: 'Relative moisture reported by the DHT sensor.',
      statusLabel: 'Humid',
      helperText: 'Slightly above target. Watch for a sustained upward trend.',
      rangeLabel: 'Target 40-60%',
      fillPercent,
      severity: 'warning',
      sourceLabel: 'DHT sensor · MQTT humidity field',
    };
  }

  return {
    id: 'humidity',
    label: 'Humidity',
    unit: '%',
    value,
    displayValue: value.toFixed(1),
    description: 'Relative moisture reported by the DHT sensor.',
    statusLabel: 'Balanced',
    helperText: 'Within the preferred moisture band.',
    rangeLabel: 'Target 40-60%',
    fillPercent,
    severity: 'healthy',
    sourceLabel: 'DHT sensor · MQTT humidity field',
  };
}

function buildLightCard(value: number): SensorCardData {
  const fillPercent = clamp(value, 0, 100);

  if (value < 25) {
    return {
      id: 'light',
      label: 'Light',
      unit: '%',
      value,
      displayValue: value.toFixed(1),
      description: 'Relative light intensity normalized to 0-100.',
      statusLabel: 'Low',
      helperText: 'Illumination is weak. Confirm the sensor is not obstructed.',
      rangeLabel: 'Relative range 30-80%',
      fillPercent,
      severity: 'warning',
      sourceLabel: 'Analog light sensor · normalized in firmware',
    };
  }

  if (value > 95) {
    return {
      id: 'light',
      label: 'Light',
      unit: '%',
      value,
      displayValue: value.toFixed(1),
      description: 'Relative light intensity normalized to 0-100.',
      statusLabel: 'Saturated',
      helperText: 'Very bright input. Check for direct glare or sensor saturation.',
      rangeLabel: 'Relative range 30-80%',
      fillPercent,
      severity: 'critical',
      sourceLabel: 'Analog light sensor · normalized in firmware',
    };
  }

  if (value > 80) {
    return {
      id: 'light',
      label: 'Light',
      unit: '%',
      value,
      displayValue: value.toFixed(1),
      description: 'Relative light intensity normalized to 0-100.',
      statusLabel: 'Bright',
      helperText: 'Above the normal band. Verify this is expected for the deployment area.',
      rangeLabel: 'Relative range 30-80%',
      fillPercent,
      severity: 'warning',
      sourceLabel: 'Analog light sensor · normalized in firmware',
    };
  }

  return {
    id: 'light',
    label: 'Light',
    unit: '%',
    value,
    displayValue: value.toFixed(1),
    description: 'Relative light intensity normalized to 0-100.',
    statusLabel: 'Balanced',
    helperText: 'Lighting is inside the expected operating band.',
    rangeLabel: 'Relative range 30-80%',
    fillPercent,
    severity: 'healthy',
    sourceLabel: 'Analog light sensor · normalized in firmware',
  };
}

function buildVoltageCard(value: number): SensorCardData {
  if (inferVoltageMode(value) === 'raw_adc') {
    return {
      id: 'voltage',
      label: 'Voltage Feed',
      unit: 'ADC',
      value,
      displayValue: value.toFixed(0),
      description: 'The firmware is publishing the raw ADC count, not a converted voltage.',
      statusLabel: 'Raw Feed',
      helperText: 'Treat this as an unscaled analog reading until the firmware converts it to volts.',
      rangeLabel: 'Unscaled 0-4095',
      fillPercent: clamp((value / 4095) * 100, 0, 100),
      severity: 'warning',
      sourceLabel: 'Analog voltage pin · raw ADC from firmware',
    };
  }

  const fillPercent = clamp((value / 5) * 100, 0, 100);

  if (value < 2.8) {
    return {
      id: 'voltage',
      label: 'Voltage',
      unit: 'V',
      value,
      displayValue: value.toFixed(2),
      description: 'Supply rail reported by the mock or converted node feed.',
      statusLabel: 'Low Rail',
      helperText: 'Supply is below the preferred floor. Inspect the power source first.',
      rangeLabel: 'Nominal 3.0-3.6V',
      fillPercent,
      severity: 'critical',
      sourceLabel: 'Voltage channel · converted reading',
    };
  }

  if (value > 3.9) {
    return {
      id: 'voltage',
      label: 'Voltage',
      unit: 'V',
      value,
      displayValue: value.toFixed(2),
      description: 'Supply rail reported by the mock or converted node feed.',
      statusLabel: 'High Rail',
      helperText: 'Supply is above the preferred band. Verify the regulator and source.',
      rangeLabel: 'Nominal 3.0-3.6V',
      fillPercent,
      severity: 'critical',
      sourceLabel: 'Voltage channel · converted reading',
    };
  }

  if (value < 3.0 || value > 3.6) {
    return {
      id: 'voltage',
      label: 'Voltage',
      unit: 'V',
      value,
      displayValue: value.toFixed(2),
      description: 'Supply rail reported by the mock or converted node feed.',
      statusLabel: 'Watch',
      helperText: 'Slightly outside nominal. Watch for drift over the next cycles.',
      rangeLabel: 'Nominal 3.0-3.6V',
      fillPercent,
      severity: 'warning',
      sourceLabel: 'Voltage channel · converted reading',
    };
  }

  return {
    id: 'voltage',
    label: 'Voltage',
    unit: 'V',
    value,
    displayValue: value.toFixed(2),
    description: 'Supply rail reported by the mock or converted node feed.',
    statusLabel: 'Nominal',
    helperText: 'Power delivery is steady.',
    rangeLabel: 'Nominal 3.0-3.6V',
    fillPercent,
    severity: 'healthy',
    sourceLabel: 'Voltage channel · converted reading',
  };
}

function buildSensorSummary(
  sensors: SensorCardData[],
  connectionState: ConnectionState,
  timestamp: string | undefined,
  ageSeconds: number | null,
): SensorSummary {
  const flaggedSensors = sensors.filter((sensor) => sensor.severity !== 'healthy');
  const lastUpdatedLabel = formatTimestampLabel(timestamp);

  if (connectionState === 'offline') {
    return {
      maxSensors: MAX_SENSOR_CHANNELS,
      activeSensors: 0,
      online: false,
      state: 'offline',
      lastUpdatedLabel: 'Receiver offline',
      freshnessLabel: `Polling every ${SENSOR_POLL_INTERVAL_MS / 1000}s`,
      headline: 'Waiting for the receiver',
      note: 'The UI keeps the four sensor slots visible, but it is currently showing fallback values because neither the backend API nor the JSON receiver is reachable.',
      watchlist: [
        'Start the backend on port 8000 or the fallback receiver on port 8080 to restore live telemetry.',
        'The dashboard is intentionally fixed to four channels because the node exposes exactly four readings.',
      ],
    };
  }

  if (connectionState === 'stale') {
    return {
      maxSensors: MAX_SENSOR_CHANNELS,
      activeSensors: MAX_SENSOR_CHANNELS,
      online: true,
      state: 'stale',
      lastUpdatedLabel,
      freshnessLabel: `Stale for ${ageSeconds ?? '?'}s`,
      headline: 'Receiver reachable, but data is stale',
      note: 'The endpoint is responding, but the telemetry timestamp is not advancing. Check the MQTT bridge, backend ingest path, or publisher.',
      watchlist: [
        'Verify that the node is still publishing to sensors/data.',
        'Stale data should be treated differently from a full receiver outage.',
      ],
    };
  }

  if (flaggedSensors.length === 0) {
    return {
      maxSensors: MAX_SENSOR_CHANNELS,
      activeSensors: MAX_SENSOR_CHANNELS,
      online: true,
      state: 'live',
      lastUpdatedLabel,
      freshnessLabel: `Live stream · age ${ageSeconds ?? 0}s`,
      headline: 'All four channels are stable',
      note: 'This dashboard keeps the entire node state visible in one glance because the hardware tops out at four live sensor channels.',
      watchlist: [
        'Temperature, humidity, light, and voltage feed are all inside their current watch bands.',
        'No tabs or pagination are needed for this node size.',
      ],
    };
  }

  return {
    maxSensors: MAX_SENSOR_CHANNELS,
    activeSensors: MAX_SENSOR_CHANNELS,
    online: true,
    state: 'live',
    lastUpdatedLabel,
    freshnessLabel: `Live stream · age ${ageSeconds ?? 0}s`,
    headline: `${flaggedSensors.length} of ${MAX_SENSOR_CHANNELS} channels need attention`,
    note: 'The product stays compact on purpose. Any abnormal reading should be visible immediately without expanding room or device sections.',
    watchlist: flaggedSensors.map((sensor) => `${sensor.label}: ${sensor.helperText}`),
  };
}

function buildSensorAlerts(
  sensors: SensorCardData[],
  connectionState: ConnectionState,
  ageSeconds: number | null,
): SensorAlert[] {
  const alerts: SensorAlert[] = [];

  if (connectionState === 'offline') {
    alerts.push({
      id: 'receiver-offline',
      level: 'critical',
      title: 'Receiver offline',
      detail: 'The frontend cannot reach the backend overview or the fallback receiver feed.',
    });
  }

  if (connectionState === 'stale') {
    alerts.push({
      id: 'receiver-stale',
      level: 'warning',
      title: 'Telemetry stream is stale',
      detail: `The receiver is reachable, but the last packet is ${ageSeconds ?? '?'} seconds old.`,
    });
  }

  sensors.forEach((sensor) => {
    if (sensor.severity === 'healthy') {
      return;
    }

    alerts.push({
      id: `${sensor.id}-${sensor.severity}`,
      level: sensor.severity === 'critical' ? 'critical' : 'warning',
      title: `${sensor.label} is ${sensor.statusLabel.toLowerCase()}`,
      detail: sensor.helperText,
    });
  });

  if (alerts.length === 0) {
    alerts.push({
      id: 'stream-healthy',
      level: 'info',
      title: 'Stream healthy',
      detail: 'The receiver is live and all four channels are inside their current watch bands.',
    });
  }

  return alerts.slice(0, 5);
}

function buildAiTips(
  sensors: SensorCardData[],
  connectionState: ConnectionState,
  voltageMode: 'volts' | 'raw_adc',
): string[] {
  const tips: string[] = [];

  if (connectionState === 'offline') {
    tips.push(
      'The sensor bridge is offline. Start the backend on port 8000 or the fallback receiver on port 8080 so the dashboard can switch from fallback values to live telemetry.',
    );
  }

  if (connectionState === 'stale') {
    tips.push(
      'The receiver is responding, but the timestamp is not moving. Check the MQTT path between the ESP32 publisher and json_gen.py.',
    );
  }

  sensors
    .filter((sensor) => sensor.severity !== 'healthy')
    .forEach((sensor) => {
      tips.push(
        `${sensor.label} is ${sensor.statusLabel.toLowerCase()} at ${sensor.displayValue}${sensor.unit}. ${sensor.helperText}`,
      );
    });

  if (voltageMode === 'raw_adc') {
    tips.push(
      'The voltage channel is arriving as a raw ADC count. Convert it in firmware or the receiver before presenting it as a physical voltage.',
    );
  }

  if (tips.length === 0) {
    tips.push(
      'All four sensor channels are inside their watch bands. Keep the board fixed to a four-card layout so operators can scan every live reading in one pass.',
    );
  }

  tips.push(
    'This interface is intentionally built for a single 4-channel node, not a room-and-appliance dashboard.',
  );

  return tips.slice(0, 4);
}

function createHistoryPoint(snapshot: SensorSnapshot, sequence: number): TelemetryPoint {
  return {
    ...snapshot,
    sequence,
    chartLabel: formatHistoryLabel(snapshot.timestamp),
  };
}

function mapBackendAlerts(alerts: BackendAlertResponse[]): SensorAlert[] {
  return alerts.map((alert) => ({
    id: `backend-${alert.record_id}`,
    level: alert.level,
    title: alert.title,
    detail: alert.detail,
  }));
}

function mapBackendSamples(samples: BackendRecentSampleResponse[]): TelemetryPoint[] {
  return samples
    .slice()
    .sort((left, right) => left.sequence - right.sequence)
    .map((sample) =>
      createHistoryPoint(
        {
          temperature: sample.temperature,
          humidity: sample.humidity,
          light: sample.light,
          voltage: sample.voltage,
          timestamp: sample.timestamp,
        },
        sample.sequence,
      ),
    );
}

export function HomeDataProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [sensorData, setSensorData] = useState<SensorSnapshot | null>(null);
  const [sensorHistory, setSensorHistory] = useState<TelemetryPoint[]>([]);
  const [hasSuccessfulFetch, setHasSuccessfulFetch] = useState(false);
  const [receiverReachable, setReceiverReachable] = useState(false);
  const [lastSuccessfulFetchAt, setLastSuccessfulFetchAt] = useState<number | null>(null);
  const [lastPollAt, setLastPollAt] = useState(Date.now());
  const [backendSummary, setBackendSummary] = useState<BackendSummaryResponse | null>(null);
  const [backendAlerts, setBackendAlerts] = useState<SensorAlert[] | null>(null);
  const { message: realtimeMessage, state: realtimeState } =
    useRealtimeMetrics<BackendRealtimeMessage>(REALTIME_URL);

  useEffect(() => {
    const fetchBackendOverview = async () => {
      const response = await fetch(DASHBOARD_OVERVIEW_URL, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`Overview request failed with ${response.status}`);
      }

      const overview: BackendOverviewResponse = await response.json();
      const nextSnapshot: SensorSnapshot = {
        temperature: overview.metrics.temperature,
        humidity: overview.metrics.humidity,
        light: overview.metrics.light,
        voltage: overview.metrics.voltage,
        timestamp: overview.metrics.timestamp,
      };

      setBackendSummary(overview.summary);
      setBackendAlerts(mapBackendAlerts(overview.alerts));
      setReceiverReachable(true);
      setHasSuccessfulFetch(true);
      setLastSuccessfulFetchAt(Date.now());
      setSensorData(nextSnapshot);
      setSensorHistory(mapBackendSamples(overview.recent_samples));
      return true;
    };

    const fetchSensorData = async () => {
      setLastPollAt(Date.now());

      try {
        await fetchBackendOverview();
        return;
      } catch (error) {
        setBackendSummary(null);
        setBackendAlerts(null);
      }

      try {
        const response = await fetch(SENSOR_RECEIVER_URL, { cache: 'no-store' });

        if (!response.ok) {
          setReceiverReachable(false);
          return;
        }

        const nextData: SensorSnapshot = await response.json();
        setReceiverReachable(true);
        setHasSuccessfulFetch(true);
        setLastSuccessfulFetchAt(Date.now());
        setSensorData(nextData);
        setSensorHistory((previous) => {
          const last = previous[previous.length - 1];

          if (last && isSameSnapshot(last, nextData)) {
            return previous;
          }

          const nextPoint = createHistoryPoint(nextData, last ? last.sequence + 1 : 1);
          return [...previous, nextPoint].slice(-HISTORY_LIMIT);
        });
      } catch (error) {
        setReceiverReachable(false);
        setLastPollAt(Date.now());
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, SENSOR_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!realtimeMessage || realtimeMessage.event !== 'telemetry.update') {
      return;
    }

    setBackendSummary(realtimeMessage.summary);
    setBackendAlerts(mapBackendAlerts(realtimeMessage.alerts));
    setReceiverReachable(true);
    setHasSuccessfulFetch(true);
    setLastSuccessfulFetchAt(Date.now());
    setLastPollAt(Date.now());
    setSensorData({
      temperature: realtimeMessage.snapshot.temperature,
      humidity: realtimeMessage.snapshot.humidity,
      light: realtimeMessage.snapshot.light,
      voltage: realtimeMessage.snapshot.voltage,
      timestamp: realtimeMessage.snapshot.timestamp,
    });

    if (realtimeMessage.recent_records.length > 0) {
      setSensorHistory(mapBackendSamples(realtimeMessage.recent_records));
    }
  }, [realtimeMessage]);

  const toggleDevice = (id: string) => {
    setDevices((previous) =>
      previous.map((device) => (device.id === id ? { ...device, isOn: !device.isOn } : device)),
    );
  };

  const addDevice = (device: Omit<Device, 'id'>) => {
    const newDevice = { ...device, id: `dev-${Date.now()}` };
    setDevices((previous) => [...previous, newDevice]);
  };

  const updateDevice = (id: string, updates: Partial<Device>) => {
    setDevices((previous) =>
      previous.map((device) => (device.id === id ? { ...device, ...updates } : device)),
    );
  };

  const deleteDevice = (id: string) => {
    setDevices((previous) => previous.filter((device) => device.id !== id));
  };

  const latestSnapshot = sensorData ?? fallbackSensorSnapshot;
  const rooms: Room[] = [
    {
      id: 'room-lr',
      name: 'Living Room',
      iconType: 'Sofa',
      devices: devices.filter((device) => device.room === 'Living Room'),
    },
    {
      id: 'room-br',
      name: 'Bedroom',
      iconType: 'Bed',
      devices: devices.filter((device) => device.room === 'Bedroom'),
    },
    {
      id: 'room-k',
      name: 'Kitchen',
      iconType: 'CookingPot',
      devices: devices.filter((device) => device.room === 'Kitchen'),
    },
  ];
  const sensors = [
    buildTemperatureCard(latestSnapshot.temperature),
    buildHumidityCard(latestSnapshot.humidity),
    buildLightCard(latestSnapshot.light),
    buildVoltageCard(latestSnapshot.voltage),
  ];
  const now = lastPollAt;
  const fallbackConnectionState = getConnectionState(
    receiverReachable,
    hasSuccessfulFetch,
    sensorData,
    lastSuccessfulFetchAt,
    now,
  );
  const connectionState = backendSummary
    ? normalizeConnectionState(backendSummary.connection_state)
    : fallbackConnectionState;
  const ageSeconds = getSnapshotAgeSeconds(sensorData, lastSuccessfulFetchAt, now);
  const sensorSummary = buildSensorSummary(sensors, connectionState, sensorData?.timestamp, ageSeconds);
  const temperatureC = toCelsius(latestSnapshot.temperature);
  const comfortLevel =
    temperatureC < 18 ? 'Cool' : temperatureC > 26 ? 'Warm' : 'Comfortable';
  const voltageMode = inferVoltageMode(latestSnapshot.voltage);
  const sensorAlerts = backendAlerts ?? buildSensorAlerts(sensors, connectionState, ageSeconds);
  const sensorTransport: SensorTransport = {
    receiverUrl:
      backendSummary || realtimeState === 'open'
        ? `${API_BASE_URL}/api/dashboard/overview`
        : SENSOR_RECEIVER_URL,
    topic: backendSummary?.mqtt_topic ?? MQTT_TOPIC,
    brokerLabel: backendSummary?.mqtt_host ?? MQTT_BROKER_LABEL,
    pollIntervalSeconds:
      realtimeState === 'open'
        ? 0
        : backendSummary?.poll_interval_seconds ?? SENSOR_POLL_INTERVAL_MS / 1000,
    staleAfterSeconds: backendSummary?.stale_after_seconds ?? STALE_AFTER_SECONDS,
    updateCount: backendSummary?.update_count ?? sensorHistory[sensorHistory.length - 1]?.sequence ?? 0,
    connectionState,
    voltageMode,
    temperatureUnit: inferTemperatureUnit(latestSnapshot.temperature),
  };
  const data: HomeData = {
    homeName: 'Energy Supervisor System',
    monthlyCost: 0,
    costTrend: 0,
    currentDate: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }),
    rooms,
    energyDistribution: [
      { name: 'Temperature', value: clamp(Math.abs(toCelsius(latestSnapshot.temperature)) * 2, 0, 100), color: '#F08A81' },
      { name: 'Humidity', value: clamp(latestSnapshot.humidity, 0, 100), color: '#00C8FF' },
      { name: 'Light', value: clamp(latestSnapshot.light, 0, 100), color: '#FBBF24' },
      {
        name: 'Voltage',
        value:
          voltageMode === 'raw_adc'
            ? clamp((latestSnapshot.voltage / 4095) * 100, 0, 100)
            : clamp((latestSnapshot.voltage / 5) * 100, 0, 100),
        color: '#549F75',
      },
    ],
    temperature: {
      current: latestSnapshot.temperature,
      target: inferTemperatureUnit(latestSnapshot.temperature) === '°F' ? 72 : 22,
      comfortLevel,
    },
    lightLevel: {
      percentage: latestSnapshot.light,
      timeOfDay: resolveTimeOfDay(latestSnapshot.light),
    },
    aiTips: buildAiTips(sensors, connectionState, voltageMode),
    sensors,
    sensorSummary,
  };

  return (
    <HomeDataContext.Provider
      value={{
        data,
        devices,
        latestSnapshot,
        sensorHistory,
        sensorTransport,
        sensorAlerts,
        toggleDevice,
        addDevice,
        updateDevice,
        deleteDevice,
      }}
    >
      {children}
    </HomeDataContext.Provider>
  );
}

export function useHomeData() {
  const context = useContext(HomeDataContext);

  if (!context) {
    throw new Error('useHomeData must be used within a HomeDataProvider');
  }

  return context;
}
