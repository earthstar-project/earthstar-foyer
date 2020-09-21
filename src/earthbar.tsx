import * as React from 'react';

import { Thunk } from './types';
import {
    cutAtPeriod,
} from './util';
import {
    EbMode,
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

export interface EbProps {
    app: React.ReactType,
}

export interface EbState {
    store : EarthbarStore,
}

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
        let mode = store.mode;

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
            ? (e: any) => store.setMode(EbMode.Closed)
            : (e: any) => store.setMode(EbMode.Workspace);
        let onClickUserTab =
            mode === EbMode.User
            ? (e: any) => store.setMode(EbMode.Closed)
            : (e: any) => store.setMode(EbMode.User);

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
            left: store.mode === EbMode.User ? 20 : 0,
            right: store.mode === EbMode.Workspace ? 20 : 0,
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
        if (store.kit !== null) {
            canSync = store.kit.syncer.state.pubs.length >= 1 && store.kit.syncer.state.syncState !== 'syncing';
        }

        let App = this.props.app;
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
                          : <App kit={store.kit} changeKey={store.kit.storage.onChange.changeKey + '_' + store.kit.syncer.onChange.changeKey} />
                        }
                    </div>
                </div>
            </div>
        );
    }
}
