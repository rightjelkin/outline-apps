/*
 * Copyright 2025 The Outline Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {LitElement, html, css, nothing} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

import {AppInfo, getInstalledApps, setAllowedApps} from '../../app/split_tunneling.cordova';

@customElement('split-tunneling-view')
export class SplitTunnelingView extends LitElement {
  @property({type: Object}) localize: (key: string) => string = msg => msg;
  @property({type: Array}) initialSelectedApps: string[] = [];

  @state() private apps: AppInfo[] = [];
  @state() private selectedApps: Set<string> = new Set();
  @state() private searchQuery = '';
  @state() private loading = true;

  private applyDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  static styles = css`
    :host {
      height: 100%;
      width: 100%;
      background-color: var(--outline-background);
      color: var(--outline-text-color);
      display: block;
      overflow-y: auto;
    }

    .search-container {
      padding: 12px 16px;
      position: sticky;
      top: 0;
      background-color: var(--outline-background);
      z-index: 1;
    }

    md-filled-text-field {
      width: 100%;
      --md-filled-text-field-container-color: var(--outline-card-background);
      --md-filled-text-field-input-text-color: var(--outline-text-color);
      --md-filled-text-field-label-text-color: var(--outline-label-color);
    }

    .hint {
      padding: 8px 16px;
      font-size: 13px;
      color: var(--outline-label-color);
      font-family: var(--outline-font-family);
    }

    md-list {
      background-color: var(--outline-background);
      --md-list-container-color: var(--outline-background);
      color: var(--outline-text-color);
      padding: 0;
    }

    md-list-item {
      cursor: pointer;
      --md-list-item-label-text-color: var(--outline-text-color);
      --md-list-item-headline-color: var(--outline-text-color);
      --md-list-item-supporting-text-color: var(--outline-label-color);
      color: var(--outline-text-color);
    }

    md-checkbox {
      --md-checkbox-selected-container-color: var(--outline-primary);
      --md-checkbox-selected-icon-color: var(--outline-white, #fff);
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 32px;
      color: var(--outline-label-color);
      font-family: var(--outline-font-family);
    }

    .app-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .package-name {
      font-size: 12px;
      color: var(--outline-label-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    this.selectedApps = new Set(this.initialSelectedApps);
    try {
      this.apps = await getInstalledApps();
      this.apps.sort((a, b) => a.label.localeCompare(b.label));
    } catch (e) {
      console.error('Failed to load installed apps:', e);
      this.apps = [];
    }
    this.loading = false;
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">Loading...</div>`;
    }

    const query = this.searchQuery.toLowerCase();
    const filteredApps = query
      ? this.apps.filter(
          app =>
            app.label.toLowerCase().includes(query) ||
            app.packageName.toLowerCase().includes(query)
        )
      : this.apps;

    return html`
      <div class="search-container">
        <md-filled-text-field
          label="${this.localize('split-tunneling-search-placeholder')}"
          @input=${this.onSearchInput}
          .value=${this.searchQuery}
        >
          <md-icon slot="leading-icon">search</md-icon>
        </md-filled-text-field>
      </div>
      <div class="hint">
        ${this.selectedApps.size === 0
          ? this.localize('split-tunneling-hint-none')
          : this.localize('split-tunneling-hint-selected')}
        (${this.selectedApps.size})
      </div>
      <md-list>
        ${filteredApps.map(
          app => html`
            <md-list-item @click=${() => this.toggleApp(app.packageName)}>
              <md-ripple></md-ripple>
              <md-checkbox
                slot="start"
                .checked=${this.selectedApps.has(app.packageName)}
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this.toggleApp(app.packageName);
                }}
              ></md-checkbox>
              <div>
                <div class="app-label">${app.label}</div>
                <div class="package-name">${app.packageName}</div>
              </div>
            </md-list-item>
          `
        )}
      </md-list>
    `;
  }

  private onSearchInput(e: Event) {
    this.searchQuery = (e.target as HTMLInputElement).value;
  }

  private toggleApp(packageName: string) {
    const newSet = new Set(this.selectedApps);
    if (newSet.has(packageName)) {
      newSet.delete(packageName);
    } else {
      newSet.add(packageName);
    }
    this.selectedApps = newSet;
    this.applyChanges();
  }

  private applyChanges() {
    if (this.applyDebounceTimer) {
      clearTimeout(this.applyDebounceTimer);
    }
    this.applyDebounceTimer = setTimeout(async () => {
      const packages = [...this.selectedApps];
      try {
        await setAllowedApps(packages);
      } catch (e) {
        console.error('Failed to set allowed apps:', e);
      }
      this.dispatchEvent(
        new CustomEvent('AllowedAppsChanged', {
          bubbles: true,
          composed: true,
          detail: {packages},
        })
      );
    }, 500);
  }
}
