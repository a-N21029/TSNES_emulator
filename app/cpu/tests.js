"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cpu_1 = require("./cpu");
const types_1 = require("../types");
const bus_1 = require("../bus/bus");
const nes_small_testfile_1 = require("../nes_small_testfile");
function test_0xa9_lda_immediate_load_data() {
    const bus = new bus_1.Bus(nes_small_testfile_1.game);
    const cpu = new cpu_1.CPU(bus);
    console.log("=====test_0xa9_lda_immediate_load_data=====");
    var prog = [0xA9, 0x05, 0x00];
    cpu.run(prog);
    if ((cpu.get_accumulator() == 0x05) &&
        ((0, types_1.uint8_AND)(cpu.get_status(), 2) == 0b00) &&
        ((0, types_1.uint8_AND)(cpu.get_status(), 128) == 0)) {
        console.log('pass');
    }
    else {
        console.log('fail');
    }
}
function test_0xa9_lda_zero_flag() {
    const bus = new bus_1.Bus(nes_small_testfile_1.game);
    const cpu = new cpu_1.CPU(bus);
    console.log("=====test_0xa9_lda_zero_flag=====");
    var prog = [0xA9, 0x00, 0x00];
    cpu.run(prog);
    if ((0, types_1.uint8_AND)(cpu.get_status(), 2) == 0b10) {
        console.log('pass');
    }
    else {
        console.log('fail');
    }
}
function test_0xaa_tax_move_a_to_x() {
    const bus = new bus_1.Bus(nes_small_testfile_1.game);
    const cpu = new cpu_1.CPU(bus);
    console.log("=====test_0xaa_tax_move_a_to_x=====");
    var prog = [0xA9, 0x0A, 0xAA, 0x00];
    cpu.run(prog);
    if (cpu.get_X() == 10) {
        console.log('pass');
    }
    else {
        console.log('fail');
    }
}
function test_5_ops_working_together() {
    const bus = new bus_1.Bus(nes_small_testfile_1.game);
    const cpu = new cpu_1.CPU(bus);
    console.log("=====test_5_ops_working_together=====");
    var prog = [0xA9, 0xC0, 0xAA, 0xE8, 0x00];
    cpu.run(prog);
    if (cpu.get_X() == 0xC1) {
        console.log('pass');
    }
    else {
        console.log('fail');
    }
}
function test_inx_overflow() {
    const bus = new bus_1.Bus(nes_small_testfile_1.game);
    const cpu = new cpu_1.CPU(bus);
    console.log("=====test_inx_overflow=====");
    var prog = [0xA9, 0xFF, 0xAA, 0xE8, 0xE8, 0x00];
    cpu.run(prog);
    if (cpu.get_X() == 0x01) {
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
