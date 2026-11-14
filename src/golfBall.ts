import { cameraPoint, project, type Camera, type Vec3 } from './perspective';

export const BALL_RADIUS = 8;
export function ballCenter(x: number, z: number, height = 0): Vec3 {
  // The bottom of the sphere touches the green at y = 0.
  return { x, y: height + BALL_RADIUS, z };
}
export function ballProjection(center: Vec3, camera: Camera, width: number, height: number) {
  const point = cameraPoint(center, camera);
  if (point.z <= BALL_RADIUS + 2) return null;
  return { ...project(point, width, height), radius: height * .85 * BALL_RADIUS / Math.sqrt(point.z ** 2 - BALL_RADIUS ** 2) };
}

const DIMPLES = Array.from({length:150},(_,i)=>{
  const y=1-2*(i+.5)/150, ring=Math.sqrt(1-y*y), angle=i*Math.PI*(3-Math.sqrt(5));
  return {x:Math.cos(angle)*ring,y,z:Math.sin(angle)*ring};
});

export function drawGolfBall(ctx: CanvasRenderingContext2D, center: Vec3, camera: Camera, width: number, height: number, roll: { x: number; z: number }) {
  const screen = ballProjection(center, camera, width, height);
  if (!screen) return;
  const { x, y, radius: r } = screen;
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
  const light = ctx.createRadialGradient(x-r*.35, y-r*.4, r*.03, x+r*.2, y+r*.3, r*1.2);
  light.addColorStop(0, '#ffffff'); light.addColorStop(.4, '#fafbf3'); light.addColorStop(.75, '#dce3d5'); light.addColorStop(1, '#94a58f');
  ctx.fillStyle = light; ctx.fillRect(x-r, y-r, r*2, r*2);
  // Evenly spaced dimples lie on the sphere, rotate as it rolls, and shrink at the rim.
  const origin = cameraPoint(center, camera), distance=Math.hypot(origin.x,origin.y,origin.z);
  const cosX=Math.cos(roll.x),sinX=Math.sin(roll.x),cosZ=Math.cos(roll.z),sinZ=Math.sin(roll.z);
  for (const {x:nx,y:ny,z:nz} of DIMPLES) {
    const ry=ny*cosX-nz*sinX, rz=ny*sinX+nz*cosX;
    const normal = { x:nx*cosZ-ry*sinZ, y:nx*sinZ+ry*cosZ, z:rz };
    const surface = cameraPoint({ x:center.x+normal.x*BALL_RADIUS, y:center.y+normal.y*BALL_RADIUS, z:center.z+normal.z*BALL_RADIUS }, camera);
    const dx=surface.x-origin.x, dy=surface.y-origin.y, dz=surface.z-origin.z;
    const facing=-(dx*origin.x+dy*origin.y+dz*origin.z)/(BALL_RADIUS*distance);
    if(facing<.15) continue;
    const d=project(surface,width,height), size=r*.065;
    ctx.save(); ctx.translate(d.x,d.y); ctx.rotate(Math.atan2(d.y-y,d.x-x));
    const shade=ctx.createLinearGradient(-size,0,size,0); shade.addColorStop(0,'rgba(102,122,99,.28)'); shade.addColorStop(.55,'rgba(173,187,163,.18)'); shade.addColorStop(1,'rgba(255,255,255,.65)');
    ctx.fillStyle=shade; ctx.beginPath(); ctx.ellipse(0,0,Math.max(.2,size*facing),size,0,0,Math.PI*2); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
