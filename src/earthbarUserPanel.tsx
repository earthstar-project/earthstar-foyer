import * as React from 'react';

import {
    ValidatorEs4,
    isErr,
    notErr,
    AuthorKeypair,
    generateAuthorKeypair,
} from 'earthstar';

import {
    Thunk,
} from './types';
import {
    cutAtPeriod,
    sortByField,
} from './util';
import {
    WorkspaceConfig,
    EarthbarStore,
} from './earthbarStore';
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
    loginError: string,
    displayNameInput: string,
}
export class EarthbarUserPanel extends React.Component<EbPanelProps, EbUserPanelState> {
    unsub: Thunk;
    constructor(props: EbPanelProps) {
        super(props)
        this.state = {
            shortnameInput: '',
            usernameInput: '',
            passwordInput: '',
            loginError: '',
            displayNameInput: this.props.store.currentUser?.displayName || '',
        };
        logEarthbarPanel('user panel: subscribing to store changes');
        this.unsub = this.props.store.onChange.subscribe(() => {
            logEarthbarPanel('> user panel: onChange from store');
            // update displayName input if the store's displayName has changed
            let storeDisplayName: string = this.props.store.currentUser?.displayName || '';
            let displayNameInput: string = this.state.displayNameInput;
            if (storeDisplayName !== displayNameInput) {
                logEarthbarPanel('> ...updating display name input from', displayNameInput, 'to', storeDisplayName);
                this.setState({displayNameInput: storeDisplayName});
            }
        });
    }
    componentWillUnmount() {
        this.unsub();
    }
    //-------------------------
    // create user
    shortnameIsValid(shortname: string) {
        let fakeAddr = '@' + shortname + '.bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
        let parsed = ValidatorEs4.parseAuthorAddress(fakeAddr);
        return notErr(parsed);
    }
    canCreateUser() {
        let shortname = this.state.shortnameInput;
        return shortname && this.shortnameIsValid(shortname);
    }
    handleEditShortname(val: string) {
        this.setState({shortnameInput: val.trim()});
    }
    handleCreateUser() {
        logEarthbarPanel('create user');
        let shortname = this.state.shortnameInput;
        if (!this.shortnameIsValid(shortname)) {
            console.warn('invalid shortname: ' + shortname);
            return;
        }
        let keypair = generateAuthorKeypair(shortname);
        if (isErr(keypair)) {
            console.warn('invalid shortname: ' + shortname, keypair.name, keypair.message);
            return;
        }
        this.setState({
            usernameInput: keypair.address,
            passwordInput: keypair.secret,
        });
    }
    //-------------------------
    // log in
    handleEditUsername(val: string) {
        this.setState({usernameInput: val.trim(), loginError: ''});
    }
    handleEditPassword(val: string) {
        this.setState({passwordInput: val.trim(), loginError: ''});
    }
    canLogIn(): boolean {
        return this.state.usernameInput.length > 0 && this.state.passwordInput.length > 0;
    }
    handleLogIn() {
        let keypair: AuthorKeypair = {
            address: this.state.usernameInput,
            secret: this.state.passwordInput,
        }
        let success = this.props.store.logIn(keypair);
        if (isErr(success)) {
            this.setState({loginError: 'Invalid username or password'});
        } else {
            this.setState({
                shortnameInput: '',
                usernameInput: '',
                passwordInput: '',
                loginError: '',
            });
        }
    }
    //-------------------------
    // for logged-in users
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
    //-------------------------
    render() {
        logEarthbarPanel('🎨 render user panel');
        let store = this.props.store;

        if (store.currentUser === null) {
            return <div className='stack' style={sUserPanel}>
                {/* form to create new user */}
                <div className='faint'>Create new user</div>
                <form className='flexRow indent' onSubmit={(e) => {e.preventDefault(); this.handleCreateUser()}}>
                    <input className='flexItem flexGrow1' type='text'
                        name='shortname' id='shortname'
                        placeholder='4-letter nickname'
                        maxLength={4}
                        value={this.state.shortnameInput}
                        onChange={(e) => this.handleEditShortname(e.target.value)}
                        />
                    <button className='button flexItem'
                        type='submit'
                        id='createUser'
                        style={{marginLeft: 'var(--s-1)'}}
                        disabled={!this.canCreateUser()}
                        >
                        Create
                    </button>
                </form>
                <div className='faint indent'>
                    We'll create a new, unique username and password for you.
                    Keep clicking Create until you get one you like.
                </div>
                <div className='faint indent'>
                    After logging in, be sure to copy and save your username and password on the next screen!
                    Your password can't be changed or recovered later.
                </div>
                <hr className='faint'/>
                {/* form to log in */}
                <div className='faint'>Log In</div>
                <form className='stack indent' onSubmit={(e) => {e.preventDefault(); this.handleLogIn()}}>
                    <div className='flexRow'>
                        <input className='flexItem flexGrow1' type="text"
                            name='username' id='username'
                            placeholder='@user.xxxxxxxxxxxxxxx'
                            autoComplete='off'
                            value={this.state.usernameInput}
                            onChange={(e) => this.handleEditUsername(e.target.value)}
                            />
                    </div>
                    <div className='flexRow'>
                        <input className='flexItem flexGrow1' type='password'
                            name='password' id='password'
                            placeholder='password'
                            autoComplete='off'
                            value={this.state.passwordInput}
                            onChange={(e) => this.handleEditPassword(e.target.value)}
                            />
                        <button className='button flexItem'
                            type='submit'
                            id='logIn'
                            style={{marginLeft: 'var(--s-1)'}}
                            disabled={!this.canLogIn()}
                            >
                            Log in
                        </button>
                    </div>
                    <div className='indent right'>{this.state.loginError}</div>
                </form>
            </div>;
        } else {
            // user is logged in
            return <div className='stack' style={sUserPanel}>
                <div className='faint'>Display name in this workspace</div>
                <form className='indent flexRow' onSubmit={(e) => {e.preventDefault(); this.handleSaveDisplayName()}}>
                    <input type='text' className='flexGrow1'
                        value={this.state.displayNameInput}
                        placeholder={cutAtPeriod(store.currentUser.authorKeypair.address).slice(1)}
                        onChange={(e) => this.setState({displayNameInput: e.target.value})}
                        />
                    <button className='button flexItem'
                        type='submit'
                        style={{marginLeft: 'var(--s-1)'}}
                        disabled={store.currentWorkspace === null}
                        >
                        Set
                    </button>
                </form>
                {(store.currentWorkspace === null)
                  ? <div className='faint indent'>(Can't set a display name because you're not in a workspace right now.)</div>
                  : null}
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
                    <button className='button flexItem' type='button'
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
                        •••••••••••••••••••••••••••••••••••••••••••••••••••••
                    </pre>
                    <button className='button flexItem' type='button'
                        style={{marginLeft: 'var(--s-1)'}}
                        onClick={() => this.handleCopy(store.currentUser?.authorKeypair.secret || '')}
                        >
                        Copy
                    </button>
                </div>
                <hr className='faint' />
                <div className='center'>
                    <button className='button' type='button'
                        onClick={() => this.handleLogOut()}
                        >
                        Log out
                    </button>
                </div>
                <div className='faint'>
                    Make sure to save your username and password before you log out!
                    There's no way to reset a lost password.
                </div>
            </div>;
        }
    }
}
