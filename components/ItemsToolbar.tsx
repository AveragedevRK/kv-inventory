
import React from 'react';
import { Filter, Search } from 'lucide-react';

interface ItemsToolbarProps {
  onOpenFilter: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const ItemsToolbar: React.FC<ItemsToolbarProps> = ({ 
  onOpenFilter, 
  searchTerm, 
  onSearchChange 
}) => {
  return (
    <div className="flex justify-between items-center shrink-0">
      <button 
        onClick={onOpenFilter}
        className="flex items-center gap-2 px-3 py-2 text-carbon-300 hover:text-white hover:bg-carbon-800 rounded transition-colors text-sm font-medium border border-transparent hover:border-carbon-700"
      >
        <Filter size={16} />
        <span>Filters</span>
      </button>
      
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-400" size={14} />
        <input 
          type="text" 
          placeholder="Search items..." 
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-carbon-800 border border-transparent focus:border-kv-accent text-sm text-white placeholder-carbon-500 pl-9 pr-4 py-2 rounded outline-none transition-all"
        />
      </div>
    </div>
  );
};

export default ItemsToolbar;
