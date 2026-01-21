import React, { useState, useEffect, useMemo } from 'react';
import { X, Package, Calendar, Activity, TrendingUp, TrendingDown, Sparkles, Hash, ArrowRight, DollarSign, Loader2, ChevronDown } from 'lucide-react';
import { InventoryItem, InventoryAdjustment } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../services/supabaseClient';

interface ItemDetailPanelProps {
  item: InventoryItem | null;
  onClose: () => void;
  onShowForecast?: () => void;
}

const ItemDetailPanel: React.FC<ItemDetailPanelProps> = ({ item, onClose, onShowForecast }) => {
  const [activeChartTab, setActiveChartTab] = useState<'outbound' | 'inbound'>('outbound');
  const [recentAdjustments, setRecentAdjustments] = useState<any[]>([]);
  const [inboundDailyActivity, setInboundDailyActivity] = useState<any[]>([]);
  const [outboundDailyActivity, setOutboundDailyActivity] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (item) {
      const fetchHistory = async () => {
        setIsLoadingData(true);
        try {
          const [adjRes, inboundRes, outboundRes] = await Promise.all([
            supabase
              .from('inventory_adjustments')
              .select('*')
              .eq('sku', item.sku)
              .order('created_at', { ascending: false })
              .limit(5),
            supabase
              .from('shipment_receiving_event_items')
              .select('units_received, created_at')
              .eq('sku', item.sku)
              .order('created_at', { ascending: false }),
            supabase
              .from('outgoing_shipments')
              .select('date, ordered_units')
              .eq('sku', item.sku)
          ]);

          if (adjRes.data) setRecentAdjustments(adjRes.data);
          
          if (inboundRes.data) {
            const groupedInbound = inboundRes.data.reduce((acc: any, curr: any) => {
              const date = new Date(curr.created_at).toISOString().split('T')[0];
              if (!acc[date]) acc[date] = 0;
              acc[date] += (curr.units_received || 0);
              return acc;
            }, {});

            const sortedInboundList = Object.entries(groupedInbound)
              .map(([date, total]) => ({ date, total }))
              .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setInboundDailyActivity(sortedInboundList);
          }
          
          if (outboundRes.data) {
            const groupedOutbound = outboundRes.data.reduce((acc: any, curr: any) => {
              const d = curr.date;
              if (!acc[d]) acc[d] = 0;
              acc[d] += (curr.ordered_units || 0);
              return acc;
            }, {});
            
            const sortedOutboundList = Object.entries(groupedOutbound)
              .map(([date, total]) => ({ date, total }))
              .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setOutboundDailyActivity(sortedOutboundList);
          }
        } catch (err) {
          console.error("Failed to fetch item history:", err);
        } finally {
          setIsLoadingData(false);
        }
      };

      fetchHistory();
    } else {
      setRecentAdjustments([]);
      setInboundDailyActivity([]);
      setOutboundDailyActivity([]);
    }
  }, [item]);

  const historyData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const dateKey = d.toISOString().split('T')[0];
      
      const realOutbound = outboundDailyActivity.find(h => h.date === dateKey)?.total || 0;
      const realInbound = inboundDailyActivity.find(h => h.date === dateKey)?.total || 0;
      
      return {
        day: i + 1,
        date: dateKey,
        inbound: realInbound,
        outbound: realOutbound
      };
    });
  }, [outboundDailyActivity, inboundDailyActivity]);

  if (!item) return null;

  const getAdjColor = (type: any) => {
    const t = String(type || '');
    if (!t) return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    if (t.includes('Inbound') || t.includes('Manual') || t.includes('Addition')) return 'text-green-400 bg-green-400/10 border-green-400/20';
    if (t.includes('Cycle Count')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    return 'text-red-400 bg-red-400/10 border-red-400/20';
  };

  const formatUnits = (type: any, units: number) => {
    const t = String(type || '');
    if (t.includes('Outbound') || t.includes('Damage') || t.includes('Subtract')) return `-${units}`;
    if (t.includes('Inbound') || t.includes('Addition')) return `+${units}`;
    return units.toString();
  };

  return (
    <div className="fixed pwa-panel-top left-0 right-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl h-full bg-carbon-900 border-l border-carbon-700 shadow-2xl flex flex-col animate-slide-in-right">
        
        <div className="p-6 border-b border-carbon-800 bg-carbon-900 relative">
          <div className="flex justify-between items-start mb-6">
             <div className="flex gap-5">
                <div className="w-20 h-20 bg-carbon-800 rounded-2xl flex items-center justify-center border border-carbon-700 shrink-0 shadow-inner">
                   {item.image_url ? (
                     <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-2xl" />
                   ) : (
                     <Package size={40} className="text-carbon-500" />
                   )}
                </div>
                <div>
                   <h2 className="text-2xl font-black text-white mb-2 tracking-tight leading-tight">{item.name}</h2>
                   <div className="flex flex-wrap items-center gap-2 text-sm text-carbon-500 font-mono tracking-tighter">
                      <span className="bg-carbon-800 px-2 py-1 rounded-lg border border-carbon-700 text-white font-bold">{item.sku}</span>
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-carbon-800/50 rounded-lg border border-carbon-700/50"><Hash size={14}/> {item.category}</span>
                   </div>
                </div>
             </div>
             <div className="flex items-center gap-2">
               {onShowForecast && (
                 <button onClick={onShowForecast} className="flex items-center gap-2 px-4 py-2 bg-kv-accent/10 hover:bg-kv-accent text-kv-accent hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-kv-accent/20 active:scale-95">
                    <Sparkles size={14} /> Forecast
                 </button>
               )}
               <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-carbon-400 hover:text-white hover:bg-carbon-800 rounded-full transition-colors active:scale-90">
                 <X size={24} />
               </button>
             </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6 mt-4 p-5 bg-carbon-800/30 rounded-3xl border border-carbon-700/50">
             <div>
                <span className="text-[10px] uppercase text-carbon-600 font-black tracking-widest block mb-2">Inventory</span>
                <p className="text-2xl font-black text-white tracking-tighter">{item.stock} <span className="text-xs font-bold text-carbon-500 uppercase tracking-normal">units</span></p>
             </div>
             <div>
                <span className="text-[10px] uppercase text-carbon-600 font-black tracking-widest block mb-2">Cost</span>
                <p className="text-2xl font-black text-white tracking-tighter font-mono">${Number(item.price).toFixed(2)}</p>
             </div>
             <div>
                <span className="text-[10px] uppercase text-carbon-600 font-black tracking-widest block mb-2">Valuation</span>
                <p className="text-2xl font-black text-green-400 tracking-tighter font-mono">${(item.stock * item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
             </div>
          </div>
        </div>

        <div className="flex-1 pwa-scroll-area p-6 space-y-8">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-carbon-800/40 p-4 rounded-2xl border border-carbon-700/50">
                 <span className="text-[10px] uppercase text-carbon-600 font-black block mb-1 tracking-widest">Entry</span>
                 <span className="text-sm text-white font-bold">
                   {item.metadata?.createdAt ? new Date(item.metadata.createdAt).toLocaleDateString() : 'N/A'}
                 </span>
              </div>
              <div className="bg-carbon-800/40 p-4 rounded-2xl border border-carbon-700/50">
                 <span className="text-[10px] uppercase text-carbon-600 font-black block mb-1 tracking-widest">Sync</span>
                 <span className="text-sm text-white font-bold">
                   {item.metadata?.lastUpdated ? new Date(item.metadata.lastUpdated).toLocaleDateString() : 'Today'}
                 </span>
              </div>
              <div className="bg-carbon-800/40 p-4 rounded-2xl border border-carbon-700/50">
                 <span className="text-[10px] uppercase text-carbon-600 font-black block mb-1 tracking-widest">Status</span>
                 <span className={`text-sm font-black uppercase tracking-tight ${item.status === 'Stockout' ? 'text-red-400' : item.status === 'Stranded' ? 'text-yellow-400' : 'text-green-400'}`}>
                   {item.status}
                 </span>
              </div>
              <div className="bg-carbon-800/40 p-4 rounded-2xl border border-carbon-700/50">
                 <span className="text-[10px] uppercase text-carbon-600 font-black block mb-1 tracking-widest">Lifecycle</span>
                 <span className="text-sm text-white font-black font-mono">{item.shipped || 0}</span>
              </div>
           </div>

           <div className="bg-carbon-800/40 border border-carbon-700/50 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-white font-black flex items-center gap-2 uppercase tracking-tighter text-sm">
                    <Activity size={18} className="text-kv-accent" /> Movement
                 </h3>
                 <div className="flex bg-carbon-900 p-1.5 rounded-2xl border border-carbon-800/60 shadow-inner">
                    <button 
                       onClick={() => setActiveChartTab('outbound')}
                       className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeChartTab === 'outbound' ? 'bg-carbon-700 text-white shadow-sm' : 'text-carbon-500 hover:text-white'}`}
                    >
                       Outbound
                    </button>
                    <button 
                       onClick={() => setActiveChartTab('inbound')}
                       className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeChartTab === 'inbound' ? 'bg-carbon-700 text-white shadow-sm' : 'text-carbon-500 hover:text-white'}`}
                    >
                       Inbound
                    </button>
                 </div>
              </div>
              <div className="h-[220px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData}>
                       <defs>
                          <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#0F62FE" stopOpacity={0.4}/>
                             <stop offset="95%" stopColor="#0F62FE" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                       <XAxis dataKey="date" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val ? new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : ''} />
                       <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                       <Tooltip 
                          labelStyle={{ color: '#888', marginBottom: '6px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                          contentStyle={{ backgroundColor: '#161616', borderColor: '#333', borderRadius: '16px', fontSize: '11px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                          itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                          cursor={{ stroke: '#525252' }}
                       />
                       <Area 
                          type="monotone" 
                          dataKey={activeChartTab} 
                          stroke="#0F62FE" 
                          fill="url(#colorActivity)" 
                          strokeWidth={3}
                       />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <h3 className="text-white font-black uppercase tracking-widest text-xs">Correction History</h3>
                 {isLoadingData && <Loader2 size={16} className="animate-spin text-kv-accent" />}
              </div>
              <div className="bg-carbon-900 border border-carbon-700/50 rounded-3xl overflow-hidden shadow-sm">
                 <table className="w-full text-left">
                    <thead className="bg-carbon-800/40 text-carbon-600 text-[9px] font-black uppercase tracking-[0.2em] border-b border-carbon-800">
                       <tr>
                          <th className="p-4">Timestamp</th>
                          <th className="p-4">Type</th>
                          <th className="p-4 text-right">Qty</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-carbon-800/50 text-sm">
                       {recentAdjustments.map((adj, i) => (
                          <tr key={adj.id || i} className="hover:bg-carbon-800/30 transition-colors">
                             <td className="p-4">
                                <div className="text-white font-bold text-xs">{new Date(adj.created_at).toLocaleDateString()}</div>
                                <div className="text-[10px] text-carbon-500 font-mono mt-0.5">{new Date(adj.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                {adj.notes && (
                                  <div className="text-[10px] text-carbon-600 mt-2 line-clamp-1 italic">
                                    "{String(adj.notes)}"
                                  </div>
                                )}
                             </td>
                             <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border ${getAdjColor(adj.adjustment_type)}`}>
                                   {String(adj.adjustment_type || 'Manual').replace('Adjustment', '').trim()}
                                </span>
                             </td>
                             <td className="p-4 text-right font-black font-mono text-white">
                                {formatUnits(adj.adjustment_type, adj.units)}
                             </td>
                          </tr>
                       ))}
                       {recentAdjustments.length === 0 && !isLoadingData && (
                          <tr><td colSpan={3} className="p-12 text-center text-carbon-600 font-bold uppercase tracking-widest text-xs opacity-50">Zero Corrections Logged</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPanel;