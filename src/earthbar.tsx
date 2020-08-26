import { deepEqual } from 'fast-equals';
import * as React from 'react';

import {
    AuthorAddress,
    WorkspaceAddress,
} from 'earthstar';

import { Workspace } from './workspace';
import { sortByField } from './util';

let logEarthbarMain = (...args : any[]) => console.log('earthbar main |', ...args);
let logEarthbarApi = (...args : any[]) => console.log('earthbar api |', ...args);

//================================================================================
// EARTHBAR TYPES

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

//================================================================================
// EARTHBAR STATE

export interface EbProps {
}

export interface EbState {
    mode: EbMode,  // which tab are we looking at
    currentUser: UserConfig | null,
    currentWorkspace: WorkspaceConfig | null,
    otherUsers: UserConfig[],
    otherWorkspaces: WorkspaceConfig[],
    workspace: Workspace | null,
}

export let ebApi = {
    initial: (): EbState => {
        return {
            mode: EbMode.Closed,
            currentUser: {
                authorAddress: '@suzy.bxxxxx',
                displayName: 'Suzy',
            },
            currentWorkspace: {
                workspaceAddress: '+gardening.foo',
                pubs: ['https://mypub.org', 'https://my-gardening-pub.glitch.com'],
            },
            otherUsers: [
                {
                    authorAddress: '@fern.bxxxxx',
                    displayName: 'Fernie',
                },
            ],
            otherWorkspaces: [
                {
                    workspaceAddress: '+sailing.foo',
                    pubs: ['https://pub.sailing.org'],
                },
                {
                    workspaceAddress: '+solarpunk.foo',
                    pubs: ['https://mypub.org', 'https://my-solarpunk-pub.glitch.com'],
                },
            ],
            workspace: null,
        }
    },
    setMode: (state: EbState, mode: EbMode): EbState => {
        logEarthbarApi('setMode', mode);

        // nop
        if (mode === state.mode) { return state; }

        return {...state, mode: mode};
    },
    setPubs: (state: EbState, pubs: string[]): EbState => {
        logEarthbarApi('setPubs', pubs);
        if (state.currentWorkspace === null) {
            console.warn("can't set pubs because current workspace is null");
            return state;
        }

        // nop
        if (pubs === state.currentWorkspace.pubs) { return state; }

        return {
            ...state,
            currentWorkspace: {
                ...state.currentWorkspace,
                pubs: pubs,
            }
        }
    },
    switchWorkspace: (state: EbState, workspaceConfig: WorkspaceConfig | null): EbState => {
        logEarthbarApi('setWorkspaceConfig', workspaceConfig);

        // nop
        if (deepEqual(workspaceConfig, state.currentWorkspace)) { return state; }

        // remove from other workspaces
        let otherWorkspaces : WorkspaceConfig[];
        if (workspaceConfig === null) {
            otherWorkspaces = [...state.otherWorkspaces];
        } else {
            otherWorkspaces = state.otherWorkspaces.filter(o => o.workspaceAddress !== workspaceConfig.workspaceAddress);
        }
        // remember current workspace if there is one
        if (state.currentWorkspace !== null) {
            otherWorkspaces.push(state.currentWorkspace);
        }
        let newState = {
            ...state,
            currentWorkspace: workspaceConfig,
            otherWorkspaces: sortByField(otherWorkspaces, 'workspaceAddress'),
        }
        logEarthbarApi(state, newState);
        return newState;
    },
};


export interface EbPanelProps {
    ebStateOwner: Earthbar,  // the main component that holds the state
    ebState: EbState,  // the state itself
}

//================================================================================
// EARTHBAR

export class Earthbar extends React.Component<EbProps, EbState> {
    constructor(props: EbProps) {
        super(props);
        this.state = ebApi.initial();
    }
    render() {
        logEarthbarMain(`render in ${this.state.mode} mode`);
        let view = this.state.mode;

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
            ? (e: any) => this.setState(ebApi.setMode(this.state, EbMode.Closed))
            : (e: any) => this.setState(ebApi.setMode(this.state, EbMode.Workspace));
        let onClickUserTab =
            view === EbMode.User
            ? (e: any) => this.setState(ebApi.setMode(this.state, EbMode.Closed))
            : (e: any) => this.setState(ebApi.setMode(this.state, EbMode.User));

        // which panel to show
        let panel : JSX.Element | null = null;
        if (view === EbMode.Workspace) {
            panel = <EarthbarWorkspacePage ebStateOwner={this} ebState={this.state} />;
        } else if (view === EbMode.User) {
            panel = <EarthbarUserPage ebStateOwner={this} ebState={this.state} />;
        }

        // style to hide children when a panel is open
        let sChildren : React.CSSProperties =
            view === EbMode.Closed
            ? { }
            : { visibility: 'hidden' };

        return (
            <EarthstarCtx.Provider value={this.state.workspace}>
                <div>
                    <div className='flexRow'>
                        <button className='flexItem earthbarTab' style={sWorkspaceTab} onClick={onClickWorkspaceTab}>
                            {this.state.currentWorkspace?.workspaceAddress || 'Add a workspace'}
                        </button>
                        <div className='flexItem' style={{flexGrow: 1}} />
                        <button className='flexItem earthbarTab' style={sUserTab} onClick={onClickUserTab}>
                            {this.state.currentUser?.authorAddress || 'Guest' }
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
    let ebState = props.ebState;
    let pubText = '';
    if (ebState.currentWorkspace !== null) {
        pubText = ebState.currentWorkspace.pubs.join('\n');
    }
    return <div className='stack' style={sPanel}>
        {ebState.currentWorkspace === null
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
                            props.ebStateOwner.setState(ebApi.setPubs(ebState, pubs))
                        }}
                        />
                </div>,
                <hr key='d' className='faint' />,
                <div key='e' className='faint'>Other workspaces</div>,
            ]
        }
        <div className='stack indent'>
            {ebState.otherWorkspaces.map(wsConfig =>
                <a href="#" className='linkbutton block' key={wsConfig.workspaceAddress}
                    onClick={(e) => {
                        let newState = ebApi.switchWorkspace(ebState, wsConfig);
                        props.ebStateOwner.setState(newState);
                    }}
                    >
                    {wsConfig.workspaceAddress}
                </a>
            )}
            {ebState.otherWorkspaces ? <div>&nbsp;</div> : null}
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
