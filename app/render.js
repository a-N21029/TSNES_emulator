"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SYSTEM_PALETTE = [
    [0x80, 0x80, 0x80], [0x00, 0x3D, 0xA6], [0x00, 0x12, 0xB0], [0x44, 0x00, 0x96], [0xA1, 0x00, 0x5E],
    [0xC7, 0x00, 0x28], [0xBA, 0x06, 0x00], [0x8C, 0x17, 0x00], [0x5C, 0x2F, 0x00], [0x10, 0x45, 0x00],
    [0x05, 0x4A, 0x00], [0x00, 0x47, 0x2E], [0x00, 0x41, 0x66], [0x00, 0x00, 0x00], [0x05, 0x05, 0x05],
    [0x05, 0x05, 0x05], [0xC7, 0xC7, 0xC7], [0x00, 0x77, 0xFF], [0x21, 0x55, 0xFF], [0x82, 0x37, 0xFA],
    [0xEB, 0x2F, 0xB5], [0xFF, 0x29, 0x50], [0xFF, 0x22, 0x00], [0xD6, 0x32, 0x00], [0xC4, 0x62, 0x00],
    [0x35, 0x80, 0x00], [0x05, 0x8F, 0x00], [0x00, 0x8A, 0x55], [0x00, 0x99, 0xCC], [0x21, 0x21, 0x21],
    [0x09, 0x09, 0x09], [0x09, 0x09, 0x09], [0xFF, 0xFF, 0xFF], [0x0F, 0xD7, 0xFF], [0x69, 0xA2, 0xFF],
    [0xD4, 0x80, 0xFF], [0xFF, 0x45, 0xF3], [0xFF, 0x61, 0x8B], [0xFF, 0x88, 0x33], [0xFF, 0x9C, 0x12],
    [0xFA, 0xBC, 0x20], [0x9F, 0xE3, 0x0E], [0x2B, 0xF0, 0x35], [0x0C, 0xF0, 0xA4], [0x05, 0xFB, 0xFF],
    [0x5E, 0x5E, 0x5E], [0x0D, 0x0D, 0x0D], [0x0D, 0x0D, 0x0D], [0xFF, 0xFF, 0xFF], [0xA6, 0xFC, 0xFF],
    [0xB3, 0xEC, 0xFF], [0xDA, 0xAB, 0xEB], [0xFF, 0xA8, 0xF9], [0xFF, 0xAB, 0xB3], [0xFF, 0xD2, 0xB0],
    [0xFF, 0xEF, 0xA6], [0xFF, 0xF7, 0x9C], [0xD7, 0xE8, 0x95], [0xA6, 0xED, 0xAF], [0xA2, 0xF2, 0xDA],
    [0x99, 0xFF, 0xFC], [0xDD, 0xDD, 0xDD], [0x11, 0x11, 0x11], [0x11, 0x11, 0x11]
];
function show_tile(chr_rom, bank, tile_n) {
    var frame = new Frame();
    bank *= 0x1000;
    var tile = chr_rom.slice(bank + tile_n * 16, bank + tile_n * 16 + 15);
    for (var y = 0; y <= 7; y++) {
        var upper = tile[y];
        var lower = tile[y + 8];
        for (var x = 0; x <= 7; x++) {
            var value = ((1 & upper) << 1) | (1 & lower);
            upper = (0, touint8)(upper >> 1);
            lower = (0, touint8)(lower >> 1);
            var rgb = void 0;
            switch (value) {
                case 0:
                    rgb = SYSTEM_PALETTE[0x01];
                    break;
                case 1:
                    rgb = SYSTEM_PALETTE[0x23];
                    break;
                case 2:
                    rgb = SYSTEM_PALETTE[0x27];
                    break;
                case 3:
                    rgb = SYSTEM_PALETTE[0x30];
                    break;
                default:
                    throw new Error("Unexpected value");
            }
            frame.set_pixel(x, y, rgb);
        }
    }
    return frame;
}
function show_tile_bank(chr_rom, bank) {
    var frame = new Frame(); // Adjust size if needed
    bank *= 0x1000;
    var tile_x = 0;
    var tile_y = 0;
    for (var tile_n = 0; tile_n < 256; tile_n++) {
        if (tile_n !== 0 && tile_n % 20 === 0) {
            tile_y += 10;
            tile_x = 0;
        }
        var tile = chr_rom.slice(bank + tile_n * 16, bank + tile_n * 16 + 15);
        for (var y = 0; y <= 7; y++) {
            var upper = tile[y];
            var lower = tile[y + 8];
            for (var x = 7; x >= 0; x--) {
                var value = ((1 & upper) << 1) | (1 & lower);
                upper >>= 1;
                lower >>= 1;
                var rgb = void 0;
                switch (value) {
                    case 0:
                        rgb = SYSTEM_PALETTE[0x01];
                        break;
                    case 1:
                        rgb = SYSTEM_PALETTE[0x23];
                        break;
                    case 2:
                        rgb = SYSTEM_PALETTE[0x27];
                        break;
                    case 3:
                        rgb = SYSTEM_PALETTE[0x30];
                        break;
                    default:
                        throw new Error("Unexpected value");
                }
                frame.set_pixel(tile_x + x, tile_y + y, rgb);
            }
        }
        tile_x += 10;
    }
    return frame;
}
// https://www.nesdev.org/wiki/Mirroring#Nametable_Mirroring
function render(ppu, frame) {
    var bank = ppu.ctrl_register.background_pattern_addr();
    for (var i = 0; i < 0x3C0; i++) {
        var tile_num = ppu.vram[i];
        var tile_x = i % 32;
        var tile_y = Math.floor(i / 32);
        var tile = ppu.chr_rom.slice(bank + tile_num * 16, bank + tile_num * 16 + 15);
        for (var y = 0; y <= 7; y++) {
            var upper = tile[y];
            var lower = tile[y + 8];
            for (var x = 0; x <= 7; x++) {
                var value = ((1 & upper) << 1) | (1 & lower);
                upper = (0, touint8)(upper >> 1);
                lower = (0, touint8)(lower >> 1);
                var rgb = void 0;
                switch (value) {
                    case 0:
                        rgb = SYSTEM_PALETTE[0x01];
                        break;
                    case 1:
                        rgb = SYSTEM_PALETTE[0x23];
                        break;
                    case 2:
                        rgb = SYSTEM_PALETTE[0x27];
                        break;
                    case 3:
                        rgb = SYSTEM_PALETTE[0x30];
                        break;
                    default:
                        throw new Error("Unexpected value");
                }
                frame.set_pixel(tile_x * 8, tile_y * 8, rgb);
            }
        }
    }
}
