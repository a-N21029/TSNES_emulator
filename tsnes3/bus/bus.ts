import { PPU } from "../ppu/ppu";
import { ROM } from "../rom/rom";
import { program, touint16, uint16, uint16_ADD, uint8 } from "../types";

const RAM: uint16 = 0x0000 as uint16;
const RAM_MIRRORS_END: uint16 = 0x1FFF as uint16;
const PPU_REGISTERS: uint16 = 0x2000 as uint16;
const PPU_REGISTERS_END: uint16 = 0x2008 as uint16;
const PPU_REGISTERS_MIRRORS_END: uint16 = 0x3FFF as uint16;

export class Bus{
    public cpu_vram: uint8[]; // cpu RAM is 2KiB
    public rom: ROM;
    public ppu: PPU;

    public cycles: number;

    public gameloop_callback: (ppu: PPU) => void;

    public constructor(prog: program, glcb: (ppu: PPU) => void) {
        // NES address space is 64KiB in size.
        this.cpu_vram = Array<uint8>(2048); // CPU only has 2KiB of RAM, everything else is for memory mapping
        this.rom = new ROM(prog);
        this.ppu = new PPU(this.rom.chr_rom, this.rom.screen_mirroring);
        this.cycles = 0;

        this.gameloop_callback = glcb;
    }

    // BUS MEMORY OPERATIONS
    public mem_read(addr: uint16): uint8 {
        if((RAM <= addr) && (addr <= RAM_MIRRORS_END)) { // the bus needs to zero out the highest 2 bits if it receives a request in the range of [0x0000 … 0x2000] because of mirroring
            const mirror_down_addr = addr & 0b00000111_11111111;
            return this.cpu_vram[mirror_down_addr];
        }
        else if((addr === 0x2000) || (addr === 0x2001) || (addr === 0x2003) || (addr === 0x2005) || (addr === 0x2006) || (addr === 0x4014)) {
            console.error(`Attempting to read from write-only PPU address ${addr}`);
        }
        else if(addr == 0x2007) {
            this.ppu.read_data();
        }
        else if((PPU_REGISTERS_END <= addr) && (addr <= PPU_REGISTERS_MIRRORS_END)) {
            const mirror_down_addr: uint16 = touint16(addr & 0b00100000_00000111);
            return this.mem_read(mirror_down_addr);
            // return this.cpu_vram[mirror_down_addr];
        }
        else if ((0x8000 <= addr) && (addr <= 0xFFFF)) {
            return this.read_prg_rom(addr);
        }
        return 0 as uint8;
    }

    public mem_write(addr: uint16, data: uint8) {
        if((RAM <= addr) && (addr <= RAM_MIRRORS_END)) { // the bus needs to zero out the highest 2 bits if it receives a request in the range of [0x0000 … 0x2000] because of mirroring
            const mirror_down_addr = addr & 0b00000111_11111111;
            this.cpu_vram[mirror_down_addr] = data;
        }
        else if(addr == 0x2000) {
            this.ppu.write_to_ppu_ctrl(data);
        }
        else if(addr == 0x2006) {
            this.ppu.write_to_ppu_addr(data);
        }
        else if(addr == 0x2007) {
            this.ppu.write_data(data);
        }
        else if((PPU_REGISTERS_END <= addr) && (addr <= PPU_REGISTERS_MIRRORS_END)) {
            const mirror_down_addr: uint16 = touint16(addr & 0b00100000_00000111);
            this.mem_write(mirror_down_addr, data);
            // this.cpu_vram[mirror_down_addr] = data;
        }
        else if ((0x8000 <= addr) && (addr <= 0xFFFF)) {
            console.error(`Attempting to write to cartride rom space at addr = ${addr}`);
        }
        return 0 as uint8;
    } 

    public read_prg_rom(addr: uint16): uint8 {
        addr = uint16_ADD(addr, -0x8000);
        if((this.rom.prg_rom.length === 0x4000) && (addr >= 0x4000)) {
            //mirror if needed
            addr = touint16(addr % 0x4000);
        }
        return this.rom.prg_rom[addr]
    }

    public tick(cycles: uint8) {
        this.cycles += cycles;
        const nmi_before = this.ppu.nmi_interrupt;
        this.ppu.tick((cycles * 3) as uint8) // 3 PPU cycles = 1 CPU cycle
        const nmi_after = this.ppu.nmi_interrupt;

        if (!nmi_before && nmi_after){
            this.gameloop_callback(this.ppu);
        }
    }

    public poll_nmi_status(): boolean {
        return this.ppu.nmi_interrupt;
    }
}