const fs = require('fs');
const s = fs.readFileSync('client/src/pages/profile-complete.tsx', 'utf8');
const lines = s.split(/\r?\n/);
let depth = 0;
let inReturn = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/^\s*return\s*\(/.test(line)) inReturn = true;
  if (!inReturn) continue;
  const opens = (line.match(/\{/g) || []).length;
  const closes = (line.match(/\}/g) || []).length;
  depth += opens - closes;
  if (i + 1 >= 10120 && i + 1 <= 10130) console.log((i+1) + ' depth=' + depth + ' | ' + line.trim().slice(0, 60));
}
console.log('Depth at end:', depth);
