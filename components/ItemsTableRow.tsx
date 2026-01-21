import React from 'react';
import { InventoryItem } from '../types';
import { Package, Sparkles } from 'lucide-react';

interface ItemsTableRowProps {
  item: InventoryItem;
  onShowForecast: () => void;
  onClick: () => void;
}

const ItemsTableRow: React.FC<ItemsTableRowProps> = ({ item, onShowForecast, onClick }) => {
  return (
    <tr 
      onClick={onClick}
      className="flex flex-col md:table-row bg-carbon-800 md:bg-transparent rounded-lg md:rounded-none border border-carbon-700 md:border-b hover:bg-carbon-800/50 hover:border-l-4 hover:border-l-kv-accent transition-all duration-150 ease-out group cursor-pointer last:border-0 overflow-hidden relative"
    >
      {/* Image Cell */}
      <td className="p-4 flex justify-between items-center md:table-cell md:w-16">
        <span className="md:hidden text-[10px] text-carbon-400 font-bold uppercase tracking-wider">Image</span>
        <div className="w-10 h-10 bg-carbon-700 rounded flex items-center justify-center text-carbon-400 shrink-0 transition-transform duration-200 group-hover:scale-105 overflow-hidden">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <Package size={20} />
          )}
        </div>
      </td>
      
      {/* Details Cell */}
      <td className="p-4 flex justify-between items-center md:table-cell border-t border-carbon-700/50 md:border-0">
        <span className="md:hidden text-[10px] text-carbon-400 font-bold uppercase tracking-wider">Product Details</span>
        <div className="flex flex-col text-right md:text-left">
          <span className="font-mono text-white font-medium group-hover:text-kv-accent transition-colors duration-150 text-sm">{item.sku}</span>
          <span className="text-carbon-400 text-xs mt-0.5 group-hover:text-carbon-300 transition-colors duration-150 truncate max-w-[200px]">{item.name}</span>
        </div>
      </td>
      
      {/* Stock Cell */}
      <td className="p-4 flex justify-between items-center md:table-cell border-t border-carbon-700/50 md:border-0">
        <span className="md:hidden text-[10px] text-carbon-400 font-bold uppercase tracking-wider">On Hand</span>
        <div className="text-right font-mono text-white group-hover:font-bold transition-all">
          {item.stock}
        </div>
      </td>
      
      {/* Price Cell */}
      <td className="p-4 flex justify-between items-center md:table-cell border-t border-carbon-700/50 md:border-0">
        <span className="md:hidden text-[10px] text-carbon-400 font-bold uppercase tracking-wider">Cost</span>
        <div className="text-right font-mono text-carbon-300">
          ${item.price.toFixed(2)}
        </div>
      </td>
      
      {/* Shipped Cell */}
      <td className="p-4 flex justify-between items-center md:table-cell border-t border-carbon-700/50 md:border-0">
        <span className="md:hidden text-[10px] text-carbon-400 font-bold uppercase tracking-wider">Shipped</span>
        <div className="text-right font-mono text-carbon-300">
          {item.shipped || 0}
        </div>
      </td>

      {/* AI Action Cell */}
      <td className="p-4 flex justify-end items-center md:table-cell border-t border-carbon-700/50 md:border-0">
         <button 
           onClick={(e) => {
             e.stopPropagation();
             onShowForecast();
           }}
           className="w-8 h-8 flex items-center justify-center rounded-full text-carbon-400 hover:text-kv-accent hover:bg-kv-accent/10 transition-colors md:ml-auto relative z-10"
           title="View AI Forecast"
         >
           <Sparkles size={16} />
         </button>
      </td>
    </tr>
  );
};

export default ItemsTableRow;