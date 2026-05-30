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

// Starts the app.
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

// Keeps the canvas matching the visible screen size.
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width;
  canvas.height = rect.height;

  if (engine) {
    engine.bounds.width = canvas.width;
    engine.bounds.height = canvas.height;
  }
}

// Runs the animation loop.
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

  engine.bodies.forEach((body) => {
    renderer.drawBody(body, body === appState.selectedBody || body === hoveredBody);
  });

  renderer.drawStats({
    fps,
    count: engine.bodies.filter((body) => !body.isStatic).length
  });

  updateInfoPanel(appState.selectedBody);
  requestAnimationFrame(gameLoop);
}

// Connects toolbar buttons and inputs.
function bindToolbarEvents() {
  $(".tool-btn").on("click", function () {
    $(".tool-btn").removeClass("active");
    $(this).addClass("active");
    appState.tool = $(this).data("tool");
  });

  $(".shape-btn").on("click", function () {
    $(".shape-btn").removeClass("active");
    $(this).addClass("active");
    appState.shape = $(this).data("shape");
  });

  $("#size-slider").on("input", function () {
    appState.spawnSize = Number($(this).val());
  });

  $("#mass-slider").on("input", function () {
    appState.spawnMass = Number($(this).val());
  });

  $("#bounce-slider").on("input", function () {
    appState.spawnRestitution = Number($(this).val());
  });

  $(".color-swatch").on("click", function () {
    $(".color-swatch").removeClass("active");
    $(this).addClass("active");
    appState.spawnColor = $(this).data("color");
  });

  $("#gravity-toggle").on("click", function () {
    appState.gravityOn = !appState.gravityOn;
    $(this).toggleClass("active", appState.gravityOn);
    $(this).text(appState.gravityOn ? "Gravity ON" : "Gravity OFF");
  });

  $("#friction-toggle").on("click", function () {
    appState.frictionOn = !appState.frictionOn;
    $(this).toggleClass("active", appState.frictionOn);
    $(this).text(appState.frictionOn ? "Friction ON" : "Friction OFF");
  });

  $("#pause-btn").on("click", function () {
    appState.isPaused = !appState.isPaused;
    $(this).text(appState.isPaused ? "Resume" : "Pause");
  });

  $("#clear-btn").on("click", function () {
    if (confirm("Clear all objects?")) {
      engine.clearBodies();
      appState.selectedBody = null;
    }
  });

  $("#reset-camera-btn").on("click", function () {
    resizeCanvas();
  });
}

// Connects canvas mouse events.
function bindCanvasEvents() {
  canvas.addEventListener("click", handleCanvasClick);
  canvas.addEventListener("mousedown", handleCanvasMouseDown);
  canvas.addEventListener("mousemove", handleCanvasMouseMove);
  window.addEventListener("mouseup", handleCanvasMouseUp);

  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
  window.addEventListener("touchend", handleCanvasMouseUp);
}

// Handles spawning and deleting.
function handleCanvasClick(e) {
  const mouse = getCanvasPoint(e);

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

// Starts dragging a body.
function handleCanvasMouseDown(e) {
  if (appState.tool !== "drag") return;

  const mouse = getCanvasPoint(e);
  const body = findBodyAtPoint(mouse.x, mouse.y);

  if (!body) return;

  appState.selectedBody = body;
  body.isDragging = true;
  body.velocity = Vec2.zero();

  appState.dragState = {
    isDragging: true,
    body,
    offsetX: mouse.x - body.position.x,
    offsetY: mouse.y - body.position.y,
    history: [{ position: new Vec2(mouse.x, mouse.y), time: performance.now() }]
  };
}

// Moves dragged body and updates hover.
function handleCanvasMouseMove(e) {
  const mouse = getCanvasPoint(e);
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

// Releases the dragged body and throws it.
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

// Converts touch start into drag behavior.
function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];

  handleCanvasMouseDown({
    clientX: touch.clientX,
    clientY: touch.clientY
  });
}

// Converts touch movement into mouse movement behavior.
function handleTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];

  handleCanvasMouseMove({
    clientX: touch.clientX,
    clientY: touch.clientY
  });
}

// Creates a new physics body from toolbar settings.
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

// Finds the top object under the mouse.
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

// Gets mouse position inside the canvas.
function getCanvasPoint(e) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

// Updates the bottom info panel.
function updateInfoPanel(body) {
  const movingBodies = engine.bodies.filter((item) => !item.isStatic);
  const totalKineticEnergy = movingBodies.reduce((sum, item) => {
    return sum + 0.5 * item.mass * Math.pow(item.velocity.magnitude(), 2);
  }, 0);

  $("#sim-stats").html(`
    <div class="stat-line"><span class="stat-label">FPS</span><span class="stat-value">${fps}</span></div>
    <div class="stat-line"><span class="stat-label">Objects</span><span class="stat-value">${movingBodies.length}</span></div>
    <div class="stat-line"><span class="stat-label">Total KE</span><span class="stat-value">${totalKineticEnergy.toFixed(1)}</span></div>
  `);

  if (!body) {
    $("#body-stats").html("No object selected.");
    return;
  }

  const kineticEnergy = 0.5 * body.mass * Math.pow(body.velocity.magnitude(), 2);

  $("#body-stats").html(`
    <div class="stat-line"><span class="stat-label">Shape</span><span class="stat-value">${body.shape}</span></div>
    <div class="stat-line"><span class="stat-label">Mass</span><span class="stat-value">${body.mass}</span></div>
    <div class="stat-line"><span class="stat-label">Position</span><span class="stat-value">${formatVec(body.position)}</span></div>
    <div class="stat-line"><span class="stat-label">Velocity</span><span class="stat-value">${formatVec(body.velocity)}</span></div>
    <div class="stat-line"><span class="stat-label">Kinetic E</span><span class="stat-value">${kineticEnergy.toFixed(1)}</span></div>
  `);
}

// Formats vector values for the UI.
function formatVec(v) {
  return `(${v.x.toFixed(1)}, ${v.y.toFixed(1)})`;
}

$(document).ready(init);