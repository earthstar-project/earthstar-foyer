import { deepEqual } from 'fast-equals';
import * as React from 'react';

import {
    AuthorAddress,
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

let logEarthbar = (...args : any[]) => console.log('earthbar view |', ...args);
let logEarthbarStore = (...args : any[]) => console.log('    earthbar store |', ...args);

//================================================================================
// EARTHBAR TYPES & STORE

export let EarthstarKitCtx = React.createContext<Kit | null>(null);

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
    mode: EbMode = EbMode.Closed;  // which tab are we looking at
    currentUser: UserConfig | null = null;
    currentWorkspace: WorkspaceConfig | null = null;
    otherUsers: UserConfig[] = [];
    otherWorkspaces: WorkspaceConfig[] = [];
    kit: Kit | null = null;
    onChange: Emitter<null> = new Emitter<null>();
    constructor() {
        this.currentUser = {
            authorKeypair: {
                address: '@suzy.bzrjm4jnvr5luvbgls5ryqrq7jolqw3v5p2cmpabcsoczyhdrdjga',
                secret: 'bugskupxnwtjt56rsyusoh5oo5x74uoy3kikftv32swmskvw36m7a',
            },
            displayName: 'Suzy',
        };
        this.currentWorkspace = {
            workspaceAddress: '+gardening.w092jf0q9fj09',
            pubs: [
                'https://my-gardening-pub.glitch.com',
                'https://mypub.org',
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
                workspaceAddress: '+sailing.pals',
                pubs: [
                    'https://pub.sailing.org'
                ],
            },
            {
                workspaceAddress: '+solarpunk.j0p9ja83j38',
                pubs: [
                    'https://my-solarpunk-pub.glitch.com',
                    'https://mypub.org',
                ],
            },
        ];
        this._load();
        this._save();
        this.kit = new Kit(
            new StorageMemory([ValidatorEs4], this.currentWorkspace.workspaceAddress),
            this.currentUser === null ? null : this.currentUser.authorKeypair,
            this.currentWorkspace.pubs,
        );
    }
    _bump() {
        this.onChange.send(null);
    }
    _save() {
        logEarthbarStore('_save to localStorage');
        localStorage.setItem('earthbar', JSON.stringify({
            //mode: this.mode,
            currentUser: this.currentUser,
            currentWorkspace: this.currentWorkspace,
            otherUsers: this.otherUsers,
            otherWorkspaces: this.otherWorkspaces,
        }));
    }
    _load() {
        try {
            let s = localStorage.getItem('earthbar');
            if (s === null) {
                logEarthbarStore('_load from localStorage: not found');
                return;
            }
            logEarthbarStore('_load from localStorage: parsing...');
            let parsed = JSON.parse(s);
            if (!parsed.currentUser || !parsed.currentWorkspace || !parsed.otherUsers || !parsed.otherWorkspaces) {
                logEarthbarStore('_load from localStorage: ...unexpected data format');
                return;
            }
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
        logEarthbarStore('addPub', pub);
        if (this.currentWorkspace === null) {
            console.warn("can't add pub because current workspace is null");
            return;
        }
        if (this.currentWorkspace.pubs.indexOf(pub) !== -1) {
            // pub already exists
            return;
        }
        // TODO: update kit.syncer's pubs?
        this.currentWorkspace.pubs.push(pub);
        this.currentWorkspace.pubs.sort();
        this.kit?.syncer.addPub(pub);
        logEarthbarStore('syncer pub state:', this.kit?.syncer.state.pubs);
        this._bump();
        this._save();
    }
    removePub(pub: string): void {
        logEarthbarStore('removePub', pub);
        if (this.currentWorkspace === null) {
            console.warn("can't remove pub because current workspace is null");
            return;
        }
        // TODO: update kit.syncer's pubs?
        this.currentWorkspace.pubs = this.currentWorkspace.pubs.filter(p => p !== pub);
        this.kit?.syncer.removePub(pub);
        logEarthbarStore('syncer pub state:', this.kit?.syncer.state.pubs);
        this._bump();
        this._save();
    }
    //--------------------------------------------------
    // WORKSPACES
    hasWorkspace(workspaceAddress: WorkspaceAddress): boolean {
        if (this.currentWorkspace?.workspaceAddress === workspaceAddress) { return true; }
        if (this.otherWorkspaces.filter(wc => wc.workspaceAddress === workspaceAddress).length >= 1) { return true; }
        return false;
    }
    addWorkspace(workspaceAddress: WorkspaceAddress) {
        logEarthbarStore('addWorkspace', workspaceAddress);
        // don't allow adding the same workspace twice
        if (this.hasWorkspace(workspaceAddress)) { return; }
        // stash current workspace if there is one
        if (this.currentWorkspace !== null) {
            this.otherWorkspaces.push(this.currentWorkspace);
        }
        sortByField(this.otherWorkspaces, 'workspaceAddress');
        // set new workspace as current
        this.currentWorkspace = {
            workspaceAddress: workspaceAddress,
            pubs: [],  // pubs start out empty, I guess
        }
        this._bump();
        this._save();
    }
    removeWorkspace(workspaceAddress: WorkspaceAddress) {
        logEarthbarStore('removeWorkspace', workspaceAddress);
        if (this.currentWorkspace?.workspaceAddress === workspaceAddress) {
            this.currentWorkspace = null;
            this.kit = null;
        } else {
            this.otherWorkspaces = this.otherWorkspaces.filter(wc => wc.workspaceAddress !== workspaceAddress);
        }
        this._bump();
        this._save();
    }
    switchWorkspace(workspaceConfig: WorkspaceConfig | null): void {
        // TODO: don't use this to modify pubs of an existing workspace; it might cause duplicates
        // TODO: change this to only accept a workspaceAddress as input
        logEarthbarStore('setWorkspaceConfig', workspaceConfig);
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
            this.kit = null;
        } else {
            logEarthbarStore(`rebuilding kit for ${workspaceConfig.workspaceAddress} with ${workspaceConfig.pubs.length} pubs`);
            this.kit = new Kit(
                new StorageMemory([ValidatorEs4], workspaceConfig.workspaceAddress),
                this.currentUser === null ? null : this.currentUser.authorKeypair,
                workspaceConfig.pubs,
            );
        }
        this._bump();
        this._save();
    }
}

//================================================================================
// EARTHBAR

export interface EbPanelProps {
    store : EarthbarStore,
}

export interface EbProps {
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
            ? { color: 'var(--cWhite)', background: 'var(--cWorkspace)' }
            : { color: 'var(--cWorkspace)', background: 'none' };
        let sUserTab : React.CSSProperties =
            view === EbMode.User
            ? { color: 'var(--cWhite)', background: 'var(--cUser)' }
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
            : { /*visibility: 'hidden'*/ };

        let workspaceString = 'Add a workspace';
        if (store.currentWorkspace) {
            workspaceString = ellipsifyAddress(store.currentWorkspace.workspaceAddress);
        }

        let userString = 'Guest';
        if (store.currentUser) {
            userString = ellipsifyAddress(store.currentUser.authorKeypair.address);
        }

        return (
            <EarthstarKitCtx.Provider value={store.kit}>
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
                        <div style={sChildren}>{this.props.children}</div>
                    </div>
                </div>
            </EarthstarKitCtx.Provider>
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
    borderTopRightRadius: 'var(--slightlyRound)',
    borderBottomLeftRadius: 'var(--slightlyRound)',
    borderBottomRightRadius: 'var(--slightlyRound)',
} as React.CSSProperties;
let sUserPanel : React.CSSProperties = {
    padding: 'var(--s0)',
    // change colors
    '--cBackground': 'var(--cUser)',
    '--cText': 'var(--cWhite)',
    // apply color variables
    background: 'var(--cBackground)',
    color: 'var(--cText)',
    borderTopLeftRadius: 'var(--slightlyRound)',
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 'var(--slightlyRound)',
    borderBottomRightRadius: 'var(--slightlyRound)',
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
            this.props.store.addWorkspace(newWorkspace);
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

        return <div className='stack' style={sWorkspacePanel}>
            {/* current workspace details */}
            {store.currentWorkspace === null
            ? null
            : <div className='stack'>
                    <div className='faint'>Current workspace:</div>
                    <div className='stack indent'>
                        <pre>{store.currentWorkspace.workspaceAddress}</pre>
                        <div className='faint'>Pub Servers:</div>
                        <div className='stack indent'>
                            {store.currentWorkspace.pubs.length === 0
                              ? <div><button className='button' disabled={true}>Sync</button> (Add pub server(s) to enable sync)</div>
                              : <div><button className='button'>Sync</button></div>
                            }
                            {store.currentWorkspace.pubs.map(pub =>
                                <div key={pub} className='flexRow'>
                                    <div className='flexItem flexGrow-1'>{pub}</div>
                                    <button className='flexItem linkButton'
                                        onClick={() => store.removePub(pub)}
                                        >
                                        &#x2715;
                                    </button>
                                </div>
                            )}
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
            {/* list of workspaces */}
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
