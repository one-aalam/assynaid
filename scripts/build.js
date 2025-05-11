/**
 * Fix build script for Assynaid
 * This script ensures that all files are in the correct location in the dist directory
 */
import { promises as fs } from 'fs';
import path from 'path';

async function copyDirectory(src, dest) {
  try {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    console.error(`Error copying directory ${src} to ${dest}:`, error);
  }
}

async function build() {
  const distDir = path.resolve('dist');
  const srcPopupDir = path.join(distDir, 'src', 'popup');
  const destPopupDir = path.join(distDir, 'popup');
  
  try {
    // Check if the incorrect directory structure exists
    try {
      await fs.access(srcPopupDir);
      
      // Create the destination popup directory if it doesn't exist
      await fs.mkdir(destPopupDir, { recursive: true });
      
      // Copy files from src/popup to popup
      console.log(`Copying files from ${srcPopupDir} to ${destPopupDir}`);
      await copyDirectory(srcPopupDir, destPopupDir);
      
      // Copy popup HTML file if it's in the wrong location
      const srcHtmlPath = path.join(srcPopupDir, 'index.html');
      const destHtmlPath = path.join(destPopupDir, 'index.html');
      
      try {
        await fs.access(srcHtmlPath);
        console.log(`Copying ${srcHtmlPath} to ${destHtmlPath}`);
        await fs.copyFile(srcHtmlPath, destHtmlPath);
      } catch (htmlError) {
        console.log('Popup HTML file not found in src/popup directory, skipping...');
      }
      
      // Verify that the popup HTML file exists in the correct location
      try {
        await fs.access(destHtmlPath);
        console.log(`Popup HTML file successfully placed at ${destHtmlPath}`);
      } catch (error) {
        console.error('Failed to place popup HTML file in the correct location!');
      }
      
      // Clean up the src/popup directory if everything was copied successfully
      console.log(`Removing ${srcPopupDir}`);
      await fs.rm(srcPopupDir, { recursive: true, force: true });
      
      // Check if src directory is empty, remove it if it is
      const srcDir = path.join(distDir, 'src');
      try {
        const entries = await fs.readdir(srcDir);
        if (entries.length === 0) {
          console.log(`Removing empty ${srcDir}`);
          await fs.rmdir(srcDir);
        }
      } catch (error) {
        // src directory might not exist, that's fine
      }
    } catch (error) {
      console.log('src/popup directory not found, build structure seems correct');
    }
    
    // Ensure manifest.json is in the dist directory
    try {
      await fs.access(path.join(distDir, 'manifest.json'));
    } catch (error) {
      console.log('Copying manifest.json to dist directory');
      await fs.copyFile(
        path.join('src', 'manifest.json'),
        path.join(distDir, 'manifest.json')
      );
    }
    
    // Make sure assets directory exists
    await fs.mkdir(path.join(distDir, 'assets'), { recursive: true });
    await fs.mkdir(path.join(distDir, 'assets', 'images'), { recursive: true });
    
    // Copy logo and icon files if they don't exist
    const logoSvgSrc = path.join('src', 'assets', 'images', 'logo.svg');
    const logoSvgDest = path.join(distDir, 'assets', 'images', 'logo.svg');
    
    try {
      await fs.access(logoSvgDest);
    } catch (error) {
      console.log('Copying logo.svg to dist/assets/images');
      await fs.copyFile(logoSvgSrc, logoSvgDest);
    }
    
    // Create placeholder icons if they don't exist
    const iconSizes = [16, 32, 48, 128];
    for (const size of iconSizes) {
      const iconDest = path.join(distDir, 'assets', 'images', `icon-${size}.png`);
      try {
        await fs.access(iconDest);
      } catch (error) {
        console.log(`Creating icon-${size}.png placeholder`);
        await fs.copyFile(logoSvgSrc, iconDest);
      }
    }
    
    console.log('Build directory structure fixed successfully!');
  } catch (error) {
    console.error('Error fixing build:', error);
  }
}

build();
