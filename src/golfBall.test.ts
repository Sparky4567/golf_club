import { expect, test } from 'bun:test';
import { BALL_RADIUS, ballCenter, ballProjection } from './golfBall';
import type { Camera } from './perspective';

test('ball touches the green without penetrating it at every course position', () => {
  for (const [x, z] of [[122,122],[175,405],[635,190],[698,478]]) {
    const center=ballCenter(x!,z!);
    expect(center.y-BALL_RADIUS).toBe(0);
    expect(center.y+BALL_RADIUS).toBe(16);
  }
});
test('sphere remains round, visible, and consistently sized while turning around it', () => {
  for (let i=0;i<16;i++) {
    const yaw=i*Math.PI/8;
    const camera:Camera={position:{x:300-Math.cos(yaw)*47,y:65,z:300-Math.sin(yaw)*47},yaw,pitch:.5};
    const ball=ballProjection(ballCenter(300,300),camera,800,550)!;
    expect(ball).not.toBeNull();
    expect(ball.x).toBeCloseTo(400);
    expect(ball.radius).toBeGreaterThan(40);
    expect(ball.radius).toBeLessThan(60);
    expect(ball.y+ball.radius).toBeLessThan(550);
  }
});
test('sphere shrinks with distance and is culled behind the camera', () => {
  const camera:Camera={position:{x:0,y:8,z:0},yaw:0,pitch:0};
  const near=ballProjection(ballCenter(50,0),camera,800,550)!;
  const far=ballProjection(ballCenter(100,0),camera,800,550)!;
  expect(near.radius).toBeGreaterThan(far.radius);
  expect(ballProjection(ballCenter(-50,0),camera,800,550)).toBeNull();
});
