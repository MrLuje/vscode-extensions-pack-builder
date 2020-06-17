# VS Code Extensions Pack builder

[![Build Status](https://mrluje-git.visualstudio.com/vscode-extensions-pack-builder/_apis/build/status/MrLuje.vscode-extensions-pack-builder?branchName=master)](https://mrluje-git.visualstudio.com/vscode-extensions-pack-builder/_apis/build/status/MrLuje.vscode-extensions-pack-builder?branchName=master)

TL;DR: You can define groups of extensions that you can apply per project, eg :

- a set of extension for .net development (intellisense, debugger, dependency management, etc)
- use another one react
- and disable non-relevant extensions in one click !

You only have pertinent extensions enabled for a given project without having to manage them one by one !

This extension allows to easily create extension pack for VS Code.

Since July update, extension packs are way more powerful and enabling/disabling a pack applies to extensions contained in this pack.

## Features

- Create new extensions packs
  - Select which extensions goes in it
  - Created pack is automatically installed
  
- Edit an existing extension pack
  - Add/Remove extensions from it
  - Get it installed in one click

![feature create pack](/images/demo.gif)

[Demo enabling a shared and typescript pack](/images/demo-typescript.gif)

[Demo going from a typescript workspace to a .net one](/images/demo-typescript-to-dotnet.gif)

## Prerequites

- npm >= 5.2.0 (for npx support)

## Extension commands

This extension contributes the following commands:

- `packBuilder.createPack`: initiate a pack creation
- `packBuilder.editPack`: initiate a pack edition

## How does this work ?

Since there is no API to perform these operations, there is a bit a magic to make it work :

- Installing locally _yo_ and _generator-code_ with npm
- Running _yo_ to create the project
- Editing a few files in this project to apply your choices
- Packaging the project
- Installing the extension though **code** executable (--install-extension flag)
- Profit !

## Known issues

Not really an issue but good to know, **Node Debug** (ms-vscode.node-debug2) extension is part of vscode and can't be disabled, so don't include it in any pack or you won't be able to disable it.

## Build

```bash
npm run watch
```
