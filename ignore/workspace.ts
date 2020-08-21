import {
    IStorage,
    WorkspaceAddress,
    AuthorKeypair,
    Syncer,
    LayerAbout,
    LayerWiki,
} from 'earthstar';

export class Workspace {
    storage : IStorage;
    address : WorkspaceAddress;
    authorKeypair : AuthorKeypair | null;
    syncer : Syncer;
    layerAbout : LayerAbout;
    layerWiki : LayerWiki;
    constructor(storage : IStorage, authorKeypair : AuthorKeypair | null) {
        this.storage = storage;
        this.address = storage.workspace;
        this.authorKeypair = authorKeypair;
        this.syncer = new Syncer(storage);
        this.layerAbout = new LayerAbout(storage);
        this.layerWiki = new LayerWiki(storage);
    }
}
