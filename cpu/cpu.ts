import { AddressingMode, opcodes } from './opcodes';
import {uint8, uint16, program, uint8_OR, uint3, uint8_AND, uint16_ADD, uint8_ADD, uint16_AND, touint16, touint8, int8, toint8, uint8_XOR} from '../types'
import { memcpy } from '../util';
import { Bus } from '../bus/bus';
import { game } from '../nes_small_testfile';
import { nestest } from '../nestest/nestest';
import { pacman } from '../PacMan';


const STACK_SIZE: uint16 = 0x100 as uint16; // 6502 stack is located between addressess $0100-$01FF

enum InterruptType {
    NMI,
}

interface Interrupt {
    itype: InterruptType;
    vector_addr: uint16;
    b_flag_mask: uint8;
    cpu_cycles: uint8;
}

class Interrupt implements Interrupt {
    public constructor(itype: InterruptType, v_addr: uint16, b_flag_mask: uint8, cycles: uint8) {
        this.itype = itype;
        this.vector_addr = v_addr;
        this.b_flag_mask = b_flag_mask;
        this.cpu_cycles = cycles;
    }
}

const NMI_INTERRUPT = new Interrupt(InterruptType.NMI, 0xFFFA as uint16, 0b00100000 as uint8, 2 as uint8);

export class CPU{
    // status register flags:
    // N: Negative flag        MOST SIGNIFICANT BIT
    // V: Overflow flag                 ^
    // B: Break command                 |
    // D: Decimal mode flag             |
    // I: Interrupt disable             |
    // Z: Zero flag                     V
    // C: Carry flag           LEAST SIGNIFICANT BIT

    private register_a: uint8;   // accumulator register
    private register_x: uint8;   // X register
    private register_y: uint8;   // Y register
    public status:      uint8;   // status register
    private pc:         uint16;  // program counter
    private sp:         uint8;   // stack pointer.
    // public RAM: uint8[];
    public bus:         Bus;  
    

    public constructor(bus: Bus) {
        this.register_a = 0    as uint8;
        this.register_x = 0    as uint8;
        this.register_y = 0    as uint8;
        this.status     = 0    as uint8;
        this.pc         = 0    as uint16;
        this.sp         = 0xFF as uint8;
        // this.RAM        = Array<uint8>(0xFFFF);
        this.bus = bus;
    }

    public get_accumulator(): uint8{
        return this.register_a;
    }

    private set_accumulator(val: uint8){
        this.register_a = val;
        this.update_zero_and_negative_flags(this.register_a);
    }

    private add_to_accumulator(val: uint8) {
        let sum:uint16 = uint16_ADD(touint16(this.register_a),val);
        if (this.status_carry()) {
            sum = uint16_ADD(sum, 1);
        }

        const carry:boolean = sum > 0xFF;
        carry ? this.set_carry() : this.unset_carry();

        const res = touint8(sum);
        
        // dealing with overflow: http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html
        if (((val ^ res) & (res ^ this.register_a) & 0x80) != 0) {
            this.set_overflow();
        }
        else {
            this.unset_overflow();
        }

        this.set_accumulator(res);
    }

    public get_X():uint8 {
        return this.register_x;
    }

    private set_X(val: uint8) {
        this.register_x = val;
        this.update_zero_and_negative_flags(this.register_x);
    }

    private set_Y(val: uint8) {
        this.register_y = val;
        this.update_zero_and_negative_flags(this.register_y);
    }

    public get_status(): uint8{
        return this.status;
    }

    public status_carry(): boolean {
        return (this.status & 0b0000_0001) === 0b0000_0001 ;
    }

    public status_zero(): boolean {
        return (this.status & 0b0000_0010) === 0b0000_0010 ;
    }
    
    public status_negative(): boolean {
        return (this.status & 0b1000_0000) === 0b1000_0000 ;
    }

    public status_overflow(): boolean {
        return (this.status & 0b0100_0000) === 0b0100_0000;
    }

    private set_carry(): void {
        this.status = uint8_OR(this.status, 0b0000_0001);
    }

    private unset_carry(): void {
        this.status = uint8_AND(this.status, ~0b0000_0001);
    }

    private set_zero(): void {
        this.status = uint8_OR(this.status, 0b0000_0010);
    }

    private unset_zero(): void {
        this.status = uint8_AND(this.status, ~0b0000_0010);
    }

    private set_interrupt(): void {
        this.status = uint8_OR(this.status, 0b0000_0100);
    }

    private unset_interrupt(): void {
        this.status = uint8_AND(this.status, ~0b0000_0100);
    }

    private set_decimal(): void {
        this.status = uint8_OR(this.status, 0b0000_1000);
    }

    private unset_decimal(): void {
        this.status = uint8_AND(this.status, ~0b0000_1000);
    }

    private set_break1(): void {
        this.status = uint8_OR(this.status, 0b0001_0000);
    }

    private unset_break1(): void {
        this.status = uint8_AND(this.status, ~0b0001_0000);
    }

    private set_break2(): void {
        this.status = uint8_OR(this.status, 0b0010_0000);
    }

    private unset_break2(): void {
        this.status = uint8_AND(this.status, ~0b0010_0000);
    }

    private set_overflow(): void {
        this.status = uint8_OR(this.status, 0b0100_0000);
    }

    private unset_overflow(): void {
        this.status = uint8_AND(this.status, ~0b0100_0000);
    }

    private set_negative(): void {
        this.status = uint8_OR(this.status, 0b1000_0000);
    }

    private unset_negative(): void {
        this.status = uint8_AND(this.status, ~0b1000_0000);
    }

    public get_program_counter(): uint16{
        return this.pc;
    }

    // The CPU works in a constant cycle:
    // 1. Fetch next execution instruction from the instruction memory
    // 2. Decode the instruction
    // 3. Execute the Instruction
    // 4. (unless there is an interrupt) Repeat the cycle
    public run(prog: program): void {
        this.load(prog);
        this.reset();
        while (this.pc < 0x8000 + prog.length) {
            if(this.bus.poll_nmi_status()) {
                this.interrupt_nmi();
            }
            // console.log(this.pc.toString(16))
            const opcode = this.fetch(this.pc);
            if(this.decode_and_execute(opcode)) {
                return;
            }
        }
    }

    private fetch(addr: uint16): uint8 {
        const res:uint8 = this.mem_read(addr);
        this.increment_pc();
        return res;
    }

    // 6502 Reference: https://www.nesdev.org/obelisk-6502-guide/reference.html
    // return 1 if an interrupt was caused by BRK, and 0 otherwise
    private decode_and_execute(opcode: uint8): number {
        // console.log(opcode.toString(16))
        const addr_mode: AddressingMode = opcodes[opcode].addressingMode;
        const cycles: number = opcodes[opcode].cycles;
        const old_pc:uint16 = this.pc;
        switch (opcode) {
            case 0x69:
            case 0x65:
            case 0x75:
            case 0x6D:
            case 0x7D:
            case 0x79:
            case 0x61:
            case 0x71:
                this.ADC(addr_mode);
                break;
            case 0x29:
            case 0x25:
            case 0x35:
            case 0x2D:
            case 0x3D:
            case 0x39:
            case 0x21:
            case 0x31:
                this.AND(addr_mode);
                break;
            case 0x0A:
                this.ASL_accum();
                break;
            case 0x06:
            case 0x16:
            case 0x0E:
            case 0x1E:
                this.ASL(addr_mode);
                break;
            case 0x00: // BRK
                return 1;
            case 0x90:
                this.BCC();
                break;
            case 0xB0:
                this.BCS();
                break;
            case 0xF0:
                this.BEQ();
                break;
            case 0x24:
            case 0x2C:
                this.BIT(addr_mode);
                break;
            case 0x30:
                this.BMI();
                break;
            case 0xD0:
                this.BNE();
                break;
            case 0x10:
                this.BPL();
                break;
            case 0x50:
                this.BVC();
                break;
            case 0x70:
                this.BVS();
                break;
            case 0x18:
                this.CLC();
                break;
            case 0xD8:
                this.CLD();
                break;
            case 0x58:
                this.CLI();
                break;
            case 0xB8:
                this.CLV();
                break;
            case 0xC9:
            case 0xC5:
            case 0xD5:
            case 0xCD:
            case 0xDD:
            case 0xD9:
            case 0xC1:
            case 0xD1:
                this.CMP(addr_mode);
                break;
            case 0xE0:
            case 0xE4:
            case 0xEC:
                this.CPX(addr_mode);
                break;
            case 0xC0:
            case 0xC4:
            case 0xCC:
                this.CPY(addr_mode);
                break;
            case 0xC6:
            case 0xD6:
            case 0xCE:
            case 0xDE:
                this.DEC(addr_mode);
                break;
            case 0xCA:
                this.DEX();
                break;
            case 0x88:
                this.DEY();
                break;
            case 0x49:
            case 0x45:
            case 0x55:
            case 0x4D:
            case 0x5D:
            case 0x59:
            case 0x41:
            case 0x51:
                this.EOR(addr_mode);
                break;
            case 0xE6:
            case 0xF6:
            case 0xEE:
            case 0xFE:
                this.INC(addr_mode);
                break;
            case 0xE8:
                this.INX();
                break;
            case 0xC8:
                this.INY();
                break;
            case 0x4C:
                this.JMP_abs();
                break;
            case 0x6C:
                this.JMP_ind();
                break;
            case 0x20:
                this.JSR();
                break;
            case 0xA9:
            case 0xA5:
            case 0xB5:
            case 0xAD:
            case 0xBD:
            case 0xB9:
            case 0xA1:
            case 0xB1:
                this.LDA(addr_mode);
                break;
            case 0xA2:
            case 0xA6:
            case 0xB6:
            case 0xAE:
            case 0xBE:
                this.LDX(addr_mode);
                break;
            case 0xA0:
            case 0xA4:
            case 0xB4:
            case 0xAC:
            case 0xBC:
                this.LDY(addr_mode);
                break;
            case 0x4A:
                this.LSR_accum();
                break;
            case 0x46:
            case 0x56:
            case 0x4E:
            case 0x5E:
                this.LSR(addr_mode);
                break;
            case 0xEA: // NOP
                break;
            case 0x09:
            case 0x05:
            case 0x15:
            case 0x0D:
            case 0x1D:
            case 0x19:
            case 0x01:
            case 0x11:
                this.ORA(addr_mode);
                break;
            case 0x48:
                this.PHA();
                break;
            case 0x08:
                this.PHP();
                break;
            case 0x68:
                this.PLA();
                break;
            case 0x28:
                this.PLP();
                break;
            case 0x2A:
                this.ROL_accum();
                break;
            case 0x26:
            case 0x36:
            case 0x2E:
            case 0x3E:
                this.ROL(addr_mode);
                break;
            case 0x6A:
                this.ROR_accum();
                break;
            case 0x66:
            case 0x76:
            case 0x6E:
            case 0x7E:
                this.ROR(addr_mode);
                break;
            case 0x40:
                this.RTI();
                break;
            case 0x60:
                this.RTS();
                break;
            case 0xE9:
            case 0xE5:
            case 0xF5:
            case 0xED:
            case 0xFD:
            case 0xF9:
            case 0xE1:
            case 0xF1:
                this.SBC(addr_mode);
                break;
            case 0x38:
                this.SEC();
                break;
            case 0xF8:
                this.SED();
                break;
            case 0x78:
                this.SEI();
                break;
            case 0x85:
            case 0x95:
            case 0x8D:
            case 0x9D:
            case 0x99:
            case 0x81:
            case 0x91:
                this.STA(addr_mode);
                break;
            case 0x86:
            case 0x96:
            case 0x8E:
                this.STX(addr_mode);
                break;
            case 0x84:
            case 0x94:
            case 0x8C:
                this.STY(addr_mode);
                break;
            case 0xAA:
                this.TAX();
                break;
            case 0xA8:
                this.TAY();
                break;
            case 0xBA:
                this.TSX();
                break;
            case 0x8A:
                this.TXA();
                break;
            case 0x9A:
                this.TXS();
                break;
            case 0x98:
                this.TYA();
                break;
            
            // UNOFFICIAL OPCODES

            case 0xc7: // DCP
            case 0xd7:
            case 0xCF:
            case 0xdF:
            case 0xdb:
            case 0xd3:
            case 0xc3:
                this.DCP(addr_mode);
                break;
            case 0x27:
            case 0x37:
            case 0x2F:
            case 0x3F:
            case 0x3b:
            case 0x33:
            case 0x23:
                this.RLA(addr_mode);
                break;
            case 0x07:
            case 0x17:
            case 0x0F:
            case 0x1f:
            case 0x1b:
            case 0x03:
            case 0x13:
                this.SLO(addr_mode);
                break;
            case 0x47:
            case 0x57:
            case 0x4F:
            case 0x5f:
            case 0x5b:
            case 0x43:
            case 0x53:
                this.SRE(addr_mode);
                break;
            case 0x80:
            case 0x82:
            case 0x89:
            case 0xc2:
            case 0xe2:
                break; // 2-byte NOPs
            case 0xCB:
                this.AXS(addr_mode);
                break;
            case 0x6B:
                this.ARR(addr_mode);
                break;
            case 0xEB:
                this.SBC_unofficial(addr_mode);
                break;
            case 0x0B:
            case 0x2B:
                this.ANC(addr_mode);
                break;
            case 0x4B:
                this.ALR(addr_mode);
                break;
            case 0x04:
            case 0x44:
            case 0x64:
            case 0x14:
            case 0x34:
            case 0x54:
            case 0x74:
            case 0xd4:
            case 0xf4:
            case 0x0c:
            case 0x1c:
            case 0x3c:
            case 0x5c:
            case 0x7c:
            case 0xdc:
            case 0xfc: // READ NOPs
                {
                    const [addr, page_crossed] = this.get_operand_address(addr_mode);
                    this.mem_read(addr);
                    if (page_crossed){this.bus.tick(1 as uint8);}
                }
                break;
            case 0x67:
            case 0x77:
            case 0x6f:
            case 0x7f:
            case 0x7b:
            case 0x63:
            case 0x73:
                this.RRA(addr_mode);
                break;
            case 0xe7:
            case 0xf7:
            case 0xef:
            case 0xff:
            case 0xfb:
            case 0xe3:
            case 0xf3:
                this.ISB(addr_mode);
                break;
            case 0x02:
            case 0x12:
            case 0x22:
            case 0x32:
            case 0x42:
            case 0x52:
            case 0x62:
            case 0x72:
            case 0x92:
            case 0xb2:
            case 0xd2:
            case 0xf2:
            case 0x1a:
            case 0x3a:
            case 0x5a:
            case 0x7a:
            case 0xda:
            case 0xfa: // more NOPs
                break;
            case 0xa7:
            case 0xb7:
            case 0xaf:
            case 0xbf:
            case 0xa3:
            case 0xb3:
                this.LAX(addr_mode);
                break;
            case 0x87:
            case 0x97:
            case 0x8f:
            case 0x83:
                this.SAX(addr_mode);
                break;
            case 0xAB:
                this.LXA(addr_mode);
                break;
            case 0x8B:
                this.XAA(addr_mode);
                break;
            case 0xBB:
                this.LAS(addr_mode);
                break;
            case 0x9B:
                this.TAS();
                break;
            case 0x93:
                this.AHX_Indirect_Y();
                break;
            case 0x9F:
                this.AHX_Absolute_Y();
                break;
            case 0x9E:
                this.SHX();
                break;
            case 0x9C:
                this.SHY();
                break;
        }
        // if there were no jump/branch instructions that altered the pc
        this.bus.tick(cycles as uint8);
        if (old_pc == this.pc) {
            // make sure to increment pc accordingly
            this.pc = uint16_ADD(this.pc, opcodes[opcode].size - 1);
        }
        return 0;
    }

    // HELPER METHODS

    private increment_pc() {
        this.pc = uint16_ADD(this.pc, 1);
    }

    private status_bit_isset(result: uint8, bit_position: uint3): boolean{
        return uint8_AND(result, bit_position) == 1;
    }

    private update_zero_and_negative_flags(result: uint8) {
        result == 0 ? this.status = uint8_OR(this.status, 0b0000_0010) : this.status = uint8_AND(this.status, 0b1111_1101);
        this.status_bit_isset(result, 7 as uint3) ? uint8_OR(this.status, 0b1000_0000) : uint8_AND(this.status, 0b0111_1111);
    }

    // helper for the branch instructions
    private branch(condition: boolean, offset: int8) {
        if(condition) {
            this.bus.tick(1 as uint8);

            const jump_addr: uint16 = uint16_ADD(uint16_ADD(this.pc, 1), offset);
            this.pc = jump_addr;

            if(this.page_crossed(uint16_ADD(this.pc, 1), jump_addr)){this.bus.tick(1 as uint8);}
        }
    }

    public stack_push(data: uint8):void {
        this.mem_write(uint16_ADD(STACK_SIZE, this.sp), data);
        this.sp = uint8_ADD(this.sp, -1); // decrement stack pointer to increase stack size
    }

    public stack_push_16(data: uint16): void {
        const low8: uint8 = touint8(data & 0xFF);
        const high8: uint8 = touint8(data >> 8);
        this.stack_push(high8);
        this.stack_push(low8);
    }

    public stack_pop(): uint8 {
        this.sp = uint8_ADD(this.sp, 1);
        return this.mem_read(uint16_ADD(STACK_SIZE, this.sp));
    }

    public stack_pop_16(): uint16 {
        const low8: uint8 = this.stack_pop();
        const high8: uint8 = this.stack_pop();
        return touint16((high8 << 8) | low8);
    }

    // helper when counting the number of cycles for instructions with variable cycles depending on execution flow
    public page_crossed(addr1: uint16, addr2: uint16) {
        return (addr1 & 0xFF00) != (addr2 & 0xFF00);
    }

    // MEMORY OPERATIONS
    private mem_read(addr: uint16): uint8 {
        // const res: uint8 = this.RAM[addr];
        // return res;
        return this.bus.mem_read(addr);
    }

    private mem_write(addr: uint16, data: uint8) {
        // this.RAM[addr] = data;
        this.bus.mem_write(addr, data);
    }

    // NES CPU uses little-endian addressing
    private mem_read_u16(addr: uint16): uint16 {
        const low8: uint16 = touint16(this.mem_read(addr));
        const high8: uint16 = touint16(this.mem_read(uint16_ADD(addr, 1)));
        return ((high8 << 8) | low8) as uint16;
    }

    private mem_write_u16(addr: uint16, data: uint16): void {
        const low8: uint8 =  touint8(uint16_AND(data, 0xFF));
        const high8: uint8 = data >> 8 as uint8;
        this.mem_write(addr, low8);
        this.mem_write(uint16_ADD(addr, 1), high8);
    }

    // HANDLE ADDRESSING MODES
    private get_operand_address(mode:AddressingMode): [uint16, boolean] {
        switch(mode) {
            case AddressingMode.Immediate:
                return [this.pc, false];
            case AddressingMode.ZeroPage:
                return [touint16(this.mem_read(this.pc)), false];
            case AddressingMode.Absolute:
                return [this.mem_read_u16(this.pc), false];
            case AddressingMode.ZeroPage_X:
                const locX:uint8 = this.mem_read(this.pc);
                const addrX:uint16 = touint16(uint8_ADD(locX, this.register_x));
                return [addrX, false];
            case AddressingMode.ZeroPage_Y:
                const locY:uint8 = this.mem_read(this.pc);
                const addrY:uint16 = touint16(uint8_ADD(locY, this.register_y));
                return [addrY, false];
            case AddressingMode.Absolute_X:
                const baseX:uint16 = this.mem_read_u16(this.pc);
                const addr_absX:uint16 = touint16(uint16_ADD(baseX, this.register_x));
                return [addr_absX, this.page_crossed(baseX, addr_absX)];
            case AddressingMode.Absolute_Y:
                const baseY:uint16 = this.mem_read_u16(this.pc);
                const addr_absY:uint16 = touint16(uint16_ADD(baseY, this.register_y));
                return [addr_absY, this.page_crossed(baseY, addr_absY)];
            case AddressingMode.Indirect_X:
                const baseXindirect:uint8 = this.mem_read(this.pc);
                const ptrX: uint8 = uint8_ADD(baseXindirect, this.register_x);
                const lowX: uint8 = this.mem_read(touint16(ptrX));
                const highX: uint8 = this.mem_read(touint16(uint8_ADD(ptrX, 1)));
                return [((highX << 8) | lowX) as uint16, false];
            case AddressingMode.Indirect_Y:
                const baseYindirect:uint8 = this.mem_read(this.pc);

                const lowY: uint8 = this.mem_read(touint16(baseYindirect));
                const highY: uint8 = this.mem_read(touint16(uint8_ADD(baseYindirect, 1)));
                const d_base: uint16 = ((highY << 8) | lowY) as uint16;
                const dereference: uint16 = uint16_ADD(d_base, this.register_y);
                return [dereference, this.page_crossed(d_base, dereference)];
            case AddressingMode.NoMode:
                console.error(`${mode} mode is not supported!`);
                return [-1 as uint16, false];
        }
        // won't reach here because all cases are handled in switch. But need to make compiler happy :)
        return [-1 as uint16, false];
    }
    // load program into RAM
    // load method should load a program into PRG ROM space and save the reference to the code into 0xFFFC memory cell
    private load(prog: program){
        // memcpy(this.RAM, 0x8000, prog, 0, prog.length);
        this.pc = 0x8000 as uint16;
        // this.mem_write_u16(0xFFFC as uint16, 0x8000 as uint16);
    }

    // reset registers when a new game is loaded
    // reset method should restore the state of all registers, and initialize program_counter by the 2-byte value stored at 0xFFFC
    private reset() {
        this.register_a = 0    as uint8;
        this.register_x = 0    as uint8;
        this.status     = 0    as uint8;
        this.sp         = 0xFF as uint8;
        // this.pc         = this.mem_read_u16(0xFFFC as uint16);
    }

    // =====INSTRUCTIONS=====
    private ADC(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const value: uint8 = this.mem_read(addr);
        this.add_to_accumulator(value);
        if (page_crossed){this.bus.tick(1 as uint8);}
    }

    private AND(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const value: uint8 = this.mem_read(addr);
        this.set_accumulator(uint8_AND(this.register_a, value));
        if (page_crossed){this.bus.tick(1 as uint8);}
    }

    private ASL(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const value: uint8 = this.mem_read(addr);
        if(value & 0b1000_0000) {
            this.set_carry();
        }
        else {
            this.unset_carry();
        }
        this.mem_write(addr, touint8(value << 1));
        this.update_zero_and_negative_flags(value);
    }

    private ASL_accum(): void {
        if(this.register_a & 0b1000_0000) {
            this.set_carry();
        }
        if(this.register_a & 0b1000_0000) {
            this.set_carry();
        }
        else {
            this.unset_carry();
        }
        this.set_accumulator(touint8(this.register_a << 1));
    }

    private BCC(): void {
        const offset:int8 = toint8(this.mem_read(this.pc));
        this.branch(!this.status_carry(), offset);
    }

    private BCS(): void {
        const offset:int8 = toint8(this.mem_read(this.pc));
        this.branch(this.status_carry(), offset);
    }

    private BEQ(): void {
        const offset:int8 = toint8(this.mem_read(this.pc));
        this.branch(this.status_zero(), offset);
    }

    private BIT(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const value: uint8 = this.mem_read(addr);
        const mask: uint8 = uint8_AND(this.register_a, value);
        mask == 0 ? this.set_carry() : this.unset_carry();
        (value & 0b1000_0000) ? this.set_negative() : this.unset_negative();
        (value & 0b0100_0000) ? this.set_overflow() : this.unset_overflow();
    }

    private BMI(): void {
        const offset:int8 = toint8(this.mem_read(this.pc));
        this.branch(this.status_negative(), offset);
    }

    private BNE(): void {
        const offset:int8 = toint8(this.mem_read(this.pc));
        this.branch(!this.status_zero(), offset);
    }
    
    private BPL(): void {
        const offset:int8 = toint8(this.mem_read(this.pc));
        this.branch(!this.status_negative(), offset);
    }

    private BVC(): void {
        const offset:int8 = toint8(this.mem_read(this.pc));
        this.branch(!this.status_overflow(), offset);
    }

    private BVS(): void {
        const offset:int8 = toint8(this.mem_read(this.pc));
        this.branch(this.status_overflow(), offset);
    }

    private CLC(): void {
        this.unset_carry();
    }

    private CLD(): void {
        this.unset_decimal();
    }

    private CLI(): void {
        this.unset_interrupt();
    }
    
    private CLV(): void {
        this.unset_overflow();
    }

    private CMP(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const value: uint8 = this.mem_read(addr);

        (this.register_a >= value) ? this.set_carry() : this.unset_carry();

        const res:uint8 = uint8_ADD(this.register_a, -value);
        this.update_zero_and_negative_flags(res);

        if (page_crossed){this.bus.tick(1 as uint8);}
    }

    private CPX(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const value: uint8 = this.mem_read(addr);

        (this.register_x >= value) ? this.set_carry() : this.unset_carry();

        const res:uint8 = uint8_ADD(this.register_x, -value);
        this.update_zero_and_negative_flags(res);
    }

    private CPY(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const value: uint8 = this.mem_read(addr);

        (this.register_y >= value) ? this.set_carry() : this.unset_carry();

        const res:uint8 = uint8_ADD(this.register_y, -value);
        this.update_zero_and_negative_flags(res);
    }

    private DEC(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const value: uint8 = this.mem_read(addr);

        const res:uint8 = uint8_ADD(value, -1);
        this.mem_write(addr, res);

        this.update_zero_and_negative_flags(res);
    }

    private DEX(): void {
        this.register_x = uint8_ADD(this.register_x, -1);
        this.update_zero_and_negative_flags(this.register_x);
    }

    private DEY(): void {
        this.register_y = uint8_ADD(this.register_y, -1);
        this.update_zero_and_negative_flags(this.register_y);
    }

    private EOR(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const value: uint8 = this.mem_read(addr);
        this.set_accumulator(uint8_XOR(this.register_a, value));
        if (page_crossed){this.bus.tick(1 as uint8);}
    }

    private INC(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const value:uint8 = this.mem_read(addr);
        const res: uint8 = uint8_ADD(value, 1);
        this.mem_write(addr, res);
        this.update_zero_and_negative_flags(res);
    }

    private INX(): void {
        this.set_X(uint8_ADD(this.register_x, 1));
    }

    private INY(): void {
        this.set_Y(uint8_ADD(this.register_y, 1));
    }

    private JMP_abs() {
        const addr: uint16 = this.mem_read_u16(this.pc);
        this.pc = addr;
    }

    // An original 6502 has does not correctly fetch the target address if the indirect vector falls on a page boundary
    // (e.g. $xxFF where xx is any value from $00 to $FF).
    // In this case fetches the LSB from $xxFF as expected but takes the MSB from $xx00.
    // This is fixed in some later chips like the 65SC02 but it is typically not used if the indirect vector is not at the end of the page.
    // This bug is recreated here
    private JMP_ind() {
        const addr: uint16 = this.mem_read_u16(this.pc);
        let ind_ref: uint16;

        // if on page boundary
        if((addr & 0x00FF) == 0x00FF) {
            const low8: uint8 = this.mem_read(addr);
            const high8: uint8 = this.mem_read(touint16(addr & 0xFF00));
            ind_ref = ((high8 << 8) | low8) as uint16;
        }
        else {
            ind_ref = this.mem_read_u16(addr);
        }
        this.pc = ind_ref;
    }

    private JSR() {
        this.stack_push_16(uint16_ADD(this.pc, 1));
        this.pc = this.mem_read_u16(this.pc);
    }

    private LDA(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const value:uint8 = this.mem_read(addr);
        this.set_accumulator(value);
        if (page_crossed){this.bus.tick(1 as uint8);}
    }

    private LDX(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const value:uint8 = this.mem_read(addr);
        this.set_X(value);
        if (page_crossed){this.bus.tick(1 as uint8);}
    }

    private LDY(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const value:uint8 = this.mem_read(addr);
        this.set_Y(value);
        if (page_crossed){this.bus.tick(1 as uint8);} 
    }

    private LSR(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const value: uint8 = this.mem_read(addr);
        if(value & 0b0000_0001) {
            this.set_carry();
        }
        else {
            this.unset_carry();
        }
        this.mem_write(addr, touint8(value >> 1));
        this.update_zero_and_negative_flags(value);
    }

    private LSR_accum(): void {
        if(this.register_a & 0b0000_0001) {
            this.set_carry();
        }
        else {
            this.unset_carry();
        }
        this.set_accumulator(touint8(this.register_a >> 1));
    }

    private ORA(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const value: uint8 = this.mem_read(addr);

        this.set_accumulator(uint8_OR(this.register_a, value));
        if (page_crossed){this.bus.tick(1 as uint8);}
    }

    private PHA() {
        this.stack_push(this.register_a);
    }

    private PHP() {
        this.stack_push(uint8_OR(this.status, 0b0011_0000)); // add break flags
    }

    private PLA() {
        this.set_accumulator(this.stack_pop());
    }

    private PLP() {
        this.status = this.stack_pop();
        // remove break flag 1 and set break flag 2
        this.status = uint8_AND(this.stack_pop(), ~0b0010_0000);
        this.status = uint8_OR(this.stack_pop(), 0b0001_0000);
    }

    private ROL(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const value: uint8 = this.mem_read(addr);

        const old_carry: uint8 = (uint8_OR(this.status, 0b0000_0001));
        const old_bit7: uint8 = uint8_AND(value, 0b1000_0000);

        let res: uint8 = touint8(value << 1);
        res = uint8_OR(res, old_carry);
        old_bit7 ? this.set_carry() : this.unset_carry();
        
        this.mem_write(addr, res);
        this.update_zero_and_negative_flags(res);
    }

    private ROL_accum(): void {
        const old_carry: uint8 = (uint8_OR(this.status, 0b0000_0001));
        const old_bit7: uint8 = uint8_AND(this.register_a, 0b1000_0000);
        old_bit7 ? this.set_carry() : this.unset_carry();
        
        this.set_accumulator(uint8_OR(touint8(this.register_a << 1), old_carry))
    }

    private ROR(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const value: uint8 = this.mem_read(addr);

        const old_carry: uint8 = touint8(uint8_OR(this.status, 0b0000_0001) << 7);
        const old_bit0: uint8 = uint8_AND(value, 0b0000_0001);

        let res: uint8 = touint8(value >> 1);
        res = uint8_OR(res, old_carry);
        old_bit0 ? this.set_carry() : this.unset_carry();
        
        this.mem_write(addr, res);
        this.update_zero_and_negative_flags(res);
    }

    private ROR_accum(): void {
        const old_carry: uint8 = touint8(uint8_OR(this.status, 0b0000_0001) << 7);
        const old_bit0: uint8 = uint8_AND(this.register_a, 0b0000_0001);
        old_bit0 ? this.set_carry() : this.unset_carry();
        
        this.set_accumulator(uint8_OR(touint8(this.register_a << 1), old_carry))
    }

    private RTI() {
        this.status = this.stack_pop();
        this.status = uint8_AND(this.stack_pop(), ~0b0010_0000);
        this.status = uint8_OR(this.stack_pop(), 0b0001_0000);

        this.pc = this.stack_pop_16();
    }

    private RTS() {
        this.pc = uint16_ADD(this.stack_pop_16(), 1);
    }

    private SBC(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        let value: uint8 = this.mem_read(addr);
        value = touint8(~value - 1); // get negative of number
        this.add_to_accumulator(value); // essentially performing regiser_a + (-value)
        if (page_crossed){this.bus.tick(1 as uint8);}
    }

    private SEC(): void {
        this.set_carry();
    }
    
    private SED(): void {
        this.set_decimal();
    }
    
    private SEI(): void {
        this.set_interrupt();
    }

    private STA(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        this.mem_write(addr, this.register_a);
    }
    
    private STX(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        this.mem_write(addr, this.register_x);
    }
    
    private STY(addr_mode: AddressingMode): void {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        this.mem_write(addr, this.register_y);
    }

    private TAX(): void {
        this.set_X(this.register_a);
    }
    
    private TAY(): void {
        this.set_Y(this.register_a);
    }

    private TSX(): void {
        this.set_X(this.sp);
    }

    private TXA(): void {
        this.set_accumulator(this.register_x);
    }

    private TXS(): void{
        this.sp = this.register_x;
    }
    
    private TYA(): void {
        this.set_accumulator(this.register_y);
    }

    // UNOFFICIAL OPCODES

    private DCP(addr_mode: AddressingMode) {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        let data: uint8 = this.mem_read(addr);
        data = uint8_ADD(data, 1);
        this.mem_write(addr, data);
        if (data <= this.register_a) {
            this.set_carry();
        }

        this.update_zero_and_negative_flags(uint8_ADD(this.register_a, -data));
    }

    private RLA(addr_mode: AddressingMode) {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        let data: uint8 = this.mem_read(addr);
        data = uint8_ADD(data, 1);
        this.mem_write(addr, data);
        if (data <= this.register_a) {
            this.set_carry();
        }

        this.update_zero_and_negative_flags(uint8_ADD(this.register_a, -data));
    }
    
    private SLO(addr_mode: AddressingMode) {
        this.ASL(addr_mode);
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const data:uint8 = this.mem_read(addr)
        this.set_accumulator(uint8_OR(this.register_a, data));
    }

    private SRE(addr_mode: AddressingMode) {
        this.LSR(addr_mode);
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const data: uint8 = this.mem_read(addr)
        this.set_accumulator(uint8_XOR(this.register_a, data));
    }

    private AXS(addr_mode: AddressingMode) {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const data: uint8 = this.mem_read(addr);
        let res: uint8 = touint8(this.register_a & this.register_x);
        res = uint8_ADD(res, -1);

        if (data <= res) {
            this.set_carry();
        }
        this.set_X(res);
    }

    private ARR(addr_mode: AddressingMode) {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const data: uint8 = this.mem_read(addr);
        this.set_accumulator(uint8_AND(this.register_a, data));
        this.ROR_accum();
        const res = this.register_a;
        const bit_5 = (res >> 5) & 1;
        const bit_6 = (res >> 6) & 1;

        if (bit_6 == 1) {
            this.set_carry();
        } else {
            this.unset_carry();
        }

        if ((bit_5 ^ bit_6) == 1) {
            this.set_overflow();
        } else {
            this.unset_overflow()
        }

        this.update_zero_and_negative_flags(res);
    }

    private SBC_unofficial(addr_mode: AddressingMode) {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const data: uint8 = this.mem_read(addr);
        this.set_accumulator(uint8_ADD(this.register_a, -1));
    }

    private ANC(addr_mode: AddressingMode) {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const data: uint8 = this.mem_read(addr);
        this.set_accumulator(uint8_AND(this.register_a, data));

        if(this.status_negative()) {
            this.set_carry();
        }
        else {
            this.unset_carry();
        }
    }

    private ALR(addr_mode: AddressingMode) {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const data: uint8 = this.mem_read(addr);
        this.set_accumulator(uint8_AND(this.register_a, data));

        this.LSR_accum();
    }

    private RRA(addr_mode: AddressingMode) {
        this.ROR(addr_mode);

        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const data: uint8 = this.mem_read(addr);
        this.set_accumulator(uint8_ADD(this.register_a, data));
    }

    private ISB(addr_mode: AddressingMode) {
        this.INC(addr_mode);

        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const data: uint8 = this.mem_read(addr);
        this.set_accumulator(uint8_ADD(this.register_a, -data));
    }

    private LAX(addr_mode: AddressingMode) {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const data: uint8 = this.mem_read(addr);
        this.set_accumulator(data);
        this.register_x = this.register_a;
    }

    private SAX(addr_mode: AddressingMode) {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const data: uint8 = uint8_AND(this.register_a, this.register_x);
        this.mem_write(addr, data);
    }

    private LXA(addr_mode: AddressingMode) {
        this.LDA(addr_mode);
        this.TAX();
    }

    private XAA(addr_mode: AddressingMode) {
        this.set_accumulator(this.register_x);
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        const data: uint8 = this.mem_read(addr);
        this.set_accumulator(uint8_AND(this.register_a, data));
    }
    
    private LAS(addr_mode: AddressingMode) {
        const [addr, page_crossed]: [uint16, boolean] = this.get_operand_address(addr_mode);
        let data: uint8 = this.mem_read(addr);
        data = uint8_AND(data, this.sp);
        this.register_a = data;
        this.register_x = data;
        this.sp = data;
        this.update_zero_and_negative_flags(data);
    }
    
    private TAS() {
        let data: uint8 = uint8_AND(this.register_a, this.register_x);
        this.sp = data;
        const mem_address: uint16 = touint16(this.mem_read_u16(this.pc) + this.register_y);
        
        data = uint8_AND(uint8_ADD(touint8(mem_address >> 8), 1), this.sp);
        this.mem_write(mem_address, data);
    }

    private AHX_Indirect_Y() {
        const pos: uint8 = this.mem_read(this.pc);
        const mem_address: uint16 = uint16_ADD(this.mem_read_u16(touint16(pos)), this.register_y);
        const data: uint8 = uint8_AND(this.register_a, uint8_AND(this.register_x, (mem_address >> 8)));
        this.mem_write(mem_address, data);
    }

    private AHX_Absolute_Y() {
        let mem_address: uint16 = uint16_ADD(this.mem_read_u16(this.pc), this.register_y);

        let data: uint8 = touint8(this.register_a & this.register_x & (mem_address >> 8));
        this.mem_write(mem_address, data);
    }

    private SHX() {
        let mem_address: uint16 = uint16_ADD(this.mem_read_u16(this.pc), this.register_y);

        let data: uint8 = touint8(this.register_x & ((mem_address >> 8) + 1));
        this.mem_write(mem_address, data);
    }

    private SHY() {
        let mem_address: uint16 = uint16_ADD(this.mem_read_u16(this.pc), this.register_y);

        let data: uint8 = touint8(this.register_y & ((mem_address >> 8) + 1));
        this.mem_write(mem_address, data);
    }

    // NMI interrupt
    public interrupt_nmi() {
        this.stack_push_16(this.pc);
        let flag = this.status;
        flag = uint8_AND(this.status, ~0b0001_0000);
        flag = uint8_OR(this.status, 0b0010_0000);

        this.stack_push(flag);
        this.set_interrupt();

        this.bus.tick(2 as uint8);
        this.pc = this.mem_read_u16(0xfffA as uint16);
    }
}

// var prog:program = [0xA9 as uint8, 0xFF as uint8, 0x2C as uint8, 0x01 as uint8, 80 as uint8, 0x00 as uint8]
// let game:program = [
//     78, 69, 83, 26, 2, 0, 1, 0, 0, 0, 0, 0,
//     0,  0,  0,  0,] as program;
// game = game.concat(Array<uint8>(512));
// game = game.concat(Array<uint8>(2**15));
// game = game.concat(prog)
// console.log(game)
// const b = new Bus(pacman);
// const a = new CPU(b);
// console.log(a)
// console.log(`mapper: ${a.bus.rom.mapper}`)
// console.log(b);
// console.log(a.bus.rom);
// a.stack_push(1 as uint8)
// a.stack_push(2 as uint8)
// a.stack_push_16(356 as uint16);
// a.stack_pop_16();
// a.stack_push_16(999 as uint16);
// console.log(a.bus.rom.prg_rom)
// a.run(a.bus.rom.prg_rom);
// console.log(a.RAM);
// console.log(a.get_accumulator());
// console.log(a.status_carry());
// console.log(a.status.toString(2));
// console.log(a.status_zero());
// console.log(a.status_overflow());
// console.log(a.status_negative());