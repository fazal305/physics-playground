const GRAVITY = 980;
const FRICTION_COEFFICIENT = 0.82;
const MAX_BODIES = 80;
const FIXED_TIMESTEP = 1 / 60;

class PhysicsEngine {
  constructor(config) {
    this.gravity = config.gravity;
    this.friction = config.friction;
    this.bounds = config.bounds;
    this.bodies = [];
    this.isPaused = false;
  }

  // Adds a body to the simulation.
  addBody(body) {
    if (this.bodies.length >= MAX_BODIES) {
      return;
    }

    this.bodies.push(body);
  }

  // Removes one body using its id.
  removeBody(id) {
    this.bodies = this.bodies.filter((body) => body.id !== id);
  }

  // Removes all bodies from the simulation.
  clearBodies() {
    this.bodies = [];
  }

  // Runs one physics update.
  step(dt) {
    if (this.isPaused) {
      return;
    }

    const safeDt = Math.min(dt, FIXED_TIMESTEP * 2);

    this.bodies.forEach((body) => {
      if (this.gravity) {
        this.applyGravity(body);
      }

      body.update(safeDt);
      this.resolveBoundary(body);
    });

    const pairs = this.broadPhase();

    pairs.forEach(([bodyA, bodyB]) => {
      const collision = this.narrowPhase(bodyA, bodyB);

      if (collision) {
        this.resolveCollision(bodyA, bodyB, collision.normal, collision.depth);
      }
    });
  }

  // Applies downward gravity force.
  applyGravity(body) {
    if (body.isStatic || body.isDragging) {
      return;
    }

    body.applyForce(new Vec2(0, GRAVITY * body.mass));
  }

  // Finds possible collisions using bounding boxes.
  broadPhase() {
    const pairs = [];

    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const bodyA = this.bodies[i];
        const bodyB = this.bodies[j];

        const a = bodyA.getBounds();
        const b = bodyB.getBounds();

        const overlaps =
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y;

        if (overlaps) {
          pairs.push([bodyA, bodyB]);
        }
      }
    }

    return pairs;
  }

  // Checks the exact collision type.
  narrowPhase(bodyA, bodyB) {
    if (bodyA.shape === "circle" && bodyB.shape === "circle") {
      return this.detectCircleCircle(bodyA, bodyB);
    }

    return this.detectAabbCollision(bodyA, bodyB);
  }

  // Detects collision between two circles.
  detectCircleCircle(bodyA, bodyB) {
    const difference = bodyB.position.sub(bodyA.position);
    const distance = difference.magnitude();
    const radiusSum = bodyA.radius + bodyB.radius;

    if (distance >= radiusSum) {
      return null;
    }

    const normal = distance === 0 ? new Vec2(1, 0) : difference.scale(1 / distance);

    return {
      normal,
      depth: radiusSum - distance
    };
  }

  // Detects collision using rectangle-style bounds.
  detectAabbCollision(bodyA, bodyB) {
    const a = bodyA.getBounds();
    const b = bodyB.getBounds();

    const overlapX = Math.min(a.x + a.width - b.x, b.x + b.width - a.x);
    const overlapY = Math.min(a.y + a.height - b.y, b.y + b.height - a.y);

    if (overlapX <= 0 || overlapY <= 0) {
      return null;
    }

    if (overlapX < overlapY) {
      return {
        normal: bodyA.position.x < bodyB.position.x ? new Vec2(1, 0) : new Vec2(-1, 0),
        depth: overlapX
      };
    }

    return {
      normal: bodyA.position.y < bodyB.position.y ? new Vec2(0, 1) : new Vec2(0, -1),
      depth: overlapY
    };
  }

  // Separates colliding bodies and changes their velocity.
  resolveCollision(bodyA, bodyB, normal, depth) {
    if (bodyA.isDragging || bodyB.isDragging) {
      return;
    }

    const totalInverseMass = bodyA.inverseMass + bodyB.inverseMass;

    if (totalInverseMass === 0) {
      return;
    }

    const correctionPercent = 0.8;
    const correction = normal.scale((depth / totalInverseMass) * correctionPercent);

    if (!bodyA.isStatic) {
      bodyA.position = bodyA.position.sub(correction.scale(bodyA.inverseMass));
    }

    if (!bodyB.isStatic) {
      bodyB.position = bodyB.position.add(correction.scale(bodyB.inverseMass));
    }

    const relativeVelocity = bodyB.velocity.sub(bodyA.velocity);
    const velocityAlongNormal = relativeVelocity.dot(normal);

    if (velocityAlongNormal > 0) {
      return;
    }

    const restitution = Math.min(bodyA.restitution, bodyB.restitution);
    const impulseAmount = -(1 + restitution) * velocityAlongNormal / totalInverseMass;
    const impulse = normal.scale(impulseAmount);

    if (!bodyA.isStatic) {
      bodyA.velocity = bodyA.velocity.sub(impulse.scale(bodyA.inverseMass));
    }

    if (!bodyB.isStatic) {
      bodyB.velocity = bodyB.velocity.add(impulse.scale(bodyB.inverseMass));
    }
  }

  // Bounces bodies off the canvas walls and ground.
  resolveBoundary(body) {
    if (body.isStatic || body.isDragging) {
      return;
    }

    const bounds = body.getBounds();
    const halfWidth = body.shape === "circle" ? body.radius : body.width / 2;
    const halfHeight = body.shape === "circle" ? body.radius : body.height / 2;
    const groundHeight = 45;

    if (bounds.x <= 0) {
      body.position.x = halfWidth;
      body.velocity.x *= -body.restitution;
    }

    if (bounds.x + bounds.width >= this.bounds.width) {
      body.position.x = this.bounds.width - halfWidth;
      body.velocity.x *= -body.restitution;
    }

    if (bounds.y <= 0) {
      body.position.y = halfHeight;
      body.velocity.y *= -body.restitution;
    }

    if (bounds.y + bounds.height >= this.bounds.height - groundHeight) {
      body.position.y = this.bounds.height - groundHeight - halfHeight;
      body.velocity.y *= -body.restitution;

      if (this.friction) {
        body.velocity.x *= FRICTION_COEFFICIENT;
      }
    }
  }
}