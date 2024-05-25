"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CPU = void 0;
const STACK_SIZE = 0x100; // 6502 stack is located between addressess $0100-$01FF
var InterruptType;
(function (InterruptType) {
    InterruptType[InterruptType["NMI"] = 0] = "NMI";
})(InterruptType || (InterruptType = {}));
class Interrupt {
    constructor(itype, v_addr, b_flag_mask, cycles) {
        this.itype = itype;
        this.vector_addr = v_addr;
        this.b_flag_mask = b_flag_mask;
        this.cpu_cycles = cycles;
    }
}
const NMI_INTERRUPT = new Interrupt(InterruptType.NMI, 0xFFFA, 0b00100000, 2);
class CPU {
    constructor(bus) {
        this.register_a = 0;
        this.register_x = 0;
        this.register_y = 0;
        this.status = 0;
        this.pc = 0;
        this.sp = 0xFF;
        // this.RAM        = Array<uint8>(0xFFFF);
        this.bus = bus;
    }
    get_accumulator() {
        return this.register_a;
    }
    set_accumulator(val) {
        this.register_a = val;
        this.update_zero_and_negative_flags(this.register_a);
    }
    add_to_accumulator(val) {
        let sum = (0, uint16_ADD)((0, touint16)(this.register_a), val);
        if (this.status_carry()) {
            sum = (0, uint16_ADD)(sum, 1);
        }
        const carry = sum > 0xFF;
        carry ? this.set_carry() : this.unset_carry();
        const res = (0, touint8)(sum);
        // dealing with overflow: http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html
        if (((val ^ res) & (res ^ this.register_a) & 0x80) != 0) {
            this.set_overflow();
        }
        else {
            this.unset_overflow();
        }
        this.set_accumulator(res);
    }
    get_X() {
        return this.register_x;
    }
    set_X(val) {
        this.register_x = val;
        this.update_zero_and_negative_flags(this.register_x);
    }
    set_Y(val) {
        this.register_y = val;
        this.update_zero_and_negative_flags(this.register_y);
    }
    get_status() {
        return this.status;
    }
    status_carry() {
        return (this.status & 1) === 1;
    }
    status_zero() {
        return (this.status & 2) === 2;
    }
    status_negative() {
        return (this.status & 128) === 128;
    }
    status_overflow() {
        return (this.status & 64) === 64;
    }
    set_carry() {
        this.status = (0, uint8_OR)(this.status, 1);
    }
    unset_carry() {
        this.status = (0, uint8_AND)(this.status, ~1);
    }
    set_zero() {
        this.status = (0, uint8_OR)(this.status, 2);
    }
    unset_zero() {
        this.status = (0, uint8_AND)(this.status, ~2);
    }
    set_interrupt() {
        this.status = (0, uint8_OR)(this.status, 4);
    }
    unset_interrupt() {
        this.status = (0, uint8_AND)(this.status, ~4);
    }
    set_decimal() {
        this.status = (0, uint8_OR)(this.status, 8);
    }
    unset_decimal() {
        this.status = (0, uint8_AND)(this.status, ~8);
    }
    set_break1() {
        this.status = (0, uint8_OR)(this.status, 16);
    }
    unset_break1() {
        this.status = (0, uint8_AND)(this.status, ~16);
    }
    set_break2() {
        this.status = (0, uint8_OR)(this.status, 32);
    }
    unset_break2() {
        this.status = (0, uint8_AND)(this.status, ~32);
    }
    set_overflow() {
        this.status = (0, uint8_OR)(this.status, 64);
    }
    unset_overflow() {
        this.status = (0, uint8_AND)(this.status, ~64);
    }
    set_negative() {
        this.status = (0, uint8_OR)(this.status, 128);
    }
    unset_negative() {
        this.status = (0, uint8_AND)(this.status, ~128);
    }
    get_program_counter() {
        return this.pc;
    }
    // The CPU works in a constant cycle:
    // 1. Fetch next execution instruction from the instruction memory
    // 2. Decode the instruction
    // 3. Execute the Instruction
    // 4. (unless there is an interrupt) Repeat the cycle
    run(prog) {
        this.load(prog);
        // this.reset();
        while (this.pc < 0x8000 + prog.length) {
            if (this.bus.poll_nmi_status()) {
                this.interrupt_nmi();
            }
            // console.log(this.pc.toString(16))
            const opcode = this.fetch(this.pc);
            // if (this.decode_and_execute(opcode)) {
            //     return;
            // }
            this.decode_and_execute(opcode);
        }
    }
    fetch(addr) {
        const res = this.mem_read(addr);
        this.increment_pc();
        return res;
    }
    // 6502 Reference: https://www.nesdev.org/obelisk-6502-guide/reference.html
    // return 1 if an interrupt was caused by BRK, and 0 otherwise
    decode_and_execute(opcode) {
        // console.log(opcode.toString(16))
        const addr_mode = exports.opcodes[opcode].addressingMode;
        const cycles = exports.opcodes[opcode].cycles;
        const old_pc = this.pc;
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
                    if (page_crossed) {
                        this.bus.tick(1);
                    }
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
        this.bus.tick(cycles);
        if (old_pc == this.pc) {
            // make sure to increment pc accordingly
            this.pc = (0, uint16_ADD)(this.pc, exports.opcodes[opcode].size - 1);
        }
        return 0;
    }
    // HELPER METHODS
    increment_pc() {
        this.pc = (0, uint16_ADD)(this.pc, 1);
    }
    status_bit_isset(result, bit_position) {
        return (0, uint8_AND)(result, bit_position) == 1;
    }
    update_zero_and_negative_flags(result) {
        result == 0 ? this.status = (0, uint8_OR)(this.status, 2) : this.status = (0, uint8_AND)(this.status, 253);
        this.status_bit_isset(result, 7) ? (0, uint8_OR)(this.status, 128) : (0, uint8_AND)(this.status, 127);
    }
    // helper for the branch instructions
    branch(condition, offset) {
        if (condition) {
            this.bus.tick(1);
            const jump_addr = (0, uint16_ADD)((0, uint16_ADD)(this.pc, 1), offset);
            this.pc = jump_addr;
            if (this.page_crossed((0, uint16_ADD)(this.pc, 1), jump_addr)) {
                this.bus.tick(1);
            }
        }
    }
    stack_push(data) {
        this.mem_write((0, uint16_ADD)(STACK_SIZE, this.sp), data);
        this.sp = (0, uint8_ADD)(this.sp, -1); // decrement stack pointer to increase stack size
    }
    stack_push_16(data) {
        const low8 = (0, touint8)(data & 0xFF);
        const high8 = (0, touint8)(data >> 8);
        this.stack_push(high8);
        this.stack_push(low8);
    }
    stack_pop() {
        this.sp = (0, uint8_ADD)(this.sp, 1);
        return this.mem_read((0, uint16_ADD)(STACK_SIZE, this.sp));
    }
    stack_pop_16() {
        const low8 = this.stack_pop();
        const high8 = this.stack_pop();
        return (0, touint16)((high8 << 8) | low8);
    }
    // helper when counting the number of cycles for instructions with variable cycles depending on execution flow
    page_crossed(addr1, addr2) {
        return (addr1 & 0xFF00) != (addr2 & 0xFF00);
    }
    // MEMORY OPERATIONS
    mem_read(addr) {
        // const res: uint8 = this.RAM[addr];
        // return res;
        return this.bus.mem_read(addr);
    }
    mem_write(addr, data) {
        // this.RAM[addr] = data;
        this.bus.mem_write(addr, data);
    }
    // NES CPU uses little-endian addressing
    mem_read_u16(addr) {
        const low8 = (0, touint16)(this.mem_read(addr));
        const high8 = (0, touint16)(this.mem_read((0, uint16_ADD)(addr, 1)));
        return ((high8 << 8) | low8);
    }
    mem_write_u16(addr, data) {
        const low8 = (0, touint8)((0, uint16_AND)(data, 0xFF));
        const high8 = data >> 8;
        this.mem_write(addr, low8);
        this.mem_write((0, uint16_ADD)(addr, 1), high8);
    }
    // HANDLE ADDRESSING MODES
    get_operand_address(mode) {
        switch (mode) {
            case AddressingMode.Immediate:
                return [this.pc, false];
            case AddressingMode.ZeroPage:
                return [(0, touint16)(this.mem_read(this.pc)), false];
            case AddressingMode.Absolute:
                return [this.mem_read_u16(this.pc), false];
            case AddressingMode.ZeroPage_X:
                const locX = this.mem_read(this.pc);
                const addrX = (0, touint16)((0, uint8_ADD)(locX, this.register_x));
                return [addrX, false];
            case AddressingMode.ZeroPage_Y:
                const locY = this.mem_read(this.pc);
                const addrY = (0, touint16)((0, uint8_ADD)(locY, this.register_y));
                return [addrY, false];
            case AddressingMode.Absolute_X:
                const baseX = this.mem_read_u16(this.pc);
                const addr_absX = (0, touint16)((0, uint16_ADD)(baseX, this.register_x));
                return [addr_absX, this.page_crossed(baseX, addr_absX)];
            case AddressingMode.Absolute_Y:
                const baseY = this.mem_read_u16(this.pc);
                const addr_absY = (0, touint16)((0, uint16_ADD)(baseY, this.register_y));
                return [addr_absY, this.page_crossed(baseY, addr_absY)];
            case AddressingMode.Indirect_X:
                const baseXindirect = this.mem_read(this.pc);
                const ptrX = (0, uint8_ADD)(baseXindirect, this.register_x);
                const lowX = this.mem_read((0, touint16)(ptrX));
                const highX = this.mem_read((0, touint16)((0, uint8_ADD)(ptrX, 1)));
                return [((highX << 8) | lowX), false];
            case AddressingMode.Indirect_Y:
                const baseYindirect = this.mem_read(this.pc);
                const lowY = this.mem_read((0, touint16)(baseYindirect));
                const highY = this.mem_read((0, touint16)((0, uint8_ADD)(baseYindirect, 1)));
                const d_base = ((highY << 8) | lowY);
                const dereference = (0, uint16_ADD)(d_base, this.register_y);
                return [dereference, this.page_crossed(d_base, dereference)];
            case AddressingMode.NoMode:
                console.error(`${mode} mode is not supported!`);
                return [-1, false];
        }
        // won't reach here because all cases are handled in switch. But need to make compiler happy :)
        return [-1, false];
    }
    // load program into RAM
    // load method should load a program into PRG ROM space and save the reference to the code into 0xFFFC memory cell
    load(prog) {
        // memcpy(this.RAM, 0x8000, prog, 0, prog.length);
        this.pc = 0x8000;
        // this.mem_write_u16(0xFFFC as uint16, 0x8000 as uint16);
    }
    // reset registers when a new game is loaded
    // reset method should restore the state of all registers, and initialize program_counter by the 2-byte value stored at 0xFFFC
    reset() {
        this.register_a = 0;
        this.register_x = 0;
        this.status = 0;
        this.sp = 0xFF;
        // this.pc         = this.mem_read_u16(0xFFFC as uint16);
    }
    // =====INSTRUCTIONS=====
    ADC(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const value = this.mem_read(addr);
        this.add_to_accumulator(value);
        if (page_crossed) {
            this.bus.tick(1);
        }
    }
    AND(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const value = this.mem_read(addr);
        this.set_accumulator((0, uint8_AND)(this.register_a, value));
        if (page_crossed) {
            this.bus.tick(1);
        }
    }
    ASL(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const value = this.mem_read(addr);
        if (value & 128) {
            this.set_carry();
        }
        else {
            this.unset_carry();
        }
        this.mem_write(addr, (0, touint8)(value << 1));
        this.update_zero_and_negative_flags(value);
    }
    ASL_accum() {
        if (this.register_a & 128) {
            this.set_carry();
        }
        if (this.register_a & 128) {
            this.set_carry();
        }
        else {
            this.unset_carry();
        }
        this.set_accumulator((0, touint8)(this.register_a << 1));
    }
    BCC() {
        const offset = (0, toint8)(this.mem_read(this.pc));
        this.branch(!this.status_carry(), offset);
    }
    BCS() {
        const offset = (0, toint8)(this.mem_read(this.pc));
        this.branch(this.status_carry(), offset);
    }
    BEQ() {
        const offset = (0, toint8)(this.mem_read(this.pc));
        this.branch(this.status_zero(), offset);
    }
    BIT(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const value = this.mem_read(addr);
        const mask = (0, uint8_AND)(this.register_a, value);
        mask == 0 ? this.set_carry() : this.unset_carry();
        (value & 128) ? this.set_negative() : this.unset_negative();
        (value & 64) ? this.set_overflow() : this.unset_overflow();
    }
    BMI() {
        const offset = (0, toint8)(this.mem_read(this.pc));
        this.branch(this.status_negative(), offset);
    }
    BNE() {
        const offset = (0, toint8)(this.mem_read(this.pc));
        this.branch(!this.status_zero(), offset);
    }
    BPL() {
        const offset = (0, toint8)(this.mem_read(this.pc));
        this.branch(!this.status_negative(), offset);
    }
    BVC() {
        const offset = (0, toint8)(this.mem_read(this.pc));
        this.branch(!this.status_overflow(), offset);
    }
    BVS() {
        const offset = (0, toint8)(this.mem_read(this.pc));
        this.branch(this.status_overflow(), offset);
    }
    CLC() {
        this.unset_carry();
    }
    CLD() {
        this.unset_decimal();
    }
    CLI() {
        this.unset_interrupt();
    }
    CLV() {
        this.unset_overflow();
    }
    CMP(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const value = this.mem_read(addr);
        (this.register_a >= value) ? this.set_carry() : this.unset_carry();
        const res = (0, uint8_ADD)(this.register_a, -value);
        this.update_zero_and_negative_flags(res);
        if (page_crossed) {
            this.bus.tick(1);
        }
    }
    CPX(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const value = this.mem_read(addr);
        (this.register_x >= value) ? this.set_carry() : this.unset_carry();
        const res = (0, uint8_ADD)(this.register_x, -value);
        this.update_zero_and_negative_flags(res);
    }
    CPY(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const value = this.mem_read(addr);
        (this.register_y >= value) ? this.set_carry() : this.unset_carry();
        const res = (0, uint8_ADD)(this.register_y, -value);
        this.update_zero_and_negative_flags(res);
    }
    DEC(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const value = this.mem_read(addr);
        const res = (0, uint8_ADD)(value, -1);
        this.mem_write(addr, res);
        this.update_zero_and_negative_flags(res);
    }
    DEX() {
        this.register_x = (0, uint8_ADD)(this.register_x, -1);
        this.update_zero_and_negative_flags(this.register_x);
    }
    DEY() {
        this.register_y = (0, uint8_ADD)(this.register_y, -1);
        this.update_zero_and_negative_flags(this.register_y);
    }
    EOR(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const value = this.mem_read(addr);
        this.set_accumulator((0, uint8_XOR)(this.register_a, value));
        if (page_crossed) {
            this.bus.tick(1);
        }
    }
    INC(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const value = this.mem_read(addr);
        const res = (0, uint8_ADD)(value, 1);
        this.mem_write(addr, res);
        this.update_zero_and_negative_flags(res);
    }
    INX() {
        this.set_X((0, uint8_ADD)(this.register_x, 1));
    }
    INY() {
        this.set_Y((0, uint8_ADD)(this.register_y, 1));
    }
    JMP_abs() {
        const addr = this.mem_read_u16(this.pc);
        this.pc = addr;
    }
    // An original 6502 has does not correctly fetch the target address if the indirect vector falls on a page boundary
    // (e.g. $xxFF where xx is any value from $00 to $FF).
    // In this case fetches the LSB from $xxFF as expected but takes the MSB from $xx00.
    // This is fixed in some later chips like the 65SC02 but it is typically not used if the indirect vector is not at the end of the page.
    // This bug is recreated here
    JMP_ind() {
        const addr = this.mem_read_u16(this.pc);
        let ind_ref;
        // if on page boundary
        if ((addr & 0x00FF) == 0x00FF) {
            const low8 = this.mem_read(addr);
            const high8 = this.mem_read((0, touint16)(addr & 0xFF00));
            ind_ref = ((high8 << 8) | low8);
        }
        else {
            ind_ref = this.mem_read_u16(addr);
        }
        this.pc = ind_ref;
    }
    JSR() {
        this.stack_push_16((0, uint16_ADD)(this.pc, 1));
        this.pc = this.mem_read_u16(this.pc);
    }
    LDA(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const value = this.mem_read(addr);
        this.set_accumulator(value);
        if (page_crossed) {
            this.bus.tick(1);
        }
    }
    LDX(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const value = this.mem_read(addr);
        this.set_X(value);
        if (page_crossed) {
            this.bus.tick(1);
        }
    }
    LDY(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const value = this.mem_read(addr);
        this.set_Y(value);
        if (page_crossed) {
            this.bus.tick(1);
        }
    }
    LSR(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const value = this.mem_read(addr);
        if (value & 1) {
            this.set_carry();
        }
        else {
            this.unset_carry();
        }
        this.mem_write(addr, (0, touint8)(value >> 1));
        this.update_zero_and_negative_flags(value);
    }
    LSR_accum() {
        if (this.register_a & 1) {
            this.set_carry();
        }
        else {
            this.unset_carry();
        }
        this.set_accumulator((0, touint8)(this.register_a >> 1));
    }
    ORA(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const value = this.mem_read(addr);
        this.set_accumulator((0, uint8_OR)(this.register_a, value));
        if (page_crossed) {
            this.bus.tick(1);
        }
    }
    PHA() {
        this.stack_push(this.register_a);
    }
    PHP() {
        this.stack_push((0, uint8_OR)(this.status, 48)); // add break flags
    }
    PLA() {
        this.set_accumulator(this.stack_pop());
    }
    PLP() {
        this.status = this.stack_pop();
        // remove break flag 1 and set break flag 2
        this.status = (0, uint8_AND)(this.stack_pop(), ~32);
        this.status = (0, uint8_OR)(this.stack_pop(), 16);
    }
    ROL(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const value = this.mem_read(addr);
        const old_carry = ((0, uint8_OR)(this.status, 1));
        const old_bit7 = (0, uint8_AND)(value, 128);
        let res = (0, touint8)(value << 1);
        res = (0, uint8_OR)(res, old_carry);
        old_bit7 ? this.set_carry() : this.unset_carry();
        this.mem_write(addr, res);
        this.update_zero_and_negative_flags(res);
    }
    ROL_accum() {
        const old_carry = ((0, uint8_OR)(this.status, 1));
        const old_bit7 = (0, uint8_AND)(this.register_a, 128);
        old_bit7 ? this.set_carry() : this.unset_carry();
        this.set_accumulator((0, uint8_OR)((0, touint8)(this.register_a << 1), old_carry));
    }
    ROR(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const value = this.mem_read(addr);
        const old_carry = (0, touint8)((0, uint8_OR)(this.status, 1) << 7);
        const old_bit0 = (0, uint8_AND)(value, 1);
        let res = (0, touint8)(value >> 1);
        res = (0, uint8_OR)(res, old_carry);
        old_bit0 ? this.set_carry() : this.unset_carry();
        this.mem_write(addr, res);
        this.update_zero_and_negative_flags(res);
    }
    ROR_accum() {
        const old_carry = (0, touint8)((0, uint8_OR)(this.status, 1) << 7);
        const old_bit0 = (0, uint8_AND)(this.register_a, 1);
        old_bit0 ? this.set_carry() : this.unset_carry();
        this.set_accumulator((0, uint8_OR)((0, touint8)(this.register_a << 1), old_carry));
    }
    RTI() {
        this.status = this.stack_pop();
        this.status = (0, uint8_AND)(this.stack_pop(), ~32);
        this.status = (0, uint8_OR)(this.stack_pop(), 16);
        this.pc = this.stack_pop_16();
    }
    RTS() {
        this.pc = (0, uint16_ADD)(this.stack_pop_16(), 1);
    }
    SBC(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        let value = this.mem_read(addr);
        value = (0, touint8)(~value - 1); // get negative of number
        this.add_to_accumulator(value); // essentially performing regiser_a + (-value)
        if (page_crossed) {
            this.bus.tick(1);
        }
    }
    SEC() {
        this.set_carry();
    }
    SED() {
        this.set_decimal();
    }
    SEI() {
        this.set_interrupt();
    }
    STA(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        this.mem_write(addr, this.register_a);
    }
    STX(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        this.mem_write(addr, this.register_x);
    }
    STY(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        this.mem_write(addr, this.register_y);
    }
    TAX() {
        this.set_X(this.register_a);
    }
    TAY() {
        this.set_Y(this.register_a);
    }
    TSX() {
        this.set_X(this.sp);
    }
    TXA() {
        this.set_accumulator(this.register_x);
    }
    TXS() {
        this.sp = this.register_x;
    }
    TYA() {
        this.set_accumulator(this.register_y);
    }
    // UNOFFICIAL OPCODES
    DCP(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        let data = this.mem_read(addr);
        data = (0, uint8_ADD)(data, 1);
        this.mem_write(addr, data);
        if (data <= this.register_a) {
            this.set_carry();
        }
        this.update_zero_and_negative_flags((0, uint8_ADD)(this.register_a, -data));
    }
    RLA(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        let data = this.mem_read(addr);
        data = (0, uint8_ADD)(data, 1);
        this.mem_write(addr, data);
        if (data <= this.register_a) {
            this.set_carry();
        }
        this.update_zero_and_negative_flags((0, uint8_ADD)(this.register_a, -data));
    }
    SLO(addr_mode) {
        this.ASL(addr_mode);
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const data = this.mem_read(addr);
        this.set_accumulator((0, uint8_OR)(this.register_a, data));
    }
    SRE(addr_mode) {
        this.LSR(addr_mode);
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const data = this.mem_read(addr);
        this.set_accumulator((0, uint8_XOR)(this.register_a, data));
    }
    AXS(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const data = this.mem_read(addr);
        let res = (0, touint8)(this.register_a & this.register_x);
        res = (0, uint8_ADD)(res, -1);
        if (data <= res) {
            this.set_carry();
        }
        this.set_X(res);
    }
    ARR(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const data = this.mem_read(addr);
        this.set_accumulator((0, uint8_AND)(this.register_a, data));
        this.ROR_accum();
        const res = this.register_a;
        const bit_5 = (res >> 5) & 1;
        const bit_6 = (res >> 6) & 1;
        if (bit_6 == 1) {
            this.set_carry();
        }
        else {
            this.unset_carry();
        }
        if ((bit_5 ^ bit_6) == 1) {
            this.set_overflow();
        }
        else {
            this.unset_overflow();
        }
        this.update_zero_and_negative_flags(res);
    }
    SBC_unofficial(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const data = this.mem_read(addr);
        this.set_accumulator((0, uint8_ADD)(this.register_a, -1));
    }
    ANC(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const data = this.mem_read(addr);
        this.set_accumulator((0, uint8_AND)(this.register_a, data));
        if (this.status_negative()) {
            this.set_carry();
        }
        else {
            this.unset_carry();
        }
    }
    ALR(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const data = this.mem_read(addr);
        this.set_accumulator((0, uint8_AND)(this.register_a, data));
        this.LSR_accum();
    }
    RRA(addr_mode) {
        this.ROR(addr_mode);
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const data = this.mem_read(addr);
        this.set_accumulator((0, uint8_ADD)(this.register_a, data));
    }
    ISB(addr_mode) {
        this.INC(addr_mode);
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const data = this.mem_read(addr);
        this.set_accumulator((0, uint8_ADD)(this.register_a, -data));
    }
    LAX(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const data = this.mem_read(addr);
        this.set_accumulator(data);
        this.register_x = this.register_a;
    }
    SAX(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const data = (0, uint8_AND)(this.register_a, this.register_x);
        this.mem_write(addr, data);
    }
    LXA(addr_mode) {
        this.LDA(addr_mode);
        this.TAX();
    }
    XAA(addr_mode) {
        this.set_accumulator(this.register_x);
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        const data = this.mem_read(addr);
        this.set_accumulator((0, uint8_AND)(this.register_a, data));
    }
    LAS(addr_mode) {
        const [addr, page_crossed] = this.get_operand_address(addr_mode);
        let data = this.mem_read(addr);
        data = (0, uint8_AND)(data, this.sp);
        this.register_a = data;
        this.register_x = data;
        this.sp = data;
        this.update_zero_and_negative_flags(data);
    }
    TAS() {
        let data = (0, uint8_AND)(this.register_a, this.register_x);
        this.sp = data;
        const mem_address = (0, touint16)(this.mem_read_u16(this.pc) + this.register_y);
        data = (0, uint8_AND)((0, uint8_ADD)((0, touint8)(mem_address >> 8), 1), this.sp);
        this.mem_write(mem_address, data);
    }
    AHX_Indirect_Y() {
        const pos = this.mem_read(this.pc);
        const mem_address = (0, uint16_ADD)(this.mem_read_u16((0, touint16)(pos)), this.register_y);
        const data = (0, uint8_AND)(this.register_a, (0, uint8_AND)(this.register_x, (mem_address >> 8)));
        this.mem_write(mem_address, data);
    }
    AHX_Absolute_Y() {
        let mem_address = (0, uint16_ADD)(this.mem_read_u16(this.pc), this.register_y);
        let data = (0, touint8)(this.register_a & this.register_x & (mem_address >> 8));
        this.mem_write(mem_address, data);
    }
    SHX() {
        let mem_address = (0, uint16_ADD)(this.mem_read_u16(this.pc), this.register_y);
        let data = (0, touint8)(this.register_x & ((mem_address >> 8) + 1));
        this.mem_write(mem_address, data);
    }
    SHY() {
        let mem_address = (0, uint16_ADD)(this.mem_read_u16(this.pc), this.register_y);
        let data = (0, touint8)(this.register_y & ((mem_address >> 8) + 1));
        this.mem_write(mem_address, data);
    }
    // NMI interrupt
    interrupt_nmi() {
        console.log("here")
        this.stack_push_16(this.pc);
        let flag = this.status;
        flag = (0, uint8_AND)(this.status, ~16);
        flag = (0, uint8_OR)(this.status, 32);
        this.stack_push(flag);
        this.set_interrupt();
        this.bus.tick(2);
        this.pc = this.mem_read_u16(0xfffA);
    }
}
exports.CPU = CPU;
