export type uint3 = number & { __uint3__: void };
export type uint8 = number & { __uint8__: void };
export type uint16 = (number & { __uint16__: void });
export type int8 = number & { __int8__: void };

export type program = uint8[]; // a program is just a long string of bytes

export function touint8(num: number): uint8 {
    return (num & 0xFF) as uint8;
}

export function touint16(num: number): uint16 {
    return (num & 0xFFFF) as uint16;
}

export function toint8(num: number): int8 {
    const uint: number = (num & 0xFF) as uint8;
    const int: int8 = uint > 127 ? (uint - 256) as int8 : uint as int8;
    return int;
}

export function uint8_OR(a:uint8, b:number): uint8 {
    var a_number = a as number;
    a_number |= b;
    return a_number as uint8;
}

export function uint8_XOR(a:uint8, b:number): uint8 {
    var a_number = a as number;
    a_number ^= b;
    return a_number as uint8;
}

export function uint8_AND(a:uint8, b:number): uint8 {
    var a_number = a as number;
    a_number &= b;
    return a_number as uint8;
}

export function uint8_EQ(a:uint8, b:number): boolean {
    var a_number = a as number;
    a_number &= b;
    return a_number == b;
}

export function uint8_ADD(a:uint8, b:number): uint8 {
    var a_number = a as number;
    a_number += b;
    if (a_number > 255){ // wrap around if overflow
        a_number -= 256;
    }
    else if (a_number < 0) {
        a_number +=  256;
    }
    return a_number as uint8;
}

export function uint16_ADD(a:uint16, b:number): uint16 {
    var a_number = a as number;
    a_number += b;
    if (a_number > 2**16 - 1){ // wrap around if overflow
        a_number -= 2**16;
    }
    else if (a_number < 0) {
        a_number += 2**16;
    }
    return a_number as uint16;
}

export function uint16_AND(a:uint16, b:number): uint16 {
    var a_number = a as number;
    a_number &= b;
    return a_number as uint16;
}