# =============================================================================
# FlowExec: TypeScript → JavaScript Conversion Script
# =============================================================================
param(
  [string]$SrcDir = "D:\Invictus Project\iteration change\project_management\src",
  [string]$Root   = "D:\Invictus Project\iteration change\project_management"
)

$ErrorActionPreference = "Stop"

# ── helpers ──────────────────────────────────────────────────────────────────

function Strip-TypeScript {
  param([string]$code)

  # 1. Remove bare "import type ..." lines entirely
  $code = $code -replace '(?m)^import\s+type\s+.*?;\s*$', ''

  # 2. Remove "type" keyword from mixed imports: import { type Foo, Bar } -> import { Bar }
  #    Also handles { Foo, type Bar } -> { Foo, Bar }
  $code = $code -replace '\{\s*(.*?)\s*\}',  {
    param($m)
    $inner = $m.Groups[1].Value
    # strip "type " prefix from each item
    $cleaned = ($inner -split ',') | ForEach-Object {
      $item = $_.Trim() -replace '^type\s+', ''
      $item
    }
    $joined = ($cleaned | Where-Object { $_ -ne '' }) -join ', '
    "{ $joined }"
  }

  # 3. Remove TypeScript type annotations from function parameters: (x: string) -> (x)
  #    But be careful not to break JSX attribute strings or object destructuring
  # We handle common patterns with a multi-pass regex

  # Remove return type annotations: ): ReturnType => or ): ReturnType {
  $code = $code -replace '\)\s*:\s*[A-Za-z_$][A-Za-z0-9_$<>\[\]|&\s,{}\(\)\.?!*+]*\s*(?=\s*=>|\s*\{)', ')'

  # Remove parameter type annotations: (param: Type) and (param?: Type)
  # This runs multiple times to catch nested generics
  for ($i = 0; $i -lt 6; $i++) {
    $code = $code -replace '(\b\w+\??)\s*:\s*[A-Za-z_$][A-Za-z0-9_$<>\[\]|&\s,{}\.?!*+]*(?=\s*[,)\n])', '$1'
  }

  # 4. Remove explicit generic type parameters from calls: fn<Type>( -> fn(
  $code = $code -replace '(?<![=<>!])(<[A-Za-z_$][A-Za-z0-9_$<>\[\]|&\s,{}\.?!*+]*>)\s*\(', '('

  # 5. Remove "as Type" type assertions (not JSX): value as string -> value
  $code = $code -replace '\s+as\s+[A-Za-z_$][A-Za-z0-9_$<>\[\]|&.?!\s]*(?=\s*[;,)\]}])', ''

  # 6. Remove non-null assertions: value! -> value
  $code = $code -replace '(?<=[a-zA-Z0-9_\)\]\'\")`])!(?=[\.\[\)\],;\s{])', ''

  # 7. Remove "export type { ... }" and "export type X = ..." lines
  $code = $code -replace '(?m)^export\s+type\s+\{[^}]*\}\s*;\s*$', ''
  $code = $code -replace '(?m)^export\s+type\s+\w+[^;]*;\s*$', ''

  # 8. Remove standalone type alias declarations: type X = ...;
  $code = $code -replace '(?m)^type\s+[A-Za-z_$][A-Za-z0-9_$]*\s*(<[^>]*>)?\s*=\s*.*?;\s*$', ''

  # 9. Remove interface declarations (multi-line)
  $code = $code -replace '(?ms)^(export\s+)?interface\s+\w+(\s+extends\s+[^{]+)?\s*\{[^{}]*\}', ''

  # 10. Remove enum declarations and convert to object (simple: keep as const object)
  # For now just remove the TypeScript-specific "export enum"
  # (enums are rare and usually handled by being kept as const objects)

  # 11. Remove "React.FC<...>" type - replace with just the function
  $code = $code -replace ':\s*React\.FC(<[^>]*>)?\s*=', '='
  $code = $code -replace ':\s*React\.FC\b\s*=', '='

  # 12. Remove TypeScript generics from React hooks: useState<string>( -> useState(
  $code = $code -replace '(use(?:State|Ref|Callback|Memo|Context|Reducer|Effect|LayoutEffect|ImperativeHandle))<[^<>]*(?:<[^<>]*(?:<[^<>]*>[^<>]*)*>[^<>]*)?>(\s*\()', '$1$2'

  # 13. Remove generic type parameters from zustand create: create<State>( -> create(
  $code = $code -replace '\bcreate<[^>]*>\(', 'create('

  # 14. Remove "as const" — keep value
  $code = $code -replace '\s+as\s+const\b', ''

  # 15. Remove TypeScript "satisfies" operator
  $code = $code -replace '\s+satisfies\s+[A-Za-z_$][A-Za-z0-9_$<>\[\]|&.?\s]*', ''

  # 16. Clean up any empty "import { } from '...'" lines that result from stripping type imports
  $code = $code -replace "(?m)^import\s+\{\s*\}\s+from\s+'[^']+';\s*$", ''
  $code = $code -replace '(?m)^import\s+\{\s*\}\s+from\s+"[^"]+";\s*$', ''

  # 17. Remove remaining type annotations with complex patterns we may have missed
  # Handle "const x: Type =" patterns
  $code = $code -replace '((?:const|let|var)\s+\w+)\s*:\s*[A-Za-z_$][A-Za-z0-9_$<>\[\]|&\s,{}()\.?!*]+\s*=', '$1 ='

  return $code
}

function Get-NewExtension {
  param([string]$ext)
  if ($ext -eq '.tsx') { return '.jsx' }
  if ($ext -eq '.ts')  { return '.js'  }
  return $ext
}

# ── Phase 1: Convert source files ─────────────────────────────────────────────

Write-Host "`n=== Phase 1: Converting TS/TSX → JS/JSX ===" -ForegroundColor Cyan

$files = Get-ChildItem -Path $SrcDir -Recurse -Include '*.ts','*.tsx' | Sort-Object FullName
$converted = 0
$skipped   = 0

foreach ($file in $files) {
  $ext    = $file.Extension          # '.ts' or '.tsx'
  $newExt = Get-NewExtension $ext
  $newPath = [IO.Path]::ChangeExtension($file.FullName, $newExt)

  $content = Get-Content $file.FullName -Raw -Encoding UTF8
  if (-not $content) { $content = "" }

  $converted_content = Strip-TypeScript $content

  # Write the new JS/JSX file
  Set-Content -Path $newPath -Value $converted_content -Encoding UTF8 -NoNewline

  # Remove the old TS/TSX file (only if it's a different path)
  if ($newPath -ne $file.FullName) {
    Remove-Item $file.FullName -Force
  }

  Write-Host "  ✓ $($file.Name) → $([IO.Path]::GetFileName($newPath))"
  $converted++
}

Write-Host "`nConverted $converted files." -ForegroundColor Green

# ── Phase 2: Update internal import paths ────────────────────────────────────

Write-Host "`n=== Phase 2: Updating import extensions in source files ===" -ForegroundColor Cyan

# Vite with bundler mode resolves extensions automatically, so we don't need
# to update import paths — but we do need to remove explicit .ts/.tsx
# extensions if present (rare).
$jsxFiles = Get-ChildItem -Path $SrcDir -Recurse -Include '*.js','*.jsx'
foreach ($file in $jsxFiles) {
  $content = Get-Content $file.FullName -Raw -Encoding UTF8
  if ($content -match "from '.*\.(ts|tsx)'|from \".*\.(ts|tsx)\"") {
    $content = $content -replace "(from\s+'[^']+)\.(tsx|ts)(')", '$1.jsx$3'
    $content = $content -replace '(from\s+"[^"]+)\.(tsx|ts)(")', '$1.jsx$3'
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
    Write-Host "  Updated imports in: $($file.Name)"
  }
}

Write-Host "Import paths updated." -ForegroundColor Green

# ── Phase 3: Update root config files ────────────────────────────────────────

Write-Host "`n=== Phase 3: Updating configuration files ===" -ForegroundColor Cyan

# vite.config.ts → vite.config.js
$viteTsPath = Join-Path $Root "vite.config.ts"
$viteJsPath = Join-Path $Root "vite.config.js"
if (Test-Path $viteTsPath) {
  $viteContent = Get-Content $viteTsPath -Raw -Encoding UTF8
  Set-Content -Path $viteJsPath -Value $viteContent -Encoding UTF8 -NoNewline
  Remove-Item $viteTsPath -Force
  Write-Host "  ✓ vite.config.ts → vite.config.js"
}

# tailwind.config.js — already JS, no change needed
Write-Host "  ✓ tailwind.config.js — no change needed"

# vitest.config.ts → vitest.config.js
$vitestTsPath = Join-Path $Root "vitest.config.ts"
$vitestJsPath = Join-Path $Root "vitest.config.js"
if (Test-Path $vitestTsPath) {
  $vitestContent = Get-Content $vitestTsPath -Raw -Encoding UTF8
  # Strip TypeScript from vitest config
  $vitestContent = Strip-TypeScript $vitestContent
  Set-Content -Path $vitestJsPath -Value $vitestContent -Encoding UTF8 -NoNewline
  Remove-Item $vitestTsPath -Force
  Write-Host "  ✓ vitest.config.ts → vitest.config.js"
}

# postcss.config.js — already JS
Write-Host "  ✓ postcss.config.js — no change needed"

# ── Phase 4: Update package.json build script ─────────────────────────────────

Write-Host "`n=== Phase 4: Updating package.json ===" -ForegroundColor Cyan

$pkgPath = Join-Path $Root "package.json"
$pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json

# Remove tsc from build command — no TypeScript compiler needed
$pkg.scripts.build = "vite build"
# Remove tsc from devDependencies if present
if ($pkg.devDependencies.PSObject.Properties["typescript"]) {
  $pkg.devDependencies.PSObject.Properties.Remove("typescript")
}
# Remove @types/react and @types/react-dom
if ($pkg.devDependencies.PSObject.Properties["@types/react"]) {
  $pkg.devDependencies.PSObject.Properties.Remove("@types/react")
}
if ($pkg.devDependencies.PSObject.Properties["@types/react-dom"]) {
  $pkg.devDependencies.PSObject.Properties.Remove("@types/react-dom")
}

# Add @vitejs/plugin-react for JSX transform (needed without tsconfig)
if (-not $pkg.devDependencies.PSObject.Properties["@vitejs/plugin-react"]) {
  $pkg.devDependencies | Add-Member -NotePropertyName "@vitejs/plugin-react" -NotePropertyValue "^4.3.4"
}

$pkg | ConvertTo-Json -Depth 10 | Set-Content $pkgPath -Encoding UTF8
Write-Host "  ✓ package.json updated"

# ── Phase 5: Update vite.config.js to use @vitejs/plugin-react ───────────────

Write-Host "`n=== Phase 5: Updating vite.config.js for JSX ===" -ForegroundColor Cyan

$viteConfigContent = @'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/agile/',
  plugins: [react()],
})
'@
Set-Content -Path $viteJsPath -Value $viteConfigContent -Encoding UTF8 -NoNewline
Write-Host "  ✓ vite.config.js updated with react plugin"

# ── Phase 6: Update index.html entry point ────────────────────────────────────

Write-Host "`n=== Phase 6: Updating index.html entry point ===" -ForegroundColor Cyan

$indexHtmlPath = Join-Path $Root "index.html"
if (Test-Path $indexHtmlPath) {
  $html = Get-Content $indexHtmlPath -Raw -Encoding UTF8
  $html = $html -replace '/src/main\.tsx', '/src/main.jsx'
  $html = $html -replace '/src/main\.ts',  '/src/main.js'
  Set-Content -Path $indexHtmlPath -Value $html -Encoding UTF8 -NoNewline
  Write-Host "  ✓ index.html updated to reference main.jsx"
}

# ── Phase 7: Remove tsconfig.json ─────────────────────────────────────────────

Write-Host "`n=== Phase 7: Removing TypeScript config ===" -ForegroundColor Cyan

$tsconfigPath = Join-Path $Root "tsconfig.json"
if (Test-Path $tsconfigPath) {
  Remove-Item $tsconfigPath -Force
  Write-Host "  ✓ tsconfig.json removed"
}

# ── Summary ───────────────────────────────────────────────────────────────────

Write-Host "`n=== Conversion complete ===" -ForegroundColor Green
Write-Host "Files converted: $converted"
Write-Host "Next step: run 'npm install' then 'npm run build'"
