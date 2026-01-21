import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { Shipment, ShipmentStatus } from '../types';
import ItemsToolbar from './ItemsToolbar';
import ShipmentsTable from './ShipmentsTable';
import ShipmentsFilterPanel from './ShipmentsFilterPanel';
import AddShipment from './AddShipment';
import ShipmentDetailPanel from './ShipmentDetailPanel';
import ReceiveShipmentPanel from './ReceiveShipmentPanel';
import { supabase } from '../services/supabaseClient';

export interface ShipmentFilterState {
  dateStart: string;
  dateEnd: string;
  minProducts: string;
  maxProducts: string;
  minUnits: string;
  maxUnits: string;
  productSku: string;
  productMinUnits: string;
  productMaxUnits: string;
}

interface ShipmentsManageViewProps {
  initialShipmentId?: string | null;
}

const ShipmentsManageView: React.FC<ShipmentsManageViewProps> = ({ initialShipmentId }) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [receivingShipment, setReceivingShipment] = useState<Shipment | null>(null);

  const [filters, setFilters] = useState<ShipmentFilterState>({
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

  const fetchShipments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          id,
          shipment_id,
          shipment_name,
          status,
          created_at,
          contents:shipment_contents(id, sku, units, cost),
          events:shipment_receiving_events(
            id, 
            created_at,
            items:shipment_receiving_event_items(id, sku, units_received)
          ),
          documents:shipment_documents(id, file_url, file_name, created_at)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const transformed: Shipment[] = data.map((s: any) => {
          const allReceivedItems = (s.events || []).flatMap((e: any) => e.items || []);
          
          const contents = s.contents.map((c: any) => {
            const totalReceived = allReceivedItems
              .filter((l: any) => l.sku === c.sku)
              .reduce((acc: number, l: any) => acc + l.units_received, 0);
            
            return {
              id: c.id,
              sku: c.sku,
              title: c.sku,
              units: c.units,
              costPerUnit: Number(c.cost),
              received: totalReceived
            };
          });

          const receivingLines = (s.events || []).map((e: any) => ({
            id: e.id,
            date: new Date(e.created_at),
            products: (e.items || []).map((i: any) => ({
              sku: i.sku,
              units: i.units_received
            }))
          }));

          const invoices = s.documents.map((d: any) => ({
            id: d.id,
            name: d.file_name,
            url: d.file_url,
            uploadedAt: new Date(d.created_at)
          }));

          return {
            uuid: s.id,
            id: s.shipment_id,
            name: s.shipment_name,
            status: s.status as ShipmentStatus,
            metadata: { createdAt: new Date(s.created_at) },
            contents,
            receivingLines,
            invoices
          };
        });
        setShipments(transformed);
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(err.message || "Could not synchronize shipments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  useEffect(() => {
    if (initialShipmentId) {
      const target = shipments.find(s => s.id === initialShipmentId);
      if (target) setSelectedShipment(target);
    }
  }, [initialShipmentId, shipments]);

  const handleRefresh = () => fetchShipments();

  const filteredShipments = useMemo(() => {
    return shipments.filter(shipment => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        shipment.name.toLowerCase().includes(term) ||
        shipment.id.toLowerCase().includes(term) ||
        shipment.contents.some(p => p.sku.toLowerCase().includes(term));

      if (!matchesSearch) return false;

      if (filters.dateStart && new Date(shipment.metadata.createdAt) < new Date(filters.dateStart)) return false;
      if (filters.dateEnd) {
        const endDate = new Date(filters.dateEnd);
        endDate.setDate(endDate.getDate() + 1);
        if (new Date(shipment.metadata.createdAt) >= endDate) return false;
      }

      const productCount = shipment.contents.length;
      if (filters.minProducts && productCount < Number(filters.minProducts)) return false;
      if (filters.maxProducts && productCount > Number(filters.maxProducts)) return false;

      const totalUnits = shipment.contents.reduce((acc, curr) => acc + curr.units, 0);
      if (filters.minUnits && totalUnits < Number(filters.minUnits)) return false;
      if (filters.maxUnits && totalUnits > Number(filters.maxUnits)) return false;

      if (filters.productSku) {
        const targetSku = filters.productSku.toLowerCase();
        const product = shipment.contents.find(p => p.sku.toLowerCase().includes(targetSku));
        if (!product) return false;
        if (filters.productMinUnits && product.units < Number(filters.productMinUnits)) return false;
        if (filters.productMaxUnits && product.units > Number(filters.productMaxUnits)) return false;
      }

      return true;
    });
  }, [shipments, searchTerm, filters]);

  return (
    <div className="relative h-full flex flex-col p-6 max-w-[1600px] mx-auto gap-6 overflow-hidden">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-3xl font-bold text-white">Shipments</h1>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-kv-accent text-white hover:bg-kv-accentHover rounded text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          <span>Add Shipment</span>
        </button>
      </div>

      <ItemsToolbar 
        onOpenFilter={() => setIsFilterOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-carbon-800/20 rounded-lg">
           <Loader2 size={40} className="animate-spin text-kv-accent mb-4" />
           <p className="text-carbon-400">Syncing with logistics Cloud...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-carbon-800/20 rounded-lg">
           <AlertCircle size={48} className="text-red-500 mb-4" />
           <h3 className="text-white font-bold mb-2">Sync Connection Failed</h3>
           <p className="text-carbon-400 max-w-xs">{error}</p>
           <button onClick={handleRefresh} className="mt-6 px-6 py-2 bg-carbon-800 text-white rounded font-bold border border-carbon-700 hover:bg-carbon-700">Retry</button>
        </div>
      ) : (
        <ShipmentsTable 
          shipments={filteredShipments} 
          onShipmentClick={setSelectedShipment}
          onReceiveClick={setReceivingShipment}
        />
      )}

      {isFilterOpen && (
        <ShipmentsFilterPanel 
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          currentFilters={filters}
          onApply={(f) => {
            setFilters(f);
            setIsFilterOpen(false);
          }}
        />
      )}

      {isAddOpen && (
        <AddShipment 
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSave={() => {
            setIsAddOpen(false);
            handleRefresh();
          }}
        />
      )}

      {selectedShipment && (
        <ShipmentDetailPanel 
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onDataChange={handleRefresh}
        />
      )}

      {receivingShipment && (
        <ReceiveShipmentPanel
          shipment={receivingShipment}
          onClose={() => setReceivingShipment(null)}
          onSave={() => {
            setReceivingShipment(null);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
};

export default ShipmentsManageView;