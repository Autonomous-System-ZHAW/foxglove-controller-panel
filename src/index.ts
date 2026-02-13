import { ExtensionContext } from "@foxglove/extension";
import { initControllerPanel } from "./ControllerPanel";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({
    name: "Controller",
    initPanel: initControllerPanel,
  });
}