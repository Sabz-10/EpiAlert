import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowDownToLine, ArrowRight, ArrowUpRight, BarChart3, Home,
  Bell, CalendarDays, Check, ChevronDown, CircleHelp, Database, Download,
  FileBarChart, FileText, Filter, Flag, Info, Layers3, LayoutGrid,
  Lightbulb, MapPin, Menu, Search, ShieldCheck, Sparkles, Target,
  TrendingUp, X, AlertCircle, RotateCcw, Microscope, Radio, HeartPulse
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis,
  Tooltip, BarChart, Bar, Cell
} from 'recharts';
import { ADD, csvDownload, fNum, loadData, pct } from './data';
import DistrictMap from './DistrictMap';

const NAV = [
  {id:'home', label:'Home', icon:Home},
  {id:'dashboard', label:'Dashboard', icon:LayoutGrid},
  {id:'trends', label:'Trends', icon:TrendingUp},
  {id:'forecasts', label:'Forecasts', icon:Activity},
  {id:'districts', label:'Districts', icon:MapPin},
  {id:'reports', label:'Reports', icon:FileBarChart},
  {id:'insights', label:'Insights', icon:Lightbulb},
  {id:'about', label:'About & Method', icon:CircleHelp}
];
const keyDiseases = [ADD, 'Mumps', 'Chickenpox'];
const spectrum = ['#ba96ff','#8d54f2','#6240b9','#3b2869'];
const accentColors = ['#aa72fa','#7b43e7','#d2aaff','#7256ab'];
const titleDisease = s => s === ADD ? 'Acute Diarrheal Disease (ADD)' : s;
const digits = n => Number.isFinite(n) ? fNum(n) : '—';
const num = n => Number(n) || 0;

function Badge({children, kind=''}) { return <span className={`badge badge-${kind}`}>{children}</span>; }
function Logo() {
  return (
    <div className="logo">
      <div className="logo-shield">
        <ShieldCheck size={26} strokeWidth={1.85} />
      </div>
      <b>EpiAlert</b>
    </div>
  );
}
function Select({value,onChange,items,label,className=''}) {
  return <label className={`select-box ${className}`}><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={e=>onChange(e.target.value)}>{items.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}</select><ChevronDown size={15}/></label>;
}
function InfoButton({onClick, label}) {return <button type="button" className="info-button" aria-label={label} title={label} onClick={onClick}><Info size={15}/></button>;}
function Panel({title,subtitle,icon:Icon,children,headerRight,className=''}) {
  return <section className={`panel ${className}`}><div className="panel-heading"><div className="panel-heading-icon"><Icon size={25} strokeWidth={2.2}/></div><div className="panel-heading-copy"><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{headerRight && <div className="panel-header-right">{headerRight}</div>}</div>{children}</section>;
}
function Kpi({icon:Icon,title,value,note,trail}) {
  return <article className="panel kpi"><div className="kpi-heading"><Icon size={29} strokeWidth={2.1}/><h2>{title}</h2></div><div className="kpi-content"><strong>{value}</strong>{trail && <Badge kind="purple">{trail}</Badge>}</div><p>{note}</p></article>;
}
function TinyChartTooltip({active,payload,label,unit='events'}) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><b>{label}</b><span>{fNum(num(payload[0]?.value))} {unit}</span></div>;
}
function WeeklyChart({rows,mode,diseaseLabel="All reported diseases"}) {
  const isCases=mode==='Reported cases';
  const chart = useMemo(()=>Array.from({length:52},(_,i)=>({week:`W${i+1}`,value:rows.filter(r=>num(r.week)===i+1).reduce((a,r)=>a+(isCases?num(r.cases):1),0)})),[rows,isCases]);
  return <div className="trend-chart"><div className="chart-disease-label"><Microscope size={13}/> Disease: <strong>{diseaseLabel}</strong></div><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart} margin={{left:-15,right:5,top:15,bottom:3}}>
    <defs><linearGradient id="trendPurple" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a36aff" stopOpacity={0.64}/><stop offset="90%" stopColor="#6733d9" stopOpacity={0.08}/></linearGradient></defs>
    <CartesianGrid stroke="#47415d" strokeOpacity={.48} strokeDasharray="2 3" vertical={false}/>
    <XAxis dataKey="week" tickLine={false} axisLine={{stroke:'#686075'}} tick={{fontSize:10,fill:'#aaa7c4'}} interval={6} dy={8}/>
    <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{fontSize:10,fill:'#aaa7c4'}} width={39}/>
    <Tooltip content={<TinyChartTooltip unit={isCases?'reported cases':'outbreak events'}/>} cursor={{stroke:'#bba1ff',strokeDasharray:'3 5'}}/>
    <Area type="monotone" dataKey="value" stroke="#b78cff" strokeWidth={2.5} fill="url(#trendPurple)" activeDot={{r:5,fill:'#d6baff',stroke:'#5b3596',strokeWidth:2}} dot={false}/>
  </AreaChart></ResponsiveContainer><div className="axis-label">Week of year · {mode.toLowerCase()}</div></div>;
}
function HeatMap({rows,districtFilter,selectedYear,onPick}) {
  const yearRows=rows.filter(r=>selectedYear==='All years'||num(r.year)===num(selectedYear));
  const counts = new Map();
  yearRows.forEach(r=>{const k=`${r.district}|${r.disease}`;counts.set(k,(counts.get(k)||0)+1);});
  const top = [...new Set(yearRows.map(r=>r.district))].map(d=>({district:d,total:keyDiseases.reduce((sum,di)=>sum+(counts.get(`${d}|${di}`)||0),0)})).sort((a,b)=>b.total-a.total||a.district.localeCompare(b.district)).map(r=>r.district);
  const districts = districtFilter!=='All districts' ? [districtFilter] : top.slice(0,8);
  const max = Math.max(1,...districts.flatMap(d=>keyDiseases.map(di=>counts.get(`${d}|${di}`)||0)));
  return <div className="heatmap-body"><div className="heatmap-table"><div className="heatmap-head"><span>District</span><span>ADD</span><span>Mumps</span><span>Chickenpox</span></div>
  {districts.map(d=><div className="heatmap-row" key={d}><span title={d}>{d}</span>{keyDiseases.map(di=>{const n=counts.get(`${d}|${di}`)||0;return <button key={di} onClick={()=>onPick(d,di)} title={`${d} · ${titleDisease(di)}: ${n} recorded events`} aria-label={`${d}, ${titleDisease(di)}, ${n} recorded events`} style={{background:n===0?'#29243e':`rgba(164, 102, 255, ${0.24+0.74*Math.sqrt(n/max)})`}}><span>{n>0?n:''}</span></button>;})}</div>)}
  {!districts.length && <p className="muted">No district reports for this period.</p>}</div><div className="heatmap-legend"><span>Fewer reports</span><div className="legend-gradient"/><span>More reports</span></div><div className="heatmap-note"><TrendingUp size={18}/><span>Counts of recorded outbreaks, not clinical risk probabilities. Select a cell to explore.</span></div></div>;
}
function Snapshot({metrics,onInfo}) {
  const stats=metrics?.performance||{};
  const v=[['Correct flags',num(stats.true_positives),'#78dd70'],['Missed reports',num(stats.false_negatives),'#ff666b'],['Other flags',num(stats.false_positives),'#bd8eff']];
  const largest=Math.max(1,...v.map(x=>x[1]));
  return <Panel title="ML Alert Snapshot" subtitle="2025 held-out evaluation · ADD only" icon={Activity} className="snapshot-card" headerRight={<InfoButton onClick={onInfo} label="View model limitations"/>}>
  <AccuracyStrip metrics={metrics} compact/>
  <div className="snapshot-hero"><div><strong>{num(stats.true_positives)}</strong><span>Correct flags</span></div><div className="snapshot-divider"/><div><strong>{num(stats.false_negatives)}</strong><span>Missed reports</span></div></div>
  <div className="snapshot-bars">{v.map(([name,value,color])=><div className="snapshot-bar-row" key={name}><div><span>{name}</span><b>{value}</b></div><div className="snapshot-track"><span style={{width:`${Math.max(2,value/largest*100)}%`,background:color}}/></div></div>)}</div>
  <div className="snapshot-foot"><Info size={16}/><span>Retrospective rankings, not live disease alerts.</span></div></Panel>;
}
function Donut({rows}) {
  const values=keyDiseases.map(d=>rows.filter(r=>r.disease===d).length);
  values.push(rows.length-values.reduce((a,b)=>a+b,0));
  const labels=['Acute Diarrheal Disease (ADD)','Mumps','Chickenpox','Other diseases'];
  const total=Math.max(rows.length,1);
  let start=0;
  const slices=values.map((v,i)=>{const p=v/total*100;const end=start+p;const s=`${accentColors[i]} ${start.toFixed(3)}% ${end.toFixed(3)}%`;start=end;return s;});
  return <div className="donut-row"><div className="donut" style={{background:rows.length?`conic-gradient(${slices.join(',')})`:'#30283f'}}><div className="donut-hole"><b>{fNum(rows.length)}</b><span>Total<br/>events</span></div></div><div className="donut-legend">{labels.map((l,i)=><div key={l} className="donut-legend-row"><i style={{background:accentColors[i]}}/><span>{l}</span><b>{rows.length?Math.round(values[i]/rows.length*100):0}%</b></div>)}</div></div>;
}
function Gauge({metric,extra,precision}) {
  const score=Math.max(0,Math.min(1,num(metric)));
  const bars=25;const active=Math.round(score*bars);const cx=135,cy=142;
  return <div className="gauge-wrap"><svg viewBox="0 0 270 164" className="gauge-svg" role="img" aria-label={`2025 held-out model accuracy ${pct(score)}`}>
   {Array.from({length:bars},(_,i)=>{const angle=Math.PI+(Math.PI*i/(bars-1));const a=Math.cos(angle),b=Math.sin(angle);return <line key={i} x1={cx+a*93} y1={cy+b*93} x2={cx+a*115} y2={cy+b*115} stroke={i<active?'#a96bff':'#454453'} strokeWidth="10.5" strokeLinecap="round"/>;})}
  </svg><div className="gauge-number"><strong>{(score*100).toFixed(1)}%</strong><span>Test accuracy</span></div><div className="gauge-extra">Precision <b>{pct(precision)}</b> · Recall <b>{pct(extra)}</b></div><p className="quality-warning">Accuracy is inflated by the many weeks without a recorded outbreak.</p></div>;
}
function FlaggedTable({scores,week,onWeek,setTab,setDistrict,showHeader=true,metrics}) {
  const top=scores.filter(r=>num(r.week)===num(week)&&num(r.top_5_flag)===1).sort((a,b)=>num(a.district_rank)-num(b.district_rank)).slice(0,5);
  return <><AccuracyStrip metrics={metrics} compact/><div className="flags-toolbar">{showHeader && <span>2025 retrospective · Week {week}</span>}<label className="compact-week">Week <select value={week} aria-label="2025 evaluation week" onChange={e=>onWeek(num(e.target.value))}>{Array.from({length:52},(_,i)=><option key={i} value={i+1}>{i+1}</option>)}</select></label></div>
   <div className="flags-table-wrap"><table className="flags-table"><thead><tr><th>#</th><th>District</th><th>Model score</th><th>Recorded?</th></tr></thead><tbody>{top.map(r=><tr key={r.district} onClick={()=>{setDistrict(r.district);setTab('districts');}} title={`Explore ${r.district}`}><td>{num(r.district_rank)}</td><td>{r.district}</td><td><span className="score-chip">{num(r.model_score).toFixed(3)}</span></td><td><span className={`status-text ${num(r.actual_report_recorded)===1?'status-yes':'status-no'}`}>{num(r.actual_report_recorded)===1?'Yes':'No'}</span></td></tr>)}</tbody></table></div>
   <div className="flags-caption">Scores are ranking signals, not calibrated probabilities.</div></>;
}
function ModelDemo({defaultWeek=20}) {
  const [demoWeek,setDemoWeek]=useState(defaultWeek);
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [demoError,setDemoError]=useState('');
  const run=async()=>{
    setLoading(true);setDemoError('');setResult(null);
    try {
      const response=await fetch(`/api/predict?week=${demoWeek}`,{cache:'no-store'});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.error||'Inference failed');
      setResult(payload);
    } catch(e) {setDemoError(e.message.includes('JSON')||e.message.includes('fetch')?'Inference API unavailable. Start python backend/server.py in a second terminal.':e.message);}
    finally {setLoading(false);}
  };
  return <section className="panel model-demo-panel" id="model-demo">
    <div className="panel-heading"><div className="panel-heading-icon"><Activity size={25}/></div><div className="panel-heading-copy"><h2>Run Model Demo</h2><p>Generate fresh inference for a held-out 2025 week using the actual Python Logistic Regression model</p></div><Badge kind="purple">Real inference API</Badge></div>
    <div className="model-demo-controls"><div><small>Disease</small><strong>Acute Diarrheal Disease (ADD)</strong></div><div><small>Evaluation year</small><strong>2025</strong></div><label><small>Select week</small><select value={demoWeek} onChange={e=>setDemoWeek(Number(e.target.value))}>{Array.from({length:52},(_,i)=><option key={i+1} value={i+1}>Week {i+1}</option>)}</select></label><button type="button" className="demo-run-button" onClick={run} disabled={loading}>{loading?'Running model…':'Generate district rankings'} <ArrowRight size={17}/></button></div>
    {demoError&&<p className="demo-error" role="alert">{demoError}</p>}
    {result&&<div className="demo-result"><div className="demo-result-meta"><span><b>Model:</b> {result.model}</span><span><b>Trained:</b> {result.training_period}</span><span><b>Run:</b> {new Date(result.run_timestamp).toLocaleString()}</span><span><b>Correct top-five flags:</b> {result.correct_top_five} / 5</span></div><div className="demo-table-scroll"><table className="flags-table"><thead><tr><th>Rank</th><th>District</th><th>Model score</th><th>Actual report?</th></tr></thead><tbody>{result.top_five.map(r=><tr key={r.district}><td>{r.rank}</td><td>{r.district}</td><td><span className="score-chip">{r.model_score.toFixed(4)}</span></td><td><span className={`status-text ${r.actual_report_recorded?'status-yes':'status-no'}`}>{r.actual_report_recorded?'Yes':'No'}</span></td></tr>)}</tbody></table></div><p className="flags-caption">{result.note} This is a retrospective evaluation, not a live outbreak warning.</p></div>}
  </section>;
}
function ErrorState({message}) { return <div className="error-state"><AlertCircle size={35}/><h2>Couldn’t load the EpiAlert datasets</h2><p>{message}</p><code>npm.cmd run sync:data</code><p>Run the command in the folder containing package.json, then refresh this page.</p></div>; }
function Empty({message='No reports match the current selection.'}) {return <div className="empty-message"><Database size={20}/>{message}</div>;}


function AccuracyStrip({metrics,compact=false}) {
  const p=metrics?.performance||{};
  return <div className={`accuracy-strip ${compact?'accuracy-strip-compact':''}`} aria-label="Model evaluation context">
    <span className="accuracy-primary"><Target size={15}/><b>2025 test accuracy {pct(p.accuracy)}</b></span>
    <span>Precision <b>{pct(p.precision)}</b></span>
    <span>Recall <b>{pct(p.recall)}</b></span>
    {!compact&&<small>High accuracy can hide missed reports because most district-weeks have no recorded outbreak.</small>}
  </div>;
}
const researchSteps = [
  {name:'Collect',detail:'258 IDSP / NCDC weekly outbreak report PDFs from 2021–2025.'},
  {name:'Clean',detail:'257 usable report weeks; 516 Tamil Nadu outbreak records, each traceable to its source PDF and page.'},
  {name:'Prepare',detail:'District × disease × week records, using preceding four and eight weeks of reported activity.'},
  {name:'Model',detail:'Scaled logistic regression (balanced classes, C = 0.1), trained on 2021–2024 reports.'},
  {name:'Evaluate',detail:'Retrospective held-out 2025 test; the five highest-ranked districts are selected per week.'},
  {name:'Present',detail:'Interactive trends, district map, model rankings, reports and data exports.'}
];
function AboutPage({metrics,recordCount,districtCount,onNavigate}) {
  return <div className="tab-layout about-page">
    <div className="about-intro"><div><span className="home-section-eyebrow">THE RESEARCH BEHIND EPIALERT</span><h2>From weekly reports to an interactive disease surveillance dashboard.</h2><p>Explore how we transformed historical Tamil Nadu outbreak reports into structured data, machine learning rankings and interactive visualizations.</p></div><div className="about-intro-figures"><span><b>{fNum(recordCount)}</b> recorded outbreaks</span><span><b>{fNum(districtCount)}</b> districts</span><span><b>2021–2025</b> source period</span></div></div>
    <div className="about-columns">
      <section className="panel about-timeline-panel"><div className="about-card-head"><Activity size={23}/><h2>How the project works</h2></div><div className="research-timeline">{researchSteps.map((step,i)=><div className="research-step" key={step.name}><div className="research-dot"/><div><span className="research-step-num">0{i+1}</span><h3>{step.name}</h3><p>{step.detail}</p></div></div>)}</div></section>
    </div>
    <div className="about-action"><span>Built using IDSP/NCDC historical reports and an evaluated ADD classification model.</span><button className="btn-small" onClick={()=>onNavigate('dashboard')}><LayoutGrid size={16}/> Explore the dashboard <ArrowRight size={15}/></button></div>
  </div>;
}

function HomeLanding({onNavigate,recordCount,districtCount,isLoading}) {
  const links = [
    {id:'dashboard',title:'Intelligence Dashboard',detail:'The full dashboard from the original design.',icon:LayoutGrid,number:'01'},
    {id:'trends',title:'Outbreak Trends',detail:'Explore weekly activity and disease patterns.',icon:TrendingUp,number:'02'},
    {id:'districts',title:'District Explorer',detail:'Understand reported events across Tamil Nadu.',icon:MapPin,number:'03'},
    {id:'forecasts',title:'Model Analysis',detail:'Review the 2025 retrospective ADD rankings.',icon:Activity,number:'04'},
    {id:'insights',title:'Insights',detail:'Discover patterns in the recorded data.',icon:Lightbulb,number:'05'},
    {id:'reports',title:'Reports & Exports',detail:'Access datasets and research documentation.',icon:FileBarChart,number:'06'},
  ];
  return <div className="home-page">
    <section className="home-hero" aria-labelledby="home-heading">
      <div className="home-hero-copy">
        <div className="home-kicker"><span className="home-kicker-symbol"><Activity size={14}/></span> TAMIL NADU · OUTBREAK INTELLIGENCE</div>
        <h1 id="home-heading">See the patterns.<br/><span>Explore the evidence.</span></h1>
        <p>EpiAlert makes Tamil Nadu's historical outbreak reports easier to explore, with district-level insights and a transparently evaluated research model.</p>
        <div className="home-actions">
          <button className="home-primary" onClick={()=>onNavigate('dashboard')}>Open Dashboard <ArrowUpRight size={18}/></button>
          <button className="home-secondary" onClick={()=>onNavigate('trends')}>Explore Trends <ArrowRight size={17}/></button>
        </div>
        <div className="home-grounding"><span className="home-grounding-dot"/> Based on historical IDSP reports · Research prototype</div>
      </div>
      <div className="home-visual" aria-hidden="true">
        <div className="home-visual-glow"/>
        <div className="home-scan home-scan-outer"/>
        <div className="home-scan home-scan-mid"/>
        <div className="home-scan home-scan-inner"/>
        <div className="home-scan-axis home-scan-axis-h"/><div className="home-scan-axis home-scan-axis-v"/>
        <div className="home-orb-core"><ShieldCheck size={55} strokeWidth={1.15}/><span>EPIALERT</span></div>
        <span className="home-orbit-marker home-marker-1"/><span className="home-orbit-marker home-marker-2"/><span className="home-orbit-marker home-marker-3"/>
        <div className="home-visual-label home-label-top"><Layers3 size={16}/> HISTORICAL DATA</div>
        <div className="home-visual-label home-label-bottom"><Activity size={16}/> RETROSPECTIVE ANALYSIS</div>
      </div>
    </section>
    <div className="home-section-head"><div><span className="home-section-eyebrow">EXPLORE EPIALERT</span><h2>Where would you like to begin?</h2></div><span className="home-section-aside">Select a module to continue <ArrowRight size={14}/></span></div>
    <section className="home-link-grid" aria-label="Explore EpiAlert sections">
      {links.map(({id,title,detail,icon:Icon,number})=><button className="home-link-card" key={id} onClick={()=>onNavigate(id)}><span className="home-link-top"><span className="home-link-icon"><Icon size={23}/></span><span className="home-link-number">{number}</span></span><strong>{title}</strong><span className="home-link-detail">{detail}</span><span className="home-link-arrow"><ArrowUpRight size={18}/></span></button>)}
    </section>
    <div className="home-project-bar"><div className="home-project-intro"><Sparkles size={19}/><div><strong>What we've built</strong><p>Cleaned outbreak records, historical visualizations, and a tested ADD district-ranking model.</p></div></div><div className="home-project-stats"><div><strong>{isLoading?'—':fNum(districtCount)}</strong><span>districts</span></div><div><strong>{isLoading?'—':fNum(recordCount)}</strong><span>recorded events</span></div><div><strong>2021–25</strong><span>historical period</span></div></div></div>
  </div>;
}

export default function App() {
  const [data,setData]=useState(null);
  const [error,setError]=useState('');
  const [tab,setTab]=useState('home');
  const [district,setDistrict]=useState('All districts');
  const [disease,setDisease]=useState('All diseases');
  const [year,setYear]=useState('All years');
  const [graphMetric,setGraphMetric]=useState('Outbreak events');
  const [week,setWeek]=useState(52);
  const [search,setSearch]=useState('');
  const [searchOpen,setSearchOpen]=useState(false);
  const [menu,setMenu]=useState('');
  const [modal,setModal]=useState(false);
  const [mobileNav,setMobileNav]=useState(false);
  const inputRef=useRef(null);
  useEffect(()=>{let cancelled=false;loadData().then(d=>{if(!cancelled)setData(d);}).catch(e=>{if(!cancelled)setError(e.message)});return()=>{cancelled=true;};},[]);
  useEffect(()=>{const handler=e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();inputRef.current?.focus();setSearchOpen(true);}else if(e.key==='Escape'){setSearchOpen(false);setMenu('');setModal(false);}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[]);
  const records=data?.cleaned||[];
  const scores=data?.scores||[];
  const metrics=data?.metrics||{};
  const years=useMemo(()=>['All years',...Array.from(new Set(records.map(r=>num(r.year)))).filter(Boolean).sort((a,b)=>b-a).map(String)], [records]);
  const districts=useMemo(()=>['All districts',...Array.from(new Set(records.map(r=>r.district))).filter(Boolean).sort()], [records]);
  const diseases=useMemo(()=>['All diseases',...Array.from(new Set(records.map(r=>r.disease))).filter(Boolean).sort()], [records]);
  const filtered=useMemo(()=>records.filter(r=>(district==='All districts'||r.district===district)&&(disease==='All diseases'||r.disease===disease)&&(year==='All years'||String(r.year)===year)),[records,district,disease,year]);
  const maxDisease=useMemo(()=>{const counts={};filtered.forEach(r=>counts[r.disease]=(counts[r.disease]||0)+1);return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]||['No reports',0];},[filtered]);
  const reportDistricts=new Set(filtered.map(r=>r.district)).size;
  const isDashboard=tab==='dashboard';
  const searchMatches=useMemo(()=>{const term=search.trim().toLowerCase();if(!term)return[];return districts.filter(d=>d!=='All districts'&&d.toLowerCase().includes(term)).slice(0,6);},[districts,search]);
  const searchGo=place=>{if(place){setDistrict(place);setTab('districts');setSearch(place);setSearchOpen(false);setMenu('');}};
  const navTo=next=>{setTab(next);setMobileNav(false);setMenu('');window.scrollTo({top:0,behavior:'smooth'});};
  const pickHeat=(d,di)=>{setDistrict(d);setDisease(di);setTab('districts');};
  const exportFiltered=()=>csvDownload(`EpiAlert_Historical_${year.replace(/ /g,'_')}.csv`,filtered);
  const exportScores=()=>csvDownload('EpiAlert_2025_Retrospective_Rankings.csv',scores);
  const reset=()=>{setDistrict('All districts');setDisease('All diseases');setYear('All years');setGraphMetric('Outbreak events');};
  const topDistricts=useMemo(()=>Object.entries(filtered.reduce((o,r)=>(o[r.district]=(o[r.district]||0)+1,o),{})).sort((a,b)=>b[1]-a[1]),[filtered]);
  const topDiseases=useMemo(()=>Object.entries(filtered.reduce((o,r)=>(o[r.disease]=(o[r.disease]||0)+1,o),{})).sort((a,b)=>b[1]-a[1]),[filtered]);
  const byYear=useMemo(()=>Array.from({length:5},(_,i)=>{const y=2021+i;return {year:String(y),events:records.filter(r=>num(r.year)===y).length};}),[records]);
  const activeLabel=NAV.find(n=>n.id===tab)?.label||'Home';
  return <div className="app-shell">
   <header className="topbar"><div className="brand-block"><Logo/></div><nav className={`topnav ${mobileNav?'topnav-open':''}`} aria-label="Main navigation">{NAV.map(({id,label,icon:Icon})=><button key={id} type="button" onClick={()=>navTo(id)} className={`nav-button ${tab===id?'nav-active':''}`}><Icon size={19} strokeWidth={2}/><span>{label}</span></button>)}</nav><div className="header-tools"><div className="search-area"><button className="tool-button" aria-label="Search district" title="Search district" onClick={()=>{inputRef.current?.focus();setSearchOpen(!searchOpen);}}><Search size={20}/></button>{searchOpen&&<div className="search-popover"><div className="search-input"><Search size={17}/><input ref={inputRef} placeholder="Find a district..." value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')searchGo(searchMatches[0]);}} autoFocus/></div><div className="search-list">{searchMatches.length?searchMatches.map(m=><button key={m} onClick={()=>searchGo(m)}><MapPin size={14}/>{m}<ArrowRight size={13}/></button>):<span>{search?'No matching district':'Enter a Tamil Nadu district'}</span>}</div><p>Press Ctrl + K to search</p></div>}</div><div className="tool-menu"><button className="tool-button bell" aria-label="Model status" onClick={()=>setMenu(menu==='alert'?'':'alert')}><Bell size={19}/><i/></button>{menu==='alert'&&<div className="header-popover"><strong>Research demonstration</strong><p>No live outbreak alerts are issued. The rankings shown here are retrospective 2025 results.</p><button onClick={()=>{setMenu('');navTo('forecasts');}}>Explore evaluation <ArrowRight size={13}/></button></div>}</div><div className="tool-menu"><button className="account-button" onClick={()=>setMenu(menu==='profile'?'':'profile')}><span className="avatar">EA</span>Team EpiAlert <ChevronDown size={14}/></button>{menu==='profile'&&<div className="header-popover account-popover"><strong>EpiAlert Research Team</strong><p>Research prototype · Tamil Nadu</p><button onClick={()=>{setMenu('');navTo('about');}}>About the project <ArrowRight size={13}/></button></div>}</div><button className="mobile-menu" aria-label="Toggle navigation" onClick={()=>setMobileNav(!mobileNav)}>{mobileNav?<X size={22}/>:<Menu size={22}/>}</button></div></header>
   <main className="dashboard-container">
     {tab!=='home'&&<div className="page-titlebar"><div className="title-group"><div className="tn-emblem" aria-hidden="true"><svg viewBox="0 0 48 64"><path d="M28 1 38 7 36 17 43 23 38 32 41 41 31 45 27 53 20 57 17 63 11 57 13 49 7 43 14 35 10 27 5 22 12 16 16 7Z" fill="#7e4ce3" stroke="#b18aff" strokeWidth="1.7"/></svg></div><div className="title-separator"/><div><p className="page-eyebrow">EPIDEMIOLOGICAL INTELLIGENCE / TAMIL NADU</p><h1>{isDashboard?'Tamil Nadu Outbreak Intelligence Dashboard':tab==='trends'?'Historical Outbreak Trends':tab==='forecasts'?'Retrospective Model Rankings':tab==='districts'?'District Outbreak Explorer':tab==='reports'?'Research Reports & Data':tab==='about'?'About EpiAlert & Methodology': 'Outbreak Intelligence Insights'}</h1><p className="title-subtitle">{isDashboard?'Historical surveillance · District insights · Transparent model evaluation':tab==='trends'?'Explore weekly activity, disease composition, and recorded patterns':tab==='forecasts'?'2025 held-out analysis of Acute Diarrheal Disease report rankings':tab==='districts'?'Explore the historical records behind district-level outbreak activity':tab==='reports'?'Traceable IDSP records, exports, and methods':tab==='about'?'Data sources, research workflow, and what our model can and cannot do':'Discover patterns from reported outbreak events, 2021–2025'}</p></div></div><div className="title-controls"><span className="source-note"><Database size={14}/> Historical dataset <small>IDSP · 2021–2025</small></span><span className="title-divider"/><Select value={year} onChange={setYear} label="Choose reporting year" className="year-select" items={years}/><button className="export-button" onClick={exportFiltered}><ArrowDownToLine size={18}/> Export Report</button></div></div>}
     {tab!=='home'&&<div className="filters"><span className="filter-lead"><Filter size={18}/>Filters:</span><Select value={district} onChange={setDistrict} label="Filter district" items={districts}/><Select value={disease} onChange={setDisease} label="Filter disease" items={diseases.map(d=>({value:d,label:d===ADD?'ADD':d}))}/><Select value={graphMetric} onChange={setGraphMetric} label="Chart metric" items={['Outbreak events','Reported cases']}/>{(district!=='All districts'||disease!=='All diseases'||year!=='All years'||graphMetric!=='Outbreak events')&&<button className="clear-filter" onClick={reset}><RotateCcw size={14}/> Reset</button>}</div>}
     {tab==='home' ? <HomeLanding onNavigate={navTo} recordCount={records.length} districtCount={districts.length-1} isLoading={!data}/> : error ? <ErrorState message={error}/> : !data ? <div className="loading"><div className="spinner"/> Loading verified IDSP records and 2025 model results...</div> : <>
     {tab==='dashboard'&&<div className="overview-grid">
       <Kpi icon={MapPin} title="Districts in Selection" value={digits(reportDistricts)} note={`${districts.length-1} districts in the historical dataset`} trail="TN coverage"/>
       <Kpi icon={Activity} title="Recorded Outbreak Events" value={digits(filtered.length)} note="Validated outbreak-report entries" trail={year==='All years'?'2021–25':year}/>
       <Kpi icon={ShieldCheck} title="Model Evaluation" value={`${metrics.dataset?.test_weeks||52} weeks`} note="2025 retrospective ADD evaluation" trail="Held-out"/>
       <Panel className="heatmap-card" title="District Activity Heatmap" subtitle="Recorded outbreak reports by disease" icon={Layers3} headerRight={<InfoButton label="About heatmap counts" onClick={()=>setModal(true)}/> }><HeatMap rows={records} districtFilter={district} selectedYear={year} onPick={pickHeat}/></Panel>
       <Panel className="weekly-card" title="Weekly Outbreak Trend" subtitle="Recorded outbreak events across selected Tamil Nadu districts" icon={TrendingUp} headerRight={<span className="chart-mode"><button className={graphMetric==='Outbreak events'?'on':''} onClick={()=>setGraphMetric('Outbreak events')}>Events</button><button className={graphMetric==='Reported cases'?'on':''} onClick={()=>setGraphMetric('Reported cases')}>Cases</button></span>}><WeeklyChart rows={filtered} mode={graphMetric} diseaseLabel={disease==='All diseases'?'All reported diseases':titleDisease(disease)}/></Panel>
       <Snapshot metrics={metrics} onInfo={()=>setModal(true)}/>
       <section className="panel insight-card"><div className="insight-tag"><Sparkles size={17}/> Key Insight</div><div className="star-dots" aria-hidden="true">✧ · · ✦ · · ·</div><h2>{titleDisease(maxDisease[0])}</h2><p>{filtered.length?<>is the most frequently recorded disease in this selection, appearing in <strong>{maxDisease[1]}</strong> of <strong>{filtered.length}</strong> outbreak reports.</>:'No reported outbreaks match these filters.'}</p><button onClick={()=>navTo('insights')}>Discover insights <ArrowRight size={16}/></button></section>
       <Panel className="disease-card" title="Disease Mix" subtitle="Share of selected recorded outbreak events" icon={Activity}><Donut rows={filtered}/></Panel>
       <Panel className="quality-card" title="Model Quality" subtitle="Held-out 2025 · ADD, retrospective" icon={Target} headerRight={<InfoButton label="About model quality metrics" onClick={()=>setModal(true)}/> }><Gauge metric={metrics.performance?.accuracy} extra={metrics.performance?.recall} precision={metrics.performance?.precision}/></Panel>
       <Panel className="flagged-card" title="Top Flagged Districts" subtitle="Model rankings · 2025 historical weeks" icon={Flag} headerRight={<InfoButton label="What is model ranking?" onClick={()=>setModal(true)}/> }><FlaggedTable scores={scores} week={week} onWeek={setWeek} setTab={navTo} setDistrict={setDistrict} metrics={metrics}/></Panel>
     </div>}
     {tab==='trends'&&<div className="tab-layout">
       <div className="trends-feature-grid">
         <Panel className="trends-feature-main" title="Weekly Outbreak Trend" subtitle="Recorded outbreak events across selected Tamil Nadu districts" icon={TrendingUp} headerRight={<span className="chart-mode"><button className={graphMetric==='Outbreak events'?'on':''} onClick={()=>setGraphMetric('Outbreak events')}>Events</button><button className={graphMetric==='Reported cases'?'on':''} onClick={()=>setGraphMetric('Reported cases')}>Cases</button></span>}><WeeklyChart rows={filtered} mode={graphMetric} diseaseLabel={disease==='All diseases'?'All reported diseases':titleDisease(disease)}/></Panel>
         <Panel className="trends-feature-side" title="Disease Mix" subtitle="Share of selected recorded outbreak events" icon={Activity}><Donut rows={filtered}/></Panel>
       </div>
       <div className="trends-bottom-grid">
         <Panel title="District Activity Heatmap" subtitle="Recorded outbreak reports by disease" icon={Layers3} headerRight={<InfoButton label="About heatmap counts" onClick={()=>setModal(true)}/> }><HeatMap rows={records} districtFilter={district} selectedYear={year} onPick={pickHeat}/></Panel>
         <section className="panel insight-card trends-insight"><div className="insight-tag"><Sparkles size={17}/> Key Insight</div><div className="star-dots" aria-hidden="true">✧ · · ✦ · · ·</div><h2>{titleDisease(maxDisease[0])}</h2><p>{filtered.length?<>is the most frequently recorded disease in this selection, appearing in <strong>{maxDisease[1]}</strong> of <strong>{filtered.length}</strong> outbreak reports.</>:'No reported outbreaks match these filters.'}</p><button onClick={()=>navTo('insights')}>Discover insights <ArrowRight size={16}/></button></section>
       </div>
       <p className="small-disclaimer">These are historical outbreak reports. Gaps in reporting do not establish zero disease activity.</p>
     </div>}
     {tab==='forecasts'&&<div className="tab-layout"><div className="model-banner"><Activity size={25}/><div><b>Research model · NOT a live outbreak forecast</b><p>This model ranks district-week reports for Acute Diarrheal Disease (ADD), evaluated against 2025 reports. Scores are not probabilities of an outbreak.</p></div><Badge kind="purple">2025 only</Badge></div><div className="secondary-kpis forecast-kpis"><Kpi icon={Target} title="Test Accuracy" value={pct(metrics.performance?.accuracy)} note="2025 held-out · many negative rows"/><Kpi icon={Check} title="Correct Flags" value={digits(num(metrics.performance?.true_positives))} note="Observed reports correctly flagged"/><Kpi icon={AlertCircle} title="Missed Reports" value={digits(num(metrics.performance?.false_negatives))} note="Reports not among model flags"/><Kpi icon={Target} title="Precision" value={pct(metrics.performance?.precision)} note="True events among flagged rankings"/><Kpi icon={Activity} title="Recall" value={pct(metrics.performance?.recall)} note="Observed report events captured"/></div><ModelDemo/><div className="two-column"><Panel icon={Flag} title="Top 5 District Rankings" subtitle="Choose any week of the 2025 held-out period"><FlaggedTable scores={scores} week={week} onWeek={setWeek} setTab={navTo} setDistrict={setDistrict} metrics={metrics}/></Panel><Panel icon={BarChart3} title="Evaluation Breakdown" subtitle="Observed 2025 ADD district-week classifications"><div className="eval-breakdown">{[['True positives',num(metrics.performance?.true_positives),'#82d785'],['False positives',num(metrics.performance?.false_positives),'#bb86f9'],['False negatives',num(metrics.performance?.false_negatives),'#f37d83'],['True negatives',num(metrics.performance?.true_negatives),'#7f7d9b']].map(([name,value,color])=><div key={name} className="breakdown-row"><div><span>{name}</span><b>{fNum(value)}</b></div><div className="breakdown-track"><i style={{width:`${Math.max(2,value/Math.max(1,num(metrics.performance?.true_negatives))*100)}%`,background:color}}/></div></div>)}</div><p className="small-disclaimer">Accuracy alone does not show whether outbreak reports were correctly flagged: precision is only {pct(metrics.performance?.precision)}. No report recorded does not prove disease absence.</p></Panel></div><button className="btn-small" onClick={exportScores}><Download size={16}/> Download all 2025 model scores (.csv)</button></div>}
     {tab==='districts'&&<div className="tab-layout"><div className="secondary-kpis"><Kpi icon={MapPin} title="Active Districts" value={fNum(reportDistricts)} note="At least one recorded report in selection"/><Kpi icon={Activity} title="Outbreak Events" value={fNum(filtered.length)} note="Recorded outbreak reports"/><Kpi icon={CalendarDays} title="Period" value={year==='All years'?'2021–25':year} note="Historical, not live"/><Kpi icon={Microscope} title="Disease Types" value={fNum(new Set(filtered.map(r=>r.disease)).size)} note="Distinct reported conditions in selection"/></div><DistrictMap records={records} disease={disease} year={year} selectedDistrict={district} onSelect={setDistrict}/><div className="two-column districts-columns"><Panel icon={MapPin} title="District Explorer" subtitle="Select any district to focus the entire dashboard"><div className="district-table"><div className="district-row district-row-head"><b>District</b><b>Reports</b><b>Share</b></div>{topDistricts.map(([d,c])=><button key={d} className={`district-row ${district===d?'district-selected':''}`} onClick={()=>setDistrict(d)}><span><MapPin size={13}/>{d}</span><b>{c}</b><span>{filtered.length?(c/filtered.length*100).toFixed(1):'0.0'}%</span></button>)}{!topDistricts.length&&<Empty/>}</div></Panel><Panel icon={TrendingUp} title="Weekly Reporting Pattern" subtitle="Explore the selected district, disease, and year"><WeeklyChart rows={filtered} mode={graphMetric} diseaseLabel={disease==='All diseases'?'All reported diseases':titleDisease(disease)}/><p className="small-disclaimer">Only recorded outbreak events appear here. Missing reports are not evidence of zero incidence.</p></Panel></div></div>}
     {tab==='reports'&&<div className="tab-layout"><div className="report-tiles"><div className="panel report-tile"><FileText size={30}/><h3>Historical Outbreak Records</h3><p>Cleaned IDSP Tamil Nadu report entries from 2021 to 2025, including district, disease, week, source PDF and validation fields.</p><b>{fNum(filtered.length)} selected records</b><button onClick={exportFiltered}><Download size={16}/> Download filtered CSV</button></div><div className="panel report-tile"><BarChart3 size={30}/><h3>2025 Model Ranking Results</h3><p><strong>Held-out accuracy: {pct(metrics.performance?.accuracy)}.</strong> Weekly retrospective district rankings for ADD. Includes scores, top-five flags and observed report indicators.</p><b>{fNum(scores.length)} evaluation rows</b><button onClick={exportScores}><Download size={16}/> Download model CSV</button></div><div className="panel report-tile"><ShieldCheck size={30}/><h3>Evaluation and Limitations</h3><p>Held-out accuracy: {pct(metrics.performance?.accuracy)}. Precision: {pct(metrics.performance?.precision)}; recall: {pct(metrics.performance?.recall)}. Read limitations before interpreting any score.</p><b>Held-out year: 2025</b><button onClick={()=>setModal(true)}><Info size={16}/> Read model notes</button></div></div><Panel icon={Database} title="Data Provenance" subtitle="Documented IDSP / NCDC public outbreak reports"><div className="provenance-copy"><p>The project uses cleaned Tamil Nadu outbreak notifications extracted from IDSP/NCDC weekly reports covering 2021–2025. Records include source document names and pages for auditability.</p><p>These are <strong>outbreak-report events</strong>, not a complete registry of infections. The ADD model was trained on 2021–2024 data and retrospectively evaluated on held-out 2025 reports.</p></div></Panel></div>}
     {tab==='insights'&&<div className="tab-layout"><div className="secondary-kpis"><Kpi icon={Activity} title="Selected Events" value={fNum(filtered.length)} note="Recorded outbreak report entries"/><Kpi icon={MapPin} title="Districts" value={fNum(reportDistricts)} note="Represented in filtered selection"/><Kpi icon={Microscope} title="Disease Categories" value={fNum(new Set(filtered.map(r=>r.disease)).size)} note="Unique reported diseases"/><Kpi icon={CalendarDays} title="Observed Years" value={fNum(new Set(filtered.map(r=>r.year)).size)} note="With at least one selected event"/></div><div className="two-column"><Panel icon={Microscope} title="Most Reported Disease Categories" subtitle="Ranked by outbreak event count, not individual cases"><div className="insight-bars">{topDiseases.slice(0,8).map(([d,c],i)=><div key={d} className="insight-bar"><div><span>{titleDisease(d)}</span><b>{c}</b></div><div className="breakdown-track"><i style={{width:`${c/Math.max(1,topDiseases[0][1])*100}%`,background:spectrum[i%spectrum.length]}}/></div></div>)}{!topDiseases.length&&<Empty/>}</div></Panel><Panel icon={TrendingUp} title="Reporting Activity by Year" subtitle="Recorded outbreak events across Tamil Nadu"><div className="yearly-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={byYear} margin={{top:10,left:-14,right:10,bottom:8}}><CartesianGrid vertical={false} stroke="#444057" strokeDasharray="3 4"/><XAxis dataKey="year" stroke="#a8a0c4" tickLine={false}/><YAxis stroke="#a8a0c4" tickLine={false} allowDecimals={false}/><Tooltip content={<TinyChartTooltip/>}/><Bar dataKey="events" radius={[8,8,0,0]}>{byYear.map((_,i)=><Cell key={i} fill={year==='All years'||year===String(2021+i)?'#a775fb':'#503779'}/>)}</Bar></BarChart></ResponsiveContainer></div><p className="small-disclaimer">Reporting and publication coverage varies over time. A change in counts is not necessarily a change in disease incidence.</p></Panel></div><Panel icon={ShieldCheck} title="Research Interpretation" subtitle="What the project can—and cannot—claim"><div className="limitations-list">{(metrics.limitations||[]).map(l=><p key={l}><Info size={15}/>{l}</p>)}</div></Panel></div>}

     {tab==='about'&&<AboutPage metrics={metrics} recordCount={records.length} districtCount={districts.length-1} onNavigate={navTo}/>}
     </>}
   </main>
   <footer className="footer"><div><Info size={18}/><b>Model note:</b> EpiAlert analyzes recorded IDSP outbreak activity and retrospective model rankings; it is not a clinical diagnostic tool or real-time warning system.</div><span><Database size={15}/> Data: IDSP · Tamil Nadu <i/> Research prototype</span></footer>
   {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false);}}><div className="modal" role="dialog" aria-modal="true" aria-label="Model transparency"><button className="modal-close" onClick={()=>setModal(false)} aria-label="Close"><X size={20}/></button><div className="modal-symbol"><ShieldCheck size={25}/></div><h2>About EpiAlert's model</h2><p>The current research model ranks district-weeks for <b>Acute Diarrheal Disease</b> based on historical report patterns. It is evaluated retrospectively for 2025. The model does not predict future case counts, provide medical advice, or generate verified live outbreak warnings.</p><div className="modal-stats"><span>Accuracy <b>{pct(metrics.performance?.accuracy)}</b></span><span>Precision <b>{pct(metrics.performance?.precision)}</b></span><span>Recall <b>{pct(metrics.performance?.recall)}</b></span></div><p className="modal-accuracy-note">Accuracy is not a measure of outbreak-alert reliability here: precision is low because outbreaks are rare in the evaluated district-weeks.</p><h3>Important limitations</h3><ul>{(metrics.limitations||[]).map(t=><li key={t}>{t}</li>)}</ul><button className="export-button" onClick={()=>setModal(false)}>Understood</button></div></div>}
  </div>;
}
