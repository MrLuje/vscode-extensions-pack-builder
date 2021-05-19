import * as assert from "assert";
import * as sinon from "sinon";
import * as installExtension from "../../helpers/installExtension";
import * as helpers from "../../helpers";
import {log} from "../../helpers/log";
import { FnSelectExtensions } from "../../helpers";
import * as vscode from "vscode";

suite("[integrationtest] AddCommand", function () {
  var installExtensionStub: sinon.SinonStub;
  var quickPickStub: sinon.SinonStub;
  var inputBoxStub: sinon.SinonStub;
  var showErrorMessageStub: sinon.SinonStub;
  var loggerStub: sinon.SinonStub;
  var getGitUserNameStub: sinon.SinonStub;
  const expectedPackageName = "packname";
  const expectedGitUserName = "name";
  let resolve = (s: vscode.Uri) => { };
  let reject = (reason: any) => { };
  let installPromise = new Promise<vscode.Uri>((ok, nok) => {
    resolve = (s) => ok(s);
    reject = (r) => nok(r);
  });

  setup(() => {
    installExtensionStub = sinon.stub(installExtension, "InstallVSIX");
    installExtensionStub.callsFake(file => {
      resolve(file);
    });

    quickPickStub = sinon.stub(helpers, "AskMultiple");
    quickPickStub.callsFake((title, exts, saveFn: FnSelectExtensions) => {
      saveFn([exts[0]]);
    });

    loggerStub = sinon.stub(log, "appendLine");
    loggerStub.callsFake(str => console.info(`[info] ${str}`));

    showErrorMessageStub = sinon.stub(vscode.window, "showErrorMessage");
    showErrorMessageStub.callsFake((msg, opts) => {
      reject(msg);
    });

    inputBoxStub = sinon.stub(vscode.window, "showInputBox");
    inputBoxStub.resolves(expectedPackageName);

    getGitUserNameStub = sinon.stub(helpers, "GetGitUserName");
    getGitUserNameStub.resolves(expectedGitUserName);
  });

  teardown(() => {
    installExtensionStub.restore();
    getGitUserNameStub.restore();
    inputBoxStub.restore();
    showErrorMessageStub.restore();
    quickPickStub.restore();
  });

  test("ProcessPackCreation", async function () {
    this.timeout("300s");
    await vscode.commands.executeCommand("packBuilder.createPack");

    let file: vscode.Uri = await installPromise;

    assert.strictEqual(file.scheme, "file");
    assert.notStrictEqual(file.path, undefined);
    assert.strictEqual(installExtensionStub.calledOnce, true);
    assert.strictEqual(showErrorMessageStub.called, false);
  });
});
