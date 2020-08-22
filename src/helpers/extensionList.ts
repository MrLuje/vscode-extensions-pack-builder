import * as vscode from "vscode";
import { dirname, join, sep } from "path";
import { prfs } from "../node_async/fs";
import { log } from "./log";
import { EXTENSION_NAME } from "../const";
import { getExtensions } from "./extensionProvider";

const isValidExt = (ext: vsCodeExtension | undefined): ext is vsCodeExtension =>
  !!ext;

const dirToJsonPath = (extensionsDir: string, extensionName: string) =>
  join(extensionsDir, extensionName, "package.json");

const readParseJson = async (fullpath: string) => {
  let res = prfs.readFile(fullpath, { encoding: "UTF-8" });
  return JSON.parse(await res);
};

const filterInstalledExtension = (ext: vscode.Extension<any>) =>
  ext.extensionPath
    .slice(0, ext.extensionPath.lastIndexOf(sep))
    .includes(".vscode");
const getDisplayName = (jsonObj: { name: string; displayName: string }) =>
  (jsonObj.displayName && jsonObj.displayName.endsWith("%") ? undefined : jsonObj.displayName) ||
  jsonObj.name;

export type vsCodeExtension = Omit<
  vscode.Extension<any>,
  "extensionKind" | "activate" | "export" | "extensionUri"
> & { displayName: string | undefined };
export type vsCodeExtensionDisplay = Omit<
  vsCodeExtension,
  "extensionPath" | "isActive" | "packageJSON" | "exports"
>;

async function _getInstalledExtensions(): Promise<vsCodeExtension[]> {
  const installedExtensions = getExtensions().filter(filterInstalledExtension);
  if (installedExtensions.length > 0) {
    const extensionsDir = dirname(installedExtensions[0].extensionPath);
    const extensionsDirs = await prfs.readdir(extensionsDir);

    const arr = extensionsDirs.map(async (dir) => {
      const jsonPath = dirToJsonPath(extensionsDir, dir);
      if (!(await prfs.exists(jsonPath))) {
        return undefined;
      }

      try {
        const jsonObj = await readParseJson(jsonPath);

        return <vsCodeExtension>{
          id: `${jsonObj.publisher}.${jsonObj.name}`,
          displayName: getDisplayName(jsonObj),
          extensionPath: dir,
          isActive: true,
          packageJSON: JSON.stringify(jsonObj),
        };
      } catch (ex) {
        log.appendLine(` * Failed to read ${jsonPath}`);
        return undefined;
      }
    });

    let exts = await Promise.all(arr);
    return exts.filter(isValidExt).filter(isUnique);
  }

  return getExtensions().map((e) => {
    return { ...e, displayName: undefined };
  });
}

function isUnique<T extends vsCodeExtensionDisplay>(
  e: T,
  index: number,
  self: T[]
) {
  return self.findIndex((ee) => ee.id === e.id) === index;
}
function saveExtensionIdName(
  context: vscode.ExtensionContext,
  extensions: vsCodeExtension[]
): void {
  let knownExtensions = getKnownExtensions(context);
  let t = extensions
    .map((e) => {
      return { id: e.id, displayName: (e as any).displayName };
    })
    .concat(knownExtensions)
    .filter(isUnique);

  context.globalState.update(`${EXTENSION_NAME}-knownExtensions`, t);
}

export function getKnownExtensions(context: vscode.ExtensionContext) {
  return (
    <{ id: string; displayName: string }[]>(
      context.globalState.get(`${EXTENSION_NAME}-knownExtensions`)
    ) || []
  );
}

export async function getInstalledExtensions(
  context: vscode.ExtensionContext
): Promise<{ id: string; displayName: string }[]> {
  const extensions = await _getInstalledExtensions();
  saveExtensionIdName(context, extensions);
  return <{ id: string; displayName: string }[]>extensions;
}
