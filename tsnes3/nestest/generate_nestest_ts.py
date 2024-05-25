filedata = []
with open("./nestest.nes", "rb") as file:
    filedata = file.read()


with open("nestest.ts", "w") as nestest:
    nestest_ts = [f"0x{byte}" for byte in filedata]
    nestest.write("""import { program } from "./types";""")
    nestest.write("export const nestest: program = [")
    nestest.write(str(filedata[0]))
    for i in range(1, len(filedata)):
        nestest.write("," + str(filedata[i]))
    nestest.write("] as program;")
