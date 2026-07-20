import { copyFile, mkdir, readdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const source = new URL("../src/stdlib/", import.meta.url);
const destination = new URL("../dist/stdlib/", import.meta.url);
await mkdir(destination, { recursive: true });
for (const entry of await readdir(source)) if (entry.endsWith(".taml")) await copyFile(new URL(entry, source), new URL(entry, destination));
