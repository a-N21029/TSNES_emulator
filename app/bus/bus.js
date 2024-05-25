"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bus = void 0;
var RAM = 0x0000;
var RAM_MIRRORS_END = 0x1FFF;
var PPU_REGISTERS = 0x2000;
var PPU_REGISTERS_END = 0x2008;
var PPU_REGISTERS_MIRRORS_END = 0x3FFF;
var Bus = /** @class */ (function () {
    function Bus(prog, glcb) {
        // NES address space is 64KiB in size.
        this.cpu_vram = Array(2048); // CPU only has 2KiB of RAM, everything else is for memory mapping
        this.rom = new ROM(prog);
        this.ppu = new PPU(this.rom.chr_rom, this.rom.screen_mirroring);
        this.cycles = 0;
        this.gameloop_callback = glcb;
    }
    // BUS MEMORY OPERATIONS
    Bus.prototype.mem_read = function (addr) {
        if ((RAM <= addr) && (addr <= RAM_MIRRORS_END)) { // the bus needs to zero out the highest 2 bits if it receives a request in the range of [0x0000 … 0x2000] because of mirroring
            var mirror_down_addr = addr & 2047;
            return this.cpu_vram[mirror_down_addr];
        }
        else if ((addr === 0x2000) || (addr === 0x2001) || (addr === 0x2003) || (addr === 0x2005) || (addr === 0x2006) || (addr === 0x4014)) {
            console.error("Attempting to read from write-only PPU address ".concat(addr));
        }
        else if (addr == 0x2007) {
            this.ppu.read_data();
        }
        else if ((PPU_REGISTERS_END <= addr) && (addr <= PPU_REGISTERS_MIRRORS_END)) {
            var mirror_down_addr = (0, touint16)(addr & 8199);
            return this.mem_read(mirror_down_addr);
            // return this.cpu_vram[mirror_down_addr];
        }
        else if ((0x8000 <= addr) && (addr <= 0xFFFF)) {
            return this.read_prg_rom(addr);
        }
        return 0;
    };
    Bus.prototype.mem_write = function (addr, data) {
        if ((RAM <= addr) && (addr <= RAM_MIRRORS_END)) { // the bus needs to zero out the highest 2 bits if it receives a request in the range of [0x0000 … 0x2000] because of mirroring
            var mirror_down_addr = addr & 2047;
            this.cpu_vram[mirror_down_addr] = data;
        }
        else if (addr == 0x2000) {
            this.ppu.write_to_ppu_ctrl(data);
        }
        else if (addr == 0x2006) {
            this.ppu.write_to_ppu_addr(data);
        }
        else if (addr == 0x2007) {
            this.ppu.write_data(data);
        }
        else if ((PPU_REGISTERS_END <= addr) && (addr <= PPU_REGISTERS_MIRRORS_END)) {
            var mirror_down_addr = (0, touint16)(addr & 8199);
            this.mem_write(mirror_down_addr, data);
            // this.cpu_vram[mirror_down_addr] = data;
        }
        else if ((0x8000 <= addr) && (addr <= 0xFFFF)) {
            console.error("Attempting to write to cartride rom space at addr = ".concat(addr));
        }
        return 0;
    };
    Bus.prototype.read_prg_rom = function (addr) {
        addr = (0, uint16_ADD)(addr, -0x8000);
        if ((this.rom.prg_rom.length === 0x4000) && (addr >= 0x4000)) {
            //mirror if needed
            addr = (0, touint16)(addr % 0x4000);
        }
        return this.rom.prg_rom[addr];
    };
    Bus.prototype.tick = function (cycles) {
        this.cycles += cycles;
        var nmi_before = this.ppu.nmi_interrupt;
        this.ppu.tick((cycles * 3)); // 3 PPU cycles = 1 CPU cycle
        var nmi_after = this.ppu.nmi_interrupt;
        if (!nmi_before && nmi_after) {
            this.gameloop_callback(this.ppu);
        }
    };
    Bus.prototype.poll_nmi_status = function () {
        return this.ppu.nmi_interrupt;
    };
    return Bus;
}());
exports.Bus = Bus;
