import React, { useState, useRef, useEffect } from 'react';
// Added ChevronDown to the lucide-react import
import { X, Save, Search, ScanBarcode, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { InventoryItem, AdjustmentType } from '../types';
import { supabase } from '../services/supabaseClient';

interface InventoryAdjustmentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSave: () => void;
}

const InventoryAdjustmentPanel: React.FC<InventoryAdjustmentPanelProps> = ({ isOpen, onClose, items, onSave }) => {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  
  const [units, setUnits] = useState('');
  const [type, setType] = useState<AdjustmentType>('Outbound Shipment');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;
    const startScanner = async () => {
      if (!isScannerOpen || !videoRef.current) return;
      try {
        // Ensure modal animation/visibility is settled
        await new Promise(r => setTimeout(r, 450));
        if (!mounted || !videoRef.current) return;

        const { BrowserMultiFormatReader } = await import('https://esm.sh/@zxing/library@0.20.0');
        if (!mounted) return;
        codeReaderRef.current = new BrowserMultiFormatReader();

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });

        if (!mounted || !videoRef.current) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        const videoEl = videoRef.current;
        videoEl.setAttribute('playsinline', 'true');
        videoEl.muted = true;
        
        // Force reattach logic for iOS compatibility
        videoEl.srcObject = null;
        videoEl.srcObject = stream;
        
        await videoEl.play();

        await codeReaderRef.current.decodeFromVideoElement(videoEl, (result: any) => {
          if (result && mounted) {
            const text = result.getText();
            handleScanResult(text);
          }
        });

      } catch (err: any) {
        console.error("Scanner init error", err);
        if (mounted) setCameraError(err.message || "Failed to access camera. Ensure HTTPS and valid permissions.");
      }
    };

    if (isScannerOpen) {
      startScanner();
    }

    return () => {
      mounted = false;
      cleanupScanner();
    };
  }, [isScannerOpen]);

  const cleanupScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleStartScanner = () => {
    setIsScannerOpen(true);
    setCameraError(null);
  };

  const handleStopScanner = () => {
    cleanupScanner();
    setIsScannerOpen(false);
  };

  const handleScanResult = (text: string) => {
    const match = items.find(i => i.sku === text || i.name.toLowerCase().includes(text.toLowerCase()));
    handleStopScanner();
    if (match) {
      setSelectedItem(match);
      setSearchQuery(match.name);
      setShowAutocomplete(false);
    } else {
      alert(`No item found for barcode: ${text}`);
    }
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.sku.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const handleSubmit = async () => {
    if (!selectedItem || !units || isSaving) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const { data: currentItem, error: fetchError } = await supabase
        .from('items')
        .select('stock_on_hand')
        .eq('sku', selectedItem.sku)
        .single();
        
      if (fetchError) throw fetchError;
      
      const currentStock = currentItem?.stock_on_hand || 0;
      const changeUnits = parseInt(units);
      let newStock = currentStock;

      // Rule behavior based on type
      switch (type) {
        case 'Inbound Addition':
          newStock = currentStock + changeUnits;
          break;
        case 'Outbound Shipment':
        case 'Damage / Breakage':
          newStock = currentStock - changeUnits;
          break;
        case 'Manual Correction':
          newStock = currentStock + changeUnits; 
          break;
        case 'Cycle Count Adjustment':
          newStock = changeUnits;
          break;
      }

      if (newStock < 0) {
        throw new Error(`Insufficient stock. Stock would drop to ${newStock}, but minimum allowed is 0.`);
      }

      const { error: adjError } = await supabase
        .from('inventory_adjustments')
        .insert({
          sku: selectedItem.sku,
          adjustment_type: type,
          units: changeUnits,
          notes: notes || null
        });
        
      if (adjError) throw adjError;

      const { error: updateError } = await supabase
        .from('items')
        .update({ stock_on_hand: newStock })
        .eq('sku', selectedItem.sku);

      if (updateError) throw updateError;

      onSave();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save adjustment.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed pwa-panel-top left-0 right-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-lg h-full bg-carbon-900 border-l border-carbon-700 shadow-2xl flex flex-col animate-slide-in-right">
        
        <div className="h-16 flex items-center justify-between px-6 shrink-0 border-b border-carbon-800 bg-carbon-900">
           <h2 className="text-xl font-bold text-white tracking-tight">Inventory Adjustment</h2>
           <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-carbon-400 hover:text-white hover:bg-carbon-800 rounded-full transition-colors active:scale-90">
             <X size={20} />
           </button>
        </div>

        <div className="flex-1 pwa-scroll-area p-6 space-y-6">
          {error && <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 flex items-center gap-3 text-sm"><AlertCircle size={18}/><span>{error}</span></div>}
          
          <div className="space-y-2 relative">
            <label className="text-xs uppercase tracking-widest text-carbon-500 font-black">Item Search</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-500" size={16} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onFocus={() => setShowAutocomplete(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowAutocomplete(true);
                    setSelectedItem(null);
                  }}
                  className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent text-white pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  placeholder="Search SKU or Title..."
                />
                
                {showAutocomplete && searchQuery && !selectedItem && (
                   <div className="absolute top-full left-0 right-0 mt-2 bg-carbon-900 border border-carbon-700 rounded-xl shadow-2xl z-20 max-h-60 overflow-y-auto">
                      {filteredItems.map(item => (
                        <button 
                          key={item.sku}
                          onClick={() => {
                            setSelectedItem(item);
                            setSearchQuery(item.name);
                            setShowAutocomplete(false);
                          }}
                          className="w-full text-left px-4 py-4 hover:bg-carbon-800 border-b border-carbon-800 last:border-0 flex justify-between items-center"
                        >
                          <div className="flex flex-col">
                            <span className="text-white text-sm font-medium">{item.name}</span>
                            <span className="text-xs text-carbon-500 font-mono">{item.sku}</span>
                          </div>
                        </button>
                      ))}
                      {filteredItems.length === 0 && (
                        <div className="p-4 text-center text-carbon-500 text-sm">No items matching criteria</div>
                      )}
                   </div>
                )}
              </div>
              <button 
                onClick={handleStartScanner}
                className="shrink-0 w-12 flex items-center justify-center bg-carbon-800 border border-carbon-700 hover:border-kv-accent hover:text-kv-accent text-carbon-400 rounded-xl transition-all active:scale-95"
              >
                <ScanBarcode size={24} />
              </button>
            </div>
          </div>

          {selectedItem && (
            <div className="bg-carbon-800/40 p-5 rounded-2xl border border-carbon-700/50 animate-fade-in">
               <div className="flex justify-between items-start mb-3">
                 <div className="flex flex-col">
                    <span className="text-white font-bold">{selectedItem.name}</span>
                    <span className="text-xs text-carbon-500 font-mono tracking-tighter mt-0.5">{selectedItem.sku}</span>
                 </div>
                 <div className="bg-carbon-900 px-3 py-2 rounded-xl border border-carbon-800 text-center">
                    <span className="text-[9px] text-carbon-500 block font-black uppercase tracking-widest mb-0.5">Stock</span>
                    <span className="text-white font-black font-mono text-lg leading-none">{selectedItem.stock}</span>
                 </div>
               </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-carbon-500 font-black">Quantity Change</label>
            <input 
              type="number" 
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent text-white px-4 py-3 rounded-xl text-sm outline-none font-bold"
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-carbon-500 font-black">Adjustment Logic</label>
            <div className="relative">
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as AdjustmentType)}
                className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent text-white px-4 py-3 rounded-xl text-sm outline-none appearance-none font-medium"
              >
                <option value="Outbound Shipment">Outbound Shipment (Subtract)</option>
                <option value="Inbound Addition">Inbound Addition (Add)</option>
                <option value="Damage / Breakage">Damage / Breakage (Subtract)</option>
                <option value="Manual Correction">Manual Correction (Adjust)</option>
                <option value="Cycle Count Adjustment">Cycle Count Adjustment (Replace)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-carbon-500">
                <ChevronDown size={18} />
              </div>
            </div>
            {type === 'Cycle Count Adjustment' && (
              <p className="text-[10px] text-yellow-500 font-bold flex items-center gap-1.5 mt-2 bg-yellow-500/5 p-2 rounded-lg border border-yellow-500/10">
                 <AlertCircle size={14} /> WARNING: This will overwrite current stock level.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-carbon-500 font-black">Audit Notes</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent text-white px-4 py-3 rounded-xl text-sm outline-none resize-none"
              placeholder="Describe why this adjustment is being made..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-carbon-800 bg-carbon-900 flex justify-end gap-3 safe-bottom">
           <button onClick={onClose} disabled={isSaving} className="px-6 py-3 text-sm font-bold text-carbon-400 hover:text-white transition-colors">Cancel</button>
           <button 
             onClick={handleSubmit}
             disabled={!selectedItem || !units || isSaving}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-kv-accent hover:bg-kv-accent/90 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-kv-accent/20 disabled:opacity-50"
           >
             {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
             <span>{isSaving ? 'Synchronizing' : 'Commit Adjustment'}</span>
           </button>
        </div>
      </div>

      {isScannerOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-lg bg-carbon-900 rounded-2xl overflow-hidden shadow-2xl border border-carbon-700 relative flex flex-col animate-fade-up">
            <div className="h-16 bg-carbon-800 flex items-center justify-between px-6 border-b border-carbon-700">
               <h3 className="text-white font-bold tracking-tight">Scanner Ready</h3>
               <button onClick={handleStopScanner} className="text-carbon-400 hover:text-white p-2 -mr-2"><X size={24} /></button>
            </div>
            <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden">
               <video 
                 ref={videoRef} 
                 className="w-full h-full object-cover" 
                 playsInline 
                 muted
               />
               <div className="absolute inset-0 border-[2px] border-kv-accent/40 m-16 rounded-3xl pointer-events-none animate-pulse"></div>
               {cameraError && <div className="absolute text-red-400 bg-black/80 p-6 rounded-xl font-bold border border-red-400/20">{cameraError}</div>}
            </div>
            <div className="p-6 text-center text-carbon-400 text-xs font-medium bg-carbon-900">Place the product barcode within the guide</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryAdjustmentPanel;