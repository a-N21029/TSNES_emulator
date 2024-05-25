"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
const ppu_1 = require("./ppu");
function testPpuVramWrites() {
    const ppu = new ppu_1.PPU(Array(2048).fill(0), util_1.Mirroring.HORIZONTAL);
    ppu.write_to_ppu_addr(0x23);
    ppu.write_to_ppu_addr(0x05);
    ppu.write_data(0x66);
    console.log(ppu.vram[0x0305] === 0x66 ? 'PASS' : 'FAIL');
}
function testPpuVramReads() {
    const ppu = new ppu_1.PPU(Array(2048).fill(0), util_1.Mirroring.HORIZONTAL);
    ppu.write_to_ppu_ctrl(0);
    ppu.vram[0x0305] = 0x66;
    ppu.write_to_ppu_addr(0x23);
    ppu.write_to_ppu_addr(0x05);
    ppu.read_data(); // load_into_buffer
    console.log(ppu.addr_register.get() === 0x2306 ? 'PASS' : 'FAIL');
    console.log(ppu.read_data() === 0x66 ? 'PASS' : 'FAIL');
}
function testPpuVramReadsCrossPage() {
    const ppu = new ppu_1.PPU(Array(2048).fill(0), util_1.Mirroring.HORIZONTAL);
    ppu.write_to_ppu_ctrl(0);
    ppu.vram[0x01ff] = 0x66;
    ppu.vram[0x0200] = 0x77;
    ppu.write_to_ppu_addr(0x21);
    ppu.write_to_ppu_addr(0xff);
    ppu.read_data(); // load_into_buffer
    console.log(ppu.read_data() === 0x66 ? 'PASS' : 'FAIL');
    console.log(ppu.read_data() === 0x77 ? 'PASS' : 'FAIL');
}
function testPpuVramReadsStep32() {
    const ppu = new ppu_1.PPU(Array(2048).fill(0), util_1.Mirroring.HORIZONTAL);
    ppu.write_to_ppu_ctrl(0b100);
    ppu.vram[0x01ff] = 0x66;
    ppu.vram[0x01ff + 32] = 0x77;
    ppu.vram[0x01ff + 64] = 0x88;
    ppu.write_to_ppu_addr(0x21);
    ppu.write_to_ppu_addr(0xff);
    ppu.read_data(); // load_into_buffer
    console.log(ppu.read_data() === 0x66 ? 'PASS' : 'FAIL');
    console.log((ppu.read_data()) === 0x77 ? 'PASS' : 'FAIL');
    console.log(ppu.read_data() === 0x88 ? 'PASS' : 'FAIL');
}
function testVramHorizontalMirror() {
    const ppu = new ppu_1.PPU(Array(2048).fill(0), util_1.Mirroring.HORIZONTAL);
    ppu.write_to_ppu_addr(0x24);
    ppu.write_to_ppu_addr(0x05);
    ppu.write_data(0x66); // write to a
    ppu.write_to_ppu_addr(0x28);
    ppu.write_to_ppu_addr(0x05);
    ppu.write_data(0x77); // write to B
    ppu.write_to_ppu_addr(0x20);
    ppu.write_to_ppu_addr(0x05);
    ppu.read_data(); // load into buffer
    console.log(ppu.read_data() === 0x66 ? 'PASS' : 'FAIL'); // read from A
    ppu.write_to_ppu_addr(0x2C);
    ppu.write_to_ppu_addr(0x05);
    ppu.read_data(); // load into buffer
    console.log(ppu.read_data() === 0x77 ? 'PASS' : 'FAIL'); // read from b
}
function testVramVerticalMirror() {
    const ppu = new ppu_1.PPU(new Array(2048).fill(0), util_1.Mirroring.VERTICAL);
    ppu.write_to_ppu_addr(0x20);
    ppu.write_to_ppu_addr(0x05);
    ppu.write_data(0x66); // write to A
    ppu.write_to_ppu_addr(0x2C);
    ppu.write_to_ppu_addr(0x05);
    ppu.write_data(0x77); // write to b
    ppu.write_to_ppu_addr(0x28);
    ppu.write_to_ppu_addr(0x05);
    ppu.read_data(); // load into buffer
    console.log(ppu.read_data() === 0x66 ? 'PASS' : 'FAIL'); // read from a
    ppu.write_to_ppu_addr(0x24);
    ppu.write_to_ppu_addr(0x05);
    ppu.read_data(); // load into buffer
    console.log(ppu.read_data() === 0x77 ? 'PASS' : 'FAIL'); // read from B
}
function testread_statusResetsLatch() {
    const ppu = new ppu_1.PPU(Array(2048).fill(0), util_1.Mirroring.HORIZONTAL);
    ppu.vram[0x0305] = 0x66;
    ppu.write_to_ppu_addr(0x21);
    ppu.write_to_ppu_addr(0x23);
    ppu.write_to_ppu_addr(0x05);
    ppu.read_data(); // load_into_buffer
    console.log(ppu.read_data() !== 0x66 ? 'PASS' : 'FAIL');
    ppu.read_status();
    ppu.write_to_ppu_addr(0x23);
    ppu.write_to_ppu_addr(0x05);
    ppu.read_data(); // load_into_buffer
    console.log(ppu.read_data() === 0x66 ? 'PASS' : 'FAIL');
}
function testPpuVramMirroring() {
    const ppu = new ppu_1.PPU(Array(2048).fill(0), util_1.Mirroring.HORIZONTAL);
    ppu.write_to_ppu_ctrl(0);
    ppu.vram[0x0305] = 0x66;
    ppu.write_to_ppu_addr(0x63); // 0x6305 as uint8 -> 0x2305 as uint8
    ppu.write_to_ppu_addr(0x05);
    ppu.read_data(); // load into_buffer
    console.log(ppu.read_data() === 0x66 ? 'PASS' : 'FAIL');
}
function testread_statusResetsVblank() {
    const ppu = new ppu_1.PPU(Array(2048).fill(0), util_1.Mirroring.HORIZONTAL);
    ppu.status_register.set_vblank_status(true);
    const status = ppu.read_status();
    console.log((status >> 7) === 1 ? 'PASS' : 'FAIL');
    console.log((ppu.status_register.snapshot() >> 7) === 0 ? 'PASS' : 'FAIL');
}
function testOamReadWrite() {
    const ppu = new ppu_1.PPU(Array(2048).fill(0), util_1.Mirroring.HORIZONTAL);
    ppu.write_to_oam_addr(0x10);
    ppu.write_to_oam_data(0x66);
    ppu.write_to_oam_data(0x77);
    ppu.write_to_oam_addr(0x10);
    console.log(ppu.read_oam_data() === 0x66 ? 'PASS' : 'FAIL');
    ppu.write_to_oam_addr(0x11);
    console.log(ppu.read_oam_data() === 0x77 ? 'PASS' : 'FAIL');
}
function testOamDma() {
    const ppu = new ppu_1.PPU(Array(2048).fill(0), util_1.Mirroring.HORIZONTAL);
    const data = new Array(256).fill(0x66);
    data[0] = 0x77;
    data[255] = 0x88;
    ppu.write_to_oam_addr(0x10);
    ppu.write_oam_dma(data);
    ppu.write_to_oam_addr(0xf); // wrap around
    console.log(ppu.read_oam_data() === 0x88 ? 'PASS' : 'FAIL');
    ppu.write_to_oam_addr(0x10);
    console.log(ppu.read_oam_data() === 0x77 ? 'PASS' : 'FAIL');
    ppu.write_to_oam_addr(0x11);
    console.log(ppu.read_oam_data() === 0x66 ? 'PASS' : 'FAIL');
}
// Execute test functions
testPpuVramWrites();
testPpuVramReads();
testPpuVramReadsCrossPage();
testPpuVramReadsStep32();
testVramHorizontalMirror();
testVramVerticalMirror();
testread_statusResetsLatch();
testPpuVramMirroring();
testread_statusResetsVblank();
testOamReadWrite();
testOamDma();
