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
    cutAtPeriod,
    sortByField,
} from './util';
import {
    logEarthbarPanel,
} from './log';

//================================================================================

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

//================================================================================
// COMPONENTS

interface EbPanelProps {
    store: EarthbarStore,
}
interface EbUserPanelState {
    shortnameInput: string,
    displayNameInput: string,
}
export class EarthbarUserPanel extends React.Component<EbPanelProps, EbUserPanelState> {
    constructor(props: EbPanelProps) {
        super(props)
        this.state = {
            shortnameInput: '',
            displayNameInput: this.props.store.currentUser?.displayName || '',
        };
    }
    handleCopyUsername() {
        logEarthbarPanel('copying username');
        if (this.props.store.currentUser === null) { return; }
        navigator.clipboard.writeText(this.props.store.currentUser.authorKeypair.address);
    }
    handleSaveDisplayName() {
        logEarthbarPanel('saving display name');
        this.props.store.setDisplayName(this.state.displayNameInput.trim());
    }
    handleLogOut() {
        logEarthbarPanel('logging out');
        this.props.store.logOutUser();
    }
    render() {
        logEarthbarPanel('render user panel');
        let store = this.props.store;

        if (store.currentUser === null) {
            return <div className='stack' style={sUserPanel}>
                {/* form to create new user */}
                <form className='flexRow' onSubmit={() => false}>
                    <input className='flexItem flexGrow1' type="text"
                        placeholder="suzy"
                        value={this.state.shortnameInput}
                        onChange={(e) => false}
                        />
                    <button className='button flexItem'
                        style={{marginLeft: 'var(--s-1)'}}
                        type='submit'
                        >
                        Create new user
                    </button>
                </form>
                <hr />
                {/* form to log in */}
                <form className='flexRow' onSubmit={() => false}>
                    <input className='flexItem flexGrow1' type="text"
                        placeholder="@suzy.xxxxxxxxx"
                        />
                    <input className='flexItem flexGrow1' type="password"
                        placeholder="@suzy.xxxxxxxxx"
                        />
                    <button className='button flexItem'
                        style={{marginLeft: 'var(--s-1)'}}
                        type='submit'
                        >
                        Log in
                    </button>
                </form>
            </div>;
        } else {
            // user is logged in
            return <div className='stack' style={sUserPanel}>
                <div className='faint'>Full username</div>
                <div className='indent flexRow'>
                    <pre className='flexGrow1' style={{
                            whiteSpace: 'break-spaces',
                            overflowWrap: 'break-word',
                            margin: 0, padding: 0,
                        }}>
                        {store.currentUser.authorKeypair.address}
                    </pre>
                    <button className='button flexItem'
                        style={{marginLeft: 'var(--s-1)'}}
                        onClick={() => this.handleCopyUsername()}
                        >
                        Copy
                    </button>
                </div>
                <div className='faint'>Display name in this workspace</div>
                <form className='indent flexRow' onSubmit={(e) => {e.preventDefault(); this.handleSaveDisplayName()}}>
                    <input type='text' className='flexGrow1'
                        value={this.state.displayNameInput}
                        onChange={(e) => this.setState({displayNameInput: e.target.value})}
                        placeholder={cutAtPeriod((this.props.store.currentUser?.authorKeypair.address || '@').slice(1))}
                        />
                    <button className='button flexItem'
                        style={{marginLeft: 'var(--s-1)'}}
                        type='submit'
                        >
                        Save
                    </button>
                </form>
                <hr className='faint'/>
                <div style={{textAlign: 'center'}}>
                    <button className='button' type='button'
                        onClick={() => this.handleLogOut()}
                        >
                        Log out
                    </button>
                </div>
            </div>;
        }
    }
}
