import Papa from 'papaparse';
const BASE = import.meta.env.BASE_URL || '/';
async function readCsv(file) {
  const res = await fetch(`${BASE}data/${file}`);
  if (!res.ok) throw Error(`Could not load ${file} (${res.status})`);
  const csv = await res.text();
  const result = Papa.parse(csv, {header:true,skipEmptyLines:true,dynamicTyping:true});
  if (result.errors?.length) console.warn(`CSV parse warnings for ${file}`,result.errors.slice(0,2));
  return result.data.filter(row => row.district || row.record_id);
}
export async function loadData() {
  const [cleaned, trends, scores, result] = await Promise.all([
    readCsv('cleaned.csv'),
    readCsv('historical_trends.csv'),
    readCsv('model_scores_2025.csv'),
    fetch(`${BASE}data/metrics.json`).then(async r => {if(!r.ok) throw Error('metrics.json missing'); return r.json();})
  ]);
  return {cleaned,trends,scores,metrics:result};
}
export const ADD = 'Acute Diarrheal Disease';
export const fNum = n => new Intl.NumberFormat('en-IN').format(n || 0);
export const pct = n => `${(Number(n||0)*100).toFixed(2)}%`;
export function csvDownload(filename, rows) {
  if (!rows?.length) return false;
  const blob = new Blob([Papa.unparse(rows)], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
  return true;
}
