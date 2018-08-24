export interface Extension {
  label: string;
  id: string;
}

export interface PackOptions {
  factoryFolder: string;
  extensionPath: string;
  packageName: string;
  packageId: string;
  publisher: string;
  extensions: Extension[];
}
