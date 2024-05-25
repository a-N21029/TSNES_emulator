import { uint16, uint8 } from "../types";

const RAM: uint16 = 0x0000 as uint16;
const RAM_MIRRORS_END: uint16 = 0x1FFF as uint16;
const PPU_REGISTERS: uint16 = 0x2000 as uint16;
const PPU_REGISTERS_MIRRORS_END: uint16 = 0x3FFF as uint16;

export class Bus{
    public cpu_vram: uint8[]; // cpu RAM is 2KiB

    public constructor() {
        // NES address space is 64KiB in size.
        this.cpu_vram = Array<uint8>(2048); // CPU only has 2KiB of RAM, everything else is for memory mapping
    }

    // BUS MEMORY OPERATIONS
    public mem_read(addr: uint16): uint8 {
        if((RAM <= addr) && (addr <= RAM_MIRRORS_END)) { // the bus needs to zero out the highest 2 bits if it receives a request in the range of [0x0000 … 0x2000] because of mirroring
            const mirror_down_addr = addr & 0b00000111_11111111;
            return this.cpu_vram[mirror_down_addr];
        }
        else if((PPU_REGISTERS <= addr) && (addr <= PPU_REGISTERS_MIRRORS_END)) {
            const mirror_down_addr = addr & 0b00100000_00000111;
            return this.cpu_vram[mirror_down_addr];
        }
        return 0 as uint8;
    }

    public mem_write(addr: uint16, data: uint8) {
        if((RAM <= addr) && (addr <= RAM_MIRRORS_END)) { // the bus needs to zero out the highest 2 bits if it receives a request in the range of [0x0000 … 0x2000] because of mirroring
            const mirror_down_addr = addr & 0b00000111_11111111;
            this.cpu_vram[mirror_down_addr] = data;
        }
        else if((PPU_REGISTERS <= addr) && (addr <= PPU_REGISTERS_MIRRORS_END)) {
            const mirror_down_addr = addr & 0b00100000_00000111;
            // this.cpu_vram[mirror_down_addr] = data;
        }
        return 0 as uint8;
    } 
}