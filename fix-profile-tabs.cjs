const fs = require('fs');
const path = 'client/src/components/profile/ProfileTabs.tsx';
let s = fs.readFileSync(path, 'utf8');

const nl = s.includes('\r\n') ? '\r\n' : '\n';
const startMarker = '</span>' + nl + '                    </div>' + nl + '                  )}';
const endMarker = nl + '            {/* Secret Activities Section - Separate Card */}';

const startIdx = s.indexOf(startMarker);
if (startIdx === -1) {
  console.log('Start marker not found');
  process.exit(1);
}
const afterClose = startIdx + startMarker.length;
const secretIdx = s.indexOf(endMarker);
if (secretIdx === -1) {
  console.log('End marker not found');
  process.exit(1);
}

const between = s.slice(afterClose, secretIdx);
if (!between.includes('Veteran') || !between.includes('CardContent')) {
  console.log('Unexpected content between markers', between.slice(0, 200));
  process.exit(1);
}

const before = s.slice(0, afterClose);
const after = s.slice(secretIdx);
const fixed = before + nl + nl + '            ' + after;

fs.writeFileSync(path, fixed);
console.log('Fixed. Removed', between.length, 'chars of duplicate/corrupt JSX.');
