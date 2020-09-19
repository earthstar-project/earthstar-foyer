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
    usernameInput: string,
    passwordInput: string,
    displayNameInput: string,
}
export class EarthbarUserPanel extends React.Component<EbPanelProps, EbUserPanelState> {
    constructor(props: EbPanelProps) {
        super(props)
        this.state = {
            shortnameInput: '',
            usernameInput: '',
            passwordInput: '',
            displayNameInput: this.props.store.currentUser?.displayName || '',
        };
    }
    shortnameIsValid(shortname: string) {
        let fakeAddr = '@' + shortname + '.bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
        let parsed = ValidatorEs4.parseAuthorAddress(fakeAddr);
        return notErr(parsed);
    }
    canCreateUser() {
        let shortname = this.state.shortnameInput;
        return shortname && this.shortnameIsValid(shortname);
    }
    handleEditShortname(shortname: string) {
        this.setState({shortnameInput: shortname.trim()});
    }
    handleCreateUser() {
        let shortname = this.state.shortnameInput;
        if (this.shortnameIsValid(shortname)) {
            this.setState({shortnameInput: ''});
            this.props.store.createUser(this.state.shortnameInput);
        } else {
            console.warn('invalid shortname: ' + shortname);
        }
    }
    handleCopy(val: string) {
        logEarthbarPanel('copying value to clipboard: ' + val);
        navigator.clipboard.writeText(val);
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
                <div className='faint'>Create new user</div>
                <form className='flexRow indent' onSubmit={(e) => {e.preventDefault(); this.handleCreateUser()}}>
                    <input className='flexItem flexGrow1' type="text"
                        placeholder="4-letter nickname"
                        maxLength={4}
                        value={this.state.shortnameInput}
                        onChange={(e) => this.handleEditShortname(e.target.value)}
                        />
                    <button className='button flexItem'
                        type='submit'
                        style={{marginLeft: 'var(--s-1)'}}
                        disabled={!this.canCreateUser()}
                        >
                        Create
                    </button>
                </form>
                <div className='faint indent'>
                    We'll create a new, unique username and password for you.
                    After clicking Create, be sure to save your username and
                    password so you can log in again later!
                </div>
                <hr className='faint'/>
                {/* form to log in */}
                <div className='faint'>Log in</div>
                <form className='stack indent' onSubmit={() => false}>
                    <div className='flexRow'>
                        <input className='flexItem flexGrow1' type="text"
                            placeholder='@user.xxxxxxxxxxxxxxx'
                            />
                    </div>
                    <div className='flexRow'>
                        <input className='flexItem flexGrow1' type='password'
                            placeholder='password'
                            />
                        <button className='button flexItem'
                            style={{marginLeft: 'var(--s-1)'}}
                            type='submit'
                            >
                            Log in
                        </button>
                    </div>
                </form>
            </div>;
        } else {
            // user is logged in
            return <div className='stack' style={sUserPanel}>
                <div className='faint'>Display name in this workspace</div>
                <form className='indent flexRow' onSubmit={(e) => {e.preventDefault(); this.handleSaveDisplayName()}}>
                    <input type='text' className='flexGrow1'
                        value={this.state.displayNameInput}
                        onChange={(e) => this.setState({displayNameInput: e.target.value})}
                        />
                    <button className='button flexItem'
                        style={{marginLeft: 'var(--s-1)'}}
                        type='submit'
                        >
                        Save
                    </button>
                </form>
                <hr className='faint' />
                <div className='faint'>Username</div>
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
                        onClick={() => this.handleCopy(store.currentUser?.authorKeypair.address || '')}
                        >
                        Copy
                    </button>
                </div>
                <div className='faint'>Password</div>
                <div className='indent flexRow'>
                    <pre className='flexGrow1 faint' style={{
                            whiteSpace: 'break-spaces',
                            overflowWrap: 'break-word',
                            margin: 0, padding: 0,
                        }}>
                        {store.currentUser.authorKeypair.secret}
                    </pre>
                    <button className='button flexItem'
                        style={{marginLeft: 'var(--s-1)'}}
                        onClick={() => this.handleCopy(store.currentUser?.authorKeypair.secret || '')}
                        >
                        Copy
                    </button>
                </div>
                <hr className='faint' />
                <div style={{textAlign: 'center'}}>
                    <button className='button' type='button'
                        onClick={() => this.handleLogOut()}
                        >
                        Log out
                    </button>
                </div>
                <div className='faint indent'>
                    Make sure to save your username and password before you log out!
                </div>
            </div>;
        }
    }
}
