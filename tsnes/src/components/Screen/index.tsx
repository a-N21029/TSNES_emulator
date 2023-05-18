import React from "react";
import "./a_modes"
import "./opcodes"
import "./utils"
import { ADDRESSING_MODE } from "./opcodes";

const Processor6502 = () => {

    // 6502 processor registers. All are 8-bit registers except for the program counter, which is 16
    let a:number      = 0x00;		// Accumulator Register
	let x:number      = 0x00;		// X Register
	let y:number      = 0x00;		// Y Register
	let stkp:number   = 0x00;		// Stack Pointer (points to location on bus)
	let pc:number     = 0x0000;	    // Program Counter
	let status:number = 0x00;		// Status Register

    enum FLAGS6502
	{
		C = (1 << 0),	// Carry Bit
		Z = (1 << 1),	// Zero
		I = (1 << 2),	// Disable Interrupts
		D = (1 << 3),	// Decimal Mode (unused in this implementation, since NES did not really make use of this flag)
		B = (1 << 4),	// Break
		U = (1 << 5),	// Unused
		V = (1 << 6),	// Overflow
		N = (1 << 7),	// Negative
	};


    const addr_abs = 0x0000; // All used memory addresses end up in here
	const addr_rel = 0x00;   // Represents absolute address following a branch
	const  opcode  = 0x00;   // Is the instruction byte
	const  cycles  = 0;	     // Counts how many cycles the current instruction has remaining


    return <></>
}

export default Processor6502