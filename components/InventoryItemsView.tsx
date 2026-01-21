import React, { useState, useEffect } from 'react';
import { InventoryItem, AdjustmentType, InventoryAdjustment } from '../types';
import ItemsHeader from './ItemsHeader';
import ItemsToolbar from './ItemsToolbar';
import ItemsFilterPanel from './ItemsFilterPanel';
import ItemsTable from './ItemsTable';
import AddItem from './AddItem';
import ItemForecastPanel from './ItemForecastPanel';
import InventoryAdjustmentPanel from './InventoryAdjustmentPanel';
import ItemDetailPanel from './ItemDetailPanel';
import { supabase } from '../services/supabaseClient';
import { Loader2, AlertCircle } from 'lucide-react';

interface InventoryItemsViewProps {
  items: InventoryItem[]; 
  initialSearchTerm?: string | null;
}

interface FilterState {
  search: string;
  status: string[];
  costMin: string;
  costMax: string;
  onHandMin: string;
  onHandMax: string;
}

const InventoryItemsView: React.FC<InventoryItemsViewProps> = ({ items: initialItems, initialSearchTerm }) => {
  const [localItems, setLocalItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAdjustment, setShowAdjustment] = useState(false);
  
  const [forecastItem, setForecastItem] = useState<InventoryItem | null>(null);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: initialSearchTerm || '',
    status: [],
    costMin: '',
    costMax: '',
    onHandMin: '',
    onHandMax: ''
  });

  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: InventoryItem[] = data.map((item: any) => ({
          id: item.sku,
          sku: item.sku,
          upc: item.upc,
          name: item.title,
          description: item.description,
          category: 'General',
          stock: item.stock_on_hand,
          price: Number(item.cost),
          status: item.status as any,
          image_url: item.image_url,
          store: 'Main Warehouse',
          shipped: 0,
          reserved: 0,
          metadata: {
            createdAt: new Date(item.created_at),
            lastUpdated: new Date(item.created_at)
          }
        }));
        setLocalItems(mapped);
      }
    } catch (err: any) {
      console.error("Error fetching items:", err);
      setError(err.message || "Failed to load inventory from Supabase.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    setIsFilterPanelOpen(false);
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleAddItem = (newItem: InventoryItem) => {
    setLocalItems(prev => [newItem, ...prev]);
    setShowAddItem(false);
  };

  const handleRefresh = () => {
    fetchItems();
  };

  const filteredItems = localItems.filter(item => {
    const searchTerm = filters.search.toLowerCase();
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm) && !item.sku.toLowerCase().includes(searchTerm)) {
      return false;
    }
    if (filters.status.length > 0 && !filters.status.includes(item.status)) {
      return false;
    }
    if (filters.costMin && item.price < parseFloat(filters.costMin)) return false;
    if (filters.costMax && item.price > parseFloat(filters.costMax)) return false;
    if (filters.onHandMin && item.stock < parseFloat(filters.onHandMin)) return false;
    if (filters.onHandMax && item.stock > parseFloat(filters.onHandMax)) return false;
    return true;
  });

  return (
    <div className="relative h-full flex flex-col p-6 max-w-[1600px] mx-auto gap-6 overflow-hidden">
      {isFilterPanelOpen && (
        <ItemsFilterPanel 
          isOpen={isFilterPanelOpen}
          onClose={() => setIsFilterPanelOpen(false)}
          currentFilters={filters}
          onApply={handleApplyFilters}
        />
      )}

      {showAddItem ? (
        <AddItem 
          onClose={() => setShowAddItem(false)} 
          onSave={handleAddItem} 
        />
      ) : (
        <>
          <ItemsHeader 
            onAddItem={() => setShowAddItem(true)} 
            onAdjustment={() => setShowAdjustment(true)}
          />

          <ItemsToolbar 
            onOpenFilter={() => setIsFilterPanelOpen(true)}
            searchTerm={filters.search}
            onSearchChange={handleSearchChange}
          />

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-carbon-800/20 border border-carbon-700 rounded-lg animate-pulse">
               <Loader2 size={40} className="text-kv-accent animate-spin mb-4" />
               <p className="text-carbon-400 font-medium">Loading inventory from cloud...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-carbon-800/20 border border-red-900/50 rounded-lg text-center p-8">
               <AlertCircle size={48} className="text-red-500 mb-4" />
               <h3 className="text-xl font-bold text-white mb-2">Sync Error</h3>
               <p className="text-carbon-400 max-w-md">{error}</p>
               <button 
                 onClick={() => fetchItems()}
                 className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-colors"
               >
                 Retry Connection
               </button>
            </div>
          ) : (
            <ItemsTable 
              items={filteredItems} 
              onShowForecast={(item) => setForecastItem(item)}
              onItemClick={(item) => setDetailItem(item)}
            />
          )}
        </>
      )}

      {showAdjustment && (
        <InventoryAdjustmentPanel 
          isOpen={showAdjustment}
          onClose={() => setShowAdjustment(false)}
          items={localItems}
          onSave={handleRefresh}
        />
      )}

      {forecastItem && (
        <ItemForecastPanel 
          item={forecastItem} 
          onClose={() => setForecastItem(null)} 
        />
      )}

      {detailItem && (
        <ItemDetailPanel 
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onShowForecast={() => {
             setForecastItem(detailItem);
             setDetailItem(null); 
          }}
        />
      )}
    </div>
  );
};

export default InventoryItemsView;