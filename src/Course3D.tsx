import { useEffect, useRef, type PointerEventHandler, type RefObject } from 'react';
import { courses } from './courses';
import { surfaceHeight, windmillAngle } from './terrain';
import { BALL_RADIUS, ballCenter, drawGolfBall } from './golfBall';
import { cameraPoint, clipNear, project, type Vec3, type Camera } from './perspective';

type Props = { live: { ball: RefObject<{ x: number; y: number }>; aim: RefObject<number>; strength: RefObject<number> }; level: number; position: { x: number; y: number }; angle: number; power: number; moving: boolean; won: boolean; onAim: (delta: number) => void; onCharge: () => void; onRelease: () => void; onCancel: () => void };
type Face = { vertices: Vec3[]; color: string; depth?: number; layer?: number; ball?: boolean };
const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
function box(faces: Face[], x: number, z: number, w: number, d: number, h: number, colors: string[], bottom = 0) {
  const a=v(x,bottom,z), b=v(x+w,bottom,z), c=v(x+w,bottom,z+d), e=v(x,bottom,z+d);
  const A=v(x,bottom+h,z), B=v(x+w,bottom+h,z), C=v(x+w,bottom+h,z+d), E=v(x,bottom+h,z+d);
  [[A,B,C,E],[a,b,B,A],[b,c,C,B],[c,e,E,C],[e,a,A,E]].forEach((vertices,i)=>faces.push({vertices,color:colors[i % colors.length]!}));
}
function disc(faces: Face[], x: number, z: number, radius: number, y: number, color: string) {
  faces.push({ color, vertices: Array.from({ length: 24 }, (_, i) => v(x+Math.cos(i*Math.PI/12)*radius,y,z+Math.sin(i*Math.PI/12)*radius)) });
}
function crown(faces: Face[], x: number, z: number, y: number, radius: number, colors: string[]) {
  for (let row=0;row<5;row++) for(let col=0;col<10;col++) {
    const point=(r:number,c:number)=>{const lat=r/5*Math.PI, lon=c/10*Math.PI*2;return v(x+Math.sin(lat)*Math.cos(lon)*radius,y+Math.cos(lat)*radius,z+Math.sin(lat)*Math.sin(lon)*radius);};
    faces.push({vertices:[point(row,col),point(row+1,col),point(row+1,col+1),point(row,col+1)],color:colors[(col+row*2)%colors.length]!});
  }
}
function buildCourseScene(level: number): Face[] {
  const c=courses[level]!;
  const faces:Face[]=[];
  // Separate terrain and green passes prevent coplanar depth sorting flicker.
  faces.push({vertices:[v(-3000,-4,-3000),v(3500,-4,-3000),v(3500,-4,3500),v(-3000,-4,3500)],color:'#a9bd8b',layer:-3});
  for(let x=114;x<706;x+=20) {
    const right=Math.min(x+20,706);
    faces.push({vertices:[v(x,0,106),v(right,0,106),v(right,0,490),v(x,0,490)],color:Math.floor((x-114)/40)%2?'#589768':'#609f70',layer:-2});
  }
  const wood=['#e5cc9e','#b49a72','#c7ab7e','#b69c73','#cbb28b'];
  box(faces,104,94,612,12,15,wood);box(faces,104,490,612,12,15,wood);box(faces,104,106,10,384,15,wood);box(faces,706,106,10,384,15,wood);
  for(const wall of c.walls)box(faces,wall.x,wall.y,wall.w,wall.h,23,wood);
  for(let i=0;i<18;i++){
    const x=i<9 ? -65+(i%9)*120 : -40+(i%9)*120;
    const z=i<9 ? -85-(i%3)*50 : 630+(i%3)*65;
    disc(faces,x+15,z+8,42,-3,'#90a77a');box(faces,x-5,z-5,10,10,61,['#8d7654','#776448']);crown(faces,x,z,86,37+(i%3)*9,['#63865b','#729363','#54794f','#6a8b59']);
  }
  disc(faces,c.hole.x,c.hole.y,24,.12,'#72aa76');disc(faces,c.hole.x,c.hole.y,12,.3,'#243d2d');disc(faces,c.hole.x,c.hole.y,8,.4,'#12291f');
  box(faces,c.hole.x-1,c.hole.y-1,2,2,96,['#f9f0cf','#d5d2bb']);
  faces.push({vertices:[v(c.hole.x,96,c.hole.y),v(c.hole.x+35,85,c.hole.y+5),v(c.hole.x,73,c.hole.y)],color:'#eb9465'});
  for(const mill of c.windmills??[]) {
    box(faces,mill.x-13,mill.z-48,26,10,60,['#efe0bc','#c4aa84','#d5bc94']);
    box(faces,mill.x-13,mill.z+38,26,10,60,['#efe0bc','#c4aa84','#d5bc94']);
    box(faces,mill.x-13,mill.z-48,26,96,16,['#ba795b','#975a44','#ab6b4d'],60);
  }
  for(const face of faces) if(face.layer===undefined && face.vertices.every(a=>a.y<1)) face.layer=-1;
  for(const face of faces) if(face.layer!==-3) for(const point of face.vertices) point.y+=surfaceHeight(c,point.x);
  return faces;
}
export function Course3D(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const latest = useRef(props); latest.current = props;
  const pointerX = useRef<number | null>(null);
  useEffect(() => {
    const el=canvas.current!, ctx=el.getContext('2d'); if(!ctx) return;
    let width=800,height=540,frame=0,last=performance.now();
    // Observe the CSS-sized wrapper. Updating the canvas backing store cannot resize it.
    let pendingSize: { width: number; height: number } | null = null;
    const observer=new ResizeObserver(entries=>{const r=entries[0]!.contentRect;pendingSize={width:r.width,height:r.height};});
    observer.observe(viewport.current!);
    const roll={x:0,z:0};
    let previousPosition={...latest.current.position}, previousLevel=latest.current.level;
    let cameraX=latest.current.position.x, cameraZ=latest.current.position.y, cameraYaw=latest.current.angle;
    let staticFaces:Face[]=[], sceneLevel=-1;
    let lastDraw={x:NaN,z:NaN,yaw:NaN,power:NaN,moving:false,won:false,width:0,height:0,level:-1};
    const render=(now:number)=>{
      if(pendingSize){width=Math.max(1,pendingSize.width);height=Math.max(1,pendingSize.height);pendingSize=null;}
      const ratio=Math.min(window.devicePixelRatio||1,2), pixelWidth=Math.round(width*ratio), pixelHeight=Math.round(height*ratio);
      if(el.width!==pixelWidth||el.height!==pixelHeight){el.width=pixelWidth;el.height=pixelHeight;ctx.setTransform(ratio,0,0,ratio,0,0);}
      const p={...latest.current,position:latest.current.live.ball.current,angle:latest.current.live.aim.current,power:latest.current.live.strength.current};
      const course=courses[p.level]!;
      const travel=Math.hypot(p.position.x-previousPosition.x,p.position.y-previousPosition.y);
      if(previousLevel!==p.level||travel>60){roll.x=roll.z=0;cameraX=p.position.x;cameraZ=p.position.y;cameraYaw=p.angle;}
      else {roll.x+=(p.position.y-previousPosition.y)/BALL_RADIUS;roll.z-=(p.position.x-previousPosition.x)/BALL_RADIUS;}
      previousPosition={...p.position};previousLevel=p.level;
      const elapsed=Math.min(now-last,50);last=now;
      const smoothing=1-Math.exp(-elapsed/35);
      cameraYaw+=(p.angle-cameraYaw)*(1-Math.exp(-elapsed/45));
      if(Math.abs(p.angle-cameraYaw)<.0001)cameraYaw=p.angle;
      cameraX+=(p.position.x-cameraX)*smoothing;cameraZ+=(p.position.y-cameraZ)*smoothing;
      if(Math.hypot(cameraX-p.position.x,cameraZ-p.position.y)<.001){cameraX=p.position.x;cameraZ=p.position.y;}
      if(!course.windmills?.length&&lastDraw.x===cameraX&&lastDraw.z===cameraZ&&lastDraw.yaw===cameraYaw&&lastDraw.power===p.power&&lastDraw.moving===p.moving&&lastDraw.won===p.won&&lastDraw.width===el.width&&lastDraw.height===el.height&&lastDraw.level===p.level){frame=requestAnimationFrame(render);return;}
      lastDraw={x:cameraX,z:cameraZ,yaw:cameraYaw,power:p.power,moving:p.moving,won:p.won,width:el.width,height:el.height,level:p.level};
      const camera:Camera={position:v(cameraX-Math.cos(cameraYaw)*47,65+surfaceHeight(course,cameraX),cameraZ-Math.sin(cameraYaw)*47),yaw:cameraYaw,pitch:.5};
      const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,'#accfd1');sky.addColorStop(.65,'#e5ead0');sky.addColorStop(1,'#d5dfbd');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
      ctx.fillStyle='#f9f2cf';ctx.beginPath();ctx.arc(width*.78,height*.12,22,0,Math.PI*2);ctx.fill();
      if(sceneLevel!==p.level){staticFaces=buildCourseScene(p.level);sceneLevel=p.level;}
      const faces:Face[]=[...staticFaces];
      for(const mill of course.windmills??[]) {
        const base=surfaceHeight(course,mill.x),angle=windmillAngle(mill,now);
        box(faces,mill.x-6,mill.z-6,12,12,12,['#d3b27c','#9d7c51'],base+36);
        for(let arm=0;arm<4;arm++) {
          const a=angle+arm*Math.PI/2;
          const blade=(radius:number,edge:number)=>v(mill.x-5,base+42+Math.sin(a)*radius+Math.cos(a)*edge,mill.z+Math.cos(a)*radius-Math.sin(a)*edge);
          faces.push({vertices:[blade(4,-4),blade(46,-4),blade(46,4),blade(4,4)],color:arm%2?'#ede3c3':'#cf8860'});
        }
      }
      const dynamicStart=faces.length;
      if(!p.won){
        for(let i=3;i>=0;i--) disc(faces,p.position.x+.6,p.position.y+1,8+i*1.6,.05+(3-i)*.01,['#356d4d','#3c7853','#45845a','#4d8c60'][i]!);
        faces.push({vertices:[ballCenter(p.position.x,p.position.y,surfaceHeight(course,p.position.x))],color:'',ball:true});
        if(!p.moving){
          for(let i=1;i<10;i++){const d=17+i*10;disc(faces,p.position.x+Math.cos(p.angle)*d,p.position.y+Math.sin(p.angle)*d,i===9?2:1.3,.6,'#e8e9b8');}
          // Putter head and shaft sit behind the ball in the player's hands.
          const back=10+p.power*14, px=p.position.x-Math.cos(p.angle)*back,pz=p.position.y-Math.sin(p.angle)*back;
          const sx=Math.sin(p.angle),sz=-Math.cos(p.angle),fx=Math.cos(p.angle),fz=Math.sin(p.angle);
          const points=[[-16,-3],[16,-3],[16,3],[-16,3]].map(([s,f])=>v(px+sx*s!+fx*f!,6,pz+sz*s!+fz*f!));
          faces.push({vertices:points,color:'#d7ddce'});faces.push({vertices:[points[0]!,points[1]!,v(points[1]!.x,2,points[1]!.z),v(points[0]!.x,2,points[0]!.z)],color:'#6c7b70'});
          faces.push({vertices:[v(px+sx*10,6,pz+sz*10),v(px+sx*12,6,pz+sz*12),v(px+sx*39-fx*25,70,pz+sz*39-fz*25),v(px+sx*37-fx*25,70,pz+sz*37-fz*25)],color:'#aebdaf'});
        }
      }
      // Coplanar decals and contact shadows belong above terrain and below objects.
      for(let i=dynamicStart;i<faces.length;i++){const face=faces[i]!;if(face.vertices.every(a=>a.y<1))face.layer=-1;if(!face.ball)for(const point of face.vertices)point.y+=surfaceHeight(course,point.x);}
      const visible=faces.map(face=>{const vertices=face.vertices.map(a=>cameraPoint(a,camera));return{...face,vertices,depth:vertices.reduce((s,a)=>s+a.z,0)/vertices.length};}).filter(f=>f.vertices.some(a=>a.z>2)).sort((a,b)=>(a.layer??0)-(b.layer??0)||b.depth-a.depth);
      for(const face of visible){if(face.ball){drawGolfBall(ctx,ballCenter(p.position.x,p.position.y,surfaceHeight(course,p.position.x)),camera,width,height,roll);continue;}const points=clipNear(face.vertices);if(points.length<3)continue;ctx.beginPath();points.forEach((a,i)=>{const point=project(a,width,height);if(i===0)ctx.moveTo(point.x,point.y);else ctx.lineTo(point.x,point.y);});ctx.closePath();ctx.fillStyle=face.color;ctx.fill();if((face.layer??0)<=-2){ctx.strokeStyle=face.color;ctx.lineWidth=.6;ctx.stroke();}}
      frame=requestAnimationFrame(render);
    };
    frame=requestAnimationFrame(render);return()=>{cancelAnimationFrame(frame);observer.disconnect();};
  },[]);
  const move:PointerEventHandler<HTMLCanvasElement>=e=>{
    if(pointerX.current!==null&&!props.moving&&!props.won)props.onAim((e.clientX-pointerX.current)*.006);
    pointerX.current=e.clientX;
  };
  return <div ref={viewport} className="three-view"><canvas ref={canvas} tabIndex={0} aria-label={`First person 3D mini golf, hole ${props.level+1}. Move horizontally or use arrow keys to turn. Hold Space or left click and release to putt.`} onPointerMove={move} onPointerLeave={()=>{pointerX.current=null;}} onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.focus();pointerX.current=e.clientX;e.currentTarget.setPointerCapture(e.pointerId);props.onCharge();}} onPointerUp={props.onRelease} onPointerCancel={props.onCancel}/><div className="view-label"><span/> FIRST PERSON <b>3D</b></div><div className="view-hint">{props.moving?'Following your putt…':props.won?'In the cup. Take it in.':courses[props.level]!.windmills?.length?'Time your putt through the windmill blades':courses[props.level]!.elevation?'Uphill takes power · Downhill takes a gentle touch':'Move left / right to look · Hold & release to putt'}</div><div className="mini-map"><span>THE GREEN</span><svg viewBox="90 80 640 440" aria-label="Course minimap"><rect x="104" y="94" width="612" height="408" rx="10" fill="#5c9366" stroke="#e6d6b8" strokeWidth="8"/>{courses[props.level]!.walls.map((w,i)=><rect key={i} x={w.x} y={w.y} width={w.w} height={w.h} fill="#e6d6b8"/>)}{courses[props.level]!.windmills?.map((mill,i)=><g key={`mill-${i}`} transform={`translate(${mill.x} ${mill.z})`}><circle r="24" fill="#e9b27a"/><path d="M-18 0H18M0-18V18" stroke="#71503c" strokeWidth="7"/></g>)}<circle cx={courses[props.level]!.hole.x} cy={courses[props.level]!.hole.y} r="13" fill="#f0a374"/><line x1={props.position.x} y1={props.position.y} x2={props.position.x+Math.cos(props.angle)*55} y2={props.position.y+Math.sin(props.angle)*55} stroke="#fff" strokeWidth="5"/><circle cx={props.position.x} cy={props.position.y} r="10" fill="#fff"/></svg></div><div className="touch-aim"><button aria-label="Aim left" onClick={()=>props.onAim(-.12)}>←</button><button aria-label="Aim right" onClick={()=>props.onAim(.12)}>→</button></div></div>;
}
