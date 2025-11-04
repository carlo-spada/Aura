#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Folders to remove
const foldersToRemove = [
  'app/(protected)',
  'app/(public)',
];

console.log('🧹 Pre-build cleanup starting...');

foldersToRemove.forEach(folder => {
  const fullPath = path.join(process.cwd(), folder);

  if (fs.existsSync(fullPath)) {
    console.log(`  Removing ${folder}...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`  ✅ Removed ${folder}`);
  } else {
    console.log(`  ⏭️  ${folder} doesn't exist, skipping`);
  }
});

console.log('✨ Pre-build cleanup complete!');