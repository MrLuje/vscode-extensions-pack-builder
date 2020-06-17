import { promisify } from "util";
import * as fs from "fs";

const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const exists = promisify(fs.exists);

const prfs = { stat, mkdir, readFile, readdir, exists };
export { prfs };
