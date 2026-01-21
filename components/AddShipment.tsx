import React, { useState, useRef, useEffect } from 'react';
// Added Plus and Package to the lucide-react import
import { ChevronLeft, Save, X, Search, Trash2, ScanBarcode, AlertCircle, FileText, Upload, Loader2, Check, ChevronDown, Plus, Package } from 'lucide-react';
import { ShipmentProduct, ShipmentStatus, Invoice } from '../types';
import { supabase } from '../services/supabaseClient';

interface AddShipmentProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const AddShipment: React.FC<AddShipmentProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    status: 'Processing' as ShipmentStatus,
  });
  
  const [contents, setContents] = useState<ShipmentProduct[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<string>('');

  const [inventoryList, setInventoryList] = useState<{sku: string, title: string}[]>([]);

  useEffect(() => {
    const fetchSkus = async () => {
      const { data } = await supabase.from('items').select('sku, title');
      if (data) setInventoryList(data);
    };
    fetchSkus();
  }, []);

  // Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      if (!isScannerOpen || !videoRef.current) return;

      try {
        // Ensure UI transitions are complete and element is visible
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
        
        // Force reattach to fix black screens in some iOS versions
        videoEl.srcObject = null;
        videoEl.srcObject = stream;
        
        await videoEl.play();

        await codeReaderRef.current.decodeFromVideoElement(videoEl, (result: any) => {
          if (result && mounted) {
            const text = result.getText();
            const match = inventoryList.find(i => i.sku === text);
            if (match) {
              handleAddItem(match);
              handleStopScanner();
            } else {
              alert(`SKU ${text} not found in inventory.`);
            }
          }
        });
      } catch (err) { 
        console.error("Scanner failed to start:", err); 
      }
    };

    if (isScannerOpen) {
      startScanner();
    }

    return () => {
      mounted = false;
      cleanupScanner();
    };
  }, [isScannerOpen, inventoryList]);

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

  const handleStopScanner = () => {
    cleanupScanner();
    setIsScannerOpen(false);
  };

  if (!isOpen) return null;

  const handleAddItem = (item: { sku: string; title: string }) => {
    if (contents.some(c => c.sku === item.sku)) return;
    setContents(prev => [...prev, { sku: item.sku, title: item.title, units: 1, costPerUnit: 0, received: 0 }]);
    setProductSearch('');
    setShowAutocomplete(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).map((file: any) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        uploadedAt: new Date(),
        file 
      }));
      setInvoices(prev => [...prev, ...files]);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Required";
    if (!formData.id.trim()) newErrors.id = "Required";
    if (contents.length === 0) newErrors.contents = "Add at least one product";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || isSaving) return;

    setIsSaving(true);
    setSaveProgress('Validating...');

    try {
      const skus = contents.map(c => c.sku.trim());
      const { data, error: verifyError } = await supabase
        .from("items")
        .select("sku")
        .in("sku", skus);

      if (verifyError) throw verifyError;

      const found = new Set((data ?? []).map(d => d.sku));
      const invalidSkus = skus.filter(sku => !found.has(sku));

      if (invalidSkus.length > 0) {
        throw new Error(`Invalid SKUs: ${invalidSkus.join(', ')}`);
      }

      setSaveProgress('Creating record...');
      const { data: shipment, error: shipError } = await supabase
        .from('shipments')
        .insert({
          shipment_id: formData.id,
          shipment_name: formData.name,
          status: formData.status
        })
        .select()
        .single();

      if (shipError) throw shipError;

      setSaveProgress('Populating contents...');
      const contentsRows = contents.map(c => ({
        shipment_id: shipment.id,
        sku: c.sku.trim(),
        units: c.units,
        cost: c.costPerUnit
      }));
      const { error: contentsError } = await supabase.from('shipment_contents').insert(contentsRows);
      if (contentsError) throw contentsError;

      if (invoices.length > 0) {
        setSaveProgress(`Uploading docs...`);
        for (const inv of invoices) {
          if (!inv.file) continue;
          
          const fileName = `${shipment.id}/${Date.now()}-${inv.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('shipment-documents')
            .upload(fileName, inv.file);
          
          if (uploadError) {
            console.error("Storage Error:", uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('shipment-documents')
            .getPublicUrl(uploadData.path);

          await supabase.from('shipment_documents').insert({
            shipment_id: shipment.id,
            file_url: urlData.publicUrl,
            file_name: inv.name
          });
        }
      }

      setSaveProgress('Complete');
      setTimeout(() => {
        onSave();
      }, 300);

    } catch (err: any) {
      console.error(err);
      setErrors({ submit: err.message || "Failed to create shipment." });
      setIsSaving(false);
    }
  };

  const filteredAutocomplete = inventoryList.filter(item => 
    item.sku.toLowerCase().includes(productSearch.toLowerCase()) || 
    item.title.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="fixed pwa-panel-top left-0 right-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full h-full bg-carbon-900 border-l border-carbon-700 shadow-2xl flex flex-col animate-slide-in-right sm:w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%]">
        
        <div className="h-20 flex items-center px-6 shrink-0 border-b border-carbon-800">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-carbon-400 hover:text-white p-2 -ml-2 active:scale-90"><ChevronLeft size={28} /></button>
          <h2 className="text-2xl font-black text-white tracking-tight ml-2">New Shipment</h2>
        </div>

        <div className="flex-1 pwa-scroll-area p-6 space-y-10">
          {errors.submit && (
            <div className="p-5 bg-red-500/10 border border-red-500/50 rounded-2xl flex items-center gap-4 text-red-400 animate-fade-in shadow-lg">
               <AlertCircle size={24} />
               <span className="text-sm font-medium">{errors.submit}</span>
            </div>
          )}

          <section className="space-y-5">
            <h3 className="text-[10px] text-carbon-500 font-black uppercase tracking-[0.25em]">General Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] text-carbon-600 font-black uppercase ml-1">Reference Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent text-white px-4 py-4 rounded-2xl text-sm font-medium outline-none transition-all" placeholder="e.g. Asia-Q1-Inventory" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-carbon-600 font-black uppercase ml-1">Universal Tracking ID</label>
                <input type="text" value={formData.id} onChange={(e) => setFormData(p => ({ ...p, id: e.target.value }))} className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent text-white px-4 py-4 rounded-2xl text-sm font-mono font-bold outline-none transition-all" placeholder="SH-MSTR-XXXX" />
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] text-carbon-500 font-black uppercase tracking-[0.25em]">Documentation</h3>
              <button onClick={() => fileInputRef.current?.click()} className="text-[10px] bg-carbon-800 hover:bg-carbon-700 text-white font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-carbon-700 transition-all flex items-center gap-2 active:scale-95">
                <Upload size={14}/> Upload Files
              </button>
            </div>
            <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileUpload} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {invoices.map((inv, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-carbon-800/40 rounded-2xl border border-carbon-700/50 shadow-sm animate-fade-up">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={18} className="text-kv-accent shrink-0"/>
                    <span className="text-xs text-white font-bold truncate">{inv.name}</span>
                  </div>
                  <button onClick={() => setInvoices(p => p.filter((_, i) => i !== idx))} className="text-carbon-600 hover:text-red-400 p-2 transition-colors active:scale-90">
                    <X size={18} />
                  </button>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="col-span-full border-2 border-dashed border-carbon-800 rounded-3xl py-10 flex flex-col items-center justify-center text-carbon-600">
                  <FileText size={32} strokeWidth={1} className="mb-2" />
                  <span className="text-xs font-bold uppercase tracking-widest">No documents attached</span>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] text-carbon-500 font-black uppercase tracking-[0.25em]">Inventory Contents</h3>
            </div>
            <div className="flex gap-3 relative">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-carbon-500" size={18} />
                <input 
                  type="text" 
                  value={productSearch} 
                  onFocus={() => setShowAutocomplete(true)} 
                  onChange={(e) => setProductSearch(e.target.value)} 
                  className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent text-white pl-12 pr-4 py-4 rounded-2xl text-sm font-medium outline-none transition-all" 
                  placeholder="Query Master SKU Database..." 
                />
                {showAutocomplete && productSearch && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-carbon-900 border border-carbon-700 rounded-2xl z-50 shadow-2xl overflow-hidden animate-fade-in max-h-[250px] overflow-y-auto">
                    {filteredAutocomplete.map(item => (
                      <button key={item.sku} onClick={() => handleAddItem(item)} className="w-full text-left px-5 py-4 hover:bg-carbon-800 border-b border-carbon-800 last:border-0 flex justify-between items-center group">
                        <div className="flex flex-col">
                          <span className="text-white text-sm font-bold group-hover:text-kv-accent transition-colors">{item.title}</span>
                          <span className="text-[10px] text-carbon-500 font-mono tracking-tighter mt-0.5">{item.sku}</span>
                        </div>
                        <Plus size={16} className="text-carbon-600 group-hover:text-white" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setIsScannerOpen(true)} className="w-14 bg-carbon-800 border border-carbon-700 hover:border-kv-accent hover:text-kv-accent flex items-center justify-center text-carbon-400 rounded-2xl transition-all active:scale-95">
                <ScanBarcode size={28}/>
              </button>
            </div>

            <div className="space-y-4">
              {contents.map((item, index) => (
                <div key={item.sku} className="bg-carbon-800/40 border border-carbon-700/50 rounded-3xl p-6 shadow-sm animate-fade-up relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-5 relative z-10">
                    <div className="flex flex-col">
                      <span className="text-white font-black tracking-tight">{item.title}</span>
                      <span className="text-[10px] text-carbon-500 font-mono tracking-tighter mt-1">{item.sku}</span>
                    </div>
                    <button onClick={() => setContents(p => p.filter((_, i) => i !== index))} className="bg-carbon-900/50 p-3 rounded-2xl text-carbon-600 hover:text-red-400 transition-all active:scale-90 shadow-inner">
                      <Trash2 size={20}/>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-5 relative z-10">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase text-carbon-600 font-black tracking-widest ml-1">Ordered Units</label>
                      <input type="number" value={item.units} onChange={(e) => setContents(p => p.map((c, i) => i === index ? { ...c, units: Number(e.target.value) } : c))} className="w-full bg-carbon-900/50 border border-carbon-700 text-white px-4 py-3 rounded-2xl text-sm font-bold font-mono outline-none focus:border-kv-accent"/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase text-carbon-600 font-black tracking-widest ml-1">Unit Valuation ($)</label>
                      <input type="number" value={item.costPerUnit} onChange={(e) => setContents(p => p.map((c, i) => i === index ? { ...c, costPerUnit: Number(e.target.value) } : c))} className="w-full bg-carbon-900/50 border border-carbon-700 text-white px-4 py-3 rounded-2xl text-sm font-bold font-mono outline-none focus:border-kv-accent"/>
                    </div>
                  </div>
                </div>
              ))}
              {contents.length === 0 && (
                <div className="bg-carbon-900 border border-dashed border-carbon-800 rounded-3xl py-16 flex flex-col items-center justify-center text-carbon-600 text-center px-10">
                   <Package size={48} strokeWidth={1} className="mb-4 opacity-30" />
                   <h4 className="text-sm font-bold uppercase tracking-widest mb-1">Manifest Empty</h4>
                   <p className="text-xs font-medium">Search for SKUs or scan barcodes to build your shipment contents list.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="h-24 bg-carbon-900 border-t border-carbon-800 flex items-center justify-between px-8 safe-bottom">
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] text-carbon-500 font-black uppercase tracking-[0.2em]">{isSaving ? 'Synchronizing Pipeline' : 'Shipment Readiness'}</span>
            <span className="text-xs text-white font-bold">{isSaving ? saveProgress : `${contents.length} SKUs Listed`}</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={onClose} disabled={isSaving} className="flex-1 sm:flex-none px-6 py-4 text-xs font-black uppercase tracking-widest text-carbon-400 hover:text-white transition-all">Cancel</button>
            <button onClick={handleSubmit} disabled={isSaving || contents.length === 0} className="flex-[2] sm:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-kv-accent hover:bg-kv-accent/90 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-kv-accent/20 active:scale-[0.98] disabled:opacity-50">
              {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
              <span>{isSaving ? 'Committing' : 'Commit Shipment'}</span>
            </button>
          </div>
        </div>
      </div>

      {isScannerOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-lg bg-carbon-900 rounded-3xl overflow-hidden shadow-2xl border border-carbon-700 flex flex-col animate-fade-up">
            <div className="h-16 bg-carbon-800 flex items-center justify-between px-6 border-b border-carbon-700">
               <h3 className="text-white font-black uppercase tracking-widest text-xs">SKU Recognition</h3>
               <button onClick={handleStopScanner} className="text-carbon-400 hover:text-white p-2 -mr-2 active:scale-90"><X size={24}/></button>
            </div>
            <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden">
               <video 
                 ref={videoRef} 
                 className="w-full h-full object-cover" 
                 playsInline 
                 muted
               />
               <div className="absolute inset-0 border-[2px] border-kv-accent/50 m-12 rounded-[2rem] pointer-events-none animate-pulse"></div>
            </div>
            <div className="p-6 text-center bg-carbon-900">
              <p className="text-[10px] text-carbon-500 font-black uppercase tracking-widest">Scanning in progress...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddShipment;