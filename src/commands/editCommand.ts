import * as vscode from "vscode";
import { prfs } from "../node_async/fs";
import * as path from "path";
import { EXTENSION_FOLDER } from "../const";
import { Extension } from "../models";
import { log } from "../helpers/log";
import { ProcessPackCreation } from "../helpers/packFactory";
import { CheckUserFolder, AskMultiple } from "../helpers";
import { getInstalledExtensions, getKnownExtensions } from "../helpers/extensionList";

export type ExtensionPack = {
  label: string;
  name: string;
  extensions: string[];
  publisher: string;
};

export function preSelectAndFormatExtensionList(
  context: vscode.ExtensionContext,
  installedExtensions: { id: string; displayName: string }[],
  selectedPack: ExtensionPack
) {
  let allExtensions = installedExtensions.map(ext => {
    return { id: ext.id, label: (ext as any).displayName, picked: false };
  });

  const knownExtensions = getKnownExtensions(context);

  // preselect extensions from the pack
  selectedPack.extensions.forEach(extensionId => {
    const extensionIndex = allExtensions.findIndex(ee => ee.id === extensionId);
    if (extensionIndex > -1) {
      allExtensions[extensionIndex].picked = true;
    } else {
      // the extension from the selected pack is not part of installed extension currently on vscode, try to find it
      const previouslyKnownExtension = knownExtensions.find(e => e.id === extensionId);
      if (previouslyKnownExtension) {
        allExtensions.push({ id: extensionId, label: previouslyKnownExtension.displayName, picked: true });
      }
    }
  });

  return allExtensions.sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label));
}

export async function EditPack(context: vscode.ExtensionContext) {
  const { err, storagePath } = CheckUserFolder();
  if (err || !storagePath) {
    return;
  }

  const factoryFolder = path.join(storagePath, EXTENSION_FOLDER);
  if (!(await prfs.exists(factoryFolder))) {
    vscode.window.showErrorMessage(`You didn't create any pack yet :(`);
    return;
  }

  const installedExtensions$ = getInstalledExtensions(context);
  const existingPacks = await getExistingPacks(factoryFolder, context);

  const [selectedPack, installedExtensions] = await Promise.all([vscode.window.showQuickPick(existingPacks), installedExtensions$]);
  const validatePack = (pack: ExtensionPack | undefined): pack is ExtensionPack => !!pack;
  if (!validatePack(selectedPack)) {
    return;
  }

  let allExtensions = preSelectAndFormatExtensionList(context, installedExtensions, selectedPack);
  let selectedExtensions: Extension[] = [];

  await AskMultiple("Select the extensions you want to pack :", allExtensions, res => (selectedExtensions = <Extension[]>res));

  if (selectedExtensions.length === 0) {
    return;
  }

  const options = {
    packageId: selectedPack.name,
    packageName: selectedPack.label,
    publisher: selectedPack.publisher,
    extensions: selectedExtensions,
    factoryFolder: factoryFolder,
    extensionPath: context.extensionPath
  };

  log.appendLine(`* Editing a pack !`);
  log.appendLine(` - Storage path: ${storagePath}`);
  log.appendLine(` - Extensions Pack builder path: ${context.extensionPath}`);
  log.appendLine(` - Extension path: ${path.join(options.factoryFolder, options.packageId)}`);

  ProcessPackCreation(options);
}

async function getExistingPacks(factoryFolder: string, context: vscode.ExtensionContext) {
  const toNormalizedItem = async (f: string) => {
    const fullpath = path.join(factoryFolder, f);
    const isDir = (await prfs.lstat(fullpath)).isDirectory();
    return { name: f, fullpath: fullpath, isDir: isDir };
  };

  const readAndSearchPackageJson = async (fullpath: string) => {
    return { path: fullpath, content: (await prfs.readdir(fullpath)).filter(ff => ff === "package.json") };
  };

  const parseJson = async (fullpath: string) => JSON.parse((await prfs.readFile(fullpath, { encoding: "UTF-8" })));

  const contentOfFactoryFolder = (await prfs.readdir(factoryFolder)).filter(f => f !== "node_modules");
  const folders = (await Promise.all(contentOfFactoryFolder.map(async f => toNormalizedItem(f))))
    .filter(f => f.isDir)
    .map(f => f.fullpath);
  const packageJsonPaths = (await Promise.all(folders.map(async f => readAndSearchPackageJson(f))))
    .filter(f => f.content.length > 0)
    .map(f => path.join(f.path, f.content[0]))
    .reduce((prev: string[], curr) => prev.concat(curr), []);
  const packageJsonContents = await Promise.all(packageJsonPaths.map(async f => parseJson(f)));

  const existingPacks = packageJsonContents.map(pj => {
    return <ExtensionPack>{
      label: pj.displayName,
      name: pj.name,
      extensions: pj.extensionPack,
      publisher: pj.publisher
    };
  });
  return existingPacks;
}
