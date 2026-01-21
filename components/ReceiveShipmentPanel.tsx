import React, { useState, useRef } from 'react';
import { X, Save, Upload, FileText, Check, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { Shipment, ReceivingLineItem, Invoice, ShipmentStatus } from '../types';
import { supabase } from '../services/supabaseClient';

interface ReceiveShipmentPanelProps {
  shipment: Shipment | null;
  onClose: () => void;
  onSave: () => void;
}

const ReceiveShipmentPanel: React.FC<ReceiveShipmentPanelProps> = ({ shipment, onClose, onSave }) => {
  const [receivedNow, setReceivedNow] = useState<Record<string, number>>({});
  const [newInvoices, setNewInvoices] = useState<Invoice[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!shipment) return null;

  const handleInputChange = (sku: string, value: string, max: number) => {
    const val = Math.min(max, Math.max(0, parseInt(value) || 0));
    setReceivedNow(prev => ({ ...prev, [sku]: val }));
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).map((file: any) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        uploadedAt: new Date(),
        file
      }));
      setNewInvoices(prev => [...prev, ...files]);
    }
  };

  const handleSave = async () => {
    const entries = (Object.entries(receivedNow) as [string, number][]).filter(([_, qty]) => qty > 0);
    if (entries.length === 0 && newInvoices.length === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      for (const [sku, qty] of entries) {
        const item = shipment.contents.find(c => c.sku === sku);
        if (item && (item.received + qty) > item.units) {
          throw new Error(`Exceeded manifest for ${sku}. Max: ${item.units}.`);
        }
      }

      const { data: event, error: eventError } = await supabase
        .from('shipment_receiving_events')
        .insert({ shipment_id: shipment.uuid })
        .select()
        .single();

      if (eventError) throw eventError;

      const itemsToInsert = entries.map(([sku, qty]) => ({
        receiving_event_id: event.id,
        sku: sku.trim(),
        units_received: qty
      }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('shipment_receiving_event_items')
          .insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      for (const [sku, qty] of entries) {
        const { data: currentItem, error: fetchError } = await supabase
          .from('items')
          .select('stock_on_hand')
          .eq('sku', sku)
          .single();
        
        if (fetchError) throw fetchError;
        
        const newStock = (currentItem?.stock_on_hand || 0) + qty;
        
        const { error: updateError } = await supabase
          .from('items')
          .update({ stock_on_hand: newStock })
          .eq('sku', sku);
          
        if (updateError) throw updateError;
      }

      if (newInvoices.length > 0) {
        for (const inv of newInvoices) {
          if (!inv.file) continue;
          const fileName = `receives/${shipment.id}/${Date.now()}-${inv.name}`;
          const { data: uploadData } = await supabase.storage.from('shipment-documents').upload(fileName, inv.file);
          if (uploadData) {
            const { data: urlData } = supabase.storage.from('shipment-documents').getPublicUrl(uploadData.path);
            await supabase.from('shipment_documents').insert({
              shipment_id: shipment.uuid,
              file_url: urlData.publicUrl,
              file_name: inv.name
            });
          }
        }
      }

      let allFulfilled = true;
      for (const item of shipment.contents) {
        const currentTotal = item.received + (receivedNow[item.sku] || 0);
        if (currentTotal < item.units) {
          allFulfilled = false;
          break;
        }
      }

      const nextStatus: ShipmentStatus = allFulfilled ? 'Received' : 'Partially Received';
      if (nextStatus !== shipment.status) {
        await supabase.from('shipments').update({ status: nextStatus }).eq('id', shipment.uuid);
      }

      onSave();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to finalize receiving pipeline.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed pwa-panel-top left-0 right-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl h-full bg-carbon-900 border-l border-carbon-700 shadow-2xl flex flex-col animate-slide-in-right">
        
        <div className="h-20 flex items-center justify-between px-6 shrink-0 border-b border-carbon-800 bg-carbon-900">
           <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Log Entry</h2>
              <p className="text-[10px] text-carbon-500 font-mono font-bold tracking-widest uppercase mt-0.5">{shipment.id}</p>
           </div>
           <button onClick={onClose} disabled={isSaving} className="w-10 h-10 flex items-center justify-center text-carbon-400 hover:text-white transition-colors active:scale-90"><X size={28} /></button>
        </div>

        <div className="flex-1 pwa-scroll-area p-6 space-y-10">
          {error && <div className="p-5 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-400 flex items-center gap-4 text-sm shadow-lg animate-fade-in"><AlertCircle size={24}/><span>{error}</span></div>}

          <section className="space-y-4">
             <div className="flex justify-between items-center px-1">
               <h3 className="text-white font-black uppercase tracking-widest text-[10px]">Session Documents</h3>
               <button onClick={() => fileInputRef.current?.click()} className="text-[9px] font-black uppercase tracking-widest text-kv-accent bg-kv-accent/10 px-3 py-1.5 rounded-full border border-kv-accent/20 active:scale-95 transition-all">Add Proof</button>
             </div>
             <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileUpload} />
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...shipment.invoices, ...newInvoices].map((inv, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-carbon-800/40 rounded-2xl border border-carbon-700/50 shadow-sm">
                     <FileText size={18} className="text-kv-accent" />
                     <span className="text-xs text-white font-bold truncate flex-1">{inv.name}</span>
                  </div>
                ))}
             </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[10px] px-1">Incoming Allocation</h3>
            <div className="bg-carbon-900 border border-carbon-700/50 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-carbon-800/40 text-carbon-600 text-[9px] font-black uppercase tracking-[0.2em] border-b border-carbon-800">
                  <tr><th className="p-4">SKU</th><th className="p-4 text-right">GAP</th><th className="p-4 text-right w-32">ENTRY</th></tr>
                </thead>
                <tbody className="divide-y divide-carbon-800/50 text-sm font-medium">
                  {shipment.contents.map((item) => {
                    const remaining = Math.max(0, item.units - item.received);
                    const isDone = item.received >= item.units;
                    return (
                      <tr key={item.sku} className={`hover:bg-carbon-800/30 transition-colors ${isDone ? 'opacity-40' : ''}`}>
                        <td className="p-4">
                           <div className="text-white font-bold text-xs">{item.sku}</div>
                           <div className="text-[9px] text-carbon-600 font-black uppercase mt-1">Ordered: {item.units}</div>
                        </td>
                        <td className="p-4 text-right font-black font-mono text-carbon-400">{remaining}</td>
                        <td className="p-4 text-right">
                          <input 
                            type="number" 
                            min="0" 
                            max={remaining} 
                            placeholder="0" 
                            value={receivedNow[item.sku] || ''} 
                            onChange={(e) => handleInputChange(item.sku, e.target.value, remaining)} 
                            disabled={isDone || isSaving} 
                            className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent text-white px-3 py-3 rounded-xl text-right outline-none font-black font-mono disabled:opacity-30 transition-all shadow-inner" 
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="h-24 bg-carbon-900 border-t border-carbon-800 flex items-center justify-end px-8 gap-4 safe-bottom">
          <button onClick={onClose} disabled={isSaving} className="px-6 py-4 text-xs font-black uppercase tracking-widest text-carbon-400 hover:text-white transition-colors">Discard</button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-kv-accent hover:bg-kv-accent/90 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-kv-accent/20 active:scale-[0.98] disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
            <span>{isSaving ? 'Synchronizing' : 'Finalize Entry'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiveShipmentPanel;