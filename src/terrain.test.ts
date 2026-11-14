import { expect, test } from 'bun:test';
import { courses } from './courses';
import { ballCenter, BALL_RADIUS } from './golfBall';
import { slopeAcceleration, surfaceHeight, windmillBlocks } from './terrain';

test('uphill slows shots, downhill accelerates them, and flat land has no gravity drift',()=>{
  const uphill=courses[30]!,downhill=courses[31]!;
  expect(slopeAcceleration(uphill,380)).toBeLessThan(0);
  expect(slopeAcceleration(downhill,380)).toBeGreaterThan(0);
  expect(slopeAcceleration(courses[0]!,380)).toBeCloseTo(0);
  const simulate=(course:typeof uphill)=>{let x=300,velocity=3;for(let i=0;i<20;i++){velocity+=slopeAcceleration(course,x);x+=velocity;velocity*=.985;}return velocity;};
  expect(simulate(uphill)).toBeLessThan(simulate(courses[0]!));
  expect(simulate(downhill)).toBeGreaterThan(simulate(courses[0]!));
});
test('all elevated courses have continuous heights, flat tees and cups, and grounded balls',()=>{
  for(const course of courses.filter(c=>c.elevation)){
    expect(Math.abs(slopeAcceleration(course,course.start.x))).toBeLessThan(.008);
    expect(Math.abs(slopeAcceleration(course,course.hole.x))).toBeLessThan(.008);
    for(let x=114;x<=706;x+=2){
      const height=surfaceHeight(course,x);
      expect(Number.isFinite(height)).toBe(true);
      expect(Math.abs(height-surfaceHeight(course,x+.01))).toBeLessThan(.02);
      expect(ballCenter(x,300,height).y-BALL_RADIUS).toBeCloseTo(height);
    }
  }
});
test('each windmill alternates between open and blocked shots through its center',()=>{
  for(const course of courses)for(const mill of course.windmills??[]){
    const states=new Set(Array.from({length:100},(_,i)=>windmillBlocks(mill,mill.z,i*100)));
    expect(states.has(true)).toBe(true);
    expect(states.has(false)).toBe(true);
    expect(windmillBlocks(mill,mill.z+80,0)).toBe(false);
  }
});
