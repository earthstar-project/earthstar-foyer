import deepEqual = require('fast-deep-equal');
import debounce = require('lodash.debounce');
import {
    AuthorAddress,
    AuthorKeypair,
    StorageMemory,
    ValidatorEs3,
    WorkspaceAddress,
} from 'earthstar';

import { Thunk } from './types';
import { Workspace } from './workspace';
import { Emitter } from './emitter';

let logRouter = (...args : any[]) => console.log('Router |', ...args);
let log = (...args : any[]) => console.log(...args);

//================================================================================

export type HashParams = { [key:string] : string };

let getHashParams = () : HashParams => {
    log('getHashParams |');
    if (!window.location.hash) { return {}; }
    let params : { [key:string] : string } = {};
    let USParams = new URLSearchParams(window.location.hash.slice(1)); // remove leading '#'
    for (let [k,v] of USParams.entries()) {
        params[k] = v;
    }
    return params;
}
let setHashParams = (params : HashParams) : void => {
    let newHash = Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
    log('setHashParams | start');
    log('setHashParams | ...params', params);
    log('setHashParams | ...newHash', newHash);
    window.location.hash = newHash;
}

//================================================================================

let LOGIN_HISTORY_LOCALSTORAGE_KEY = 'earthstar-logins';
type EarthstarLoginHistory = {
    workspaceAddresses : (WorkspaceAddress | null)[];  // most recent first
    authorKeypairs : (AuthorKeypair | null)[];  // most recent first.  null = guest mode
    // servers : string[];  // TODO
}

type String2String = {[key:string]: string};

// expected url hash params:
// #workspace=gardening.xxxx
// note we omit the plus on the workspace address because it would have to be percent-encoded.
// if workspace is null, it's absent from the url hash.
export class EarthstarRouter {
    workspaceAddress : WorkspaceAddress | null = null;
    authorKeypair : AuthorKeypair | null = null;
    params : HashParams;
    app : string | null = null;  // short codename for app
    appName : string | null = null;  // human-readable app name, for display
    appsAndNames : String2String;  // map from app short codename to human-readable name

    history : EarthstarLoginHistory;
    workspace : Workspace | null = null;

    onParamsChange : Emitter<HashParams>;
    onAppChange : Emitter<string | null>;
    onWorkspaceChange : Emitter<undefined>;
    onStorageChange : Emitter<undefined>;
    onSyncerChange : Emitter<undefined>;

    unsubWorkspaceStorage : Thunk | null = null;
    unsubWorkspaceSyncer : Thunk | null = null;
    constructor(appsAndNames : String2String) {
        log('Router.constructor() | starting');
        log('Router.constructor() | ...creating emitters');
        this.onParamsChange = new Emitter<HashParams>('params');  // change in hash params except for workspace or app
        this.onAppChange = new Emitter<string | null>('app');  // app change
        this.onWorkspaceChange = new Emitter<undefined>('workspace');  // change in workspace address or author (by manual hash change, or setWorkspace)
        this.onStorageChange = new Emitter<undefined>('storage');  // change in the data in a workspace's Storage.  not fired when the whole workspace is switched.
        this.onSyncerChange = new Emitter<undefined>('syncer');  // change from a workspace's Syncer.  not fired when the whole workspace is switched.

        this.appsAndNames = appsAndNames;

        log('Router.constructor() | ...setting up hash params and listener');
        this.params = getHashParams();
        window.addEventListener('hashchange', () => {   // TEMP HACK
            this._handleHashChange();
        }, false);

        log('Router.constructor() | ...setting up history');
        this.history = {
            workspaceAddresses: [null],
            authorKeypairs: [null],
        }
        this._loadHistoryFromLocalStorage();

        log('Router.constructor() | ...loading the rest');
        this._loadWorkspaceAddressFromHash();
        this._loadAppFromHash();
        this._loadAuthorFromHistory();
        this._buildWorkspace();
        log('Router.constructor() | ...done');
    }
    _buildWorkspace() {
        log('Router._buildWorkspace() | start');
        log('Router._buildWorkspace() | ...unsub from previous workspace events');
        // unsubscribe from old workspace events
        if (this.unsubWorkspaceStorage) { this.unsubWorkspaceStorage(); }
        if (this.unsubWorkspaceSyncer) { this.unsubWorkspaceSyncer(); }
        this.unsubWorkspaceStorage = null;
        this.unsubWorkspaceSyncer = null;

        if (this.workspaceAddress === null) {
            log('Router._buildWorkspace() | ...set workspace to null');
            this.workspace = null;
        } else {
            log('Router._buildWorkspace() | ...instantiate StorageMemory, Workspace, etc');
            let validator = ValidatorEs3;
            let storage = new StorageMemory([ValidatorEs3], this.workspaceAddress);
            this.workspace = new Workspace(storage, this.authorKeypair);

            // HACK until router remembers pubs in localStorage - add some demo pubs
            this.workspace.syncer.addPub('http://localhost:3333');
            this.workspace.syncer.addPub('https://cinnamon-bun-earthstar-pub3.glitch.me/');

            // HACK to persist the memory storage to localStorage
            let localStorageKey = `earthstar-${validator.format}-${this.workspaceAddress}`;
            let existingData = localStorage.getItem(localStorageKey);
            if (existingData !== null) {
                storage._docs = JSON.parse(existingData);
            }
            // saving will get triggered on every incoming document, so we should debounce it
            // (wait until no changes for X milliseconds, then save)
            let saveToLocalStorage = () => {
                logRouter('saving StorageMemory to localStorage =====================================');
                localStorage.setItem(localStorageKey, JSON.stringify(storage._docs));
            };
            let debouncedSave = debounce(saveToLocalStorage, 100, { trailing: true });
            storage.onChange.subscribe(debouncedSave);
            // END LOCALSTORAGE HACK

            // pipe workspace's change events through to the router's change events
            log('Router._buildWorkspace() | ...hook up new workspace events to our own events (onStorage, onSyncer)');
            this.unsubWorkspaceStorage = this.workspace.storage.onChange.subscribe(() => this.onStorageChange.send(undefined));
            this.unsubWorkspaceSyncer = this.workspace.syncer.onChange.subscribe(() => this.onSyncerChange.send(undefined));
        }
        log('Router._buildWorkspace() | ...done');
    }
    _handleHashChange() {
        log('Router._handleHashChange() | start');
        let oldParams = this.params;
        let newParams = getHashParams();
        log('Router._handleHashChange() | ', oldParams, newParams);

        // nop change
        if (deepEqual(oldParams, newParams)) {
            log('Router._handleHashChange() | ...no params changed at all.  returning.');
            return;
        }

        // check for workspace change
        if (oldParams.workspace !== newParams.workspace) {
            log(`Router._handleHashChange() | ...workspace changed via hash, from ${oldParams.workspace} to ${newParams.workspace}`);
            this._loadWorkspaceAddressFromHash();
            this._buildWorkspace();
            log('Router._handleHashChange() | ...sending onWorkspaceChange');
            this.onWorkspaceChange.send(undefined);
        } else {
            log('Router._handleHashChange() | ...workspace did not change in params');
        }

        // check for app change
        if (oldParams.app !== newParams.app) {
            log(`Router._handleHashChange() | ...app changed via hash, from ${oldParams.app} to ${newParams.app}`);
            this._loadAppFromHash();
            log('Router._handleHashChange() | ...sending onAppChange');
            this.onAppChange.send(this.app);
        } else {
            log('Router._handleHashChange() | ...app did not change in params');
        }

        // check for any other change besides workspace and app
        let oldWithoutWs = {...this.params, workspace: null, app: null};
        let newWithoutWs = {...newParams, workspace: null, app: null};
        if (!deepEqual(oldWithoutWs, newWithoutWs)) {
            log('Router._handleHashChange() | ...hash params changed (except for workspace)');
            log(oldWithoutWs);
            log(newWithoutWs);
            log('Router._handleHashChange() | ...sending onParamsChange');
            this.onParamsChange.send(newParams);
        } else {
            log('Router._handleHashChange() | ...no non-workspace params changed');
        }
        // save new params
        this.params = newParams;
        log('Router._handleHashChange() | ...done');
    }
    _loadHistoryFromLocalStorage() {
        let raw = localStorage.getItem(LOGIN_HISTORY_LOCALSTORAGE_KEY);
        if (raw) {
            try {
                this.history = JSON.parse(raw);
            } catch (e) {
            }
        }
        log('Router._loadHistoryFromLocalStorage() | done: ', this.history);
    }
    _loadAppFromHash() {
        log('Router._loadAppFromHash() | start');
        let app = getHashParams().app || null;
        if (app !== null && this.appsAndNames[app] === undefined) {
            app = null;
            log('Router._loadAppFromHash() | ...unrecognized app not in appsAndNames -- setting to null:', app);
        }
        this.app = app;
        this.appName = app === null ? null : this.appsAndNames[app];
        log('Router._loadAppFromHash() | ...done: ', this.app, this.appName);
    }
    _loadWorkspaceAddressFromHash() {
        log('Router._loadWorkspaceAddressFromHash() | start');
        this.workspaceAddress = getHashParams().workspace || null;
        if (this.workspaceAddress) {
            // restore '+'
            this.workspaceAddress = this.workspaceAddress.trim();
            if (!this.workspaceAddress.startsWith('+')) { this.workspaceAddress = '+' + this.workspaceAddress; }
            // save to front of history workspace list (as most recent)
            log('Router._loadWorkspaceAddressFromHash() | ...update history');
            this.history.workspaceAddresses = this.history.workspaceAddresses.filter(w => w !== this.workspaceAddress);
            this.history.workspaceAddresses.unshift(this.workspaceAddress);
            this._saveHistory();
        }
        log('Router._loadWorkspaceAddressFromHash() | ...done: ', this.workspaceAddress);
    }
    _loadAuthorFromHistory() {
        if (this.history.authorKeypairs.length == 0) {
            this.history.authorKeypairs = [null];
        }
        this.authorKeypair = this.history.authorKeypairs[0];
        log('Router._loadAuthorFromHistory() | done: ', this.authorKeypair);
    }
    _saveHistory() {
        localStorage.setItem(LOGIN_HISTORY_LOCALSTORAGE_KEY, JSON.stringify(this.history));
        log('Router._saveHistory() | done');
    }
    setWorkspace(workspaceAddress : WorkspaceAddress | null) {
        // changing the workspace will clear all params besides the special ones (app and workspace)
        log('Router.setWorkspace(' + workspaceAddress + ') | start');
        this.workspaceAddress = workspaceAddress;
        // update history to move workspace to the beginning of the list (most recent)
        log('Router.setWorkspace() | ...updating and saving history');
        this.history.workspaceAddresses = this.history.workspaceAddresses.filter(w => w !== workspaceAddress);
        this.history.workspaceAddresses.unshift(workspaceAddress);
        this._saveHistory();
        // rebuild workspace
        log('Router.setWorkspace() | ...build new workspace');
        this._buildWorkspace();

        // update hash params.
        log('Router.setWorkspace() | ...clear hash params except for app and workspace');
        let newParams : HashParams = {}
        if (this.workspaceAddress !== null) { newParams.workspace = this.workspaceAddress.slice(1); }  // remove '+'
        if (this.app !== null) { newParams.app = this.app;}
        setHashParams(newParams);

        log('Router.setWorkspace() | ...send onWorkspaceChange');
        this.onWorkspaceChange.send(undefined);
        log('Router.setWorkspace() | ...done');
    }
    setAuthorAddress(authorAddress : AuthorAddress | null) {
        log('Router.setAuthorAddress() | start', authorAddress);
        // a helper for when you only know the address, not the whole keypair
        if (authorAddress === null) {
            this.setAuthorKeypair(null);
            return;
        }
        for (let kp of this.history.authorKeypairs) {
            if (kp !== null && kp.address === authorAddress) {
                this.setAuthorKeypair(kp);
                return;
            }
        }
        console.warn('setAuthorAddress: could not find keypair with address = ', JSON.stringify(authorAddress));
        log('Router.setAuthorAddress() | ...done');
    }
    setAuthorKeypair(authorKeypair : AuthorKeypair | null) { 
        log('Router.setAuthorKeypair() | start', authorKeypair);
        this.authorKeypair = authorKeypair;

        // update history to move author to the beginning of the list (most recent)
        // note that the authorKeypair list includes a null representing guest mode
        log('Router.setAuthorKeypair() | ...update and save history');
        this.history.authorKeypairs = this.history.authorKeypairs.filter(a => !deepEqual(a, authorKeypair));
        this.history.authorKeypairs.unshift(authorKeypair);
        this._saveHistory();

        // rebuild workspace
        log('Router.setAuthorKeypair() | ...build workspace');
        this._buildWorkspace();

        log('Router.setAuthorKeypair() | ...send onWorkspaceChange');
        this.onWorkspaceChange.send(undefined);
        log('Router.setAuthorKeypair() | ...done');
    }
    setApp(app : string | null) {
        // changing the app will clear all params besides the special ones (app and workspace)
        log('Router.setApp(' + app + ') | start');
        if (app === this.app) {
            log('Router.setApp() | ...nothing to change.  done.');
            return;
        }
        this.app = app;

        // update hash params.
        log('Router.setApp() | ...clear hash params except for app and workspace');
        let newParams : HashParams = {}
        if (this.workspaceAddress !== null) { newParams.workspace = this.workspaceAddress.slice(1); }  // remove '+'
        if (this.app !== null) { newParams.app = this.app;}

        // this will send onAppChange event for us
        setHashParams(newParams);
        log('Router.setApp() | ...done');
    }
    setParams(params : String2String) {
        // This only lets you set normal params, not special params (app, workspace).
        // It replaces all normal params, it doesn't update them.
        // (e.g. if you omit a param, it will be deleted)
        log('Router.setParams() | ', params);
        let oldNonSpecialParams = {...this.params};
        delete oldNonSpecialParams.app;
        delete oldNonSpecialParams.workspace;
        let newNonSpecialParams = {...params};
        delete newNonSpecialParams.app;
        delete newNonSpecialParams.workspace;
        if (deepEqual(oldNonSpecialParams, newNonSpecialParams)) {
            log('Router.setParams() | ...no change, doing nothing.  done.');
            return;
        }
        let newParams = {
            ...params,
            app: this.params.app,
            workspace: this.params.workspace,
        }
        log('Router.setParams() | ...setting hash params', newParams);
        // this will also send an onParamsChange for us
        setHashParams(newParams);
        log('Router.setParams() | ...done');
    }
}
