import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

const ConfigurationView: React.FC = () => {
  const [strandedWindow, setStrandedWindow] = useState(7);
  const [lowStockWindow, setLowStockWindow] = useState(1);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Sync state with current DOM on mount
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto animate-fade-up">
      <h1 className="text-3xl font-bold text-white mb-2">Configuration</h1>
      <p className="text-carbon-400 mb-8">Manage global inventory settings and application preferences.</p>

      <div className="bg-carbon-900 border border-carbon-700 rounded-lg overflow-hidden animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
        <div className="p-6 space-y-8">
          
          {/* Inventory Settings */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white border-b border-carbon-800 pb-2">Inventory Thresholds</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-carbon-300">Stranded Inventory Window</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    value={strandedWindow}
                    onChange={(e) => setStrandedWindow(Number(e.target.value))}
                    className="bg-carbon-800 border border-carbon-700 rounded px-3 py-2 text-white w-full md:w-24 outline-none focus:border-kv-accent focus:ring-1 focus:ring-kv-accent transition-all duration-150"
                  />
                  <span className="text-sm text-carbon-500">days</span>
                </div>
                <p className="text-xs text-carbon-500">Items with no sales in this period are marked as stranded.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-carbon-300">Low Stock Window</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    value={lowStockWindow}
                    onChange={(e) => setLowStockWindow(Number(e.target.value))}
                    className="bg-carbon-800 border border-carbon-700 rounded px-3 py-2 text-white w-full md:w-24 outline-none focus:border-kv-accent focus:ring-1 focus:ring-kv-accent transition-all duration-150"
                  />
                  <span className="text-sm text-carbon-500">days</span>
                </div>
                <p className="text-xs text-carbon-500">Alert when estimated stock cover drops below this.</p>
              </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white border-b border-carbon-800 pb-2">Appearance</h2>
            
            <div className="flex items-center justify-between">
               <div>
                 <label className="text-sm font-medium text-carbon-300">Interface Theme</label>
                 <p className="text-xs text-carbon-500">Toggle between dark and light mode.</p>
               </div>
               
               <button 
                 onClick={toggleTheme}
                 className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-out relative ${theme === 'dark' ? 'bg-kv-accent' : 'bg-carbon-600'}`}
               >
                 <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ease-out ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}></div>
               </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-carbon-800 p-4 border-t border-carbon-700 flex justify-end">
           <button className="flex items-center justify-center w-full sm:w-auto gap-2 px-4 py-2 bg-kv-accent hover:bg-kv-accentHover text-white text-sm font-medium rounded transition-colors duration-150 hover:shadow-lg active:scale-95">
             <Save size={16} />
             <span>Save Changes</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationView;