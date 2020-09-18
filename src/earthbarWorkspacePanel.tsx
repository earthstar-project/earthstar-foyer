import * as React from 'react';

import {
    ValidatorEs4,
    isErr,
    notErr,
} from 'earthstar';

import {
    WorkspaceConfig,
    EarthbarStore,
} from './earthbarStore';
import {
    sortByField,
} from './util';
import {
    logEarthbarPanel,
} from './log';

//================================================================================

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

//================================================================================
// COMPONENTS

interface EbPanelProps {
    store : EarthbarStore,
}
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
        logEarthbarPanel('render workspace panel');
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
                                        <div className='flexItem flexGrow1'>{icon} {pub.domain}</div>
                                        <button className='flexItem linkButton'
                                            onClick={() => store.removePub(pub.domain)}
                                            >
                                            &#x2715;
                                        </button>
                                    </div>
                                })
                            }
                            {/* Form to add new pub */}
                            <form className='flexRow' onSubmit={(e) => {e.preventDefault(); this.handleAddPub()}}>
                                <input className='flexItem flexGrow1' type="text"
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
                        <a href="#" style={style} className='flexItem flexGrow1 linkButton'
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
                <form className='flexRow' onSubmit={(e) => {e.preventDefault(); this.handleAddWorkspace()}}>
                    <input className='flexItem flexGrow1' type="text"
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
