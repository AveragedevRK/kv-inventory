import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ItemsPaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

const ItemsPagination: React.FC<ItemsPaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onPerPageChange
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <div className="border-t border-carbon-700 p-4 flex flex-col sm:flex-row items-center justify-between bg-carbon-900 shrink-0 z-20 gap-4 sm:gap-0">
       <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs text-carbon-400 w-full sm:w-auto justify-center sm:justify-start">
          <span>Items {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems}</span>
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select 
              value={itemsPerPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              className="bg-carbon-900 border border-carbon-700 rounded px-2 py-1 text-white outline-none focus:border-kv-accent"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
       </div>
       
       <div className="flex items-center gap-2">
          <button 
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded hover:bg-carbon-700 text-carbon-400 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-carbon-400 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => onPageChange(currentPage + 1)}
            disabled={endIndex >= totalItems}
            className="p-1 rounded hover:bg-carbon-700 text-carbon-400 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-carbon-400 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
       </div>
    </div>
  );
};

export default ItemsPagination;