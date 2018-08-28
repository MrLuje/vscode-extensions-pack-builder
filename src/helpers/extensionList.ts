import * as vscode from "vscode";
import * as fs from "fs";
import { dirname, join } from "path";
import { prfs } from "../node_async/fs";

export async function getInstalledExtensions(): Promise<vscode.Extension<any>[]> {
  const parseJson = (fullpath: string) => JSON.parse(fs.readFileSync(fullpath, { encoding: "UTF-8" }));

  const installedExtensions = vscode.extensions.all.filter(filterInstalledExtension);
  if (installedExtensions.length > 0) {
    const extensionsDir = dirname(installedExtensions[0].extensionPath);
    const extensionsDirs = await prfs.readdir(extensionsDir);

    return extensionsDirs
      .map(ext => join(extensionsDir, ext, "package.json"))
      .filter(f => fs.existsSync(f))
      .map(f => {
        return { dir: dirname(f), pkJon: parseJson(f) };
      })
      .map(ext => {
        return {
          id: ext.pkJon.name,
          displayName: ext.pkJon.displayName || ext.pkJon.name,
          extensionPath: ext.dir,
          isActive: true,
          packageJSON: JSON.stringify(ext),
          exports: null,
          activate: () => Promise.resolve()
        };
      });
  }

  return vscode.extensions.all;
}

function filterInstalledExtension(ext: vscode.Extension<any>) {
  return ext.extensionPath.includes(".vscode");
}
