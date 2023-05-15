import React from "react";
import Processor6502 from "../6502Processor/utils";

const Bus = () => {

    // read and write functions for the bus
    const read = (addr:number) => {
        if (0x0000 <= addr && addr <= 0xFFFF){
            return ram[addr]; // only read the contents if they are within address range
        }
    }

    const write = (addr:number, data:number) => {
        ram[addr] = data
    }

    // devices on the bus
    const ram = new Uint8Array(64*1024); // 64kb RAM connected to bus
    const x = new Processor6502();
    return <>{console.log(x.FLAGS6502)}</>
}

export default Bus