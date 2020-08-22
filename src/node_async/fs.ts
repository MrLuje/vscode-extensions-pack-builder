import { promisify } from "util";
import * as fs from "fs";

const copyFile = promisify(fs.copyFile);
const exists = promisify(fs.exists);
const lstat = promisify(fs.lstat);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
const writeFile = promisify(fs.writeFile);

const prfs = { stat, mkdir, readFile, readdir, exists, copyFile, writeFile, lstat };
export { prfs };
