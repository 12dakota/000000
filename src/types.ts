export interface ScriptConfig {
  board: string;
  manifestBranch: string;
  includeFirefox: boolean;
  firefoxVersion: string;
  splashTitle: string;
  splashSubtitle: string;
  splashBgColor: string;
  splashAccent1: string;
  splashAccent2: string;
  enableRootfsVerification: boolean;
  imageType: 'test' | 'base' | 'dev';
  repoJobs: number;
  outputDirectory: string;
  githubRepo: string;
  // MSI and BIOS additions
  buildChromeOS: boolean;
  buildBios: boolean;
  biosPayload: 'depthcharge' | 'tianocore' | 'both';
  gbbFlags: string;
  disableSoftwareWp: boolean;
  msiProductVersion: string;
  msiInstallDir: string;
}

export interface ScriptFile {
  filename: string;
  language: 'powershell' | 'bash' | 'batch' | 'markdown' | 'xml' | 'yaml';
  description: string;
  content: string;
  badge?: string;
}

export interface BoardInfo {
  id: string;
  name: string;
  cpu: string;
  arch: string;
  popularDevices: string[];
  wpType: 'cr50_ccd' | 'battery_disconnect' | 'wp_screw';
  recommendedBiosPayload: 'depthcharge' | 'tianocore';
}
