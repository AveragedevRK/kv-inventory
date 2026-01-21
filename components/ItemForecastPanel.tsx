import React, { useState } from 'react';
import { X, TrendingUp, Calendar, ShoppingCart, AlertTriangle, Brain, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { InventoryItem } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateSKUReasoning } from '../services/geminiService';

interface ItemForecastPanelProps {
  item: InventoryItem | null;
  onClose: () => void;
}

const ItemForecastPanel: React.FC<ItemForecastPanelProps> = ({ item, onClose }) => {
  const [isGeneratingReasoning, setIsGeneratingReasoning] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);

  if (!item) return null;

  const handleGetAIReasoning = async () => {
    setIsGeneratingReasoning(true);
    const result = await generateSKUReasoning(item.sku, item.stock, item.shipped || 0);
    setAiReasoning(result);
    setIsGeneratingReasoning(false);
  };

  const daysLeft = Math.max(5, Math.floor(item.stock / 2.5));
  const reorderDate = new Date();
  reorderDate.setDate(reorderDate.getDate() + daysLeft - 5);

  const trendData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    stock: Math.max(0, item.stock - (i * (Math.random() * 2 + 1)) + (i % 7 === 0 ? 20 : 0)),
    predicted: Math.max(0, item.stock - (i * 2.5))
  }));

  const recommendations = [
    { text: `Burn rate high: **X** units avg`, type: "warning" },
    { text: `Supplier lead time: **${Math.floor(Math.random() * 5 + 7)}** days`, type: "info" },
    { text: `Critical stockout: **${new Date(Date.now() + daysLeft * 86400000).toLocaleDateString(undefined, {month:'short', day:'numeric'})}**`, type: "critical" }
  ];

  return (
    <div className="fixed pwa-panel-top left-0 right-0 z-[120] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-md h-full bg-carbon-900 border-l border-carbon-700 shadow-2xl flex flex-col animate-slide-in-right">
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 shrink-0 border-b border-carbon-800 bg-carbon-900">
           <div className="flex items-center gap-2">
              <div className="p-2 bg-kv-accent/10 rounded-lg">
                <Brain size={20} className="text-kv-accent" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight tracking-tight">AI Forecasting</h2>
                <p className="text-xs text-carbon-500 font-mono tracking-tighter">{item.sku}</p>
              </div>
           </div>
           <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-carbon-400 hover:text-white hover:bg-carbon-800 rounded-full transition-colors active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 pwa-scroll-area p-6 space-y-6">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-carbon-800 border border-carbon-700 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
              <span className="text-[10px] uppercase text-carbon-600 font-black mb-3 tracking-widest">Inventory Life</span>
              <div className="flex items-end gap-1.5">
                 <span className={`text-4xl font-black tracking-tighter ${daysLeft < 10 ? 'text-red-400' : 'text-white'}`}>{daysLeft}</span>
                 <span className="text-[11px] text-carbon-500 font-bold mb-1.5">DAYS</span>
              </div>
            </div>
            <div className="bg-carbon-800 border border-carbon-700 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
               <span className="text-[10px] uppercase text-carbon-600 font-black mb-3 tracking-widest">Reorder Pt</span>
               <div className="flex items-end">
                 <span className="text-2xl font-black text-white font-mono tracking-tight">{reorderDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>
               </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-kv-accent/20 to-carbon-800/40 border border-kv-accent/20 rounded-3xl p-7 flex items-center justify-between shadow-xl ring-1 ring-white/5">
            <div>
              <p className="text-[10px] text-kv-accent font-black uppercase tracking-widest mb-2">Restock Target</p>
              <p className="text-4xl font-black text-white tracking-tighter font-mono">350 <span className="text-xs font-bold text-carbon-500 tracking-normal">UNITS</span></p>
            </div>
            <div className="h-14 w-14 bg-kv-accent rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-kv-accent/40 transform rotate-3 ring-1 ring-white/20">
              <ShoppingCart size={28} strokeWidth={2.5} />
            </div>
          </div>

          <div className="bg-carbon-800/40 border border-carbon-700/50 rounded-3xl p-6 shadow-sm">
             <h3 className="text-[9px] uppercase text-carbon-600 font-black mb-6 flex items-center gap-2 tracking-[0.2em]">
               <TrendingUp size={14} className="text-kv-accent" /> CONSUMPTION VELOCITY
             </h3>
             <div className="h-[160px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F62FE" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0F62FE" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis dataKey="day" hide />
                    <YAxis hide domain={[0, 'auto']} />
                    <Tooltip 
                       contentStyle={{
                        backgroundColor: '#161616',
                        borderColor: '#333',
                        borderRadius: '16px',
                        fontSize: '11px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#0F62FE" 
                      fill="url(#colorPredicted)" 
                      strokeWidth={4} 
                    />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-center px-1">
               <h3 className="text-[9px] uppercase text-carbon-600 font-black tracking-[0.25em] flex items-center gap-2">
                 <Brain size={14} className="text-kv-accent" /> AI STRATEGY
               </h3>
               {!aiReasoning && (
                 <button 
                  onClick={handleGetAIReasoning}
                  disabled={isGeneratingReasoning}
                  className="text-[10px] font-black text-kv-accent hover:text-white flex items-center gap-1.5 transition-all bg-kv-accent/10 px-3 py-1.5 rounded-full border border-kv-accent/20 active:scale-95"
                 >
                   {isGeneratingReasoning ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                   {isGeneratingReasoning ? 'COMPUTING...' : 'RUN ANALYTICS'}
                 </button>
               )}
             </div>

             {aiReasoning && (
               <div className="p-5 bg-carbon-900 border border-kv-accent/30 rounded-3xl animate-fade-up shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><Sparkles size={40} className="text-kv-accent"/></div>
                  <div className="text-sm text-carbon-100 font-medium leading-relaxed whitespace-pre-line relative z-10">
                    {aiReasoning}
                  </div>
               </div>
             )}

             <div className="grid grid-cols-1 gap-2.5">
               {recommendations.map((rec, i) => (
                 <div key={i} className="flex items-center gap-4 text-xs p-4 rounded-2xl bg-carbon-800/40 border border-carbon-700/50 hover:bg-carbon-800/60 transition-colors shadow-sm">
                    <div className={`shrink-0 p-2 rounded-xl bg-carbon-900/50 ${
                      rec.type === 'critical' ? 'text-red-400' : 
                      rec.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                    }`}>
                      {rec.type === 'critical' ? <AlertTriangle size={16} /> : 
                       rec.type === 'warning' ? <TrendingUp size={16} /> : <Calendar size={16} />}
                    </div>
                    <span className="text-carbon-300 font-medium leading-normal" dangerouslySetInnerHTML={{ __html: rec.text.replace(/\*\*(.*?)\*\*/g, '<b class="text-white font-black font-mono">$1</b>') }}></span>
                 </div>
               ))}
             </div>
          </div>

        </div>

        <div className="p-6 border-t border-carbon-800 bg-carbon-900 safe-bottom">
           <button 
             onClick={onClose}
             className="w-full py-4 bg-carbon-800 hover:bg-carbon-700 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl transition-all flex items-center justify-center gap-2 border border-carbon-700 active:scale-[0.98]"
           >
             Close View
           </button>
        </div>
      </div>
    </div>
  );
};

export default ItemForecastPanel;