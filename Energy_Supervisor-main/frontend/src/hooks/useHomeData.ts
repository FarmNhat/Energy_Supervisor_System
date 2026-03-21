import { useState, useEffect } from 'react';

export type DeviceIconType =
'Tv' |
'Lamp' |
'Fan' |
'Refrigerator' |
'AirVent' |
'Monitor' |
'Speaker' |
'Purifier' |
'Dishwasher' |
'CoffeeMaker' |
'Lightbulb';

export type RoomIconType = 'Sofa' | 'Bed' | 'CookingPot';

export interface Device {
  id: string;
  name: string;
  iconType: DeviceIconType;
  isOn: boolean;
  powerDraw: number; // in watts
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

export interface HomeData {
  homeName: string;
  monthlyCost: number;
  costTrend: number; // percentage
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
}

const initialDevices: Device[] = [
{
  id: 'lr-1',
  name: 'Smart TV',
  iconType: 'Tv',
  isOn: true,
  powerDraw: 120,
  room: 'Living Room'
},
{
  id: 'lr-2',
  name: 'Floor Lamp',
  iconType: 'Lamp',
  isOn: true,
  powerDraw: 15,
  room: 'Living Room'
},
{
  id: 'lr-3',
  name: 'AC Unit',
  iconType: 'AirVent',
  isOn: true,
  powerDraw: 850,
  room: 'Living Room'
},
{
  id: 'lr-4',
  name: 'Smart Speaker',
  iconType: 'Speaker',
  isOn: true,
  powerDraw: 5,
  room: 'Living Room'
},
{
  id: 'br-1',
  name: 'Bedside Lamp',
  iconType: 'Lamp',
  isOn: false,
  powerDraw: 10,
  room: 'Bedroom'
},
{
  id: 'br-2',
  name: 'Ceiling Fan',
  iconType: 'Fan',
  isOn: true,
  powerDraw: 45,
  room: 'Bedroom'
},
{
  id: 'br-3',
  name: 'Air Purifier',
  iconType: 'Purifier',
  isOn: true,
  powerDraw: 30,
  room: 'Bedroom'
},
{
  id: 'k-1',
  name: 'Refrigerator',
  iconType: 'Refrigerator',
  isOn: true,
  powerDraw: 150,
  room: 'Kitchen'
},
{
  id: 'k-2',
  name: 'Dishwasher',
  iconType: 'Dishwasher',
  isOn: false,
  powerDraw: 1200,
  room: 'Kitchen'
},
{
  id: 'k-3',
  name: 'Coffee Maker',
  iconType: 'CoffeeMaker',
  isOn: false,
  powerDraw: 800,
  room: 'Kitchen'
},
{
  id: 'k-4',
  name: 'Cabinet Lights',
  iconType: 'Lightbulb',
  isOn: true,
  powerDraw: 20,
  room: 'Kitchen'
}];


export function useHomeData() {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [sensorData, setSensorData] = useState<{
    temperature: number;
    humidity: number;
    light: number;
    voltage: number;
  } | null>(null);

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch('http://localhost:8080/sensors.json');
        if (response.ok) {
          const data = await response.json();
          setSensorData(data);
        }
      } catch (error) {
        // Silently fail if server isn't running
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const toggleDevice = (id: string) => {
    setDevices((prev) =>
    prev.map((device) =>
    device.id === id ? { ...device, isOn: !device.isOn } : device
    )
    );
  };

  const addDevice = (device: Omit<Device, 'id'>) => {
    const newDevice = { ...device, id: `dev-${Date.now()}` };
    setDevices((prev) => [...prev, newDevice]);
  };

  const updateDevice = (id: string, updates: Partial<Device>) => {
    setDevices((prev) =>
    prev.map((device) =>
    device.id === id ? { ...device, ...updates } : device
    )
    );
  };

  const deleteDevice = (id: string) => {
    setDevices((prev) => prev.filter((device) => device.id !== id));
  };

  const rooms: Room[] = [
  {
    id: 'room-lr',
    name: 'Living Room',
    iconType: 'Sofa',
    devices: devices.filter((d) => d.room === 'Living Room')
  },
  {
    id: 'room-br',
    name: 'Bedroom',
    iconType: 'Bed',
    devices: devices.filter((d) => d.room === 'Bedroom')
  },
  {
    id: 'room-k',
    name: 'Kitchen',
    iconType: 'CookingPot',
    devices: devices.filter((d) => d.room === 'Kitchen')
  }];


  const data: HomeData = {
    homeName: 'My Home',
    monthlyCost: 142.3,
    costTrend: -8,
    currentDate: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }),
    rooms,
    energyDistribution: [
    { name: 'Living Room', value: 45, color: '#7AB893' },
    { name: 'Kitchen', value: 35, color: '#F08A81' },
    { name: 'Bedroom', value: 20, color: '#FBBF24' }],

    temperature: {
      current: sensorData ? sensorData.temperature : 72,
      target: 70,
      comfortLevel: 'Comfortable'
    },
    lightLevel: {
      percentage: sensorData ? sensorData.light : 65,
      timeOfDay: 'Afternoon'
    },
    aiTips: [
    'Your AC runs 2 hours longer than average — try setting a timer!',
    'The dishwasher uses less energy during off-peak hours (after 9 PM).',
    'Great job! Your bedroom energy use dropped 15% this week.',
    'Switching to LED bulbs in the kitchen could save $8/month.']

  };

  return { data, devices, toggleDevice, addDevice, updateDevice, deleteDevice };
}