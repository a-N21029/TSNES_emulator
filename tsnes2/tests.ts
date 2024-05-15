import { CPU } from "./cpu";
import { program, uint8, uint8_AND, uint8_OR } from "./types";


function test_0xa9_lda_immediate_load_data(){
    const cpu = new CPU();
    console.log("=====test_0xa9_lda_immediate_load_data=====");
    var prog:program = [0xA9 as uint8, 0x05 as uint8, 0x00 as uint8]
    cpu.run(prog);
    if((cpu.get_accumulator() == 0x05) &&
        (uint8_AND(cpu.get_status(), 0b0000_0010) == 0b00) &&
        (uint8_AND(cpu.get_status(), 0b1000_0000) == 0)) {
        console.log('pass');
    }
    else {
        console.log('fail');
    }
}

function test_0xa9_lda_zero_flag() {
    const cpu = new CPU();
    console.log("=====test_0xa9_lda_zero_flag=====");
    var prog:program = [0xA9 as uint8, 0x00 as uint8, 0x00 as uint8]
    cpu.run(prog);
    if(uint8_AND(cpu.get_status(), 0b0000_0010) == 0b10) {
        console.log('pass');
    }
    else {
        console.log('fail');
    }
}

function test_0xaa_tax_move_a_to_x() {
    const cpu = new CPU();
    console.log("=====test_0xaa_tax_move_a_to_x=====");
    var prog:program = [0xA9 as uint8, 0x0A as uint8, 0xAA as uint8, 0x00 as uint8]
    cpu.run(prog);
    if(cpu.get_X() == 10) {
        console.log('pass');
    }
    else {
        console.log('fail');
    }
}

function test_5_ops_working_together() {
    const cpu = new CPU();
    console.log("=====test_5_ops_working_together=====");
    var prog:program = [0xA9 as uint8, 0xC0 as uint8, 0xAA as uint8, 0xE8 as uint8, 0x00 as uint8];
    cpu.run(prog);
    if(cpu.get_X() == 0xC1) {
        console.log('pass');
    }
    else {
        console.log('fail');
    }
}

function test_inx_overflow() {
    const cpu = new CPU();
    console.log("=====test_inx_overflow=====");
    var prog:program = [0xA9 as uint8, 0xFF as uint8, 0xAA as uint8, 0xE8 as uint8, 0xE8 as uint8, 0x00 as uint8];
    cpu.run(prog);
    if(cpu.get_X() == 0x01) {
        console.log('pass');
    }
    else {
        console.log('fail');
    }
}

test_0xa9_lda_immediate_load_data();
test_0xa9_lda_zero_flag();
test_0xaa_tax_move_a_to_x();
test_5_ops_working_together();
test_inx_overflow();