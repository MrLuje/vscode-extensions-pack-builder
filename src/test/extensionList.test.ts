import * as vscode from "vscode";
import * as assert from "assert";
import { getInstalledExtensions } from "../helpers/extensionList";

suite("extensionList", function() {
  test("Should contains non-internal vscode.extensions.all", async function() {
    const installedExtensions = await getInstalledExtensions();

    assert.equal(
      vscode.extensions.all.filter(ext => ext.extensionPath.includes(".vscode")).every(ext => {
        return installedExtensions.find(e => e.id === ext.id) !== undefined;
      }),
      true
    );
  });
});
