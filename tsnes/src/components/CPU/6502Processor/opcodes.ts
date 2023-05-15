import { IMM, IMP, ZP0, ZPX, ZPY, REL, ABS, ABX, ABY, IND, IZX, IZY } from "./a_modes"

// Opcodes
const ADC = () => {
        
}
const AND = () => {
    
}
const ASL = () => {
    
}
const BCC = () => {
    
}
const BCS = () => {
    
}
const BEQ = () => {
    
}
const BIT = () => {
    
}
const BMI = () => {
    
}
const BNE = () => {
    
}
const BPL = () => {
    
}
const BRK = () => {
    
}
const BVC = () => {
    
}
const BVS = () => {
    
}
const CLC = () => {
    
}
const CLD = () => {
    
}
const CLI = () => {
    
}
const CLV = () => {
    
}
const CMP = () => {
    
}
const CPX = () => {
    
}
const CPY = () => {
    
}
const DEC = () => {
    
}
const DEX = () => {
    
}
const DEY = () => {
    
}
const EOR = () => {
    
}
const INC = () => {
    
}
const INX = () => {
    
}
const INY = () => {
    
}
const JMP = () => {
    
}
const JSR = () => {
    
}
const LDA = () => {
    
}
const LDX = () => {
    
}
const LDY = () => {
    
}
const LSR = () => {
    
}
const NOP = () => {
    
}
const ORA = () => {
    
}
const PHA = () => {
    
}
const PHP = () => {
    
}
const PLA = () => {
    
}
const PLP = () => {
    
}
const ROL = () => {
    
}
const ROR = () => {
    
}
const RTI = () => {
    
}
const RTS = () => {
    
}
const SBC = () => {
    
}
const SEC = () => {
    
}
const SED = () => {
    
}
const SEI = () => {
    
}
const STA = () => {
    
}
const STX = () => {
    
}
const STY = () => {
    
}
const TAX = () => {
    
}
const TAY = () => {
    
}
const TSX = () => {
    
}
const TXA = () => {
    
}
const TXS = () => {
    
}
const TYA = () => {
    
}

const XXX = () => { // handle illegal opcodes

}

export const INSTRUTION_NAME = 0;
export const ADDRESSING_MODE = 1;
export const OPERATION = 2;
export const ADDRESSING_MODE_FUNC = 3;
export const CYCLES_REQUIRED = 4;
// structure ["<INSTRUTION_NAME>", "<ADDRESSING_MODE>", INSTRUCTION_FUNC, ADDRESSING_MODE_FUNC, CYCLES_REQUIRED]
export const instruction_lookup =
    [
        ["BRK", "IMM", BRK, IMM, 7],["ORA", "IZX", ORA, IZX, 6],["???", "IMP", XXX, IMP, 2],["???", "IMP", XXX, IMP, 8],["???", "IMP", NOP, IMP, 3],["ORA", "ZP0", ORA, ZP0, 3],["ASL", "ZP0", ASL, ZP0, 5],["???","IMP", XXX, IMP, 5],["PHP", "IMP", PHP, IMP, 3],["ORA", "IMM", ORA, IMM, 2],["ASL", "IMP", ASL, IMP, 2],["???", "IMP", XXX, IMP, 2],["???", "IMP", NOP, IMP, 4],["ORA", "ABS", ORA, ABS, 4],["ASL", "ABS", ASL, ABS, 6],["???", "IMP", XXX, IMP, 6],
        ["BPL", "REL", BPL, REL, 2],["ORA", "IZY", ORA, IZY, 5],["???", "IMP", XXX, IMP, 2],["???", "IMP", XXX, IMP, 8],["???", "IMP", NOP, IMP, 4],["ORA", "ZPX", ORA, ZPX, 4],["ASL", "ZPX", ASL, ZPX, 6],["???","IMP", XXX, IMP, 6],["CLC", "IMP", CLC, IMP, 2],["ORA", "ABY", ORA, ABY, 4],["???", "IMP", NOP, IMP, 2],["???", "IMP", XXX, IMP, 7],["???", "IMP", NOP, IMP, 4],["ORA", "ABX", ORA, ABX, 4],["ASL", "ABX", ASL, ABX, 7],["???", "IMP", XXX, IMP, 7],
        ["JSR", "ABS", JSR, ABS, 6],["AND", "IZX", AND, IZX, 6],["???", "IMP", XXX, IMP, 2],["???", "IMP", XXX, IMP, 8],["BIT", "ZP0", BIT, ZP0, 3],["AND", "ZP0", AND, ZP0, 3],["ROL", "ZP0", ROL, ZP0, 5],["???","IMP", XXX, IMP, 5],["PLP", "IMP", PLP, IMP, 4],["AND", "IMM", AND, IMM, 2],["ROL", "IMP", ROL, IMP, 2],["???", "IMP", XXX, IMP, 2],["BIT", "ABS", BIT, ABS, 4],["AND", "ABS", AND, ABS, 4],["ROL", "ABS", ROL, ABS, 6],["???", "IMP", XXX, IMP, 6],
        ["RTI", "IMP", RTI, IMP, 6],["EOR", "IZX", EOR, IZX, 6],["???", "IMP", XXX, IMP, 2],["???", "IMP", XXX, IMP, 8],["???", "IMP", NOP, IMP, 3],["EOR", "ZP0", EOR, ZP0, 3],["LSR", "ZP0", LSR, ZP0, 5],["???","IMP", XXX, IMP, 5],["PHA", "IMP", PHA, IMP, 3],["EOR", "IMM", EOR, IMM, 2],["LSR", "IMP", LSR, IMP, 2],["???", "IMP", XXX, IMP, 2],["JMP", "ABS", JMP, ABS, 3],["EOR", "ABS", EOR, ABS, 4],["LSR", "ABS", LSR, ABS, 6],["???", "IMP", XXX, IMP, 6],
        ["BVC", "REL", BVC, REL, 2],["EOR", "IZY", EOR, IZY, 5],["???", "IMP", XXX, IMP, 2],["???", "IMP", XXX, IMP, 8],["???", "IMP", NOP, IMP, 4],["EOR", "ZPX", EOR, ZPX, 4],["LSR", "ZPX", LSR, ZPX, 6],["???","IMP", XXX, IMP, 6],["CLI", "IMP", CLI, IMP, 2],["EOR", "ABY", EOR, ABY, 4],["???", "IMP", NOP, IMP, 2],["???", "IMP", XXX, IMP, 7],["???", "IMP", NOP, IMP, 4],["EOR", "ABX", EOR, ABX, 4],["LSR", "ABX", LSR, ABX, 7],["???", "IMP", XXX, IMP, 7],
        ["BMI", "REL", BMI, REL, 2],["AND", "IZY", AND, IZY, 5],["???", "IMP", XXX, IMP, 2],["???", "IMP", XXX, IMP, 8],["???", "IMP", NOP, IMP, 4],["AND", "ZPX", AND, ZPX, 4],["ROL", "ZPX", ROL, ZPX, 6],["???","IMP", XXX, IMP, 6],["SEC", "IMP", SEC, IMP, 2],["AND", "ABY", AND, ABY, 4],["???", "IMP", NOP, IMP, 2],["???", "IMP", XXX, IMP, 7],["???", "IMP", NOP, IMP, 4],["AND", "ABX", AND, ABX, 4],["ROL", "ABX", ROL, ABX, 7],["???", "IMP", XXX, IMP, 7],
        ["RTS", "IMP", RTS, IMP, 6],["ADC", "IZX", ADC, IZX, 6],["???", "IMP", XXX, IMP, 2],["???", "IMP", XXX, IMP, 8],["???", "IMP", NOP, IMP, 3],["ADC", "ZP0", ADC, ZP0, 3],["ROR", "ZP0", ROR, ZP0, 5],["???","IMP", XXX, IMP, 5],["PLA", "IMP", PLA, IMP, 4],["ADC", "IMM", ADC, IMM, 2],["ROR", "IMP", ROR, IMP, 2],["???", "IMP", XXX, IMP, 2],["JMP", "IND", JMP, IND, 5],["ADC", "ABS", ADC, ABS, 4],["ROR", "ABS", ROR, ABS, 6],["???", "IMP", XXX, IMP, 6],
        ["BVS", "REL", BVS, REL, 2],["ADC", "IZY", ADC, IZY, 5],["???", "IMP", XXX, IMP, 2],["???", "IMP", XXX, IMP, 8],["???", "IMP", NOP, IMP, 4],["ADC", "ZPX", ADC, ZPX, 4],["ROR", "ZPX", ROR, ZPX, 6],["???","IMP", XXX, IMP, 6],["SEI", "IMP", SEI, IMP, 2],["ADC", "ABY", ADC, ABY, 4],["???", "IMP", NOP, IMP, 2],["???", "IMP", XXX, IMP, 7],["???", "IMP", NOP, IMP, 4],["ADC", "ABX", ADC, ABX, 4],["ROR", "ABX", ROR, ABX, 7],["???", "IMP", XXX, IMP, 7],
        ["???", "IMP", NOP, IMP, 2],["STA", "IZX", STA, IZX, 6],["???", "IMP", NOP, IMP, 2],["???", "IMP", XXX, IMP, 6],["STY", "ZP0", STY, ZP0, 3],["STA", "ZP0", STA, ZP0, 3],["STX", "ZP0", STX, ZP0, 3],["???","IMP", XXX, IMP, 3],["DEY", "IMP", DEY, IMP, 2],["???", "IMP", NOP, IMP, 2],["TXA", "IMP", TXA, IMP, 2],["???", "IMP", XXX, IMP, 2],["STY", "ABS", STY, ABS, 4],["STA", "ABS", STA, ABS, 4],["STX", "ABS", STX, ABS, 4],["???", "IMP", XXX, IMP, 4],
        ["BCC", "REL", BCC, REL, 2],["STA", "IZY", STA, IZY, 6],["???", "IMP", XXX, IMP, 2],["???", "IMP", XXX, IMP, 6],["STY", "ZPX", STY, ZPX, 4],["STA", "ZPX", STA, ZPX, 4],["STX", "ZPY", STX, ZPY, 4],["???","IMP", XXX, IMP, 4],["TYA", "IMP", TYA, IMP, 2],["STA", "ABY", STA, ABY, 5],["TXS", "IMP", TXS, IMP, 2],["???", "IMP", XXX, IMP, 5],["???", "IMP", NOP, IMP, 5],["STA", "ABX", STA, ABX, 5],["???", "IMP", XXX, IMP, 5],["???", "IMP", XXX, IMP, 5],
        ["LDY", "IMM", LDY, IMM, 2],["LDA", "IZX", LDA, IZX, 6],["LDX", "IMM", LDX, IMM, 2],["???", "IMP", XXX, IMP, 6],["LDY", "ZP0", LDY, ZP0, 3],["LDA", "ZP0", LDA, ZP0, 3],["LDX", "ZP0", LDX, ZP0, 3],["???","IMP", XXX, IMP, 3],["TAY", "IMP", TAY, IMP, 2],["LDA", "IMM", LDA, IMM, 2],["TAX", "IMP", TAX, IMP, 2],["???", "IMP", XXX, IMP, 2],["LDY", "ABS", LDY, ABS, 4],["LDA", "ABS", LDA, ABS, 4],["LDX", "ABS", LDX, ABS, 4],["???", "IMP", XXX, IMP, 4],
        ["BCS", "REL", BCS, REL, 2],["LDA", "IZY", LDA, IZY, 5],["???", "IMP", XXX, IMP, 2],["???", "IMP", XXX, IMP, 5],["LDY", "ZPX", LDY, ZPX, 4],["LDA", "ZPX", LDA, ZPX, 4],["LDX", "ZPY", LDX, ZPY, 4],["???","IMP", XXX, IMP, 4],["CLV", "IMP", CLV, IMP, 2],["LDA", "ABY", LDA, ABY, 4],["TSX", "IMP", TSX, IMP, 2],["???", "IMP", XXX, IMP, 4],["LDY", "ABX", LDY, ABX, 4],["LDA", "ABX", LDA, ABX, 4],["LDX", "ABY", LDX, ABY, 4],["???", "IMP", XXX, IMP, 4],
        ["CPY", "IMM", CPY, IMM, 2],["CMP", "IZX", CMP, IZX, 6],["???", "IMP", NOP, IMP, 2],["???", "IMP", XXX, IMP, 8],["CPY", "ZP0", CPY, ZP0, 3],["CMP", "ZP0", CMP, ZP0, 3],["DEC", "ZP0", DEC, ZP0, 5],["???","IMP", XXX, IMP, 5],["INY", "IMP", INY, IMP, 2],["CMP", "IMM", CMP, IMM, 2],["DEX", "IMP", DEX, IMP, 2],["???", "IMP", XXX, IMP, 2],["CPY", "ABS", CPY, ABS, 4],["CMP", "ABS", CMP, ABS, 4],["DEC", "ABS", DEC, ABS, 6],["???", "IMP", XXX, IMP, 6],
        ["BNE", "REL", BNE, REL, 2],["CMP", "IZY", CMP, IZY, 5],["???", "IMP", XXX, IMP, 2],["???", "IMP", XXX, IMP, 8],["???", "IMP", NOP, IMP, 4],["CMP", "ZPX", CMP, ZPX, 4],["DEC", "ZPX", DEC, ZPX, 6],["???","IMP", XXX, IMP, 6],["CLD", "IMP", CLD, IMP, 2],["CMP", "ABY", CMP, ABY, 4],["NOP", "IMP", NOP, IMP, 2],["???", "IMP", XXX, IMP, 7],["???", "IMP", NOP, IMP, 4],["CMP", "ABX", CMP, ABX, 4],["DEC", "ABX", DEC, ABX, 7],["???", "IMP", XXX, IMP, 7],
        ["CPX", "IMM", CPX, IMM, 2],["SBC", "IZX", SBC, IZX, 6],["???", "IMP", NOP, IMP, 2],["???", "IMP", XXX, IMP, 8],["CPX", "ZP0", CPX, ZP0, 3],["SBC", "ZP0", SBC, ZP0, 3],["INC", "ZP0", INC, ZP0, 5],["???","IMP", XXX, IMP, 5],["INX", "IMP", INX, IMP, 2],["SBC", "IMM", SBC, IMM, 2],["NOP", "IMP", NOP, IMP, 2],["???", "IMP", SBC, IMP, 2],["CPX", "ABS", CPX, ABS, 4],["SBC", "ABS", SBC, ABS, 4],["INC", "ABS", INC, ABS, 6],["???", "IMP", XXX, IMP, 6],
        ["BEQ", "REL", BEQ, REL, 2],["SBC", "IZY", SBC, IZY, 5],["???", "IMP", XXX, IMP, 2],["???", "IMP", XXX, IMP, 8],["???", "IMP", NOP, IMP, 4],["SBC", "ZPX", SBC, ZPX, 4],["INC", "ZPX", INC, ZPX, 6],["???","IMP", XXX, IMP, 6],["SED", "IMP", SED, IMP, 2],["SBC", "ABY", SBC, ABY, 4],["NOP", "IMP", NOP, IMP, 2],["???", "IMP", XXX, IMP, 7],["???", "IMP", NOP, IMP, 4],["SBC", "ABX", SBC, ABX, 4],["INC", "ABX", INC, ABX, 7],["???", "IMP", XXX, IMP, 7]
    ];