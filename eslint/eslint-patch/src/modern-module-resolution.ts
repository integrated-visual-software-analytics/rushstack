// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

// This is a workaround for https://github.com/eslint/eslint/issues/3458
//
// To correct how ESLint searches for plugin packages, add this line to the top of your project's .eslintrc.js file:
//
//    require("@rushstack/eslint-patch/modern-module-resolution");
//

import {
  ConfigArrayFactory,
  ModuleResolver,
  isModuleResolutionError,
  ESLINT_MAJOR_VERSION
} from './_patch-base';

// error: "The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received ''"
const isInvalidImporterPath: (ex: unknown) => boolean = (ex) =>
  (ex as { code: unknown } | undefined)?.code === 'ERR_INVALID_ARG_VALUE';

if (!ConfigArrayFactory.__loadPluginPatched) {
  ConfigArrayFactory.__loadPluginPatched = true;
  const originalLoadPlugin = ConfigArrayFactory.prototype._loadPlugin;

  if (ESLINT_MAJOR_VERSION === 6) {
    // ESLint 6.x
    // https://github.com/eslint/eslint/blob/9738f8cc864d769988ccf42bb70f524444df1349/lib/cli-engine/config-array-factory.js#L915
    ConfigArrayFactory.prototype._loadPlugin = function (
      name: string,
      importerPath: string,
      importerName: string
    ) {
      const originalResolve = ModuleResolver.resolve;
      try {
        ModuleResolver.resolve = function (moduleName: string, relativeToPath: string) {
          try {
            // resolve using importerPath instead of relativeToPath
            return originalResolve.call(this, moduleName, importerPath);
          } catch (e) {
            if (isModuleResolutionError(e) || isInvalidImporterPath(e)) {
              return originalResolve.call(this, moduleName, relativeToPath);
            }
            throw e;
          }
        };
        return originalLoadPlugin.apply(this, arguments);
      } finally {
        ModuleResolver.resolve = originalResolve;
      }
    };
  } else {
    // ESLint 7.x || 8.x
    // https://github.com/eslint/eslintrc/blob/242d569020dfe4f561e4503787b99ec016337457/lib/config-array-factory.js#L1023
    ConfigArrayFactory.prototype._loadPlugin = function (name: string, ctx: Record<string, unknown>) {
      const originalResolve = ModuleResolver.resolve;
      try {
        ModuleResolver.resolve = function (moduleName: string, relativeToPath: string) {
          try {
            // resolve using ctx.filePath instead of relativeToPath
            return originalResolve.call(this, moduleName, ctx.filePath);
          } catch (e) {
            if (isModuleResolutionError(e) || isInvalidImporterPath(e)) {
              return originalResolve.call(this, moduleName, relativeToPath);
            }
            throw e;
          }
        };
        return originalLoadPlugin.apply(this, arguments);
      } finally {
        ModuleResolver.resolve = originalResolve;
      }
    };
  }
}
