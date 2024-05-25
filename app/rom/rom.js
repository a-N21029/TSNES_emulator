"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROM = void 0;
// iNES file format: https://www.nesdev.org/wiki/INES
const NES_TAG = [0x4E, 0x45, 0x53, 0x1A];
const PRG_ROM_PAGE_SIZE = 2 ** 14;
const CHR_ROM_PAGE_SIZE = 2 ** 13;
class ROM {
    constructor(prog) {
        if (!(0, compareArrays)(prog.slice(0, 4), NES_TAG)) {
            this.rom_load_success = false;
            console.error("Could not load iNES file.");
            return;
        }
        const ines_ver = (prog[7] >> 2) & 0b11;
        if (ines_ver != 0) {
            console.error("iNES 2.0 format is not supported.");
            this.rom_load_success = false;
            return;
        }
        const four_screen = (prog[6] & 0b1000) != 0;
        const vertical_mirroring = (prog[6] & 0b1) != 0;
        this.screen_mirroring = four_screen ? Mirroring.FOUR_SCREEN : (vertical_mirroring ? Mirroring.VERTICAL : Mirroring.HORIZONTAL);
        const prg_rom_size = prog[4] * PRG_ROM_PAGE_SIZE;
        const chr_rom_size = prog[5] * CHR_ROM_PAGE_SIZE;
        let skip_trainer = (prog[6] & 0b100) === 0;
        let prg_rom_start = 16 + (skip_trainer ? 512 : 0);
        let chr_rom_start = prg_rom_start + prg_rom_size;
        this.prg_rom = [...prog.slice(prg_rom_start, prg_rom_start + prg_rom_size)];
        this.chr_rom = [...prog.slice(chr_rom_start, chr_rom_start + prg_rom_size)];
        // memcpy(this.prg_rom, 0, prog, prg_rom_start, prg_rom_size, true);
        // memcpy(this.prg_rom, 0, prog, chr_rom_start, chr_rom_size, true);
        this.mapper = (0, touint8)((prog[7] & 240) | (prog[6] >> 4));
        this.rom_load_success = true;
    }
}
exports.ROM = ROM;
// testing
// const game:program = [
//     78, 69, 83, 26, 2, 0, 1, 0, 0, 0, 0, 0,
//      0,  0,  0,  0, 0, 0, 0, 0, 0, 0, 0, 0,
//      0,  0,  0,  0, 0, 0, 0, 0, 0, 0, 0, 0,
//      0,  0,  0,  0, 0, 0, 0, 0, 0, 0, 0, 0,
//      0,  0,  0,  0, 0, 0, 0, 0, 0, 0, 0, 0,
//      0,  0,  0,  0, 0, 0, 0, 0, 0, 0, 0, 0,
//      0,  0,  0,  0, 0, 0, 0, 0, 0, 0, 0, 0,
//      0,  0,  0,  0, 0, 0, 0, 0, 0, 0, 0, 0,
//      0,  0,  0,  0,] as program;
// // load_file("../snake.nes", game);
// const rom = new ROM(game);
// console.log(rom.prg_rom);
// console.log(rom.chr_rom);
// console.log(rom.mapper);
// console.log(rom.screen_mirroring);
// console.log(game.length);
