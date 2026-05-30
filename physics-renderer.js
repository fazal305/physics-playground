class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  // Clears the full canvas before drawing the next frame.
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Draws a body based on its shape.
  drawBody(body, isSelected = false) {
    if (body.shape === "circle") {
      this.drawCircle(body, isSelected);
    } else if (body.shape === "rect") {
      this.drawRect(body, isSelected);
    } else {
      this.drawTriangle(body, isSelected);
    }

    this.drawVelocityArrow(body);
  }

  // Draws a circle body.
  drawCircle(body, isSelected) {
    const ctx = this.ctx;

    if (isSelected) {
      this.drawSelectionHighlight(body);
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(body.position.x, body.position.y, body.radius, 0, Math.PI * 2);
    ctx.fillStyle = body.color;
    ctx.shadowColor = body.color;
    ctx.shadowBlur = isSelected ? 28 : 12;
    ctx.fill();
    ctx.restore();
  }

  // Draws a rectangle body.
  drawRect(body, isSelected) {
    const ctx = this.ctx;

    if (isSelected) {
      this.drawSelectionHighlight(body);
    }

    ctx.save();
    ctx.fillStyle = body.color;
    ctx.shadowColor = body.color;
    ctx.shadowBlur = isSelected ? 28 : 12;
    ctx.fillRect(
      body.position.x - body.width / 2,
      body.position.y - body.height / 2,
      body.width,
      body.height
    );
    ctx.restore();
  }

  // Draws a triangle body.
  drawTriangle(body, isSelected) {
    const ctx = this.ctx;
    const size = body.width / 2;

    if (isSelected) {
      this.drawSelectionHighlight(body);
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(body.position.x, body.position.y - size);
    ctx.lineTo(body.position.x - size, body.position.y + size);
    ctx.lineTo(body.position.x + size, body.position.y + size);
    ctx.closePath();
    ctx.fillStyle = body.color;
    ctx.shadowColor = body.color;
    ctx.shadowBlur = isSelected ? 28 : 12;
    ctx.fill();
    ctx.restore();
  }

  // Draws the ground platform.
  drawGround() {
    const ctx = this.ctx;
    const groundY = this.canvas.height - 45;

    ctx.save();

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, groundY, this.canvas.width, 45);

    ctx.strokeStyle = "#00f5ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(this.canvas.width, groundY);
    ctx.stroke();

    ctx.restore();
  }

  // Draws the left and right wall lines.
  drawWalls() {
    const ctx = this.ctx;

    ctx.save();
    ctx.strokeStyle = "rgba(191, 95, 255, 0.55)";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(2, this.canvas.height);

    ctx.moveTo(this.canvas.width - 2, 0);
    ctx.lineTo(this.canvas.width - 2, this.canvas.height);

    ctx.stroke();
    ctx.restore();
  }

  // Draws an arrow showing the velocity direction.
  drawVelocityArrow(body) {
    if (body.isStatic || body.velocity.magnitude() < 10) {
      return;
    }

    const ctx = this.ctx;
    const direction = body.velocity.normalize();
    const speedLength = Math.min(body.velocity.magnitude() * 0.08, 55);
    const start = body.position;
    const end = start.add(direction.scale(speedLength));

    ctx.save();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(end.x, end.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draws an outer glow around selected or hovered bodies.
  drawSelectionHighlight(body) {
    const ctx = this.ctx;
    const bounds = body.getBounds();

    ctx.save();

    ctx.strokeStyle = body.color;
    ctx.shadowColor = body.color;
    ctx.shadowBlur = 24;
    ctx.lineWidth = 3;

    ctx.strokeRect(
      bounds.x - 6,
      bounds.y - 6,
      bounds.width + 12,
      bounds.height + 12
    );

    ctx.restore();
  }

  // Draws small simulation stats in the top-right corner.
  drawStats(stats) {
    const ctx = this.ctx;

    ctx.save();

    ctx.font = "13px JetBrains Mono";
    ctx.fillStyle = "#00ff88";
    ctx.fillText(`FPS: ${stats.fps}`, this.canvas.width - 95, 24);
    ctx.fillText(`Objects: ${stats.count}`, this.canvas.width - 130, 44);

    ctx.restore();
  }
}