import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Earthbar } from './earthbar';
import { Kit } from './kit';
import {
    cutAtPeriod,
    sortByField,
} from './util';
import {
    logLobbyApp,
} from './log';
import { detChoice, detInt, detRandom, detRange } from 'earthstar';

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
        let colors = 'red orange yellow green blue violet cyan pink'.split(' ');
        return <div style={{padding: 'var(--s0)'}}>
            {/*
            <h1 style={{fontStyle: 'italic', fontFamily: 'georgia, serif'}}>Welcome To The Foyer</h1>
            <pre className='faint' style={{marginBottom: 50, overflow: 'hidden'}}>{
                `workspace address: ${kit?.workspaceAddress || '(no workspace)'}\n`+
                `user address: ${kit?.authorKeypair?.address || '(guest user)'}\n`+
                `pubs: ${(kit?.syncer.state.pubs.map(p => p.domain) || ['(none)']).join('\n')}`
            }</pre>
            */}
            {/* lobby messages */}
            <div className=''>
                {docs.map(doc => {
                    let rand = detRandom(doc.author);
                    let hue = ((rand * 7) % 1) * 360;
                    let rot = ((rand * 23) % 1);
                    let bgColor = `hsl(${hue}, 50%, 90%)`;
                    let edgeColor = `hsl(${hue}, 56%, 82%)`;
                    let darkColor = `hsl(${hue}, 90%, 20%)`;
                    return <div key={doc.path} className='stack'
                        style={{
                            transform: `rotate(${(rot * 2 - 1) * 4}deg)`,
                            borderRadius: 'var(--slightlyRound)',
                            //background: 'var(--cWhite)',
                            //background: bgColor,
                            //background: `linear-gradient(180deg, ${bgColor} 43px, #fff 43px)`,  // top stripe
                            //background: `linear-gradient(90deg, ${bgColor} 10px, #fff 10px)`,  // left side stripe
                            //background: `linear-gradient(90deg, ${bgColor} 3px, #fff 40px)`,  // left side gentle
                            //border: '1px solid #999',

                            background: `linear-gradient(180deg, ${edgeColor} 3px, ${bgColor} 43px)`,  // top grad
                            //background: `linear-gradient(-90deg, ${edgeColor} 10px, ${bgColor} 50px)`,  // right side shading

                            //background: bgColor,
                            //borderLeft: '10px solid ' + edgeColor,

                            marginLeft: `${rand * 20}%`,
                            marginRight: `${(1-rand) * 20}%`,
                            padding: 'var(--s0)',
                            //paddingTop: 'var(--s1)',
                            //paddingBottom: 'var(--s1)',
                            marginBottom: 4,
                        }}>
                        <div className='flexRow'>
                            <div className='flexItem' style={{color: darkColor}} title={doc.author}><b>{cutAtPeriod(doc.author)}</b></div>
                            <div className='flexItem flexGrow-1' />
                            <div className='flexItem faint'>{new Date(doc.timestamp/1000).toDateString()}</div>
                        </div>
                        <div className='wrappyText'>{doc.content}</div>
                    </div>;
                })}
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
