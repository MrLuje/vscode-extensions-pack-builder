# VS Code Extensions Pack builder

TL;DR: You can define groups of extensions that you can apply per project, eg :

- a set of extension for .net development (intellisense, debugger, dependency management, etc)
- use another one react
- and disable non-relevant extensions !

You only have pertinent extensions enabled for a given project without having to manage them one by one !

This extension allows to easily create extension pack for VS Code.

Since July update, extension packs are way more powerful and enabling/disabling a pack applies to extensions contained in this pack.

## Features

- Create new extensions packs
- Select which extensions goes in it
- Created pack is automatically installed

![feature create pack](/images/demo.gif)

[Demo enabling a shared and typescript pack](/images/demo-typescript.gif)

[Demo going from a typescript workspace to a .net one](/images/demo-typescript-to-dotnet.gif)

## Prerequites

- npm >= 5.2.0 (for npx support)

## How does this work ?

Since there is no API to perform these operations, there is a bit a magic to make it work :

- Installing _yo_ and _generator-code_ with npm
- Running _yo_ to create the project
- Editing a few files in this project to apply your choices
- Packaging the project
- Installing the extension though **code** executable (--install-extension flag)
- Profit !

## Known issue

Not really an issue but good to know, **Node Debug** (ms-vscode.node-debug2) extension is part os vscode and can't be disabled, so don't include it in any pack or you won't be able to disable it.

## Extension commands

This extension contributes the following commands:

- `packBuilder.createPack`: initiate a pack creation
