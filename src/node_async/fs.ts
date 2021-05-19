import { promisify } from "util";
import * as fs from "fs";
import rimraf = require("rimraf");

const copyFile = promisify(fs.copyFile);
const lstat = promisify(fs.lstat);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const rimrafFunc = promisify(rimraf);

const prfs = { stat, mkdir, readFile, readdir, copyFile, writeFile, lstat, unlink, rimraf: rimrafFunc };
export { prfs };
