import * as vscode from "vscode";
import * as assert from "assert";
import * as extensionList from "../../helpers/extensionList";
import * as extensionProvider from "../../helpers/extensionProvider";
import * as sinon from "sinon";
import { prfs } from "../../node_async/fs";

suite("extensionList", function() {
  let vsCodeContext: sinon.SinonSpy;
  let stubs: sinon.SinonStub[] = [];

  setup(() => {
    vsCodeContext = sinon.fake(() => {
      return {
        globalState: {
          get: () => [],
          update: () => {}
        }
      };
    });

    teardown(() => {
      stubs.forEach(s => s.restore());
    });
  });

  const getFakeExtention = function(id: string, name: string, path: string, displayName = name, publisher = "pub") {
    return {
      id: id,
      publisher: publisher,
      name: name,
      displayName: displayName,
      activate: () => Promise.resolve({}),
      exports: undefined,
      extensionKind: vscode.ExtensionKind.UI,
      isActive: true,
      packageJSON: "",
      extensionPath: path
    };
  };

  test("Should contains only non-internal vscode.extensions.all", async function() {
    // arrange
    const extension1 = getFakeExtention("1", "internal", ".vscode/here");
    const extension2 = getFakeExtention("2", "not-internal", "here");

    stubs.push(sinon.stub(extensionProvider, "getExtensions").returns(<vscode.Extension<any>[]>[extension1, extension2]));

    stubs.push(sinon.stub(prfs, "readdir").returns(Promise.resolve(["some folder"])));
    const readFileStub = sinon.stub(prfs, "readFile");
    stubs.push(readFileStub);
    readFileStub.onFirstCall().returns(Promise.resolve(JSON.stringify(extension1)));
    readFileStub.onSecondCall().returns(Promise.resolve(JSON.stringify(extension2)));

    const handMadeInstalledExtensions = await extensionList.getInstalledExtensions(<vscode.ExtensionContext>vsCodeContext());
    assert.equal(handMadeInstalledExtensions.filter(e => e.id.includes(".internal")).length, 1);
    assert.equal(handMadeInstalledExtensions.filter(e => e.id.includes("non-internal")).length, 0);
  });

  test("DisplayName should use displayName and fallback to name", async function() {
    const expectedDisplayName = "display-internal";
    const extension1 = getFakeExtention("1", "internal", ".vscode/here", expectedDisplayName);
    stubs.push(sinon.stub(extensionProvider, "getExtensions").returns(<vscode.Extension<any>[]>[extension1]));

    stubs.push(sinon.stub(prfs, "readdir").returns(Promise.resolve(["some folder"])));

    const readFileStub = sinon.stub(prfs, "readFile");
    stubs.push(readFileStub);
    readFileStub.returns(Promise.resolve(JSON.stringify(extension1)));

    const handMadeInstalledExtensions = await extensionList.getInstalledExtensions(<vscode.ExtensionContext>vsCodeContext());
    assert.ok(handMadeInstalledExtensions.every(x => x.displayName.includes(expectedDisplayName)));
  });

  test("Shouldn't use DisplayName if contains % and fallback to name", async function() {
    const displayName = "%display-name%";
    const extension1 = getFakeExtention("1", "internal", ".vscode/here", displayName);
    stubs.push(sinon.stub(extensionProvider, "getExtensions").returns(<vscode.Extension<any>[]>[extension1]));

    stubs.push(sinon.stub(prfs, "readdir").returns(Promise.resolve(["some folder"])));

    const readFileStub = sinon.stub(prfs, "readFile");
    stubs.push(readFileStub);
    readFileStub.returns(Promise.resolve(JSON.stringify(extension1)));

    const handMadeInstalledExtensions = await extensionList.getInstalledExtensions(<vscode.ExtensionContext>vsCodeContext());
    assert.ok(handMadeInstalledExtensions.every(x => x.displayName.includes("internal")));
  });
});
