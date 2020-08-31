import { deepEqual } from 'fast-equals';
import * as React from 'react';

import {
    AuthorAddress,
    WorkspaceAddress,
    Emitter,
    StorageMemory,
    ValidatorEs4,
    AuthorKeypair,
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
            pubs: ['https://mypub.org', 'https://my-gardening-pub.glitch.com'],
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
                pubs: ['https://pub.sailing.org'],
            },
            {
                workspaceAddress: '+solarpunk.j0p9ja83j38',
                pubs: ['https://mypub.org', 'https://my-solarpunk-pub.glitch.com'],
            },
        ];
        this.kit = new Kit(
            new StorageMemory([ValidatorEs4], this.currentWorkspace.workspaceAddress),
            this.currentUser === null ? null : this.currentUser.authorKeypair,
        );
    }
    _bump() {
        this.onChange.send(null);
    }
    setMode(mode: EbMode): void {
        logEarthbarStore('setMode', mode);
        if (mode === this.mode) { return; }
        this.mode = mode;
        this._bump();
    }
    setPubs(pubs: string[]): void {
        logEarthbarStore('setPubs', pubs);
        if (this.currentWorkspace === null) {
            console.warn("can't set pubs because current workspace is null");
            return;
        }
        if (deepEqual(pubs, this.currentWorkspace.pubs)) { return; }
        this.currentWorkspace.pubs = pubs;
        this._bump();
    }
    addPub(pub: string): void {
        logEarthbarStore('addPub', pub);
        if (this.currentWorkspace === null) {
            console.warn("can't add pub because current workspace is null");
            return;
        }
        if (this.currentWorkspace.pubs.indexOf(pub) !== -1) {
            // already exists
            return;
        }
        this.currentWorkspace.pubs.push(pub);
        this.currentWorkspace.pubs.sort();
        this._bump();
    }
    removePub(pub: string): void {
        logEarthbarStore('removePub', pub);
        if (this.currentWorkspace === null) {
            console.warn("can't remove pub because current workspace is null");
            return;
        }
        this.currentWorkspace.pubs = this.currentWorkspace.pubs.filter(p => p !== pub);
        this._bump();
    }
    switchWorkspace(workspaceConfig: WorkspaceConfig | null): void {
        logEarthbarStore('setWorkspaceConfig', workspaceConfig);
        // nop
        if (deepEqual(workspaceConfig, this.currentWorkspace)) { return; }
        // remove from other workspaces
        if (workspaceConfig !== null) {
            this.otherWorkspaces = this.otherWorkspaces.filter(o => o.workspaceAddress !== workspaceConfig.workspaceAddress);
        }
        // remember current workspace if there is one
        if (this.currentWorkspace !== null) {
            this.otherWorkspaces.push(this.currentWorkspace);
        }
        sortByField(this.otherWorkspaces, 'workspaceAddress');
        this.currentWorkspace = workspaceConfig;
        if (workspaceConfig === null) {
            this.kit = null;
        } else {
            this.kit = new Kit(
                new StorageMemory([ValidatorEs4], workspaceConfig.workspaceAddress),
                this.currentUser === null ? null : this.currentUser.authorKeypair,
            );
        }
        this._bump();
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
        this.unsub = this.state.store.onChange.subscribe((v) => this.forceUpdate());
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
            : { visibility: 'hidden' };

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

export const EarthbarWorkspacePanel: React.FunctionComponent<EbPanelProps> = (props) => {
    let store = props.store;

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
                <div className='faint'>This workspace:</div>
                <div className='stack indent'>
                    <pre>{store.currentWorkspace.workspaceAddress}</pre>
                    <div className='faint'>Pubs:</div>
                    <div className='stack indent'>
                        <div><button className='button'>Sync</button></div>
                        {store.currentWorkspace.pubs.map(pub =>
                            <div key={pub} className='flexRow'>
                                <div className='flexItem' style={{flexGrow: 1}}>{pub}</div>
                                <button className='flexItem linkbutton'
                                    onClick={() => store.removePub(pub)}
                                    >
                                    &#x2715;
                                </button>
                            </div>
                        )}
                        <div className='flexRow'>
                            <input className='flexItem' type="text" placeholder="http://..." />
                            <button className='button flexItem'
                                style={{marginLeft: 'var(--s-1)'}}
                                onClick={() => store.addPub('TODO')}
                                >
                                Add
                            </button>
                        </div>
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
                return <a href="#" style={style} className='linkbutton block' key={wsConfig.workspaceAddress}
                    onClick={(e) => store.switchWorkspace(wsConfig)}
                    >
                    {wsConfig.workspaceAddress}
                </a>;
            })}
            {store.otherWorkspaces ? <div>&nbsp;</div> : null}
            <a href="#" className='linkbutton block'>Join workspace</a>
            <a href="#" className='linkbutton block'>Create new workspace</a>
        </div>
    </div>;
}

export const EarthbarUserPanel: React.FunctionComponent<EbPanelProps> = (props) =>
    <div style={sUserPanel}>
        Hello this is the user config page<br/><br/>
        Hello this is the user config page<br/><br/>
        Hello this is the user config page
    </div>
