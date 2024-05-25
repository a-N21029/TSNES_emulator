export enum AddressingMode {
    Implicit, // not used here but added for completeness
    Accumulator, // not used here but added for completeness
    Immediate,
    ZeroPage,
    ZeroPage_X,
    ZeroPage_Y,
    Relative, // not used here but added for completeness
    Absolute,
    Absolute_X,
    Absolute_Y,
    Indirect,
    Indirect_X,
    Indirect_Y,
    NoMode, // replacement for the above modes that are not used, and also used to handle undefined modes
}

export interface OpcodeEntry {
    instruction: string;
    size: number;
    cycles: number;
    addressingMode: AddressingMode;
}

export const opcodes: { [opcode: number]: OpcodeEntry }  = {
    // ADC - Add with Carry
    0x69: { instruction: "ADC", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate },
    0x65: { instruction: "ADC", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage },
    0x75: { instruction: "ADC", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_X },
    0x6D: { instruction: "ADC", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute },
    0x7D: { instruction: "ADC", size: 3, cycles: 4 /* +1 if page crossed */, addressingMode: AddressingMode.Absolute_X },
    0x79: { instruction: "ADC", size: 3, cycles: 4 /* +1 if page crossed */, addressingMode: AddressingMode.Absolute_Y },
    0x61: { instruction: "ADC", size: 2, cycles: 6, addressingMode: AddressingMode.Indirect_X },
    0x71: { instruction: "ADC", size: 2, cycles: 5 /* +1 if page crossed */, addressingMode: AddressingMode.Indirect_Y },

    // AND - Logical AND
    0x29: { instruction: "AND", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate },
    0x25: { instruction: "AND", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage },
    0x35: { instruction: "AND", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_X },
    0x2D: { instruction: "AND", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute },
    0x3D: { instruction: "AND", size: 3, cycles: 4 /* +1 if page crossed */, addressingMode: AddressingMode.Absolute_X },
    0x39: { instruction: "AND", size: 3, cycles: 4 /* +1 if page crossed */, addressingMode: AddressingMode.Absolute_Y },
    0x21: { instruction: "AND", size: 2, cycles: 6, addressingMode: AddressingMode.Indirect_X },
    0x31: { instruction: "AND", size: 2, cycles: 5 /* +1 if page crossed */, addressingMode: AddressingMode.Indirect_Y },

    // ASL - Arithmetic Shift Left
    0x0A: { instruction: "ASL", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode }, // accumulator mode
    0x06: { instruction: "ASL", size: 2, cycles: 5, addressingMode: AddressingMode.ZeroPage },
    0x16: { instruction: "ASL", size: 2, cycles: 6, addressingMode: AddressingMode.ZeroPage_X },
    0x0E: { instruction: "ASL", size: 3, cycles: 6, addressingMode: AddressingMode.Absolute },
    0x1E: { instruction: "ASL", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_X },

    // NOTE FOR ALL BRANCH INSTRUCTIONS: cycles+=1 if branch succeeds and cycles+=2 if branch goes to a new page
     
    // BCC - Branch if Carry Clear
    0x90: { instruction: "BCC", size: 2, cycles: 2, addressingMode: AddressingMode.NoMode },

    // BCS - Branch if Carry Set
    0xB0: { instruction: "BCS", size: 2, cycles: 2, addressingMode: AddressingMode.NoMode },

    // BEQ - Branch if Equal
    0xF0: { instruction: "BEQ", size: 2, cycles: 2, addressingMode: AddressingMode.NoMode },

    // BIT - Bit Test
    0x24: { instruction: "BIT", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage },
    0x2C: { instruction: "BIT", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute },

    // BMI - Branch if Minus
    0x30: { instruction: "BMI", size: 2, cycles: 2, addressingMode: AddressingMode.NoMode },

    // BNE - Branch if Not Equal
    0xD0: { instruction: "BNE", size: 2, cycles: 2, addressingMode: AddressingMode.NoMode },

    // BPL - Branch if Positive
    0x10: { instruction: "BPL", size: 2, cycles: 2, addressingMode: AddressingMode.NoMode },

    // BRK - Break
    0x00: { instruction: "BRK", size: 1, cycles: 7, addressingMode: AddressingMode.NoMode },

    // BVC - Branch if Overflow Clear
    0x50: { instruction: "BVC", size: 2, cycles: 2, addressingMode: AddressingMode.NoMode },

    // BVS - Branch if Overflow Set
    0x70: { instruction: "BVS", size: 2, cycles: 2, addressingMode: AddressingMode.NoMode },

    // CLC - Clear Carry Flag
    0x18: { instruction: "CLC", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // CLD - Clear Decimal Mode
    0xD8: { instruction: "CLD", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // CLI - Clear Interrupt Disable
    0x58: { instruction: "CLI", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // CLV - Clear Overflow Flag
    0xB8: { instruction: "CLV", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // CMP - Compare
    0xC9: { instruction: "CMP", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate },
    0xC5: { instruction: "CMP", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage },
    0xD5: { instruction: "CMP", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_X },
    0xCD: { instruction: "CMP", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute },
    0xDD: { instruction: "CMP", size: 3, cycles: 4 /* +1 if page crossed */, addressingMode: AddressingMode.Absolute_X },
    0xD9: { instruction: "CMP", size: 3, cycles: 4 /* +1 if page crossed */, addressingMode: AddressingMode.Absolute_Y },
    0xC1: { instruction: "CMP", size: 2, cycles: 6, addressingMode: AddressingMode.Indirect_X },
    0xD1: { instruction: "CMP", size: 2, cycles: 5 /* +1 if page crossed */, addressingMode: AddressingMode.Indirect_Y },

    // CPX - Compare X Register
    0xE0: { instruction: "CPX", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate },
    0xE4: { instruction: "CPX", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage },
    0xEC: { instruction: "CPX", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute },

    // CPY - Compare Y Register
    0xC0: { instruction: "CPY", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate },
    0xC4: { instruction: "CPY", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage },
    0xCC: { instruction: "CPY", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute },

    // DEC - Decrement Memory
    0xC6: { instruction: "DEC", size: 2, cycles: 5, addressingMode: AddressingMode.ZeroPage },
    0xD6: { instruction: "DEC", size: 2, cycles: 6, addressingMode: AddressingMode.ZeroPage_X },
    0xCE: { instruction: "DEC", size: 3, cycles: 6, addressingMode: AddressingMode.Absolute },
    0xDE: { instruction: "DEC", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_X },

    // DEX - Decrement X Register
    0xCA: { instruction: "DEX", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // DEY - Decrement Y Register
    0x88: { instruction: "DEY", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // EOR - Exclusive OR
    0x49: { instruction: "EOR", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate },
    0x45: { instruction: "EOR", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage },
    0x55: { instruction: "EOR", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_X },
    0x4D: { instruction: "EOR", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute },
    0x5D: { instruction: "EOR", size: 3, cycles: 4 /* +1 if page crossed */, addressingMode: AddressingMode.Absolute_X },
    0x59: { instruction: "EOR", size: 3, cycles: 4 /* +1 if page crossed */, addressingMode: AddressingMode.Absolute_Y },
    0x41: { instruction: "EOR", size: 2, cycles: 6, addressingMode: AddressingMode.Indirect_X },
    0x51: { instruction: "EOR", size: 2, cycles: 5 /* +1 if page crossed */, addressingMode: AddressingMode.Indirect_Y },

    // INC - Increment Memory
    0xE6: { instruction: "INC", size: 2, cycles: 5, addressingMode: AddressingMode.ZeroPage },
    0xF6: { instruction: "INC", size: 2, cycles: 6, addressingMode: AddressingMode.ZeroPage_X },
    0xEE: { instruction: "INC", size: 3, cycles: 6, addressingMode: AddressingMode.Absolute },
    0xFE: { instruction: "INC", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_X },

    // INX - Increment X Register
    0xE8: { instruction: "INX", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // INY - Increment Y Register
    0xC8: { instruction: "INY", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // JMP - Jump
    // NOTE: this is the only instruction that uses the Indirect addressing mode so did not bother with creating a handler for it in cpu.ts
    0x4C: { instruction: "JMP", size: 3, cycles: 3, addressingMode: AddressingMode.Absolute }, //AddressingMode that acts as Immidiate
    0x6C: { instruction: "JMP", size: 3, cycles: 5, addressingMode: AddressingMode.NoMode }, //AddressingMode:Indirect with 6502 bug

    // JSR - Jump to Subroutine
    0x20: { instruction: "JSR", size: 3, cycles: 6, addressingMode: AddressingMode.Absolute },

    // LDA - Load Accumulator
    0xA9: { instruction: "LDA", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate },
    0xA5: { instruction: "LDA", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage },
    0xB5: { instruction: "LDA", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_X },
    0xAD: { instruction: "LDA", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute },
    0xBD: { instruction: "LDA", size: 3, cycles: 4 /* +1 if page crossed */, addressingMode: AddressingMode.Absolute_X },
    0xB9: { instruction: "LDA", size: 3, cycles: 4 /* +1 if page crossed */, addressingMode: AddressingMode.Absolute_Y },
    0xA1: { instruction: "LDA", size: 2, cycles: 6, addressingMode: AddressingMode.Indirect_X },
    0xB1: { instruction: "LDA", size: 2, cycles: 5 /* +1 if page crossed */, addressingMode: AddressingMode.Indirect_Y },

    // LDX - Load X Register
    0xA2: { instruction: "LDX", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate },
    0xA6: { instruction: "LDX", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage },
    0xB6: { instruction: "LDX", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_Y },
    0xAE: { instruction: "LDX", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute },
    0xBE: { instruction: "LDX", size: 3, cycles: 4 /* +1 if page crossed */, addressingMode: AddressingMode.Absolute_Y },

    // LDY - Load Y Register
    0xA0: { instruction: "LDY", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate },
    0xA4: { instruction: "LDY", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage },
    0xB4: { instruction: "LDY", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_X },
    0xAC: { instruction: "LDY", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute },
    0xBC: { instruction: "LDY", size: 3, cycles: 4 /* +1 if page crossed */, addressingMode: AddressingMode.Absolute_X },

    // LSR - Logical Shift Right
    0x4A: { instruction: "LSR", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },
    0x46: { instruction: "LSR", size: 2, cycles: 5, addressingMode: AddressingMode.ZeroPage },
    0x56: { instruction: "LSR", size: 2, cycles: 6, addressingMode: AddressingMode.ZeroPage_X },
    0x4E: { instruction: "LSR", size: 3, cycles: 6, addressingMode: AddressingMode.Absolute },
    0x5E: { instruction: "LSR", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_X },

    // NOP - No Operation
    0xEA: { instruction: "NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // ORA - Logical OR
    0x09: { instruction: "ORA", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate },
    0x05: { instruction: "ORA", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage },
    0x15: { instruction: "ORA", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_X },
    0x0D: { instruction: "ORA", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute },
    0x1D: { instruction: "ORA", size: 3, cycles: 4 /* +1 if page crossed */, addressingMode: AddressingMode.Absolute_X },
    0x19: { instruction: "ORA", size: 3, cycles: 4 /* +1 if page crossed */, addressingMode: AddressingMode.Absolute_Y },
    0x01: { instruction: "ORA", size: 2, cycles: 6, addressingMode: AddressingMode.Indirect_X },
    0x11: { instruction: "ORA", size: 2, cycles: 5 /* +1 if page crossed */, addressingMode: AddressingMode.Indirect_Y },

    // PHA - Push Accumulator
    0x48: { instruction: "PHA", size: 1, cycles: 3, addressingMode: AddressingMode.NoMode },

    // PHP - Push Processor Status
    0x08: { instruction: "PHP", size: 1, cycles: 3, addressingMode: AddressingMode.NoMode },

    // PLA - Pull Accumulator
    0x68: { instruction: "PLA", size: 1, cycles: 4, addressingMode: AddressingMode.NoMode },

    // PLP - Pull Processor Status
    0x28: { instruction: "PLP", size: 1, cycles: 4, addressingMode: AddressingMode.NoMode },

    // ROL - Rotate Left
    0x2A: { instruction: "ROL", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },
    0x26: { instruction: "ROL", size: 2, cycles: 5, addressingMode: AddressingMode.ZeroPage },
    0x36: { instruction: "ROL", size: 2, cycles: 6, addressingMode: AddressingMode.ZeroPage_X },
    0x2E: { instruction: "ROL", size: 3, cycles: 6, addressingMode: AddressingMode.Absolute },
    0x3E: { instruction: "ROL", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_X },

    // ROR - Rotate Right
    0x6A: { instruction: "ROR", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },
    0x66: { instruction: "ROR", size: 2, cycles: 5, addressingMode: AddressingMode.ZeroPage },
    0x76: { instruction: "ROR", size: 2, cycles: 6, addressingMode: AddressingMode.ZeroPage_X },
    0x6E: { instruction: "ROR", size: 3, cycles: 6, addressingMode: AddressingMode.Absolute },
    0x7E: { instruction: "ROR", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_X },

    // RTI - Return from Interrupt
    0x40: { instruction: "RTI", size: 1, cycles: 6, addressingMode: AddressingMode.NoMode },

    // RTS - Return from Subroutine
    0x60: { instruction: "RTS", size: 1, cycles: 6, addressingMode: AddressingMode.NoMode },

    // SBC - Subtract with Carry
    0xE9: { instruction: "SBC", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate },
    0xE5: { instruction: "SBC", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage },
    0xF5: { instruction: "SBC", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_X },
    0xED: { instruction: "SBC", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute },
    0xFD: { instruction: "SBC", size: 3, cycles: 4 /* +1 if page crossed */, addressingMode: AddressingMode.Absolute_X },
    0xF9: { instruction: "SBC", size: 3, cycles: 4 /* +1 if page crossed */, addressingMode: AddressingMode.Absolute_Y },
    0xE1: { instruction: "SBC", size: 2, cycles: 6, addressingMode: AddressingMode.Indirect_X },
    0xF1: { instruction: "SBC", size: 2, cycles: 5 /* +1 if page crossed */, addressingMode: AddressingMode.Indirect_Y },

    // SEC - Set Carry Flag
    0x38: { instruction: "SEC", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // SED - Set Decimal Flag
    0xF8: { instruction: "SED", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // SEI - Set Interrupt Disable
    0x78: { instruction: "SEI", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // STA - Store Accumulator
    0x85: { instruction: "STA", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage },
    0x95: { instruction: "STA", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_X },
    0x8D: { instruction: "STA", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute },
    0x9D: { instruction: "STA", size: 3, cycles: 5, addressingMode: AddressingMode.Absolute_X },
    0x99: { instruction: "STA", size: 3, cycles: 5, addressingMode: AddressingMode.Absolute_Y },
    0x81: { instruction: "STA", size: 2, cycles: 6, addressingMode: AddressingMode.Indirect_X },
    0x91: { instruction: "STA", size: 2, cycles: 6, addressingMode: AddressingMode.Indirect_Y },

    // STX - Store X Register
    0x86: { instruction: "STX", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage },
    0x96: { instruction: "STX", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_Y },
    0x8E: { instruction: "STX", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute },

    // STY - Store Y Register
    0x84: { instruction: "STY", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage },
    0x94: { instruction: "STY", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_X },
    0x8C: { instruction: "STY", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute },

    // TAX - Transfer Accumulator to X
    0xAA: { instruction: "TAX", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // TAY - Transfer Accumulator to Y
    0xA8: { instruction: "TAY", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // TSX - Transfer Stack Pointer to X
    0xBA: { instruction: "TSX", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // TXA - Transfer X to Accumulator
    0x8A: { instruction: "TXA", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // TXS - Transfer X to Stack Pointer
    0x9A: { instruction: "TXS", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // TYA - Transfer Y to Accumulator
    0x98: { instruction: "TYA", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode },

    // UNOFFICIAL OPCODES (unofficial but they were still used so we need to handle them)
    // https://www.nesdev.org/undocumented_opcodes.txt

    0xc7: { instruction: "*DCP", size: 2, cycles: 5, addressingMode: AddressingMode.ZeroPage},
    0xd7: { instruction: "*DCP", size: 2, cycles: 6, addressingMode: AddressingMode.ZeroPage_X},
    0xCF: { instruction: "*DCP", size: 3, cycles: 6, addressingMode: AddressingMode.Absolute},
    0xdF: { instruction: "*DCP", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_X},
    0xdb: { instruction: "*DCP", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_Y},
    0xd3: { instruction: "*DCP", size: 2, cycles: 8, addressingMode: AddressingMode.Indirect_Y},
    0xc3: { instruction: "*DCP", size: 2, cycles: 8, addressingMode: AddressingMode.Indirect_X},


    0x27: { instruction: "*RLA", size: 2, cycles: 5, addressingMode: AddressingMode.ZeroPage},
    0x37: { instruction: "*RLA", size: 2, cycles: 6, addressingMode: AddressingMode.ZeroPage_X},
    0x2F: { instruction: "*RLA", size: 3, cycles: 6, addressingMode: AddressingMode.Absolute},
    0x3F: { instruction: "*RLA", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_X},
    0x3b: { instruction: "*RLA", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_Y},
    0x33: { instruction: "*RLA", size: 2, cycles: 8, addressingMode: AddressingMode.Indirect_Y},
    0x23: { instruction: "*RLA", size: 2, cycles: 8, addressingMode: AddressingMode.Indirect_X},

    0x07: { instruction: "*SLO", size: 2, cycles: 5, addressingMode: AddressingMode.ZeroPage},
    0x17: { instruction: "*SLO", size: 2, cycles: 6, addressingMode: AddressingMode.ZeroPage_X},
    0x0F: { instruction: "*SLO", size: 3, cycles: 6, addressingMode: AddressingMode.Absolute},
    0x1f: { instruction: "*SLO", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_X},
    0x1b: { instruction: "*SLO", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_Y},
    0x03: { instruction: "*SLO", size: 2, cycles: 8, addressingMode: AddressingMode.Indirect_X},
    0x13: { instruction: "*SLO", size: 2, cycles: 8, addressingMode: AddressingMode.Indirect_Y},

    0x47: { instruction: "*SRE", size: 2, cycles: 5, addressingMode: AddressingMode.ZeroPage},
    0x57: { instruction: "*SRE", size: 2, cycles: 6, addressingMode: AddressingMode.ZeroPage_X},
    0x4F: { instruction: "*SRE", size: 3, cycles: 6, addressingMode: AddressingMode.Absolute},
    0x5f: { instruction: "*SRE", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_X},
    0x5b: { instruction: "*SRE", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_Y},
    0x43: { instruction: "*SRE", size: 2, cycles: 8, addressingMode: AddressingMode.Indirect_X},
    0x53: { instruction: "*SRE", size: 2, cycles: 8, addressingMode: AddressingMode.Indirect_Y},


    0x80: { instruction: "*NOP", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate},
    0x82: { instruction: "*NOP", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate},
    0x89: { instruction: "*NOP", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate},
    0xc2: { instruction: "*NOP", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate},
    0xe2: { instruction: "*NOP", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate},


    0xCB: { instruction: "*AXS", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate},

    0x6B: { instruction: "*ARR", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate},

    0xeb: { instruction: "*SBC", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate},

    0x0b: { instruction: "*ANC", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate},
    0x2b: { instruction: "*ANC", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate},

    0x4b: { instruction: "*ALR", size: 2, cycles: 2, addressingMode: AddressingMode.Immediate},

    0x04: { instruction: "*NOP", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage},
    0x44: { instruction: "*NOP", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage},
    0x64: { instruction: "*NOP", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage},
    0x14: { instruction: "*NOP", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_X},
    0x34: { instruction: "*NOP", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_X},
    0x54: { instruction: "*NOP", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_X},
    0x74: { instruction: "*NOP", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_X},
    0xd4: { instruction: "*NOP", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_X},
    0xf4: { instruction: "*NOP", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_X},
    0x0c: { instruction: "*NOP", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute},
    0x1c: { instruction: "*NOP", size: 3, cycles: 4 /*or 5*/, addressingMode: AddressingMode.Absolute_X},
    0x3c: { instruction: "*NOP", size: 3, cycles: 4 /*or 5*/, addressingMode: AddressingMode.Absolute_X},
    0x5c: { instruction: "*NOP", size: 3, cycles: 4 /*or 5*/, addressingMode: AddressingMode.Absolute_X},
    0x7c: { instruction: "*NOP", size: 3, cycles: 4 /*or 5*/, addressingMode: AddressingMode.Absolute_X},
    0xdc: { instruction: "*NOP", size: 3, cycles: 4 /* or 5*/, addressingMode: AddressingMode.Absolute_X},
    0xfc: { instruction: "*NOP", size: 3, cycles: 4 /* or 5*/, addressingMode: AddressingMode.Absolute_X},

    0x67: { instruction: "*RRA", size: 2, cycles: 5, addressingMode: AddressingMode.ZeroPage},
    0x77: { instruction: "*RRA", size: 2, cycles: 6, addressingMode: AddressingMode.ZeroPage_X},
    0x6f: { instruction: "*RRA", size: 3, cycles: 6, addressingMode: AddressingMode.Absolute},
    0x7f: { instruction: "*RRA", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_X},
    0x7b: { instruction: "*RRA", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_Y},
    0x63: { instruction: "*RRA", size: 2, cycles: 8, addressingMode: AddressingMode.Indirect_X},
    0x73: { instruction: "*RRA", size: 2, cycles: 8, addressingMode: AddressingMode.Indirect_Y},


    0xe7: { instruction: "*ISB", size: 2, cycles: 5, addressingMode: AddressingMode.ZeroPage},
    0xf7: { instruction: "*ISB", size: 2, cycles: 6, addressingMode: AddressingMode.ZeroPage_X},
    0xef: { instruction: "*ISB", size: 3, cycles: 6, addressingMode: AddressingMode.Absolute},
    0xff: { instruction: "*ISB", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_X},
    0xfb: { instruction: "*ISB", size: 3, cycles: 7, addressingMode: AddressingMode.Absolute_Y},
    0xe3: { instruction: "*ISB", size: 2, cycles: 8, addressingMode: AddressingMode.Indirect_X},
    0xf3: { instruction: "*ISB", size: 2, cycles: 8, addressingMode: AddressingMode.Indirect_Y},

    0x02: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},
    0x12: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},
    0x22: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},
    0x32: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},
    0x42: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},
    0x52: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},
    0x62: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},
    0x72: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},
    0x92: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},
    0xb2: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},
    0xd2: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},
    0xf2: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},

    0x1a: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},
    0x3a: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},
    0x5a: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},
    0x7a: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},
    0xda: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},
    0xfa: { instruction: "*NOP", size: 1, cycles: 2, addressingMode: AddressingMode.NoMode},

    0xab: { instruction: "*LXA", size: 2, cycles: 3, addressingMode: AddressingMode.Immediate},
    //http://visual6502.org/wiki/index.php?title=6502_Opcode_8B_%28XAA,_ANE%29
    0x8b: { instruction: "*XAA", size: 2, cycles: 3, addressingMode: AddressingMode.Immediate},
    0xbb: { instruction: "*LAS", size: 3, cycles: 2, addressingMode: AddressingMode.Absolute_Y},
    0x9b: { instruction: "*TAS", size: 3, cycles: 2, addressingMode: AddressingMode.Absolute_Y},
    0x93: { instruction: "*AHX", size: 2, /* guess */ cycles: 8, addressingMode: AddressingMode.Indirect_Y},
    0x9f: { instruction: "*AHX", size: 3, /* guess */ cycles: 4/* or 5*/, addressingMode: AddressingMode.Absolute_Y},
    0x9e: { instruction: "*SHX", size: 3, /* guess */ cycles: 4/* or 5*/, addressingMode: AddressingMode.Absolute_Y},
    0x9c: { instruction: "*SHY", size: 3, /* guess */ cycles: 4/* or 5*/, addressingMode: AddressingMode.Absolute_X},

    0xa7: { instruction: "*LAX", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage},
    0xb7: { instruction: "*LAX", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_Y},
    0xaf: { instruction: "*LAX", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute},
    0xbf: { instruction: "*LAX", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute_Y},
    0xa3: { instruction: "*LAX", size: 2, cycles: 6, addressingMode: AddressingMode.Indirect_X},
    0xb3: { instruction: "*LAX", size: 2, cycles: 5, addressingMode: AddressingMode.Indirect_Y},

    0x87: { instruction: "*SAX", size: 2, cycles: 3, addressingMode: AddressingMode.ZeroPage},
    0x97: { instruction: "*SAX", size: 2, cycles: 4, addressingMode: AddressingMode.ZeroPage_Y},
    0x8f: { instruction: "*SAX", size: 3, cycles: 4, addressingMode: AddressingMode.Absolute},
    0x83: { instruction: "*SAX", size: 2, cycles: 6, addressingMode: AddressingMode.Indirect_X},

};  
