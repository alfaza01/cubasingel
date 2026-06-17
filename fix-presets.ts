import fs from 'fs';

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Replace all instances of onClick={() => { setNominal( ... with a forced mode switch
// The easiest is just finding all setNominal( occurrences and inserting setInputMode
// But wait, what if they toggle the mode manually? We want them to type in it. 

// Actually, let's fix the duplicates first, around line 471 and 523
const fileLines = content.split('\n');

for (let i = 0; i < fileLines.length; i++) {
  // if line contains onClick={() => { near presets
  if (fileLines[i].includes('onClick={() => {')) {
    // Quick heuristic: If next few lines contain setNominal, inject setInputMode('NOMINAL_ADMIN');
    for (let j = i + 1; j < Math.min(i + 15, fileLines.length); j++) {
      if (fileLines[j].includes('setNominal(') && !fileLines[i+1].includes('setInputMode')) {
        fileLines.splice(i + 1, 0, "                              setInputMode('NOMINAL_ADMIN');");
        break;
      }
    }
  }
}

fs.writeFileSync('src/pages/Dashboard.tsx', fileLines.join('\n'));
console.log('Fixed presets to force NOMINAL_ADMIN mode');
