export type Vec3 = { x: number; y: number; z: number };
export type Camera = { position: Vec3; yaw: number; pitch: number };
export function cameraPoint(p: Vec3, camera: Camera): Vec3 {
  const x = p.x - camera.position.x, y = p.y - camera.position.y, z = p.z - camera.position.z;
  const forward = x * Math.cos(camera.yaw) + z * Math.sin(camera.yaw);
  return { x: -x * Math.sin(camera.yaw) + z * Math.cos(camera.yaw), y: y * Math.cos(camera.pitch) + forward * Math.sin(camera.pitch), z: forward * Math.cos(camera.pitch) - y * Math.sin(camera.pitch) };
}
export function clipNear(points: Vec3[], near = 2): Vec3[] {
  const result: Vec3[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!, b = points[(i + 1) % points.length]!;
    if (a.z >= near) result.push(a);
    if ((a.z >= near) !== (b.z >= near)) {
      const t = (near - a.z) / (b.z - a.z);
      result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: near });
    }
  }
  return result;
}
export function project(p: Vec3, width: number, height: number) {
  const focal = height * .85;
  return { x: width / 2 + p.x * focal / p.z, y: height * .47 - p.y * focal / p.z };
}
