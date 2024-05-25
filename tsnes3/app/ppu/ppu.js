"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PPU = void 0;
// https://www.nesdev.org/wiki/PPU_registers#PPUCTRL
class PPU {
    constructor(chr_rom, mirroring) {
        this.chr_rom = chr_rom;
        this.palette_table = Array(32);
        this.vram = Array(2048);
        this.mirroring = mirroring;
        this.ctrl_register = new PPUCTRL();
        this.mask_register = new PPUMASK();
        this.status_register = new PPUSTATUS();
        this.scroll_register = new PPUSCROLL();
        this.addr_register = new PPUADDR();
        this.data_buffer = 0b00000000;
        this.oam_addr = 0;
        this.oam_data = Array(64 * 4);
        this.scanline = 0;
        this.cycles = 0;
        this.nmi_interrupt = false;
        this.read_success = false;
        this.write_success = false;
    }
    write_to_ppu_ctrl(data) {
        const before_nmi_status = this.ctrl_register.generate_vblank_nmi();
        this.ctrl_register.update(data);
        if (!before_nmi_status && this.ctrl_register.generate_vblank_nmi() && this.status_register.VBLANK_STARTED_isset()) {
            this.nmi_interrupt = true;
        }
    }
    write_to_ppu_mask(data) {
        this.mask_register.update(data);
    }
    read_status() {
        const data = this.status_register.snapshot();
        this.status_register.set_vblank_status(false);
        this.addr_register.reset_latch();
        this.scroll_register.reset_latch();
        return data;
    }
    write_to_oam_addr(data) {
        this.oam_addr = data;
    }
    read_oam_data() {
        return this.oam_data[this.oam_addr];
    }
    write_to_oam_data(data) {
        this.oam_data[this.oam_addr] = data;
        this.oam_addr = (0, uint8_ADD)(this.oam_addr, 1);
    }
    write_to_ppu_scroll(data) {
        this.scroll_register.write(data);
    }
    write_to_ppu_addr(data) {
        this.addr_register.update(data);
    }
    read_data() {
        const addr = this.addr_register.get();
        this.increment_vram_addr();
        // console.log(this.addr_register.get().toString(16))
        if ((addr < 0) || (addr > 0x3FFF)) { // invalid address
            console.error(`unexpected access to mirrored space${addr}`);
            this.read_success = false;
            return 0; // return val doesnt matter here since success status is false anyway
        }
        else if ((0 <= addr) && (addr <= 0x1FFF)) { // read from CHR ROM
            const old = this.data_buffer;
            this.data_buffer = this.chr_rom[addr];
            this.read_success = true;
            return old;
        }
        else if ((0x2000 <= addr) && (addr <= 0x2FFF)) { // read from RAM
            const old = this.data_buffer;
            this.data_buffer = this.vram[this.mirror_vram_addr(addr)];
            this.read_success = true;
            return old;
        }
        else if ((0x3000 <= addr) && (addr <= 0x3EFF)) {
            console.error(`addr space 0x3000..0x3eff is not expected to be used, requested = ${addr}`);
            this.read_success = false;
            return 0;
        }
        //Addresses $3F10/$3F14/$3F18/$3F1C are mirrors of $3F00/$3F04/$3F08/$3F0C
        else if ((addr === 0x3f10) || (addr === 0x3f14) || (addr === 0x3f18) || (addr === 0x3f1c)) {
            this.read_success = true;
            const mirror_addr = addr - 0x10;
            return this.palette_table[(mirror_addr - 0x3f00)];
        }
        // if (0x3F00 <= addr) && (addr <= 0x3FFF) 
        this.read_success = true;
        return this.palette_table[addr - 0x3f00];
    }
    write_data(data) {
        const addr = this.addr_register.get();
        if ((addr < 0) || (addr > 0x3FFF)) { // invalid address
            console.error(`unexpected access to mirrored space${addr}`);
            this.write_success = false;
            return;
        }
        else if ((0 <= addr) && (addr <= 0x1FFF)) {
            console.error(`attempting to write to chr rom space ${addr}`);
            this.write_success = false;
            return;
        }
        else if ((0x2000 <= addr) && (addr <= 0x2FFF)) { // write to RAM
            this.vram[this.mirror_vram_addr(addr)] = data;
            this.write_success = true;
            return;
        }
        else if ((0x3000 <= addr) && (addr <= 0x3EFF)) {
            console.error(`addr space 0x3000..0x3eff is not expected to be used, requested addr = ${addr}`);
            this.write_success = false;
            return;
        }
        else if ((addr === 0x3f10) || (addr === 0x3f14) || (addr === 0x3f18) || (addr === 0x3f1c)) {
            const mirror_addr = addr - 0x10;
            this.palette_table[(mirror_addr - 0x3f00)] = data;
            this.write_success = true;
            return;
        }
        // if (0x3F00 <= addr) && (addr <= 0x3FFF) 
        this.palette_table[addr - 0x3f00] = data;
        this.write_success = true;
        this.increment_vram_addr();
        return;
    }
    // data should be an array of 256 elements
    write_oam_dma(data) {
        for (let i = 0; i < data.length; i++) {
            this.oam_data[this.oam_addr] = data[i];
            this.oam_addr = (0, uint8_ADD)(this.oam_addr, 1);
        }
    }
    // HELPER METHODS
    increment_vram_addr() {
        this.addr_register.increment(this.ctrl_register.vram_addr_increment());
    }
    // Horizontal:
    //   [ A ] [ a ]
    //   [ B ] [ b ]
    // Vertical:
    //   [ A ] [ B ]
    //   [ a ] [ b ]
    mirror_vram_addr(addr) {
        const mirrored_vram = addr & 0b10111111111111; // mirror down 0x3000-0x3eff to 0x2000 - 0x2eff
        const vram_index = mirrored_vram - 0x2000; // to vram vector
        const name_table = Math.floor(vram_index / 0x400); // to the name table index
        if ((this.mirroring === Mirroring.VERTICAL) && ((name_table === 2) || (name_table === 3))) {
            return (0, touint16)(vram_index - 0x800);
        }
        else if (this.mirroring === Mirroring.HORIZONTAL) {
            if ((name_table === 1) || (name_table === 2)) {
                return (0, touint16)(vram_index - 0x400);
            }
            else if (name_table === 3) {
                return (0, touint16)(vram_index - 0x800);
            }
        }
        return (0, touint16)(vram_index);
    }
    tick(cycles) {
        this.cycles += cycles;
        if (this.cycles >= 341) {
            this.cycles -= 341;
            this.scanline = (0, uint16_ADD)(this.scanline, 1);
            if (this.scanline == 241) { // Vertical blanking lines
                this.status_register.set_vblank_status(true);
                this.status_register.set_sprite_zero_hit(false);
                if (this.ctrl_register.generate_vblank_nmi()) {
                    this.nmi_interrupt = false;
                    // todo!("Should trigger NMI interrupt")
                }
            }
            if (this.scanline >= 262) {
                this.nmi_interrupt = false;
                this.scanline = 0;
                this.status_register.set_vblank_status(false);
                this.status_register.set_sprite_zero_hit(false);
                return true;
            }
        }
        return false;
    }
    poll_nmi_interrupt() {
        return this.nmi_interrupt;
    }
}
exports.PPU = PPU;
class PPUCTRL {
    constructor() {
        // Control register
        // 7  bit  0
        // ---- ----
        // VPHB SINN
        // |||| ||||
        // |||| ||++- Base nametable address
        // |||| ||    (0 = $2000; 1 = $2400; 2 = $2800; 3 = $2C00)
        // |||| |+--- VRAM address increment per CPU read/write of PPUDATA
        // |||| |     (0: add 1, going across; 1: add 32, going down)
        // |||| +---- Sprite pattern table address for 8x8 sprites
        // ||||       (0: $0000; 1: $1000; ignored in 8x16 mode)
        // |||+------ Background pattern table address (0: $0000; 1: $1000)
        // ||+------- Sprite size (0: 8x8 pixels; 1: 8x16 pixels)
        // |+-------- PPU master/slave select
        // |          (0: read backdrop from EXT pins; 1: output color on EXT pins)
        // +--------- Generate an NMI at the start of the
        //            vertical blanking interval (0: off; 1: on)
        this.CtrlBits = {
            NAMETABLE1: 0b00000001,
            NAMETABLE2: 0b00000010,
            VRAM_ADD_INCREMENT: 0b00000100,
            SPRITE_PATTERN_ADDR: 0b00001000,
            BACKROUND_PATTERN_ADDR: 0b00010000,
            SPRITE_SIZE: 0b00100000,
            MASTER_SLAVE_SELECT: 0b01000000,
            GENERATE_NMI: 0b10000000,
        };
        this.bits = 0b00000000;
    }
    NAMETABLE1_isset() {
        return (this.bits & this.CtrlBits.NAMETABLE1) !== 0;
    }
    NAMETABLE2_isset() {
        return (this.bits & this.CtrlBits.NAMETABLE2) !== 0;
    }
    VRAM_ADD_INCREMENT_isset() {
        return (this.bits & this.CtrlBits.VRAM_ADD_INCREMENT) !== 0;
    }
    SPRITE_PATTERN_ADDR_isset() {
        return (this.bits & this.CtrlBits.SPRITE_PATTERN_ADDR) !== 0;
    }
    BACKROUND_PATTERN_ADDR_isset() {
        return (this.bits & this.CtrlBits.BACKROUND_PATTERN_ADDR) !== 0;
    }
    SPRITE_SIZE_isset() {
        return (this.bits & this.CtrlBits.SPRITE_SIZE) !== 0;
    }
    MASTER_SLAVE_SELECT_isset() {
        return (this.bits & this.CtrlBits.MASTER_SLAVE_SELECT) !== 0;
    }
    GENERATE_NMI_isset() {
        return (this.bits & this.CtrlBits.GENERATE_NMI) !== 0;
    }
    vram_addr_increment() {
        if (!this.VRAM_ADD_INCREMENT_isset()) {
            return 1;
        }
        return 32;
    }
    update(data) {
        this.bits = data;
    }
    nametable_addr() {
        const name_table_num = this.bits & 0b11;
        switch (name_table_num) {
            case 0: return 0x2000;
            case 1: return 0x2400;
            case 2: return 0x2800;
            case 3: return 0x2C00;
        }
        // should never reach here
        return 0;
    }
    sprite_pattern_addr() {
        return (!this.VRAM_ADD_INCREMENT_isset() ? 1 : 32);
    }
    background_pattern_addr() {
        return (!this.BACKROUND_PATTERN_ADDR_isset() ? 0 : 0x1000);
    }
    sprite_size() {
        return (!this.SPRITE_SIZE_isset() ? 8 : 16);
    }
    master_slave_select() {
        return (!this.SPRITE_SIZE_isset() ? 0 : 1);
    }
    generate_vblank_nmi() {
        return this.GENERATE_NMI_isset();
    }
}
var Color;
(function (Color) {
    Color[Color["R"] = 0] = "R";
    Color[Color["G"] = 1] = "G";
    Color[Color["B"] = 2] = "B";
})(Color || (Color = {}));
class PPUMASK {
    constructor() {
        // 7  bit  0
        // ---- ----
        // BGRs bMmG
        // |||| ||||
        // |||| |||+- Greyscale (0: normal color, 1: produce a greyscale display)
        // |||| ||+-- 1: Show background in leftmost 8 pixels of screen, 0: Hide
        // |||| |+--- 1: Show sprites in leftmost 8 pixels of screen, 0: Hide
        // |||| +---- 1: Show background
        // |||+------ 1: Show sprites
        // ||+------- Emphasize red (green on PAL/Dendy)
        // |+-------- Emphasize green (red on PAL/Dendy)
        // +--------- Emphasize blue
        this.MaskBits = {
            GREYSCALE: 0b00000001,
            BG_LEFTMOST_8: 0b00000010,
            SPRITE_LEFTMOST_8: 0b00000100,
            SHOW_BG: 0b00001000,
            SHOW_SPRITES: 0b00010000,
            EMPHASIZE_RED: 0b00100000,
            EMPHASIZE_GREEN: 0b01000000,
            EMPHASIZE_BLUE: 0b10000000,
        };
        this.bits = 0b00000000;
    }
    GREYSCALE_isset() {
        return (this.bits & this.MaskBits.GREYSCALE) !== 0;
    }
    BG_LEFTMOST_8_isset() {
        return (this.bits & this.MaskBits.BG_LEFTMOST_8) !== 0;
    }
    SPRITE_LEFTMOST_8_isset() {
        return (this.bits & this.MaskBits.SPRITE_LEFTMOST_8) !== 0;
    }
    SHOW_BG_isset() {
        return (this.bits & this.MaskBits.SHOW_BG) !== 0;
    }
    SHOW_SPRITES_isset() {
        return (this.bits & this.MaskBits.SHOW_SPRITES) !== 0;
    }
    EMPHASIZE_RED_isset() {
        return (this.bits & this.MaskBits.EMPHASIZE_RED) !== 0;
    }
    EMPHASIZE_BLUE_isset() {
        return (this.bits & this.MaskBits.EMPHASIZE_GREEN) !== 0;
    }
    EMPHASIZE_GREEN_isset() {
        return (this.bits & this.MaskBits.EMPHASIZE_BLUE) !== 0;
    }
    emphasize() {
        let res = [];
        if (this.EMPHASIZE_RED_isset()) {
            res.push(Color.R);
        }
        if (this.EMPHASIZE_GREEN_isset()) {
            res.push(Color.G);
        }
        if (this.EMPHASIZE_BLUE_isset()) {
            res.push(Color.B);
        }
        return res;
    }
    update(value) {
        this.bits = value;
    }
}
class PPUSTATUS {
    constructor() {
        // 7  bit  0
        // ---- ----
        // VSO. ....
        // |||| ||||
        // |||+-++++- PPU open bus. Returns stale PPU bus contents.
        // ||+------- Sprite overflow. The intent was for this flag to be set
        // ||         whenever more than eight sprites appear on a scanline, but a
        // ||         hardware bug causes the actual behavior to be more complicated
        // ||         and generate false positives as well as false negatives; see
        // ||         PPU sprite evaluation. This flag is set during sprite
        // ||         evaluation and cleared at dot 1 (the second dot) of the
        // ||         pre-render line.
        // |+-------- Sprite 0 Hit.  Set when a nonzero pixel of sprite 0 overlaps
        // |          a nonzero background pixel; cleared at dot 1 of the pre-render
        // |          line.  Used for raster timing.
        // +--------- Vertical blank has started (0: not in vblank; 1: in vblank).
        //         Set at dot 1 of line 241 (the line *after* the post-render
        //         line); cleared after reading $2002 and at dot 1 of the
        //         pre-render line.
        this.StatusBits = {
            PPU_OPEN_BUS_1: 0b00000001,
            PPU_OPEN_BUS_2: 0b00000010,
            PPU_OPEN_BUS_3: 0b00000100,
            PPU_OPEN_BUS_4: 0b00001000,
            PPU_OPEN_BUS_5: 0b00010000,
            SPRITE_OVERFLOW: 0b00100000,
            SPRITE_0_HIT: 0b01000000,
            VBLANK_STARTED: 0b10000000,
        };
        this.bits = 0b00000000;
    }
    PPU_OPEN_BUS_1_isset() {
        return (this.bits & this.StatusBits.PPU_OPEN_BUS_1) !== 0;
    }
    PPU_OPEN_BUS_2_isset() {
        return (this.bits & this.StatusBits.PPU_OPEN_BUS_2) !== 0;
    }
    PPU_OPEN_BUS_3_isset() {
        return (this.bits & this.StatusBits.PPU_OPEN_BUS_3) !== 0;
    }
    PPU_OPEN_BUS_4_isset() {
        return (this.bits & this.StatusBits.PPU_OPEN_BUS_4) !== 0;
    }
    PPU_OPEN_BUS_5_isset() {
        return (this.bits & this.StatusBits.PPU_OPEN_BUS_5) !== 0;
    }
    SPRITE_OVERFLOW_isset() {
        return (this.bits & this.StatusBits.SPRITE_OVERFLOW) !== 0;
    }
    SPRITE_0_HIT_isset() {
        return (this.bits & this.StatusBits.SPRITE_0_HIT) !== 0;
    }
    VBLANK_STARTED_isset() {
        return (this.bits & this.StatusBits.VBLANK_STARTED) !== 0;
    }
    set_vblank_status(status) {
        this.bits = status ? (0, uint8_OR)(this.bits, this.StatusBits.VBLANK_STARTED) : (0, uint8_AND)(this.bits, ~this.StatusBits.VBLANK_STARTED);
    }
    set_sprite_zero_hit(status) {
        this.bits = status ? (0, uint8_OR)(this.bits, this.StatusBits.SPRITE_0_HIT) : (0, uint8_AND)(this.bits, ~this.StatusBits.SPRITE_0_HIT);
    }
    set_sprite_overflow(status) {
        this.bits = status ? (0, uint8_OR)(this.bits, this.StatusBits.SPRITE_OVERFLOW) : (0, uint8_AND)(this.bits, ~this.StatusBits.SPRITE_OVERFLOW);
    }
    snapshot() {
        return this.bits;
    }
    update(value) {
        this.bits = value;
    }
}
class PPUSCROLL {
    constructor() {
        this.scroll_x = 0;
        this.scroll_y = 0;
        this.latch = false;
    }
    write(data) {
        if (!this.latch) {
            this.scroll_x = data;
        }
        else {
            this.scroll_y = data;
        }
        this.latch = !this.latch;
    }
    reset_latch() {
        this.latch = false;
    }
}
class PPUADDR {
    constructor() {
        this.val = [0, 0];
        this.hi_ptr = true;
    }
    get() {
        return (0, touint16)(((this.val[0]) << 8) | (this.val[1]));
    }
    set(data) {
        this.val[0] = (data >> 8);
        this.val[1] = (data & 0xFF);
    }
    update(data) {
        if (this.hi_ptr) {
            this.val[0] = data;
        }
        else {
            this.val[1] = data;
        }
        if (this.get() > 0x3FFF) { //mirror down addr above 0x3fff
            this.set((0, uint16_AND)(this.get(), 0b11111111111111));
        }
        this.hi_ptr = !this.hi_ptr;
    }
    increment(inc) {
        const low_byte = this.val[1];
        this.val[1] = (0, uint8_ADD)(this.val[1], inc);
        if (low_byte > this.val[1]) {
            this.val[0] = (0, uint8_ADD)(this.val[0], 1);
        }
        if (this.get() > 0x3fff) {
            this.set((0, uint16_AND)(this.get(), 0b11111111111111));
        }
    }
    reset_latch() {
        this.hi_ptr = true;
    }
}
