"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Frame = void 0;
class Frame {
    constructor() {
        this.WIDTH = 256;
        this.HEIGHT = 240;
        this.data = Array(this.WIDTH * this.HEIGHT * 3).fill(0);
    }
    set_pixel(x, y, rgb) {
        const base = y * 3 * this.WIDTH + x * 3;
        if ((base + 2) < this.data.length) {
            this.data[base] = rgb[0];
            this.data[base + 1] = rgb[1];
            this.data[base + 2] = rgb[2];
        }
    }
}
exports.Frame = Frame;
