import { touint16, uint16, uint16_ADD, uint16_AND, uint8, uint8_ADD, uint8_AND, uint8_OR } from "../types"
import { Mirroring } from "../util"

// https://www.nesdev.org/wiki/PPU_registers#PPUCTRL
export class PPU{
    // ppu components
    public chr_rom: uint8[];
    public palette_table: uint8[];
    public vram: uint8[];
    public mirroring: Mirroring;

    // registers
    public ctrl_register: PPUCTRL;
    public mask_register: PPUMASK;
    public status_register: PPUSTATUS;
    public scroll_register: PPUSCROLL;
    public addr_register: PPUADDR;
    public data_buffer: uint8;

    // internal memory register info
    public oam_addr: uint8; // OAMADDR
    public oam_data: uint8[]; // OAMDATA

    // interrupt/rendering related data
    public scanline: uint16;
    public cycles: number;
    public nmi_interrupt: boolean;
    
    // metadata
    public read_success: boolean;
    public write_success: boolean;

    public constructor(chr_rom: uint8[], mirroring: Mirroring) {
        this.chr_rom = chr_rom;
        this.palette_table = Array<uint8>(32);
        this.vram = Array<uint8>(2048);
        this.mirroring = mirroring;

        this.ctrl_register = new PPUCTRL();
        this.mask_register = new PPUMASK();
        this.status_register = new PPUSTATUS();
        this.scroll_register = new PPUSCROLL();
        this.addr_register = new PPUADDR();
        this.data_buffer = 0b00000000 as uint8;

        this.oam_addr = 0 as uint8;
        this.oam_data = Array<uint8>(64*4);

        this.scanline = 0 as uint16;
        this.cycles = 0;
        this.nmi_interrupt = false;

        this.read_success = false;
        this.write_success = false;

    }

    public write_to_ppu_ctrl(data: uint8) {
        const before_nmi_status = this.ctrl_register.generate_vblank_nmi();
        this.ctrl_register.update(data);
        if (!before_nmi_status && this.ctrl_register.generate_vblank_nmi() && this.status_register.VBLANK_STARTED_isset()) {
            this.nmi_interrupt = true;
        }
    }
    
    public write_to_ppu_mask(data: uint8) {
        this.mask_register.update(data);
    }

    public read_status() {
        const data = this.status_register.snapshot();
        this.status_register.set_vblank_status(false);
        this.addr_register.reset_latch();
        this.scroll_register.reset_latch();
        return data
    }

    public write_to_oam_addr(data: uint8) {
        this.oam_addr = data;
    }
    
    public read_oam_data() {
        return this.oam_data[this.oam_addr];
    }

    public write_to_oam_data(data: uint8) {
        this.oam_data[this.oam_addr] = data;
        this.oam_addr = uint8_ADD(this.oam_addr, 1);
    }

    public write_to_ppu_scroll(data: uint8) {
        this.scroll_register.write(data);
    }

    public write_to_ppu_addr(data: uint8) {
        this.addr_register.update(data);
    }

    public read_data(): uint8 {
        const addr = this.addr_register.get();
        this.increment_vram_addr();
        // console.log(this.addr_register.get().toString(16))

        if((addr < 0) || (addr > 0x3FFF)){ // invalid address
            console.error(`unexpected access to mirrored space${addr}`);
            this.read_success = false;
            return 0 as uint8; // return val doesnt matter here since success status is false anyway
        }
        else if((0 <= addr) && (addr <= 0x1FFF)){ // read from CHR ROM
            const old = this.data_buffer;
            this.data_buffer = this.chr_rom[addr];
            this.read_success = true;
            return old;
        }
        else if((0x2000 <= addr) && (addr <= 0x2FFF)){ // read from RAM
            const old = this.data_buffer;
            this.data_buffer = this.vram[this.mirror_vram_addr(addr)];
            this.read_success = true;
            return old;
        }
        else if((0x3000 <= addr) && (addr <= 0x3EFF)){
            console.error(`addr space 0x3000..0x3eff is not expected to be used, requested = ${addr}`);
            this.read_success = false;
            return 0 as uint8;
        }
        //Addresses $3F10/$3F14/$3F18/$3F1C are mirrors of $3F00/$3F04/$3F08/$3F0C
        else if ((addr === 0x3f10) || (addr === 0x3f14) || (addr === 0x3f18) || (addr === 0x3f1c)) {
            this.read_success = true;
            const mirror_addr = addr - 0x10;
            return this.palette_table[(mirror_addr - 0x3f00)] ;
        }

        // if (0x3F00 <= addr) && (addr <= 0x3FFF) 
        this.read_success = true;
        return this.palette_table[addr - 0x3f00]; 
    }

    public write_data(data: uint8): void {
        const addr = this.addr_register.get();

        if((addr < 0) || (addr > 0x3FFF)){ // invalid address
            console.error(`unexpected access to mirrored space${addr}`);
            this.write_success = false;
            return;
        }
        else if((0 <= addr) && (addr <= 0x1FFF)){
            console.error(`attempting to write to chr rom space ${addr}`);
            this.write_success = false;
            return;
        }
        else if((0x2000 <= addr) && (addr <= 0x2FFF)){ // write to RAM
            this.vram[this.mirror_vram_addr(addr)] = data;
            this.write_success = true;
            return;
        }
        else if((0x3000 <= addr) && (addr <= 0x3EFF)){
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
    public write_oam_dma(data: uint8[]) {
        for(let i = 0; i < data.length; i++) {
            this.oam_data[this.oam_addr] = data[i];
            this.oam_addr = uint8_ADD(this.oam_addr, 1);

        }
    }

    // HELPER METHODS
    public increment_vram_addr() {
        this.addr_register.increment(this.ctrl_register.vram_addr_increment());
    }

    // Horizontal:
    //   [ A ] [ a ]
    //   [ B ] [ b ]

    // Vertical:
    //   [ A ] [ B ]
    //   [ a ] [ b ]
    mirror_vram_addr(addr: uint16): uint16 {
        const mirrored_vram = addr & 0b10111111111111; // mirror down 0x3000-0x3eff to 0x2000 - 0x2eff
        const vram_index = mirrored_vram - 0x2000; // to vram vector
        const name_table = Math.floor(vram_index / 0x400); // to the name table index

        if((this.mirroring === Mirroring.VERTICAL) && ((name_table === 2) || (name_table === 3))) {
            return touint16(vram_index - 0x800);
        }
        else if (this.mirroring === Mirroring.HORIZONTAL) {
            if ((name_table === 1) || (name_table === 2)) {
                return touint16(vram_index - 0x400);
            }
            else if (name_table === 3) {
                return touint16(vram_index - 0x800);
            }
        }
        return touint16(vram_index);
    }

    public tick(cycles: uint8) {
        this.cycles += cycles;
        if (this.cycles >= 341) {
            this.cycles -= 341;
            this.scanline = uint16_ADD(this.scanline, 1);

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
                this.scanline = 0 as uint16;

                this.status_register.set_vblank_status(false);
                this.status_register.set_sprite_zero_hit(false);
                return true;
            }
        }
        return false;
    }

    public poll_nmi_interrupt(): boolean {
        return this.nmi_interrupt;
    }
}


interface CtrlBits {
    NAMETABLE1: uint8;
    NAMETABLE2: uint8;
    VRAM_ADD_INCREMENT: uint8;
    SPRITE_PATTERN_ADDR: uint8;
    BACKROUND_PATTERN_ADDR: uint8;
    SPRITE_SIZE: uint8;
    MASTER_SLAVE_SELECT: uint8;
    GENERATE_NMI: uint8;
}

class PPUCTRL {
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
    public readonly CtrlBits: CtrlBits = {
        NAMETABLE1:              0b00000001 as uint8,
        NAMETABLE2:              0b00000010 as uint8,
        VRAM_ADD_INCREMENT:      0b00000100 as uint8,
        SPRITE_PATTERN_ADDR:     0b00001000 as uint8,
        BACKROUND_PATTERN_ADDR:  0b00010000 as uint8,
        SPRITE_SIZE:             0b00100000 as uint8,
        MASTER_SLAVE_SELECT:     0b01000000 as uint8,
        GENERATE_NMI:            0b10000000 as uint8,
    }
    private bits: uint8;

    public constructor() {
        this.bits = 0b00000000 as uint8;
    }

    public NAMETABLE1_isset() {
        return (this.bits & this.CtrlBits.NAMETABLE1) !== 0;   
        
    }
    public NAMETABLE2_isset() {
        return (this.bits & this.CtrlBits.NAMETABLE2) !== 0;   
    }
    public VRAM_ADD_INCREMENT_isset(): boolean {
        return (this.bits & this.CtrlBits.VRAM_ADD_INCREMENT) !== 0;    
    }

    public SPRITE_PATTERN_ADDR_isset(): boolean {
        return (this.bits & this.CtrlBits.SPRITE_PATTERN_ADDR) !== 0;    
    }

    public BACKROUND_PATTERN_ADDR_isset(): boolean {
        return (this.bits & this.CtrlBits.BACKROUND_PATTERN_ADDR) !== 0;    
    }

    public SPRITE_SIZE_isset(): boolean {
        return (this.bits & this.CtrlBits.SPRITE_SIZE) !== 0;    
    }

    public MASTER_SLAVE_SELECT_isset(): boolean {
        return (this.bits & this.CtrlBits.MASTER_SLAVE_SELECT) !== 0;    
    }

    public GENERATE_NMI_isset(): boolean {
        return (this.bits & this.CtrlBits.GENERATE_NMI) !== 0;    
    }
 
    public vram_addr_increment(): uint8 {
        if (!this.VRAM_ADD_INCREMENT_isset()) {
            return 1 as uint8;
        }
        return 32 as uint8;
    }
 
    public update(data: uint8) {
        this.bits = data;
    }

    public nametable_addr(): uint16 {
        const name_table_num = this.bits & 0b11;

        switch(name_table_num) {
            case 0: return 0x2000 as uint16;
            case 1: return 0x2400 as uint16;
            case 2: return 0x2800 as uint16;
            case 3: return 0x2C00 as uint16;
        }

        // should never reach here
        return 0 as uint16;
    }

    public sprite_pattern_addr(): uint16 {
        return (!this.VRAM_ADD_INCREMENT_isset() ? 1 : 32) as uint16;
    }
    
    public background_pattern_addr(): uint16 {
        return (!this.BACKROUND_PATTERN_ADDR_isset() ? 0 : 0x1000) as uint16;
    }
    
    public sprite_size(): uint16 {
        return (!this.SPRITE_SIZE_isset() ? 8 : 16) as uint16;
    }

    public master_slave_select(): uint16 {
        return (!this.SPRITE_SIZE_isset() ? 0 : 1) as uint16;
    }

    generate_vblank_nmi(): boolean {
        return this.GENERATE_NMI_isset();
    }
}

interface MaskBits {
    GREYSCALE: uint8;
    BG_LEFTMOST_8: uint8;
    SPRITE_LEFTMOST_8: uint8;
    SHOW_BG: uint8;
    SHOW_SPRITES: uint8;
    EMPHASIZE_RED: uint8;
    EMPHASIZE_GREEN: uint8;
    EMPHASIZE_BLUE: uint8;
}

enum Color {
    R,
    G,
    B,
}

class PPUMASK {
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
    public readonly MaskBits: MaskBits = {
        GREYSCALE:         0b00000001 as uint8,
        BG_LEFTMOST_8:     0b00000010 as uint8,
        SPRITE_LEFTMOST_8: 0b00000100 as uint8,
        SHOW_BG:           0b00001000 as uint8,
        SHOW_SPRITES:      0b00010000 as uint8,
        EMPHASIZE_RED:     0b00100000 as uint8,
        EMPHASIZE_GREEN:   0b01000000 as uint8,
        EMPHASIZE_BLUE:    0b10000000 as uint8,
    }

    private bits: uint8;

    public constructor() {
        this.bits = 0b00000000 as uint8;
    }

    public GREYSCALE_isset() {
        return (this.bits & this.MaskBits.GREYSCALE) !== 0;   
        
    }
    public BG_LEFTMOST_8_isset() {
        return (this.bits & this.MaskBits.BG_LEFTMOST_8) !== 0;   
    }
    public SPRITE_LEFTMOST_8_isset(): boolean {
        return (this.bits & this.MaskBits.SPRITE_LEFTMOST_8) !== 0;    
    }

    public SHOW_BG_isset(): boolean {
        return (this.bits & this.MaskBits.SHOW_BG) !== 0;    
    }

    public SHOW_SPRITES_isset(): boolean {
        return (this.bits & this.MaskBits.SHOW_SPRITES) !== 0;    
    }

    public EMPHASIZE_RED_isset(): boolean {
        return (this.bits & this.MaskBits.EMPHASIZE_RED) !== 0;    
    }

    public EMPHASIZE_BLUE_isset(): boolean {
        return (this.bits & this.MaskBits.EMPHASIZE_GREEN) !== 0;    
    }

    public EMPHASIZE_GREEN_isset(): boolean {
        return (this.bits & this.MaskBits.EMPHASIZE_BLUE) !== 0;    
    }

    public emphasize(): Color[] {
        let res: Color[] = [];

        if(this.EMPHASIZE_RED_isset()) {
            res.push(Color.R);
        }
        if(this.EMPHASIZE_GREEN_isset()) {
            res.push(Color.G);
        }
        if(this.EMPHASIZE_BLUE_isset()) {
            res.push(Color.B);
        }

        return res;
    }

    public update(value: uint8) {
        this.bits = value;
    }
}

interface StatusBits {
    PPU_OPEN_BUS_1: uint8; // NOT used in this emulation but included for completion
    PPU_OPEN_BUS_2: uint8; // NOT used in this emulation but included for completion
    PPU_OPEN_BUS_3: uint8; // NOT used in this emulation but included for completion
    PPU_OPEN_BUS_4: uint8; // NOT used in this emulation but included for completion
    PPU_OPEN_BUS_5: uint8; // NOT used in this emulation but included for completion
    SPRITE_OVERFLOW: uint8;
    SPRITE_0_HIT: uint8;
    VBLANK_STARTED: uint8;
}

class PPUSTATUS {
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
    public readonly StatusBits: StatusBits = {
        PPU_OPEN_BUS_1:     0b00000001 as uint8,
        PPU_OPEN_BUS_2:     0b00000010 as uint8,
        PPU_OPEN_BUS_3:     0b00000100 as uint8,
        PPU_OPEN_BUS_4:     0b00001000 as uint8,
        PPU_OPEN_BUS_5:     0b00010000 as uint8,
        SPRITE_OVERFLOW:    0b00100000 as uint8,
        SPRITE_0_HIT:       0b01000000 as uint8,
        VBLANK_STARTED:     0b10000000 as uint8,
    }

    private bits: uint8;

    public constructor() {
        this.bits = 0b00000000 as uint8;
    }

    public PPU_OPEN_BUS_1_isset() {
        return (this.bits & this.StatusBits.PPU_OPEN_BUS_1) !== 0;   
        
    }
    public PPU_OPEN_BUS_2_isset() {
        return (this.bits & this.StatusBits.PPU_OPEN_BUS_2) !== 0;   
    }
    public PPU_OPEN_BUS_3_isset(): boolean {
        return (this.bits & this.StatusBits.PPU_OPEN_BUS_3) !== 0;    
    }

    public PPU_OPEN_BUS_4_isset(): boolean {
        return (this.bits & this.StatusBits.PPU_OPEN_BUS_4) !== 0;    
    }

    public PPU_OPEN_BUS_5_isset(): boolean {
        return (this.bits & this.StatusBits.PPU_OPEN_BUS_5) !== 0;    
    }

    public SPRITE_OVERFLOW_isset(): boolean {
        return (this.bits & this.StatusBits.SPRITE_OVERFLOW) !== 0;    
    }

    public SPRITE_0_HIT_isset(): boolean {
        return (this.bits & this.StatusBits.SPRITE_0_HIT) !== 0;    
    }

    public VBLANK_STARTED_isset(): boolean {
        return (this.bits & this.StatusBits.VBLANK_STARTED) !== 0;    
    }

    public set_vblank_status(status: boolean) {
        this.bits = status ? uint8_OR(this.bits, this.StatusBits.VBLANK_STARTED) : uint8_AND(this.bits, ~this.StatusBits.VBLANK_STARTED);
    }

    public set_sprite_zero_hit(status: boolean) {
        this.bits = status ? uint8_OR(this.bits, this.StatusBits.SPRITE_0_HIT) : uint8_AND(this.bits, ~this.StatusBits.SPRITE_0_HIT);
    }

    public set_sprite_overflow(status: boolean) {
        this.bits = status ? uint8_OR(this.bits, this.StatusBits.SPRITE_OVERFLOW) : uint8_AND(this.bits, ~this.StatusBits.SPRITE_OVERFLOW);
    }

    public snapshot(): uint8 {
        return this.bits;
    }

    public update(value: uint8) {
        this.bits = value;
    }
}

class PPUSCROLL {
    public scroll_x: uint8;
    public scroll_y: uint8;
    public latch: boolean;

    public constructor() {
        this.scroll_x = 0 as uint8;
        this.scroll_y = 0 as uint8;
        this.latch = false;
    }

    public write(data: uint8) {
        if(!this.latch){
            this.scroll_x = data;
        }
        else {
            this.scroll_y = data;
        }
        this.latch = !this.latch;
    }

    public reset_latch() {
        this.latch = false;
    }
}

class PPUADDR { // Address register
    private val: [uint8, uint8];
    private hi_ptr: boolean;

    public constructor() {
        this.val = [0 as uint8, 0 as uint8];
        this.hi_ptr = true;
    }

    public get(): uint16 {
        return touint16(((this.val[0]) << 8) | (this.val[1]))
    }

    public set(data: uint16) {
        this.val[0] = (data >> 8) as uint8;
        this.val[1] = (data & 0xFF) as uint8;
    }

    public update(data: uint8) {
        if (this.hi_ptr) {
            this.val[0] = data;
        }
        else {
            this.val[1] = data;
        }
 
        if (this.get() > 0x3FFF) { //mirror down addr above 0x3fff
            this.set(uint16_AND(this.get(), 0b11111111111111));
        }
        this.hi_ptr = !this.hi_ptr;
    }

    public increment(inc: uint8) {
        const low_byte = this.val[1];
        this.val[1] = uint8_ADD(this.val[1], inc);
        if (low_byte > this.val[1]) {
            this.val[0] = uint8_ADD(this.val[0], 1);
        }
        if (this.get() > 0x3fff) {
            this.set(uint16_AND(this.get(), 0b11111111111111));
        }
    }

    public reset_latch() {
        this.hi_ptr = true;
    }
    
}