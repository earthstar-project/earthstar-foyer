import {
    AuthorKeypair,
    IStorage,
    LayerAbout,
    LayerWiki,
    Syncer,
    WorkspaceAddress,
} from 'earthstar';

// All the various pieces of Earthstar stuff for a workspace
export class Kit {
    storage : IStorage;
    workspaceAddress : WorkspaceAddress;
    authorKeypair : AuthorKeypair | null;
    syncer : Syncer;
    layerAbout : LayerAbout;
    layerWiki : LayerWiki;
    constructor(storage : IStorage, authorKeypair : AuthorKeypair | null) {
        this.storage = storage;
        this.workspaceAddress = storage.workspace;
        this.authorKeypair = authorKeypair;
        this.syncer = new Syncer(storage);
        this.layerAbout = new LayerAbout(storage);
        this.layerWiki = new LayerWiki(storage);
    }
}
