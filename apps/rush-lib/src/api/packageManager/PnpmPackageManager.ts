// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as semver from 'semver';
import { RushConstants } from '../../logic/RushConstants';
import { PackageManager } from './PackageManager';
import * as path from 'path';

/**
 * Support for interacting with the PNPM package manager.
 */
export class PnpmPackageManager extends PackageManager {
  /**
   * PNPM only.  True if `--resolution-strategy` is supported.
   */
  public readonly supportsResolutionStrategy: boolean;

  private parsedVersion: semver.SemVer;

  /** @internal */
  public constructor(version: string) {
    super(version, 'pnpm');

    this.parsedVersion = new semver.SemVer(version);

    this.supportsResolutionStrategy = false;

    if (this.parsedVersion.major >= 3) {
      this._shrinkwrapFilename = RushConstants.pnpmV3ShrinkwrapFilename;

      if (this.parsedVersion.minor >= 1) {
        // Introduced in version 3.1.0-0
        this.supportsResolutionStrategy = true;
      }
    } else {
      this._shrinkwrapFilename = RushConstants.pnpmV1ShrinkwrapFilename;
    }
  }

  /**
   * Returns the relative path to the internal shrinkwrap file
   * Ex: node_modules/.pnpm/lock.yaml
   */
  public getInternalShrinkwrapFilePath(): string {

    let internalShrinkwrapPath: string;

    if (this.parsedVersion.major <= 2) {
      // node_modules/.shrinkwrap.yaml
      internalShrinkwrapPath = path.join('node_modules', '.shrinkwrap.yaml');
    } else if (this.parsedVersion.major <= 3) {
      // node_modules/.pnpm-lock.yaml
      internalShrinkwrapPath = path.join('node_modules', '.pnpm-lock.yaml');
    } else {
      // node_modules/.pnpm/lock.yaml
      // See https://github.com/pnpm/pnpm/releases/tag/v4.0.0 for more details.
      internalShrinkwrapPath = path.join('node_modules', '.pnpm', 'lock.yaml');
    }

    return internalShrinkwrapPath;
  }
}
