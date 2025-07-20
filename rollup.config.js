import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import css from 'rollup-plugin-css-only';

const production = !process.env.ROLLUP_WATCH;

// 🔍 **Automatically detect all components inside `src/injectedComponents/`**
const injectedComponentsPath = 'src/injectedComponents';
const injectedComponents = fs.readdirSync(injectedComponentsPath)
  .filter((dir) => fs.statSync(path.join(injectedComponentsPath, dir)).isDirectory()); // Get only directories

// ✅ Log detected components
console.log("📌 Detected Injected Components:", injectedComponents);

// 🎯 **Generate Rollup configs for each component**
const injectedComponentConfigs = injectedComponents.map((componentName) => {
  console.log(`📦 Generating Rollup config for: ${componentName}`);

  return {
    input: `src/injectedComponents/${componentName}/${componentName}.svelte`,
    output: {
      format: 'iife',
      name: `${componentName}Component`,
      file: `public/build/injected/${componentName.toLowerCase()}-component.js`
    },
    plugins: [
      svelte({
        compilerOptions: { dev: !production, customElement: false }
      }),
      css({ output: `css/${componentName.toLowerCase()}-style.css` }),
      resolve({ browser: true, dedupe: ['svelte'] }),
      commonjs(),
      production && terser()
    ]
  };
});

export default [
  // 🌟 Main App Configuration
  {
    input: 'src/main.js',
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'app',
      file: 'public/build/bundle.js'
    },
    plugins: [
      svelte({ compilerOptions: { dev: !production } }),
      css({ output: 'bundle.css' }),
      resolve({ browser: true, dedupe: ['svelte'], exportConditions: ['svelte'] }),
      commonjs(),
      !production && serve(),
      !production && livereload('public'),
      production && terser()
    ],
    watch: { clearScreen: false }
  },
  
  // 📌 **Auto-generated component configurations**
  ...injectedComponentConfigs
];

// 🛠 **Serve function for development**
function serve() {
  let server;
  function toExit() { if (server) server.kill(0); }
  return {
    writeBundle() {
      if (server) return;
      server = spawn('npm', ['run', 'start', '--', '--dev'], { stdio: ['ignore', 'inherit', 'inherit'], shell: true });
      process.on('SIGTERM', toExit);
      process.on('exit', toExit);
    }
  };
}
