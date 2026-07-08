# Physics Playground

An interactive browser-based physics sandbox built with HTML5 Canvas, CSS, and vanilla JavaScript.

## Live Demo

https://fazal305.github.io/physics-playground/

## Project Overview

Physics Playground lets users spawn, drag, throw, delete, and inspect simulated objects directly inside the browser. It includes a custom physics engine, vector math helpers, canvas rendering, collision handling, gravity, friction, restitution controls, and real-time simulation stats.

The project is built without a framework or build step, making it easy to run from a static host such as GitHub Pages.

## Features

- Custom JavaScript physics engine
- Circle, rectangle, and triangle bodies
- Gravity and friction toggles
- Adjustable size, mass, and bounce
- Color selection for spawned objects
- Spawn, drag, throw, and delete tools
- Boundary collision handling
- Object-to-object collision detection
- Real-time FPS, object count, and kinetic energy stats
- Selected object position, velocity, mass, and energy display
- Canvas rendering with selection and hover highlights
- Responsive toolbar and info panel

## Built With

- HTML5
- CSS3
- Vanilla JavaScript
- HTML5 Canvas API

## Physics Concepts Practiced

- Vector addition, subtraction, scaling, and normalization
- Delta time based animation
- Euler integration
- Velocity and acceleration
- Gravity and friction
- Restitution and boundary reflection
- AABB-style hit testing
- Collision response
- Kinetic energy calculation

## Project Structure

```text
physics-playground/
|-- index.html
|-- physics-styles.css
|-- physics-vectors.js
|-- physics-bodies.js
|-- physics-engine.js
|-- physics-renderer.js
|-- physics-app.js
|-- README.md
|-- LICENSE
```

## How To Use

1. Open the live demo or `index.html`.
2. Choose a tool: Spawn, Drag, or Delete.
3. Choose a shape and tune size, mass, bounce, and color.
4. Click the canvas to spawn objects.
5. Switch to Drag to throw bodies around the canvas.
6. Watch the stats panel update in real time.

## Future Improvements

- Zoom and pan controls
- Object rotation
- Polygon collisions
- Constraint joints
- Spring physics
- Scene save/load
- Touch gesture improvements
- Preset simulation scenes

## Author

Fazal Abbas

- GitHub: https://github.com/fazal305
- LinkedIn: https://www.linkedin.com/in/fazal-abbas-4653dg86

## License

This project is licensed under the MIT License.
