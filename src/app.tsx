import * as React from 'react';
import * as ReactDOM from 'react-dom';

let logHello = (...args : any[]) => console.log('Hello |', ...args);

//================================================================================
// CONFIG

//================================================================================
// EARTHBAR TYPES

interface UserConfig {
    authorAddress: string,
    displayName: string,
}
interface WorkspaceConfig {
    workspaceAddress: string,
    pubs: string[],
}
enum EbMode {
    Closed,
    Workspace,
    User,
}

//================================================================================
// EARTHBAR STATE

interface EbProps {
}

interface EbState {
    mode: EbMode,  // which tab are we looking at
    currentUser: UserConfig | null,
    currentWorkspace: WorkspaceConfig | null,
    otherUsers: UserConfig[],
    otherWorkspaces: WorkspaceConfig[],
}

let ebApi = {
    setView: (state: EbState, mode: EbMode) : EbState => {
        return {...state, mode: mode};
    },
};

//================================================================================
// EARTHBAR

export class Earthbar extends React.Component<EbProps, EbState> {
    constructor(props: EbProps) {
        super(props);
        this.state = {
            mode: EbMode.Closed,
            currentUser: null,
            currentWorkspace: null,
            otherUsers: [],
            otherWorkspaces: [],
        }
    }
    render() {
        logHello('render');
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
            panel = <EarthbarWorkspacePage />;
        } else if (view === EbMode.User) {
            panel = <EarthbarUserPage />;
        }

        // style to hide children when a panel is open
        let sChildren : React.CSSProperties =
            view === EbMode.Closed
            ? { }
            : { visibility: 'hidden' };

        return <div>
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
    }
}

export const EarthbarWorkspacePage: React.FunctionComponent<any> = (props) =>
    <div style={{padding: 'var(--s0)', color: 'var(--cWhite)', background: 'var(--cWorkspace)'}}>
        Hello this is the workspace config page<br/><br/>
        Hello this is the workspace config page<br/><br/>
        Hello this is the workspace config page
    </div>

export const EarthbarUserPage: React.FunctionComponent<any> = (props) =>
    <div style={{padding: 'var(--s0)', color: 'var(--cWhite)', background: 'var(--cUser)'}}>
        Hello this is the user config page<br/><br/>
        Hello this is the user config page<br/><br/>
        Hello this is the user config page
    </div>

//================================================================================
// LAYOUTS

export const App: React.FunctionComponent<any> = (props) =>
    <div style={{padding: 'var(--s0)'}}>
        1 Hello this is the app content<br/><br/>
        2 Hello this is the app content<br/><br/>
        3 Hello this is the app content<br/><br/>
        4 Hello this is the app content<br/><br/>
        5 Hello this is the app content<br/><br/>
        6 Hello this is the app content<br/><br/>
        7 Hello this is the app content<br/><br/>
        8 Hello this is the app content<br/><br/>
        9 Hello this is the app content
    </div>

export const PageColumn: React.FunctionComponent<any> = (props) =>
    <div className='pageColumn'>{props.children}</div>;

//================================================================================
// MAIN

ReactDOM.render(
    <PageColumn>
        <Earthbar>
            <App />
        </Earthbar>
    </PageColumn>,
    document.getElementById('react-slot')
);
