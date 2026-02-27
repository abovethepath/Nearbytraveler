const fs = require('fs');
const path = 'client/src/components/profile/ProfileTabs.tsx';
let s = fs.readFileSync(path, 'utf8');

// Corrupt block: from ")}" + garbage through ")}" before "Secret Activities Section"
// Match from ")}" followed by non-ASCII/garbage and duplicate Veteran/Active Duty span block
const startMarker = '</span>\r\n                    </div>\r\n                  )}';
const endMarker = '\r\n            {/* Secret Activities Section - Separate Card */}';

const startIdx = s.indexOf(startMarker);
if (startIdx === -1) {
  console.log('Start marker not found');
  process.exit(1);
}
const afterClose = startIdx + startMarker.length;
// Find where the corrupt content ends (next ")}" then newlines then "            {/* Secret Activities")
const secretIdx = s.indexOf(endMarker);
if (secretIdx === -1) {
  console.log('End marker not found');
  process.exit(1);
}

// Everything between afterClose and secretIdx should be removed (the corrupt duplicate)
// We want to keep: startMarker + "\n\n" + endMarker
const before = s.slice(0, afterClose);
const after = s.slice(secretIdx);
const fixed = before + '\r\n\r\n            ' + after;

// Verify we're not removing the real CardContent/Card - check structure
const between = s.slice(afterClose, secretIdx);
if (!between.includes('Veteran') || !between.includes('CardContent')) {
  console.log('Unexpected content between markers', between.slice(0, 200));
  process.exit(1);
}

fs.writeFileSync(path, fixed);
console.log('Fixed. Removed', between.length, 'chars of duplicate/corrupt JSX.');
