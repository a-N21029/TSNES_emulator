"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uint16_AND = exports.uint16_ADD = exports.uint8_ADD = exports.uint8_EQ = exports.uint8_AND = exports.uint8_XOR = exports.uint8_OR = exports.toint8 = exports.touint16 = exports.touint8 = void 0;
function touint8(num) {
    return (num & 0xFF);
}
exports.touint8 = touint8;
function touint16(num) {
    return (num & 0xFFFF);
}
exports.touint16 = touint16;
function toint8(num) {
    const uint = (num & 0xFF);
    const int = uint > 127 ? (uint - 256) : uint;
    return int;
}
exports.toint8 = toint8;
function uint8_OR(a, b) {
    var a_number = a;
    a_number |= b;
    return a_number;
}
exports.uint8_OR = uint8_OR;
function uint8_XOR(a, b) {
    var a_number = a;
    a_number ^= b;
    return a_number;
}
exports.uint8_XOR = uint8_XOR;
function uint8_AND(a, b) {
    var a_number = a;
    a_number &= b;
    return a_number;
}
exports.uint8_AND = uint8_AND;
function uint8_EQ(a, b) {
    var a_number = a;
    a_number &= b;
    return a_number == b;
}
exports.uint8_EQ = uint8_EQ;
function uint8_ADD(a, b) {
    var a_number = a;
    a_number += b;
    if (a_number > 255) { // wrap around if overflow
        a_number -= 256;
    }
    else if (a_number < 0) {
        a_number += 256;
    }
    return a_number;
}
exports.uint8_ADD = uint8_ADD;
function uint16_ADD(a, b) {
    var a_number = a;
    a_number += b;
    if (a_number > 2 ** 16 - 1) { // wrap around if overflow
        a_number -= 2 ** 16;
    }
    else if (a_number < 0) {
        a_number += 2 ** 16;
    }
    return a_number;
}
exports.uint16_ADD = uint16_ADD;
function uint16_AND(a, b) {
    var a_number = a;
    a_number &= b;
    return a_number;
}
exports.uint16_AND = uint16_AND;
