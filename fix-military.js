const fs = require('fs');
const path = 'client/src/components/profile/ProfileTabs.tsx';
let s = fs.readFileSync(path, 'utf8');

// Match the Military block: from the opening span with "flex items-center gap-2" through the closing </span> before </div>
const re = /(<span className="font-medium text-gray-500[^>]+>Military:<\/span>\s+)<span className="text-gray-900[^"]*"[^>]*>\s+\{[\s\S]*?\(user\.isVeteran[^)]+\) && \(\s+<span[^>]+>\s+<span[^>]+>[^<]*<\/span>\s+Veteran\s+<\/span>\s+\)\s+\}\s+\{[\s\S]*?\(user\.isActiveDuty[^)]+\) && \(\s+<span[^>]+>\s+<span[^>]+>[^<]*<\/span>\s+Active Duty\s+<\/span>\s+\)\s+\}\s+<\/span>/;

const replacement = '$1<span className="text-gray-900 dark:text-gray-100 break-words min-w-0 text-sm">\n                        {[\n                          (user.isVeteran || (user as any).is_veteran) && \'Veteran\',\n                          (user.isActiveDuty || (user as any).is_active_duty) && \'Active Duty\',\n                        ].filter(Boolean).join(\' · \')}\n                      </span>';

if (re.test(s)) {
  s = s.replace(re, replacement);
  fs.writeFileSync(path, s);
  console.log('Replaced Military block');
} else {
  console.log('Pattern not found - checking file content');
  const idx = s.indexOf('Military Status for non-business');
  if (idx >= 0) console.log('Found Military at', idx, 'snippet:', s.substring(idx, idx + 400));
}
