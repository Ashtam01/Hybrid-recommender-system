import * as LucideIcons from 'lucide-react';

const iconsToTest = [
  'Play', 'Pause', 'Disc3', 'Zap', 'Activity', 'Waves',
  'Search', 'Loader2', 'CheckCircle', 'CircleDashed'
];

console.log("TESTING LUCIDE ICONS...");
for (const icon of iconsToTest) {
  if (!(icon in LucideIcons)) {
    console.error(`FATAL ERROR: Icon "${icon}" DOES NOT EXIST in lucide-react!`);
  } else {
    console.log(`SUCCESS: Icon "${icon}" exists.`);
  }
}
