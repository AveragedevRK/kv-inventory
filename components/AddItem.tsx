import React, { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';
import { InventoryItem } from '../types';
import { Upload, ChevronLeft, Image as ImageIcon, AlertCircle, Save, Info, ScanBarcode, Plus, X, Loader2, Camera } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AddItemProps {
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
}

interface FormErrors {
  sku?: string;
  name?: string;
  price?: string;
  stock?: string;
  submit?: string;
}

const AddItem: React.FC<AddItemProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    upc: '',
    price: '',
    stock: '',
    status: 'In Stock' as const
  });
  
  const [scannedUpcs, setScannedUpcs] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Scanner when state changes
  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      if (!isScannerOpen || !videoRef.current) return;

      try {
        // Ensure UI transitions/animations are complete and element is visible
        await new Promise(r => setTimeout(r, 450));
        if (!mounted || !videoRef.current) return;

        // Dynamic import to keep main bundle light
        const { BrowserMultiFormatReader } = await import('https://esm.sh/@zxing/library@0.20.0');
        if (!mounted) return;

        codeReaderRef.current = new BrowserMultiFormatReader();
        
        // Use modern navigator.mediaDevices approach
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });
        
        if (!mounted || !videoRef.current) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;

        // Setup video element with required attributes for iOS PWA
        const videoEl = videoRef.current;
        videoEl.setAttribute('playsinline', 'true');
        videoEl.muted = true;
        
        // Robust attachment strategy
        videoEl.srcObject = null;
        videoEl.srcObject = stream;
        
        try {
          await videoEl.play();
        } catch (playError) {
          console.warn("Autoplay was prevented, trying muted play", playError);
          videoEl.muted = true;
          await videoEl.play();
        }

        // Start QR decoding
        await codeReaderRef.current.decodeFromVideoElement(videoEl, (result: any) => {
          if (result && mounted) {
            const text = result.getText();
            setScannedUpcs(prev => [...prev, text]);
            handleStopScanner();
          }
        });

      } catch (err: any) {
        console.error("Camera access failed:", err);
        if (mounted) {
          setCameraError(err.message || "Failed to access camera. Ensure you are using HTTPS and have granted permissions.");
        }
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

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.name.trim()) newErrors.name = 'Title is required';
    if (formData.price === '' || Number(formData.price) < 0) newErrors.price = 'Valid cost required';
    if (formData.stock === '' || Number(formData.stock) < 0) newErrors.stock = 'Valid stock required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsSaving(true);
    setErrors(prev => ({ ...prev, submit: undefined }));

    try {
      const primaryUpc = scannedUpcs[0] || formData.upc || null;
      const onHandValue = Number(formData.stock);
      const finalStockValue = Number.isFinite(onHandValue) ? onHandValue : 0;

      const { error } = await supabase
        .from("items")
        .insert({
          sku: formData.sku,
          upc: primaryUpc,
          title: formData.name,
          description: formData.description || null,
          cost: parseFloat(formData.price),
          on_hand: finalStockValue,
          opening_stock: finalStockValue,
          stock_on_hand: finalStockValue,
          status: formData.status,
          image_url: null 
        });

      if (error) throw error;

      const newItem: InventoryItem = {
        id: formData.sku,
        sku: formData.sku,
        name: formData.name,
        category: 'Uncategorized',
        stock: finalStockValue,
        reserved: 0,
        price: Number(formData.price),
        status: formData.status,
        store: 'Main Warehouse',
      };

      onSave(newItem);
    } catch (err: any) {
      console.error("Failed to save item:", err);
      setErrors(prev => ({ ...prev, submit: err.message || "Failed to save to database." }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const removeUpc = (indexToRemove: number) => {
    setScannedUpcs(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <>
      <div className="flex flex-col h-full w-full bg-carbon-900 border border-carbon-700 rounded-lg overflow-hidden animate-fade-in">
        <div className="h-16 flex items-center px-4 md:px-6 shrink-0 bg-carbon-900 border-b border-carbon-800">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-carbon-300 hover:text-white hover:bg-carbon-800 rounded-full transition-colors"><ChevronLeft size={24} /></button>
            <h1 className="text-xl md:text-2xl font-bold text-white">Add Item</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 md:p-8 bg-carbon-900">
          <div className="max-w-[1400px] mx-auto">
            {errors.submit && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400 animate-fade-in">
                <AlertCircle size={20} /><span className="text-sm">{errors.submit}</span>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <div 
                    className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 relative overflow-hidden group ${isDragging ? 'border-kv-accent bg-kv-accent/10' : 'border-carbon-700 bg-carbon-900/50 hover:border-carbon-500 hover:bg-carbon-800'}`}
                    onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={() => fileInputRef.current?.click()}
                  >
                    <input type="file" hidden ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])} accept="image/*" />
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover animate-fade-in" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 backdrop-blur-sm">
                          <div className="flex flex-col items-center gap-2 text-white"><Upload size={24} /><span className="font-medium">Change Image</span></div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-carbon-800 rounded-full flex items-center justify-center text-carbon-400 group-hover:text-white group-hover:scale-110 transition-all duration-300"><ImageIcon size={32} strokeWidth={1.5} /></div>
                        <div><p className="text-lg text-white font-medium mb-1">Upload Image</p><p className="text-sm text-carbon-400">Drag & drop or click to browse</p></div>
                      </div>
                    )}
                  </div>
                  <div className="bg-carbon-800 border border-carbon-700 rounded-lg p-5">
                    <div className="flex items-center gap-2 text-white font-medium mb-3"><Info size={16} className="text-kv-accent" /><span>Image Guidelines</span></div>
                    <ul className="space-y-2 text-sm text-carbon-400 list-disc list-inside marker:text-carbon-600">
                        <li>Recommended size: 1000x1000px</li><li>Max file size: 5MB</li><li>Supported formats: JPG, PNG, WEBP</li><li>Square aspect ratio works best</li>
                    </ul>
                  </div>
              </div>
              <div className="lg:col-span-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider text-carbon-400 font-semibold">SKU <span className="text-red-500">*</span></label>
                      <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} className={`w-full bg-carbon-800 border ${errors.sku ? 'border-red-500' : 'border-carbon-700'} focus:border-kv-accent text-white px-4 py-3 rounded-lg text-sm outline-none transition-all placeholder-carbon-600`} placeholder="e.g. VE-001" />
                      {errors.sku && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={10} /> {errors.sku}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider text-carbon-400 font-semibold">UPC</label>
                      {scannedUpcs.length > 0 ? (
                        <div className="w-full bg-carbon-800 border border-carbon-700 rounded-lg px-2 py-2 min-h-[46px] flex flex-wrap items-center gap-2">
                          {scannedUpcs.map((upc, idx) => (
                            <div key={idx} className="flex items-center gap-1 bg-carbon-700 border border-carbon-600 text-white text-xs px-2 py-1 rounded-md animate-scale-in">
                              <span>{upc}</span><button onClick={() => removeUpc(idx)} className="hover:text-red-400 transition-colors"><X size={12} /></button>
                            </div>
                          ))}
                          <button onClick={handleStartScanner} className="w-6 h-6 flex items-center justify-center bg-kv-accent/20 text-kv-accent hover:bg-kv-accent hover:text-white rounded-md transition-colors" title="Scan another UPC"><Plus size={14} /></button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input type="text" name="upc" value={formData.upc} onChange={handleInputChange} className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent text-white px-4 py-3 rounded-lg text-sm outline-none transition-all placeholder-carbon-600" placeholder="Optional 12-digit code" />
                          <button onClick={handleStartScanner} className="shrink-0 w-[46px] flex items-center justify-center bg-carbon-800 border border-carbon-700 hover:border-kv-accent hover:text-kv-accent text-carbon-400 rounded-lg transition-all" title="Scan Barcode"><ScanBarcode size={20} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-carbon-400 font-semibold">Product Title <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={`w-full bg-carbon-800 border ${errors.name ? 'border-red-500' : 'border-carbon-700'} focus:border-kv-accent text-white px-4 py-3 rounded-lg text-sm outline-none transition-all placeholder-carbon-600`} placeholder="Enter product name" />
                    {errors.name && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={10} /> {errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-carbon-400 font-semibold">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows={6} className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent text-white px-4 py-3 rounded-lg text-sm outline-none transition-all placeholder-carbon-600 resize-none" placeholder="Describe the product..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider text-carbon-400 font-semibold">Cost ($) <span className="text-red-500">*</span></label>
                      <input type="number" name="price" value={formData.price} onChange={handleInputChange} step="0.01" min="0" className={`w-full bg-carbon-800 border ${errors.price ? 'border-red-500' : 'border-carbon-700'} focus:border-kv-accent text-white px-4 py-3 rounded-lg text-sm outline-none transition-all placeholder-carbon-600`} placeholder="0.00" />
                      {errors.price && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={10} /> {errors.price}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider text-carbon-400 font-semibold">On Hand <span className="text-red-500">*</span></label>
                      <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} min="0" className={`w-full bg-carbon-800 border ${errors.stock ? 'border-red-500' : 'border-carbon-700'} focus:border-kv-accent text-white px-4 py-3 rounded-lg text-sm outline-none transition-all placeholder-carbon-600`} placeholder="0" />
                      {errors.stock && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={10} /> {errors.stock}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider text-carbon-400 font-semibold">Status</label>
                      <div className="relative">
                        <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-carbon-800 border border-carbon-700 focus:border-kv-accent text-white px-4 py-3 rounded-lg text-sm outline-none transition-all appearance-none">
                          <option value="In Stock">In Stock</option>
                          <option value="Stranded">Stranded</option>
                          <option value="Stockout">Stockout</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-carbon-400"><svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
        <div className="h-20 md:h-24 bg-carbon-900 border-t border-carbon-800 flex items-center justify-end px-4 md:px-8 gap-4 shrink-0">
            <button onClick={onClose} disabled={isSaving} className="px-6 py-2.5 text-sm font-medium text-carbon-300 hover:text-white hover:bg-carbon-800 rounded transition-colors disabled:opacity-50">Cancel</button>
            <button onClick={handleSubmit} disabled={isSaving} className="flex items-center gap-2 px-8 py-2.5 bg-kv-accent hover:bg-kv-accentHover text-white text-sm font-medium rounded transition-colors shadow-lg shadow-kv-accent/20 transform active:scale-95 duration-150 disabled:opacity-70 disabled:cursor-not-allowed">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>{isSaving ? 'Saving...' : 'Save Item'}</span>
            </button>
        </div>
      </div>
      {isScannerOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-carbon-900 rounded-xl overflow-hidden shadow-2xl border border-carbon-700 relative flex flex-col animate-scale-in">
            <div className="h-14 bg-carbon-800 flex items-center justify-between px-4 border-b border-carbon-700 shrink-0">
               <h3 className="text-white font-medium flex items-center gap-2"><ScanBarcode size={18} className="text-kv-accent"/> Scan Barcode</h3>
               <button onClick={handleStopScanner} className="text-carbon-400 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
               <video 
                 ref={videoRef} 
                 className="w-full h-full object-cover" 
                 playsInline 
                 muted
               />
               {!cameraError && (
                 <>
                   <div className="absolute inset-0 border-[3px] border-kv-accent/60 m-12 rounded-lg pointer-events-none animate-pulse shadow-[0_0_0_1000px_rgba(0,0,0,0.6)]">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-kv-accent -mt-1 -ml-1"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-kv-accent -mt-1 -mr-1"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-kv-accent -mb-1 -ml-1"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-kv-accent -mb-1 -mr-1"></div>
                   </div>
                   <div className="absolute bottom-6 left-0 right-0 text-center"><p className="text-xs text-white/90 bg-black/60 inline-block px-3 py-1.5 rounded-full backdrop-blur-sm animate-fade-up">Align barcode within frame</p></div>
                 </>
               )}
               {cameraError && (
                 <div className="absolute inset-0 flex items-center justify-center bg-carbon-900/90 p-6 text-center animate-fade-in">
                   <div className="flex flex-col items-center gap-3"><AlertCircle size={40} className="text-red-500" /><p className="text-white font-medium">{cameraError}</p><button onClick={handleStopScanner} className="mt-2 text-sm text-kv-accent hover:underline">Close Scanner</button></div>
                 </div>
               )}
            </div>
            <div className="p-4 flex justify-center bg-carbon-900 border-t border-carbon-700"><button onClick={handleStopScanner} className="px-6 py-2 bg-carbon-800 hover:bg-carbon-700 border border-carbon-700 text-white rounded text-sm transition-colors">Cancel</button></div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddItem;