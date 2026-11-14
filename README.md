# Little Links

A first-person 3D miniature golf game built with Bun, React, and TypeScript. Take a little break and play 40 holes, from quiet garden greens to narrow passages, rotating windmills, and rolling hills.

## Getting started

Install [Bun](https://bun.com), then run:

```bash
bun install
bun run dev
```

Open the local URL printed by the server (normally `http://localhost:3000`).

## How to play

- Move the mouse left or right, or use the arrow keys, to aim.
- Hold **Space** or the **left mouse button** on the course to charge the strength bar. Release to putt.
- On touchscreens, hold and release on the course; slide to aim or use the on-screen arrow buttons.
- Use the minimap to plan bank shots around obstacles.
- Uphill shots lose speed; downhill shots accelerate. Time shots to pass between rotating windmill blades.
- Get the ball into the cup in as few strokes as possible. Select **Next hole** after completing a hole.
- Use **Explore all 40 holes** to jump to any course, **Restart hole** to retry, and **?** for instructions.

The original garden holes are 1–25. Holes 26–40 add narrow passages, windmills, hills, and combined challenges. Round scores are kept in memory and reset when the page reloads.

## Development

```bash
# Development server with hot reload
bun run dev

# Check TypeScript
bunx tsc --noEmit

# Run the test suite
bun test

# Build static browser assets into dist/
bun run build

# Run the Bun server in production mode
bun run start
```

The production server serves the HTML entry through Bun; the separate `dist/` build can also be deployed to a static host.

## Project structure

| File | Purpose |
| --- | --- |
| `src/App.tsx` | Game state, shot controls, physics, scoring, and interface |
| `src/Course3D.tsx` | Canvas-based 3D renderer, camera, and minimap |
| `src/courses.ts` | Layouts and obstacle definitions for all 40 holes |
| `src/terrain.ts` | Elevation, slope forces, and windmill collision helpers |
| `src/perspective.ts` | Camera transforms, projection, and near-plane clipping |
| `src/golfBall.ts` | Shaded spherical ball and rolling dimples |
| `src/index.css` | Responsive interface styles |
| `src/index.ts` | Bun HTTP server |

Rendering uses the browser's Canvas 2D API to project 3D geometry, without an additional 3D engine. Sound uses the Web Audio API. Google Fonts supplies the interface typefaces, with local font fallbacks when unavailable.

Tests cover course connectivity, perspective clipping, ball placement, slope forces, and windmill opening cycles.

## License

[MIT](LICENSE) © 2026 Little Links contributors.
# golf_club
