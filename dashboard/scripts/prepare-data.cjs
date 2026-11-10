const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DEST = path.join(ROOT, 'public', 'data');
const REPO = 'https://raw.githubusercontent.com/Sabz-10/EpiAlert/main';
const sources = [
  ['outputs/idsp_2021_2025_cleaned.csv', 'cleaned.csv'],
  ['outputs/model_scores_2025.csv', 'model_scores_2025.csv'],
  ['outputs/historical_trends.csv', 'historical_trends.csv'],
  ['outputs/metrics.json', 'metrics.json'],
  ['outputs/ml_training_dataset.csv', 'ml_training_dataset.csv'],
];
fs.mkdirSync(DEST, { recursive: true });

async function main() {
  console.log('\nEpiAlert · Preparing research data');
  let failures = [];
  for (const [src, name] of sources) {
    const to = path.join(DEST, name);
    const local = [
      path.join(ROOT, '..', src),
      path.join(ROOT, '..', '..', src),
      path.join(ROOT, '..', 'EpiAlert', src),
    ].find(p => fs.existsSync(p) && fs.statSync(p).size > 20);
    if (local) {
      fs.copyFileSync(local, to);
      console.log(`  ✓ ${name} (local EpiAlert repository)`);
      continue;
    }
    if (fs.existsSync(to) && fs.statSync(to).size > 20) {
      console.log(`  ✓ ${name} (cached)`);
      continue;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 16000);
      let response;
      try { response = await fetch(`${REPO}/${src}`, {signal: controller.signal}); }
      finally { clearTimeout(timeout); }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const content = await response.text();
      if (!content.startsWith(name.endsWith('.json') ? '{' : name === 'cleaned.csv' ? 'record_id,' : name === 'historical_trends.csv' ? 'district,' : 'district,')) throw new Error('Unexpected file format');
      fs.writeFileSync(to, content, 'utf8');
      console.log(`  ✓ ${name} (fetched from your GitHub)`);
    } catch (e) {
      failures.push({src,name,message:e.message});
    }
  }
  // Optional map layer: a public GeoJSON with 37 district polygons.
  // Mayiladuthurai is not present in this source and is clearly disclosed in the UI.
  const geoDest=path.join(DEST, 'tn_districts.geojson');
  if (!fs.existsSync(geoDest)) {
    try {
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(), 16000);
      let response;
      try {
        response=await fetch('https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/states/tamil-nadu.geojson', {signal:controller.signal});
      } finally { clearTimeout(timeout); }
      if(!response.ok) throw Error(`HTTP ${response.status}`);
      const geo=await response.json();
      if(!Array.isArray(geo.features) || geo.features.length<30) throw Error('Unexpected map features');
      fs.writeFileSync(geoDest,JSON.stringify(geo),'utf8');
      console.log(`  ✓ tn_districts.geojson (${geo.features.length} district polygons)`);
    } catch(e) {
      console.warn(`  ! District geometry unavailable (${e.message}); other pages still work`);
    }
  } else {
    console.log('  ✓ tn_districts.geojson (cached)');
  }
  if (failures.length) {
    console.error('\nCannot find these required files:');
    failures.forEach(f => console.error(`  ${f.src} · ${f.message}`));
    console.error('\nTo work entirely offline: copy the files above from your EpiAlert project into dashboard/public/data/');
    console.error('Rename idsp_2021_2025_cleaned.csv to cleaned.csv in that folder.');
    process.exit(1);
  }
  console.log('✓ Real CSV and JSON data loaded. No retraining performed.\n');
}
main().catch(e => {console.error(e); process.exit(1);});
