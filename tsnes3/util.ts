import { program, uint16, uint8 } from "./types"


export enum Mirroring {
    VERTICAL,
    HORIZONTAL,
    FOUR_SCREEN,
}

export function memcpy(destination: uint8[], destOffset: number, source: uint8[], srcOffset: number, length: number, concat: boolean): void {
    for (let i = 0; i < length; i++) {
        if (srcOffset + i < source.length && destOffset + i < destination.length) {
            concat ? destination.concat(source[srcOffset + i]): destination[destOffset + i] = source[srcOffset + i];
        } else {
            break; // Exit loop if either source or destination array bounds are exceeded
        }
    }
}


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

export const compareArrays = (a: uint8[], b: uint8[]) => a.length === b.length && a.every((element, index) => element === b[index]);



