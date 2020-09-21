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

        return <div className='stack unselectable' style={sWorkspacePanel}>
            {/* current workspace details */}
            {store.currentWorkspace === null
            ? null
            : <div className='stack'>
                <div className='faint'>Current workspace</div>
                    <pre className='indent selectable'>{store.currentWorkspace.workspaceAddress}</pre>
                <div className='faint'>Pub servers for this workspace</div>
                    <div className='stack'>
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
                                return <div key={pub.domain} className='flexRow selectable'>
                                    <div className='flexItem unselectable unclickable'
                                        style={{alignSelf: 'center'}}
                                        >
                                            {icon}
                                    </div>
                                    <div className='flexItem flexGrow1'>
                                        <a href={pub.domain} target='_blank'
                                            style={{color: 'var(--cText)'}}
                                            >
                                            {pub.domain}
                                        </a>
                                    </div>
                                    <button className='flexItem linkButton unselectable'
                                        onClick={() => store.removePub(pub.domain)}
                                        >
                                        &#x2715;
                                    </button>
                                </div>
                            })
                        }
                        {/* Form to add new pub */}
                        <form className='flexRow indent' onSubmit={(e) => {e.preventDefault(); this.handleAddPub()}}>
                            <input className='flexItem flexGrow1' type="text"
                                placeholder="http://..."
                                value={this.state.newPubInput}
                                onChange={(e) => this.setState({ newPubInput: e.target.value })}
                                />
                            <button className='button flexItem'
                                type='submit'
                                >
                                Add
                            </button>
                        </form>
                        {(store.kit === null || store.kit.syncer.state.pubs.length === 0)
                          ? <div className='indent faint'>
                                Add pub server(s) if you want to sync with other people.
                                Otherwise your data will only be saved in this browser.
                            </div>
                          : null
                        }
                    </div>
                </div>
            }
            <hr className='faint' />
            {/* list of other workspaces */}
            <div className='faint'>Recent workspaces</div>
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
            </div>
            <hr className='faint' />
            {/* form to add new workspace */}
            <div className='faint'>Add workspace or create new one</div>
            <form className='stack indent' onSubmit={(e) => {e.preventDefault(); this.handleAddWorkspace()}}>
                <input className='fullWidth' type="text"
                    placeholder="+newworkspace.rjo34irqjf"
                    value={this.state.newWorkspaceInput}
                    onChange={(e) => this.handleEditNewWorkspace(e.target.value)}
                    />
                {/* validation error for new workspace form */}
                {this.state.newWorkspaceError === null
                    ? null
                    : <div>{this.state.newWorkspaceError}</div>
                }
                <div className='faint'>
                    A workspace has two parts: a word up to 15 letters long,
                    and a random part that's hard to guess.
                    If you're creating a new workspace, make up your own
                    random part.
                </div>
                <div className='right'>
                    <button className='button'
                        type='submit'
                        disabled={this.state.newWorkspaceError !== null}
                        >
                        Add or Create
                    </button>
                </div>
            </form>
        </div>;
    }
}
