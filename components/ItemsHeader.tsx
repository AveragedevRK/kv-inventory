import React from 'react';
import { Plus, ClipboardEdit } from 'lucide-react';

interface ItemsHeaderProps {
  onAddItem: () => void;
  onAdjustment: () => void;
}

const ItemsHeader: React.FC<ItemsHeaderProps> = ({ onAddItem, onAdjustment }) => {
  return (
    <div className="flex justify-between items-center shrink-0">
      <h1 className="text-3xl font-bold text-white">Items</h1>
      <div className="flex items-center gap-3">
        <button 
          onClick={onAdjustment}
          className="flex items-center gap-2 px-4 py-2 bg-carbon-800 hover:bg-carbon-700 text-white border border-carbon-600 rounded text-sm font-medium transition-colors"
        >
          <ClipboardEdit size={16} />
          <span>Inventory Adjustment</span>
        </button>
        <button 
          onClick={onAddItem}
          className="flex items-center gap-2 px-4 py-2 bg-kv-accent text-white hover:bg-kv-accentHover rounded text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          <span>Add Item</span>
        </button>
      </div>
    </div>
  );
};

export default ItemsHeader;