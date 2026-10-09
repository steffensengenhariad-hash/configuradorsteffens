import { readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = dirname(fileURLToPath(import.meta.url));
for (const name of ['server.mjs','storage.mjs','public/app.js','public/model.js','public/catalog.js','public/library.js']) {
  const result = spawnSync(process.execPath,['--check',join(root,name)],{encoding:'utf8'});
  if (result.status !== 0) { console.error(result.stderr); process.exit(1); }
}
for (const name of ['index.html','app.js','model.js','catalog.js','library.js','styles.css','favicon.svg']) await access(join(root,'public',name));
const html = await readFile(join(root,'public/index.html'),'utf8');
if (!html.includes('Configurador de Dimensões Steffens Móveis') || !html.includes('id="login-dialog"')) throw new Error('Interface incompleta.');
console.log('Projeto Steffens validado. Sem dependências externas para instalar.');
