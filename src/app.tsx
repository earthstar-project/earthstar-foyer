import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {
    Earthbar,
    EarthstarKitCtx,
} from './earthbar';
import { Kit } from './kit';
import { Thunk } from 'earthstar';

//================================================================================
// LAYOUTS

let logLobbyApp = (...args : any[]) => console.log('lobby view |', ...args);

export interface LobbyProps {
}
export interface LobbyState {
}
export class LobbyApp extends React.Component<LobbyProps, LobbyState> {
    // note that this only re-renders when the overall Kit object changes.
    // if we want more updates from inside the kit, we have to subscribe to them.
    static contextType = EarthstarKitCtx;
    unsubStorage : Thunk | null = null;
    unsubSyncer : Thunk | null = null;
    constructor(props: LobbyProps) {
        super(props);
        logLobbyApp('--- constructor.  context:', this.context);
    }
    _unsubFromKit() {
        logLobbyApp('--- unsub');
        if (this.unsubStorage) { this.unsubStorage(); }
        if (this.unsubSyncer) { this.unsubSyncer(); }
    }
    _resubscribeToKit() {
        let kit = this.context as (Kit | null);
        if (this.unsubStorage || this.unsubSyncer) {
            this._unsubFromKit();
        }
        if (kit) {
            logLobbyApp('--- subscribe to kit');
            this.unsubStorage = kit.storage.onChange.subscribe(() => {
                logLobbyApp('--- forceUpdate from kit.storage');
                this.forceUpdate();
            });
            this.unsubSyncer = kit.syncer.onChange.subscribe(() => {
                logLobbyApp('--- forceUpdate from kit.syncer');
                this.forceUpdate();
            });
        } else {
            logLobbyApp('--- subscribe to kit (but it is null)');
            this.unsubStorage = null;
            this.unsubSyncer = null;
        }
    }
    componentDidMount() {
        logLobbyApp('--- componentDidMount.  context:', this.context);
        this._resubscribeToKit();
    }
    componentDidUpdate() {
        logLobbyApp('--- componentDidUpdate.  context:', this.context);
        //this._resubscribeToKit();
    }
    componentWillUnmount() {
        logLobbyApp('--- componentWillUnmount.  context:', this.context);
        this._unsubFromKit();
    }
    render() {
        logLobbyApp('render');
        let kit = this.context as (Kit | null);
        return <div style={{padding: 'var(--s0)'}}>
            1 Hello this is the app content<br/><br/>
            2 Hello this is the app content<br/><br/>
            3 Hello this is the app content<br/><br/>
            4 Hello this is the app content<br/><br/>
            5 Hello this is the app content<br/><br/>
            6 Hello this is the app content<br/><br/>
            7 Hello this is the app content<br/><br/>
            8 Hello this is the app content<br/><br/>
            1 Hello this is the app content<br/><br/>
            2 Hello this is the app content<br/><br/>
            3 Hello this is the app content<br/><br/>
            4 Hello this is the app content<br/><br/>
            5 Hello this is the app content<br/><br/>
            6 Hello this is the app content<br/><br/>
            7 Hello this is the app content<br/><br/>
            8 Hello this is the app content<br/><br/>
            <pre>workspace address: {kit?.workspaceAddress || '(no workspace)'}</pre>
            <pre>user address: {kit?.authorKeypair?.address || '(guest)'}</pre>
            <pre>pubs: {(kit?.syncer.state.pubs.map(p => p.domain) || ['(none)']).join('\n')}</pre>
        </div>;
    }
};

/*
export const App: React.FunctionComponent<any> = (props) =>
    <div style={{padding: 'var(--s0)'}}>
        1 Hello this is the app content<br/><br/>
        2 Hello this is the app content<br/><br/>
        3 Hello this is the app content<br/><br/>
        4 Hello this is the app content<br/><br/>
        5 Hello this is the app content<br/><br/>
        6 Hello this is the app content<br/><br/>
        7 Hello this is the app content<br/><br/>
        8 Hello this is the app content<br/><br/>
        9 Hello this is the app content
    </div>
*/

export const PageColumn: React.FunctionComponent<any> = (props) =>
    <div className='pageColumn'>{props.children}</div>;

//================================================================================
// MAIN

ReactDOM.render(
    <PageColumn>
        <Earthbar>
            <LobbyApp />
        </Earthbar>
    </PageColumn>,
    document.getElementById('react-slot')
);
