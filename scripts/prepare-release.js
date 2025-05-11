/**
 * Assynaid Release Preparation Script
 * This script prepares the codebase for a new release by:
 * 1. Updating version numbers in relevant files
 * 2. Creating a changelog entry
 * 3. Preparing release notes
 */
import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

// Get the current version from package.json
async function getCurrentVersion() {
  const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
  return packageJson.version;
}

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt the user for input
const prompt = (question) => new Promise((resolve) => rl.question(question, resolve));

async function prepareRelease() {
  try {
    console.log('🚀 Preparing Assynaid Release\n');

    // Get current version
    const currentVersion = await getCurrentVersion();
    console.log(`Current version: ${currentVersion}`);

    // Ask for new version
    const newVersion = await prompt('New version (leave empty to use current): ');
    const version = newVersion || currentVersion;

    if (newVersion && newVersion !== currentVersion) {
      // Update version in package.json
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      packageJson.version = newVersion;
      await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`✅ Updated version in package.json to ${newVersion}`);

      // Update version in manifest.json
      const manifestPath = path.join('src', 'manifest.json');
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      manifest.version = newVersion;
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
      console.log(`✅ Updated version in manifest.json to ${newVersion}`);
    }

    // Ask for release notes
    console.log('\n📝 Enter release notes (Enter a blank line to finish):');
    const releaseNotes = [];
    let line;
    while ((line = await prompt('> ')) !== '') {
      releaseNotes.push(line);
    }

    // Create/update CHANGELOG.md
    await updateChangelog(version, releaseNotes);

    // Create release notes file
    const releaseNotesPath = path.join('releases', `v${version}-notes.md`);
    await fs.mkdir('releases', { recursive: true });
    await fs.writeFile(releaseNotesPath, generateReleaseNotes(version, releaseNotes));
    console.log(`✅ Release notes saved to ${releaseNotesPath}`);

    // Run tests and linting
    console.log('\n🧪 Running tests and linting...');
    execSync('npm run lint', { stdio: 'inherit' });
    execSync('npm run check', { stdio: 'inherit' });
    console.log('✅ Tests and linting passed');

    console.log(`\n🎉 Release v${version} prepared successfully!`);
    console.log('\nNext steps:');
    console.log('1. Review the changes (git diff)');
    console.log('2. Commit the changes: git commit -am "Prepare release v' + version + '"');
    console.log('3. Create a tag: git tag v' + version);
    console.log('4. Run the package command: npm run package:release');

    rl.close();
  } catch (error) {
    console.error('\n❌ Release preparation failed:', error);
    rl.close();
    process.exit(1);
  }
}

// Update CHANGELOG.md with new release notes
async function updateChangelog(version, notes) {
  const date = new Date().toISOString().split('T')[0];
  const header = `## [${version}] - ${date}\n`;

  const changelogEntry = [header, ...notes.map((note) => `- ${note}`), '\n'].join('\n');

  let changelog;
  try {
    changelog = await fs.readFile('CHANGELOG.md', 'utf8');
  } catch (error) {
    // Create new changelog if it doesn't exist
    changelog =
      '# Changelog\n\nAll notable changes to Assynaid will be documented in this file.\n\n';
  }

  // Insert new release notes after the header
  const changelogLines = changelog.split('\n');
  let insertIndex = changelogLines.findIndex((line) => line.startsWith('## '));

  if (insertIndex === -1) {
    insertIndex = changelogLines.length;
  }

  const newChangelog = [
    ...changelogLines.slice(0, insertIndex),
    changelogEntry,
    ...changelogLines.slice(insertIndex)
  ].join('\n');

  await fs.writeFile('CHANGELOG.md', newChangelog);
  console.log('✅ Updated CHANGELOG.md');
}

// Generate formatted release notes
function generateReleaseNotes(version, notes) {
  const date = new Date().toISOString().split('T')[0];

  return [
    `# Assynaid v${version} Release Notes`,
    `Release Date: ${date}`,
    '',
    '## Changes in this release:',
    '',
    ...notes.map((note) => `- ${note}`),
    '',
    '## Installation',
    '',
    '1. Download the extension zip file',
    '2. Extract the zip file',
    '3. Open Chrome and go to chrome://extensions/',
    '4. Enable "Developer mode"',
    '5. Click "Load unpacked" and select the extracted folder',
    '',
    '## Feedback',
    '',
    'Please report any issues or suggestions on our GitHub repository.'
  ].join('\n');
}

// Run the script
prepareRelease();
