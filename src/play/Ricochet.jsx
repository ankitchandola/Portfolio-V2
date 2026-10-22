import React,{useEffect,useReducer,useRef,useState} from 'react';
import {Zap,Undo2,RotateCcw,Check,Repeat,Ban,LogOut,ArrowRight,ArrowUpRight} from 'lucide-react';
import raw from '../content/levels.json';
import {parseLevel,createReducer,initialState,canUndo,canReset,allSolved,trace,DIRS} from './model';
import {loadSolved,saveSolved} from './progress';
import './play.css';
const levels=raw.map(parseLevel);
const reducer=createReducer(levels);
const browserStorage=()=>{try{return window.localStorage}catch{return null}};
const pointing={N:'up',E:'right',S:'down',W:'left'};
const place=(x,y)=>`row ${y+1}, column ${x+1}`;

function describe(level){
 const {w,h,rows}=level,cells=rows.flatMap((row,y)=>[...row].map((c,x)=>({c,x,y})));
 const edge=({x,y})=>x===0||y===0||x===w-1||y===h-1;
 const walled=cells.filter(edge).every(({c})=>c==='#');
 const walls=cells.filter(cell=>cell.c==='#'&&!(walled&&edge(cell))).map(({x,y})=>place(x,y));
 const mirrors=Object.keys(level.mirrors).length;
 return `${w} columns by ${h} rows${walled?', surrounded by a wall':''}. The beam starts at ${place(level.source.x,level.source.y)}, pointing ${pointing[level.source.dir]}. The target is at ${place(level.target.x,level.target.y)}. ${mirrors} ${mirrors===1?'mirror':'mirrors'}. ${walls.length?`Walls at ${walls.join('; ')}.`:walled?'No other walls.':'No walls.'}`;
}
function beamPoints(level,shot){
 const centre=({x,y})=>[x+.5,y+.5];
 const points=[centre(level.source),...shot.path.map(centre)];
 const {x,y,dir}=shot.end;
 if(shot.outcome==='blocked')points[points.length-1]=[x+.5-DIRS[dir][0]*.5,y+.5-DIRS[dir][1]*.5];
 if(shot.outcome==='escaped')points.push([x+.5-DIRS[dir][0]*.5,y+.5-DIRS[dir][1]*.5]);
 if(shot.outcome==='loop')points.push(centre(shot.end));
 return points;
}
const toPath=points=>points.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ');

function Board({level,mirrors,shot,shotCount,onRotate}){
 const cells=level.rows.flatMap((row,y)=>[...row].map((c,x)=>({c,x,y})));
 const points=shot&&beamPoints(level,shot);
 const loop=shot?.outcome==='loop'&&points.slice(shot.loopStart+1);
 const drawMs=points?Math.min(600,points.length*45):0;
 const {source,target}=level,[dx,dy]=DIRS[source.dir];
 return <div className="ricochet-board" style={{'--cols':level.w,'--rows':level.h}}>
  <svg viewBox={`0 0 ${level.w} ${level.h}`} aria-hidden="true" focusable="false">
   {cells.map(({x,y})=><rect key={`g${x}-${y}`} className="rc-cell" x={x} y={y} width="1" height="1"/>)}
   {cells.filter(({c})=>c==='#').map(({x,y})=><rect key={`w${x}-${y}`} className="rc-wall" x={x+.06} y={y+.06} width=".88" height=".88" rx=".08"/>)}
   <g className={shot?.outcome==='hit'?'rc-target is-hit':'rc-target'}><circle cx={target.x+.5} cy={target.y+.5} r=".34"/><circle cx={target.x+.5} cy={target.y+.5} r=".14"/></g>
   <g className="rc-source"><circle cx={source.x+.5} cy={source.y+.5} r=".3"/><path d={`M${source.x+.5+dx*.2} ${source.y+.5+dy*.2} L${source.x+.5-dx*.1+dy*.13} ${source.y+.5-dy*.1+dx*.13} L${source.x+.5-dx*.1-dy*.13} ${source.y+.5-dy*.1-dx*.13}Z`}/></g>
   {Object.entries(mirrors).map(([key,m])=>{const [x,y]=key.split(',').map(Number);return <g key={key}><circle className="rc-mirror-ring" cx={x+.5} cy={y+.5} r=".4"/><line className={m==='/'?'rc-mirror':'rc-mirror is-back'} x1={x+.2} y1={y+.8} x2={x+.8} y2={y+.2}/></g>})}
   {points&&<path key={'beam'+shotCount} className="rc-beam" d={toPath(points)} pathLength="1" style={{'--draw':drawMs+'ms'}}/>}
   {loop&&<path key={'loop'+shotCount} className="rc-loop" d={toPath([points[shot.loopStart],...loop])} style={{'--draw':drawMs+'ms'}}/>}
  </svg>
  <div className="ricochet-cells">{Object.entries(mirrors).map(([key,m])=>{const [x,y]=key.split(',').map(Number);return <button key={key} type="button" className="ricochet-mirror" style={{gridColumn:x+1,gridRow:y+1}} onClick={()=>onRotate(key)} aria-label={`Mirror, ${place(x,y)}, slanted ${m==='/'?'forward':'backward'}`}/>})}</div>
 </div>
}

function Result({shot,solvedAll,onNext}){
 if(!shot)return <p className="ricochet-result">Turn the mirrors, then fire.</p>;
 const {x,y}=shot.end;
 const [Icon,text]={
  hit:[Check,`Hit the target in ${shot.path.length} cells.`],
  blocked:[Ban,`Blocked by a wall at ${place(x,y)}.`],
  escaped:[LogOut,'The beam left the grid.'],
  loop:[Repeat,'Loop: the beam would bounce forever.'],
 }[shot.outcome];
 return <div className={'ricochet-result is-'+shot.outcome}><p><Icon size={24} aria-hidden="true"/><span>{text}</span></p>
  {shot.outcome==='hit'&&(solvedAll
   ?<p className="ricochet-done">All five levels solved. <a href="/#work">Back to the work<ArrowUpRight size={20}/></a></p>
   :<button type="button" className="solid-button" onClick={onNext}>Next level<ArrowRight size={22}/></button>)}
 </div>
}

export default function Ricochet(){
 const [state,dispatch]=useReducer(reducer,levels,initialState);
 const [shotCount,setShotCount]=useState(0);
 const heading=useRef(null),shownLevel=useRef(state.levelIndex);
 const level=levels[state.levelIndex];
 useEffect(()=>{const ids=loadSolved(browserStorage(),levels.map(l=>l.id));if(ids.length)dispatch({type:'loaded',ids})},[]);
 useEffect(()=>{if(shownLevel.current!==state.levelIndex){shownLevel.current=state.levelIndex;heading.current?.focus()}},[state.levelIndex]);
 const fire=()=>{
  dispatch({type:'fire'});setShotCount(n=>n+1);
  if(!state.solved.includes(level.id)&&trace(level,state.mirrors).outcome==='hit')saveSolved(browserStorage(),[level.id]);
 };
 return <section className="case-page shell ricochet">
  <div className="case-page-heading"><span className="kicker">SIDE PROJECT / PUZZLE</span><h1>Ricochet</h1><p>Turn the mirrors so the beam bounces into the target.</p></div>
  <noscript><p className="ricochet-noscript">The puzzle needs JavaScript. Level 1 is shown below as a preview.</p></noscript>
  <div className="ricochet-layout">
   <div className="ricochet-stage">
    <div className="ricochet-level-heading"><span className="kicker">LEVEL {state.levelIndex+1} OF {levels.length}</span><h2 ref={heading} tabIndex={-1}>{level.title}</h2><p>{level.hint}</p></div>
    <p className="sr-only">{describe(level)}</p>
    <Board level={level} mirrors={state.mirrors} shot={state.shot} shotCount={shotCount} onRotate={key=>dispatch({type:'rotate',key})}/>
   </div>
   <div className="ricochet-panel">
    <div className="ricochet-controls">
     <button type="button" className="solid-button" onClick={fire}><Zap size={22}/>Fire</button>
     <button type="button" className="ricochet-button" onClick={()=>dispatch({type:'undo'})} disabled={!canUndo(state)}><Undo2 size={22}/>Undo</button>
     <button type="button" className="ricochet-button" onClick={()=>dispatch({type:'reset'})} disabled={!canReset(state)}><RotateCcw size={22}/>Reset</button>
    </div>
    <div role="status" aria-live="polite" aria-atomic="true"><Result shot={state.shot} solvedAll={allSolved(levels,state.solved)} onNext={()=>dispatch({type:'next'})}/></div>
    <div className="ricochet-levels"><span className="kicker" aria-hidden="true">LEVELS</span><div role="group" aria-label="Choose a level">{levels.map((l,i)=>{const solved=state.solved.includes(l.id);return <button key={l.id} type="button" aria-pressed={i===state.levelIndex} aria-label={`Level ${i+1}, ${l.title}${solved?', solved':''}`} onClick={()=>dispatch({type:'select',index:i})}>{i+1}{solved&&<Check size={16} aria-hidden="true"/>}</button>})}</div></div>
    <div className="ricochet-guide"><h2>How to play</h2><ol><li>Tap a mirror to turn it a quarter turn.</li><li>Press Fire to send the beam.</li><li>Reach the target. Walls stop the beam, edges let it escape, and some layouts send it round in circles.</li><li>Undo takes back your last turn. Reset starts the level again.</li></ol></div>
   </div>
  </div>
 </section>
}
