import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {
    Earthbar,
} from './earthbar';
import { Kit } from './kit';
import { Thunk } from 'earthstar';

//================================================================================
// LAYOUTS

let logLobbyApp = (...args : any[]) => console.log('lobby view |', ...args);

export interface LobbyProps {
    changeKey: number | string;
    kit: Kit | null;
}
export interface LobbyState {
}
export class LobbyApp extends React.PureComponent<LobbyProps, LobbyState> {
    // note that this only re-renders when the overall Kit object changes.
    // if we want more updates from inside the kit, we have to subscribe to them.
    constructor(props: LobbyProps) {
        super(props);
    }
    render() {
        logLobbyApp('render');
        let kit = this.props.kit;
        logLobbyApp('...docs:', kit?.storage.documents({ includeHistory: false }));
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
            {kit?.storage.documents({ includeHistory: false }).map(doc =>
                <div key={doc.path}>
                    <b>{doc.path}</b>: {doc.content}
                </div>
            )}
            <pre>workspace address: {kit?.workspaceAddress || '(no workspace)'}</pre>
            <pre>user address: {kit?.authorKeypair?.address || '(guest user)'}</pre>
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
        <Earthbar app={LobbyApp}/>
    </PageColumn>,
    document.getElementById('react-slot')
);
