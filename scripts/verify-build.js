/**
 * Verify build script for Assynaid
 * This script checks that all necessary files are in the correct locations
 */
import { promises as fs } from 'fs';
import path from 'path';

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

async function verifyBuild() {
  console.log('Verifying build structure...');
  
  const distDir = path.resolve('dist');
  let hasErrors = false;
  
  // Required files and directories
  const requiredPaths = [
    'manifest.json',
    'popup/index.html',
    'background/background.js',
    'content/content.js',
    'assets/images/logo.svg',
    'assets/images/icon-16.png',
    'assets/images/icon-32.png',
    'assets/images/icon-48.png',
    'assets/images/icon-128.png',
    'welcome/welcome.html'
  ];
  
  // Check each required path
  for (const requiredPath of requiredPaths) {
    const fullPath = path.join(distDir, requiredPath);
    const exists = await fileExists(fullPath);
    
    if (exists) {
      console.log(`✅ ${requiredPath}`);
    } else {
      console.error(`❌ ${requiredPath} - MISSING!`);
      hasErrors = true;
    }
  }
  
  // Check for popup JS file (the exact filename will include a hash)
  const popupDir = path.join(distDir, 'popup');
  try {
    const popupFiles = await fs.readdir(popupDir);
    const hasJsFile = popupFiles.some(file => file.match(/popup\.[a-z0-9]+\.js$/));
    
    if (hasJsFile) {
      console.log('✅ popup/popup.[hash].js');
    } else {
      console.error('❌ popup/popup.[hash].js - MISSING!');
      hasErrors = true;
    }
    
    // Check for CSS file
    const hasCssFile = popupFiles.some(file => file.endsWith('.css'));
    
    if (hasCssFile) {
      console.log('✅ popup/styles.[hash].css');
    } else {
      console.warn('⚠️ popup/styles.[hash].css - Not found (CSS might be inlined)');
    }
    
  } catch (error) {
    console.error('❌ Could not read popup directory!');
    hasErrors = true;
  }
  
  // Check for src directory (should NOT exist in final build)
  const srcDir = path.join(distDir, 'src');
  const srcExists = await fileExists(srcDir);
  
  if (srcExists) {
    console.error('❌ dist/src directory should not exist in final build!');
    hasErrors = true;
  } else {
    console.log('✅ No dist/src directory (good!)');
  }
  
  // Summary
  if (hasErrors) {
    console.error('\n❌ Build verification FAILED. Please fix the issues above.');
    process.exit(1);
  } else {
    console.log('\n✅ Build verification PASSED. All required files are in place.');
  }
}

verifyBuild();
