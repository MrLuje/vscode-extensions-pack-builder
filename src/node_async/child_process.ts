import * as node_child_process from "child_process";
import { promisify } from "util";

const exec = promisify(node_child_process.exec);
const child_process = { exec };
export { child_process };
