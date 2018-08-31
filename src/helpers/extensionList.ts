import * as vscode from "vscode";
import { dirname, join } from "path";
import { prfs } from "../node_async/fs";
import { log } from "./log";
import { EXTENSION_NAME } from "../const";

const isValidExt = (ext: vscode.Extension<any> | undefined): ext is vscode.Extension<any> => !!ext;
const dirToJsonPath = (extensionsDir: string, extensionName: string) => join(extensionsDir, extensionName, "package.json");
const readParseJson = async (fullpath: string) => JSON.parse(await prfs.readFile(fullpath, { encoding: "UTF-8" }));
const filterInstalledExtension = (ext: vscode.Extension<any>) => ext.extensionPath.includes(".vscode");

async function _getInstalledExtensions(): Promise<vscode.Extension<any>[]> {
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

const isUnique = (e: { id: string; displayName: string }, index: number, self: { id: string; displayName: string }[]) =>
  self.findIndex(ee => ee.id === e.id) === index;

function saveExtensionIdName(context: vscode.ExtensionContext, extensions: vscode.Extension<any>[]): void {
  let knownExtensions = getKnownExtensions(context);
  let t = extensions
    .map(e => {
      return { id: e.id, displayName: (e as any).displayName };
    })
    .concat(knownExtensions)
    .filter(isUnique);
  context.globalState.update(`${EXTENSION_NAME}-knownExtensions`, t);
}

export function getKnownExtensions(context: vscode.ExtensionContext) {
  return <{ id: string; displayName: string }[]>context.globalState.get(`${EXTENSION_NAME}-knownExtensions`) || [];
}

export async function getInstalledExtensions(context: vscode.ExtensionContext): Promise<vscode.Extension<any>[]> {
  const extensions = await _getInstalledExtensions();
  saveExtensionIdName(context, extensions);
  return extensions;
}
