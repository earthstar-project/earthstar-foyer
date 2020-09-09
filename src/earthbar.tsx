import { deepEqual } from 'fast-equals';
import * as React from 'react';

import {
    WorkspaceAddress,
    Emitter,
    StorageMemory,
    ValidatorEs4,
    AuthorKeypair,
    isErr,
    notErr,
} from 'earthstar';

import { Kit } from './kit';
import { sortByField, ellipsifyUserAddress as ellipsifyAddress } from './util';

let logEarthbar = (...args : any[]) => console.log('    earthbar view |', ...args);
let logEarthbarStore = (...args : any[]) => console.log('        earthbar store |', ...args);

//================================================================================
// EARTHBAR TYPES & STORE

export interface UserConfig {
    authorKeypair: AuthorKeypair,
    displayName: string | null,
}
export interface WorkspaceConfig {
    workspaceAddress: WorkspaceAddress,
    pubs: string[],
}
export enum EbMode {
    Closed = 'CLOSED',
    Workspace = 'WORKSPACE',
    User = 'USER',
}

export class EarthbarStore {
    // UI state
    mode: EbMode = EbMode.Closed;  // which tab are we looking at

    // state to preserve in localHost
    currentUser: UserConfig | null = null;
    currentWorkspace: WorkspaceConfig | null = null;
    otherUsers: UserConfig[] = [];
    otherWorkspaces: WorkspaceConfig[] = [];

    // non-JSON stuff
    kit: Kit | null = null;
    unsubSyncer: Thunk | null = null;
    onChange: Emitter<null> = new Emitter<null>();

    constructor() {
        logEarthbarStore('constructor');
        this.currentUser = {
            authorKeypair: {
                address: '@suzy.bzrjm4jnvr5luvbgls5ryqrq7jolqw3v5p2cmpabcsoczyhdrdjga',
                secret: 'bugskupxnwtjt56rsyusoh5oo5x74uoy3kikftv32swmskvw36m7a',
            },
            displayName: 'Suzy',
        };
        this.currentWorkspace = {
            workspaceAddress: '+lobbydev.a1',
            pubs: [
                'https://earthstar-demo-pub-v5-a.glitch.me/',
            ],
        };
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
        this.otherWorkspaces = [
            {
                workspaceAddress: '+emojiparty.fq0p48',
                pubs: [
                    'https://earthstar-demo-pub-v5-a.glitch.me/',
                ],
            },
        ];
        this._loadFromLocalStorage();
        this._saveToLocalStorage();
        // create initial kit
        if (this.currentWorkspace !== null) {
            this.kit = new Kit(
                new StorageMemory([ValidatorEs4], this.currentWorkspace.workspaceAddress),
                this.currentUser === null ? null : this.currentUser.authorKeypair,
                this.currentWorkspace.pubs,
            );
            this._subscribeToKit();
        }
        logEarthbarStore('/constructor');
    }
    _subscribeToKit() {
        // call this after making a new kit instance
        if (this.kit) {
            // get change events from the kit.syncer and pass them along into our own change feed
            this.unsubSyncer = this.kit.syncer.onChange.subscribe(() => this.onChange.send(null));
        }
    }
    _unsubFromKit() {
        // call this whenever changing the kit or setting it to null
        if (this.unsubSyncer) { this.unsubSyncer(); }
        this.unsubSyncer = null;
    }
    _bump() {
        // notify our subscribers of a change to the EarthbarStore's state
        logEarthbarStore('_bump');
        this.onChange.send(null);
    }
    _saveToLocalStorage() {
        logEarthbarStore('_save to localStorage');
        localStorage.setItem('earthbar', JSON.stringify({
            //mode: this.mode,
            currentUser: this.currentUser,
            currentWorkspace: this.currentWorkspace,
            otherUsers: this.otherUsers,
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
            this.otherUsers = parsed.otherUsers;
            this.otherWorkspaces = parsed.otherWorkspaces;
        } catch (e) {
            logEarthbarStore('_load from localStorage: error:');
            console.warn(e);
        }
    }
    //--------------------------------------------------
    // VISUAL STATE
    setMode(mode: EbMode): void {
        logEarthbarStore('setMode', mode);
        if (mode === this.mode) { return; }
        this.mode = mode;
        this._bump();
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
    hasWorkspace(workspaceAddress: WorkspaceAddress): boolean {
        if (this.currentWorkspace?.workspaceAddress === workspaceAddress) { return true; }
        if (this.otherWorkspaces.filter(wc => wc.workspaceAddress === workspaceAddress).length >= 1) { return true; }
        return false;
    }
    removeWorkspace(workspaceAddress: WorkspaceAddress) {
        logEarthbarStore('removeWorkspace', workspaceAddress);
        if (this.currentWorkspace?.workspaceAddress === workspaceAddress) {
            this.currentWorkspace = null;
            this._unsubFromKit();
            this.kit = null;
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
            this._unsubFromKit();
            this.kit = null;
        } else {
            logEarthbarStore(`rebuilding kit for ${workspaceConfig.workspaceAddress} with ${workspaceConfig.pubs.length} pubs`);
            this._unsubFromKit();
            this.kit = new Kit(
                new StorageMemory([ValidatorEs4], workspaceConfig.workspaceAddress),
                this.currentUser === null ? null : this.currentUser.authorKeypair,
                workspaceConfig.pubs,
            );
            this._subscribeToKit();
        }
        this._bump();
        this._saveToLocalStorage();
    }
}

//================================================================================
// EARTHBAR

export interface EbPanelProps {
    store : EarthbarStore,
}

export interface EbProps {
    app: React.ReactType,
}

export interface EbState {
    store : EarthbarStore,
}

type Thunk = () => void;
export class Earthbar extends React.Component<EbProps, EbState> {
    unsub: Thunk | null = null;
    constructor(props: EbProps) {
        super(props);
        this.state = { store: new EarthbarStore() };
    }
    componentDidMount() {
        this.unsub = this.state.store.onChange.subscribe((v) => {
            logEarthbar('forceUpdate from EarthbarStore');
            this.forceUpdate();
        });
    }
    componentWillUnmount() {
        if (this.unsub) { this.unsub(); this.unsub = null; }
    }
    render() {
        let store = this.state.store;
        logEarthbar(`render in ${store.mode} mode`);
        let view = store.mode;

        // tab styles
        let sWorkspaceTab : React.CSSProperties =
            view === EbMode.Workspace
            ? { color: 'var(--cWhite)', background: 'var(--cWorkspace)', opacity: 0.66 }
            : { color: 'var(--cWorkspace)', background: 'none' };
        let sUserTab : React.CSSProperties =
            view === EbMode.User
            ? { color: 'var(--cWhite)', background: 'var(--cUser)', opacity: 0.66 }
            : { color: 'var(--cUser)', background: 'none' };

        // tab click actions
        let onClickWorkspaceTab =
            view === EbMode.Workspace
            ? (e: any) => store.setMode(EbMode.Closed)
            : (e: any) => store.setMode(EbMode.Workspace);
        let onClickUserTab =
            view === EbMode.User
            ? (e: any) => store.setMode(EbMode.Closed)
            : (e: any) => store.setMode(EbMode.User);

        // which panel to show
        let panel : JSX.Element | null = null;
        if (view === EbMode.Workspace) {
            panel = <EarthbarWorkspacePanel store={store} />;
        } else if (view === EbMode.User) {
            panel = <EarthbarUserPanel store={store} />;
        }

        // style to hide children when a panel is open
        let sChildren : React.CSSProperties =
            view === EbMode.Closed
            ? { }
            : { opacity: 0.5, /*visibility: 'hidden'*/ };

        let workspaceString = 'Add a workspace';
        if (store.currentWorkspace) {
            workspaceString = ellipsifyAddress(store.currentWorkspace.workspaceAddress);
        }

        let userString = 'Guest User';
        if (store.currentUser) {
            userString = ellipsifyAddress(store.currentUser.authorKeypair.address);
        }

        let App = this.props.app;
        return (
            <div>
                <div className='flexRow'>
                    <button className='flexItem earthbarTab' style={sWorkspaceTab} onClick={onClickWorkspaceTab}>
                        {workspaceString}
                    </button>
                    <div className='flexItem' style={{flexGrow: 1}} />
                    <button className='flexItem earthbarTab' style={sUserTab} onClick={onClickUserTab}>
                        {userString}
                    </button>
                </div>
                <div style={{position: 'relative'}}>
                    <div style={{position: 'absolute', zIndex: 99, left: 0, right: 0}}>{panel}</div>
                    <div style={sChildren}>
                        {store.kit === null
                          ? null // don't render the app when there's no kit (no workspace)
                          // TODO: how should the app specify which changes it wants?  (storage, syncer)
                          // TODO: how to throttle changes here?
                          : <App kit={store.kit} changeKey={store.kit.storage.onChange.changeKey + '_' + store.kit.syncer.onChange.changeKey} />
                        }
                    </div>
                </div>
            </div>
        );
    }
}

//================================================================================
// EARTHBAR PANELS

let sWorkspacePanel : React.CSSProperties = {
    padding: 'var(--s0)',
    // change colors
    '--cBackground': 'var(--cWorkspace)',
    '--cText': 'var(--cWhite)',
    // apply color variables
    background: 'var(--cBackground)',
    color: 'var(--cText)',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 'var(--round)',
    borderBottomLeftRadius: 'var(--round)',
    borderBottomRightRadius: 'var(--round)',
    boxShadow: '0px 13px 10px 0px rgba(0,0,0,0.3)',
} as React.CSSProperties;

let sUserPanel : React.CSSProperties = {
    padding: 'var(--s0)',
    // change colors
    '--cBackground': 'var(--cUser)',
    '--cText': 'var(--cWhite)',
    // apply color variables
    background: 'var(--cBackground)',
    color: 'var(--cText)',
    borderTopLeftRadius: 'var(--round)',
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 'var(--round)',
    borderBottomRightRadius: 'var(--round)',
    boxShadow: '0px 13px 10px 0px rgba(0,0,0,0.3)',
} as React.CSSProperties;

interface EbWorkspacePanelState {
    newPubInput: string;
    newWorkspaceInput: string;
    newWorkspaceError: null | string;
}
export class EarthbarWorkspacePanel extends React.Component<EbPanelProps, EbWorkspacePanelState> {
    constructor(props: EbPanelProps) {
        super(props)
        this.state = {
            newPubInput: '',
            newWorkspaceInput: '',
            newWorkspaceError: null,
        }
    }
    handleAddPub() {
        let newPub = this.state.newPubInput.trim();
        if (newPub.length > 0) {
            this.props.store.addPub(newPub);
            this.setState({ newPubInput: '' });
        }
    }
    handleEditNewWorkspace(val : string) {
        if (val === '') {
            this.setState({
                newWorkspaceInput: '',
                newWorkspaceError: null,
            });
            return;
        }
        let parsed = ValidatorEs4.parseWorkspaceAddress(val);
        let err: string | null = null;
        if (isErr(parsed)) {
            err = parsed.message;
        }
        this.setState({
            newWorkspaceInput: val,
            newWorkspaceError: err,
        });
    }
    handleAddWorkspace() {
        let newWorkspace = this.state.newWorkspaceInput;
        let parsed = ValidatorEs4.parseWorkspaceAddress(newWorkspace);
        if (notErr(parsed)) {
            // can add a workspace by switching to it
            this.props.store.switchWorkspace({
                workspaceAddress: newWorkspace,
                pubs: []
            });
            this.setState({ newWorkspaceInput: '' });
        }
    }
    render() {
        let store = this.props.store;

        let pubs: string[] = [];
        let allWorkspaces: WorkspaceConfig[] = store.otherWorkspaces;
        if (store.currentWorkspace !== null) {
            pubs = store.currentWorkspace.pubs;
            allWorkspaces = [...allWorkspaces, store.currentWorkspace];
            sortByField(allWorkspaces, 'workspaceAddress');
        }

        let canSync = false;
        if (store.kit !== null) {
            canSync = store.kit.syncer.state.pubs.length >= 1 && store.kit.syncer.state.syncState !== 'syncing';
        }

        return <div className='stack' style={sWorkspacePanel}>
            {/* current workspace details */}
            {store.currentWorkspace === null
            ? null
            : <div className='stack'>
                    <div className='faint'>Current workspace:</div>
                    <div className='stack indent'>
                        {/* workspace address in a form easy to copy-paste */}
                        <pre>{store.currentWorkspace.workspaceAddress}</pre>
                        <div className='faint'>Pub Servers:</div>
                        <div className='stack indent'>
                            <div><button className='button'
                                disabled={!canSync}
                                onClick={() => store.kit?.syncer.sync()}
                                >
                                Sync
                            </button></div>
                            {/*
                                List of pubs.  We could get this from state.currentWorkspace.pubs
                                but instead let's get it from the Kit we built, from the Syncer,
                                because there we can also get current syncing status.
                            */}
                            {(store.kit === null ? [] : store.kit.syncer.state.pubs)
                                .map(pub => {
                                    let icon = '';
                                    if (pub.syncState === 'idle'   ) { icon = '📡'; }
                                    if (pub.syncState === 'syncing') { icon = '⏳'; }
                                    if (pub.syncState === 'success') { icon = '✅'; }
                                    if (pub.syncState === 'failure') { icon = '❗️'; }
                                    return <div key={pub.domain} className='flexRow'>
                                        <div className='flexItem flexGrow-1'>{icon} {pub.domain}</div>
                                        <button className='flexItem linkButton'
                                            onClick={() => store.removePub(pub.domain)}
                                            >
                                            &#x2715;
                                        </button>
                                    </div>
                                })
                            }
                            {/* Form to add new pub */}
                            <form className='flexRow' onSubmit={() => this.handleAddPub()}>
                                <input className='flexItem flexGrow-1' type="text"
                                    placeholder="http://..."
                                    value={this.state.newPubInput}
                                    onChange={(e) => this.setState({ newPubInput: e.target.value })}
                                    />
                                <button className='button flexItem'
                                    style={{marginLeft: 'var(--s-1)'}}
                                    type='submit'
                                    >
                                    Add Pub Server
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            }
            <hr className='faint' />
            {/* list of other workspaces */}
            <div className='faint'>Switch workspace:</div>
            <div className='stack indent'>
                {allWorkspaces.map(wsConfig => {
                    let isCurrent = wsConfig.workspaceAddress === store.currentWorkspace?.workspaceAddress;
                    let style : React.CSSProperties = isCurrent
                    ? {fontStyle: 'italic', background: 'rgba(255,255,255,0.2)'}
                    : {};
                    return <div key={wsConfig.workspaceAddress} className='flexRow'>
                        <a href="#" style={{...style, flexGrow: 1}} className='flexItem linkButton'
                            onClick={(e) => store.switchWorkspace(wsConfig)}
                            >
                            {wsConfig.workspaceAddress}
                        </a>
                        <button className='flexItem linkButton'
                            onClick={() => store.removeWorkspace(wsConfig.workspaceAddress)}
                            >
                            &#x2715;
                        </button>
                    </div>

                })}
                {/* form to add new workspace */}
                <form className='flexRow' onSubmit={() => this.handleAddWorkspace()}>
                    <input className='flexItem flexGrow-1' type="text"
                        placeholder="+foo.rjo34irqjf"
                        value={this.state.newWorkspaceInput}
                        onChange={(e) => this.handleEditNewWorkspace(e.target.value)}
                        />
                    <button className='button flexItem'
                        style={{marginLeft: 'var(--s-1)'}}
                        type='submit'
                        disabled={this.state.newWorkspaceError !== null}
                        >
                        Add Workspace
                    </button>
                </form>
                {/* validation error for new workspace form */}
                {this.state.newWorkspaceError === null
                  ? null
                  : <div className='right'>{this.state.newWorkspaceError}</div>
                }
            </div>
        </div>;
    }
}

export const EarthbarUserPanel: React.FunctionComponent<EbPanelProps> = (props) =>
    <div style={sUserPanel}>
        Hello this is the user config page<br/><br/>
        Hello this is the user config page<br/><br/>
        Hello this is the user config page
    </div>
