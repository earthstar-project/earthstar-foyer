import {
    AuthorKeypair,
    IStorage,
    LayerAbout,
    LayerWiki,
    Syncer,
    WorkspaceAddress,
} from 'earthstar';

import { exampleLobbyDocuments } from './exampledata';

// All the various pieces of Earthstar stuff for a workspace
export class Kit {
    storage: IStorage;
    workspaceAddress: WorkspaceAddress;
    authorKeypair: AuthorKeypair | null;
    syncer: Syncer;
    layerAbout: LayerAbout;
    layerWiki: LayerWiki;
    constructor(storage: IStorage, authorKeypair: AuthorKeypair | null, pubs: string[]) {
        this.storage = storage;
        this.workspaceAddress = storage.workspace;
        this.authorKeypair = authorKeypair;
        this.syncer = new Syncer(storage);
        for (let pub of pubs) {
            this.syncer.addPub(pub);
        }
        this.layerAbout = new LayerAbout(storage);
        this.layerWiki = new LayerWiki(storage);

        // ENORMOUS HACK: import lobbydev data when making a kit with that workspace
        if (this.workspaceAddress === '+lobbydev.a1') {
            for (let doc of exampleLobbyDocuments) {
                this.storage.ingestDocument(doc);
            }
        }

    }
}
