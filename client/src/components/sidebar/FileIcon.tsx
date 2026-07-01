import type { FC } from 'react';
import {
  FileText, FileCode, FileJson, FileType,
  Image, Settings, Lock, GitBranch, FileTerminal,
  Folder, FolderOpen, FolderGit, FolderCog,
  Database, Globe, Palette, Hash, Braces,
  Box, Cpu, Gem, Coffee, FileSpreadsheet,
  Shield, Scroll, Eye, EyeOff
} from 'lucide-react';

interface FileIconProps {
  name: string;
  extension?: string;
  kind: 'file' | 'directory';
  isOpen?: boolean;
  size?: number;
}

/* ── color palette (VS Code-inspired) ─────────────────────── */
const colors = {
  blue: '#519aba',
  lightBlue: '#42a5f5',
  cyan: '#4ec9b0',
  green: '#7ec699',
  yellow: '#e5c07b',
  orange: '#e37933',
  red: '#ef5350',
  pink: '#c586c0',
  purple: '#b267e6',
  white: '#a2aabc',
  gray: '#6b7280',
  gold: '#cbcb41',
  teal: '#26a69a',
  amber: '#ffb300',
};

/* ── folder icon colors by name ───────────────────────────── */
const folderColorMap: Record<string, string> = {
  src: colors.blue,
  source: colors.blue,
  lib: colors.blue,
  app: colors.blue,
  components: colors.cyan,
  pages: colors.green,
  views: colors.green,
  layouts: colors.green,
  styles: colors.pink,
  css: colors.pink,
  assets: colors.orange,
  images: colors.orange,
  public: colors.orange,
  static: colors.orange,
  config: colors.gray,
  utils: colors.yellow,
  helpers: colors.yellow,
  hooks: colors.purple,
  stores: colors.purple,
  store: colors.purple,
  types: colors.cyan,
  models: colors.cyan,
  api: colors.teal,
  services: colors.teal,
  controllers: colors.teal,
  middleware: colors.teal,
  routes: colors.green,
  test: colors.red,
  tests: colors.red,
  __tests__: colors.red,
  spec: colors.red,
  dist: colors.gray,
  build: colors.gray,
  out: colors.gray,
  node_modules: colors.gray,
  docs: colors.lightBlue,
  scripts: colors.amber,
  ui: colors.cyan,
};

/* ── special folder icons ─────────────────────────────────── */
const specialFolderIcon: Record<string, FC<{ size: number; color: string }>> = {
  '.git': ({ size, color }) => <FolderGit size={size} color={color} />,
  config: ({ size, color }) => <FolderCog size={size} color={color} />,
};

/* ── file extension → icon + color ────────────────────────── */
const fileIconMap: Record<string, { icon: FC<{ size: number; color: string; strokeWidth?: number }>; color: string }> = {
  // TypeScript
  ts: { icon: FileCode, color: colors.blue },
  tsx: { icon: FileCode, color: colors.blue },
  mts: { icon: FileCode, color: colors.blue },
  cts: { icon: FileCode, color: colors.blue },

  // JavaScript
  js: { icon: FileCode, color: colors.yellow },
  jsx: { icon: FileCode, color: colors.yellow },
  mjs: { icon: FileCode, color: colors.yellow },
  cjs: { icon: FileCode, color: colors.yellow },

  // JSON
  json: { icon: FileJson, color: colors.yellow },

  // Markdown
  md: { icon: FileText, color: colors.lightBlue },
  mdx: { icon: FileText, color: colors.lightBlue },

  // Styles
  css: { icon: Palette, color: colors.blue },
  scss: { icon: Palette, color: colors.pink },
  sass: { icon: Palette, color: colors.pink },
  less: { icon: Palette, color: colors.blue },

  // HTML / Web
  html: { icon: Globe, color: colors.orange },
  htm: { icon: Globe, color: colors.orange },
  svg: { icon: Image, color: colors.purple },

  // Images
  png: { icon: Image, color: colors.green },
  jpg: { icon: Image, color: colors.green },
  jpeg: { icon: Image, color: colors.green },
  gif: { icon: Image, color: colors.green },
  webp: { icon: Image, color: colors.green },
  ico: { icon: Image, color: colors.green },

  // Python
  py: { icon: FileCode, color: colors.cyan },
  pyx: { icon: FileCode, color: colors.cyan },

  // Rust
  rs: { icon: Cpu, color: colors.orange },

  // Go
  go: { icon: FileCode, color: colors.cyan },

  // Java / Kotlin
  java: { icon: Coffee, color: colors.red },
  kt: { icon: FileCode, color: colors.purple },

  // C / C++
  c: { icon: FileCode, color: colors.blue },
  cpp: { icon: FileCode, color: colors.blue },
  h: { icon: Hash, color: colors.purple },
  hpp: { icon: Hash, color: colors.purple },

  // C#
  cs: { icon: FileCode, color: colors.green },

  // Ruby
  rb: { icon: Gem, color: colors.red },

  // Shell
  sh: { icon: FileTerminal, color: colors.green },
  bash: { icon: FileTerminal, color: colors.green },
  zsh: { icon: FileTerminal, color: colors.green },
  ps1: { icon: FileTerminal, color: colors.blue },
  bat: { icon: FileTerminal, color: colors.green },
  cmd: { icon: FileTerminal, color: colors.green },

  // Config
  yml: { icon: Settings, color: colors.purple },
  yaml: { icon: Settings, color: colors.purple },
  toml: { icon: Settings, color: colors.gray },
  ini: { icon: Settings, color: colors.gray },
  env: { icon: Settings, color: colors.yellow },
  xml: { icon: Braces, color: colors.orange },

  // Data
  sql: { icon: Database, color: colors.pink },
  db: { icon: Database, color: colors.pink },
  csv: { icon: FileSpreadsheet, color: colors.green },

  // Lock files
  lock: { icon: Lock, color: colors.gray },

  // Docker
  dockerfile: { icon: Box, color: colors.blue },

  // Other
  log: { icon: Scroll, color: colors.gray },
  txt: { icon: FileText, color: colors.white },
  pdf: { icon: FileText, color: colors.red },
  wasm: { icon: Cpu, color: colors.purple },
};

/* ── special filename → icon + color ──────────────────────── */
const specialFileMap: Record<string, { icon: FC<{ size: number; color: string }>; color: string }> = {
  '.gitignore': { icon: GitBranch, color: colors.orange },
  '.gitattributes': { icon: GitBranch, color: colors.orange },
  '.gitmodules': { icon: GitBranch, color: colors.orange },
  '.eslintrc': { icon: Shield, color: colors.purple },
  '.eslintrc.json': { icon: Shield, color: colors.purple },
  '.eslintrc.js': { icon: Shield, color: colors.purple },
  '.prettierrc': { icon: Palette, color: colors.orange },
  '.prettierrc.json': { icon: Palette, color: colors.orange },
  '.editorconfig': { icon: Settings, color: colors.white },
  'dockerfile': { icon: Box, color: colors.blue },
  'docker-compose.yml': { icon: Box, color: colors.blue },
  'docker-compose.yaml': { icon: Box, color: colors.blue },
  '.env': { icon: Settings, color: colors.yellow },
  '.env.local': { icon: EyeOff, color: colors.yellow },
  '.env.production': { icon: EyeOff, color: colors.yellow },
  '.env.development': { icon: EyeOff, color: colors.yellow },
  'package.json': { icon: Box, color: colors.green },
  'package-lock.json': { icon: Lock, color: colors.gray },
  'bun.lock': { icon: Lock, color: colors.amber },
  'bun.lockb': { icon: Lock, color: colors.amber },
  'yarn.lock': { icon: Lock, color: colors.blue },
  'pnpm-lock.yaml': { icon: Lock, color: colors.orange },
  'tsconfig.json': { icon: Settings, color: colors.blue },
  'vite.config.ts': { icon: Settings, color: colors.purple },
  'next.config.js': { icon: Settings, color: colors.white },
  'next.config.mjs': { icon: Settings, color: colors.white },
  'tailwind.config.js': { icon: Palette, color: colors.cyan },
  'tailwind.config.ts': { icon: Palette, color: colors.cyan },
  'readme.md': { icon: Eye, color: colors.lightBlue },
  'license': { icon: Shield, color: colors.yellow },
  'license.md': { icon: Shield, color: colors.yellow },
  '.oxlintrc.json': { icon: Shield, color: colors.purple },
};

/**
 * Professional file/folder icon component matching VS Code style.
 */
const FileIcon: FC<FileIconProps> = ({ name, extension = '', kind, isOpen = false, size = 14 }) => {
  // ── Folder icon ──
  if (kind === 'directory') {
    const lowerName = name.toLowerCase();

    // Special folder icon
    const SpecialIcon = specialFolderIcon[lowerName];
    if (SpecialIcon) {
      const color = folderColorMap[lowerName] || colors.yellow;
      return <SpecialIcon size={size} color={color} />;
    }

    // Standard folder with color by name
    const color = folderColorMap[lowerName] || colors.yellow;
    const FolderIcon = isOpen ? FolderOpen : Folder;
    return <FolderIcon size={size} color={color} />;
  }

  // ── File icon ──
  const lowerName = name.toLowerCase();

  // Check special filenames first
  const special = specialFileMap[lowerName];
  if (special) {
    const { icon: Icon, color } = special;
    return <Icon size={size} color={color} />;
  }

  // Check by extension
  const ext = extension.toLowerCase();
  const mapped = fileIconMap[ext];
  if (mapped) {
    const { icon: Icon, color } = mapped;
    return <Icon size={size} color={color} />;
  }

  // Default file icon
  return <FileType size={size} color={colors.white} />;
};

export default FileIcon;
