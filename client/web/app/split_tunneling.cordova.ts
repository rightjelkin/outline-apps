// Copyright 2025 The Outline Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {pluginExec} from './plugin.cordova';

export interface AppInfo {
  packageName: string;
  label: string;
}

/** Returns the list of installed user-facing applications on the device. */
export async function getInstalledApps(): Promise<AppInfo[]> {
  const result = await pluginExec<string>('getInstalledApps');
  return JSON.parse(result);
}

/**
 * Sets the list of allowed applications for split tunneling.
 * If non-empty, only these apps route through the VPN.
 * If empty, all apps route through the VPN (default behavior).
 * If a tunnel is active, it will be re-established automatically.
 */
export async function setAllowedApps(packages: string[]): Promise<void> {
  return pluginExec<void>('setAllowedApps', packages);
}
