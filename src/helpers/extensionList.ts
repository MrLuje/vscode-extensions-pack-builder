import * as vscode from "vscode";
import { dirname, join } from "path";
import { prfs } from "../node_async/fs";
import { log } from "./log";

const isValidExt = (ext: vscode.Extension<any> | undefined): ext is vscode.Extension<any> => !!ext;
const dirToJsonPath = (extensionsDir: string, extensionName: string) => join(extensionsDir, extensionName, "package.json");
const readParseJson = async (fullpath: string) => JSON.parse(await prfs.readFile(fullpath, { encoding: "UTF-8" }));
const filterInstalledExtension = (ext: vscode.Extension<any>) => ext.extensionPath.includes(".vscode");

export async function getInstalledExtensions(): Promise<vscode.Extension<any>[]> {
  const installedExtensions = vscode.extensions.all.filter(filterInstalledExtension);
  if (installedExtensions.length > 0) {
    const extensionsDir = dirname(installedExtensions[0].extensionPath);
    const extensionsDirs = await prfs.readdir(extensionsDir);

    const arr = extensionsDirs.map(async dir => {
      const jsonPath = dirToJsonPath(extensionsDir, dir);

      try {
        const jsonObj = await readParseJson(jsonPath);

        return <vscode.Extension<any>>{
          id: `${jsonObj.publisher}.${jsonObj.name}`,
          displayName: jsonObj.displayName || jsonObj.name,
          extensionPath: dir,
          isActive: true,
          packageJSON: JSON.stringify(jsonObj),
          exports: null,
          activate: () => Promise.resolve()
        };
      } catch (ex) {
        log.appendLine(` * Failed to read ${jsonPath}`);
        return undefined;
      }
    });

    let exts = await Promise.all(arr);
    return exts.filter(isValidExt);
  }

  return vscode.extensions.all;
}
