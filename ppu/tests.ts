import { uint16, uint8 } from "../types";
import { Mirroring } from "../util";
import { PPU } from "./ppu";

function    testPpuVramWrites() {
    const ppu = new PPU(Array(2048).fill(0), Mirroring.HORIZONTAL);
    ppu.write_to_ppu_addr(0x23 as uint8);
    ppu.write_to_ppu_addr(0x05 as uint8);
    ppu.write_data(0x66 as uint8);

    console.log(ppu.vram[0x0305] === 0x66 ? 'PASS' : 'FAIL');
}

function testPpuVramReads() {
    const ppu = new PPU(Array(2048).fill(0), Mirroring.HORIZONTAL);
    ppu.write_to_ppu_ctrl(0 as uint8);
    ppu.vram[0x0305 as uint8] = 0x66 as uint8;

    ppu.write_to_ppu_addr(0x23 as uint8);
    ppu.write_to_ppu_addr(0x05 as uint8);

    ppu.read_data(); // load_into_buffer
    console.log(ppu.addr_register.get() === 0x2306? 'PASS' : 'FAIL');
    console.log(ppu.read_data() === 0x66 as uint8 ? 'PASS' : 'FAIL');
}

function testPpuVramReadsCrossPage() {
    const ppu = new PPU(Array(2048).fill(0), Mirroring.HORIZONTAL);
    ppu.write_to_ppu_ctrl(0 as uint8);
    ppu.vram[0x01ff as uint8] = 0x66 as uint8;
    ppu.vram[0x0200 as uint8] = 0x77 as uint8;

    ppu.write_to_ppu_addr(0x21 as uint8);
    ppu.write_to_ppu_addr(0xff as uint8);

    ppu.read_data(); // load_into_buffer
    console.log(ppu.read_data() === 0x66 as uint8 ? 'PASS' : 'FAIL');
    console.log(ppu.read_data() === 0x77 as uint8 ? 'PASS' : 'FAIL');
}

function testPpuVramReadsStep32() {
    const ppu = new PPU(Array(2048).fill(0), Mirroring.HORIZONTAL);
    ppu.write_to_ppu_ctrl(0b100 as uint8);
    ppu.vram[0x01ff] = 0x66 as uint8;
    ppu.vram[0x01ff + 32] = 0x77 as uint8;
    ppu.vram[0x01ff + 64] = 0x88 as uint8;

    ppu.write_to_ppu_addr(0x21 as uint8);
    ppu.write_to_ppu_addr(0xff as uint8);

    ppu.read_data(); // load_into_buffer
    console.log(ppu.read_data() === 0x66 as uint8 ? 'PASS' : 'FAIL');
    console.log((ppu.read_data()) === 0x77 as uint8 ? 'PASS' : 'FAIL');
    console.log(ppu.read_data() === 0x88 as uint8 ? 'PASS' : 'FAIL');
}

function testVramHorizontalMirror() {
    const ppu = new PPU(Array(2048).fill(0), Mirroring.HORIZONTAL);
    ppu.write_to_ppu_addr(0x24 as uint8);
    ppu.write_to_ppu_addr(0x05 as uint8);

    ppu.write_data(0x66 as uint8); // write to a

    ppu.write_to_ppu_addr(0x28 as uint8);
    ppu.write_to_ppu_addr(0x05 as uint8);

    ppu.write_data(0x77 as uint8); // write to B

    ppu.write_to_ppu_addr(0x20 as uint8);
    ppu.write_to_ppu_addr(0x05 as uint8);

    ppu.read_data(); // load into buffer
    console.log(ppu.read_data() === 0x66 as uint8 ? 'PASS' : 'FAIL'); // read from A

    ppu.write_to_ppu_addr(0x2C as uint8);
    ppu.write_to_ppu_addr(0x05 as uint8);

    ppu.read_data(); // load into buffer
    console.log(ppu.read_data() === 0x77 as uint8 ? 'PASS' : 'FAIL'); // read from b
}

function testVramVerticalMirror() {
    const ppu = new PPU(new Array(2048).fill(0), Mirroring.VERTICAL);

    ppu.write_to_ppu_addr(0x20 as uint8);
    ppu.write_to_ppu_addr(0x05 as uint8);

    ppu.write_data(0x66 as uint8); // write to A

    ppu.write_to_ppu_addr(0x2C as uint8);
    ppu.write_to_ppu_addr(0x05 as uint8);

    ppu.write_data(0x77 as uint8); // write to b

    ppu.write_to_ppu_addr(0x28 as uint8);
    ppu.write_to_ppu_addr(0x05 as uint8);

    ppu.read_data(); // load into buffer
    console.log(ppu.read_data() === 0x66 as uint8 ? 'PASS' : 'FAIL'); // read from a

    ppu.write_to_ppu_addr(0x24 as uint8);
    ppu.write_to_ppu_addr(0x05 as uint8);

    ppu.read_data(); // load into buffer
    console.log(ppu.read_data() === 0x77 as uint8 ? 'PASS' : 'FAIL'); // read from B
}

function testread_statusResetsLatch() {
    const ppu = new PPU(Array(2048).fill(0), Mirroring.HORIZONTAL);
    ppu.vram[0x0305 as uint8] = 0x66 as uint8;

    ppu.write_to_ppu_addr(0x21 as uint8);
    ppu.write_to_ppu_addr(0x23 as uint8);
    ppu.write_to_ppu_addr(0x05 as uint8);

    ppu.read_data(); // load_into_buffer
    console.log(ppu.read_data() !== 0x66 as uint8 ? 'PASS' : 'FAIL');

    ppu.read_status();

    ppu.write_to_ppu_addr(0x23 as uint8);
    ppu.write_to_ppu_addr(0x05 as uint8);

    ppu.read_data(); // load_into_buffer
    console.log(ppu.read_data() === 0x66 as uint8 ? 'PASS' : 'FAIL');
}

function testPpuVramMirroring() {
    const ppu = new PPU(Array(2048).fill(0), Mirroring.HORIZONTAL);
    ppu.write_to_ppu_ctrl(0 as uint8);
    ppu.vram[0x0305 as uint8] = 0x66 as uint8;

    ppu.write_to_ppu_addr(0x63 as uint8); // 0x6305 as uint8 -> 0x2305 as uint8
    ppu.write_to_ppu_addr(0x05 as uint8);

    ppu.read_data(); // load into_buffer
    console.log(ppu.read_data() === 0x66 as uint8 ? 'PASS' : 'FAIL');
}

function testread_statusResetsVblank() {
    const ppu = new PPU(Array(2048).fill(0), Mirroring.HORIZONTAL);
    ppu.status_register.set_vblank_status(true);

    const status = ppu.read_status();

    console.log((status >> 7) === 1 ? 'PASS' : 'FAIL');
    console.log((ppu.status_register.snapshot() >> 7) === 0 ? 'PASS' : 'FAIL');
}

function testOamReadWrite() {
    const ppu = new PPU(Array(2048).fill(0), Mirroring.HORIZONTAL);
    ppu.write_to_oam_addr(0x10 as uint8);
    ppu.write_to_oam_data(0x66 as uint8);
    ppu.write_to_oam_data(0x77 as uint8);

    ppu.write_to_oam_addr(0x10 as uint8);
    console.log(ppu.read_oam_data() === 0x66 as uint8 ? 'PASS' : 'FAIL');

    ppu.write_to_oam_addr(0x11 as uint8);
    console.log(ppu.read_oam_data() === 0x77 as uint8 ? 'PASS' : 'FAIL');
}

function testOamDma() {
    const ppu = new PPU(Array(2048).fill(0), Mirroring.HORIZONTAL);

    const data = new Array(256).fill(0x66 as uint8);
    data[0] = 0x77 as uint8;
    data[255] = 0x88 as uint8;

    ppu.write_to_oam_addr(0x10 as uint8);
    ppu.write_oam_dma(data as uint8[]);

    ppu.write_to_oam_addr(0xf as uint8); // wrap around
    console.log(ppu.read_oam_data() === 0x88 as uint8 ? 'PASS' : 'FAIL');

    ppu.write_to_oam_addr(0x10 as uint8);
    console.log(ppu.read_oam_data() === 0x77 as uint8 ? 'PASS' : 'FAIL');

    ppu.write_to_oam_addr(0x11 as uint8);
    console.log(ppu.read_oam_data() === 0x66 as uint8 ? 'PASS' : 'FAIL');
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