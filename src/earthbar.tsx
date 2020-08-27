import { deepEqual } from 'fast-equals';
import * as React from 'react';

import {
    AuthorAddress,
    WorkspaceAddress,
    Emitter,
    StorageMemory,
    ValidatorEs4,
} from 'earthstar';

import { Workspace } from './workspace';
import { sortByField } from './util';

let logEarthbar = (...args : any[]) => console.log('earthbar view |', ...args);
let logEarthbarStore = (...args : any[]) => console.log('    earthbar store |', ...args);

//================================================================================
// EARTHBAR TYPES & STORE

export let EarthstarCtx = React.createContext<Workspace | null>(null);

export interface UserConfig {
    authorAddress: AuthorAddress,
    displayName: string,
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
    workspace: Workspace | null = null;
    onChange: Emitter<null> = new Emitter<null>();
    constructor() {
        this.currentUser = {
            authorAddress: '@suzy.bxxxxx',
            displayName: 'Suzy',
        };
        this.currentWorkspace = {
            workspaceAddress: '+gardening.foo',
            pubs: ['https://mypub.org', 'https://my-gardening-pub.glitch.com'],
        };
        this.otherUsers = [
            {
                authorAddress: '@fern.bxxxxx',
                displayName: 'Fernie',
            },
        ];
        this.otherWorkspaces = [
            {
                workspaceAddress: '+sailing.foo',
                pubs: ['https://pub.sailing.org'],
            },
            {
                workspaceAddress: '+solarpunk.foo',
                pubs: ['https://mypub.org', 'https://my-solarpunk-pub.glitch.com'],
            },
        ];
        this.workspace = new Workspace(
            new StorageMemory([ValidatorEs4], this.currentWorkspace.workspaceAddress),
            null // author keypair
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
            this.workspace = null;
        } else {
            this.workspace = new Workspace(
                new StorageMemory([ValidatorEs4], workspaceConfig.workspaceAddress),
                null // author keypair
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
            panel = <EarthbarWorkspacePage store={store} />;
        } else if (view === EbMode.User) {
            panel = <EarthbarUserPage store={store} />;
        }

        // style to hide children when a panel is open
        let sChildren : React.CSSProperties =
            view === EbMode.Closed
            ? { }
            : { visibility: 'hidden' };

        return (
            <EarthstarCtx.Provider value={store.workspace}>
                <div>
                    <div className='flexRow'>
                        <button className='flexItem earthbarTab' style={sWorkspaceTab} onClick={onClickWorkspaceTab}>
                            {store.currentWorkspace?.workspaceAddress || 'Add a workspace'}
                        </button>
                        <div className='flexItem' style={{flexGrow: 1}} />
                        <button className='flexItem earthbarTab' style={sUserTab} onClick={onClickUserTab}>
                            {store.currentUser?.authorAddress || 'Guest' }
                        </button>
                    </div>
                    <div style={{position: 'relative'}}>
                        <div style={{position: 'absolute', zIndex: 99, left: 0, right: 0}}>{panel}</div>
                        <div style={sChildren}>{this.props.children}</div>
                    </div>
                </div>
            </EarthstarCtx.Provider>
        );
    }
}

export const EarthbarWorkspacePage: React.FunctionComponent<EbPanelProps> = (props) => {
    let sPanel = {
        padding: 'var(--s0)',
        // change colors
        '--cBackground': 'var(--cWorkspace)',
        '--cText': 'var(--cWhite)',
        // apply color variables
        background: 'var(--cBackground)',
        color: 'var(--cText)',
    } as React.CSSProperties;
    let store = props.store;
    let pubText = '';
    if (store.currentWorkspace !== null) {
        pubText = store.currentWorkspace.pubs.join('\n');
    }
    return <div className='stack' style={sPanel}>
        {store.currentWorkspace === null
          ? <div className='faint'>Choose a workspace:</div>
          : [
                <div key='a'>
                    <button className='button'>Sync</button>
                </div>,
                <div key='b' className='faint'>Pubs (one per line)</div>,
                <div key='c'>
                    <textarea className='indent' style={{width: '80%'}} rows={3}
                        value={pubText}
                        onChange={(e) => {
                            let pubs = e.target.value.split('\n').map(x => x.trim()).filter(x => x !== '');
                            store.setPubs(pubs);
                        }}
                        />
                </div>,
                <hr key='d' className='faint' />,
                <div key='e' className='faint'>Other workspaces</div>,
            ]
        }
        <div className='stack indent'>
            {store.otherWorkspaces.map(wsConfig =>
                <a href="#" className='linkbutton block' key={wsConfig.workspaceAddress}
                    onClick={(e) => store.switchWorkspace(wsConfig)}
                    >
                    {wsConfig.workspaceAddress}
                </a>
            )}
            {store.otherWorkspaces ? <div>&nbsp;</div> : null}
            <a href="#" className='linkbutton block'>Join workspace</a>
            <a href="#" className='linkbutton block'>Create new workspace</a>
        </div>
    </div>;
}

export const EarthbarUserPage: React.FunctionComponent<EbPanelProps> = (props) =>
    <div style={{padding: 'var(--s0)', color: 'var(--cWhite)', background: 'var(--cUser)'}}>
        Hello this is the user config page<br/><br/>
        Hello this is the user config page<br/><br/>
        Hello this is the user config page
    </div>
