import { useEffect, useRef, useState } from 'react';
import { courses } from './courses';
import './index.css';
import { Course3D } from './Course3D';
import { slopeAcceleration, windmillBlocks } from './terrain';

type Ball = { x: number; y: number; vx: number; vy: number };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export function App() {
  const [level, setLevel] = useState(0);
  const [strokes, setStrokes] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [power, setPower] = useState(0);
  const [charging, setCharging] = useState(false);
  const [moving, setMoving] = useState(false);
  const [won, setWon] = useState(false);
  const [showCourses, setShowCourses] = useState(false);
  const [help, setHelp] = useState(false);
  const [sound, setSound] = useState(true);
  const course = courses[level]!;
  const ball = useRef<Ball>({ ...course.start, vx: 0, vy: 0 });
  const [position, setPosition] = useState({ ...course.start });
  const [angle, setAngle] = useState(-0.43);
  const aim = useRef(angle);
  const chargeStart = useRef<number | null>(null);
  const strength = useRef(0);
  const live = useRef({ ball, aim, strength }).current;
  const busy = useRef(false);
  const complete = useRef(false);

  const audio = useRef<AudioContext | null>(null);
  const chime = (frequency: number) => {
    if (!sound) return;
    try { const ctx = audio.current ??= new AudioContext(); void ctx.resume(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = frequency; g.gain.setValueAtTime(.07, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .15); o.start(); o.stop(ctx.currentTime + .15); } catch {}
  };
  const reset = (index: number) => {
    setLevel(index); ball.current = { ...courses[index]!.start, vx: 0, vy: 0 }; setPosition({ ...courses[index]!.start }); setStrokes(0); setWon(false); complete.current = false; busy.current = false; setMoving(false); chargeStart.current = null; setCharging(false); setPower(0); strength.current = 0; setShowCourses(false); const next = courses[index]!; aim.current = Math.atan2(next.hole.y-next.start.y,next.hole.x-next.start.x); setAngle(aim.current);
  };
  const start = () => { if (busy.current || complete.current || showCourses || help || chargeStart.current !== null) return; chargeStart.current = performance.now(); setCharging(true); };
  const release = () => {
    if (chargeStart.current === null) return;
    const p = Math.max(.08, strength.current); chargeStart.current = null; strength.current = 0; setCharging(false); setPower(0);
    ball.current.vx = Math.cos(aim.current) * (2 + p * 12); ball.current.vy = Math.sin(aim.current) * (2 + p * 12);
    busy.current = true; setMoving(true); setStrokes(s => s + 1); chime(460);
  };
  const controls = useRef({ start, release }); controls.current = { start, release };
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if ((e.target as HTMLElement).closest('button, input, select')) return; if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) controls.current.start(); } if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { e.preventDefault(); aim.current += e.code === 'ArrowLeft' ? -.06 : .06; setAngle(aim.current); } };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); controls.current.release(); } };
    const cancel = () => { chargeStart.current = null; strength.current = 0; setCharging(false); setPower(0); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', cancel);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', cancel); };
  }, []);
  useEffect(() => {
    let frame = 0, last = performance.now(), lastUI = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 16.667, 2); last = now;
      if (chargeStart.current !== null) { strength.current = Math.min((now - chargeStart.current) / 1500, 1); if(now-lastUI>=33) setPower(strength.current); }
      const b = ball.current;
      if (busy.current) {
        for (let step = 0; step < 3; step++) {
          b.vx += slopeAcceleration(course,b.x)*dt/3;
          const previousX=b.x;
          b.x += b.vx * dt / 3; b.y += b.vy * dt / 3;
          if (b.x < 122 || b.x > 698) { b.x = clamp(b.x, 122, 698); b.vx *= -.78; }
          if (b.y < 122 || b.y > 478) { b.y = clamp(b.y, 122, 478); b.vy *= -.78; }
          for (const w of course.walls) {
            const nx = clamp(b.x, w.x, w.x + w.w), ny = clamp(b.y, w.y, w.y + w.h);
            const dx = b.x - nx, dy = b.y - ny, d = Math.hypot(dx, dy);
            if (d < 9 && d > 0) { const ux = dx / d, uy = dy / d; b.x = nx + ux * 9; b.y = ny + uy * 9; const dot = b.vx * ux + b.vy * uy; if (dot < 0) { b.vx -= 1.8 * dot * ux; b.vy -= 1.8 * dot * uy; } }
          }
          for(const mill of course.windmills??[]) {
            if(Math.abs(b.x-mill.x)<12&&windmillBlocks(mill,b.y,now)) {
              const side=previousX<mill.x?-1:1;b.x=mill.x+side*12;b.vx=side*Math.max(Math.abs(b.vx)*.7,1);
            }
          }
          if (Math.hypot(b.x - course.hole.x, b.y - course.hole.y) < 15 && Math.hypot(b.vx, b.vy) < 8) {
            b.x = course.hole.x; b.y = course.hole.y; b.vx = b.vy = 0; busy.current = false; complete.current = true; setWon(true); setMoving(false); chime(880); break;
          }
        }
        b.vx *= Math.pow(.985, dt); b.vy *= Math.pow(.985, dt);
        if (Math.hypot(b.vx, b.vy) < .15 && Math.abs(slopeAcceleration(course,b.x))<.008) { b.vx = b.vy = 0; busy.current = false; setMoving(false); }
        if(now-lastUI>=33 || !busy.current) setPosition({ x: b.x, y: b.y });
      }
      if(now-lastUI>=33) lastUI=now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [level, sound]);
  useEffect(() => { if (won) setScores(s => ({ ...s, [level]: strokes })); }, [won, level, strokes]);
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  return <div className="app">
    <header><a className="brand" href="/" aria-label="Little Links home"><span className="brand-icon">⚑</span> little links<span className="brand-dot">®</span></a><nav><span className="edition">A LITTLE BREAK. A GREAT ROUND.</span><button className="icon-button" onClick={() => setSound(!sound)} aria-label={sound ? 'Mute sound' : 'Enable sound'}>{sound ? '♫' : '♪'}<span className={!sound ? 'muted-dot' : ''}/></button><button className="help-button" onClick={() => setHelp(true)}>?</button></nav></header>
    <main><div className="intro"><div><div className="eyebrow"><span/> THE EVERYDAY MINI GOLF CLUB</div><h1>Small course.<br/><em>Big little moments.</em></h1><p>A little focus. A little finesse. One more hole.</p></div><div className="round-mark"><span>TAKE IT EASY</span><b>⚑</b><span>MAKE IT COUNT</span></div></div>
    <div className="game-layout"><section className="game"><div className="game-top"><div className="hole-tag">HOLE {String(level + 1).padStart(2, '0')} <span>/ {courses.length}</span></div><span className="course-title">{course.name}{course.feature && <small className="feature-tag">{course.feature}</small>}</span><span className="par-tag">PAR {course.par}</span></div>
    <div className="course-scene"><div className="scene-label">THE GARDEN COLLECTION <span>↘</span></div>
    <Course3D live={live} level={level} position={position} angle={angle} power={power} moving={moving} won={won} onAim={delta => { if (busy.current || complete.current || showCourses || help) return; aim.current += delta; setAngle(aim.current); }} onCharge={start} onRelease={release} onCancel={() => { chargeStart.current = null; strength.current = 0; setCharging(false); setPower(0); }} />
    {won && <div className="win-panel"><span className="eyebrow">IN THE CUP!</span><h2>{strokes === 1 ? 'Hole in one!' : strokes < course.par ? 'Beautiful birdie.' : strokes === course.par ? 'Right on par.' : 'Nicely done.'}</h2><p>{strokes} {strokes === 1 ? 'stroke' : 'strokes'} · Par {course.par}</p><button className="primary" onClick={() => reset(level === courses.length - 1 ? 0 : level + 1)}>{level === courses.length - 1 ? 'Play another round' : 'Next hole'} <span>↗</span></button>{level === courses.length - 1 && <p>All {courses.length} holes complete · {total} total strokes</p>}</div>}
    </div><div className="game-bottom"><span><i className={moving ? 'status moving' : 'status'}/>{won ? 'A little victory' : moving ? 'Let it roll…' : charging ? 'Finding your strength…' : 'Your moment. Take your shot.'}</span><button onClick={() => reset(level)} title="Restart this hole">↻ <span>Restart hole</span></button></div></section>
    <aside><section className="score-card"><div className="eyebrow">YOUR ROUND <span>↗</span></div><div className="score-main"><div><b>{String(strokes).padStart(2, '0')}</b><span>STROKES</span></div><div className="par-box"><b>{course.par}</b><span>PAR</span></div></div><div className="round-progress"><span>Course progress</span><b>{Object.keys(scores).length} <span>/ {courses.length}</span></b></div><div className="progress-track"><div style={{ width: `${Object.keys(scores).length / courses.length * 100}%` }}/></div><div className="score-total"><span>Total strokes</span><b>{total + (won ? 0 : strokes)}</b></div><button className="outline" onClick={() => setShowCourses(true)}>Explore all {courses.length} holes <span>↗</span></button></section>
    <section className="power-card"><div className="eyebrow">A LITTLE POWER <span>ϟ</span></div><div className="power-label"><span>{charging ? 'Charging your shot' : 'Make it just enough.'}</span><b>{Math.round(power * 100)}<small>%</small></b></div><div className={`power-track ${charging ? 'active' : ''}`}><div style={{ width: `${power * 100}%` }}/>{[20,40,60,80].map(n => <i key={n} style={{ left: `${n}%` }}/>)}</div><div className="power-extents"><span>GENTLE TAP</span><span>FULL SEND</span></div><p>Hold <kbd>SPACE</kbd> or <span className="mouse-icon">▣</span> left click<br/>to build power. Release to putt.</p></section>
    <div className="tip"><span>✧</span><p>Good things take a little patience.<br/><b>The perfect putt is worth the pause.</b></p></div></aside></div>
    <div className="instructions"><span><b>01</b> Move left / right to aim</span><i/><span><b>02</b> Hold to build power</span><i/><span><b>03</b> Release. Roll. Repeat.</span><span className="keyboard-hint">← → to aim with your keyboard</span></div></main><footer><span>LESS SCROLL. MORE ROLL.</span><span>Made for the joy of a little game. <i>✳</i></span></footer>
    {(showCourses || help) && <div className="modal-backdrop" onClick={() => { setShowCourses(false); setHelp(false); }}><section className="modal" role="dialog" aria-modal="true" aria-label={help ? 'How to play' : 'Choose a hole'} onClick={e => e.stopPropagation()}><button className="close" onClick={() => { setShowCourses(false); setHelp(false); }} aria-label="Close">×</button><div className="eyebrow">LITTLE LINKS FIELD GUIDE</div><h2>{help ? 'Find your flow.' : `${courses.length} little adventures.`}</h2>{help ? <div className="help-copy"><p>You’re standing behind the ball. Move your pointer left or right to turn your view and aim, or use the arrow keys. On touchscreens, use the arrow buttons or slide your finger while charging. The camera follows the ball after every putt. Use the minimap to plan bank shots.</p><p>Hold <kbd>Space</kbd> or the left mouse button on the course to charge the strength bar. Release to putt. On a touchscreen, hold and release on the green.</p><p>Bank the ball off the wooden rails and get it into the cup in as few strokes as possible. A gentler shot is easier for the cup to catch. Hills slow uphill shots and accelerate downhill rolls. Time your putt through rotating windmill blades. New challenge holes start at hole 26.</p><button className="primary" onClick={() => setHelp(false)}>Let’s play ↗</button></div> : <div className="hole-grid">{courses.map((c,i) => <button key={i} className={level === i ? 'selected' : ''} onClick={() => reset(i)}><span>{String(i+1).padStart(2,'0')} {scores[i] !== undefined ? '✓' : '↗'}</span><b>{c.name}</b><small>{c.feature && <span className="hole-feature">{c.feature}</span>}PAR {c.par}{scores[i] !== undefined ? ` · ${scores[i]} STROKES` : ''}</small></button>)}</div>}</section></div>}
  </div>;
}
export default App;
