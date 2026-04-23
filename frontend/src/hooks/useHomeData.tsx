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
  deviceLabel?: string;
  enabled?: boolean;
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
  sensorStatus?: Partial<Record<SensorKind, SensorSourceStatus>>;
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
  sourceLabel?: string;
}

export interface SensorSourceStatus {
  metricKey: SensorKind;
  deviceKey: string;
  deviceLabel: string;
  sensorLabel: string;
  enabled: boolean;
  state?: string;
  statusLabel?: string;
  severity?: SensorSeverity;
}

export interface DeviceControlState {
  device1: 0 | 1;
  device2: 0 | 1;
  device3: 0 | 1;
}

export interface DeviceControlStatus extends DeviceControlState {
  controlFile?: string;
  topic?: string;
  published?: boolean;
  publishError?: string | null;
  updatedAt?: string | null;
  reachable: boolean;
}

interface HomeDataContextType {
  data: HomeData;
  devices: Device[];
  deviceControl: DeviceControlStatus;
  latestSnapshot: SensorSnapshot;
  sensorHistory: TelemetryPoint[];
  sensorTransport: SensorTransport;
  sensorAlerts: SensorAlert[];
  updateDeviceControl: (updates: Partial<DeviceControlState>) => Promise<void>;
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
  active_sensors?: number;
  disabled_sensors?: string[];
}

interface BackendAlertResponse {
  record_id: number;
  level: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
  key: string;
  value?: number | null;
  unit?: string | null;
  device_key?: string | null;
  device_label?: string | null;
  sensor_label?: string | null;
  source_label?: string | null;
  created_at: string;
}

interface BackendRecentSampleResponse {
  sequence: number;
  temperature: number;
  humidity: number;
  light: number;
  voltage: number;
  timestamp: string;
  sensor_status?: Record<string, unknown>;
}

interface BackendMetricSnapshot {
  temperature: number;
  humidity: number;
  light: number;
  voltage: number;
  timestamp?: string;
  sensor_status?: Record<string, unknown>;
}

interface BackendOverviewResponse {
  summary: BackendSummaryResponse;
  metrics: BackendMetricSnapshot;
  alerts: BackendAlertResponse[];
  recent_samples: BackendRecentSampleResponse[];
}

interface BackendRealtimeMessage {
  event: string;
  snapshot: BackendMetricSnapshot;
  alerts: BackendAlertResponse[];
  summary: BackendSummaryResponse;
  recent_records: BackendRecentSampleResponse[];
  sent_at: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');
const DASHBOARD_OVERVIEW_URL = `${API_BASE_URL}/api/dashboard/overview`;
const DEVICE_CONTROL_URL = `${API_BASE_URL}/api/control/devices`;
const REALTIME_URL = `${API_BASE_URL.replace(/^http/, 'ws')}/ws/realtime`;
const SENSOR_RECEIVER_URL = import.meta.env.VITE_SENSOR_RECEIVER_URL ?? '/sensors.json';
const PREFER_SENSOR_RECEIVER = String(import.meta.env.VITE_PREFER_SENSOR_RECEIVER ?? 'true') === 'true';
const MQTT_TOPIC = 'sensors/data';
const MQTT_BROKER_LABEL = 'broker.hivemq.com';
const SENSOR_POLL_INTERVAL_MS = 2000;
const STALE_AFTER_SECONDS = 6;
const MAX_SENSOR_CHANNELS = 4;
const HISTORY_LIMIT = 24;
const DEFAULT_SENSOR_STATUS: Record<SensorKind, SensorSourceStatus> = {
  temperature: {
    metricKey: 'temperature',
    deviceKey: 'device1',
    deviceLabel: 'Device 1',
    sensorLabel: 'Temperature',
    enabled: true,
  },
  humidity: {
    metricKey: 'humidity',
    deviceKey: 'device2',
    deviceLabel: 'Device 2',
    sensorLabel: 'Humidity',
    enabled: true,
  },
  light: {
    metricKey: 'light',
    deviceKey: 'device3',
    deviceLabel: 'Device 3',
    sensorLabel: 'Light',
    enabled: true,
  },
  voltage: {
    metricKey: 'voltage',
    deviceKey: 'device4',
    deviceLabel: 'Device 4',
    sensorLabel: 'Voltage',
    enabled: true,
  },
};

const defaultDeviceControl: DeviceControlStatus = {
  device1: 0,
  device2: 0,
  device3: 0,
  reachable: false,
};

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

const coerceSensorEnabled = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    return !['0', 'false', 'off', 'disabled', 'no'].includes(value.trim().toLowerCase());
  }
  return Boolean(value);
};

const normalizeSensorStatus = (
  payload?: Record<string, unknown>,
): Partial<Record<SensorKind, SensorSourceStatus>> => {
  const normalized: Partial<Record<SensorKind, SensorSourceStatus>> = {};

  (Object.keys(DEFAULT_SENSOR_STATUS) as SensorKind[]).forEach((metricKey) => {
    const rawStatus = payload?.[metricKey];
    const status = typeof rawStatus === 'object' && rawStatus !== null
      ? rawStatus as Record<string, unknown>
      : {};

    normalized[metricKey] = {
      ...DEFAULT_SENSOR_STATUS[metricKey],
      deviceKey: typeof status.device_key === 'string' ? status.device_key : DEFAULT_SENSOR_STATUS[metricKey].deviceKey,
      deviceLabel: typeof status.device_label === 'string' ? status.device_label : DEFAULT_SENSOR_STATUS[metricKey].deviceLabel,
      sensorLabel: typeof status.sensor_label === 'string' ? status.sensor_label : DEFAULT_SENSOR_STATUS[metricKey].sensorLabel,
      enabled: typeof status.enabled === 'boolean' ? status.enabled : DEFAULT_SENSOR_STATUS[metricKey].enabled,
      state: typeof status.state === 'string' ? status.state : undefined,
      statusLabel: typeof status.status_label === 'string' ? status.status_label : undefined,
      severity:
        status.severity === 'healthy' || status.severity === 'warning' || status.severity === 'critical'
          ? status.severity
          : undefined,
    };
  });

  return normalized;
};

const normalizeSensorStatusFromRawPayload = (
  payload: Record<string, unknown>,
): Partial<Record<SensorKind, SensorSourceStatus>> => {
  const statusPayload = typeof payload.sensor_status === 'object' && payload.sensor_status !== null
    ? payload.sensor_status as Record<string, unknown>
    : undefined;
  const normalized = normalizeSensorStatus(statusPayload);
  const enabledPayload = typeof payload.sensor_enabled === 'object' && payload.sensor_enabled !== null
    ? payload.sensor_enabled as Record<string, unknown>
    : undefined;
  const disabledSensors = Array.isArray(payload.disabled_sensors)
    ? payload.disabled_sensors.map((item) => String(item).toLowerCase())
    : [];

  (Object.keys(DEFAULT_SENSOR_STATUS) as SensorKind[]).forEach((metricKey) => {
    const current = normalized[metricKey] ?? DEFAULT_SENSOR_STATUS[metricKey];
    const deviceKey = DEFAULT_SENSOR_STATUS[metricKey].deviceKey;
    const enabledValue = enabledPayload?.[metricKey] ?? enabledPayload?.[deviceKey];
    const enabled = enabledValue === undefined
      ? !disabledSensors.includes(metricKey) && !disabledSensors.includes(deviceKey)
      : coerceSensorEnabled(enabledValue);

    normalized[metricKey] = {
      ...current,
      enabled,
    };
  });

  return normalized;
};

const normalizeBackendSnapshot = (snapshot: BackendMetricSnapshot): SensorSnapshot => ({
  temperature: snapshot.temperature,
  humidity: snapshot.humidity,
  light: snapshot.light,
  voltage: snapshot.voltage,
  timestamp: snapshot.timestamp,
  sensorStatus: normalizeSensorStatus(snapshot.sensor_status),
});

const applySensorSourceStatus = (
  card: SensorCardData,
  status?: SensorSourceStatus,
): SensorCardData => {
  const resolvedStatus = status ?? DEFAULT_SENSOR_STATUS[card.id];
  const sourceLabel = `${resolvedStatus.deviceLabel} · ${card.sourceLabel}`;

  if (!resolvedStatus.enabled) {
    return {
      ...card,
      unit: '',
      displayValue: 'OFF',
      statusLabel: 'Disabled',
      helperText: 'Disabled',
      rangeLabel: 'Sensor disabled',
      fillPercent: 0,
      severity: 'warning',
      sourceLabel,
      deviceLabel: resolvedStatus.deviceLabel,
      enabled: false,
    };
  }

  return {
    ...card,
    statusLabel: resolvedStatus.statusLabel ?? card.statusLabel,
    severity: resolvedStatus.severity ?? card.severity,
    helperText: resolvedStatus.statusLabel ?? card.helperText,
    sourceLabel,
    deviceLabel: resolvedStatus.deviceLabel,
    enabled: true,
  };
};

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
      statusLabel: 'Low',
      helperText: 'Low',
      rangeLabel: unit === '°F' ? 'Range 68-79°F' : 'Range 20-26°C',
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
      statusLabel: 'High',
      helperText: 'High',
      rangeLabel: unit === '°F' ? 'Range 68-79°F' : 'Range 20-26°C',
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
      statusLabel: 'High',
      helperText: 'High',
      rangeLabel: unit === '°F' ? 'Range 68-79°F' : 'Range 20-26°C',
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
    helperText: 'Stable',
    rangeLabel: unit === '°F' ? 'Range 68-79°F' : 'Range 20-26°C',
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
      statusLabel: 'Low',
      helperText: 'Low',
      rangeLabel: 'Range 40-60%',
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
      helperText: 'High',
      rangeLabel: 'Range 40-60%',
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
      statusLabel: 'High',
      helperText: 'High',
      rangeLabel: 'Range 40-60%',
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
    helperText: 'Balanced',
    rangeLabel: 'Range 40-60%',
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
      helperText: 'Low',
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
      statusLabel: 'High',
      helperText: 'High',
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
      statusLabel: 'High',
      helperText: 'High',
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
    helperText: 'Balanced',
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
      statusLabel: 'Raw',
      helperText: 'Raw',
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
      statusLabel: 'Low',
      helperText: 'Low',
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
      statusLabel: 'High',
      helperText: 'High',
      rangeLabel: 'Nominal 3.0-3.6V',
      fillPercent,
      severity: 'critical',
      sourceLabel: 'Voltage channel · converted reading',
    };
  }

  if (value < 3.0) {
    return {
      id: 'voltage',
      label: 'Voltage',
      unit: 'V',
      value,
      displayValue: value.toFixed(2),
      description: 'Supply rail reported by the mock or converted node feed.',
      statusLabel: 'Low',
      helperText: 'Low',
      rangeLabel: 'Nominal 3.0-3.6V',
      fillPercent,
      severity: 'warning',
      sourceLabel: 'Voltage channel · converted reading',
    };
  }

  if (value > 3.6) {
    return {
      id: 'voltage',
      label: 'Voltage',
      unit: 'V',
      value,
      displayValue: value.toFixed(2),
      description: 'Supply rail reported by the mock or converted node feed.',
      statusLabel: 'High',
      helperText: 'High',
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
    statusLabel: 'Stable',
    helperText: 'Stable',
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
  const activeSensorCount = sensors.filter((sensor) => sensor.enabled !== false).length;
  const disabledSensors = sensors.filter((sensor) => sensor.enabled === false);
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
      activeSensors: activeSensorCount,
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
      activeSensors: activeSensorCount,
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
    activeSensors: activeSensorCount,
    online: true,
    state: 'live',
    lastUpdatedLabel,
    freshnessLabel: `Live stream · age ${ageSeconds ?? 0}s`,
    headline:
      disabledSensors.length > 0
        ? `${activeSensorCount} of ${MAX_SENSOR_CHANNELS} sensor channels active`
        : `${flaggedSensors.length} of ${MAX_SENSOR_CHANNELS} channels need attention`,
    note:
      disabledSensors.length > 0
        ? 'Disabled sensors remain visible, but backend threshold alerts are skipped for those channels until the device re-enables them.'
        : 'The product stays compact on purpose. Any abnormal reading should be visible immediately without expanding room or device sections.',
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
      sourceLabel: 'Receiver',
    });
  }

  if (connectionState === 'stale') {
    alerts.push({
      id: 'receiver-stale',
      level: 'warning',
      title: 'Telemetry stream is stale',
      detail: `The receiver is reachable, but the last packet is ${ageSeconds ?? '?'} seconds old.`,
      sourceLabel: 'Receiver',
    });
  }

  sensors.forEach((sensor) => {
    if (sensor.severity === 'healthy') {
      return;
    }

    alerts.push({
      id: `${sensor.id}-${sensor.severity}`,
      level: sensor.severity === 'critical' ? 'critical' : 'warning',
      title:
        sensor.enabled === false
          ? `${sensor.deviceLabel ?? sensor.label} disabled`
          : `${sensor.label} is ${sensor.statusLabel.toLowerCase()}`,
      detail: sensor.helperText,
      sourceLabel: sensor.sourceLabel,
    });
  });

  if (alerts.length === 0) {
    alerts.push({
      id: 'stream-healthy',
      level: 'info',
      title: 'Stream healthy',
      detail: 'The receiver is live and all four channels are inside their current watch bands.',
      sourceLabel: 'All sensors',
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
    sourceLabel:
      alert.source_label ??
      (alert.device_label && alert.sensor_label
        ? `${alert.device_label} · ${alert.sensor_label}`
        : undefined),
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
          sensorStatus: normalizeSensorStatus(sample.sensor_status),
        },
        sample.sequence,
      ),
    );
}

function normalizeDeviceControl(payload: Record<string, unknown>): DeviceControlStatus {
  const normalizeSwitch = (value: unknown): 0 | 1 => (Number(value) === 1 ? 1 : 0);

  return {
    device1: normalizeSwitch(payload.device1),
    device2: normalizeSwitch(payload.device2),
    device3: normalizeSwitch(payload.device3),
    controlFile: typeof payload.control_file === 'string' ? payload.control_file : undefined,
    topic: typeof payload.topic === 'string' ? payload.topic : undefined,
    published: typeof payload.published === 'boolean' ? payload.published : undefined,
    publishError: typeof payload.publish_error === 'string' ? payload.publish_error : null,
    updatedAt: typeof payload.updated_at === 'string' ? payload.updated_at : null,
    reachable: true,
  };
}

export function HomeDataProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [deviceControl, setDeviceControl] = useState<DeviceControlStatus>(defaultDeviceControl);
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
      const nextSnapshot = normalizeBackendSnapshot(overview.metrics);

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

      const fetchReceiverData = async () => {
        const response = await fetch(SENSOR_RECEIVER_URL, { cache: 'no-store' });

        if (!response.ok) {
          throw new Error(`Receiver request failed with ${response.status}`);
        }

        const rawData = await response.json();
        const nextData: SensorSnapshot = {
          temperature: Number(rawData.temperature ?? 0),
          humidity: Number(rawData.humidity ?? 0),
          light: Number(rawData.light ?? 0),
          voltage: Number(rawData.voltage ?? 0),
          timestamp: rawData.timestamp,
          sensorStatus: normalizeSensorStatusFromRawPayload(rawData),
        };

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
      };

      const firstFetch = PREFER_SENSOR_RECEIVER ? fetchReceiverData : fetchBackendOverview;
      const fallbackFetch = PREFER_SENSOR_RECEIVER ? fetchBackendOverview : fetchReceiverData;

      try {
        await firstFetch();
        return;
      } catch (error) {
        if (PREFER_SENSOR_RECEIVER) {
          setBackendSummary(null);
          setBackendAlerts(null);
        }
      }

      try {
        await fallbackFetch();
      } catch (error) {
        setReceiverReachable(false);
        setBackendSummary(null);
        setBackendAlerts(null);
        setLastPollAt(Date.now());
      }
    };

    const handleConfigUpdated = () => {
      void fetchSensorData();
    };

    window.addEventListener('energy-supervisor-config-updated', handleConfigUpdated);
    fetchSensorData();
    const interval = setInterval(fetchSensorData, SENSOR_POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener('energy-supervisor-config-updated', handleConfigUpdated);
      clearInterval(interval);
    };
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
    setSensorData(normalizeBackendSnapshot(realtimeMessage.snapshot));

    if (realtimeMessage.recent_records.length > 0) {
      setSensorHistory(mapBackendSamples(realtimeMessage.recent_records));
    }
  }, [realtimeMessage]);

  useEffect(() => {
    const fetchDeviceControl = async () => {
      try {
        const response = await fetch(DEVICE_CONTROL_URL, { cache: 'no-store' });

        if (!response.ok) {
          throw new Error(`Device control request failed with ${response.status}`);
        }

        const payload = await response.json();
        setDeviceControl(normalizeDeviceControl(payload));
      } catch (error) {
        setDeviceControl((previous) => ({ ...previous, reachable: false }));
      }
    };

    fetchDeviceControl();
    const interval = setInterval(fetchDeviceControl, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateDeviceControl = async (updates: Partial<DeviceControlState>) => {
    const optimisticState: DeviceControlState = {
      device1: updates.device1 ?? deviceControl.device1,
      device2: updates.device2 ?? deviceControl.device2,
      device3: updates.device3 ?? deviceControl.device3,
    };

    setDeviceControl((previous) => ({
      ...previous,
      ...optimisticState,
      reachable: true,
      published: undefined,
      publishError: null,
    }));

    try {
      const response = await fetch(DEVICE_CONTROL_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimisticState),
      });

      if (!response.ok) {
        throw new Error(`Device control update failed with ${response.status}`);
      }

      const payload = await response.json();
      setDeviceControl(normalizeDeviceControl(payload));
    } catch (error) {
      setDeviceControl((previous) => ({
        ...previous,
        reachable: false,
        publishError: error instanceof Error ? error.message : 'Device control update failed.',
      }));
    }
  };

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
  ].map((sensor) => applySensorSourceStatus(sensor, latestSnapshot.sensorStatus?.[sensor.id]));
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
  const localSensorAlerts = buildSensorAlerts(sensors, connectionState, ageSeconds);
  const disabledSensorAlerts = localSensorAlerts.filter((alert) => alert.title.toLowerCase().includes('disabled'));
  const sensorAlerts = backendAlerts
    ? [...disabledSensorAlerts, ...backendAlerts].slice(0, 5)
    : localSensorAlerts;
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
        deviceControl,
        latestSnapshot,
        sensorHistory,
        sensorTransport,
        sensorAlerts,
        updateDeviceControl,
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
