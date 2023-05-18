import {instruction_lookup, INSTRUTION_NAME, ADDRESSING_MODE, OPERATION, ADDRESSING_MODE_FUNC, CYCLES_REQUIRED} from "./opcodes";
import { IMM, IMP, ZP0, ZPX, ZPY, REL, ABS, ABX, ABY, IND, IZX, IZY } from "./a_modes"


class Instruction { // representation of an instruction and its related information
    instr_name:string;
    addr_mode_name:string;
    addr_mode: any;
    operation:any;
    cycles_req:number; // based on the addressing mode and operation, additional clock cycles may be required

    constructor(instr_name:string, addr_mode_name:string,  addr_mode:any, operation:any, cycles_req:number){
        this.instr_name = instr_name;
        this.addr_mode_name = addr_mode_name;
        this.addr_mode = addr_mode;
        this.operation = operation;
        this.cycles_req = cycles_req;
    }
}

interface FLAGS6502 {
    C: number;
    Z: number;
    I: number;
    D: number;
    B: number;
    U: number;
    V: number;
    N: number;
}
export class Processor6502 { // NES CPU used a 6502 processor

    // 6502 processor registers. All are 8-bit registers except for the program counter, which is 16
    a:number;    	    // Accumulator Register
	x:number;     	    // X Register
	y:number;     	    // Y Register
	stkp:number;   	    // Stack Pointer (points to location on bus)
	pc:number;          // Program Counter
	status:number; 	    // Status Register
    FLAGS6502:FLAGS6502;   // The flags which are represented in the status register 
    addr_abs:number;    // All used memory addresses end up in here
	addr_rel:number;    // Represents absolute address following a branch
	opcode:number;      // Is the instruction byte of the current instruction
	cycles:number;	    // Counts how many cycles the current instruction has remaining
    fetched:number;     // some instructions may require to fetch data, that data will be stored here in intermediate steps
    instruction_lookup:any; // look up table for each instruction and addressing mode
    bus:Bus | any; // only null upon initialization

    constructor(){
        this.a=0x00;
        this.x=0x00;
        this.y=0x00;
        this.stkp=0x00;
        this.pc=0x0000;
        this.status=0x00;
        this.FLAGS6502 = Object.freeze(
        {
            C :1 << 0,	// Carry Bit
            Z :1 << 1,	// Zero
            I :1 << 2,	// Disable Interrupts
            D :1 << 3,	// Decimal Mode (unused in this implementation, since NES did not really make use of this flag)
            B :1 << 4,	// Break
            U :1 << 5,	// Unused
            V :1 << 6,	// Overflow
            N :1 << 7,	// Negative
        });
        this.addr_abs = 0x0000;
        this.addr_rel = 0x00;
        this. opcode  = 0x00;
        this. cycles  = 0;
        this.fetched = 0x00;
        this.instruction_lookup = instruction_lookup;
        this.bus = null;
    }

    read(addr:number) {
        return this.bus.cpuread(addr);
    }

    write(addr:number, data:number)
    {
        this.bus.cpuwrite(addr, data)
    }

    // Sets or clears a specific bit of the status register
    // precondition: f is one of the members of this.FLAGS6502
    SetFlag(f:number, v:number)
    {
        if (v)
            this.status |= f;
        else
            this.status &= ~f;
    }

    GetFlag(f:number)
    {
        return ((this.status & f) > 0) ? 1 : 0;
    }

    // Reset Interrupt - Forces CPU into known state
    // Get address to set program counter to
    reset(){
        this.addr_abs = 0xFFFC;
        const low = this.read(this.addr_abs + 0);
        const high = this.read(this.addr_abs + 1);

        // Set it
        this.pc = (high << 8) | low;

        // Reset internal registers
        this.a = 0;
        this.x = 0;
        this.y = 0;
        this.stkp = 0xFD;
        this.status = 0x00 | this.FLAGS6502.U;

        // Clear internal helper variables
        this.addr_rel = 0x0000;
        this.addr_abs = 0x0000;
        this.fetched = 0x00;

        // Reset takes time to execute
        this.cycles = 8;
    }

    // Interrupt requests are a complex operation and only happen if the
    // "disable interrupt" flag is 0. IRQs can happen at any time, but
    // you dont want them to be destructive to the operation of the running 
    // program. Therefore the current instruction is allowed to finish

    irq() {		// Interrupt Request - Executes an instruction at a specific location
        // If interrupts are allowed
	if (this.GetFlag(this.FLAGS6502.I) === 0)
        {
            // Push the program counter to the stack. It's 16-bits dont
            // forget so that takes two pushes
            this.write(0x0100 + this.stkp, (this.pc >> 8) & 0x00FF);
            this.stkp--;
            this.write(0x0100 + this.stkp, this.pc & 0x00FF);
            this.stkp--;

            // Then Push the status register to the stack
            this.SetFlag(this.FLAGS6502.B, 0);
            this. SetFlag(this.FLAGS6502.U, 1);
            this.SetFlag(this.FLAGS6502.I, 1);
            this.write(0x0100 + this.stkp, this.status);
            this.stkp--;

            // Read new program counter location from fixed address
            this.addr_abs = 0xFFFE;
            const low = this.read(this.addr_abs + 0);
            const high = this.read(this.addr_abs + 1);
            this.pc = (high << 8) | low;

            // IRQs take time
            this.cycles = 7;
        }
    }

    // A Non-Maskable Interrupt cannot be ignored. It behaves in exactly the
    // same way as a regular IRQ, but reads the new program counter address
    // form location 0xFFFA.
    nmi() {		// Non-Maskable Interrupt Request - As above, but cannot be disabled
        this.write(0x0100 + this.stkp, (this.pc >> 8) & 0x00FF);
        this.stkp--;
        this.write(0x0100 + this.stkp, this.pc & 0x00FF);
        this.stkp--;

        this.SetFlag(this.FLAGS6502.B, 0);
        this.SetFlag(this.FLAGS6502.U, 1);
        this.SetFlag(this.FLAGS6502.I, 1);
        this.write(0x0100 + this.stkp, this.status);
        this.stkp--;

        this.addr_abs = 0xFFFA;
        const low = this.read(this.addr_abs + 0);
        const high =this. read(this.addr_abs + 1);
        this.pc = (high << 8) | low;

        this.cycles = 8;
    }

    clock() {	// Perform one clock cycle's worth of update
        if (this.cycles === 0)
        {
            // Read next instruction byte. This 8-bit value is used to index
            // the translation table to get the relevant information about
            // how to implement the instruction
            this.opcode = this.read(this.pc);
            this.pc++;
            
            // include additional clock cycle if applicable
            const additional_cycle1 = this.instruction_lookup[this.opcode][OPERATION]();
            const additional_cycle2 = this.instruction_lookup[this.opcode][ADDRESSING_MODE_FUNC](this);

            this.cycles = this.instruction_lookup[this.opcode][CYCLES_REQUIRED] + (additional_cycle1 & additional_cycle2);
        }

        this.cycles--;
    }

    // Fetch an instruction from memory. The read location of data can come from two sources, a memory address, or
	// its immediately available as part of the instruction. This function decides
	// depending on address mode of instruction byte
	fetch (){
		// Some instructions dont have to 
		// fetch data as the source is implied by the instruction. For example
		// "INX" increments the X register. There is no additional data
		// required.
		if (!(this.instruction_lookup[this.opcode][ADDRESSING_MODE] === "IMP"))
		{
			this.fetched = this.read(this.addr_abs);
		}
		return this.fetched;
    }
}

// NES PPU was made of a 2C02 chip
class PPU2C02
{
    cartridge:Cartridge | any;
    vram: Uint8Array; // PPU vram is 2kb
    palette: Uint8Array; // 32 entries in palette table

    constructor(){
        this.cartridge = null; // ppu is not connected to a cartridge on initialization
        this.vram = new Uint8Array(2048);
        this.palette = new Uint8Array(32);
    }

    cpuread(addr:number){ // cpu can only address 8 different locations in ppu
        let data = 0x00;

        switch (addr)
        {
        case 0x0000: // Control
            break;
        case 0x0001: // Mask
            break;
        case 0x0002: // Status
            break;
        case 0x0003: // OAM Address
            break;
        case 0x0004: // OAM Data
            break;
        case 0x0005: // Scroll
            break;
        case 0x0006: // PPU Address
            break;
        case 0x0007: // PPU Data
            break;
        }
    
        return data;
    }

    cpuwrite(addr:number, data:number){
        switch (addr)
        {
        case 0x0000: // Control
            break;
        case 0x0001: // Mask
            break;
        case 0x0002: // Status
            break;
        case 0x0003: // OAM Address
            break;
        case 0x0004: // OAM Data
            break;
        case 0x0005: // Scroll
            break;
        case 0x0006: // PPU Address
            break;
        case 0x0007: // PPU Data
            break;
        }
    }

    ppuread(addr:number){
        return 0x00; // certain behaviour required when ppu reads from its own bus, will work on that later
    }

    ppuwrite(addr:number, data:number){
        return 0x00; // certain behaviour required when ppu reads from its own bus, will work on that later
    }
}


interface Cartridge_Header{
    name: string;
    PRG_rom_chunks:number;
    CHR_rom_chunks:number;
    mapper1:number;
    mapper2:number;
    PRG_ram_size: number;
    TV_system1: number;
    TV_system2: number;
    unused: Uint8Array; // unuesed padding

}
export class Cartridge{ // the NES files will be represented here. See here for more info: // https://www.nesdev.org/wiki/INES

    header: Cartridge_Header;
    PRGMemory:Uint8Array; // program memory, each index of the array represents a byte
    CHRMemory:Uint8Array; // sprite memory, each index of the array represents a byte

    mapperID:number; // which mapper is being used. See Mappers classes for more info on mappers
    mapperClass:Mapper0; // the mapper that the current cartridge is using
    num_PRG_Banks:number; // number of banks in PRG memory
    num_CHR_Banks:number; // number of banks in CHR memory

    constructor(game:File|null=null){
        this.PRGMemory = new Uint8Array();
        this.CHRMemory = new Uint8Array();

        this.mapperID = 0;
        this.num_PRG_Banks = 0;
        this.num_CHR_Banks = 0;

        // read file data
        if(game)
        {
            const reader = new FileReader();
            reader.readAsArrayBuffer(game);
            // when user uploads an nes file, this function will trigger and process it
            reader.onload = () => {
                const buffer:ArrayBuffer = reader.result as ArrayBuffer;
                const content = new Uint8Array(buffer);

                // read file header (first 16 bytes)

                this.header = Object.freeze(
                    {
                        name: String.fromCharCode(...content.slice(0,3)),
                        PRG_rom_chunks: content[4],
                        CHR_rom_chunks: content[5],
                        mapper1: content[6],
                        mapper2: content[7],
                        PRG_ram_size: content[8],
                        TV_system1: content[9],
                        TV_system2: content[10],
                        unused: content.slice(11,16)
                    }
                );

                // If a "trainer" exists we can just ignore it
		        // and start reading actual file data
                let next_byte = this.header.mapper1 & 0x04 ? 512 + 16 - 1 : 16;

                // Determine Mapper ID
                this.mapperID = ((this.header.mapper2 >> 4) << 4) | (this.header.mapper1 >> 4);

                // There are 3 types of iNES files, find which one this file is
                const fileType:number = 1; // placeholder for now since work will be done mainly on type 1 for the time being, will come back to this later
                
                switch(fileType)
                {
                    case 0:
                        break;
                    case 1:
                        this.num_PRG_Banks = this.header.PRG_rom_chunks;
                        this.PRGMemory = new Uint8Array(content.slice(next_byte, this.num_PRG_Banks * 16384)); // resize PRG memory to match number of banks
                        next_byte += this.num_PRG_Banks * 16384;

                        this.num_CHR_Banks = this.header.CHR_rom_chunks;
                        this.CHRMemory = new Uint8Array(content.slice(next_byte, this.num_CHR_Banks * 8192)); // resize CHR memory to match number of banks
                        next_byte += this.num_CHR_Banks * 8192;
                        break;
                    case 2:
                        break;
                }

                switch(this.mapperID)
                {
                    case 0:
                        this.mapperClass = new Mapper0(this.num_PRG_Banks, this.num_CHR_Banks);
                }
            }
        }
    }
    cpuread(addr:number, data:number){
        let mapped_addr = 0;
        if (this.mapperClass.cpumapread(addr, data))
        {
            data = this.PRGMemory[mapped_addr];
            return data;
        }
        else
            return 0x00;
    }

    cpuwrite(addr:number, data:number){
        let mapped_addr = 0;
        if (this.mapperClass.cpumapread(addr, data))
        {
            this.PRGMemory[mapped_addr] = data;
            return data;
        }
        else
            return 0x00;
    }

    ppuread(addr:number, data:number){
        let mapped_addr = 0;
        if (this.mapperClass.ppumapread(addr, data))
        {
            data = this.CHRMemory[mapped_addr];
            return data;
        }
        else
            return 0x00;
    }

    ppuwrite(addr:number, data:number){
        let mapped_addr = 0;
        if (this.mapperClass.ppumapread(addr, data))
        {
            this.CHRMemory[mapped_addr] = data;
            return data;
        }
        else
            return 0x00;
    }
}

class Mapper0
{
    num_PRG_banks:number;
    num_CHR_banks: number;

    constructor(nprg:number, nchr:number){
        this.num_PRG_banks = nprg;
        this.num_CHR_banks = nchr;
    }

    // if PRGROM is 16KB
	//     CPU Address Bus          PRG ROM
	//     0x8000 -> 0xBFFF: Map    0x0000 -> 0x3FFF
	//     0xC000 -> 0xFFFF: Mirror 0x0000 -> 0x3FFF
	// if PRGROM is 32KB
	//     CPU Address Bus          PRG ROM
	//     0x8000 -> 0xFFFF: Map    0x0000 -> 0x7FFF
    cpumapread(addr:number, mapped_addr:number){
        if (0x8000 <= addr && addr <= 0xFFFF)
        {
            mapped_addr = addr & (this.num_PRG_banks > 1 ? 0x7FFF : 0x3FFF);
            return mapped_addr;
        }

	    return 0x0000;
    }
    cpumapwrite(addr:number, mapped_addr:number){
        if (0x8000 <= addr && addr <= 0xFFFF)
        {
            mapped_addr = addr & (this.num_PRG_banks > 1 ? 0x7FFF : 0x3FFF);
            return mapped_addr;
        }

	    return 0x0000;
    }
    
    // There is no mapping required for PPU
	// PPU Address Bus          CHR ROM
	// 0x0000 -> 0x1FFF: Map    0x0000 -> 0x1FFF
    ppumapread(addr:number, mapped_addr:number){
        if (0x8000 <= addr && addr <= 0x1FFF)
        {
            return true;
        }
        return false;
    }

    ppumapwrite(addr:number, mapped_addr:number){
        if (addr >= 0x0000 && addr <= 0x1FFF)
        {
            if (this.num_CHR_banks === 0)
            {
                // Treat as RAM
                mapped_addr = addr;
                return true;
            }
        }
	    return false;
    }
}

class Bus {

    // The devices connected to the bus
    cpu:Processor6502; // the central processing unit responsible for executing instructions
    ram:Uint8Array; // internal RAM is 8kb but overall only 2kb are usable because of the way memory was addressed in NES
    ppu:PPU2C02; // picture processing unit
    cartridge:Cartridge | any; // there could be no cartridge that is "inserted" at the moment

    total_clock_cycles:number; // keep track of how many clock cycles have ocurred so far
    


    constructor(cpu:Processor6502, ppu:PPU2C02){
        this.cpu = cpu;
        this.ram = new Uint8Array(2048);
        this.ppu = ppu;
        this.cartridge = null; // no cartridge on initialization
        
        this.cpu.bus = this;
        this.total_clock_cycles = 0;
    }

    // read and write operations to the bus
    cpuread(addr:number) {
        if (0x0000 <= addr && addr <= 0x1FFF){  // only read the contents if they are within addressable range (first 8kb of bus)
            return this.ram[addr & 0x07FF];     // memory is mirrored every 2kb, bitwise AND with 2kb to wrap around the useable RAM space 
        }
        else if (0x2000 <= addr && addr <= 0x3FFF){  // addressable range of PPU
            return this.ppu.cpuread(addr & 0x07FF);
        }
        return 0x00;
    }

    cpuwrite(addr:number, data:number){
        if (0x0000 <= addr && addr <= 0x1FFF){
            this.ram[addr & 0x07FF] = data
        }
        else if (0x2000 <= addr && addr <= 0x3FFF){
            this.ppu.cpuwrite(addr & 0x0007, data);
        }
    }

    // the "user interactions" with the emulator

    insertCartridge(cartridge:Cartridge){ // "inserting" a game cartridge into the NES console
        this.cartridge = cartridge;
        this.ppu.cartridge = cartridge;
    }

    reset(){ // "resetting" the console
        this.cpu.reset();
        this.total_clock_cycles = 0;
    }

    clock(){ // will perform one system tick of the emulation

    }
}

// export default Processor6502
