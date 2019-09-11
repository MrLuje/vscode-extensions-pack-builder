import * as vscode from "vscode";
import { dirname, join } from "path";
import { prfs } from "../node_async/fs";
import { log } from "./log";
import { EXTENSION_NAME } from "../const";
import { getExtensions } from "./extensionProvider";

const isValidExt = (ext: vsCodeExtension | undefined): ext is vsCodeExtension => !!ext;
const dirToJsonPath = (extensionsDir: string, extensionName: string) => join(extensionsDir, extensionName, "package.json");
const readParseJson = async (fullpath: string) => {
  let res = prfs.readFile(fullpath, { encoding: "UTF-8" });
  return JSON.parse(await res);
};
const filterInstalledExtension = (ext: vscode.Extension<any>) => ext.extensionPath.includes(".vscode");
const getDisplayName = (jsonObj: { name: string; displayName: string }) =>
  (jsonObj.displayName.endsWith("%") ? undefined : jsonObj.displayName) || jsonObj.name;

export type vsCodeExtension = Omit<vscode.Extension<any>, "extensionKind" | "activate" | "export"> & { displayName: string | undefined };

async function _getInstalledExtensions(): Promise<vsCodeExtension[]> {
  const installedExtensions = getExtensions().filter(filterInstalledExtension);
  if (installedExtensions.length > 0) {
    const extensionsDir = dirname(installedExtensions[0].extensionPath);
    const extensionsDirs = await prfs.readdir(extensionsDir);

    const arr = extensionsDirs.map(async dir => {
      const jsonPath = dirToJsonPath(extensionsDir, dir);

      try {
        const jsonObj = await readParseJson(jsonPath);

        return <vsCodeExtension>{
          id: `${jsonObj.publisher}.${jsonObj.name}`,
          displayName: getDisplayName(jsonObj),
          extensionPath: dir,
          isActive: true,
          packageJSON: JSON.stringify(jsonObj)
        };
      } catch (ex) {
        log.appendLine(` * Failed to read ${jsonPath}`);
        return undefined;
      }
    });

    let exts = await Promise.all(arr);
    return exts.filter(isValidExt);
  }

  return getExtensions().map(e => {
    return { ...e, displayName: undefined };
  });
}

const isUnique = (e: { id: string; displayName: string }, index: number, self: { id: string; displayName: string }[]) =>
  self.findIndex(ee => ee.id === e.id) === index;

function saveExtensionIdName(context: vscode.ExtensionContext, extensions: vsCodeExtension[]): void {
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

export async function getInstalledExtensions(context: vscode.ExtensionContext): Promise<{ id: string; displayName: string }[]> {
  const extensions = await _getInstalledExtensions();
  saveExtensionIdName(context, extensions);
  return <{ id: string; displayName: string }[]>extensions;
}
