import fs from 'fs';
import path from 'path';
import { getAllScripts } from '../src/utils/scriptGenerators';
import { ScriptConfig } from '../src/types';

const defaultConfig: ScriptConfig = {
  board: 'dedede',
  manifestBranch: 'release-R120-15662.B',
  includeFirefox: true,
  firefoxVersion: '140.0',
  splashTitle: 'ChromiumOS',
  splashSubtitle: 'Empowered with Mozilla Firefox',
  splashBgColor: '#0f172a',
  splashAccent1: '#f97316',
  splashAccent2: '#38bdf8',
  enableRootfsVerification: false,
  imageType: 'test',
  repoJobs: 8,
  outputDirectory: 'C:\\ChromiumOS-Builds',
  githubRepo: 'https://github.com/12dakota/Chromeos',
  buildChromeOS: true,
  buildBios: true,
  biosPayload: 'depthcharge',
  gbbFlags: '0x489',
  disableSoftwareWp: true,
  msiProductVersion: '1.0.0',
  msiInstallDir: 'C:\\Program Files\\ChromiumOS Toolkit'
};

console.log('Generating scripts for board:', defaultConfig.board);
const scripts = getAllScripts(defaultConfig);

// Create directory structure
const dirs = [
  'installer',
  'scripts',
  'linux-workers',
  'firmware',
  'artwork',
  '.github/workflows'
];

dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

// Write each script to its designated place
scripts.forEach(s => {
  let targetPath = s.filename;
  if (s.filename === 'Product.wxs' || s.filename === 'build-msi.ps1') {
    // Keep a copy in root AND installer/
    fs.writeFileSync(path.join('installer', s.filename), s.content, 'utf8');
    fs.writeFileSync(s.filename, s.content, 'utf8');
    console.log('Wrote:', s.filename, 'to root and installer/');
    return;
  }

  if (s.filename.endsWith('.sh')) {
    fs.writeFileSync(path.join('linux-workers', s.filename), s.content, 'utf8');
    // Also copy to scripts for WiX reference
    fs.writeFileSync(path.join('scripts', s.filename), s.content, 'utf8');
    fs.writeFileSync(s.filename, s.content, 'utf8');
    console.log('Wrote worker:', s.filename);
    return;
  }

  if (s.filename.startsWith('Build-') || s.filename.startsWith('Flash-')) {
    fs.writeFileSync(path.join('scripts', s.filename), s.content, 'utf8');
    fs.writeFileSync(s.filename, s.content, 'utf8');
    console.log('Wrote script:', s.filename);
    return;
  }

  // Root files (ChromiumOS-Builder-GUI.ps1, README-Windows.md, etc.)
  fs.writeFileSync(s.filename, s.content, 'utf8');
  console.log('Wrote root file:', s.filename);
});

// Also create 1-click batch files
const compileMsiBat = `@echo off
title WiX MSI Installer Compiler
cd /d "%~dp0"
echo ========================================================
echo   Compiling ChromiumOS & BIOS Windows MSI Package
echo ========================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-msi.ps1" %*
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] MSI compilation failed.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo [SUCCESS] Installer compiled successfully!
echo You can now distribute or run ChromiumOS-Toolkit-Setup-*.msi
pause
`;
fs.writeFileSync('compile-msi.bat', compileMsiBat, 'utf8');
fs.writeFileSync(path.join('installer', 'compile-msi.bat'), compileMsiBat, 'utf8');

console.log('All standalone toolkit files generated successfully.');
