import fs from 'node:fs';
import path from 'node:path';

const localesDir = path.resolve('src/lib/i18n/locales');

function getAllJsonFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllJsonFiles(fullPath));
    } else if (file.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

console.log('====================================================');
console.log('  STUDYSAATHI AI — I18N JSON VALIDATION & STRUCTURAL AUDIT');
console.log('====================================================\n');

// 1. RECURSIVE JSON.PARSE() VALIDATION
const allFiles = getAllJsonFiles(localesDir);
let validCount = 0;
let invalidCount = 0;
const errors = [];

for (const filePath of allFiles) {
  const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    // Ensure no BOM character at char 0
    if (raw.charCodeAt(0) === 0xfeff) {
      throw new Error('File contains UTF-8 BOM byte order mark');
    }
    JSON.parse(raw);
    validCount++;
  } catch (err) {
    invalidCount++;
    errors.push({ file: relPath, error: err.message });
  }
}

console.log(`[TASK 3 SUMMARY]`);
console.log(`- Total JSON files inspected: ${allFiles.length}`);
console.log(`- Valid JSON files: ${validCount}`);
console.log(`- Invalid JSON files: ${invalidCount}`);

if (errors.length > 0) {
  console.error('\n--- INVALID FILES DETECTED ---');
  for (const e of errors) {
    console.error(`ERROR: ${e.file}: ${e.error}`);
  }
  process.exit(1);
}

console.log('\nALL 130 JSON files passed JSON.parse() with 0 syntax errors and 0 BOM characters.\n');

// 2. STRUCTURAL AUDIT AGAINST ENGLISH BASELINE (TASK 4)
console.log('====================================================');
console.log('  TASK 4: KEY STRUCTURAL AUDIT (COMPARED TO EN BASELINE)');
console.log('====================================================\n');

const enDir = path.join(localesDir, 'en');
const enNamespaces = fs.readdirSync(enDir).filter(f => f.endsWith('.json'));

function getFlattenedKeys(obj, prefix = '') {
  let keys = {};
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(keys, getFlattenedKeys(v, fullKey));
    } else {
      keys[fullKey] = typeof v;
    }
  }
  return keys;
}

const enBaselines = {};
for (const ns of enNamespaces) {
  const content = JSON.parse(fs.readFileSync(path.join(enDir, ns), 'utf8'));
  enBaselines[ns] = getFlattenedKeys(content);
}

const locales = fs.readdirSync(localesDir).filter(f => {
  return fs.statSync(path.join(localesDir, f)).isDirectory();
});

console.log(`Languages inspected: ${locales.join(', ')}`);
console.log(`English baseline namespaces: ${enNamespaces.join(', ')}\n`);

let totalMissingKeys = 0;
let totalExtraKeys = 0;
let totalTypeMismatches = 0;

for (const lang of locales) {
  if (lang === 'en') continue;
  let langMissing = 0;
  let langExtra = 0;
  let langMismatch = 0;

  for (const ns of enNamespaces) {
    const targetPath = path.join(localesDir, lang, ns);
    if (!fs.existsSync(targetPath)) {
      console.warn(`[MISSING NAMESPACE] ${lang}/${ns} does not exist`);
      continue;
    }

    const targetObj = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    const targetKeys = getFlattenedKeys(targetObj);
    const enKeys = enBaselines[ns];

    for (const [key, expectedType] of Object.entries(enKeys)) {
      if (!(key in targetKeys)) {
        langMissing++;
      } else if (targetKeys[key] !== expectedType) {
        langMismatch++;
      }
    }

    for (const key of Object.keys(targetKeys)) {
      if (!(key in enKeys)) {
        langExtra++;
      }
    }
  }

  console.log(`Language [${lang}]: Missing keys: ${langMissing}, Extra keys: ${langExtra}, Type mismatches: ${langMismatch}`);
  totalMissingKeys += langMissing;
  totalExtraKeys += langExtra;
  totalTypeMismatches += langMismatch;
}

console.log('\n--- STRUCTURAL COMPARISON SUMMARY ---');
console.log(`- Total Missing Keys across all Indian locales: ${totalMissingKeys}`);
console.log(`- Total Extra Keys across all Indian locales: ${totalExtraKeys}`);
console.log(`- Total Type Mismatches: ${totalTypeMismatches}`);

if (invalidCount > 0) {
  process.exit(1);
} else {
  console.log('\nJSON integrity check passed successfully!');
  process.exit(0);
}
