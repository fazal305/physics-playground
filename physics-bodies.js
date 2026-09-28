class Body {
  constructor({
    shape = "circle",
    position = Vec2.zero(),
    velocity = Vec2.zero(),
    mass = 1,
    radius = 30,
    width = 60,
    height = 60,
    color = "#00f5ff",
    restitution = 0.6,
    isStatic = false,
  }) {
    this.id = crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now() + Math.random());
    this.shape = shape;
    this.position = position;
    this.velocity = velocity;
    this.acceleration = Vec2.zero();
    this.mass = isStatic ? Infinity : mass;
    this.inverseMass = isStatic ? 0 : 1 / mass;
    this.radius = radius;
    this.width = width;
    this.height = height;
    this.color = color;
    this.restitution = restitution;
    this.isStatic = isStatic;
    this.isDragging = false;
  }

  applyForce(forceVec2) {
    if (this.isStatic || this.isDragging) {
      return;
    }

    const addedAcceleration = forceVec2.scale(this.inverseMass);
    this.acceleration = this.acceleration.add(addedAcceleration);
  }

  update(dt) {
    if (this.isStatic || this.isDragging) {
      this.acceleration = Vec2.zero();
      return;
    }

    this.velocity = this.velocity.add(this.acceleration.scale(dt));
    this.position = this.position.add(this.velocity.scale(dt));
    this.acceleration = Vec2.zero();
  }

  getBounds() {
    if (this.shape === "circle") {
      return {
        x: this.position.x - this.radius,
        y: this.position.y - this.radius,
        width: this.radius * 2,
        height: this.radius * 2,
      };
    }

    return {
      x: this.position.x - this.width / 2,
      y: this.position.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }
}
