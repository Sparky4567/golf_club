import type { Course, Windmill } from './courses';

export function surfaceHeight(course: Course, x: number): number {
  const points=course.elevation;
  if(!points?.length) return 0;
  if(x<=points[0]![0]) return points[0]![1];
  for(let i=1;i<points.length;i++) {
    const [end,height]=points[i]!,[start,previous]=points[i-1]!;
    if(x<=end){const t=(x-start)/(end-start);return previous+(height-previous)*t*t*(3-2*t);}
  }
  return points[points.length-1]![1];
}
export function slopeAcceleration(course: Course, x: number): number {
  return -(surfaceHeight(course,x+.5)-surfaceHeight(course,x-.5))*.32;
}
export function windmillAngle(mill: Windmill, time: number): number {
  return time*.001*mill.speed+mill.phase;
}
export function windmillBlocks(mill: Windmill, z: number, time: number, radius=8): boolean {
  const angle=windmillAngle(mill,time), lateral=z-mill.z, vertical=8-42;
  const u=lateral*Math.cos(angle)+vertical*Math.sin(angle);
  const w=-lateral*Math.sin(angle)+vertical*Math.cos(angle);
  return (Math.abs(u)<46+radius&&Math.abs(w)<4+radius)||(Math.abs(w)<46+radius&&Math.abs(u)<4+radius);
}
