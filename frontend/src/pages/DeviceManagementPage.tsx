import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Power,
  Tv,
  Lamp,
  Fan,
  Refrigerator,
  AirVent,
  Monitor,
  Speaker,
  Wind,
  WashingMachine,
  Coffee,
  Lightbulb } from
'lucide-react';
import { useHomeData, Device, DeviceIconType } from '../hooks/useHomeData';
const iconMap: Record<DeviceIconType, React.ElementType> = {
  Tv,
  Lamp,
  Fan,
  Refrigerator,
  AirVent,
  Monitor,
  Speaker,
  Purifier: Wind,
  Dishwasher: WashingMachine,
  CoffeeMaker: Coffee,
  Lightbulb
};
export function DeviceManagementPage() {
  const { devices, toggleDevice, addDevice, updateDevice, deleteDevice } =
  useHomeData();
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    room: 'Living Room',
    iconType: 'Lamp' as DeviceIconType,
    powerDraw: 10
  });
  const rooms = ['All', ...Array.from(new Set(devices.map((d) => d.room)))];
  const iconTypes: DeviceIconType[] = [
  'Tv',
  'Lamp',
  'Fan',
  'Refrigerator',
  'AirVent',
  'Monitor',
  'Speaker',
  'Purifier',
  'Dishwasher',
  'CoffeeMaker',
  'Lightbulb'];

  const filteredDevices = devices.filter((d) => {
    const matchesSearch = d.name.
    toLowerCase().
    includes(searchQuery.toLowerCase());
    const matchesRoom = roomFilter === 'All' || d.room === roomFilter;
    return matchesSearch && matchesRoom;
  });
  const totalPower = devices.
  filter((d) => d.isOn).
  reduce((acc, curr) => acc + curr.powerDraw, 0);
  const activeCount = devices.filter((d) => d.isOn).length;
  const openAddModal = () => {
    setEditingDevice(null);
    setFormData({
      name: '',
      room: 'Living Room',
      iconType: 'Lamp',
      powerDraw: 10
    });
    setIsModalOpen(true);
  };
  const openEditModal = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      room: device.room,
      iconType: device.iconType,
      powerDraw: device.powerDraw
    });
    setIsModalOpen(true);
  };
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDevice) {
      updateDevice(editingDevice.id, formData);
    } else {
      addDevice({
        ...formData,
        isOn: false
      });
    }
    setIsModalOpen(false);
  };
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      exit={{
        opacity: 0,
        y: -10
      }}
      transition={{
        duration: 0.3
      }}
      className="max-w-6xl mx-auto px-4 py-6 md:py-8">

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gray-100 text-gray-700 rounded-xl">
          <Settings className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Device Management
        </h1>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-soft">
          <p className="text-sm text-gray-500 font-medium mb-1">
            Total Devices
          </p>
          <p className="text-2xl font-heading font-bold text-gray-900">
            {devices.length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-soft">
          <p className="text-sm text-gray-500 font-medium mb-1">Active</p>
          <p className="text-2xl font-heading font-bold text-warmgreen-600">
            {activeCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-soft">
          <p className="text-sm text-gray-500 font-medium mb-1">Inactive</p>
          <p className="text-2xl font-heading font-bold text-gray-400">
            {devices.length - activeCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-soft">
          <p className="text-sm text-gray-500 font-medium mb-1">
            Total Power Draw
          </p>
          <p className="text-2xl font-heading font-bold text-amber-500">
            {totalPower}W
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-cream-300 bg-white focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200 outline-none transition-all" />

        </div>
        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-cream-300 bg-white focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200 outline-none transition-all">

          {rooms.map((room) =>
          <option key={room} value={room}>
              {room}
            </option>
          )}
        </select>
        <button
          onClick={openAddModal}
          className="bg-warmgreen-500 text-white rounded-xl px-6 py-3 font-medium hover:bg-warmgreen-600 transition-colors flex items-center justify-center gap-2">

          <Plus className="w-5 h-5" />
          Add Device
        </button>
      </div>

      {/* Device Grid */}
      {filteredDevices.length > 0 ?
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => {
          const Icon = iconMap[device.iconType] || Power;
          const isDeleting = deleteConfirmId === device.id;
          return (
            <motion.div
              layout
              initial={{
                opacity: 0,
                scale: 0.95
              }}
              animate={{
                opacity: 1,
                scale: 1
              }}
              exit={{
                opacity: 0,
                scale: 0.95
              }}
              key={device.id}
              className="bg-white rounded-2xl p-5 shadow-soft flex flex-col">

                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                    className={`p-2.5 rounded-xl ${device.isOn ? 'bg-warmgreen-50 text-warmgreen-600' : 'bg-cream-200 text-gray-500'}`}>

                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-gray-900">
                        {device.name}
                      </h3>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-cream-100 text-gray-600">
                        {device.room}
                      </span>
                    </div>
                  </div>
                  <button
                  onClick={() => toggleDevice(device.id)}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warmgreen-500 ${device.isOn ? 'bg-warmgreen-500' : 'bg-gray-300'}`}>

                    <motion.div
                    layout
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30
                    }}
                    className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm"
                    style={{
                      x: device.isOn ? 20 : 0
                    }} />

                  </button>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-cream-100">
                  <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                    <span
                    className={`inline-block w-2 h-2 rounded-full ${device.isOn ? 'bg-warmgreen-500' : 'bg-gray-400'}`} />

                    {device.powerDraw}W
                  </p>

                  {isDeleting ?
                <div className="flex items-center gap-2">
                      <span className="text-xs text-coral-600 font-medium">
                        Are you sure?
                      </span>
                      <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">

                        Cancel
                      </button>
                      <button
                    onClick={() => deleteDevice(device.id)}
                    className="text-xs px-2 py-1 rounded bg-coral-500 hover:bg-coral-600 text-white">

                        Delete
                      </button>
                    </div> :

                <div className="flex gap-2">
                      <button
                    onClick={() => openEditModal(device)}
                    className="p-1.5 text-gray-400 hover:text-warmgreen-600 hover:bg-warmgreen-50 rounded-lg transition-colors">

                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                    onClick={() => setDeleteConfirmId(device.id)}
                    className="p-1.5 text-gray-400 hover:text-coral-600 hover:bg-coral-50 rounded-lg transition-colors">

                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                }
                </div>
              </motion.div>);

        })}
        </div> :

      <div className="text-center py-20 bg-white rounded-2xl shadow-soft">
          <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-heading font-bold text-gray-900 mb-1">
            No devices found
          </h3>
          <p className="text-gray-500">Try adjusting your search or filter.</p>
        </div>
      }

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen &&
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm">
            <motion.div
            initial={{
              opacity: 0,
              scale: 0.95
            }}
            animate={{
              opacity: 1,
              scale: 1
            }}
            exit={{
              opacity: 0,
              scale: 0.95
            }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

              <div className="flex justify-between items-center p-6 border-b border-cream-100">
                <h2 className="text-xl font-heading font-bold text-gray-900">
                  {editingDevice ? 'Edit Device' : 'Add New Device'}
                </h2>
                <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600">

                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Device Name
                  </label>
                  <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value
                  })
                  }
                  className="w-full rounded-xl border border-cream-300 px-4 py-2.5 focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200 outline-none"
                  placeholder="e.g. Living Room TV" />

                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Room
                    </label>
                    <input
                    type="text"
                    required
                    value={formData.room}
                    onChange={(e) =>
                    setFormData({
                      ...formData,
                      room: e.target.value
                    })
                    }
                    className="w-full rounded-xl border border-cream-300 px-4 py-2.5 focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200 outline-none"
                    list="rooms-list" />

                    <datalist id="rooms-list">
                      {rooms.
                    filter((r) => r !== 'All').
                    map((r) =>
                    <option key={r} value={r} />
                    )}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Power (Watts)
                    </label>
                    <input
                    type="number"
                    required
                    min="1"
                    value={formData.powerDraw}
                    onChange={(e) =>
                    setFormData({
                      ...formData,
                      powerDraw: parseInt(e.target.value) || 0
                    })
                    }
                    className="w-full rounded-xl border border-cream-300 px-4 py-2.5 focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200 outline-none" />

                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Icon Type
                  </label>
                  <select
                  value={formData.iconType}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    iconType: e.target.value as DeviceIconType
                  })
                  }
                  className="w-full rounded-xl border border-cream-300 px-4 py-2.5 focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200 outline-none">

                    {iconTypes.map((type) =>
                  <option key={type} value={type}>
                        {type}
                      </option>
                  )}
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-cream-300 text-gray-700 font-medium hover:bg-cream-50 transition-colors">

                    Cancel
                  </button>
                  <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-warmgreen-500 text-white font-medium hover:bg-warmgreen-600 transition-colors">

                    {editingDevice ? 'Save Changes' : 'Add Device'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        }
      </AnimatePresence>
    </motion.div>);

}