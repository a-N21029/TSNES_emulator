// Addressing modes. Will return 1 if an additional clock cycle is required, and 0 no additional ones are needed to execute an instruction

import {Processor6502} from "./utils";
// import Bus from "./utils";

const BITS16 = 2**16 - 1

// Address Mode: Implied
// There is no additional data required for this instruction. The instruction
// does something very simple like like sets a status bit. However, the accumulator register
// might still be needed for instructions like PHA
export const IMP = (cpu:Processor6502) => {
    cpu.fetched = cpu.a;
	return 0; // no additional cycles needed
}

// Address Mode: Immediate
// The instruction expects the next byte to be used as a value, so we'll prep
// the read address to point to the next byte
export const IMM = (cpu:Processor6502) => {
    cpu.addr_abs = cpu.pc++;
	return 0;
}	

// Address Mode: Zero Page
// To save program bytes, zero page addressing allows you to absolutely address
// a location in first 0xFF bytes of address range. This only requires
// one byte instead of the usual two.
export const ZP0 = (cpu:Processor6502) => {
    cpu.addr_abs = cpu.read(cpu.pc);	
	cpu.pc++;
	cpu.addr_abs &= 0x00FF;
	return 0;
    
}

// Address Mode: Zero Page with X Offset
// Fundamentally the same as Zero Page addressing, but the contents of the X Register
// is added to the supplied single byte address. This is useful for iterating through
// ranges within the first page.
export const ZPX = (cpu:Processor6502) => {
	cpu.addr_abs = (cpu.read(cpu.pc) + cpu.x);
	cpu.pc++;
	cpu.addr_abs &= 0x00FF;
	return 0; 
}	

// Address Mode: Zero Page with X Offset
// Fundamentally the same as Zero Page addressing, but the contents of the X Register
// is added to the supplied single byte address. This is useful for iterating through
// ranges within the first page.
export const ZPY = (cpu:Processor6502) => {
	cpu.addr_abs = (cpu.read(cpu.pc) + cpu.y);
	cpu.pc++;
	cpu.addr_abs &= 0x00FF;
	return 0;  
}

// Address Mode: Relative
// This address mode is exclusive to branch instructions. The address
// must reside within -128 to +127 of the branch instruction, i.e.
// you cant directly branch to ANY address in the addressable range.
export const REL = (cpu:Processor6502) => {
    cpu.addr_rel = cpu.read(cpu.pc);
	cpu.pc++;
	if (cpu.addr_rel & 0x80)
	{
		cpu.addr_rel |= 0xFF00;
	}
	return 0;
}

// Address Mode: Absolute 
// A full 16-bit address is loaded and used
export const ABS = (cpu:Processor6502) => {
	const low = cpu.read(cpu.pc);
	cpu.pc++;
	const high = cpu.read(cpu.pc);
	cpu.pc++;

	cpu.addr_abs = (high << 8) | low;

	return 0; 
}

// Address Mode: Absolute with X Offset
// Fundamentally the same as absolute addressing, but the contents of the X Register
// is added to the supplied two byte address. If the resulting address changes
// the page, an additional clock cycle is required
export const ABX = (cpu:Processor6502) => {
	const low = cpu.read(cpu.pc);
	cpu.pc++;
	const high = cpu.read(cpu.pc);
	cpu.pc++;

	cpu.addr_abs = (high << 8) | low;
	cpu.addr_abs += cpu.x;

	if ((cpu.addr_abs & 0xFF00) != (high << 8))
		return 1;
	else
		return 0;
}

// Same as ABX, but the y register is used instead
export const ABY = (cpu:Processor6502) => {
	const low = cpu.read(cpu.pc);
	cpu.pc++;
	const high = cpu.read(cpu.pc);
	cpu.pc++;

	cpu.addr_abs = (high << 8) | low;
	cpu.addr_abs += cpu.y;

	if ((cpu.addr_abs & 0xFF00) != (high << 8))
		return 1;
	else
		return 0; 
}

// Address Mode: Indirect
// The supplied 16-bit address is read to get the actual 16-bit address. This is
// instruction is unusual in that it has a bug in the hardware! To emulate its
// function accurately, we also need to emulate this bug. If the low byte of the
// supplied address is 0xFF, then to read the high byte of the actual address
// we need to cross a page boundary. This doesnt actually work on the chip as 
// designed, instead it wraps back around in the same page, yielding an 
// invalid actual address
export const IND = (cpu:Processor6502) => {
	const low = cpu.read(cpu.pc);
	cpu.pc++;
	const high = cpu.read(cpu.pc);
	cpu.pc++;

	const ptr = (high << 8) | low;

	if (high == 0x00FF) // Simulate page boundary hardware bug
	{
		cpu.addr_abs = (cpu.read(ptr & 0xFF00) << 8) | cpu.read(ptr + 0);
	}
	else // Behave normally
	{
		cpu.addr_abs = (cpu.read(ptr + 1) << 8) | cpu.read(ptr + 0);
	}
	
	return 0;
    
}

// Address Mode: Indirect X
// The supplied 8-bit address is offset by X Register to index
// a location in page 0x00. The actual 16-bit address is read 
// from this location
export const IZX = (cpu:Processor6502) => {
	const t = cpu.read(cpu.pc);
	cpu.pc++;

	const low = cpu.read(((t + (cpu.x % BITS16)) % (BITS16)) & 0x00FF); // represent low and high as 16-bit numbers
	const high = cpu.read(((t + (cpu.x % BITS16) + 1) % (BITS16)) & 0x00FF);

	cpu.addr_abs = (high << 8) | low;
	
	return 0;
    
}

// Address Mode: Indirect Y, behaves slightly different from its X counterpart, IZX
// The supplied 8-bit address indexes a location in page 0x00. From 
// here the actual 16-bit address is read, and the contents of
// Y Register is added to it to offset it. If the offset causes a
// change in page then an additional clock cycle is required.
export const IZY = (cpu:Processor6502) => {
    
	const t = cpu.read(cpu.pc);
	cpu.pc++;

	const low = cpu.read(t & 0x00FF); // represent low and high as 16-bit numbers
	const high = cpu.read((t + 1) & 0x00FF);

	cpu.addr_abs = (high << 8) | low;
	cpu.addr_abs += cpu.y;
	
	if ((cpu.addr_abs & 0xFF00) != (high << 8))
		return 1;
	else
		return 0;
}


