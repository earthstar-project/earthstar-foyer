import * as React from 'react';

import { Thunk } from './types';
import {
    cutAtPeriod,
} from './util';
import {
    EarthbarStore,
} from './earthbarStore';
import {
    EarthbarWorkspacePanel,
} from './earthbarWorkspacePanel';
import {
    EarthbarUserPanel,
} from './earthbarUserPanel';
import {
    logEarthbar,
} from './log';

//================================================================================
// EARTHBAR VIEWS

export enum EbMode {
    Closed = 'CLOSED',
    Workspace = 'WORKSPACE',
    User = 'USER',
}

export interface EbProps {
    app: React.ReactType,
}

export interface EbState {
    store: EarthbarStore,
    mode: EbMode,  // which tab are we looking at
}

export class Earthbar extends React.Component<EbProps, EbState> {
    unsubFromStore: Thunk | null = null;
    constructor(props: EbProps) {
        super(props);
        this.state = {
            store: new EarthbarStore(),
            mode: EbMode.Closed,
        };
    }
    componentDidMount() {
        this.unsubFromStore = this.state.store.onChange.subscribe((e) => {
            logEarthbar('>> EarthbarStore event ' + e.kind);
            logEarthbar('   --> forceUpdate the Earthbar');
            this.forceUpdate();
        });
    }
    componentWillUnmount() {
        if (this.unsubFromStore) {
            this.unsubFromStore();
            this.unsubFromStore = null;
        }
    }
    render() {
        let store = this.state.store;
        let kit = this.state.store.kit;
        let mode = this.state.mode;
        logEarthbar(`🎨 render in ${mode} mode`);

        // tab styles
        let sWorkspaceTab : React.CSSProperties =
            mode === EbMode.Workspace
            ? { color: 'var(--cWhite)', background: 'var(--cWorkspace)', opacity: 0.66 }  // selected
            : { color: 'var(--cWhite)', background: 'var(--cWorkspace)',
                //marginTop: 'var(--s-2)',
                //paddingTop: 'var(--s-1)',
                paddingBottom: 'var(--s-1)',
                marginBottom: 'var(--s-2)',
                //borderRadius: 'var(--round)',
            };
        let sUserTab : React.CSSProperties =
            mode === EbMode.User
            ? { color: 'var(--cWhite)', background: 'var(--cUser)', opacity: 0.66 }  // selected
            : { color: 'var(--cWhite)', background: 'var(--cUser)',
                //marginTop: 'var(--s-2)',
                //paddingTop: 'var(--s-1)',
                paddingBottom: 'var(--s-1)',
                marginBottom: 'var(--s-2)',
                //borderRadius: 'var(--round)',
            };
        let sSyncButton : any = {
            marginTop: 'var(--s-2)',
            marginBottom: 'var(--s-2)',
            // change colors
            '--cText': 'var(--cWhite)',
            '--cBackground': 'var(--cWorkspace)',
        };

        // tab click actions
        let onClickWorkspaceTab =
            mode === EbMode.Workspace
            ? (e: any) => this.setState({ mode: EbMode.Closed })
            : (e: any) => this.setState({ mode: EbMode.Workspace });
        let onClickUserTab =
            mode === EbMode.User
            ? (e: any) => this.setState({ mode: EbMode.Closed })
            : (e: any) => this.setState({ mode: EbMode.User });

        // which panel to show
        let panel : JSX.Element | null = null;
        if (mode === EbMode.Workspace) {
            panel = <EarthbarWorkspacePanel store={store} />;
        } else if (mode === EbMode.User) {
            panel = <EarthbarUserPanel store={store} />;
        }

        // panel style
        let sPanel : React.CSSProperties = {
            position: 'absolute',
            zIndex: 99,
            top: 0,
            left: mode === EbMode.User ? 20 : 0,
            right: mode === EbMode.Workspace ? 20 : 0,
        };

        // style to hide children when a panel is open
        let sChildren : React.CSSProperties =
            mode === EbMode.Closed
            ? { }
            : { opacity: 0.3, /*visibility: 'hidden'*/ };

        let workspaceLabel = 'Add workspace';
        if (store.currentWorkspace) {
            workspaceLabel = cutAtPeriod(store.currentWorkspace.workspaceAddress);
        }

        let userLabel = 'Log in';
        if (store.currentUser) {
            userLabel = cutAtPeriod(store.currentUser.authorKeypair.address);
        }

        let canSync = false;
        if (kit !== null) {
            canSync = kit.syncer.state.pubs.length >= 1 && kit.syncer.state.syncState !== 'syncing';
        }

        let App = this.props.app;
        let changeKeyForApp =
            //`store.onChange:${store.onChange.changeKey}__` +
            `storage.onWrite:${kit?.storage.onWrite.changeKey}__`;
            //`syncer.onChange:${kit?.syncer.onChange.changeKey}`;

        return (
            <div>
                {/* tabs for opening panel, and sync button */}
                <div className='flexRow'>
                    <button className='flexItem earthbarTab' style={sWorkspaceTab} onClick={onClickWorkspaceTab}>
                        {workspaceLabel}
                    </button>
                    <button className='flexItem button'
                        style={sSyncButton}
                        disabled={!canSync}
                        onClick={() => store.kit?.syncer.sync()}
                        >
                        Sync
                    </button>
                    <div className='flexItem flexGrow1' style={{margin: 0}}/>
                    <button className='flexItem earthbarTab' style={sUserTab} onClick={onClickUserTab}>
                        {userLabel}
                    </button>
                </div>
                {/* panel itself, and app */}
                <div style={{position: 'relative'}}>
                    <div style={sPanel}>
                        {panel}
                    </div>
                    <div style={sChildren}>
                        {store.kit === null
                          ? null // don't render the app when there's no kit (no workspace)
                          // TODO: how should the app specify which changes it wants?  (storage, syncer)
                          // TODO: how to throttle changes here?
                          : <App kit={store.kit} changeKey={changeKeyForApp} />
                        }
                    </div>
                </div>
            </div>
        );
    }
}
