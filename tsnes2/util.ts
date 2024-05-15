import { uint16, uint8 } from "./types"

export function memcpy(destination: uint8[], destOffset: number, source: uint8[], srcOffset: number, length: number): void {
    for (let i = 0; i < length; i++) {
        if (srcOffset + i < source.length && destOffset + i < destination.length) {
            destination[destOffset + i] = source[srcOffset + i];
        } else {
            break; // Exit loop if either source or destination array bounds are exceeded
        }
    }
}