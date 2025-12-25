
export enum RandomizerType {
  LOOT = 'LOOT',
  RECIPE = 'RECIPE'
}

export type MinecraftVersion = '1.21.11' | '1.21.10' | '1.21' | '1.20.6' | '1.20.4' | '1.19.4';

export interface CustomFile {
  name: string;
  content: string;
  type: 'loot' | 'recipe' | 'unknown';
}

export interface GeneratorConfig {
  seed: string;
  packName: string;
  description: string;
  version: MinecraftVersion;
  randomizeLoot: boolean;
  randomizeRecipes: boolean;
  shufflingMode: 'total' | 'themed';
  customFiles: CustomFile[];
}

export interface MinecraftData {
  blocks: string[];
  items: string[];
}

export interface PackMetadata {
  format: number;
  description: string;
}
