import React, {useEffect, useMemo, useState} from 'react';
import {MapPin, Info, RotateCcw, Layers3, Map as MapIcon} from 'lucide-react';

const MAP_FILE = `${import.meta.env.BASE_URL || '/'}data/tn_districts.geojson`;
const aliases = {
  'Nilgiris':'The Nilgiris', 'The Nilgiris':'The Nilgiris',
  'Kanyakumari':'Kanniyakumari','Thoothukkudi':'Thoothukudi',
  'Viluppuram':'Viluppuram','Tiruvallur':'Thiruvallur',
  'Kancheepuram':'Kancheepuram','Tiruchirappalli':'Tiruchirappalli',
  'Tirupathur':'Tirupathur','Tiruppur':'Tiruppur'
};
const normalizeName = name => aliases[name] || name;
const valueOf = r => Number(r) || 0;
function ringsOf(f){
  const geo=f.geometry;
  if(!geo) return [];
  if(geo.type === 'Polygon') return geo.coordinates;
  if(geo.type === 'MultiPolygon') return geo.coordinates.flat();
  return [];
}
function buildPaths(features){
  const all=features.flatMap(f=>ringsOf(f).flat());
  if(!all.length) return [];
  const lonMin=Math.min(...all.map(c=>c[0])),lonMax=Math.max(...all.map(c=>c[0]));
  const latMin=Math.min(...all.map(c=>c[1])),latMax=Math.max(...all.map(c=>c[1]));
  const w=470,h=590, xRange=lonMax-lonMin,yRange=latMax-latMin;
  const cos=Math.cos(11 * Math.PI / 180);
  const scale=Math.min(w/(xRange*cos),h/yRange);
  const cw=xRange*cos*scale,ch=yRange*scale;
  const x0=(580-cw)/2, y0=(650-ch)/2;
  const point=([lon,lat])=>[x0+(lon-lonMin)*cos*scale,y0+(latMax-lat)*scale];
  return features.map(f=>({
    name:normalizeName(f.properties?.district || f.properties?.name || f.properties?.dtname || ''),
    path:ringsOf(f).map(r=>r.map((c,i)=>{const [x,y]=point(c);return `${i?'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`;}).join(' ')+' Z').join(' ')
  }));
}
export default function DistrictMap({records,disease,year,selectedDistrict,onSelect}) {
  const [shapes,setShapes]=useState(null);
  const [error,setError]=useState('');
  const [hover,setHover]=useState('');
  useEffect(()=>{
    let alive=true;
    fetch(MAP_FILE).then(async r=>{
      if(!r.ok) throw new Error(`District map missing (HTTP ${r.status})`);
      const obj=await r.json();
      if(!Array.isArray(obj.features)) throw new Error('Invalid district boundary data');
      if(alive) setShapes(buildPaths(obj.features));
    }).catch(e=>{if(alive)setError(e.message)});
    return ()=>{alive=false};
  },[]);
  const reports=useMemo(()=>{
    const output={};
    records.filter(r=>(year==='All years'||String(r.year)===year)&&(disease==='All diseases'||r.disease===disease)).forEach(r=>{
      const name=normalizeName(r.district);
      output[name]=(output[name]||0)+1;
    });
    return output;
  },[records,disease,year]);
  const max=Math.max(1,...Object.values(reports));
  const chosen=hover || (selectedDistrict!=='All districts' ? selectedDistrict:'');
  const missing=useMemo(()=>{
    if(!shapes) return [];
    const found=new Set(shapes.map(s=>s.name));
    return [...new Set(records.map(r=>normalizeName(r.district)))].filter(n=>!found.has(n));
  },[shapes,records]);
  return <section className="panel map-panel">
    <div className="panel-heading"><div className="panel-heading-icon"><MapIcon size={26}/></div><div className="panel-heading-copy"><h2>Tamil Nadu District Map</h2><p>Interactive district boundaries · recorded outbreak reports, not disease risk</p></div><div className="panel-header-right"><span className="map-label">HISTORICAL ACTIVITY</span></div></div>
    <div className="map-content">
      <div className="map-stage">
        <div className="map-graticule" aria-hidden="true"/>
        {shapes ? <svg className="tn-district-svg" viewBox="0 0 580 650" role="img" aria-label="Map of Tamil Nadu district boundaries colored by recorded outbreaks">
          {shapes.map(s=>{
            const n=reports[s.name] || 0, selected=selectedDistrict===s.name;
            const alpha=n?0.25+0.7*Math.sqrt(n/max):0;
            const fill=n?`rgba(171,108,255,${alpha})`:'#26223b';
            return <path key={s.name} d={s.path} fill={selected?'#e1b6ff':fill}
              stroke={selected?'#ffffff':'#9370cf'} strokeWidth={selected?2.7:.82}
              className="map-district-path" role="button" tabIndex={0}
              onMouseEnter={()=>setHover(s.name)} onMouseLeave={()=>setHover('')}
              onFocus={()=>setHover(s.name)} onBlur={()=>setHover('')}
              onClick={()=>onSelect(selected?'All districts':s.name)}
              onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(selected?'All districts':s.name);}}}>
              <title>{s.name}: {n} recorded outbreak report{n===1?'':'s'}; select district</title>
            </path>;
          })}
        </svg> : <div className="map-load-state"><Layers3 size={24}/><span>{error?'District outlines could not load':'Loading district boundaries…'}</span>{error&&<small>Check your internet connection and rerun npm.cmd run sync:data</small>}</div>}
        <div className="map-compass" aria-hidden="true">N<span>↑</span></div>
      </div>
      <div className="map-aside">
        <span className="home-section-eyebrow">DISTRICT SURVEILLANCE</span>
        <h3>{chosen||'Select a district'}</h3>
        <p>{chosen?'Recorded outbreak activity for the selected disease and year.':'Hover over or click a district to explore its historical records.'}</p>
        {chosen&&<div className="map-current"><strong>{reports[normalizeName(chosen)]||0}</strong><span>recorded outbreak events</span></div>}
        <div className="map-key-title">Recorded reports</div>
        <div className="map-key"><span>0</span><div className="map-key-gradient"/><span>Higher</span></div>
        <div className="map-side-note"><Info size={16}/><span>Darker and lighter areas indicate recorded outbreak-report counts, not outbreak probability. No recorded report does not mean zero cases.</span></div>
        {selectedDistrict!=='All districts'&&<button className="btn-small" onClick={()=>onSelect('All districts')}><RotateCcw size={14}/> Clear selected district</button>}
      </div>
    </div>
    {missing.length>0&&<p className="map-source-warning"><Info size={13}/> Boundary source omits {missing.join(', ')}; these districts remain accessible using the filters and district list.</p>}
    <p className="map-source-caption">Boundary geometry: udit-001/india-maps-data (publicly curated, 37 districts). Outbreak counts: IDSP/NCDC EpiAlert dataset. Boundaries are for visualization only.</p>
  </section>;
}
