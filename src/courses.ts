export type Wall = { x: number; y: number; w: number; h: number };
export const names = ['First light', 'Around the bend', 'Split decision', 'The gatekeeper', 'Double trouble', 'Quiet corners', 'The long way', 'Through the middle', 'Cross country', 'Little detour', 'Switchback', 'Narrow escape', 'The courtyard', 'Sidewinder', 'Three wishes', 'The corridor', 'Zig & zag', 'Off the wall', 'The crossing', 'Thread the needle', 'Secret garden', 'The labyrinth', 'Final approach', 'Almost home', 'The grand finale'];
export type Windmill = { x: number; z: number; speed: number; phase: number };
export type Course = { name: string; par: number; start: {x:number;y:number}; hole: {x:number;y:number}; walls: Wall[]; elevation?: [number, number][]; windmills?: Windmill[]; feature?: string };
export const courses: Course[] = names.map((name, i) => {
  const layouts: Wall[][] = [
    [],
    [{ x: 375, y: 175, w: 34, h: 230 }],
    [{ x: 315, y: 110, w: 32, h: 200 }, { x: 500, y: 310, w: 32, h: 180 }],
    [{ x: 390, y: 110, w: 34, h: 150 }, { x: 390, y: 355, w: 34, h: 135 }],
    [{ x: 285, y: 240, w: 140, h: 30 }, { x: 470, y: 345, w: 130, h: 30 }],
  ];
  const tier = Math.floor(i / 5);
  let walls = layouts[i % 5]!.map(w => ({ ...w }));
  if (tier > 0) walls.push({ x: 240 + tier * 27, y: 155 + (i % 3) * 85, w: 80, h: 25 });
  if (tier > 1) walls.push({ x: 565, y: 200 + (i % 2) * 190, w: 28, h: 100 });
  if (tier > 2) walls.push({ x: 220, y: 340, w: 30, h: 105 });
  return { name, par: 2 + Math.ceil(walls.length / 2), start: { x: 175, y: 405 - (i % 3) * 30 }, hole: { x: 635, y: 190 + (i % 4) * 65 }, walls };
});


const gate = (x: number, z: number, gap: number): Wall[] => [
  {x,y:110,w:24,h:z-gap/2-110},
  {x,y:z+gap/2,w:24,h:490-z-gap/2},
];
const additions: Course[] = [
  {name:'The squeeze',par:3,start:{x:175,y:300},hole:{x:635,y:300},walls:[...gate(320,300,42),...gate(510,300,38)],feature:'Narrow passages'},
  {name:'Needle & thread',par:4,start:{x:175,y:375},hole:{x:635,y:220},walls:[...gate(290,375,44),...gate(445,220,42),...gate(560,220,38)],feature:'Narrow passages'},
  {name:'Ribbon road',par:4,start:{x:175,y:410},hole:{x:635,y:190},walls:[...gate(280,390,40),...gate(430,300,40),...gate(570,200,40)],feature:'Narrow passages'},
  {name:'The windmill',par:3,start:{x:175,y:300},hole:{x:635,y:300},walls:gate(400,300,76),windmills:[{x:412,z:300,speed:.8,phase:0}],feature:'Moving windmill'},
  {name:'Double Dutch',par:4,start:{x:175,y:300},hole:{x:635,y:300},walls:[...gate(300,300,76),...gate(500,300,76)],windmills:[{x:312,z:300,speed:.65,phase:0},{x:512,z:300,speed:-.95,phase:.6}],feature:'Two windmills'},
  {name:'Uphill promise',par:3,start:{x:175,y:300},hole:{x:635,y:300},walls:[],elevation:[[114,0],[230,0],[530,70],[706,70]],feature:'Uphill'},
  {name:'Downhill daydream',par:2,start:{x:175,y:300},hole:{x:635,y:300},walls:[],elevation:[[114,75],[230,75],[530,0],[706,0]],feature:'Downhill'},
  {name:'Over the crest',par:4,start:{x:175,y:300},hole:{x:635,y:300},walls:gate(430,300,60),elevation:[[114,0],[220,0],[390,65],[560,0],[706,0]],feature:'Uphill & downhill'},
  {name:'Valley venture',par:4,start:{x:175,y:360},hole:{x:635,y:240},walls:gate(410,300,65),elevation:[[114,65],[220,65],[400,0],[570,65],[706,65]],feature:'Downhill & uphill'},
  {name:'High wire',par:4,start:{x:175,y:300},hole:{x:635,y:300},walls:[...gate(300,300,38),...gate(500,300,38)],elevation:[[114,0],[230,0],[420,55],[570,55],[706,55]],feature:'Narrow uphill'},
  {name:'Wind on the ridge',par:4,start:{x:175,y:300},hole:{x:635,y:300},walls:gate(400,300,76),windmills:[{x:412,z:300,speed:.9,phase:.3}],elevation:[[114,0],[220,0],[360,50],[480,50],[590,0],[706,0]],feature:'Windmill & hills'},
  {name:'The alpine pass',par:5,start:{x:175,y:400},hole:{x:635,y:200},walls:[...gate(290,380,44),...gate(490,220,44)],elevation:[[114,0],[220,0],[420,80],[570,25],[706,25]],feature:'Narrow mountain pass'},
  {name:'Rolling country',par:4,start:{x:175,y:300},hole:{x:635,y:300},walls:[],elevation:[[114,0],[220,0],[320,42],[420,0],[520,42],[610,0],[706,0]],feature:'Rolling hills'},
  {name:'Clockwork garden',par:5,start:{x:175,y:300},hole:{x:635,y:300},walls:[...gate(270,300,76),...gate(420,300,76),...gate(560,300,76)],windmills:[{x:282,z:300,speed:.75,phase:0},{x:432,z:300,speed:-1,phase:.5},{x:572,z:300,speed:1.2,phase:1}],feature:'Three windmills'},
  {name:'Summit showdown',par:6,start:{x:175,y:380},hole:{x:635,y:220},walls:[...gate(280,380,42),...gate(420,300,76),...gate(560,220,38)],windmills:[{x:432,z:300,speed:1,phase:.7}],elevation:[[114,0],[220,0],[370,65],[480,65],[600,15],[706,15]],feature:'The ultimate challenge'},
];
courses.push(...additions);
