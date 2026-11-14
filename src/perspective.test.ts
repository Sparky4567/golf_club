import { expect, test } from 'bun:test';
import { cameraPoint, clipNear, project, type Camera } from './perspective';
const camera: Camera = { position: { x: -47, y: 65, z: 0 }, yaw: 0, pitch: .5 };
test('first-person camera keeps ball visible and aiming centered', () => {
  const ball = project(cameraPoint({ x: 0, y: 8, z: 0 }, camera), 800, 550);
  expect(ball.x).toBe(400);
  expect(ball.y).toBeGreaterThan(275);
  expect(ball.y).toBeLessThan(520);
  const target = cameraPoint({ x: 200, y: 0, z: 0 }, camera);
  expect(target.x).toBe(0);
  expect(cameraPoint({ x: 100, y: 0, z: 20 }, camera).x).toBeGreaterThan(0);
});
test('near plane clips crossing polygons and removes geometry behind camera', () => {
  expect(clipNear([{x:0,y:0,z:-4},{x:10,y:0,z:-2},{x:0,y:10,z:-3}])).toHaveLength(0);
  const clipped = clipNear([{x:0,y:0,z:-4},{x:10,y:0,z:10},{x:0,y:10,z:10}]);
  expect(clipped).toHaveLength(4);
  expect(clipped.every(p => p.z >= 2)).toBe(true);
  expect(clipped.every(p => Number.isFinite(project(p,800,550).x))).toBe(true);
});
