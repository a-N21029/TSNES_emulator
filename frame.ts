import { uint8 } from "./types";

export class Frame {
    public data: uint8[];
    public readonly WIDTH: number = 256;
    public readonly HEIGHT: number = 240;

    public constructor() {
        this.data = Array<uint8>(this.WIDTH * this.HEIGHT * 3).fill(0 as uint8);
    }

    public set_pixel(x: number, y: number, rgb: [uint8, uint8, uint8]) {
        const base = y * 3 * this.WIDTH + x * 3;
        if ((base + 2) < this.data.length) {
            this.data[base] = rgb[0];
            this.data[base + 1] = rgb[1];
            this.data[base + 2] = rgb[2];
        }
    }
}