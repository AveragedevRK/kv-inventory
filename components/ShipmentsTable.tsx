import React, { useState } from 'react';
import { Shipment } from '../types';
import { ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import ItemsPagination from './ItemsPagination';

interface ShipmentsTableProps {
  shipments: Shipment[];
  onShipmentClick: (shipment: Shipment) => void;
  onReceiveClick: (shipment: Shipment) => void;
}

const ShipmentsTable: React.FC<ShipmentsTableProps> = ({ shipments, onShipmentClick, onReceiveClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' | null }>({
    key: 'date',
    direction: 'desc',
  });

  // Sorting Logic
  const sortedShipments = [...shipments].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    
    let valA: any;
    let valB: any;

    switch (sortConfig.key) {
      case 'date':
        valA = new Date(a.metadata.createdAt).getTime();
        valB = new Date(b.metadata.createdAt).getTime();
        break;
      case 'name':
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        break;
      case 'units':
        valA = a.contents.reduce((acc, c) => acc + c.units, 0);
        valB = b.contents.reduce((acc, c) => acc + c.units, 0);
        break;
      case 'products':
        valA = a.contents.length;
        valB = b.contents.length;
        break;
      case 'status':
        valA = a.status;
        valB = b.status;
        break;
      default:
        return 0;
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination Logic
  const totalItems = sortedShipments.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedShipments = sortedShipments.slice(startIndex, endIndex);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Received': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Partially Received': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0 bg-transparent md:bg-carbon-800 md:border md:border-carbon-700 md:rounded-lg">
      <div className="flex-1 overflow-y-auto md:overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="hidden md:table-header-group sticky top-0 z-10 bg-carbon-900 shadow-sm">
            <tr className="border-b border-carbon-700 text-carbon-400 text-xs uppercase tracking-wider">
              <th 
                className="p-4 font-medium cursor-pointer select-none group hover:text-white transition-colors"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-2">
                  Date Created
                  {renderSortIcon('date')}
                </div>
              </th>
              
              <th 
                className="p-4 font-medium cursor-pointer select-none group hover:text-white transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Shipment Name
                  {renderSortIcon('name')}
                </div>
              </th>

              <th 
                className="p-4 font-medium text-right cursor-pointer select-none group hover:text-white transition-colors"
                onClick={() => handleSort('units')}
              >
                <div className="flex items-center justify-end gap-2">
                  Total Units
                  {renderSortIcon('units')}
                </div>
              </th>

              <th 
                className="p-4 font-medium text-right cursor-pointer select-none group hover:text-white transition-colors"
                onClick={() => handleSort('products')}
              >
                <div className="flex items-center justify-end gap-2">
                  Total Products
                  {renderSortIcon('products')}
                </div>
              </th>

              <th 
                className="p-4 font-medium cursor-pointer select-none group hover:text-white transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  Status
                  {renderSortIcon('status')}
                </div>
              </th>

              <th className="p-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group text-sm space-y-4 md:space-y-0 p-1 md:p-0">
            {paginatedShipments.map((shipment) => (
              <tr 
                key={shipment.id} 
                onClick={() => onShipmentClick(shipment)}
                className="flex flex-col md:table-row bg-carbon-800 md:bg-transparent rounded-lg md:rounded-none border border-carbon-700 md:border-b hover:bg-carbon-800/50 transition-colors group cursor-pointer last:border-0 overflow-hidden"
              >
                {/* Date Cell */}
                <td className="p-4 flex justify-between items-center md:table-cell md:w-40">
                  <span className="md:hidden text-[10px] text-carbon-400 font-bold uppercase tracking-wider">Date</span>
                  <div className="text-carbon-300 font-mono text-sm flex items-center gap-2">
                    <Calendar size={14} className="md:hidden lg:block" />
                    {new Date(shipment.metadata.createdAt).toLocaleDateString()}
                  </div>
                </td>

                {/* Name/ID Cell */}
                <td className="p-4 flex justify-between items-center md:table-cell border-t border-carbon-700/50 md:border-0">
                  <span className="md:hidden text-[10px] text-carbon-400 font-bold uppercase tracking-wider">Shipment</span>
                  <div className="flex flex-col text-right md:text-left">
                    <span className="text-white font-medium group-hover:text-kv-accent transition-colors text-sm">{shipment.name}</span>
                    <span className="text-carbon-400 text-xs mt-0.5 font-mono">{shipment.id}</span>
                  </div>
                </td>

                {/* Units Cell */}
                <td className="p-4 flex justify-between items-center md:table-cell border-t border-carbon-700/50 md:border-0">
                  <span className="md:hidden text-[10px] text-carbon-400 font-bold uppercase tracking-wider">Total Units</span>
                  <div className="text-right font-mono text-white">
                    {shipment.contents.reduce((acc, c) => acc + c.units, 0)}
                  </div>
                </td>

                {/* Products Cell */}
                <td className="p-4 flex justify-between items-center md:table-cell border-t border-carbon-700/50 md:border-0">
                  <span className="md:hidden text-[10px] text-carbon-400 font-bold uppercase tracking-wider">Products</span>
                  <div className="text-right font-mono text-carbon-300">
                    {shipment.contents.length}
                  </div>
                </td>

                {/* Status Cell */}
                <td className="p-4 flex justify-between items-center md:table-cell border-t border-carbon-700/50 md:border-0">
                  <span className="md:hidden text-[10px] text-carbon-400 font-bold uppercase tracking-wider">Status</span>
                  <div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(shipment.status)}`}>
                      {shipment.status}
                    </span>
                  </div>
                </td>

                {/* Action Cell */}
                <td className="p-4 flex justify-end items-center md:table-cell border-t border-carbon-700/50 md:border-0 bg-carbon-800/50 md:bg-transparent">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onReceiveClick(shipment);
                    }}
                    className="w-full md:w-auto px-4 py-2 md:py-1 bg-carbon-700 hover:bg-kv-accent text-white text-xs font-medium rounded transition-colors border border-carbon-600 hover:border-kv-accent"
                  >
                    Receive
                  </button>
                </td>
              </tr>
            ))}
            {paginatedShipments.length === 0 && (
              <tr className="block md:table-row">
                <td colSpan={6} className="p-8 text-center text-carbon-400 block md:table-cell">
                  No shipments found.
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
          onPageChange={setCurrentPage}
          onPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
        />
      </div>
    </div>
  );
};

export default ShipmentsTable;