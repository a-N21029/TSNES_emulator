import { Frame } from "./frame";
import { PPU } from "./ppu/ppu";
import { touint8, uint8 } from "./types";

const SYSTEM_PALETTE: [uint8, uint8, uint8][] = [
    [0x80 as uint8, 0x80 as uint8, 0x80 as uint8], [0x00 as uint8, 0x3D as uint8, 0xA6 as uint8], [0x00 as uint8, 0x12 as uint8, 0xB0 as uint8], [0x44 as uint8, 0x00 as uint8, 0x96 as uint8], [0xA1 as uint8, 0x00 as uint8, 0x5E as uint8], 
    [0xC7 as uint8, 0x00 as uint8, 0x28 as uint8], [0xBA as uint8, 0x06 as uint8, 0x00 as uint8], [0x8C as uint8, 0x17 as uint8, 0x00 as uint8], [0x5C as uint8, 0x2F as uint8, 0x00 as uint8], [0x10 as uint8, 0x45 as uint8, 0x00 as uint8], 
    [0x05 as uint8, 0x4A as uint8, 0x00 as uint8], [0x00 as uint8, 0x47 as uint8, 0x2E as uint8], [0x00 as uint8, 0x41 as uint8, 0x66 as uint8], [0x00 as uint8, 0x00 as uint8, 0x00 as uint8], [0x05 as uint8, 0x05 as uint8, 0x05 as uint8], 
    [0x05 as uint8, 0x05 as uint8, 0x05 as uint8], [0xC7 as uint8, 0xC7 as uint8, 0xC7 as uint8], [0x00 as uint8, 0x77 as uint8, 0xFF as uint8], [0x21 as uint8, 0x55 as uint8, 0xFF as uint8], [0x82 as uint8, 0x37 as uint8, 0xFA as uint8], 
    [0xEB as uint8, 0x2F as uint8, 0xB5 as uint8], [0xFF as uint8, 0x29 as uint8, 0x50 as uint8], [0xFF as uint8, 0x22 as uint8, 0x00 as uint8], [0xD6 as uint8, 0x32 as uint8, 0x00 as uint8], [0xC4 as uint8, 0x62 as uint8, 0x00 as uint8], 
    [0x35 as uint8, 0x80 as uint8, 0x00 as uint8], [0x05 as uint8, 0x8F as uint8, 0x00 as uint8], [0x00 as uint8, 0x8A as uint8, 0x55 as uint8], [0x00 as uint8, 0x99 as uint8, 0xCC as uint8], [0x21 as uint8, 0x21 as uint8, 0x21 as uint8], 
    [0x09 as uint8, 0x09 as uint8, 0x09 as uint8], [0x09 as uint8, 0x09 as uint8, 0x09 as uint8], [0xFF as uint8, 0xFF as uint8, 0xFF as uint8], [0x0F as uint8, 0xD7 as uint8, 0xFF as uint8], [0x69 as uint8, 0xA2 as uint8, 0xFF as uint8], 
    [0xD4 as uint8, 0x80 as uint8, 0xFF as uint8], [0xFF as uint8, 0x45 as uint8, 0xF3 as uint8], [0xFF as uint8, 0x61 as uint8, 0x8B as uint8], [0xFF as uint8, 0x88 as uint8, 0x33 as uint8], [0xFF as uint8, 0x9C as uint8, 0x12 as uint8], 
    [0xFA as uint8, 0xBC as uint8, 0x20 as uint8], [0x9F as uint8, 0xE3 as uint8, 0x0E as uint8], [0x2B as uint8, 0xF0 as uint8, 0x35 as uint8], [0x0C as uint8, 0xF0 as uint8, 0xA4 as uint8], [0x05 as uint8, 0xFB as uint8, 0xFF as uint8], 
    [0x5E as uint8, 0x5E as uint8, 0x5E as uint8], [0x0D as uint8, 0x0D as uint8, 0x0D as uint8], [0x0D as uint8, 0x0D as uint8, 0x0D as uint8], [0xFF as uint8, 0xFF as uint8, 0xFF as uint8], [0xA6 as uint8, 0xFC as uint8, 0xFF as uint8], 
    [0xB3 as uint8, 0xEC as uint8, 0xFF as uint8], [0xDA as uint8, 0xAB as uint8, 0xEB as uint8], [0xFF as uint8, 0xA8 as uint8, 0xF9 as uint8], [0xFF as uint8, 0xAB as uint8, 0xB3 as uint8], [0xFF as uint8, 0xD2 as uint8, 0xB0 as uint8], 
    [0xFF as uint8, 0xEF as uint8, 0xA6 as uint8], [0xFF as uint8, 0xF7 as uint8, 0x9C as uint8], [0xD7 as uint8, 0xE8 as uint8, 0x95 as uint8], [0xA6 as uint8, 0xED as uint8, 0xAF as uint8], [0xA2 as uint8, 0xF2 as uint8, 0xDA as uint8], 
    [0x99 as uint8, 0xFF as uint8, 0xFC as uint8], [0xDD as uint8, 0xDD as uint8, 0xDD as uint8], [0x11 as uint8, 0x11 as uint8, 0x11 as uint8], [0x11 as uint8, 0x11 as uint8, 0x11 as uint8]
];


function show_tile(chr_rom: uint8[], bank: number, tile_n: number): Frame {
    let frame: Frame = new Frame();
    bank *= 0x1000 as uint8;

    const tile = chr_rom.slice(bank + tile_n * 16, bank + tile_n * 16 + 15);

    for (let y = 0; y <= 7; y++) {
        let upper = tile[y];
        let lower = tile[y + 8];

        for (let x = 0; x <= 7; x++) {
            const value = ((1 & upper) << 1) | (1 & lower);
            upper = touint8(upper >> 1);
            lower = touint8(lower >> 1);
            
            let rgb;
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

function show_tile_bank(chr_rom: number[], bank: number): Frame {
    const frame = new Frame(); // Adjust size if needed
    bank *= 0x1000;

    let tile_x = 0;
    let tile_y = 0;

    for (let tile_n = 0; tile_n < 256; tile_n++) {
        if (tile_n !== 0 && tile_n % 20 === 0) {
            tile_y += 10;
            tile_x = 0;
        }

        const tile = chr_rom.slice(bank + tile_n * 16, bank + tile_n * 16 + 15);

        for (let y = 0; y <= 7; y++) {
            let upper = tile[y];
            let lower = tile[y + 8];

            for (let x = 7; x >= 0; x--) {
                const value = ((1 & upper) << 1) | (1 & lower);
                upper >>= 1;
                lower >>= 1;

                let rgb;
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
function render(ppu: PPU, frame: Frame) {
    const bank = ppu.ctrl_register.background_pattern_addr();

    for (let i = 0; i < 0x3C0; i++) { 
        let tile_num = ppu.vram[i];
        let tile_x = i % 32;
        let tile_y = Math.floor(i / 32);
        let tile = ppu.chr_rom.slice(bank + tile_num * 16, bank + tile_num * 16 + 15);

        for (let y = 0; y <= 7; y++) {
            let upper = tile[y];
            let lower = tile[y + 8];
    
            for (let x = 0; x <= 7; x++) {
                const value = ((1 & upper) << 1) | (1 & lower);
                upper = touint8(upper >> 1);
                lower = touint8(lower >> 1);
                
                let rgb;
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
    
                frame.set_pixel(tile_x*8, tile_y*8, rgb);
            }
        }
    }
}