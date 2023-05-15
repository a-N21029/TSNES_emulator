import {instruction_lookup, INSTRUTION_NAME, ADDRESSING_MODE, OPERATION, ADDRESSING_MODE_FUNC, CYCLES_REQUIRED} from "./opcodes";
import { IMM, IMP, ZP0, ZPX, ZPY, REL, ABS, ABX, ABY, IND, IZX, IZY } from "../6502Processor/a_modes"


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

class Processor6502 {

    // 6502 processor registers. All are 8-bit registers except for the program counter, which is 16
    a:number;    	    // Accumulator Register
	x:number;     	    // X Register
	y:number;     	    // Y Register
	stkp:number;   	    // Stack Pointer (points to location on bus)
	pc:number;          // Program Counter
	status:number; 	    // Status Register
    FLAGS6502:object;   // The flags which are represented in the status register 
    addr_abs:number;    // All used memory addresses end up in here
	addr_rel:number;    // Represents absolute address following a branch
	opcode:number;      // Is the instruction byte of the current instruction
	cycles:number;	    // Counts how many cycles the current instruction has remaining
    fetched:number;     // some instructions may require to fetch data, that data will be stored here in intermediate steps
    instruction_lookup:any; // look up table for each instruction and addressing mode
    bus:Bus;

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
        this.bus = new Bus(this);
    }

    read(addr:number) {
        return this.bus.read(addr);
    }

    write(addr:number, data:number)
    {
        this.bus.write(addr, data)
    }

    reset(){	// Reset Interrupt - Forces CPU into known state
    
    }

    irq() {		// Interrupt Request - Executes an instruction at a specific location

    }

    nmi() {		// Non-Maskable Interrupt Request - As above, but cannot be disabled

    }

    clock() {	// Perform one clock cycle's worth of update
        if (this.cycles == 0)
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

    fetch (){
    }
}


class Bus {

    // The devices connected to the bus
    cpu:Processor6502; // the central processing unit responsible for executing instructions
    ram:Uint8Array; // RAM is 64k

    constructor(cpu:Processor6502){
        this.cpu = cpu;
        this.ram = new Uint8Array(64*1024);
    }

    // read and write operations to the bus
    read(addr:number) {
        if (0x0000 <= addr && addr <= 0xFFFF){
            return this.ram[addr]; // only read the contents if they are within address range
        }
        return 0x00;
    }

    write(addr:number, data:number){
        if (0x0000 <= addr && addr <= 0xFFFF){
            this.ram[addr] = data
        }
    }
}

export default Processor6502
