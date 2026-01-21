import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Store, 
  Package, 
  ChevronDown, 
  ChevronRight,
  Menu,
  Truck,
  PieChart,
  List,
  BarChart3,
  ClipboardList,
  Sparkles,
  TrendingUp,
  Brain,
  Loader2
} from 'lucide-react';
import { ViewState } from '../types';
import { generateStoreProjections } from '../services/geminiService';
import { STORE_PERFORMANCE_DATA } from './Dashboard';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

interface FlyoutState {
  id: string;
  top: number;
  title: string;
  children: any[];
}

interface AIPopoverState {
  storeName: string;
  top: number;
  left: number;
  insight: string;
  loading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, collapsed, setCollapsed }) => {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'stores': true,
    'inventory': true,
    'shipments': true
  });
  
  const [flyout, setFlyout] = useState<FlyoutState | null>(null);
  const [aiPopover, setAiPopover] = useState<AIPopoverState | null>(null);
  const closeFlyoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const aiPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (flyout && flyoutRef.current && !flyoutRef.current.contains(target) && sidebarRef.current && !sidebarRef.current.contains(target)) {
        setFlyout(null);
      }
      if (aiPopover && aiPopoverRef.current && !aiPopoverRef.current.contains(target)) {
        setAiPopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [flyout, aiPopover]);

  const closeAllDropdowns = () => {
    setFlyout(null);
    setAiPopover(null);
  };

  const handleNavigation = (view: ViewState) => {
    closeAllDropdowns();
    onNavigate(view);
  };

  const toggleMenu = (key: string) => {
    if (collapsed) {
      closeAllDropdowns();
      setCollapsed(false);
      setExpandedMenus(prev => ({ ...prev, [key]: true }));
    } else {
      setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, item: any) => {
    if (!collapsed || !item.children) return;
    if (closeFlyoutTimerRef.current) clearTimeout(closeFlyoutTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setFlyout({
      id: item.id,
      top: rect.top,
      title: item.label,
      children: item.children
    });
  };

  const handleMouseLeave = () => {
    if (closeFlyoutTimerRef.current) clearTimeout(closeFlyoutTimerRef.current);
    closeFlyoutTimerRef.current = setTimeout(() => {
      setFlyout(null);
    }, 200);
  };

  const handleFlyoutEnter = () => {
    if (closeFlyoutTimerRef.current) clearTimeout(closeFlyoutTimerRef.current);
  };

  const handleAIClick = async (e: React.MouseEvent, storeLabel: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    
    setAiPopover({
      storeName: storeLabel,
      top: rect.top,
      left: rect.right + 10,
      insight: '',
      loading: true
    });

    const storeData = STORE_PERFORMANCE_DATA.filter((d: any) => 
      d.Account === storeLabel || d.Account === storeLabel.toLowerCase().replace(/\s+/g, '_')
    );
    const result = await generateStoreProjections(storeLabel, storeData);
    
    setAiPopover(prev => prev ? { ...prev, insight: result, loading: false } : null);
  };

  const navStructure = [
    {
      id: 'stores',
      label: 'Stores',
      icon: Store,
      children: [
        { label: 'Vegan Earth', view: ViewState.STORE_VEGAN_EARTH, isStore: true },
        { label: 'Chito’s Toys', view: ViewState.STORE_CHITOS_TOYS, isStore: true },
        { label: 'Playing Gorilla', view: ViewState.STORE_PLAYING_GORILLA, isStore: true },
        { label: 'Urban VII', view: ViewState.STORE_URBAN_VII, isStore: true },
        { label: 'Brandiez', view: 'STORE_BRANDIEZ', isStore: true },
        { label: 'Green Illusions', view: 'STORE_GREEN_ILLUSIONS', isStore: true },
        { label: 'Aquarios', view: 'STORE_AQUARIOS', isStore: true },
        { label: 'NJAYP', view: 'STORE_NJAYP', isStore: true },
        { label: 'CV Media', view: 'STORE_CV_MEDIA', isStore: true },
        { label: 'Bansal Merch', view: 'STORE_BANSAL_MERCH', isStore: true },
        { label: 'Craft Mystic', view: 'STORE_CRAFT_MYSTIC', isStore: true },
        { label: 'Aclark', view: 'STORE_ACLARK', isStore: true },
      ]
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Package,
      children: [
        { label: 'Overview', view: ViewState.INVENTORY_OVERVIEW, icon: PieChart },
        { label: 'Items', view: ViewState.INVENTORY_ITEMS, icon: List },
      ]
    },
    {
      id: 'shipments',
      label: 'Shipments',
      icon: Truck,
      children: [
        { label: 'Overview', view: ViewState.SHIPMENTS_OVERVIEW, icon: BarChart3 },
        { label: 'Manage Shipments', view: ViewState.SHIPMENTS_MANAGE, icon: ClipboardList },
      ]
    }
  ];

  const NavItem = ({ 
    icon: Icon, 
    label, 
    hasChildren = false, 
    expanded = false, 
    onClick,
    onMouseEnter,
    onMouseLeave,
    isActive = false,
    indent = false,
    isStore = false
  }: any) => {
    return (
      <button
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`
          w-full flex items-center gap-3 px-4 py-4 md:py-3 text-sm transition-all duration-150 border-l-2 relative group touch-action-manipulation
          ${isActive 
            ? 'bg-carbon-800 border-kv-accent text-white' 
            : 'border-transparent text-carbon-400 hover:bg-carbon-800 hover:text-white'}
          ${indent ? 'pl-8' : ''}
        `}
      >
        {Icon && <Icon size={18} strokeWidth={1.5} className="shrink-0 transition-transform duration-200" />}
        {!collapsed && (
          <div className="flex-1 text-left flex justify-between items-center overflow-hidden animate-fade-in">
            <span className="truncate font-medium">{label}</span>
            {hasChildren && (
              expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            )}
            {isStore && (
              <div 
                onClick={(e) => handleAIClick(e, label)}
                className="p-1.5 rounded-md hover:bg-carbon-700 text-carbon-500 hover:text-kv-accent transition-colors opacity-0 group-hover:opacity-100"
                title="AI Projections"
              >
                <Sparkles size={14} />
              </div>
            )}
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      <div 
        ref={sidebarRef}
        className={`
          h-screen bg-carbon-900 border-r border-carbon-700/50 flex flex-col transition-all duration-300 ease-in-out relative z-[80] pt-[env(safe-area-inset-top)]
          ${collapsed ? 'w-0 md:w-16' : 'w-64'}
        `}
      >
        <div className="h-16 flex items-center px-4 border-b border-carbon-700/50 shrink-0">
          <div className={`flex items-center gap-3 w-full transition-opacity duration-200 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="w-8 h-8 bg-kv-accent rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105 shadow-lg shadow-kv-accent/20">
              <span className="text-white font-bold text-xs">INV</span>
            </div>
            <span className="font-bold text-white tracking-tight text-lg animate-fade-in">Inventory</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-container py-4">
          <NavItem 
            icon={LayoutDashboard} 
            label="Home" 
            isActive={currentView === ViewState.HOME}
            onClick={() => handleNavigation(ViewState.HOME)}
          />

          {navStructure.map(group => (
            <div key={group.id} className="mt-2">
              <NavItem 
                icon={group.icon} 
                label={group.label} 
                hasChildren 
                expanded={expandedMenus[group.id]}
                onClick={() => toggleMenu(group.id)}
                onMouseEnter={(e: React.MouseEvent) => handleMouseEnter(e, group)}
                onMouseLeave={handleMouseLeave}
              />
              {expandedMenus[group.id] && !collapsed && (
                <div 
                  className={`
                    bg-carbon-900/50 animate-fade-in
                    ${group.id === 'stores' ? 'max-h-[35vh] overflow-y-auto border-b border-carbon-800/50' : ''}
                  `}
                >
                  {group.children.map((child, idx) => (
                    <NavItem 
                      key={idx}
                      label={child.label}
                      icon={child.icon}
                      isActive={currentView === child.view}
                      onClick={() => handleNavigation(child.view as ViewState)}
                      indent
                      isStore={child.isStore}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-carbon-700/50 shrink-0 safe-bottom">
          <button 
            onClick={() => {
              closeAllDropdowns();
              setCollapsed(!collapsed);
            }}
            className="w-full flex items-center justify-center p-3 text-carbon-500 hover:text-white hover:bg-carbon-800 rounded-xl transition-all duration-200 border border-transparent hover:border-carbon-700"
          >
            {collapsed ? <ChevronRight size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {flyout && collapsed && (
        <div 
          ref={flyoutRef}
          className="fixed left-16 z-[100] w-56 bg-carbon-900 border border-carbon-700 rounded-r-2xl shadow-2xl flex flex-col animate-flyout origin-left backdrop-blur-xl bg-carbon-900/90"
          style={{ top: flyout.top }}
          onMouseEnter={handleFlyoutEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="px-4 py-4 border-b border-carbon-800">
            <span className="text-[10px] font-black text-carbon-500 uppercase tracking-widest">
              {flyout.title}
            </span>
          </div>
          <div className={`py-2 ${flyout.id === 'stores' ? 'max-h-[40vh] overflow-y-auto' : ''}`}>
            {flyout.children.map((child, idx) => {
              const Icon = child.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleNavigation(child.view as ViewState)}
                  className={`
                    w-full flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-carbon-800 transition-colors duration-150 group
                    ${currentView === child.view ? 'text-white bg-carbon-800/50' : 'text-carbon-400'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon size={16} />}
                    <span className="font-medium">{child.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;