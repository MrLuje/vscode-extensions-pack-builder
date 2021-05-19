import * as assert from "assert";
import { existsSync, mkdirSync, mkdtempSync, openSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { ResetExtensionPackFactory } from "../../helpers/packFactory";

suite("ResetFactoryCommand", function () {
  test("Should delete nodes_modules", async function () {
    this.timeout("10s");

    // arrange
    const tempDir = mkdtempSync(join(tmpdir(), "vsepb"));
    const nodeModulesPath = join(tempDir, "node_modules");

    mkdirSync(nodeModulesPath);
    mkdirSync(join(nodeModulesPath, "pwet"));

    // act
    await ResetExtensionPackFactory(tempDir);

    // assert
    assert.strictEqual(existsSync(nodeModulesPath), false);
  });

  test("Should delete packages-lock.json", async function () {
    this.timeout("10s");

    // arrange
    const tempDir = mkdtempSync(join(tmpdir(), "vsepb"));
    const packageLockPath = join(tempDir, "package-lock.json");
    openSync(packageLockPath, 'a')

    // act
    await ResetExtensionPackFactory(tempDir);

    // assert
    assert.strictEqual(existsSync(packageLockPath), false);
  });
});
