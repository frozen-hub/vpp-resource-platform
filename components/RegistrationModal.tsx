
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FormData, DEMAND_TYPES } from '../types';
import { CHINA_LOCATIONS } from '../constants';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}

const INITIAL_FORM_STATE: FormData = {
  companyName: '',
  province: '',
  city: '',
  address: '',
  capacity: '0.00',
  demandType: '光伏',
  demandTypeOther: '',
  availableTime: '14:00-18:00',
  industryType: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
};

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Update available cities when province changes
  useEffect(() => {
    if (formData.province && CHINA_LOCATIONS[formData.province]) {
      setAvailableCities(CHINA_LOCATIONS[formData.province]);
      setFormData(prev => ({ ...prev, city: '' }));
    } else {
      setAvailableCities([]);
    }
  }, [formData.province]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Pass data to parent component to update state
    onSubmit(formData);
    
    alert(`登记成功！\n企业: ${formData.companyName}\n您的数据已添加到大屏中。`);
    onClose();
    setFormData(INITIAL_FORM_STATE);
  };

  // Helper to parse current time range
  const getTimes = () => {
    const parts = formData.availableTime.split('-');
    return {
      start: parts[0] || '08:00',
      end: parts[1] || '18:00'
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in-up text-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-900/50">
          <h2 className="text-xl font-bold text-cyan-400">登记我的资源</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
          <form id="registrationForm" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">企业名称 <span className="text-red-400">*</span></label>
              <input
                type="text"
                name="companyName"
                required
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-slate-700 text-white placeholder-slate-400"
                placeholder=""
              />
            </div>

            {/* Region Selection (Province/City Only) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">省份 <span className="text-red-400">*</span></label>
                <select
                  name="province"
                  required
                  value={formData.province}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="">请选择</option>
                  {Object.keys(CHINA_LOCATIONS).map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">城市 <span className="text-red-400">*</span></label>
                <select
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!formData.province}
                  className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
                >
                  <option value="">请选择</option>
                  {availableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Detailed Address */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">详细地址 <span className="text-red-400">*</span></label>
              <textarea
                name="address"
                rows={2}
                required
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">需求容量 (MW) <span className="text-red-400">*</span></label>
              <div className="flex items-center border border-slate-600 bg-slate-700 rounded-md overflow-hidden">
                <input
                  type="number"
                  step="0.01"
                  name="capacity"
                  required
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-transparent text-white focus:outline-none"
                />
                <div className="flex flex-col border-l border-slate-600">
                  <button type="button" className="px-2 hover:bg-slate-600 text-slate-300 text-xs py-1" onClick={() => setFormData(p => ({...p, capacity: (parseFloat(p.capacity || '0') + 0.1).toFixed(2)}))}>+</button>
                  <button type="button" className="px-2 hover:bg-slate-600 text-slate-300 text-xs py-1 border-t border-slate-600" onClick={() => setFormData(p => ({...p, capacity: Math.max(0, parseFloat(p.capacity || '0') - 0.1).toFixed(2)}))}>-</button>
                </div>
              </div>
            </div>

            {/* Demand Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">需求类型 <span className="text-red-400">*</span></label>
              <select
                name="demandType"
                required
                value={formData.demandType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {DEMAND_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Conditional Input for "Other" */}
            {formData.demandType === '其他' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-slate-300 mb-1">请补充说明具体需求类型 (必填)</label>
                <input
                  type="text"
                  name="demandTypeOther"
                  required
                  value={formData.demandTypeOther}
                  onChange={handleChange}
                  placeholder="请输入具体类型"
                  className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            )}

            {/* Available Time (Custom Range Picker) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">可响应时段 <span className="text-red-400">*</span></label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    type="time"
                    value={getTimes().start}
                    onChange={(e) => {
                      const currentEnd = getTimes().end;
                      setFormData(prev => ({ ...prev, availableTime: `${e.target.value}-${currentEnd}` }));
                    }}
                    className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                  />
                </div>
                <span className="text-slate-400">至</span>
                <div className="flex-1">
                  <input
                    type="time"
                    value={getTimes().end}
                    onChange={(e) => {
                      const currentStart = getTimes().start;
                      setFormData(prev => ({ ...prev, availableTime: `${currentStart}-${e.target.value}` }));
                    }}
                    className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Industry Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">行业类型 (工业园区/商场/写字楼等) <span className="text-red-400">*</span></label>
              <input
                type="text"
                name="industryType"
                required
                value={formData.industryType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Contact Info */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">联系人 <span className="text-red-400">*</span></label>
              <input
                type="text"
                name="contactName"
                required
                value={formData.contactName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">联系电话 <span className="text-red-400">*</span></label>
              <input
                type="tel"
                name="contactPhone"
                required
                value={formData.contactPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">联系邮箱 <span className="text-red-400">*</span></label>
              <input
                type="email"
                name="contactEmail"
                required
                value={formData.contactEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-900/50">
          <button
            type="submit"
            form="registrationForm"
            className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-2 px-6 rounded-md transition-all shadow-lg shadow-red-500/30 w-full sm:w-auto border border-red-400"
          >
            提交登记
          </button>
        </div>
      </div>
    </div>
  );
};
