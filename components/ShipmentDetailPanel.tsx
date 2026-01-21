import React, { useState } from 'react';
import { X, Calendar, Package, DollarSign, FileText, CheckCircle, History, Trash2, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Shipment } from '../types';
import { supabase } from '../services/supabaseClient';

interface ShipmentDetailPanelProps {
  shipment: Shipment | null;
  onClose: () => void;
  onDataChange: () => void;
}

const ShipmentDetailPanel: React.FC<ShipmentDetailPanelProps> = ({ shipment, onClose, onDataChange }) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  if (!shipment) return null;

  const totalCost = shipment.contents.reduce((acc, item) => acc + (item.units * item.costPerUnit), 0);
  const totalUnits = shipment.contents.reduce((acc, item) => acc + item.units, 0);
  const totalReceived = shipment.contents.reduce((acc, item) => acc + item.received, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Received': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Partially Received': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm("Confirm deletion of this receiving event. Stock counts will be automatically reverted.")) return;
    
    setIsDeleting(eventId);
    try {
      const { error } = await supabase.from('shipment_receiving_events').delete().eq('id', eventId);
      if (error) throw error;
      onDataChange();
    } catch (err) {
      console.error(err);
      alert("Failed to revert receiving event.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="fixed pwa-panel-top left-0 right-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl h-full bg-carbon-900 border-l border-carbon-700 shadow-2xl flex flex-col animate-slide-in-right">
        
        <div className="flex items-start justify-between p-6 border-b border-carbon-800 bg-carbon-900">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <h2 className="text-2xl font-black text-white tracking-tight leading-none">{shipment.name}</h2>
               <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border ${getStatusColor(shipment.status)}`}>{shipment.status}</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-carbon-500 font-black uppercase tracking-[0.2em]">
              <span className="font-mono bg-carbon-800 px-2 py-1 rounded-lg border border-carbon-700 text-white tracking-normal">{shipment.id}</span>
              <span className="flex items-center gap-1.5"><Calendar size={12} className="text-kv-accent" /> {shipment.metadata.createdAt.toLocaleDateString()}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-carbon-400 hover:text-white transition-colors p-2 active:scale-90"><X size={28} /></button>
        </div>

        <div className="grid grid-cols-3 gap-4 p-6 bg-carbon-900 border-b border-carbon-800/50">
          <div className="bg-carbon-800/40 border border-carbon-700/50 p-5 rounded-2xl shadow-sm">
            <p className="text-[9px] text-carbon-600 uppercase font-black tracking-widest mb-2">Efficiency</p>
            <p className="text-xl font-black text-white flex items-center gap-2 tracking-tighter">
              <CheckCircle size={18} className={totalReceived === totalUnits ? "text-green-400" : "text-yellow-400"}/> 
              {totalReceived} / {totalUnits}
            </p>
          </div>
          <div className="bg-carbon-800/40 border border-carbon-700/50 p-5 rounded-2xl col-span-2 shadow-sm">
            <p className="text-[9px] text-carbon-600 uppercase font-black tracking-widest mb-2">Valuation</p>
            <p className="text-2xl font-black text-green-400 flex items-center gap-2 tracking-tighter font-mono">
              <DollarSign size={20} strokeWidth={3}/> {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="flex-1 pwa-scroll-area p-6 pt-6 space-y-10">
          {shipment.invoices.length > 0 && (
            <section className="space-y-4">
               <h3 className="text-white font-black uppercase tracking-widest text-[10px] px-1">Verified Documentation</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shipment.invoices.map((inv, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-carbon-800/40 border border-carbon-700/50 rounded-2xl group animate-fade-up">
                      <FileText size={18} className="text-kv-accent" />
                      <div className="min-w-0 flex-1">
                        <a href={inv.url} target="_blank" rel="noreferrer" className="text-xs text-white font-bold hover:underline truncate block">
                          {inv.name}
                        </a>
                        <span className="text-carbon-600 text-[9px] font-black uppercase tracking-tighter">{inv.uploadedAt.toLocaleDateString()}</span>
                      </div>
                      <ExternalLink size={14} className="text-carbon-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
               </div>
            </section>
          )}

          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[10px] px-1">Shipment Manifest</h3>
            <div className="bg-carbon-900 border border-carbon-700/50 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-carbon-800/40 text-carbon-600 text-[9px] font-black uppercase tracking-[0.2em] border-b border-carbon-800">
                  <tr>
                    <th className="p-4">SKU</th>
                    <th className="p-4 text-right">ORD</th>
                    <th className="p-4 text-right">RCVD</th>
                    <th className="p-4 text-right">VAR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-800/50 text-sm font-medium">
                  {shipment.contents.map((item, idx) => {
                    const diff = item.units - item.received;
                    return (
                      <tr key={idx} className="hover:bg-carbon-800/30 transition-colors">
                        <td className="p-4 font-mono text-white text-xs">{item.sku}</td>
                        <td className="p-4 text-right text-carbon-400 font-mono">{item.units}</td>
                        <td className="p-4 text-right text-kv-accent font-black font-mono">{item.received}</td>
                        <td className={`p-4 text-right font-black font-mono ${diff === 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {diff === 0 ? 'OK' : `-${diff}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[10px] px-1 flex items-center gap-2"><History size={16} className="text-kv-accent" /> Receiving Log</h3>
            <div className="space-y-4">
               {shipment.receivingLines.length > 0 ? (
                 [...shipment.receivingLines].reverse().map((event) => (
                   <div key={event.id} className="bg-carbon-800/40 border border-carbon-700/50 rounded-3xl p-5 group animate-fade-up relative overflow-hidden shadow-sm">
                      <div className="flex justify-between items-center border-b border-carbon-800/50 pb-3 mb-4">
                         <div className="flex flex-col">
                            <span className="text-[9px] text-carbon-500 font-black uppercase tracking-[0.1em]">{event.date.toLocaleDateString()}</span>
                            <span className="text-[10px] text-white font-mono font-bold">{event.date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                         </div>
                         <button 
                           onClick={() => handleDeleteEvent(event.id)}
                           className="bg-carbon-900/50 p-2.5 rounded-xl text-carbon-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                           disabled={!!isDeleting}
                         >
                           {isDeleting === event.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                         </button>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5">
                         {event.products.map((p, pIdx) => (
                            <div key={pIdx} className="flex items-center justify-between">
                               <span className="text-carbon-400 font-mono text-xs">{p.sku}</span>
                               <span className="text-white font-black text-xs bg-carbon-900/50 px-3 py-1 rounded-full border border-carbon-800/50">+{p.units} UNITS</span>
                            </div>
                         ))}
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                    <History size={32} strokeWidth={1} className="mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-carbon-500">Pipeline Empty</p>
                 </div>
               )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetailPanel;