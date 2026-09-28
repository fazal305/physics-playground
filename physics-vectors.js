class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  sub(v) {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  scale(s) {
    return new Vec2(this.x * s, this.y * s);
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const length = this.magnitude();

    if (length === 0) {
      return new Vec2(0, 0);
    }

    return new Vec2(this.x / length, this.y / length);
  }

  clone() {
    return new Vec2(this.x, this.y);
  }

  static zero() {
    return new Vec2(0, 0);
  }

  static fromAngle(angle) {
    return new Vec2(Math.cos(angle), Math.sin(angle));
  }
}
