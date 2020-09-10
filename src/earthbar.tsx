import * as React from 'react';

import {
    ValidatorEs4,
    isErr,
    notErr,
} from 'earthstar';

import {
    WorkspaceConfig,
    EbMode,
    EarthbarStore,
} from './earthbarStore';
import {
    cutAtPeriod,
    sortByField,
} from './util';
import {
    logEarthbar,
} from './log';

//================================================================================
// EARTHBAR VIEWS

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
            ? { color: 'var(--cWhite)', background: 'var(--cWorkspace)', opacity: 0.66 }  // selected
            : { color: 'var(--cWhite)', background: 'var(--cWorkspace)',
                //marginTop: 'var(--s-2)',
                //paddingTop: 'var(--s-1)',
                paddingBottom: 'var(--s-1)',
                marginBottom: 'var(--s-2)',
                //borderRadius: 'var(--round)',
            };
        let sUserTab : React.CSSProperties =
            view === EbMode.User
            ? { color: 'var(--cWhite)', background: 'var(--cUser)', opacity: 0.66 }  // selected
            : { color: 'var(--cWhite)', background: 'var(--cUser)',
                //marginTop: 'var(--s-2)',
                //paddingTop: 'var(--s-1)',
                paddingBottom: 'var(--s-1)',
                marginBottom: 'var(--s-2)',
                //borderRadius: 'var(--round)',
            };
        let sSyncButton : any = {
            margin: 'var(--s-2)',
            // change colors
            '--cText': 'var(--cWhite)',
            '--cBackground': 'var(--cWorkspace)',
        };

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
            : { opacity: 0.3, /*visibility: 'hidden'*/ };

        let workspaceString = 'Add a workspace';
        if (store.currentWorkspace) {
            workspaceString = cutAtPeriod(store.currentWorkspace.workspaceAddress);
        }

        let userString = 'Guest User';
        if (store.currentUser) {
            userString = cutAtPeriod(store.currentUser.authorKeypair.address);
        }

        let canSync = false;
        if (store.kit !== null) {
            canSync = store.kit.syncer.state.pubs.length >= 1 && store.kit.syncer.state.syncState !== 'syncing';
        }

        let App = this.props.app;
        return (
            <div>
                <div className='flexRow'>
                    <button className='flexItem earthbarTab' style={sWorkspaceTab} onClick={onClickWorkspaceTab}>
                        {workspaceString}
                    </button>
                    <button className='flexItem button'
                        style={sSyncButton}
                        disabled={!canSync}
                        onClick={() => store.kit?.syncer.sync()}
                        >
                        Sync
                    </button>
                    <div className='flexItem flexGrow-1' />
                    <button className='flexItem earthbarTab' style={sUserTab} onClick={onClickUserTab}>
                        {userString}
                    </button>
                </div>
                <div style={{position: 'relative'}}>
                    <div style={{
                            position: 'absolute',
                            zIndex: 99,
                            top: 0,
                            left: store.mode === EbMode.User ? 20 : 0,
                            right: store.mode === EbMode.Workspace ? 20 : 0,
                        }}>
                        {panel}
                    </div>
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
            if (newPub.startsWith('http://') || newPub.startsWith('https://')) {
                this.props.store.addPub(newPub);
                this.setState({ newPubInput: '' });
            }
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
