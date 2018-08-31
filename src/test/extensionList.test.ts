import * as vscode from "vscode";
import * as assert from "assert";
import { getInstalledExtensions } from "../helpers/extensionList";
import * as sinon from "sinon";

suite("extensionList", function() {
  let vsCodeContext: sinon.SinonSpy;
  setup(() => {
    vsCodeContext = sinon.fake(() => {
      return {
        globalState: {
          get: () => [],
          update: () => {}
        }
      };
    });
  });

  test("Should contains non-internal vscode.extensions.all", async function() {
    const handMadeInstalledExtensions = await getInstalledExtensions(<vscode.ExtensionContext>vsCodeContext());

    const installedExtensionsFromMarketPlace: (value: vscode.Extension<any>, index: number, array: vscode.Extension<any>[]) => any = ext =>
      ext.extensionPath.includes(".vscode");

    const builtinVsCodeGetInstalledExtensions = vscode.extensions.all.filter(installedExtensionsFromMarketPlace);
    assert.equal(
      builtinVsCodeGetInstalledExtensions.every(ext => {
        return handMadeInstalledExtensions.find(e => e.id === ext.id) !== undefined;
      }),
      true
    );
  });
});
