"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareArrays = exports.memcpy = exports.Mirroring = void 0;
var Mirroring;
(function (Mirroring) {
    Mirroring[Mirroring["VERTICAL"] = 0] = "VERTICAL";
    Mirroring[Mirroring["HORIZONTAL"] = 1] = "HORIZONTAL";
    Mirroring[Mirroring["FOUR_SCREEN"] = 2] = "FOUR_SCREEN";
})(Mirroring || (exports.Mirroring = Mirroring = {}));
function memcpy(destination, destOffset, source, srcOffset, length, concat) {
    for (let i = 0; i < length; i++) {
        if (srcOffset + i < source.length && destOffset + i < destination.length) {
            concat ? destination.concat(source[srcOffset + i]) : destination[destOffset + i] = source[srcOffset + i];
        }
        else {
            break; // Exit loop if either source or destination array bounds are exceeded
        }
    }
}
exports.memcpy = memcpy;
// // load the bytes of a file into an array
// export function ines_to_array(file: string): Promise<program> {
//     return new Promise<program>((resolve, reject) => {
//         readFile(file, (err, data) => {
//             if(err) {
//                 console.error('Error reading file:', err);
//                 reject(err);
//                 return;
//                 // return [] as program;
//             }
//             // console.log(Array.from(data))
//             // memcpy(arr, 0, Array.from(data) as uint8[], data.length, 0, false);
//             resolve(Array.from(data) as program);
//         });
//     });
// }
const compareArrays = (a, b) => a.length === b.length && a.every((element, index) => element === b[index]);
exports.compareArrays = compareArrays;
