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
import { EarthbarAppPanel } from './earthbarAppPanel';

//================================================================================
// EARTHBAR VIEWS

export enum EbTab {
    AllClosed = 'ALL_CLOSED',
    Workspace = 'WORKSPACE',
    App = 'APP',
    User = 'USER',
}

export interface EbProps {
    apps: Record<string, React.ReactType>,
}

export interface EbState {
    store: EarthbarStore,
    activeTab: EbTab,
    activeApp: string,
}

export class Earthbar extends React.Component<EbProps, EbState> {
    unsubFromStore: Thunk | null = null;
    constructor(props: EbProps) {
        super(props);
        this.state = {
            store: new EarthbarStore(),
            activeTab: EbTab.AllClosed,
            activeApp: Object.keys(this.props.apps)[0],
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
    changeApp(appName: string) {
        logEarthbar('change app to', appName);
        this.setState({
            activeTab: EbTab.AllClosed,
            activeApp: appName,
        });
    }
    clickSync() {
        let kit = this.state.store.kit;
        if (kit === null) { return; }
        logEarthbar('starting sync');
        for (let syncer of Object.values(kit.syncers)) {
            syncer.syncOnce();
        }
    }
    isLive() {
        let kit = this.state.store.kit;
        if (kit === null) { return; }
        let live = false;
        for (let syncer of Object.values(kit.syncers)) {
            if (syncer.state.isPullStreaming || syncer.state.isPushStreaming) {
                live = true;
            }
        }
        return live;
    }
    toggleLive() {
        let kit = this.state.store.kit;
        if (kit === null) { return; }
        logEarthbar('toggling live sync')
        let isLive = this.isLive();
        for (let syncer of Object.values(kit.syncers)) {
            if (isLive) {
                syncer.stopPullStream();
                syncer.stopPushStream();
            } else {
                syncer.startPullStream();
                syncer.startPushStream();
            }
        }
    }
    render() {
        let store = this.state.store;
        let kit = this.state.store.kit;
        let activeTab = this.state.activeTab;
        logEarthbar(`🎨 render.  tab = ${activeTab}`);

        // tab styles
        let selectedTabOpacity = 1;  // 0.66
        let sWorkspaceTab : React.CSSProperties =
            activeTab === EbTab.Workspace
            ? { color: 'var(--cWorkspaceInk)', background: 'var(--cWorkspacePaper)', opacity: selectedTabOpacity }  // selected
            : { color: 'var(--cWorkspaceInk)', background: 'var(--cWorkspacePaper)',
                //marginTop: 'var(--s-2)',
                //paddingTop: 'var(--s-1)',
                paddingBottom: 'var(--s-1)',
                marginBottom: 'var(--s-2)',
                //borderRadius: 'var(--round)',
            };
        let sAppTab : React.CSSProperties =
            activeTab === EbTab.App
            ? { color: 'var(--cAppInk)', background: 'var(--cAppPaper)', opacity: selectedTabOpacity }  // selected
            : { color: 'var(--cAppInk)', background: 'var(--cAppPaper)',
                //marginTop: 'var(--s-2)',
                //paddingTop: 'var(--s-1)',
                paddingBottom: 'var(--s-1)',
                marginBottom: 'var(--s-2)',
                //borderRadius: 'var(--round)',
            };
        let sUserTab : React.CSSProperties =
            activeTab === EbTab.User
            ? { color: 'var(--cUserInk)', background: 'var(--cUserPaper)', opacity: selectedTabOpacity }  // selected
            : { color: 'var(--cUserInk)', background: 'var(--cUserPaper)',
                //marginTop: 'var(--s-2)',
                //paddingTop: 'var(--s-1)',
                paddingBottom: 'var(--s-1)',
                marginBottom: 'var(--s-2)',
                //borderRadius: 'var(--round)',
            };
        let sSyncButton : any = {
            background: 'var(--cWorkspaceInk)',
            color: 'var(--cWorkspacePaper)',
            border: '2px solid var(--cWorkspacePaper)',
            marginTop: 'var(--s-2)',
            marginBottom: 'var(--s-2)',
        };
        let sLiveButton : any = {
            background: 'var(--cWorkspaceInk)',
            color: 'var(--cWorkspacePaper)',
            border: '2px solid var(--cWorkspacePaper)',
            marginTop: 'var(--s-2)',
            marginBottom: 'var(--s-2)',
        };

        // tab click actions
        let onClickTab = (tab: EbTab) => {
            if (this.state.activeTab === tab) {
                this.setState({ activeTab: EbTab.AllClosed });
            } else {
                this.setState({ activeTab: tab });
            }
        }

        // which panel to show
        let panel : JSX.Element | null = null;
        if (activeTab === EbTab.Workspace) {
            panel = <EarthbarWorkspacePanel store={store} />;
        } else if (activeTab === EbTab.App) {
            panel = <EarthbarAppPanel
                appNames={Object.keys(this.props.apps)}
                activeApp={this.state.activeApp}
                changeApp={this.changeApp.bind(this)}
                />;
        } else if (activeTab === EbTab.User) {
            panel = <EarthbarUserPanel store={store} />;
        } 

        // labels for tabs
        let workspaceLabel = 'Add workspace';
        if (store.currentWorkspace) {
            workspaceLabel = cutAtPeriod(store.currentWorkspace.workspaceAddress);
        }

        let appLabel = this.state.activeApp;

        let userLabel = 'Log in';
        if (store.currentUser) {
            userLabel = cutAtPeriod(store.currentUser.authorKeypair.address);
        }

        let canSync = false;
        if (kit !== null) {
            // TODO: syncers
            for (let syncer of Object.values(kit.syncers)) {
                if (syncer.state.isBulkSyncing === false) {
                    canSync = true;
                }
            }
            //canSync = kit.syncer.state.pubs.length >= 1 && kit.syncer.state.syncState !== 'syncing';
        }

        // get appropriate app component
        let App = this.props.apps[this.state.activeApp];

        let changeKeyForApp =
            `store.onChange:${store.onChange.changeKey}__` +
            `storage.onWrite:${kit?.storage.onWrite.changeKey}`;
            //`syncer.onChange:${kit?.syncer.onChange.changeKey}`;

        return <>
            {/* tabs for opening panel, and sync button */}
            <div className='earthbarColors earthbarTabRow'>
                <div className='flexRow centeredReadableWidth'>
                    <button className='flexItem earthbarTab' style={sUserTab}
                        onClick={() => onClickTab(EbTab.User)}
                        >
                        {userLabel}
                    </button>
                    <button className='flexItem earthbarTab' style={sWorkspaceTab}
                        onClick={() => onClickTab(EbTab.Workspace)}
                        >
                        {workspaceLabel}
                    </button>
                    <button className='flexItem button'
                        style={sSyncButton}
                        disabled={!canSync}
                        onClick={() => this.clickSync()}
                        >
                        Sync
                    </button>
                    <button className='flexItem button'
                        style={sLiveButton}
                        onClick={() => this.toggleLive()}
                        >
                        {this.isLive() ? '✅' : '🔲'} Live
                    </button>
                    <div className='flexItem flexGrow1' style={{margin: 0}}/>
                    <button className='flexItem earthbarTab' style={sAppTab}
                        onClick={() => onClickTab(EbTab.App)}
                        >
                        {appLabel}
                    </button>
                </div>
            </div>
            {/* panel itself, and app */}
            <div style={{position: 'relative', minHeight: '100vh'}}>
                <div className='earthbarPanel'>
                    <div className='centeredReadableWidth'>
                        {panel}
                    </div>
                </div>
                {activeTab === EbTab.AllClosed
                  ? null
                  : <div className='earthbarPanelBackdrop earthbarColors'
                        onClick={() => onClickTab(EbTab.AllClosed)}
                        />
                }
                {store.kit === null
                    ? null // don't render the app when there's no kit (no workspace)
                    // TODO: how should the app specify which changes it wants?  (storage, syncer)
                    // TODO: how to throttle changes here?
                    : <App kit={store.kit} changeKey={changeKeyForApp} />
                }
            </div>
        </>;
    }
}
