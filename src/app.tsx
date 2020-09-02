import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {
    Earthbar,
} from './earthbar';
import { Kit } from './kit';
import { Thunk } from 'earthstar';
import { sortByField } from './util';

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
        let docs = kit?.storage.documents({ pathPrefix: '/lobby/', includeHistory: false }) || [];
        docs = docs.filter(doc => doc.content !== '');
        sortByField(docs, 'timestamp');
        docs.reverse();
        return <div style={{padding: 'var(--s0)'}}>
            <h1 style={{fontStyle: 'italic', fontFamily: 'georgia, serif'}}>Welcome To The Foyer</h1>
            <pre className='faint' style={{marginBottom: 50, overflow: 'hidden'}}>{
                `workspace address: ${kit?.workspaceAddress || '(no workspace)'}\n`+
                `user address: ${kit?.authorKeypair?.address || '(guest user)'}\n`+
                `pubs: ${(kit?.syncer.state.pubs.map(p => p.domain) || ['(none)']).join('\n')}`
            }</pre>
            <div className='stack'>
                {docs.map(doc =>
                    <div key={doc.path} className='stack'
                        style={{
                            borderRadius: 'var(--slightlyRound',
                            background: '#dedede',
                            padding: 'var(--s0)',
                        }}>
                        <div className='faint'>{doc.path}</div>
                        <div><b>{doc.author}</b></div>
                        <div className='right'>{new Date(doc.timestamp/1000).toDateString()}</div>
                        <div>{doc.content}</div>
                    </div>
                )}
            </div>
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
