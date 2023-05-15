import { IMM, IMP, ZP0, ZPX, ZPY, REL, ABS, ABX, ABY, IND, IZX, IZY } from "./a_modes"
import Processor6502 from "./utils"

const BITS16 = 2**16 - 1
// Opcodes

// Instruction: Add with Carry In
// Function:    A = A + M + C
// Flags Out:   C, V, N, Z

// Need to be very careful of overflow/underflow as well as positive negative representation of the numbers.

// The implementation of ADD is the same in binary, this is just about how the numbers
// are represented, so the word 10000100 can be both -124 and 132 depending upon the 
// context the programming is using it in. We can prove this!

// To derive a convenient way to code this, a truth table can be utilized to derive an equation 
// that can account for overflow/underflow depending on the addition of the numbers:

// A = most significant bit of the accumulator
// M = most significant bit of the data
// R = most significant bit of the result of data + accumulator
// V = Signed overflow flag

// A  M  R | V | A^R | A^M |~(A^M) | 
// 0  0  0 | 0 |  0  |  0  |   1   |
// 0  0  1 | 1 |  1  |  0  |   1   |
// 0  1  0 | 0 |  0  |  1  |   0   |
// 0  1  1 | 0 |  1  |  1  |   0   |  so V = ~(A^M) & (A^R) can tell us when overflow will occur
// 1  0  0 | 0 |  1  |  1  |   0   |
// 1  0  1 | 0 |  0  |  1  |   0   |
// 1  1  0 | 1 |  1  |  0  |   1   |
// 1  1  1 | 0 |  0  |  0  |   1   |
//
// We can see how the above equation calculates V, based on A, M and R. V was chosen
// based on the following hypothesis:
//       Positive Number + Positive Number = Negative Result -> Overflow
//       Negative Number + Negative Number = Positive Result -> Overflow
//       Positive Number + Negative Number = Either Result -> Cannot Overflow
//       Positive Number + Positive Number = Positive Result -> OK! No Overflow
//       Negative Number + Negative Number = Negative Result -> OK! NO Overflow

// see explanation here the derivation of this equation: https://archive.nes.science/nesdev-forums/f3/t3694.xhtml
const ADC = (cpu:Processor6502) => {
    // Grab the data that we are adding to the accumulator
	cpu.fetch();
	
	// Add is performed in 16-bit domain for emulation to capture any
	// carry bit, which will exist in bit 8 of the 16-bit word
	const temp = ((cpu.a % BITS16) + (cpu.fetched % BITS16) + (cpu.GetFlag(cpu.FLAGS6502.C) % BITS16)) % BITS16;
	
	// The carry flag out exists in the high byte bit 0
	cpu.SetFlag(cpu.FLAGS6502.C, (temp > 255) ? 1 : 0);
	
	// The Zero flag is set if the result is 0
	cpu.SetFlag(cpu.FLAGS6502.Z, ((temp & 0x00FF) === 0) ? 1 : 0);
	
	// The signed Overflow flag is set based on all that up there!
	cpu.SetFlag(cpu.FLAGS6502.V, ((~((cpu.a % BITS16) ^ (cpu.fetched % BITS16)) & ((cpu.a % BITS16) ^ (temp % BITS16))) & 0x0080));
	
	// The negative flag is set to the most significant bit of the result
	cpu.SetFlag(cpu.FLAGS6502.N, temp & 0x80);
	
	// Load the result into the accumulator (it's 8-bit dont forget!)
	cpu.a = temp & 0x00FF;
	
	// This instruction has the potential to require an additional clock cycle
	return 1;

}

// logical AND the accumulator with the fetched data
const AND = (cpu:Processor6502) => {
    cpu.fetch(); // fetch instruction
    cpu.a &= cpu.fetched;
    cpu.SetFlag(cpu.FLAGS6502.Z, cpu.a === 0x00 ? 1 : 0); // set zero flag if result is zero flag
    cpu.SetFlag(cpu.FLAGS6502.N, cpu.a === 0x80 ? 1 : 0); // set negative flag if result is negative (i.e bit 7 is 1)
    return 1; // may require an additional clock cycle if page boundary is crossed (depends on addressing mode as well)
}

// Instruction: Arithmetic Shift Left
// Function:    A = C <- (A << 1) <- 0
// Flags Out:   N, Z, C
const ASL = (cpu:Processor6502) => {
    cpu.fetch();
	const temp = (cpu.fetched % BITS16) << 1;
	cpu.SetFlag(cpu.FLAGS6502.C, (temp & 0xFF00) > 0 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.Z, (temp & 0x00FF) === 0x00 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, temp & 0x80);
	if (cpu.instruction_lookup[cpu.opcode][ADDRESSING_MODE] === "IMP"){
		cpu.a = temp & 0x00FF;
	}
	else{
		cpu.write(cpu.addr_abs, temp & 0x00FF);
	}
	return 0;
}

// Instruction: Branch if Carry Clear
// Function:    if(C === 0) pc = address 
const BCC = (cpu:Processor6502) => {
    if (cpu.GetFlag(cpu.FLAGS6502.C) === 0)
	{
		cpu.cycles++; // add one additional cycle if branch occurs on the same page
		cpu.addr_abs = cpu.pc + cpu.addr_rel;
		
		if((cpu.addr_abs & 0xFF00) != (cpu.pc & 0xFF00)) // if the branch crosses to a new page, add yet another clock cycle. All branch insturctions work this way
        {
            cpu.cycles++;
        }
		
		cpu.pc = cpu.addr_abs;
	}
	return 0; 
}

// Instruction: Branch if Carry Set
// Function:    if(C === 1) pc = address
const BCS = (cpu:Processor6502) => {
    if (cpu.GetFlag(cpu.FLAGS6502.C) === 1)
	{
		cpu.cycles++;
		cpu.addr_abs = cpu.pc + cpu.addr_rel;
		
		if((cpu.addr_abs & 0xFF00) != (cpu.pc & 0xFF00))
        {
            cpu.cycles++;
        }
		cpu.pc = cpu.addr_abs;
	}
	return 0;
}

// Instruction: Branch if Equal
// Function:    if(Z === 1) pc = address
const BEQ = (cpu:Processor6502) => {
    if (cpu.GetFlag(cpu.FLAGS6502.Z) === 1)
	{
		cpu.cycles++;
		cpu.addr_abs = cpu.pc + cpu.addr_rel;
		
		if((cpu.addr_abs & 0xFF00) != (cpu.pc & 0xFF00))
        {
            cpu.cycles++;
        }
		cpu.pc = cpu.addr_abs;
	}
	return 0;
}
const BIT = (cpu:Processor6502) => {
    
}

// Instruction: Branch if Negative
// Function:    if(N === 1) pc = address
const BMI = (cpu:Processor6502) => {
    if (cpu.GetFlag(cpu.FLAGS6502.N) === 1)
	{
		cpu.cycles++;
		cpu.addr_abs = cpu.pc + cpu.addr_rel;
		
		if((cpu.addr_abs & 0xFF00) != (cpu.pc & 0xFF00))
        {
            cpu.cycles++;
        }
		cpu.pc = cpu.addr_abs;
	}
	return 0;
}

// Instruction: Branch if Not Equal
// Function:    if(Z === 0) pc = address
const BNE = (cpu:Processor6502) => {
    if (cpu.GetFlag(cpu.FLAGS6502.Z) === 0)
	{
		cpu.cycles++;
		cpu.addr_abs = cpu.pc + cpu.addr_rel;
		
		if((cpu.addr_abs & 0xFF00) != (cpu.pc & 0xFF00))
        {
            cpu.cycles++;
        }
		cpu.pc = cpu.addr_abs;
	}
	return 0;
}

// Instruction: Branch if Positive
// Function:    if(N === 0) pc = address
const BPL = (cpu:Processor6502) => {
    if (cpu.GetFlag(cpu.FLAGS6502.N) === 0)
	{
		cpu.cycles++;
		cpu.addr_abs = cpu.pc + cpu.addr_rel;
		
		if((cpu.addr_abs & 0xFF00) != (cpu.pc & 0xFF00))
        {
            cpu.cycles++;
        }
		cpu.pc = cpu.addr_abs;
	}
	return 0;
}

// Instruction: Break
// Function:    Program Sourced Interrupt
const BRK = (cpu:Processor6502) => {
    cpu.pc++;
	
	cpu.SetFlag(cpu.FLAGS6502.I, 1);
	cpu.write(0x0100 + cpu.stkp, (cpu.pc >> 8) & 0x00FF);
	cpu.stkp--;
	cpu.write(0x0100 + cpu.stkp, cpu.pc & 0x00FF);
	cpu.stkp--;

	cpu.SetFlag(cpu.FLAGS6502.B, 1);
	cpu.write(0x0100 + cpu.stkp, cpu.status);
	cpu.stkp--;
	cpu.SetFlag(cpu.FLAGS6502.B, 0);

	cpu.pc = (cpu.read(0xFFFE) % BITS16) | ((cpu.read(0xFFFF) % BITS16) << 8);
	return 0;
}

// Instruction: Branch if Overflow Clear
// Function:    if(V === 0) pc = address
const BVC = (cpu:Processor6502) => {
    if (cpu.GetFlag(cpu.FLAGS6502.V) === 0)
	{
		cpu.cycles++;
		cpu.addr_abs = cpu.pc + cpu.addr_rel;
		
		if((cpu.addr_abs & 0xFF00) != (cpu.pc & 0xFF00))
        {
            cpu.cycles++;
        }
		cpu.pc = cpu.addr_abs;
	}
}

// Instruction: Branch if Overflow Set
// Function:    if(V === 1) pc = address
const BVS = (cpu:Processor6502) => {
    if (cpu.GetFlag(cpu.FLAGS6502.V) === 1)
	{
		cpu.cycles++;
		cpu.addr_abs = cpu.pc + cpu.addr_rel;
		
		if((cpu.addr_abs & 0xFF00) != (cpu.pc & 0xFF00))
        {
            cpu.cycles++;
        }
		cpu.pc = cpu.addr_abs;
	}
}

// Instruction: Clear Carry Flag
// Function:    C = 0
const CLC = (cpu:Processor6502) => {
    cpu.SetFlag(cpu.FLAGS6502.C, 0);
	return 0;
}

// Instruction: Clear Decimal Flag
// Function:    D = 0
const CLD = (cpu:Processor6502) => {
    cpu.SetFlag(cpu.FLAGS6502.D, 0);
	return 0;
}

// Instruction: Disable Interrupts / Clear Interrupt Flag
// Function:    I = 0
const CLI = (cpu:Processor6502) => {
    cpu.SetFlag(cpu.FLAGS6502.I, 0);
	return 0;
}

// Instruction: Clear Overflow Flag
// Function:    V = 0
const CLV = (cpu:Processor6502) => {
    cpu.SetFlag(cpu.FLAGS6502.I, 0);
	return 0;
}

// Instruction: Compare Accumulator
// Function:    C <- A >= M      Z <- (A - M) === 0
// Flags Out:   N, C, Z
const CMP = (cpu:Processor6502) => {
	cpu.fetch();
	const temp = (cpu.a % BITS16) - (cpu.fetched % BITS16) % BITS16;
	cpu.SetFlag(cpu.FLAGS6502.C, cpu.a >= cpu.fetched ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.Z, (temp & 0x00FF) === 0x0000 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, temp & 0x0080);
	return 0;
}

// Instruction: Compare X Register
// Function:    C <- X >= M      Z <- (X - M) === 0
// Flags Out:   N, C, Z
const CPX = (cpu:Processor6502) => {
    cpu.fetch();
	const temp = (cpu.x % BITS16) - (cpu.fetched % BITS16) % BITS16;
	cpu.SetFlag(cpu.FLAGS6502.C, cpu.x >= cpu.fetched ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.Z, (temp & 0x00FF) === 0x0000 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, temp & 0x0080);
	return 1;
}
const CPY = (cpu:Processor6502) => {
    cpu.fetch();
	const temp = (cpu.y % BITS16) - (cpu.fetched % BITS16) % BITS16;
	cpu.SetFlag(cpu.FLAGS6502.C, cpu.y >= cpu.fetched ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.Z, (temp & 0x00FF) === 0x0000 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, temp & 0x0080);
	return 1;
}

// Instruction: Decrement Value at Memory Location
// Function:    M = M - 1
// Flags Out:   N, Z
const DEC = (cpu:Processor6502) => {
    cpu.fetch();
	const temp = cpu.fetched - 1;
	cpu.write(cpu.addr_abs, temp & 0x00FF);
	cpu.SetFlag(cpu.FLAGS6502.Z, (temp & 0x00FF) === 0x0000? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, temp & 0x0080);
	return 0;
}

// Instruction: Decrement X Register
// Function:    X = X - 1
// Flags Out:   N, Z
const DEX = (cpu:Processor6502) => {
    cpu.x--;
	cpu.SetFlag(cpu.FLAGS6502.Z, cpu.x === 0x00 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, cpu.x & 0x80);
	return 0;
}
const DEY = (cpu:Processor6502) => {
    cpu.y--;
	cpu.SetFlag(cpu.FLAGS6502.Z, cpu.y === 0x00 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, cpu.y & 0x80);
	return 0;
}

// Instruction: Bitwise Logic XOR
// Function:    A = A xor M
// Flags Out:   N, Z
const EOR = (cpu:Processor6502) => {
    cpu.fetch();
	cpu.a = cpu.a ^ cpu.fetched;	
	cpu.SetFlag(cpu.FLAGS6502.Z, cpu.a === 0x00 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, cpu.a & 0x80);
	return 1;
}

// Instruction: Increment Value at Memory Location
// Function:    M = M + 1
// Flags Out:   N, Z	
const INC = (cpu:Processor6502) => {
    cpu.fetch();
	const temp = cpu.fetched + 1;
	cpu.write(cpu.addr_abs, temp & 0x00FF);
	cpu.SetFlag(cpu.FLAGS6502.Z, (temp & 0x00FF) === 0x0000 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, temp & 0x0080);
	return 0;
}

// Instruction: Increment X Register
// Function:    X = X + 1
// Flags Out:   N, Z
const INX = (cpu:Processor6502) => {
    cpu.x++;
	cpu.SetFlag(cpu.FLAGS6502.Z, cpu.x === 0x00 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, cpu.x & 0x80);
	return 0;
}

// Instruction: Increment Y Register
// Function:    Y = Y + 1
// Flags Out:   N, Z
const INY = (cpu:Processor6502) => {
	cpu.y++;
	cpu.SetFlag(cpu.FLAGS6502.Z, cpu.y === 0x00 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, cpu.y & 0x80);
	return 0;   
}

// Instruction: Jump To Location
// Function:    pc = address
const JMP = (cpu:Processor6502) => {
    cpu.pc = cpu.addr_abs;
	return 0;
}

// Instruction: Jump To Sub-Routine
// Function:    Push current pc to stack, pc = address
const JSR = (cpu:Processor6502) => {
    cpu.pc--;

	cpu.write(0x0100 + cpu.stkp, (cpu.pc >> 8) & 0x00FF);
	cpu.stkp--;
	cpu.write(0x0100 + cpu.stkp, cpu.pc & 0x00FF);
	cpu.stkp--;

	cpu.pc = cpu.addr_abs;
	return 0;
}

// Instruction: Load The Accumulator
// Function:    A = M
// Flags Out:   N, Z
const LDA = (cpu:Processor6502) => {
    cpu.fetch();
	cpu.a = cpu.fetched;
	cpu.SetFlag(cpu.FLAGS6502.Z, cpu.a === 0x00 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, cpu.a & 0x80);
	return 1;
}

// Instruction: Load The X Register
// Function:    X = M
// Flags Out:   N, Z
const LDX = (cpu:Processor6502) => {
    cpu.fetch();
	cpu.x = cpu.fetched;
	cpu.SetFlag(cpu.FLAGS6502.Z, cpu.x === 0x00 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, cpu.x & 0x80);
	return 1;
}
const LDY = (cpu:Processor6502) => {
	cpu.fetch();
	cpu.y = cpu.fetched;
	cpu.SetFlag(cpu.FLAGS6502.Z, cpu.y === 0x00 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, cpu.y & 0x80);
	return 1;
}

// Instruction: Left shift 1 bit right
// Function:    A = M >> 1
// Flags Out:   C, N, Z
const LSR = (cpu:Processor6502) => {
    cpu.fetch();
	cpu.SetFlag(cpu.FLAGS6502.C, cpu.fetched & 0x0001);
	const temp = cpu.fetched >> 1;	
	cpu.SetFlag(cpu.FLAGS6502.Z, (temp & 0x00FF) === 0x0000 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, temp & 0x0080);
	if (cpu.instruction_lookup[cpu.opcode][ADDRESSING_MODE] === "IMP")
	{
		cpu.a = temp & 0x00FF;
	}
	else{
		cpu.write(cpu.addr_abs, temp & 0x00FF);
	}
	return 0;
}

// LEFT UNIMPLEMNTED SINCE IT IS MAINLY USED FOR ILLEGAL OPCODES, WHICH WILL NOT BE IMPLEMENTED
const NOP = (cpu:Processor6502) => {
    
}

// Instruction: Bitwise Logic OR
// Function:    A = A | M
// Flags Out:   N, Z
const ORA = (cpu:Processor6502) => {
    cpu.fetch();
	cpu.a = cpu.a | cpu.fetched;
	cpu.SetFlag(cpu.FLAGS6502.Z, cpu.a == 0x00 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, cpu.a & 0x80);
	return 1;
}

// Instruction: Push Accumulator to Stack
// Function:    A -> stack
const PHA = (cpu:Processor6502) => {
    cpu.write(0x0100 + cpu.stkp, cpu.a); // stack pointer base address is 0x0100 
	cpu.stkp--;
	return 0;
}

// Instruction: Push Status Register to Stack
// Function:    status -> stack
// Note:        Break flag is set to 1 before push
const PHP = (cpu:Processor6502) => {
    cpu.write(0x0100 + cpu.stkp, cpu.status | cpu.FLAGS6502.B | cpu.FLAGS6502.U);
	cpu.SetFlag(cpu.FLAGS6502.B, 0);
	cpu.SetFlag(cpu.FLAGS6502.U, 0);
	cpu.stkp--;
	return 0;
}

// Instruction: Pop Accumulator off Stack
// Function:    A <- stack
// Flags Out:   N, Z
const PLA = (cpu:Processor6502) => {
    cpu.stkp++;
	cpu.a = cpu.read(0x0100 + cpu.stkp);
	cpu.SetFlag(cpu.FLAGS6502.Z, cpu.a === 0x00 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, cpu.a & 0x80);
	return 0;
}

// Instruction: Pop Status Register off Stack
// Function:    Status <- stack
const PLP = (cpu:Processor6502) => {
    cpu.stkp++;
	cpu.status = cpu.read(0x0100 + cpu.stkp);
	cpu.SetFlag(cpu.FLAGS6502.U, 1);
	return 0;
}

// Instruction: Rotate one bit left
// Function: A = (M << 1)  & 0xFF if addressing mode === IMP 
const ROL = (cpu:Processor6502) => {
    cpu.fetch();
	const temp = ((cpu.fetched << 1) % BITS16) | cpu.GetFlag(cpu.FLAGS6502.C);
	cpu.SetFlag(cpu.FLAGS6502.C, temp & 0xFF00);
	cpu.SetFlag(cpu.FLAGS6502.Z, (temp & 0x00FF) == 0x0000 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, temp & 0x0080);
	if (cpu.instruction_lookup[cpu.opcode][ADDRESSING_MODE] == "IMP")
	{
		cpu.a = temp & 0x00FF;
	}
	else{
		cpu.write(cpu.addr_abs, temp & 0x00FF);
	}
	return 0;
}

// Instruction: Rotate one bit right
// Function: A = (M << 1)  & 0xFF if addressing mode === IMP 
const ROR = (cpu:Processor6502) => {
    cpu.fetch();
	const temp = ((cpu.GetFlag(cpu.FLAGS6502.C) % BITS16) << 7) | (cpu.fetched >> 1);
	cpu.SetFlag(cpu.FLAGS6502.C, cpu.fetched & 0x01);
	cpu.SetFlag(cpu.FLAGS6502.Z, (temp & 0x00FF) == 0x00 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, temp & 0x0080);
	if (cpu.instruction_lookup[cpu.opcode][ADDRESSING_MODE] == "IMP")
	{
		cpu.a = temp & 0x00FF;
	}
	else {
		cpu.write(cpu.addr_abs, temp & 0x00FF);
	}
	return 0;
}

// Instruction: Return from interrupt
const RTI = (cpu:Processor6502) => {
    cpu.stkp++;
	cpu.status = cpu.read(0x0100 + cpu.stkp);
	cpu.status &= ~cpu.FLAGS6502.B;
	cpu.status &= ~cpu.FLAGS6502.U;

	cpu.stkp++;
	cpu.pc = cpu.read(0x0100 + cpu.stkp) % BITS16;
	cpu.stkp++;
	cpu.pc |= cpu.read(0x0100 + cpu.stkp) << 8;
	return 0;
}

// Instruction: return from subroutine
const RTS = (cpu:Processor6502) => {
    cpu.stkp++;
	cpu.pc = cpu.read(0x0100 + cpu.stkp) % BITS16;
	cpu.stkp++;
	cpu.pc |= (cpu.read(0x0100 + cpu.stkp) % BITS16) << 8;
	
	cpu.pc++;
	return 0;
}

// Instruction: Subtraction with Borrow In
// Function:    A = A - M - (1 - C)
// Flags Out:   C, V, N, Z
// Similar to subtraction, but need to invert the bits in some of the operations
const SBC = (cpu:Processor6502) => {
    cpu.fetch();
	
	// Operating in 16-bit domain to capture carry out
	
	// We can invert the bottom 8 bits with bitwise xor
	const value = ((cpu.fetched % BITS16) ^ 0x00FF) % BITS16;
	
	// Notice this is exactly the same as addition from here!
	const temp = ((cpu.a % BITS16) + value + (cpu.GetFlag(cpu.FLAGS6502.C) % BITS16)) % BITS16;
	cpu.SetFlag(cpu.FLAGS6502.C, temp & 0xFF00);
	cpu.SetFlag(cpu.FLAGS6502.Z, ((temp & 0x00FF) === 0) ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.V, (temp ^ (cpu.a % BITS16)) & (temp ^ value) & 0x0080);
	cpu.SetFlag(cpu.FLAGS6502.N, temp & 0x0080);
	cpu.a = temp & 0x00FF;
	return 1;
}

// Instruction: Set Carry Flag
// Function:    C = 1
const SEC = (cpu:Processor6502) => {
    cpu.SetFlag(cpu.FLAGS6502.C, 1);
	return 0;
}

// Instruction: Set Decimal Flag
// Function:    D = 1
const SED = (cpu:Processor6502) => {
    cpu.SetFlag(cpu.FLAGS6502.D, 1);
	return 0;
}

// Instruction: Set Interrupt Flag / Enable Interrupts
// Function:    I = 1
const SEI = (cpu:Processor6502) => {
    cpu.SetFlag(cpu.FLAGS6502.I, 1);
	return 0;
}

// Instruction: Store Accumulator at Address
// Function:    M = A
const STA = (cpu:Processor6502) => {
    cpu.write(cpu.addr_abs, cpu.a);
	return 0;
}

// Instruction: Store X Register at Address
// Function:    M = X
const STX = (cpu:Processor6502) => {
    cpu.write(cpu.addr_abs, cpu.x);
	return 0;
}

// Instruction: Store Y Register at Address
// Function:    M = Y
const STY = (cpu:Processor6502) => {
    cpu.write(cpu.addr_abs, cpu.y);
	return 0;
}

// Instruction: Transfer Accumulator to X Register
// Function:    X = A
// Flags Out:   N, Z
const TAX = (cpu:Processor6502) => {
	cpu.x = cpu.a;
	cpu.SetFlag(cpu.FLAGS6502.Z, cpu.x == 0x00 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, cpu.x & 0x80);
	return 0;
}

// Instruction: Transfer Accumulator to Y Register
// Function:    Y = A
// Flags Out:   N, Z
const TAY = (cpu:Processor6502) => {
    cpu.y = cpu.a;
	cpu.SetFlag(cpu.FLAGS6502.Z, cpu.y == 0x00 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, cpu.y & 0x80);
	return 0;
}

// Instruction: Transfer Stack Pointer to X Register
// Function:    X = stack pointer
// Flags Out:   N, Z
const TSX = (cpu:Processor6502) => {
    cpu.x = cpu.stkp;
	cpu.SetFlag(cpu.FLAGS6502.Z, cpu.x == 0x00 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, cpu.x & 0x80);
	return 0;
}

// Instruction: Transfer X Register to Accumulator
// Function:    A = X
// Flags Out:   N, Z
const TXA = (cpu:Processor6502) => {
	cpu.a = cpu.x;
	cpu.SetFlag(cpu.FLAGS6502.Z, cpu.a == 0x00 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, cpu.a & 0x80);
	return 0;
}

// Instruction: Transfer X Register to Stack Pointer
// Function:    stack pointer = X
const TXS = (cpu:Processor6502) => {
    cpu.stkp = cpu.x;
	return 0;
}

// Instruction: Transfer Y Register to Accumulator
// Function:    A = Y
// Flags Out:   N, Z
const TYA = (cpu:Processor6502) => {
    cpu.a = cpu.y;
	cpu.SetFlag(cpu.FLAGS6502.Z, cpu.a == 0x00 ? 1 : 0);
	cpu.SetFlag(cpu.FLAGS6502.N, cpu.a & 0x80);
	return 0;
}

// This function captures illegal opcodes
const XXX = (cpu:Processor6502) => { // handle illegal opcodes
	return 0;
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