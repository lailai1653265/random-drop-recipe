
import JSZip from 'jszip';
import { GeneratorConfig } from '../types';
import { VERSION_FORMATS } from '../constants';
import { SeededRandom } from './randomizer';

export const buildDataPack = async (
  config: GeneratorConfig,
  onProgress?: (percent: number, step: string) => void
): Promise<Blob> => {
  const fileCount = config.customFiles.length;
  if (fileCount === 0) {
    throw new Error("緩衝區中沒有可用的檔案");
  }

  onProgress?.(5, "正在初始化引擎");
  const zip = new JSZip();
  const random = new SeededRandom(config.seed);
  const packFormat = config.version === '1.21.11' ? 94 : (VERSION_FORMATS[config.version] || 48);
  
  const lootFiles: {name: string, content: string}[] = [];
  const recipeFiles: {name: string, content: any}[] = [];
  
  onProgress?.(15, "正在對檔案進行分類");
  for (let i = 0; i < fileCount; i++) {
    const f = config.customFiles[i];
    if (f.type === 'recipe') {
      try {
        const parsed = JSON.parse(f.content);
        recipeFiles.push({ name: f.name, content: parsed });
      } catch (e) {
        console.warn(`跳過格式錯誤的合成表: ${f.name}`);
      }
    } else if (f.type === 'loot') {
      lootFiles.push({ name: f.name, content: f.content });
    }
  }

  onProgress?.(45, "正在寫入 pack.mcmeta");
  zip.file("pack.mcmeta", JSON.stringify({
    pack: {
      description: config.description,
      pack_format: packFormat
    }
  }, null, 2));

  onProgress?.(60, "正在封裝數據");
  
  if (config.randomizeLoot && lootFiles.length > 0) {
    onProgress?.(65, "正在進行掉落物隨機化");
    const contents = lootFiles.map(f => f.content);
    const shuffledContents = random.shuffle(contents);
    const lootPath = "data/minecraft/loot_table/blocks/";
    for (let i = 0; i < lootFiles.length; i++) {
      const fileName = lootFiles[i].name.endsWith('.json') ? lootFiles[i].name : `${lootFiles[i].name}.json`;
      zip.file(`${lootPath}${fileName}`, shuffledContents[i]);
    }
  }

  if (config.randomizeRecipes && recipeFiles.length > 0) {
    onProgress?.(75, "正在進行合成產物隨機化");
    const resultsPool = recipeFiles.map(f => f.content.result).filter(r => r !== undefined);
    const shuffledResults = random.shuffle([...resultsPool]);
    const recipePath = "data/minecraft/recipe/";
    for (let i = 0; i < recipeFiles.length; i++) {
      const recipe = recipeFiles[i];
      if (recipe.content.result !== undefined) {
        recipe.content.result = shuffledResults[i % shuffledResults.length];
      }
      const fileName = recipe.name.endsWith('.json') ? recipe.name : `${recipe.name}.json`;
      zip.file(`${recipePath}${fileName}`, JSON.stringify(recipe.content, null, 2));
    }
  }

  onProgress?.(85, "正在生成最終壓縮檔");

  return await zip.generateAsync({ 
    type: "blob",
    compression: "STORE" 
  }, (metadata) => {
    const currentPercent = 85 + (metadata.percent * 0.15);
    onProgress?.(currentPercent, `正在打包: ${Math.round(metadata.percent)}%`);
  });
};
