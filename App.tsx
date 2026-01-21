import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ShipmentsManageView from './components/ShipmentsManageView';
import UsersView from './components/UsersView';
import ConfigurationView from './components/ConfigurationView';
import AddShipment from './components/AddShipment';
import { ViewState, InventoryItem } from './types';
import { supabase } from './services/supabaseClient';
import { Search, Bell, User, Settings, LogOut, CreditCard, UserCircle, Key, Palette, Users as UsersIcon, Package, Truck, Store, Tag, Plus, List, Menu, CheckCircle, Clock, AlertTriangle, ArrowRight, Activity, Brain, AlertOctagon, TrendingUp, Zap, Loader2 } from 'lucide-react';

// Define Search Types
interface SearchResult {
  id: string;
  label: string;
  subLabel: string;
  type: 'Item' | 'Shipment' | 'Store' | 'Content';
  payload: any;
}

// Fix: Defining MOCK_SHIPMENTS locally since it's no longer exported from ShipmentsManageView
const MOCK_SHIPMENTS: any[] = [];

const BrandedCredit: React.FC<{ name: string; url: string; sizeClass?: string; showUnderline?: boolean }> = ({ name, url, sizeClass = "text-sm", showUnderline = false }) => (
  <a href={url} target="_blank" rel="noreferrer" className="group relative inline-block">
    <span className={`branded-text-premium animate-ultra-shimmer ${sizeClass} group-hover:-translate-y-0.5`}>{name}</span>
    {showUnderline && <div className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-kv-brandPink to-kv-brandOrange w-0 group-hover:w-full transition-all duration-500 opacity-0 group-hover:opacity-100 shadow-[0_0_8px_rgba(255,45,146,0.6)]"></div>}
  </a>
);

const LoadingScreen: React.FC = () => (
  <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col items-center justify-center p-6 animate-fade-in overflow-hidden">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-kv-brandPink/5 blur-[120px] rounded-full pointer-events-none"></div>
    <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] mb-12 shadow-[0_0_100px_rgba(255,255,255,0.05)] transform hover:scale-105 transition-transform duration-1000 ring-1 ring-white/10">
        <img src="https://app.kambojventures.com/assets/images/logos/logo.png" alt="KV Logo" className="h-16 md:h-24 w-auto"/>
      </div>
      <div className="w-56 h-1 bg-[#1a1a1a] rounded-full overflow-hidden relative mb-20">
        <div className="absolute top-0 h-full bg-gradient-to-r from-kv-brandPink to-kv-brandOrange animate-loading-bar rounded-full shadow-[0_0_15px_rgba(255,45,146,0.4)]"></div>
      </div>
      <div className="flex flex-col items-center gap-6 text-center animate-fade-up" style={{ animationDelay: '400ms' }}>
        <p className="text-carbon-600 text-[9px] font-black uppercase tracking-[0.5em] opacity-70 select-none">Designed & Developed by</p>
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
          <BrandedCredit name="GM" url="https://github.com/SalesGuyInTech" sizeClass="text-2xl md:text-3xl" /><span className="hidden md:block text-[#1a1a1a] text-3xl font-thin select-none">/</span><BrandedCredit name="RAJAB" url="https://github.com/AveragedevRK/" sizeClass="text-2xl md:text-3xl" />
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Dynamic Inventory for searching
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [searchTargetItemTerm, setSearchTargetItemTerm] = useState<string | null>(null);
  const [searchTargetShipmentId, setSearchTargetShipmentId] = useState<string | null>(null);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddShipmentOpen, setIsAddShipmentOpen] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light') document.documentElement.classList.remove('dark');
    else document.documentElement.classList.add('dark');
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Hide signature 100ms after main loading screen disappears
  useEffect(() => {
    if (!isLoading) {
      const sigTimer = setTimeout(() => {
        setShowSignature(false);
      }, 100);
      return () => clearTimeout(sigTimer);
    }
  }, [isLoading]);

  // Fetch items for global search
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const { data, error } = await supabase.from('items').select('sku, title, stock_on_hand, cost, status');
        if (data) {
          const mapped: InventoryItem[] = data.map((item: any) => ({
            id: item.sku,
            sku: item.sku,
            name: item.title,
            category: 'General',
            stock: item.stock_on_hand, // Rule: Read from stock_on_hand
            price: Number(item.cost),
            status: item.status as any,
            store: 'Main Warehouse',
            reserved: 0
          }));
          setInventoryItems(mapped);
        }
      } catch (err) { console.error(err); }
    };
    fetchInventory();
  }, []);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth < 768) setSidebarCollapsed(true); };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false);
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) setIsSettingsMenuOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) setIsSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (globalSearchTerm.trim().length === 0) {
        setSearchResults([]);
        return;
      }
      const lowerTerm = globalSearchTerm.toLowerCase();
      const results: SearchResult[] = [];
      const stores = [
        { label: 'Vegan Earth', view: ViewState.STORE_VEGAN_EARTH },
        { label: 'Playing Gorilla', view: ViewState.STORE_PLAYING_GORILLA },
        { label: 'Urban VII', view: ViewState.STORE_URBAN_VII },
        { label: 'Chito’s Toys', view: ViewState.STORE_CHITOS_TOYS },
      ];
      stores.forEach(s => { if (s.label.toLowerCase().includes(lowerTerm)) results.push({ id: s.view, label: s.label, subLabel: 'Store Dashboard', type: 'Store', payload: s.view }); });
      inventoryItems.forEach(item => { if (item.sku.toLowerCase().includes(lowerTerm) || item.name.toLowerCase().includes(lowerTerm)) results.push({ id: item.id, label: item.sku, subLabel: item.name, type: 'Item', payload: item }); });
      MOCK_SHIPMENTS.forEach(shipment => { if (shipment.id.toLowerCase().includes(lowerTerm) || shipment.name.toLowerCase().includes(lowerTerm)) results.push({ id: shipment.id, label: shipment.id, subLabel: shipment.name, type: 'Shipment', payload: shipment.id }); });
      setSearchResults(results.slice(0, 8));
      if (results.length > 0) setIsSearchOpen(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [globalSearchTerm, inventoryItems]);

  const handleSearchResultClick = (result: SearchResult) => {
    setIsSearchOpen(false);
    setGlobalSearchTerm('');
    if (result.type === 'Store') setCurrentView(result.payload);
    else if (result.type === 'Item') { setCurrentView(ViewState.INVENTORY_ITEMS); setSearchTargetItemTerm(result.payload.sku); }
    else if (result.type === 'Shipment') { setCurrentView(ViewState.SHIPMENTS_MANAGE); setSearchTargetShipmentId(result.payload); }
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.SHIPMENTS_MANAGE: return <ShipmentsManageView initialShipmentId={searchTargetShipmentId} />;
      case ViewState.USERS: return <UsersView />;
      case ViewState.CONFIGURATION: return <ConfigurationView />;
      default: return <Dashboard view={currentView} initialSearchTerm={searchTargetItemTerm} onNavigate={setCurrentView} />;
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="flex h-screen overflow-hidden text-carbon-100 font-sans bg-kv-bg">
      <Sidebar currentView={currentView} onNavigate={(view) => { setCurrentView(view); setSearchTargetItemTerm(null); setSearchTargetShipmentId(null); if (window.innerWidth < 768) setSidebarCollapsed(true); }} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative z-10">
        <header className="h-16 md:h-16 pt-[env(safe-area-inset-top)] bg-[#121212] border-b border-carbon-800/60 flex items-center justify-between px-4 md:px-6 shrink-0 z-[70] relative shadow-sm gap-4 box-content">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="md:hidden text-carbon-400 hover:text-white p-2 -ml-2"><Menu size={24} /></button>
          <div className="flex items-center gap-4 flex-1 max-w-4xl relative" ref={searchContainerRef}>
            <div className="relative w-full md:w-2/3 lg:w-1/2 xl:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-600" size={16} /><input type="text" value={globalSearchTerm} onChange={(e) => setGlobalSearchTerm(e.target.value)} onFocus={() => { if (searchResults.length > 0) setIsSearchOpen(true); }} placeholder="Search..." className="w-full bg-[#1a1a1a] border-none text-sm text-white placeholder-carbon-600 pl-10 pr-4 py-2 rounded-lg focus:ring-1 focus:ring-kv-accent outline-none" />
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-carbon-900 border border-carbon-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in origin-top backdrop-blur-md bg-carbon-900/90">
                  {searchResults.map((res) => (
                    <button key={res.id} onClick={() => handleSearchResultClick(res)} className="w-full text-left p-4 hover:bg-carbon-800 border-b border-carbon-800 last:border-0 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-carbon-800 flex items-center justify-center shrink-0 border border-carbon-700">
                        {res.type === 'Item' ? <Package size={18} className="text-blue-400"/> : res.type === 'Shipment' ? <Truck size={18} className="text-green-400"/> : <Store size={18} className="text-purple-400"/>}
                      </div>
                      <div><p className="text-sm font-bold text-white">{res.label}</p><p className="text-xs text-carbon-500">{res.subLabel}</p></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0"><button className="p-2 text-carbon-400 hover:text-white hover:bg-carbon-800 rounded-full hidden sm:flex"><Bell size={20} /></button><div className="relative" ref={userMenuRef}><button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 text-sm font-medium p-1 rounded-md text-carbon-400 hover:text-white transition-colors"><div className="w-9 h-9 bg-carbon-800 rounded-full flex items-center justify-center overflow-hidden border border-carbon-700 shadow-inner"><User size={18} /></div></button></div></div>
        </header>
        
        <div id="kv-page-content" className="relative w-full flex-1 overflow-hidden flex flex-col">
          <div className="absolute inset-0 bg-no-repeat bg-center bg-cover opacity-[0.015] pointer-events-none" style={{ backgroundImage: "url('https://app.kambojventures.com/assets/images/logos/logo.png')" }}></div>
          <div className="relative z-10 flex-1 min-h-0 scroll-container">
            <div key={currentView} className="h-full pb-[env(safe-area-inset-bottom)]">{renderContent()}</div>
          </div>

          {showSignature && (
            <footer className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-6 z-10 pointer-events-none animate-fade-in">
              <div className="flex items-center gap-3 pointer-events-auto bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-carbon-800 shadow-2xl ring-1 ring-white/5">
                <span className="text-carbon-600 uppercase tracking-widest text-[8px] font-black select-none opacity-60 whitespace-nowrap">Designed by</span>
                <div className="flex items-center gap-3">
                  <BrandedCredit name="GM" url="https://github.com/SalesGuyInTech" sizeClass="text-[10px]" showUnderline={true} />
                  <span className="text-carbon-800 text-xs font-thin select-none">/</span>
                  <BrandedCredit name="RAJAB" url="https://github.com/AveragedevRK/" sizeClass="text-[10px]" showUnderline={true} />
                </div>
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;