import { program, uint8 } from "./types";

const header: program = [
    78, 69, 83, 26, 2, 0, 1, 0, 0, 0, 0, 0,
    0,  0,  0,  0,] as program;
const trainer = Array<uint8>(512);
const prg_rom:program = [0xA9 as uint8, 0xFF as uint8, 0x2C as uint8, 0x01 as uint8, 80 as uint8, 0x00 as uint8].concat(Array((2 * 2**14 - 6)))
const chr_rom:program = Array(2 * 2**13)

// let game:program = [
//     78, 69, 83, 26, 2, 0, 1, 0, 0, 0, 0, 0,
//     0,  0,  0,  0,] as program;
export const game = header.concat(trainer).concat(prg_rom).concat(chr_rom);
// game = game.concat(Array<uint8>(512));
// game = game.concat(Array<uint8>(2**15));
// game = game.concat(prog)
// console.log(game)