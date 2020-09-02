import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Earthbar } from './earthbar';
import { Kit } from './kit';
import { sortByField } from './util';

let logLobbyApp = (...args : any[]) => console.log('lobby view |', ...args);

//================================================================================

// The "Earthbar" is the workspace and user switcher panel across the top.
// It's responsible for setting up Earthstar classes and rendering the "app".

// This is the "app":
export interface LobbyProps {
    // This prop changes whenever something in the earthstar kit has changed,
    // helping trigger a re-render.
    changeKey: string;
    // A "Kit" is a collection of Earthstar-related classes (storage, syncer, etc).
    // See kit.ts
    kit: Kit | null;
}
export interface LobbyState {
}
export class LobbyApp extends React.PureComponent<LobbyProps, LobbyState> {
    constructor(props: LobbyProps) {
        super(props);
    }
    render() {
        logLobbyApp('render');
        let kit = this.props.kit;
        let docs = kit?.storage.documents({ pathPrefix: '/lobby/', includeHistory: false }) || [];
        docs = docs.filter(doc => doc.content !== '');  // remove empty docs (aka "deleted" docs)
        sortByField(docs, 'timestamp');
        docs.reverse();
        return <div style={{padding: 'var(--s0)'}}>
            <h1 style={{fontStyle: 'italic', fontFamily: 'georgia, serif'}}>Welcome To The Foyer</h1>
            {/* debug details */}
            <pre className='faint' style={{marginBottom: 50, overflow: 'hidden'}}>{
                `workspace address: ${kit?.workspaceAddress || '(no workspace)'}\n`+
                `user address: ${kit?.authorKeypair?.address || '(guest user)'}\n`+
                `pubs: ${(kit?.syncer.state.pubs.map(p => p.domain) || ['(none)']).join('\n')}`
            }</pre>
            {/* lobby messages */}
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

//================================================================================
// MAIN

ReactDOM.render(
    <div className='pageColumn'>
        <Earthbar app={LobbyApp}/>
    </div>,
    document.getElementById('react-slot')
);
