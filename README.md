# MC Randomizer

<div align="center">
  <img src="https://img.shields.io/badge/Minecraft-1.21%2B-green.svg" alt="Minecraft Version">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
</div>

**MC Randomizer** is a modern, high-performance web tool designed to generate Minecraft datapacks that randomize **Loot Tables** and **Crafting Recipes**. It features a premium UI, supports multiple Minecraft versions, and offers both original data and custom upload options.

## Features

- **Loot Table Randomization**: Shuffle drops from blocks, entities, and chests.
- **Recipe Randomization**: Shuffle crafting recipes to create a chaotic survival experience.
- **Multi-Version Support**: Built-in support for Minecraft 1.21 and its minor versions (1.21.2, 1.21.4, etc.).
- **Dual Data Source**:
    - **Original**: Use built-in vanilla data for specific versions.
    - **Custom**: Upload your own JSON files or ZIP archives to randomize modded content.
- **Custom Seed**: Share the same seed with friends for identical randomization results.
- **High Performance**: Runs entirely in your browser using JSZip.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/random-drop-recipe.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. **Select Source**: Choose "Original" to use built-in data or "Custom" to upload files.
2. **Select Version**: Pick your target Minecraft version (e.g., 1.21.4).
3. **Configure**: Toggle "Loot Randomizer" and/or "Recipe Randomizer".
4. **Generate**: Click "Generate & Download" to get your datapack.
5. **Install**: Place the downloaded ZIP file into your world's `datapacks` folder.

## Technologies

- React + TypeScript
- Vite
- Tailwind CSS
- JSZip for browser-side compression

## License

This project is open source and available under the [MIT License](LICENSE).
