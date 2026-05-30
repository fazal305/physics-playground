class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  // Adds another vector and returns a new vector.
  add(v) {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  // Subtracts another vector and returns a new vector.
  sub(v) {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  // Multiplies this vector by a number and returns a new vector.
  scale(s) {
    return new Vec2(this.x * s, this.y * s);
  }

  // Measures how much two vectors point in the same direction.
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  // Returns the length of the vector.
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  // Returns a direction-only version of the vector with length 1.
  normalize() {
    const length = this.magnitude();

    if (length === 0) {
      return new Vec2(0, 0);
    }

    return new Vec2(this.x / length, this.y / length);
  }

  // Returns a copy of this vector.
  clone() {
    return new Vec2(this.x, this.y);
  }

  // Creates a zero vector.
  static zero() {
    return new Vec2(0, 0);
  }

  // Creates a vector from an angle in radians.
  static fromAngle(angle) {
    return new Vec2(Math.cos(angle), Math.sin(angle));
  }
}