import * as React from 'react';
import {
    Document,
    Pub,
} from 'earthstar'
import throttle = require('lodash.throttle');

import { Thunk } from './types';
import {
    randomColor,
} from './util';
import { EarthstarRouter } from './router';
import { AppProps } from './appSwitcher';
import { Emitter, subscribeToMany } from './emitter';
import { RainbowBug } from './rainbowBug';

let logDebugView = (...args : any[]) => console.log('DebugView |', ...args);
let logDebugEmitter = (...args : any[]) => console.log('DebugEmitterView |', ...args);

//================================================================================

let sPage : React.CSSProperties = {
    padding: 15,
}

export let DebugApp : React.FunctionComponent<AppProps> = (props) =>
    <div style={sPage}>
        <h3>events</h3>
        <div>
            <DebugEmitterView emitter={props.router.onParamsChange} />
            <DebugEmitterView emitter={props.router.onAppChange} />
            <DebugEmitterView emitter={props.router.onWorkspaceChange} />
            <DebugEmitterView emitter={props.router.onStorageChange} />
            <DebugEmitterView emitter={props.router.onSyncerChange} />
        </div>
        <hr />
        <DebugView key="debug" router={props.router} />
    </div>;

//================================================================================

interface DebugEmitterViewProps {
    emitter : Emitter<any>;
}
export class DebugEmitterView extends React.Component<DebugEmitterViewProps, any> {
    unsub : Thunk | null = null;
    colors : string[] = ['white', 'white', 'white', 'white', 'white', 'white', 'white'];
    componentDidMount() {
        logDebugEmitter('subscribing to router changes for ' + this.props.emitter.name);
        this.unsub = this.props.emitter.subscribe(() => {
            logDebugEmitter('event handler is running; about to render.  event = ' + this.props.emitter.name);
            this.colors.unshift(randomColor());
            this.colors.pop();
            this.forceUpdate();
        });
    }
    componentWillUnmount() {
        logDebugEmitter('unsubscribing to router changes');
        if (this.unsub) { this.unsub(); }
    }
    render() {
        logDebugEmitter('render');
        return <RainbowBug name={this.props.emitter.name} />;
    }
}

//================================================================================

interface DebugViewProps {
    router : EarthstarRouter;
}
export class DebugView extends React.Component<DebugViewProps, any> {
    unsub : Thunk | null = null;
    componentDidMount() {
        logDebugView('subscribing to router changes');
        let router = this.props.router;
        this.unsub = subscribeToMany<any>(
            [
                router.onParamsChange,
                router.onAppChange,
                router.onWorkspaceChange,
                router.onStorageChange,
                router.onSyncerChange
            ],
            throttle(() => {
                logDebugView('throttled event handler is running, about to render.');
                this.forceUpdate()
            }, 200)
        );
    }
    componentWillUnmount() {
        logDebugView('unsubscribing to router changes');
        if (this.unsub) { this.unsub(); }
    }
    render() {
        logDebugView('render');
        let router = this.props.router;
        let workspace = router.workspace;
        let docs : Document[] = workspace === null ? [] : workspace.storage.documents({ includeHistory: false });
        let pubs : Pub[] = workspace === null ? [] : workspace.syncer.state.pubs;
        return <div>
            <div><RainbowBug name="DebugView"/></div>
            <h3>app</h3>
            <code>{'' + router.app}: {'' + router.appName}</code>
            <h3>params</h3>
            <pre>{JSON.stringify(router.params, null, 4)}</pre>
            <h3>workspace</h3>
            <code>{router.workspaceAddress || 'null'}</code>
            <h3>author</h3>
            <pre>{JSON.stringify(router.authorKeypair, null, 4)}</pre>
            <h3>workspace</h3>
            {workspace === null
              ? <div>(no workspace)</div>
              : <div>
                    <pre>workspace address: {workspace.address}</pre>
                    <pre>author address: {workspace.authorKeypair?.address || '(no author)'}</pre>
                </div>
            }
            <h3>workspace.pubs</h3>
            {pubs.length === 0
              ? <div>(no pubs)</div>
              : pubs.map(pub =>
                    <pre key={pub.domain}>{JSON.stringify(pub, null, 4)}</pre>
                )
            }
            <h3>workspace.docs</h3>
            {docs.length === 0
              ? <div>(no docs)</div>
              : docs.map(doc =>
                    <div key={doc.path + '^' + doc.author}>
                        <div><b><code>{doc.path}</code></b></div>
                        <div><pre>{doc.value}</pre></div>
                    </div>
                )
            }
        </div>;
    }
}
