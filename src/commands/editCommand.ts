import * as vscode from "vscode";
import * as fs from "fs";
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
  if (!fs.existsSync(factoryFolder)) {
    vscode.window.showErrorMessage(`You didn't create any pack yet :(`);
    return;
  }

  const installedExtensions$ = getInstalledExtensions(context);
  const existingPacks = getExistingPacks(factoryFolder, context);

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
    factoryFolder: path.join(storagePath, EXTENSION_FOLDER),
    extensionPath: context.extensionPath
  };

  log.appendLine(`* Editing a pack !`);
  log.appendLine(` - Storage path: ${storagePath}`);
  log.appendLine(` - Extensions Pack builder path: ${context.extensionPath}`);
  log.appendLine(` - Extension path: ${path.join(options.factoryFolder, options.packageId)}`);

  ProcessPackCreation(options);
}

function getExistingPacks(factoryFolder: string, context: vscode.ExtensionContext) {
  const toNormalizedItem = (f: string) => {
    const fullpath = path.join(factoryFolder, f);
    return { name: f, fullpath: fullpath, isDir: fs.lstatSync(fullpath).isDirectory() };
  };

  const readAndSearchPackageJson = (fullpath: string) => {
    return { path: fullpath, content: fs.readdirSync(fullpath).filter(ff => ff === "package.json") };
  };

  const parseJson = (fullpath: string) => JSON.parse(fs.readFileSync(fullpath, { encoding: "UTF-8" }));

  const packageJsons = fs
    .readdirSync(factoryFolder)
    .filter(f => f !== "node_modules")
    .map(toNormalizedItem)
    .filter(f => f.isDir)
    .map(f => f.fullpath)
    .map(readAndSearchPackageJson)
    .filter(f => f.content.length > 0)
    .map(f => path.join(f.path, f.content[0]))
    .reduce((prev: string[], curr) => prev.concat(curr), [])
    .map(parseJson);

  const existingPacks = packageJsons.map(pj => {
    return <ExtensionPack>{
      label: pj.displayName,
      name: pj.name,
      extensions: pj.extensionPack,
      publisher: pj.publisher
    };
  });
  return existingPacks;
}
