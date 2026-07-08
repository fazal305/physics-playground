let canvas;
let engine;
let renderer;
let lastTimestamp = 0;
let fps = 0;
let hoveredBody = null;

const appState = {
  tool: "spawn",
  shape: "circle",
  spawnSize: 30,
  spawnMass: 1,
  spawnColor: "#00f5ff",
  spawnRestitution: 0.6,
  gravityOn: true,
  frictionOn: true,
  isPaused: false,
  selectedBody: null,
  dragState: {
    isDragging: false,
    body: null,
    offsetX: 0,
    offsetY: 0,
    history: []
  }
};

function init() {
  canvas = document.getElementById("physics-canvas");
  resizeCanvas();

  engine = new PhysicsEngine({
    gravity: true,
    friction: true,
    bounds: {
      width: canvas.width,
      height: canvas.height
    }
  });

  renderer = new Renderer(canvas);

  bindToolbarEvents();
  bindCanvasEvents();

  window.addEventListener("resize", resizeCanvas);
  requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width;
  canvas.height = rect.height;

  if (engine) {
    engine.bounds.width = canvas.width;
    engine.bounds.height = canvas.height;
  }
}

function gameLoop(timestamp) {
  const dt = lastTimestamp ? (timestamp - lastTimestamp) / 1000 : 0;
  lastTimestamp = timestamp;

  fps = dt > 0 ? Math.round(1 / dt) : 0;

  engine.gravity = appState.gravityOn;
  engine.friction = appState.frictionOn;
  engine.isPaused = appState.isPaused;

  engine.step(dt);

  renderer.clear();
  renderer.drawWalls();
  renderer.drawGround();

  engine.bodies.forEach(function (body) {
    renderer.drawBody(body, body === appState.selectedBody || body === hoveredBody);
  });

  renderer.drawStats({
    fps: fps,
    count: engine.bodies.filter(function (body) {
      return !body.isStatic;
    }).length
  });

  updateInfoPanel(appState.selectedBody);
  requestAnimationFrame(gameLoop);
}

function bindToolbarEvents() {
  document.querySelectorAll(".tool-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      setActiveButton(".tool-btn", button);
      appState.tool = button.dataset.tool;
    });
  });

  document.querySelectorAll(".shape-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      setActiveButton(".shape-btn", button);
      appState.shape = button.dataset.shape;
    });
  });

  document.getElementById("size-slider").addEventListener("input", function (event) {
    appState.spawnSize = Number(event.target.value);
  });

  document.getElementById("mass-slider").addEventListener("input", function (event) {
    appState.spawnMass = Number(event.target.value);
  });

  document.getElementById("bounce-slider").addEventListener("input", function (event) {
    appState.spawnRestitution = Number(event.target.value);
  });

  document.querySelectorAll(".color-swatch").forEach(function (button) {
    button.addEventListener("click", function () {
      setActiveButton(".color-swatch", button);
      appState.spawnColor = button.dataset.color;
    });
  });

  document.getElementById("gravity-toggle").addEventListener("click", function (event) {
    appState.gravityOn = !appState.gravityOn;
    event.target.classList.toggle("active", appState.gravityOn);
    event.target.textContent = appState.gravityOn ? "Gravity ON" : "Gravity OFF";
  });

  document.getElementById("friction-toggle").addEventListener("click", function (event) {
    appState.frictionOn = !appState.frictionOn;
    event.target.classList.toggle("active", appState.frictionOn);
    event.target.textContent = appState.frictionOn ? "Friction ON" : "Friction OFF";
  });

  document.getElementById("pause-btn").addEventListener("click", function (event) {
    appState.isPaused = !appState.isPaused;
    event.target.textContent = appState.isPaused ? "Resume" : "Pause";
  });

  document.getElementById("clear-btn").addEventListener("click", function () {
    if (confirm("Clear all objects?")) {
      engine.clearBodies();
      appState.selectedBody = null;
    }
  });

  document.getElementById("reset-camera-btn").addEventListener("click", resizeCanvas);
}

function setActiveButton(selector, activeButton) {
  document.querySelectorAll(selector).forEach(function (button) {
    button.classList.toggle("active", button === activeButton);
  });
}

function bindCanvasEvents() {
  canvas.addEventListener("click", handleCanvasClick);
  canvas.addEventListener("mousedown", handleCanvasMouseDown);
  canvas.addEventListener("mousemove", handleCanvasMouseMove);
  window.addEventListener("mouseup", handleCanvasMouseUp);

  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
  window.addEventListener("touchend", handleCanvasMouseUp);
}

function handleCanvasClick(event) {
  const mouse = getCanvasPoint(event);

  if (appState.tool === "spawn") {
    createSpawnBody(mouse.x, mouse.y);
  }

  if (appState.tool === "delete") {
    const body = findBodyAtPoint(mouse.x, mouse.y);

    if (body) {
      engine.removeBody(body.id);
      appState.selectedBody = null;
    }
  }
}

function handleCanvasMouseDown(event) {
  if (appState.tool !== "drag") return;

  const mouse = getCanvasPoint(event);
  const body = findBodyAtPoint(mouse.x, mouse.y);

  if (!body) return;

  appState.selectedBody = body;
  body.isDragging = true;
  body.velocity = Vec2.zero();

  appState.dragState = {
    isDragging: true,
    body: body,
    offsetX: mouse.x - body.position.x,
    offsetY: mouse.y - body.position.y,
    history: [{ position: new Vec2(mouse.x, mouse.y), time: performance.now() }]
  };
}

function handleCanvasMouseMove(event) {
  const mouse = getCanvasPoint(event);
  hoveredBody = findBodyAtPoint(mouse.x, mouse.y);

  if (!appState.dragState.isDragging) return;

  const body = appState.dragState.body;

  body.position = new Vec2(
    mouse.x - appState.dragState.offsetX,
    mouse.y - appState.dragState.offsetY
  );

  appState.dragState.history.push({
    position: new Vec2(mouse.x, mouse.y),
    time: performance.now()
  });

  if (appState.dragState.history.length > 6) {
    appState.dragState.history.shift();
  }
}

function handleCanvasMouseUp() {
  if (!appState.dragState.isDragging) return;

  const body = appState.dragState.body;
  const history = appState.dragState.history;

  body.isDragging = false;

  if (history.length >= 2) {
    const first = history[0];
    const last = history[history.length - 1];
    const dt = Math.max((last.time - first.time) / 1000, 0.016);

    body.velocity = last.position.sub(first.position).scale(1 / dt);
  }

  appState.dragState.isDragging = false;
  appState.dragState.body = null;
}

function handleTouchStart(event) {
  event.preventDefault();
  const touch = event.touches[0];

  handleCanvasMouseDown({
    clientX: touch.clientX,
    clientY: touch.clientY
  });
}

function handleTouchMove(event) {
  event.preventDefault();
  const touch = event.touches[0];

  handleCanvasMouseMove({
    clientX: touch.clientX,
    clientY: touch.clientY
  });
}

function createSpawnBody(x, y) {
  const size = appState.spawnSize;

  const body = new Body({
    shape: appState.shape,
    position: new Vec2(x, y),
    velocity: new Vec2((Math.random() - 0.5) * 80, -40),
    mass: appState.spawnMass,
    radius: size,
    width: size * 2,
    height: size * 2,
    color: appState.spawnColor,
    restitution: appState.spawnRestitution
  });

  engine.addBody(body);
  appState.selectedBody = body;
}

function findBodyAtPoint(x, y) {
  for (let i = engine.bodies.length - 1; i >= 0; i--) {
    const body = engine.bodies[i];
    const bounds = body.getBounds();

    if (
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height
    ) {
      return body;
    }
  }

  return null;
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function updateInfoPanel(body) {
  const movingBodies = engine.bodies.filter(function (item) {
    return !item.isStatic;
  });

  const totalKineticEnergy = movingBodies.reduce(function (sum, item) {
    return sum + 0.5 * item.mass * Math.pow(item.velocity.magnitude(), 2);
  }, 0);

  document.getElementById("sim-stats").innerHTML = `
    <div class="stat-line"><span class="stat-label">FPS</span><span class="stat-value">${fps}</span></div>
    <div class="stat-line"><span class="stat-label">Objects</span><span class="stat-value">${movingBodies.length}</span></div>
    <div class="stat-line"><span class="stat-label">Total KE</span><span class="stat-value">${totalKineticEnergy.toFixed(1)}</span></div>
  `;

  if (!body) {
    document.getElementById("body-stats").textContent = "No object selected.";
    return;
  }

  const kineticEnergy = 0.5 * body.mass * Math.pow(body.velocity.magnitude(), 2);

  document.getElementById("body-stats").innerHTML = `
    <div class="stat-line"><span class="stat-label">Shape</span><span class="stat-value">${body.shape}</span></div>
    <div class="stat-line"><span class="stat-label">Mass</span><span class="stat-value">${body.mass}</span></div>
    <div class="stat-line"><span class="stat-label">Position</span><span class="stat-value">${formatVec(body.position)}</span></div>
    <div class="stat-line"><span class="stat-label">Velocity</span><span class="stat-value">${formatVec(body.velocity)}</span></div>
    <div class="stat-line"><span class="stat-label">Kinetic E</span><span class="stat-value">${kineticEnergy.toFixed(1)}</span></div>
  `;
}

function formatVec(vector) {
  return `(${vector.x.toFixed(1)}, ${vector.y.toFixed(1)})`;
}

document.addEventListener("DOMContentLoaded", init);
