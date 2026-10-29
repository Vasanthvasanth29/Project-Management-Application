/**
 * FlowExec: TypeScript → JavaScript Conversion Script
 * Uses the TypeScript compiler API for accurate syntax stripping.
 * Run with: node convert.mjs
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname, basename, dirname, relative } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ── Load TypeScript compiler ─────────────────────────────────────────────────
let ts;
try {
    ts = require('./node_modules/typescript/lib/typescript.js');
    console.log(`✓ TypeScript ${ts.version} loaded`);
} catch (e) {
    console.error('✗ TypeScript not found in node_modules. Run npm install first.');
    process.exit(1);
}

const SRC_DIR = join(__dirname, 'src');

// ── Collect all .ts and .tsx files ───────────────────────────────────────────
function walkDir(dir, results = []) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
            walkDir(full, results);
        } else if (/\.(ts|tsx)$/.test(entry)) {
            results.push(full);
        }
    }
    return results;
}

const files = walkDir(SRC_DIR);
console.log(`\nFound ${files.length} TypeScript files to convert.\n`);

// ── TypeScript transpileModule options ───────────────────────────────────────
// We use isolatedModules + jsx=preserve so the output is clean JS/JSX.
// The compiler removes all type annotations, interfaces, type aliases, etc.

const baseCompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.Preserve,      // keep JSX as-is (output .jsx)
    removeComments: false,         // preserve comments
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    verbatimModuleSyntax: false,   // needed: strips "import type" properly
    isolatedModules: true,
};

// ── Convert each file ────────────────────────────────────────────────────────
let converted = 0;
let errors = [];

for (const filePath of files) {
    const ext = extname(filePath);              // '.ts' or '.tsx'
    const isTsx = ext === '.tsx';
    const newExt = isTsx ? '.jsx' : '.js';
    const newPath = filePath.slice(0, -ext.length) + newExt;

    try {
        const source = readFileSync(filePath, 'utf8');

        // transpileModule handles one file at a time; it type-erases perfectly.
        const result = ts.transpileModule(source, {
            compilerOptions: {
                ...baseCompilerOptions,
                jsx: isTsx ? ts.JsxEmit.Preserve : ts.JsxEmit.None,
            },
            fileName: filePath,
            reportDiagnostics: false,
        });

        let output = result.outputText;

        // Remove the trailing sourceMappingURL comment if present
        output = output.replace(/\n?\/\/# sourceMappingURL=.*$/m, '');

        // Write the JS/JSX file
        writeFileSync(newPath, output, 'utf8');

        // Remove the original .ts/.tsx file
        unlinkSync(filePath);

        const relPath = relative(SRC_DIR, filePath);
        const relNew = relative(SRC_DIR, newPath);
        console.log(`  ✓ ${relPath} → ${relNew}`);
        converted++;
    } catch (err) {
        const relPath = relative(SRC_DIR, filePath);
        console.error(`  ✗ FAILED: ${relPath}: ${err.message}`);
        errors.push({ file: relPath, error: err.message });
    }
}

console.log(`\n✓ Converted ${converted} files.`);
if (errors.length) {
    console.warn(`\n⚠ ${errors.length} file(s) had errors:`);
    errors.forEach(e => console.warn(`  - ${e.file}: ${e.error}`));
}

// ── Update root config files ─────────────────────────────────────────────────
console.log('\n=== Updating configuration files ===');

// 1. Update index.html to reference main.jsx
const indexHtmlPath = join(__dirname, 'index.html');
if (existsSync(indexHtmlPath)) {
    let html = readFileSync(indexHtmlPath, 'utf8');
    html = html.replace('/src/main.tsx', '/src/main.jsx');
    html = html.replace('/src/main.ts', '/src/main.js');
    writeFileSync(indexHtmlPath, html, 'utf8');
    console.log('  ✓ index.html → references main.jsx');
}

// 2. Create vite.config.js (with react plugin for JSX support without tsconfig)
const viteConfigJs = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/agile/',
  plugins: [react()],
})
`;
const viteTsPath = join(__dirname, 'vite.config.ts');
const viteJsPath = join(__dirname, 'vite.config.js');
if (existsSync(viteTsPath)) {
    writeFileSync(viteJsPath, viteConfigJs, 'utf8');
    unlinkSync(viteTsPath);
    console.log('  ✓ vite.config.ts → vite.config.js (with @vitejs/plugin-react)');
}

// 3. vitest.config.ts → vitest.config.js
const vitestTsPath = join(__dirname, 'vitest.config.ts');
const vitestJsPath = join(__dirname, 'vitest.config.js');
if (existsSync(vitestTsPath)) {
    const vitestSrc = readFileSync(vitestTsPath, 'utf8');
    const vitestResult = ts.transpileModule(vitestSrc, {
        compilerOptions: { ...baseCompilerOptions, jsx: ts.JsxEmit.None },
        fileName: vitestTsPath,
    });
    let vitestOut = vitestResult.outputText.replace(/\n?\/\/# sourceMappingURL=.*$/m, '');
    writeFileSync(vitestJsPath, vitestOut, 'utf8');
    unlinkSync(vitestTsPath);
    console.log('  ✓ vitest.config.ts → vitest.config.js');
}

// 4. Update package.json: remove tsc from build, add @vitejs/plugin-react
const pkgPath = join(__dirname, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

// Remove "tsc &&" from build script
pkg.scripts.build = (pkg.scripts.build || '').replace(/tsc\s*&&\s*/, '').trim();
if (!pkg.scripts.build) pkg.scripts.build = 'vite build';

// Add @vitejs/plugin-react to devDependencies
pkg.devDependencies = pkg.devDependencies || {};
if (!pkg.devDependencies['@vitejs/plugin-react']) {
    pkg.devDependencies['@vitejs/plugin-react'] = '^4.3.4';
}

// Remove TypeScript-only devDeps (optional – we keep ts for the conversion script itself)
// We'll keep typescript in devDeps since we used it for conversion
// delete pkg.devDependencies['typescript'];
// delete pkg.devDependencies['@types/react'];
// delete pkg.devDependencies['@types/react-dom'];

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('  ✓ package.json updated (build: vite build, added @vitejs/plugin-react)');

// 5. Remove tsconfig.json (no longer needed by Vite with @vitejs/plugin-react)
const tsconfigPath = join(__dirname, 'tsconfig.json');
if (existsSync(tsconfigPath)) {
    unlinkSync(tsconfigPath);
    console.log('  ✓ tsconfig.json removed');
}

console.log('\n=== Conversion complete! ===');
console.log('Next steps:');
console.log('  1. npm install   (installs @vitejs/plugin-react)');
console.log('  2. npm run build (should succeed with exit code 0)');
