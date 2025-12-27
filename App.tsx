import React, { useState, useRef, useEffect } from 'react';
import { GeneratorConfig, MinecraftVersion, CustomFile } from './types';
import { buildDataPack } from './utils/datapackBuilder';
import { translations, Language } from './locales';
import { VERSION_FORMATS, VERSION_LABELS } from './constants';
import JSZip from 'jszip';

const Icons = {
  Dice: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M12 12h.01" /><path d="M16 16h.01" /><path d="M8 8h.01" /><path d="M16 8h.01" /><path d="M8 16h.01" /></svg>
  ),
  Upload: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
  ),
  Cpu: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2" /><rect width="6" height="6" x="9" y="9" rx="1" /><path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" /><path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" /></svg>
  ),
  Trash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
  ),
  Recipe: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><path d="M8 6h10" /><path d="M8 10h10" /><path d="M8 14h10" /></svg>
  ),
  Loot: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
  ),
  Globe: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" x2="22" y1="12" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
  ),
  Source: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" /><path d="M7 7h.01" /></svg>
  ),
  Github: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
  )
};

type DataSource = 'original' | 'custom';

// Use recursive glob to find nested files but keep keys to filter later
const outputLootFiles = import.meta.glob('./data/original/**/loot/**/*.json', { as: 'raw', eager: true });
const outputRecipeFiles = import.meta.glob('./data/original/**/recipes/**/*.json', { as: 'raw', eager: true });
const outputLootZips = import.meta.glob('./data/original/**/loot/**/*.zip', { as: 'url', eager: true });
const outputRecipeZips = import.meta.glob('./data/original/**/recipes/**/*.zip', { as: 'url', eager: true });
const outputMcMeta = import.meta.glob('./data/original/**/mcmeta/pack.mcmeta', { as: 'raw', eager: true });

const App: React.FC = () => {
  const fileContentsMap = useRef<Map<string, { name: string, content: string, type: 'loot' | 'recipe' }>>(new Map());

  const [lang, setLang] = useState<Language>('zh');
  const t = (key: keyof typeof translations['zh']) => translations[lang][key];

  const [config, setConfig] = useState<Omit<GeneratorConfig, 'customFiles'>>({
    seed: Math.random().toString(36).substring(7),
    packName: 'Randomizer',
    description: 'Datapack',
    version: '1.21.11',
    randomizeLoot: true,
    randomizeRecipes: true,
    shufflingMode: 'total',
  });

  const [dataSource, setDataSource] = useState<DataSource>('original');
  const [counts, setCounts] = useState({ loot: 0, recipe: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [originalLoading, setOriginalLoading] = useState(false);
  const [customMcmeta, setCustomMcmeta] = useState<string | undefined>(undefined);

  const lootInputRef = useRef<HTMLInputElement>(null);
  const recipeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const newDesc = `${config.packName} - ${t('seed')}: ${config.seed}`;
    setConfig(prev => ({ ...prev, description: newDesc }));
  }, [config.seed, config.packName, lang]);

  // Handle data source or version change
  useEffect(() => {
    if (dataSource === 'original') {
      loadOriginalData();
    } else {
      // Clear buffer when switching to custom so user can upload
      clearBuffers();
    }
  }, [dataSource, config.version]);

  const loadOriginalData = async () => {
    setOriginalLoading(true);
    setError(null);
    setCustomMcmeta(undefined);
    fileContentsMap.current.clear();
    let lCount = 0;
    let rCount = 0;

    const versionKey = `/${config.version}/`;

    try {
      // Check for pack.mcmeta
      const mcmetaKey = Object.keys(outputMcMeta).find(k => k.includes(`/${config.version}/mcmeta/`));
      if (mcmetaKey) {
        setCustomMcmeta(outputMcMeta[mcmetaKey] as unknown as string);
      }

      // Process JSONs
      Object.entries(outputLootFiles).forEach(([path, content]) => {
        if (path.includes(versionKey)) {
          const name = path.split('/').pop() || 'unknown.json';
          fileContentsMap.current.set(`loot:${name}`, { name, content: content as unknown as string, type: 'loot' });
          lCount++;
        }
      });

      Object.entries(outputRecipeFiles).forEach(([path, content]) => {
        if (path.includes(versionKey)) {
          const name = path.split('/').pop() || 'unknown.json';
          fileContentsMap.current.set(`recipe:${name}`, { name, content: content as unknown as string, type: 'recipe' });
          rCount++;
        }
      });

      // Process ZIPs
      const processZip = async (url: string, type: 'loot' | 'recipe') => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const zip = await JSZip.loadAsync(blob);

          const tasks: Promise<void>[] = [];
          zip.forEach((path, entry) => {
            const pureName = entry.name.split('/').pop()?.toLowerCase().trim() || "";
            if (!entry.dir && pureName.endsWith('.json') && !pureName.startsWith('.')) {
              tasks.push(entry.async('string').then(content => {
                fileContentsMap.current.set(`${type}:${pureName}`, { name: pureName, content, type: type });
                if (type === 'loot') lCount++;
                else rCount++;
              }));
            }
          });
          await Promise.all(tasks);
        } catch (e) {
          console.error(`Failed to load zip ${url}`, e);
        }
      };

      const zipTasks: Promise<void>[] = [];
      Object.entries(outputLootZips).forEach(([path, url]) => {
        if (path.includes(versionKey)) zipTasks.push(processZip(url as unknown as string, 'loot'));
      });
      Object.entries(outputRecipeZips).forEach(([path, url]) => {
        if (path.includes(versionKey)) zipTasks.push(processZip(url as unknown as string, 'recipe'));
      });

      await Promise.all(zipTasks);

    } catch (err) {
      console.error("Error loading original data", err);
      setError("Failed to load some Vanilla data files.");
    } finally {
      setCounts({ loot: lCount, recipe: rCount });
      setOriginalLoading(false);
    }
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, forcedType: 'loot' | 'recipe') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setIsGenerating(true);
    setProgress(0);
    setStatus(t(forcedType === 'loot' ? 'readingLoot' : 'readingRecipe'));

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
      setError(t('errorFileRead'));
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
      setError(t('errorNoFiles'));
      return;
    }

    const hasLoot = config.randomizeLoot && counts.loot > 0;
    const hasRecipes = config.randomizeRecipes && counts.recipe > 0;

    if (!hasLoot && !hasRecipes) {
      setError(t('errorNoModule'));
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);
    setStatus(t('preparingEngine'));

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
        }, customMcmeta);

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
        setError(`${t('errorGenFailed')}${err.message}`);
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
      <div className="mb-12 text-center relative">
        <div className="absolute top-0 right-0 flex items-center gap-3">
          <a
            href="https://github.com/lailai1653265/random-drop-recipe"
            target="_blank"
            rel="noreferrer"
            className="p-2 text-slate-500 hover:text-white border border-slate-800 rounded-lg transition-all hover:bg-slate-800 hover:border-slate-700"
            title="GitHub"
          >
            <Icons.Github />
          </a>
          <button
            onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}
            className="p-2 text-xs font-bold text-slate-500 hover:text-cyan-400 border border-slate-800 rounded-lg transition-all hover:bg-slate-800 hover:border-slate-700"
          >
            <div className="flex items-center gap-2">
              <Icons.Globe />
              {lang === 'en' ? '中文' : 'ENGLISH'}
            </div>
          </button>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/30 border border-cyan-500/20 text-cyan-400 text-[10px] font-black tracking-[0.2em] uppercase mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
          {`Minecraft ${VERSION_LABELS[config.version]} ${lang === 'en' ? 'Supported' : '支持'}`}
        </div>
        <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-b from-white to-slate-600 bg-clip-text text-transparent mb-4 uppercase tracking-tighter">
          {t('title')}
        </h1>
        <p className="text-slate-500 font-medium tracking-[0.2em] uppercase text-xs">{t('subtitle')}</p>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden">

        {/* Top Status Bar */}
        <div className="p-8 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 ${isGenerating ? 'bg-cyan-500 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.4)]' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
              <Icons.Cpu />
            </div>
            <div>
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('systemStatus')}</h2>
              <p className={`text-xl font-bold leading-none ${isGenerating ? 'text-cyan-400 animate-pulse' : 'text-emerald-400'}`}>
                {isGenerating ? t('processing') : t('ready')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`flex-1 md:flex-none bg-slate-950/80 px-6 py-4 rounded-2xl border border-slate-800 text-center transition-all ${config.randomizeLoot ? 'opacity-100 hover:border-cyan-500/30' : 'opacity-40 grayscale'} group/stat`}>
              <span className="text-[10px] text-slate-600 block uppercase font-black tracking-widest mb-1 group-hover/stat:text-cyan-500">{t('lootFiles')}</span>
              <span className="text-xl font-mono font-bold text-cyan-400">{counts.loot}</span>
            </div>
            <div className={`flex-1 md:flex-none bg-slate-950/80 px-6 py-4 rounded-2xl border border-slate-800 text-center transition-all ${config.randomizeRecipes ? 'opacity-100 hover:border-indigo-500/30' : 'opacity-40 grayscale'} group/stat`}>
              <span className="text-[10px] text-slate-600 block uppercase font-black tracking-widest mb-1 group-hover/stat:text-indigo-500">{t('recipeFiles')}</span>
              <span className="text-xl font-mono font-bold text-indigo-400">{counts.recipe}</span>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-10">
          {/* Logic Control (Data Source & Seed) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* Data Source Toggle */}
            <div className="space-y-3 group">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{t('dataSource')}</label>
              <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setDataSource('original')}
                  className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 transition-all ${dataSource === 'original' ? 'bg-slate-800 text-cyan-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Icons.Source />
                  <span className="font-bold text-xs uppercase tracking-wider">{t('sourceOriginal')}</span>
                </button>
                <button
                  onClick={() => setDataSource('custom')}
                  className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 transition-all ${dataSource === 'custom' ? 'bg-slate-800 text-cyan-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Icons.Upload />
                  <span className="font-bold text-xs uppercase tracking-wider">{t('sourceCustom')}</span>
                </button>
              </div>
            </div>


            <div className="space-y-3 group">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{t('seed')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.seed}
                  onChange={(e) => setConfig({ ...config, seed: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 font-mono text-cyan-400 focus:border-cyan-500 outline-none text-sm transition-all focus:ring-1 focus:ring-cyan-500/20"
                  placeholder={t('enterSeed')}
                />
                <button
                  onClick={() => setConfig({ ...config, seed: Math.random().toString(36).substring(7) })}
                  className="px-6 bg-slate-800 text-slate-300 border border-slate-700 rounded-2xl hover:bg-slate-700 hover:text-white transition-all active:scale-95"
                  title="Gen Seed"
                >
                  <Icons.Dice />
                </button>
              </div>
            </div>

          </div>

          {/* Pack Name and Version */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3 group">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{t('packName')}</label>
              <input
                type="text"
                value={config.packName}
                onChange={(e) => setConfig({ ...config, packName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 font-bold text-slate-200 focus:border-cyan-500 outline-none text-sm focus:ring-1 focus:ring-cyan-500/20 transition-all"
                placeholder={t('packNamePlaceholder')}
              />
            </div>

            <div className="space-y-3 group">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Minecraft Version</label>
              <div className="relative">
                <select
                  value={config.version}
                  onChange={(e) => setConfig({ ...config, version: e.target.value as MinecraftVersion })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 font-bold text-slate-200 appearance-none focus:border-cyan-500 outline-none text-sm focus:ring-1 focus:ring-cyan-500/20 transition-all cursor-pointer"
                >
                  {Object.keys(VERSION_FORMATS).map(ver => (
                    <option key={ver} value={ver} className="bg-slate-900 text-slate-200">
                      {VERSION_LABELS[ver] || ver}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Master Protocols */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setConfig({ ...config, randomizeLoot: !config.randomizeLoot })}
              className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${config.randomizeLoot ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-600'}`}
            >
              <div className="flex items-center gap-4 text-left">
                <Icons.Loot />
                <div>
                  <span className="text-sm font-bold block">{t('enableLootRandomization')}</span>
                  <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold">{config.randomizeLoot ? t('enabled') : t('disabled')}</span>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${config.randomizeLoot ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)]' : 'bg-slate-800'}`}></div>
            </button>
            <button
              onClick={() => setConfig({ ...config, randomizeRecipes: !config.randomizeRecipes })}
              className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${config.randomizeRecipes ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-600'}`}
            >
              <div className="flex items-center gap-4 text-left">
                <Icons.Recipe />
                <div>
                  <span className="text-sm font-bold block">{t('enableRecipeRandomization')}</span>
                  <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold">{config.randomizeRecipes ? t('enabled') : t('disabled')}</span>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${config.randomizeRecipes ? 'bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,1)]' : 'bg-slate-800'}`}></div>
            </button>
          </div>

          {/* Dual Upload Dropzones (Only show if Custom) */}
          {dataSource === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-down">
              <div
                onClick={() => !isGenerating && config.randomizeLoot && lootInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-[2rem] p-12 text-center transition-all group ${!config.randomizeLoot ? 'opacity-20 cursor-not-allowed border-slate-800 scale-95' : isGenerating ? 'opacity-40 border-slate-800' : 'cursor-pointer border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/[0.03]'}`}
              >
                <div className="flex flex-col items-center">
                  <div className={`mb-6 transition-all ${!config.randomizeLoot ? 'opacity-30' : 'text-cyan-500/50 group-hover:text-cyan-400'}`}>
                    <Icons.Loot />
                  </div>
                  <h3 className="text-lg font-bold text-white">{t('uploadLoot')}</h3>
                  <p className="text-xs text-slate-600 mt-2">{t('uploadHint')}</p>
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
                  <h3 className="text-lg font-bold text-white">{t('uploadRecipe')}</h3>
                  <p className="text-xs text-slate-600 mt-2">{t('uploadHint')}</p>
                </div>
                <input type="file" ref={recipeInputRef} multiple accept=".json,.zip" className="hidden" onChange={(e) => handleFileUpload(e, 'recipe')} disabled={isGenerating || !config.randomizeRecipes} />
              </div>
            </div>
          )}

          {/* Metadata Card (No AI) */}
          <div className="p-8 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-cyan-500/5 rounded-2xl flex items-center justify-center text-cyan-500/30 border border-slate-800">
                <Icons.Cpu />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase block tracking-widest mb-1">{t('packDescription')}</label>
                <p className="text-sm text-slate-400 font-medium">{config.description}</p>
              </div>
            </div>
            {dataSource === 'custom' && (counts.loot > 0 || counts.recipe > 0) && !isGenerating && (
              <button
                onClick={clearBuffers}
                className="inline-flex items-center gap-3 text-xs font-bold text-rose-500 uppercase bg-rose-500/5 hover:bg-rose-500/10 px-6 py-4 rounded-2xl transition-all border border-rose-500/10 active:scale-95"
              >
                <Icons.Trash />
                <span>{t('clearList')}</span>
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

          {/* Warning for Original Data empty state */}
          {dataSource === 'original' && !originalLoading && counts.loot === 0 && counts.recipe === 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
              <div className="text-amber-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
              </div>
              <div className="text-xs text-amber-200">
                <p className="font-bold">No Vanilla data found for version {VERSION_LABELS[config.version] || config.version}!</p>
                <p className="opacity-70">Please add files to <code>data/original/{config.version}/loot</code> or <code>recipes</code> and refresh.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold text-center animate-shake">
              {error}
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={isGenerating || originalLoading}
            className={`group relative w-full py-8 rounded-[2rem] font-black text-2xl md:text-3xl tracking-tight transition-all uppercase ${isGenerating || originalLoading ? 'bg-slate-800 text-slate-700 cursor-wait' : (counts.loot === 0 && counts.recipe === 0) ? 'bg-slate-800 text-slate-500 hover:bg-slate-800' : 'bg-white text-slate-950 hover:scale-[1.01] hover:shadow-xl active:scale-[0.98]'}`}
          >
            {isGenerating ? t('generating') : originalLoading ? 'Loading...' : t('generateAndDownload')}
          </button>
        </div>
      </div>

      <div className="mt-16 flex items-center justify-center gap-8 opacity-20">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-700"></div>
        <div className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
          MINECRAFT RANDOMIZER V5 • 1.21.10 READY
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
