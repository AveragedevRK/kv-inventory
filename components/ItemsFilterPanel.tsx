import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface FilterState {
  search: string;
  status: string[];
  costMin: string;
  costMax: string;
  onHandMin: string;
  onHandMax: string;
}

interface ItemsFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: FilterState;
  onApply: (filters: FilterState) => void;
}

const ItemsFilterPanel: React.FC<ItemsFilterPanelProps> = ({ 
  isOpen, 
  onClose, 
  currentFilters, 
  onApply 
}) => {
  const [tempFilters, setTempFilters] = useState<FilterState>(currentFilters);

  // Sync temp filters when panel opens or current filters change externally
  useEffect(() => {
    if (isOpen) {
      setTempFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  if (!isOpen) return null;

  const toggleStatus = (status: string) => {
    setTempFilters(prev => ({
      ...prev,
      status: prev.status.includes(status) 
        ? prev.status.filter(s => s !== status) 
        : [...prev.status, status]
    }));
  };

  const handleClear = () => {
    setTempFilters({
      search: '',
      status: [],
      costMin: '',
      costMax: '',
      onHandMin: '',
      onHandMax: ''
    });
  };

  return (
    <div className="fixed pwa-panel-top left-0 right-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="relative w-80 h-full bg-carbon-900 border-l border-carbon-700 shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex justify-between items-center p-6 border-b border-carbon-800">
          <h2 className="text-xl font-bold text-white">Filters</h2>
          <button onClick={onClose} className="text-carbon-400 hover:text-white transition-colors p-2 -mr-2">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 pwa-scroll-area p-6 space-y-6">
          {/* Search Filter */}
          <div className="space-y-2">
            <label className="text-xs text-carbon-400 uppercase tracking-wider font-medium">Search Term</label>
            <input 
              type="text" 
              placeholder="Keywords..."
              value={tempFilters.search}
              onChange={(e) => setTempFilters({...tempFilters, search: e.target.value})}
              className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent text-white px-3 py-3 rounded-lg text-sm outline-none transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-xs text-carbon-400 uppercase tracking-wider font-medium">Status</label>
            <div className="space-y-3 bg-carbon-800/50 p-4 rounded-xl border border-carbon-700/50">
              {['In Stock', 'Stranded', 'Stockout'].map(status => (
                <div 
                  key={status} 
                  onClick={() => toggleStatus(status)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div 
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors duration-200 ${
                      tempFilters.status.includes(status) 
                        ? 'bg-kv-accent border-kv-accent' 
                        : 'bg-carbon-900 border-carbon-600 group-hover:border-kv-accent'
                    }`}
                  >
                    {tempFilters.status.includes(status) && <Check size={14} className="text-white animate-scale-in" />}
                  </div>
                  <span className="text-sm text-carbon-300 group-hover:text-white transition-colors">{status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* On Hand Filter */}
          <div className="space-y-2">
            <label className="text-xs text-carbon-400 uppercase tracking-wider font-medium">On Hand</label>
            <div className="flex gap-3">
              <input 
                type="number" 
                placeholder="Min" 
                value={tempFilters.onHandMin}
                onChange={(e) => setTempFilters({...tempFilters, onHandMin: e.target.value})}
                className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-colors" 
              />
              <input 
                type="number" 
                placeholder="Max" 
                value={tempFilters.onHandMax}
                onChange={(e) => setTempFilters({...tempFilters, onHandMax: e.target.value})}
                className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-colors" 
              />
            </div>
          </div>

          {/* Cost Filter */}
          <div className="space-y-2">
            <label className="text-xs text-carbon-400 uppercase tracking-wider font-medium">Cost</label>
            <div className="flex gap-3">
              <input 
                type="number" 
                placeholder="Min" 
                value={tempFilters.costMin}
                onChange={(e) => setTempFilters({...tempFilters, costMin: e.target.value})}
                className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-colors" 
              />
              <input 
                type="number" 
                placeholder="Max" 
                value={tempFilters.costMax}
                onChange={(e) => setTempFilters({...tempFilters, costMax: e.target.value})}
                className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-colors" 
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-carbon-700 flex gap-3 bg-carbon-900 safe-bottom">
          <button 
            onClick={() => onApply(tempFilters)}
            className="flex-1 px-4 py-3 bg-kv-accent hover:bg-kv-accent/90 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-kv-accent/20"
          >
            Apply
          </button>
          <button 
            onClick={handleClear}
            className="flex-1 px-4 py-3 bg-carbon-800 border border-carbon-700 text-carbon-300 text-sm font-bold rounded-xl transition-all active:scale-95"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemsFilterPanel;