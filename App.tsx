
import React, { useState, useRef, useEffect } from 'react';
import { GeneratorConfig, MinecraftVersion, CustomFile } from './types';
import { buildDataPack } from './utils/datapackBuilder';
import { VERSION_FORMATS } from './constants';
import JSZip from 'jszip';
import { generatePackDescription } from './services/geminiService';

const Icons = {
  Dice: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M12 12h.01"/><path d="M16 16h.01"/><path d="M8 8h.01"/><path d="M16 8h.01"/><path d="M8 16h.01"/></svg>
  ),
  Upload: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
  ),
  Cpu: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
  ),
  Trash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
  ),
  Recipe: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 6h10"/><path d="M8 10h10"/><path d="M8 14h10"/></svg>
  ),
  Loot: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
  )
};

const App: React.FC = () => {
  const fileContentsMap = useRef<Map<string, { name: string, content: string, type: 'loot' | 'recipe' }>>(new Map());
  
  const [config, setConfig] = useState<Omit<GeneratorConfig, 'customFiles'>>({
    seed: Math.random().toString(36).substring(7),
    packName: 'Randomizer_1.21',
    description: '正在生成描述...',
    version: '1.21.10',
    randomizeLoot: true,
    randomizeRecipes: true,
    shufflingMode: 'total',
  });

  const [counts, setCounts] = useState({ loot: 0, recipe: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const lootInputRef = useRef<HTMLInputElement>(null);
  const recipeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateDescription = async () => {
      try {
        const desc = await generatePackDescription(config.seed, config.packName);
        setConfig(prev => ({ ...prev, description: desc }));
      } catch (e) {
        console.error("Gemini description update failed", e);
      }
    };
    const timer = setTimeout(updateDescription, 800);
    return () => clearTimeout(timer);
  }, [config.seed, config.packName]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, forcedType: 'loot' | 'recipe') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setIsGenerating(true);
    setProgress(0);
    setStatus(`正在讀取${forcedType === 'loot' ? '掉落物' : '合成表'}數據`);

    const fileArray = Array.from(files) as File[];
    
    try {
      let processedCount = 0;
      for (const file of fileArray) {
        const fileName = file.name.toLowerCase().trim();
        if (fileName.startsWith('.') || fileName.includes('/.')) continue;

        if (fileName.endsWith('.zip')) {
          const zip = await JSZip.loadAsync(file);
          const tasks: Promise<void>[] = [];
          zip.forEach((path, entry) => {
            const pureName = entry.name.split('/').pop()?.toLowerCase().trim() || "";
            if (!entry.dir && pureName.endsWith('.json') && !pureName.startsWith('.')) {
              tasks.push(entry.async('string').then(content => {
                fileContentsMap.current.set(`${forcedType}:${pureName}`, { name: pureName, content, type: forcedType });
              }));
            }
          });
          await Promise.all(tasks);
        } else if (fileName.endsWith('.json')) {
          const content = await file.text();
          fileContentsMap.current.set(`${forcedType}:${fileName}`, { name: fileName, content, type: forcedType });
        }
        
        processedCount++;
        setProgress((processedCount / fileArray.length) * 100);
      }
      
      const allValues = Array.from(fileContentsMap.current.values()) as CustomFile[];
      setCounts({
        loot: allValues.filter(v => v.type === 'loot').length,
        recipe: allValues.filter(v => v.type === 'recipe').length
      });
      
    } catch (err) {
      setError("檔案讀取失敗，請確認格式。");
      console.error(err);
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setStatus('');
      if (e.target) e.target.value = '';
    }
  };

  const handleDownload = async () => {
    const allFiles = Array.from(fileContentsMap.current.values()) as CustomFile[];
    if (allFiles.length === 0) {
      setError("未檢測到可用的 JSON 或 ZIP 檔案");
      return;
    }
    
    const hasLoot = config.randomizeLoot && counts.loot > 0;
    const hasRecipes = config.randomizeRecipes && counts.recipe > 0;

    if (!hasLoot && !hasRecipes) {
      setError("請至少上傳並啟用一個功能模組");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);
    setStatus('正在準備隨機化引擎');
    
    setTimeout(async () => {
      try {
        const fullConfig: GeneratorConfig = {
          ...config,
          customFiles: allFiles.map(f => ({
            name: f.name,
            content: f.content,
            type: f.type
          }) as CustomFile)
        };

        const blob = await buildDataPack(fullConfig, (p, s) => {
          setProgress(p);
          setStatus(s);
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName = config.packName.replace(/[^a-z0-9_-]/gi, '_') || 'Randomizer';
        a.download = `${safeName}.zip`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          setIsGenerating(false);
          setProgress(0);
          setStatus('');
        }, 1000);

      } catch (err: any) {
        setError(`生成失敗: ${err.message}`);
        setIsGenerating(false);
        setProgress(0);
        setStatus('');
      }
    }, 50); 
  };

  const clearBuffers = () => {
    fileContentsMap.current.clear();
    setCounts({ loot: 0, recipe: 0 });
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 text-slate-300 font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/30 border border-cyan-500/20 text-cyan-400 text-[10px] font-black tracking-[0.2em] uppercase mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
          Minecraft 1.21.10 支持
        </div>
        <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-b from-white to-slate-600 bg-clip-text text-transparent mb-4 uppercase tracking-tighter">
          MC 隨機化資料包生成器
        </h1>
        <p className="text-slate-500 font-medium tracking-[0.2em] uppercase text-xs">快速生成掉落物與合成表隨機化工具</p>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Top Status Bar */}
        <div className="p-8 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 ${isGenerating ? 'bg-cyan-500 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.4)]' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
              <Icons.Cpu />
            </div>
            <div>
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">系統狀態</h2>
              <p className={`text-xl font-bold leading-none ${isGenerating ? 'text-cyan-400 animate-pulse' : 'text-emerald-400'}`}>
                {isGenerating ? '處理中...' : '就緒'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`flex-1 md:flex-none bg-slate-950/80 px-6 py-4 rounded-2xl border border-slate-800 text-center transition-all ${config.randomizeLoot ? 'opacity-100 hover:border-cyan-500/30' : 'opacity-40 grayscale'} group/stat`}>
              <span className="text-[10px] text-slate-600 block uppercase font-black tracking-widest mb-1 group-hover/stat:text-cyan-500">掉落物檔案</span>
              <span className="text-xl font-mono font-bold text-cyan-400">{counts.loot}</span>
            </div>
            <div className={`flex-1 md:flex-none bg-slate-950/80 px-6 py-4 rounded-2xl border border-slate-800 text-center transition-all ${config.randomizeRecipes ? 'opacity-100 hover:border-indigo-500/30' : 'opacity-40 grayscale'} group/stat`}>
              <span className="text-[10px] text-slate-600 block uppercase font-black tracking-widest mb-1 group-hover/stat:text-indigo-500">合成表檔案</span>
              <span className="text-xl font-mono font-bold text-indigo-400">{counts.recipe}</span>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-10">
          {/* Config Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3 group">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">隨機種子 (Seed)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={config.seed} 
                  onChange={(e) => setConfig({...config, seed: e.target.value})}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 font-mono text-cyan-400 focus:border-cyan-500 outline-none text-sm transition-all focus:ring-1 focus:ring-cyan-500/20"
                  placeholder="輸入隨機種子"
                />
                <button 
                  onClick={() => setConfig({...config, seed: Math.random().toString(36).substring(7)})}
                  className="px-6 bg-slate-800 text-slate-300 border border-slate-700 rounded-2xl hover:bg-slate-700 hover:text-white transition-all active:scale-95"
                  title="重新生成種子"
                >
                  <Icons.Dice />
                </button>
              </div>
            </div>
            <div className="space-y-3 group">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">資料包名稱</label>
              <input 
                type="text" 
                value={config.packName} 
                onChange={(e) => setConfig({...config, packName: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 font-bold text-slate-200 focus:border-cyan-500 outline-none text-sm focus:ring-1 focus:ring-cyan-500/20 transition-all"
                placeholder="Data Pack Name"
              />
            </div>
          </div>

          {/* Master Protocols */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => setConfig({...config, randomizeLoot: !config.randomizeLoot})}
              className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${config.randomizeLoot ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-600'}`}
            >
              <div className="flex items-center gap-4 text-left">
                <Icons.Loot />
                <div>
                  <span className="text-sm font-bold block">啟用掉落物隨機化</span>
                  <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold">{config.randomizeLoot ? '開啟中' : '已關閉'}</span>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${config.randomizeLoot ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)]' : 'bg-slate-800'}`}></div>
            </button>
            <button 
              onClick={() => setConfig({...config, randomizeRecipes: !config.randomizeRecipes})}
              className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${config.randomizeRecipes ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-600'}`}
            >
              <div className="flex items-center gap-4 text-left">
                <Icons.Recipe />
                <div>
                  <span className="text-sm font-bold block">啟用合成隨機化</span>
                  <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold">{config.randomizeRecipes ? '開啟中' : '已關閉'}</span>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${config.randomizeRecipes ? 'bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,1)]' : 'bg-slate-800'}`}></div>
            </button>
          </div>

          {/* Dual Upload Dropzones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={() => !isGenerating && config.randomizeLoot && lootInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-[2rem] p-12 text-center transition-all group ${!config.randomizeLoot ? 'opacity-20 cursor-not-allowed border-slate-800 scale-95' : isGenerating ? 'opacity-40 border-slate-800' : 'cursor-pointer border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/[0.03]'}`}
            >
               <div className="flex flex-col items-center">
                  <div className={`mb-6 transition-all ${!config.randomizeLoot ? 'opacity-30' : 'text-cyan-500/50 group-hover:text-cyan-400'}`}>
                    <Icons.Loot />
                  </div>
                  <h3 className="text-lg font-bold text-white">上傳掉落物數據</h3>
                  <p className="text-xs text-slate-600 mt-2">支持 JSON 檔案或包含 JSON 的 ZIP 包</p>
               </div>
               <input type="file" ref={lootInputRef} multiple accept=".json,.zip" className="hidden" onChange={(e) => handleFileUpload(e, 'loot')} disabled={isGenerating || !config.randomizeLoot} />
            </div>

            <div 
              onClick={() => !isGenerating && config.randomizeRecipes && recipeInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-[2rem] p-12 text-center transition-all group ${!config.randomizeRecipes ? 'opacity-20 cursor-not-allowed border-slate-800 scale-95' : isGenerating ? 'opacity-40 border-slate-800' : 'cursor-pointer border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/[0.03]'}`}
            >
               <div className="flex flex-col items-center">
                  <div className={`mb-6 transition-all ${!config.randomizeRecipes ? 'opacity-30' : 'text-indigo-500/50 group-hover:text-indigo-400'}`}>
                    <Icons.Recipe />
                  </div>
                  <h3 className="text-lg font-bold text-white">上傳合成表數據</h3>
                  <p className="text-xs text-slate-600 mt-2">支持 JSON 檔案或包含 JSON 的 ZIP 包</p>
               </div>
               <input type="file" ref={recipeInputRef} multiple accept=".json,.zip" className="hidden" onChange={(e) => handleFileUpload(e, 'recipe')} disabled={isGenerating || !config.randomizeRecipes} />
            </div>
          </div>

          {/* AI Info Card */}
          <div className="p-8 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
               <div className="w-12 h-12 bg-cyan-500/5 rounded-2xl flex items-center justify-center text-cyan-500/30 border border-slate-800">
                  <Icons.Cpu />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase block tracking-widest mb-1">AI 生成的資料包描述</label>
                  <p className="text-sm text-slate-400 italic font-medium">{config.description}</p>
               </div>
            </div>
            {(counts.loot > 0 || counts.recipe > 0) && !isGenerating && (
              <button 
                onClick={clearBuffers} 
                className="inline-flex items-center gap-3 text-xs font-bold text-rose-500 uppercase bg-rose-500/5 hover:bg-rose-500/10 px-6 py-4 rounded-2xl transition-all border border-rose-500/10 active:scale-95"
              >
                <Icons.Trash />
                <span>清空上傳列表</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 md:px-12 pb-12 space-y-8">
          {isGenerating && (
            <div className="space-y-4">
               <div className="flex justify-between items-end px-2">
                 <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">{status}</span>
                 <span className="text-sm font-mono font-bold text-cyan-400">{Math.round(progress)}%</span>
               </div>
               <div className="h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                 <div 
                   className="h-full bg-gradient-to-r from-cyan-600 to-indigo-600 transition-all duration-300 ease-out"
                   style={{ width: `${progress}%` }}
                 ></div>
               </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold text-center animate-shake">
              發生錯誤：{error}
            </div>
          )}
          
          <button
            onClick={handleDownload}
            disabled={isGenerating || (counts.loot === 0 && counts.recipe === 0)}
            className={`group relative w-full py-8 rounded-[2rem] font-black text-2xl md:text-3xl tracking-tight transition-all uppercase ${isGenerating ? 'bg-slate-800 text-slate-700 cursor-wait' : (counts.loot === 0 && counts.recipe === 0) ? 'bg-slate-800/50 text-slate-700 cursor-not-allowed' : 'bg-white text-slate-950 hover:scale-[1.01] hover:shadow-xl active:scale-[0.98]'}`}
          >
            {isGenerating ? '生成中...' : '生成並下載資料包'}
          </button>
        </div>
      </div>

      <div className="mt-16 flex items-center justify-center gap-8 opacity-20">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-700"></div>
        <div className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
          MC RANDOMIZER V5 • 1.21.10 READY
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-700"></div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-8px); }
          60% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default App;
