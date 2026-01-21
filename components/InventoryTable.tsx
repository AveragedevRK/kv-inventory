import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { ArrowUp, ArrowDown } from 'lucide-react';
import ItemsTableRow from './ItemsTableRow';
import ItemsPagination from './ItemsPagination';

interface ItemsTableProps {
  items: InventoryItem[];
  onShowForecast: (item: InventoryItem) => void;
  onItemClick: (item: InventoryItem) => void;
}

const ItemsTable: React.FC<ItemsTableProps> = ({ items, onShowForecast, onItemClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' | null }>({
    key: null,
    direction: null,
  });

  // Sorting Logic
  const sortedItems = [...items].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    
    let valA: any = a[sortConfig.key as keyof InventoryItem];
    let valB: any = b[sortConfig.key as keyof InventoryItem];

    if (sortConfig.key === 'name') {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination Logic
  const totalItems = sortedItems.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedItems = sortedItems.slice(startIndex, endIndex);

  // Handlers
  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        if (current.direction === 'desc') return { key: null, direction: null };
      }
      return { key, direction: 'asc' };
    });
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key || !sortConfig.direction) {
      return <ArrowDown size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} className="text-kv-accent" />
    ) : (
      <ArrowDown size={14} className="text-kv-accent" />
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0 bg-transparent md:bg-carbon-800 md:border md:border-carbon-700 md:rounded-lg">
      <div className="flex-1 overflow-y-auto md:overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="hidden md:table-header-group sticky top-0 z-10 bg-carbon-900 shadow-sm">
            <tr className="border-b border-carbon-700 text-carbon-400 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium w-16">Image</th>
              
              <th 
                className="p-4 font-medium cursor-pointer select-none group hover:text-white transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  SKU / Title
                  {renderSortIcon('name')}
                </div>
              </th>

              <th 
                className="p-4 font-medium text-right cursor-pointer select-none group hover:text-white transition-colors"
                onClick={() => handleSort('stock')}
              >
                <div className="flex items-center justify-end gap-2">
                  On Hand
                  {renderSortIcon('stock')}
                </div>
              </th>

              <th 
                className="p-4 font-medium text-right cursor-pointer select-none group hover:text-white transition-colors"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center justify-end gap-2">
                  Cost
                  {renderSortIcon('price')}
                </div>
              </th>

              <th 
                className="p-4 font-medium text-right cursor-pointer select-none group hover:text-white transition-colors"
                onClick={() => handleSort('shipped')}
              >
                <div className="flex items-center justify-end gap-2">
                  Shipped
                  {renderSortIcon('shipped')}
                </div>
              </th>
              
              <th className="p-4 font-medium text-right w-16">AI</th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group text-sm space-y-4 md:space-y-0 p-1 md:p-0">
            {paginatedItems.map((item) => (
              <ItemsTableRow 
                key={item.id} 
                item={item} 
                onShowForecast={() => onShowForecast(item)}
                onClick={() => onItemClick(item)}
              />
            ))}
            {paginatedItems.length === 0 && (
              <tr className="block md:table-row">
                <td colSpan={6} className="p-8 text-center text-carbon-400 block md:table-cell">
                  No items found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 bg-carbon-900 border-t border-carbon-700 md:rounded-b-lg">
        <ItemsPagination 
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
        />
      </div>
    </div>
  );
};

export default ItemsTable;