import debounce = require('lodash.debounce');

import {
    AuthorKeypair,
    IStorage,
    LayerAbout,
    LayerWiki,
    Syncer,
    WorkspaceAddress,
    StorageMemory,
    OnePubOneWorkspaceSyncer,
} from 'earthstar';

import {
    logKit,
} from './log';

//================================================================================

// All the various pieces of Earthstar stuff for a workspace
export class Kit {
    storage: IStorage;
    workspaceAddress: WorkspaceAddress;
    authorKeypair: AuthorKeypair | null;
    layerAbout: LayerAbout;
    layerWiki: LayerWiki;
    syncers: Record<string, OnePubOneWorkspaceSyncer>;
    constructor(storage: IStorage, authorKeypair: AuthorKeypair | null, pubs: string[]) {
        this.storage = storage;
        this.workspaceAddress = storage.workspace;
        this.authorKeypair = authorKeypair;

        this.syncers = {}
        for (let pub of pubs) {
            this.syncers[pub] = new OnePubOneWorkspaceSyncer(this.storage, pub);
        }

        this.layerAbout = new LayerAbout(storage);
        this.layerWiki = new LayerWiki(storage);

        // HACK to persist the memory storage to localStorage
        logKit('loading workspace data from localStorage...');
        let localStorageKey = `earthstar:${this.workspaceAddress}`;
        let existingData = localStorage.getItem(localStorageKey);
        let numLoaded = 0;
        if (existingData !== null) {
            //let existingDocs = JSON.parse(existingData);
            //for (let doc of existingDocs) {
            //    this.storage.ingestDocument(doc);
            //    numLoaded += 1;
            //}
            (storage as StorageMemory)._docs = JSON.parse(existingData);
        }
        logKit('/loaded from localStorage');

        // saving will get triggered on every incoming document, so we should debounce it
        let saveToLocalStorage = () => {
            console.log('SAVING=====================================');
            localStorage.setItem(localStorageKey, JSON.stringify((storage as StorageMemory)._docs));
        };
        let debouncedSave = debounce(saveToLocalStorage, 80, { trailing: true });
        storage.onWrite.subscribe(debouncedSave);
        // END HACK        
    }
    static deleteWorkspaceFromLocalStorage(workspaceAddress: WorkspaceAddress) {
        logKit('deleting workspace from localStorage:', workspaceAddress);
        let localStorageKey = `earthstar:${workspaceAddress}`;
        localStorage.removeItem(localStorageKey);
    }
}
