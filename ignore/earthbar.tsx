import * as React from 'react';
import throttle = require('lodash.throttle');
import { subscribeToMany } from 'earthstar';

import { Thunk } from './types';
import { notNull, sorted } from './util';
import { EarthstarRouter } from './router';
import { RainbowBug } from './rainbowBug';

let logEarthbar = (...args : any[]) => console.log('Earthbar |', ...args);

//================================================================================

let cEggplant = '#5e4d76';
let cWhite = '#fff';
let cBlack = '#222';
let cFaintOpacity = 0.65;

let cBarText = cBlack;
let cBarBackground = cWhite;
let cBarBorder = cEggplant;
let cButtonBackground = cEggplant;
let cButtonText = cWhite;

let sBar : React.CSSProperties = {
    display: 'flex',
    //justifyContent: 'space-between',  // not needed because we have an expanding spacer item
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingTop: 15,
    paddingLeft: 15,
    borderBottom: '3px solid ' + cBarBorder,
    background: cBarBackground,
    color: cBarText,
}
let sBarItem : React.CSSProperties = {
    flexShrink: 1,
    paddingBottom: 15,
    paddingRight: 15,
}
let sBarSpacer : React.CSSProperties = {
    flexGrow: 1,
    background: '#eee',
}
let sLogo : React.CSSProperties = {
    height: '2.6em',
}
let sSelect : React.CSSProperties = {
    width: '100%',
    height: '2em',
    fontSize: '100%',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderRadius: 0,
    backgroundColor: cWhite,
    border: 'none',
    color: cBarText,
    appearance: 'none',
    MozAppearance: 'none',
    WebkitAppearance: 'none',
}
let sButton : React.CSSProperties = {
    //padding: 10,
    height: '2em',
    //marginLeft: 15,
    borderRadius: 10,
    background: cButtonBackground,
    color: cButtonText,
    border: 'none',
    fontSize: 'inherit',
}

interface EarthbarProps {
    router : EarthstarRouter;
}
export class Earthbar extends React.Component<EarthbarProps, any> {
    unsub : Thunk | null = null;
    componentDidMount() {
        logEarthbar('subscribing to router changes');
        let router = this.props.router;
        this.unsub = subscribeToMany<any>(
            [
                router.onWorkspaceChange,  // changes to workspace address or author
                router.onAppChange,
                router.onSyncerChange  // to update Sync button state
            ],
            throttle(() => {
                logEarthbar('throttled event handler is running, about to render.');
                this.forceUpdate()
            }, 200)
        );
    }
    componentWillUnmount() {
        if (this.unsub) { this.unsub(); }
    }
    _syncButton() {
        logEarthbar('sync button was pressed');
        if (this.props.router.workspace) {
            this.props.router.workspace.syncer.sync();
        }
    }
    render() {
        logEarthbar('render');
        let router = this.props.router;
        let numPubs = router.workspace === null ? 0 : router.workspace.syncer.state.pubs.length;

        let showSyncButton = router.workspace !== null && numPubs > 0;
        let isSyncing = router.workspace?.syncer.state.syncState === 'syncing';
        let enableSyncButton = showSyncButton && !isSyncing;
        let syncButtonText = 'Sync';
        if (isSyncing) { syncButtonText = 'Syncing'; }

        return <div style={sBar}>
            <RainbowBug position='topLeft' />
            <div style={{...sBarItem, zIndex: 1}}>
                <img style={sLogo} src='static/img/earthstar-logo-small.png' />
            </div>
            <div style={sBarItem}>
                <label>
                    <span style={{opacity: cFaintOpacity}}>workspace</span>
                    <select name="ws" style={sSelect}
                        value={router.workspaceAddress || 'null'}
                        onChange={(e) => router.setWorkspace(e.target.value == 'null' ? null : e.target.value)}
                        >
                        <option value="null">(no workspace)</option>
                        {sorted(notNull(router.history.workspaceAddresses)).map(wa => {
                            let [name, key] = wa.split('.');
                            let waShort = wa;
                            if (key.length > 6) {
                                waShort = name + '.' + key.slice(0, 6) + '...';
                            }
                            return <option key={wa} value={wa}>{waShort}</option>
                        })}
                    </select>
                </label>
            </div>
            <div style={sBarItem}>
                <label>
                    <span style={{opacity: cFaintOpacity}}>author</span>
                    <select style={sSelect}
                        value={router.authorKeypair == null ? 'null' : router.authorKeypair.address}
                        onChange={(e) => router.setAuthorAddress(e.target.value == 'null' ? null : e.target.value)}
                        >
                        <option value="null">(no author)</option>
                        {sorted(notNull(router.history.authorKeypairs).map(kp => kp.address)).map(authorAddress =>
                            <option key={authorAddress} value={authorAddress}>{authorAddress.slice(0, 6 + 6) + '...'}</option>
                        )}
                    </select>
                </label>
            </div>
            <div style={sBarItem}>
                <label>
                    <span style={{opacity: cFaintOpacity}}>app</span>
                    <select style={sSelect}
                        value={router.app == null ? 'null' : router.app}
                        onChange={(e) => router.setApp(e.target.value == 'null' ? null : e.target.value)}
                        >
                        <option value="null">(no app)</option>
                        {sorted(Object.entries(router.appsAndNames)).map(([app, appName] : [string, string]) =>
                            <option key={app} value={app}>{appName}</option>
                        )}
                    </select>
                </label>
            </div>
            <div style={sBarSpacer}/>
            <div style={sBarItem}>
                <div style={{opacity: cFaintOpacity}}>{numPubs} pubs </div>
                <button type="button"
                    onClick={() => this._syncButton()}
                    disabled={!enableSyncButton}
                    style={{
                        ...sButton,
                        visibility: showSyncButton ? 'visible' : 'hidden',
                        opacity: enableSyncButton ? 1 : cFaintOpacity,
                        width: '5em',
                    }}
                    >
                    {syncButtonText}
                </button>
            </div>
        </div>
    }
}
