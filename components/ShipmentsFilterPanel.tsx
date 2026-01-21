import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ShipmentFilterState } from './ShipmentsManageView';

interface ShipmentsFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: ShipmentFilterState;
  onApply: (filters: ShipmentFilterState) => void;
}

const ShipmentsFilterPanel: React.FC<ShipmentsFilterPanelProps> = ({ 
  isOpen, 
  onClose, 
  currentFilters, 
  onApply 
}) => {
  const [tempFilters, setTempFilters] = useState<ShipmentFilterState>(currentFilters);

  useEffect(() => {
    if (isOpen) {
      setTempFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  if (!isOpen) return null;

  const handleClear = () => {
    setTempFilters({
      dateStart: '',
      dateEnd: '',
      minProducts: '',
      maxProducts: '',
      minUnits: '',
      maxUnits: '',
      productSku: '',
      productMinUnits: '',
      productMaxUnits: '',
    });
  };

  const handleInputChange = (field: keyof ShipmentFilterState, value: string) => {
    setTempFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed pwa-panel-top left-0 right-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="relative w-80 h-full bg-carbon-900 border-l border-carbon-700 shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex justify-between items-center p-6 border-b border-carbon-800">
          <h2 className="text-xl font-bold text-white tracking-tight">Shipment Filters</h2>
          <button onClick={onClose} className="text-carbon-400 hover:text-white p-2 -mr-2 active:scale-90">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 pwa-scroll-area p-6 space-y-8">
          {/* Date Range */}
          <div className="space-y-3">
            <label className="text-[10px] text-carbon-500 font-black uppercase tracking-[0.2em]">Deployment Window</label>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <span className="text-[10px] text-carbon-600 font-bold uppercase ml-1">Start Date</span>
                <input 
                  type="date"
                  value={tempFilters.dateStart}
                  onChange={(e) => handleInputChange('dateStart', e.target.value)}
                  className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent text-white px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] text-carbon-600 font-bold uppercase ml-1">End Date</span>
                <input 
                  type="date"
                  value={tempFilters.dateEnd}
                  onChange={(e) => handleInputChange('dateEnd', e.target.value)}
                  className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent text-white px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-carbon-800 w-full opacity-50" />

          {/* # of Products */}
          <div className="space-y-3">
            <label className="text-[10px] text-carbon-500 font-black uppercase tracking-[0.2em]">Product Diversity</label>
            <div className="flex gap-3">
              <input 
                type="number" 
                placeholder="Min SKUs" 
                value={tempFilters.minProducts}
                onChange={(e) => handleInputChange('minProducts', e.target.value)}
                className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent px-4 py-3 rounded-xl text-sm text-white outline-none font-bold" 
              />
              <input 
                type="number" 
                placeholder="Max SKUs" 
                value={tempFilters.maxProducts}
                onChange={(e) => handleInputChange('maxProducts', e.target.value)}
                className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent px-4 py-3 rounded-xl text-sm text-white outline-none font-bold" 
              />
            </div>
          </div>

          {/* # of Units */}
          <div className="space-y-3">
            <label className="text-[10px] text-carbon-500 font-black uppercase tracking-[0.2em]">Unit Thresholds</label>
            <div className="flex gap-3">
              <input 
                type="number" 
                placeholder="Min Qty" 
                value={tempFilters.minUnits}
                onChange={(e) => handleInputChange('minUnits', e.target.value)}
                className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent px-4 py-3 rounded-xl text-sm text-white outline-none font-bold" 
              />
              <input 
                type="number" 
                placeholder="Max Qty" 
                value={tempFilters.maxUnits}
                onChange={(e) => handleInputChange('maxUnits', e.target.value)}
                className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent px-4 py-3 rounded-xl text-sm text-white outline-none font-bold" 
              />
            </div>
          </div>

          <div className="h-px bg-carbon-800 w-full opacity-50" />

          {/* Product Specific Filter */}
          <div className="space-y-4 bg-carbon-800/40 p-5 rounded-2xl border border-carbon-700/50">
            <label className="text-[10px] text-kv-accent font-black uppercase tracking-[0.2em]">Target Particular SKU</label>
            <input 
              type="text" 
              placeholder="Enter Exact SKU..."
              value={tempFilters.productSku}
              onChange={(e) => handleInputChange('productSku', e.target.value)}
              className="w-full bg-carbon-900 border border-carbon-700 focus:border-kv-accent text-white px-4 py-3 rounded-xl text-sm outline-none font-mono"
            />
            
            <div className="flex gap-3">
              <input 
                type="number" 
                placeholder="Min" 
                value={tempFilters.productMinUnits}
                onChange={(e) => handleInputChange('productMinUnits', e.target.value)}
                className="w-full bg-carbon-900 border border-carbon-700 focus:border-kv-accent px-3 py-2.5 rounded-xl text-xs text-white outline-none" 
              />
              <input 
                type="number" 
                placeholder="Max" 
                value={tempFilters.productMaxUnits}
                onChange={(e) => handleInputChange('productMaxUnits', e.target.value)}
                className="w-full bg-carbon-900 border border-carbon-700 focus:border-kv-accent px-3 py-2.5 rounded-xl text-xs text-white outline-none" 
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-carbon-700 flex gap-3 bg-carbon-900 safe-bottom">
          <button 
            onClick={() => onApply(tempFilters)}
            className="flex-1 px-4 py-4 bg-kv-accent hover:bg-kv-accent/90 text-white text-sm font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-xl shadow-kv-accent/20"
          >
            Apply
          </button>
          <button 
            onClick={handleClear}
            className="flex-1 px-4 py-4 bg-carbon-800 border border-carbon-700 text-carbon-400 text-sm font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShipmentsFilterPanel;