"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.game = void 0;
const header = [
    78, 69, 83, 26, 2, 0, 1, 0, 0, 0, 0, 0,
    0, 0, 0, 0,
];
const trainer = Array(512);
const prg_rom = [0xA9, 0xFF, 0x2C, 0x01, 80, 0x00].concat(Array((2 * 2 ** 14 - 6)));
const chr_rom = Array(2 * 2 ** 13);
// let game:program = [
//     78, 69, 83, 26, 2, 0, 1, 0, 0, 0, 0, 0,
//     0,  0,  0,  0,] as program;
exports.game = header.concat(trainer).concat(prg_rom).concat(chr_rom);
// game = game.concat(Array<uint8>(512));
// game = game.concat(Array<uint8>(2**15));
// game = game.concat(prog)
// console.log(game)
