import * as React from 'react';

import {
    AuthorAddress,
    WorkspaceAddress,
} from 'earthstar';

import { Workspace } from './workspace';

let logEarthbar = (...args : any[]) => console.log('Hello |', ...args);

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
    Closed,
    Workspace,
    User,
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
            currentUser: null,
            currentWorkspace: null,
            otherUsers: [],
            otherWorkspaces: [],
            workspace: null,
        }
    },
    setView: (state: EbState, mode: EbMode) : EbState => {
        return {...state, mode: mode};
    },
};

export interface EbPanelProps {
    ebState: EbState,
}

//================================================================================
// EARTHBAR

export class Earthbar extends React.Component<EbProps, EbState> {
    constructor(props: EbProps) {
        super(props);
        this.state = ebApi.initial();
    }
    render() {
        logEarthbar('render');
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
            ? (e: any) => this.setState(ebApi.setView(this.state, EbMode.Closed))
            : (e: any) => this.setState(ebApi.setView(this.state, EbMode.Workspace));
        let onClickUserTab =
            view === EbMode.User
            ? (e: any) => this.setState(ebApi.setView(this.state, EbMode.Closed))
            : (e: any) => this.setState(ebApi.setView(this.state, EbMode.User));

        // which panel to show
        let panel : JSX.Element | null = null;
        if (view === EbMode.Workspace) {
            panel = <EarthbarWorkspacePage ebState={this.state} />;
        } else if (view === EbMode.User) {
            panel = <EarthbarUserPage ebState={this.state} />;
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
                            +gardening.pals
                        </button>
                        <div className='flexItem' style={{flexGrow: 1}} />
                        <button className='flexItem earthbarTab' style={sUserTab} onClick={onClickUserTab}>
                            @suzy.bxxxx...
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
    return <div className='stack' style={sPanel}>
        <div>
            <button className='button'>Sync</button>
        </div>
        <div className='faint'>Pubs (one per line)</div>
        <div>
            <textarea className='indent' style={{width: '80%'}}>https:...</textarea>
        </div>
        <hr className='faint' />
        <div className='faint'>Other workspaces</div>
        <div className='stack indent'>
            <div className='bold'>+bar.pals</div>
            <div className='bold'>+foo.stuff</div>
            <div>&nbsp;</div>
            <div className='bold'>Join workspace</div>
            <div className='bold'>Create new workspace</div>
        </div>
    </div>;
}

export const EarthbarUserPage: React.FunctionComponent<EbPanelProps> = (props) =>
    <div style={{padding: 'var(--s0)', color: 'var(--cWhite)', background: 'var(--cUser)'}}>
        Hello this is the user config page<br/><br/>
        Hello this is the user config page<br/><br/>
        Hello this is the user config page
    </div>
