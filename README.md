# TSNES

This project is one I made for fun in my spare time. Emulation of CPU, PPU, data Bus, and rendering are all complete, but the main game loop still needs to more work, mainly throttling to 60FPS in order to make the emulator playable on browsers.

## Important mention:
This project would not have been possible without the help of the NES dev community (https://www.nesdev.org/wiki/Nesdev_Wiki). There are many remarkable people in the community who have reverse-engineered the NES console and documented the behaviours of the hardware, which made this emulation possible.

### TODO: Important features to implement

1. APU/sound emulation
2. Mapper support

### TODO: Nice to have features
1. Using web workers(or any viable alternatives) to multithread application for each hardware component, further optimizing the emulator (the NES was a distributed system after all)

Until then, here are some screenshots of the extracted sprite data from the Pacman CHR ROM (with a funky color palette):

![image](https://github.com/a-N21029/TSNES_emulator/assets/92868415/a5485dfc-9bac-403c-943f-bd653f3f3049)
![image](https://github.com/a-N21029/TSNES_emulator/assets/92868415/facaf700-2704-4af4-91b7-af261a1c6147)

Stay tuned...
