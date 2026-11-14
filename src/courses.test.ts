import { expect, test } from 'bun:test';
import { courses } from './courses';

test('40 distinct courses have clear tees, cups, and a playable route', () => {
  expect(courses).toHaveLength(40);
  expect(new Set(courses.map(c => JSON.stringify([c.start, c.hole, c.walls, c.elevation, c.windmills]))).size).toBe(40);
  for (const course of courses) {
    const clear = (x: number, y: number) => x >= 125 && x <= 695 && y >= 125 && y <= 475 && !course.walls.some(w => x > w.x - 10 && x < w.x + w.w + 10 && y > w.y - 10 && y < w.y + w.h + 10);
    expect(clear(course.start.x, course.start.y)).toBe(true);
    expect(clear(course.hole.x, course.hole.y)).toBe(true);
    const queue = [[course.start.x, course.start.y]];
    const seen = new Set<string>();
    let reached = false;
    for (let n = 0; n < queue.length; n++) {
      const [x, y] = queue[n]! as [number, number];
      if (Math.hypot(x - course.hole.x, y - course.hole.y) < 12) { reached = true; break; }
      for (const [dx, dy] of [[5,0],[-5,0],[0,5],[0,-5]]) {
        const nx = x + dx!, ny = y + dy!, key = `${nx},${ny}`;
        if (clear(nx, ny) && !seen.has(key)) { seen.add(key); queue.push([nx, ny]); }
      }
    }
    expect(reached).toBe(true);
  }
});
