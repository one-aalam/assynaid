/**
 * Assynaid Extension Packaging Script
 * This script handles the complete packaging process for distribution
 */
import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import archiver from 'archiver';

// Configuration
const config = {
  // Extension info
  name: 'Assynaid',
  version: process.env.VERSION || '1.0.0',

  // Directory paths
  rootDir: path.resolve('.'),
  distDir: path.resolve('./dist'),
  outputDir: path.resolve('./releases'),

  // Output filenames
  zipFilename: 'assynaid.zip',
  crxFilename: 'assynaid.crx',

  // Files to include in the package
  additionalFiles: [
    { source: 'LICENSE', destination: 'LICENSE' },
    { source: 'README.md', destination: 'README.md' }
  ]
};

/**
 * Main packaging process
 */
async function packageExtension() {
  try {
    console.log(`\n📦 Packaging ${config.name} v${config.version}\n`);

    // 1. Preparation
    await prepareDirectories();

    // 2. Build the extension
    await buildExtension();

    // 3. Verify the build
    await verifyBuild();

    // 4. Create the distributable package
    await createZipPackage();

    // 5. Generate extension stats
    await generateStats();

    console.log(`\n✅ Packaging complete! Files saved to ${config.outputDir}\n`);
  } catch (error) {
    console.error('\n❌ Packaging failed:', error);
    process.exit(1);
  }
}

/**
 * Prepare the necessary directories
 */
async function prepareDirectories() {
  console.log('🛠️  Preparing directories...');

  // Create output directory if it doesn't exist
  await fs.mkdir(config.outputDir, { recursive: true });

  // Clear previous builds
  if (await directoryExists(config.distDir)) {
    console.log('  - Clearing previous build...');
    await fs.rm(config.distDir, { recursive: true, force: true });
  }

  console.log('  - Directories prepared.');
}

/**
 * Build the extension using Vite
 */
async function buildExtension() {
  console.log('🔨 Building extension...');

  try {
    // Run the build command
    execSync('npm run build', { stdio: 'inherit' });
    console.log('  - Build completed successfully.');
  } catch (error) {
    throw new Error(`Build failed: ${error.message}`);
  }
}

/**
 * Verify the build output
 */
async function verifyBuild() {
  console.log('🔍 Verifying build...');

  // List of required files
  const requiredFiles = [
    'manifest.json',
    'popup/index.html',
    'background/background.js',
    'content/content.js',
    'assets/images/logo.svg',
    'assets/images/icon-16.png',
    'assets/images/icon-32.png',
    'assets/images/icon-48.png',
    'assets/images/icon-128.png'
  ];

  // Check each required file
  for (const file of requiredFiles) {
    const filePath = path.join(config.distDir, file);
    if (!(await fileExists(filePath))) {
      throw new Error(`Required file missing: ${file}`);
    }
  }

  // Check that popup directory contains JS files
  const popupDir = path.join(config.distDir, 'popup');
  const popupFiles = await fs.readdir(popupDir);
  const hasJsFile = popupFiles.some((file) => file.endsWith('.js'));

  if (!hasJsFile) {
    throw new Error('No JavaScript file found in popup directory');
  }

  console.log('  - Build verification passed.');
}

/**
 * Create the ZIP package for distribution
 */
async function createZipPackage() {
  console.log('📦 Creating distribution package...');

  const zipPath = path.join(config.outputDir, `${config.name.toLowerCase()}-${config.version}.zip`);

  return new Promise((resolve, reject) => {
    // Create a file to stream archive data to
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Listen for errors
    archive.on('error', (err) => reject(err));

    // Wait for close event to resolve the promise
    output.on('close', () => {
      console.log(`  - Package created: ${zipPath} (${formatSize(archive.pointer())})`);
      resolve();
    });

    // Pipe archive data to the file
    archive.pipe(output);

    // Add dist directory contents
    archive.directory(config.distDir, false);

    // Add additional files
    for (const file of config.additionalFiles) {
      archive.file(path.join(config.rootDir, file.source), { name: file.destination });
    }

    // Finalize the archive (write the remaining data and close the stream)
    archive.finalize();
  });
}

/**
 * Generate package statistics
 */
async function generateStats() {
  console.log('📊 Generating package statistics...');

  try {
    // Get all files in the dist directory
    const files = await getAllFiles(config.distDir);

    // Calculate total size
    let totalSize = 0;
    for (const file of files) {
      const stats = await fs.stat(file);
      totalSize += stats.size;
    }

    // Create stats report
    const statsReport = {
      version: config.version,
      fileCount: files.length,
      totalSize: formatSize(totalSize),
      timestamp: new Date().toISOString(),
      files: {}
    };

    // Group files by type
    for (const file of files) {
      const ext = path.extname(file).slice(1) || 'other';
      if (!statsReport.files[ext]) {
        statsReport.files[ext] = 0;
      }
      statsReport.files[ext]++;
    }

    // Write stats to file
    const statsPath = path.join(
      config.outputDir,
      `${config.name.toLowerCase()}-${config.version}-stats.json`
    );
    await fs.writeFile(statsPath, JSON.stringify(statsReport, null, 2));

    console.log(`  - ${files.length} files, total size: ${formatSize(totalSize)}`);
    console.log(`  - Stats saved to: ${statsPath}`);
  } catch (error) {
    console.error('  - Failed to generate stats:', error);
    // Continue anyway, this is not critical
  }
}

/**
 * Helper function to check if a file exists
 */
async function fileExists(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch (error) {
    return false;
  }
}

/**
 * Helper function to check if a directory exists
 */
async function directoryExists(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Helper function to get all files in a directory recursively
 */
async function getAllFiles(dir, fileList = []) {
  const files = await fs.readdir(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await fs.stat(filePath);

    if (stats.isDirectory()) {
      fileList = await getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Helper function to format file size
 */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Execute the packaging process
packageExtension();
