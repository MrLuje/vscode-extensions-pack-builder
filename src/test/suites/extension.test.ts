//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from "assert";
import * as vscode from "vscode";

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", function () {
  test("should load correctly", function () {
    assert.ok(vscode.extensions.getExtension("mrluje.vscode-extensions-pack-builder"));
  });

  ["packBuilder.createPack",
    "packBuilder.editPack",
    "packBuilder.resetFactory"].forEach(cmd => {
      test(`should expose ${cmd} command`, async function () {
        this.timeout("10s");

        let commands = await vscode.commands.getCommands();
        assert.strictEqual(commands.filter(c => c.includes(cmd)).length, 1);
      });
    });
});
