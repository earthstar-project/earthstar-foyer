import { deepEqual } from 'fast-equals';

import {
    WorkspaceAddress,
    Emitter,
    StorageMemory,
    ValidatorEs4,
    AuthorKeypair,
    WriteResult,
    generateAuthorKeypair,
    checkAuthorKeypairIsValid,
    isErr,
    ValidationError,
    WriteEvent,
} from 'earthstar';

import {
    Thunk,
} from './types';
import {
    sortByField,
} from './util';
import { Kit } from './kit';
import {
    logEarthbarStore,
} from './log';

//================================================================================

export interface UserConfig {
    authorKeypair: AuthorKeypair,
    displayName: string | null,
}
export interface WorkspaceConfig {
    workspaceAddress: WorkspaceAddress,
    pubs: string[],
}

export type EarthbarEvent = {
    kind: 'EARTHBAR_EVENT',
}
export type SyncEvent = {
    kind: 'SYNC_EVENT',
}
export type AnyEarthbarEvent =
    SyncEvent |
    EarthbarEvent |
    WriteEvent;

export class EarthbarStore {
    // UI state

    // state to preserve in localHost
    currentUser: UserConfig | null = null;
    currentWorkspace: WorkspaceConfig | null = null;
    //otherUsers: UserConfig[] = [];
    otherWorkspaces: WorkspaceConfig[] = [];

    // non-JSON stuff
    kit: Kit | null = null;
    unsubSyncer: Thunk | null = null;
    unsubStorage: Thunk | null = null;

    // emit change events when we need to re-render the earthbar:
    // - SyncEvent: the Syncer has emitted an onChange
    // - WriteEvent: the IStorage data has changed
    // - EarthstarEvent: state changes in EarthbarStore: new Kit, changed current user, etc
    onChange: Emitter<AnyEarthbarEvent> = new Emitter();

    constructor() {
        logEarthbarStore('constructor');
        this.currentUser = null, /*{
            authorKeypair: {
                address: '@suzy.bzrjm4jnvr5luvbgls5ryqrq7jolqw3v5p2cmpabcsoczyhdrdjga',
                secret: 'bugskupxnwtjt56rsyusoh5oo5x74uoy3kikftv32swmskvw36m7a',
            },
            displayName: 'Suzy',
        };*/
        this.currentWorkspace = {
            workspaceAddress: '+lobbydev.a1',
            pubs: [
                'https://earthstar-demo-pub-v5-a.glitch.me/',
            ],
        };
        /*
        this.otherUsers = [
            {
                authorKeypair: {
                    address: '@fern.bx3ujqftyiqds7ohbeuet3d4iqzombh6qpc2zlx2l2isssc5jgoza',
                    secret: 'bspk7zvtwkj6wemo6rngkxdrvkiruo4p2yhmmnjzds2uydoix7odq'
                },
                displayName: 'Fernie',
            },
            {
                authorKeypair: {
                    address: '@zzzz.bgbultxgtqupc4zpyjpbno3zxg5xbk27v2cvgdpbieqlox7syzzxq',
                    secret: 'bvoowi3xqsidznc7fef4o4jcs3dycgr7yiqkbrxivg6bidjubcokq'
                },
                displayName: null,
            },
        ];
        */
        this.otherWorkspaces = [
            {
                workspaceAddress: '+emojiparty.fq0p48',
                pubs: [
                    'https://earthstar-demo-pub-v5-a.glitch.me/',
                ],
            },
        ];
        this._loadFromLocalStorage();
        this._rebuildKit();
        this._saveToLocalStorage();
        logEarthbarStore('/constructor');
    }
    //--------------------------------------------------
    // PRIVATE METHODS
    // None of these should call _bump or _saveToLocalStorage; the public methods are responsible for that.
    //
    _bump() {
        // notify our subscribers of a change to the EarthbarStore's state
        logEarthbarStore('_bump');
        logEarthbarStore('>>>> EARTHBAR_EVENT');
        this.onChange.send({ kind: 'EARTHBAR_EVENT' });
    }
    _saveToLocalStorage() {
        logEarthbarStore('_save to localStorage');
        localStorage.setItem('earthbar', JSON.stringify({
            currentUser: this.currentUser,
            currentWorkspace: this.currentWorkspace,
            //otherUsers: this.otherUsers,
            otherWorkspaces: this.otherWorkspaces,
        }));
    }
    _loadFromLocalStorage() {
        try {
            let s = localStorage.getItem('earthbar');
            if (s === null) {
                logEarthbarStore('_load from localStorage: not found');
                return;
            }
            logEarthbarStore('_load from localStorage: parsing...');
            let parsed = JSON.parse(s);
            this.currentUser = parsed.currentUser;
            this.currentWorkspace = parsed.currentWorkspace;
            //this.otherUsers = parsed.otherUsers;
            this.otherWorkspaces = parsed.otherWorkspaces;
        } catch (e) {
            logEarthbarStore('_load from localStorage: error:');
            console.warn(e);
        }
    }
    //--------------------------------------------------
    _rebuildKit() {
        // set up a new Kit instance to match this.currentWorkspace,
        // or set kit to null if the currentWorkspace is null.
        logEarthbarStore('rebuilding kit');

        // unsub from previous kit
        if (this.unsubSyncer) { this.unsubSyncer(); }
        this.unsubSyncer = null;
        if (this.unsubStorage) { this.unsubStorage(); }
        this.unsubStorage = null;

        // close previous storage
        if (this.kit !== null) {
            this.kit.storage.close();
        }

        // build new kit
        if (this.currentWorkspace === null) {
            logEarthbarStore("...it's null because workspace is null");
            this.kit = null;
        } else {
            logEarthbarStore(`...for workspace ${this.currentWorkspace.workspaceAddress} and user ${this.currentUser?.authorKeypair.address || null}`);
            this.kit = new Kit(
                new StorageMemory([ValidatorEs4], this.currentWorkspace.workspaceAddress),
                this.currentUser === null ? null : this.currentUser.authorKeypair,
                this.currentWorkspace.pubs,
            );
            // load user's displayName from IStorage
            if (this.currentUser !== null) {
                this.currentUser.displayName = this.__readDisplayNameFromIStorage();
            }
            // subscribe to kit events
            this.unsubSyncer = this.kit.syncer.onChange.subscribe(() => {
                logEarthbarStore('>>>> SYNC_EVENT');
                // pass events along to subscribers of the earthbarStore
                this.onChange.send({ kind: 'SYNC_EVENT' });
            });
            this.unsubStorage = this.kit.storage.onWrite.subscribe((e : WriteEvent) => {
                logEarthbarStore('>>>> ' + e.kind);
                // check if we need to refresh currentUser.displayName
                if (this.currentUser !== null) {
                    this.currentUser.displayName = this.__readDisplayNameFromIStorage();
                }
                // pass events along to subscribers of the earthbarStore
                this.onChange.send(e);
            });
        }
    }
    __readDisplayNameFromIStorage(): string | null {
        logEarthbarStore('_readDisplayNameFromIStorage');
        if (this.currentUser === null) { return null; }
        if (this.kit === null) { return null; }
        let path = `/about/~${this.currentUser.authorKeypair.address}/displayName.txt`;
        let displayName = this.kit.storage.getContent(path);
        return displayName || null;  // undefined or '' become null
    }
    _setCurrentUser(keypair: AuthorKeypair | null): void {
        logEarthbarStore('_setCurrentUser', keypair);
        if (keypair == null) {
            this.currentUser = null;
        } else {
            this.currentUser = {
                authorKeypair: keypair,
                displayName: null,  // set null for a moment...
            }
        }
        this._rebuildKit(); // ...this will load the displayName
    }
    //--------------------------------------------------
    // USER
    createUser(shortname: string): void {
        logEarthbarStore('creating user with shortname ' + shortname);
        let keypair = generateAuthorKeypair(shortname);
        if (isErr(keypair)) {
            logEarthbarStore('could not generate keypair from shortname:');
            console.warn(keypair.name, keypair.message);
            return;
        }
        this._setCurrentUser(keypair);
        this._bump();
        this._saveToLocalStorage();
    }
    logIn(keypair: AuthorKeypair): ValidationError | true {
        logEarthbarStore('logging in:');
        let valid = checkAuthorKeypairIsValid(keypair);
        if (isErr(valid)) {
            logEarthbarStore('keypair is not valid:', keypair);
            console.warn(valid.name, valid.message);
            return valid;
        }
        this._setCurrentUser(keypair);
        this._bump();
        this._saveToLocalStorage();
        return true;
    }
    setDisplayName(name: string): void {
        logEarthbarStore('setting display name:', name);
        if (this.currentUser === null) { return; }
        if (this.kit === null) { return; }
        this.currentUser.displayName = name;
        // TODO: this should instead use kit.LayerAbout, but for now
        // we're matching the path style used by earthstar-lobby.
        // proper way:
        //    let authorInfo = this.kit.layerAbout.getAuthorInfo(this.kit.authorKeypair.address)
        //    if (isErr(authorInfo)) { return; }
        //    this.kit.layerAbout.setMyAuthorProfile(this.kit.authorKeypair, {...authorInfo.profile, displayName: name});
        //
        // earthstar-lobby way
        let result = this.kit.storage.set(this.currentUser.authorKeypair, {
            format: 'es.4',
            path: `/about/~${this.currentUser.authorKeypair.address}/displayName.txt`,
            content: name,
        });
        if (result !== WriteResult.Accepted) { console.warn(result); }
        this._bump();
        this._saveToLocalStorage();
    }
    logOutUser(): void {
        logEarthbarStore('logging out');
        this.currentUser = null;
        this._setCurrentUser(null);
        this._bump();
        this._saveToLocalStorage();
    }
    //--------------------------------------------------
    // PUBS OF CURRENT WORKSPACE
    addPub(pub: string): void {
        if (!pub.endsWith('/')) { pub += '/'; }
        logEarthbarStore('addPub', pub);
        if (this.currentWorkspace === null) {
            console.warn("can't add pub because current workspace is null");
            return;
        }
        if (this.currentWorkspace.pubs.indexOf(pub) !== -1) {
            // pub already exists
            return;
        }
        this.currentWorkspace.pubs.push(pub);
        //this.currentWorkspace.pubs.sort();
        this.kit?.syncer.addPub(pub);
        this._bump();
        this._saveToLocalStorage();
    }
    removePub(pub: string): void {
        if (!pub.endsWith('/')) { pub += '/'; }
        logEarthbarStore('removePub', pub);
        if (this.currentWorkspace === null) {
            console.warn("can't remove pub because current workspace is null");
            return;
        }
        this.currentWorkspace.pubs = this.currentWorkspace.pubs.filter(p => p !== pub);
        this.kit?.syncer.removePub(pub);
        this._bump();
        this._saveToLocalStorage();
    }
    //--------------------------------------------------
    // WORKSPACES
    /*
    TODO: remove this
    hasWorkspace(workspaceAddress: WorkspaceAddress): boolean {
        if (this.currentWorkspace?.workspaceAddress === workspaceAddress) { return true; }
        if (this.otherWorkspaces.filter(wc => wc.workspaceAddress === workspaceAddress).length >= 1) { return true; }
        return false;
    }
    */
    removeWorkspace(workspaceAddress: WorkspaceAddress) {
        logEarthbarStore('removeWorkspace', workspaceAddress);
        Kit.deleteWorkspaceFromLocalStorage(workspaceAddress);
        if (this.currentWorkspace?.workspaceAddress === workspaceAddress) {
            this.currentWorkspace = null;
            if (this.currentUser !== null) {
                this.currentUser.displayName = null;
            }
            this._rebuildKit();
        } else {
            this.otherWorkspaces = this.otherWorkspaces.filter(wc => wc.workspaceAddress !== workspaceAddress);
        }
        this._bump();
        this._saveToLocalStorage();
    }
    switchWorkspace(workspaceConfig: WorkspaceConfig | null): void {
        // this also works to add a new workspace
        // TODO: don't use this to modify pubs of an existing workspace; it might cause duplicates
        // TODO: change this to only accept a workspaceAddress as input
        logEarthbarStore('switchWorkspace', workspaceConfig);
        // nop
        if (deepEqual(workspaceConfig, this.currentWorkspace)) { return; }
        // remove from otherWorkspaces in case it's there
        if (workspaceConfig !== null) {
            this.otherWorkspaces = this.otherWorkspaces.filter(o => o.workspaceAddress !== workspaceConfig.workspaceAddress);
        }
        // stash current workspace if there is one
        if (this.currentWorkspace !== null) {
            this.otherWorkspaces.push(this.currentWorkspace);
        }
        sortByField(this.otherWorkspaces, 'workspaceAddress');
        // save new workspace as current
        this.currentWorkspace = workspaceConfig;
        // rebuild the kit
        if (workspaceConfig === null) {
            logEarthbarStore(`rebuilding kit: it's null`);
        } else {
            logEarthbarStore(`rebuilding kit for ${workspaceConfig.workspaceAddress} with ${workspaceConfig.pubs.length} pubs`);
        }
        this._rebuildKit();
        this._bump();
        this._saveToLocalStorage();
    }
}