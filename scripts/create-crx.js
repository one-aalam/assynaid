/**
 * Assynaid CRX Package Creation Script
 * This script creates a .crx file for enterprise distribution
 *
 * Prerequisites:
 * - OpenSSL installed and available in PATH
 * - Chrome installed
 * - A signing key (will be created if not present)
 */
import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

// Configuration
const config = {
  // Extension info
  name: 'Assynaid',
  version: process.env.VERSION || '1.0.0',

  // Directory paths
  rootDir: path.resolve('.'),
  distDir: path.resolve('./dist'),
  outputDir: path.resolve('./releases'),

  // Key paths
  keyFile: path.resolve('./private/key.pem'),
  privateDir: path.resolve('./private'),

  // Output filenames
  crxFilename: 'assynaid.crx',
  updateXmlFilename: 'update.xml',

  // Chrome paths (platform-specific)
  chromePath:
    process.platform === 'win32'
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : '/usr/bin/google-chrome'
};

/**
 * Main function to create the CRX package
 */
async function createCrxPackage() {
  try {
    console.log(`\n🔒 Creating CRX package for ${config.name} v${config.version}\n`);

    // Ensure directories exist
    await fs.mkdir(config.outputDir, { recursive: true });
    await fs.mkdir(config.privateDir, { recursive: true });

    // Generate or use existing key
    await ensureKeyExists();

    // Create CRX file
    await createCrx();

    // Generate update XML
    await createUpdateXml();

    console.log(`\n✅ CRX package created successfully! Files saved to ${config.outputDir}\n`);
  } catch (error) {
    console.error('\n❌ CRX creation failed:', error);
    process.exit(1);
  }
}

/**
 * Ensure a private key exists for signing
 */
async function ensureKeyExists() {
  try {
    await fs.access(config.keyFile);
    console.log('  - Using existing private key');
  } catch (error) {
    // Key doesn't exist, generate it
    console.log('  - Generating new private key...');

    // Generate a new RSA key
    execSync(`openssl genrsa -out "${config.keyFile}" 2048`);

    // Set restrictive permissions
    await fs.chmod(config.keyFile, 0o600);

    console.log('  - Private key generated');

    // Create a readme file in the private directory
    const readmePath = path.join(config.privateDir, 'README.md');
    await fs.writeFile(
      readmePath,
      `# Private Extension Key

This directory contains the private key used to sign the ${config.name} extension for distribution.

## Important Security Notes

- **DO NOT** share or commit this key to version control
- **DO NOT** lose this key, as it's required for future updates
- Keep backup copies in a secure location

The key is used to sign the CRX file for enterprise distribution.
`
    );
  }
}

/**
 * Create the CRX file using Chrome's pack extension feature
 */
async function createCrx() {
  try {
    console.log('  - Creating CRX package...');

    // Get extension ID from the manifest
    const manifestPath = path.join(config.distDir, 'manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

    let extensionId;

    // If the key is in the manifest, use it to derive the ID
    if (manifest.key) {
      // Convert the key to extension ID
      const keyBuffer = Buffer.from(manifest.key, 'base64');
      const hash = crypto.createHash('sha256').update(keyBuffer).digest('hex');
      extensionId = hash
        .substring(0, 32)
        .split('')
        .map((c) => {
          return 'abcdefghijklmnopqrstuvwxyz'[parseInt(c, 16)];
        })
        .join('');

      console.log(`  - Using extension ID from manifest: ${extensionId}`);
    } else {
      // Generate a random ID for demonstration
      extensionId = crypto.randomBytes(16).toString('hex');
      console.log(`  - Generated temporary extension ID: ${extensionId}`);
    }

    // Path for the CRX file
    const crxPath = path.join(
      config.outputDir,
      `${config.name.toLowerCase()}-${config.version}.crx`
    );

    // Use Chrome to pack the extension
    // Note: This part is platform-dependent and might need adjustments
    execSync(
      `"${config.chromePath}" --pack-extension="${config.distDir}" --pack-extension-key="${config.keyFile}" --no-message-box`
    );

    // Chrome creates the CRX in the parent directory of the dist folder
    const generatedCrxPath = `${config.distDir}.crx`;

    // Move it to the desired location
    await fs.rename(generatedCrxPath, crxPath);

    console.log(`  - CRX file created: ${crxPath}`);
    return { crxPath, extensionId };
  } catch (error) {
    console.error('Error creating CRX file:', error);

    // Alternative method: Create a ZIP file instead
    console.log('  - Falling back to ZIP file creation...');

    const zipPath = path.join(
      config.outputDir,
      `${config.name.toLowerCase()}-${config.version}.zip`
    );
    execSync(`cd "${config.distDir}" && zip -r "${zipPath}" .`);

    console.log(`  - ZIP file created as fallback: ${zipPath}`);

    // Create a note about manual CRX creation
    const notePath = path.join(config.outputDir, 'crx-creation-note.md');
    await fs.writeFile(
      notePath,
      `# Manual CRX Creation Required

The automatic CRX creation failed. Here are manual steps:

1. Open Chrome and go to chrome://extensions/
2. Enable Developer mode
3. Click "Pack extension"
4. Enter the path to the dist folder: ${config.distDir}
5. Enter the path to the private key: ${config.keyFile}
6. Click "Pack extension"
7. Move the generated CRX file to the releases folder

Note: Keep the private key secure. You'll need it for future updates.
`
    );

    // Return a placeholder extension ID
    return { crxPath: zipPath, extensionId: crypto.randomBytes(16).toString('hex') };
  }
}

/**
 * Create an update.xml file for enterprise distribution
 */
async function createUpdateXml() {
  console.log('  - Creating update XML...');

  // Get extension ID from the manifest
  const manifestPath = path.join(config.distDir, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

  // Use a placeholder URL - this should be updated with your actual hosting URL
  const crxUrl = `https://example.com/extensions/${config.name.toLowerCase()}-${config.version}.crx`;

  // Use a placeholder extension ID - in a real scenario, you'd use your actual extension ID
  const extensionId = 'YOUR_EXTENSION_ID_HERE';

  const updateXml = `<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
  <app appid="${extensionId}">
    <updatecheck codebase="${crxUrl}" version="${config.version}" />
  </app>
</gupdate>`;

  const updateXmlPath = path.join(config.outputDir, config.updateXmlFilename);
  await fs.writeFile(updateXmlPath, updateXml);

  console.log(`  - Update XML created: ${updateXmlPath}`);

  // Create a readme file explaining how to use the update XML
  const readmePath = path.join(config.outputDir, 'enterprise-deployment-readme.md');
  await fs.writeFile(
    readmePath,
    `# Enterprise Deployment for ${config.name}

This document explains how to deploy ${config.name} in an enterprise environment.

## Files

- **${config.name.toLowerCase()}-${config.version}.crx**: The packaged extension
- **update.xml**: The update manifest for automatic updates

## Deployment Options

### 1. Using Group Policy (Windows)

1. Host the CRX file and update.xml on a web server

2. Create a policy file:
\`\`\`json
{
  "ExtensionInstallForcelist": [
    "${extensionId};https://your-server.com/update.xml"
  ]
}
\`\`\`

3. Deploy the policy using Group Policy or registry settings

### 2. Using Chrome Enterprise

1. Upload the CRX to your organization's Chrome Web Store
2. Deploy to users through the Google Admin Console

## Important Notes

- Update the URL in update.xml to point to your actual hosting location
- The extension ID in update.xml must match your actual extension ID
- For automatic updates, keep the same update.xml URL but update its contents

For more information, see: https://developer.chrome.com/docs/extensions/mv3/enterprise/
`
  );
}

// Run the script
createCrxPackage();
