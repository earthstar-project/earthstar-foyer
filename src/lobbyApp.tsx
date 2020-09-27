import * as React from 'react';
import { Kit } from './kit';
import {
    cutAtPeriod,
    sortByField,
} from './util';
import {
    logLobbyApp,
} from './log';
import { detChoice, detInt, detRandom, detRange, AuthorAddress, DocToSet, WriteResult, EarthstarError } from 'earthstar';

let userStyle = (author: AuthorAddress, rotate: boolean = false) : React.CSSProperties => {
    let rand = detRandom(author);
    let hue = ((rand * 7) % 1) * 360;
    let rot = ((rand * 23) % 1);
    let bgColor = `hsl(${hue}, 50%, 90%)`;
    let edgeColor = `hsl(${hue}, 56%, 82%)`;
    let darkColor = `hsl(${hue}, 90%, 20%)`;
    //let colors = 'red orange yellow green blue violet cyan pink'.split(' ');
    return {
        '--darkColor': darkColor,
        transform: rotate ? `rotate(${(rot * 2 - 1) * 4}deg)` : '',
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
    } as React.CSSProperties;
};

let getDisplayName = (kit: Kit, authorAddress: AuthorAddress): string | null => {
    // TODO: bug in earthstar-lobby: the author address needs to have a ~
    let path = `/about/${authorAddress}/name`;
    let displayName = kit.storage.getContent(path);
    return displayName === undefined ? null : displayName;
}

let humanDate = (earthstarTimestamp: number): string => {
    let d = new Date(earthstarTimestamp / 1000);
    let weekday = 'Su Mo Tu We Th Fr Sa'.split(' ')[d.getDay()];
    let month = `Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec`.split(' ')[d.getMonth()];
    let hr = d.getHours(); // 0 to 23
    let mn = ('' + d.getMinutes()).padStart(2, '0');
    let ampm = hr < 12 ? 'a' : 'p';
    hr = hr % 12;
    if (hr === 0) { hr = 12 };
    return `${weekday} ${month} ${d.getDate()} ${hr}:${mn}${ampm}`;

}

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
        logLobbyApp('render.  changeKey:', this.props.changeKey);
        let kit = this.props.kit;

        if (kit === null) { return null; }

        // load docs
        let docs = kit.storage.documents({ pathPrefix: '/lobby/', includeHistory: false }) || [];
        docs = docs.filter(doc => doc.content !== '');  // remove empty docs (aka "deleted" docs)
        sortByField(docs, 'timestamp');
        docs.reverse();

        return <div className='stack' style={{padding: 'var(--s0)'}}>
            {kit.authorKeypair
                ? <LobbyComposer kit={this.props.kit} changeKey={this.props.changeKey} />
                : null}
            {/*
            <h1 style={{fontStyle: 'italic', fontFamily: 'georgia, serif'}}>Welcome To The Foyer</h1>
            <pre className='faint' style={{marginBottom: 50, overflow: 'hidden'}}>{
                `workspace address: ${kit.workspaceAddress || '(no workspace)'}\n`+
                `user address: ${kit.authorKeypair?.address || '(guest user)'}\n`+
                `pubs: ${(kit.syncer.state.pubs.map(p => p.domain) || ['(none)']).join('\n')}`
            }</pre>
            */}
            {/* lobby messages */}
            <div className=''>
                {docs.map(doc => {
                    let displayName = getDisplayName(kit as Kit, doc.author);
                    let address = cutAtPeriod(doc.author);
                    let name1: string, name2: string | null;
                    if (displayName) {
                        name1 = displayName;
                        name2 = address;
                    } else {
                        name1 = address;
                        name2 = null;
                    }
                    return <div key={doc.path} className='stack' style={userStyle(doc.author, true)}>
                        <div className='flexRow flexWrap' title={doc.author}>
                            <div className='flexItem singleLineTextEllipsis bold' style={{color: 'var(--darkColor)'}}>{name1}</div>
                            <div className='flexItem singleLineTextEllipsis bold faint' style={{color: 'var(--darkColor)'}}>{name2}</div>
                            <div className='flexItem flexGrow1' />
                            <div className='flexItem singleLineTextEllipsis faint'>{humanDate(doc.timestamp)}</div>
                        </div>
                        <div className='wrappyText'>{doc.content}</div>
                    </div>
                })}
            </div>
        </div>;
    }
};

export interface LobbyComposerState {
    text: string,
}
export class LobbyComposer extends React.PureComponent<LobbyProps, LobbyComposerState> {
    constructor(props: LobbyProps) {
        super(props);
        this.state = {
            text: '',
        };
    }
    handleSubmit() {
        logLobbyApp('posting...');
        this.setState({text: ''});
        if (this.props.kit && this.props.kit.authorKeypair) {
            let keypair = this.props.kit.authorKeypair;
            let docToSet : DocToSet = {
                format: 'es.4',
                path: `/lobby/~${keypair.address}/${Date.now()}.txt`,
                content: this.state.text,
            }
            let result = this.props.kit.storage.set(keypair, docToSet);
            if (result !== WriteResult.Accepted) {
                console.error('post: write failed', result);
            } else {
                logLobbyApp('success');
            }
        } else {
            console.error("post: can't because kit or author keypair are null");
        }
    }
    render() {
        let myAddress = this.props.kit?.authorKeypair?.address || '';
        let buttonStyle = {
            '--cBackground': 'var(--cBlack)',
            '--cText': 'var(--cWhite)',
        } as React.CSSProperties;
        return <form className='stack' style={userStyle(myAddress, false)}
            onSubmit={(e) => {e.preventDefault(); this.handleSubmit();}}
            >
            <textarea rows={4}
                style={{resize: 'vertical'}}
                value={this.state.text}
                onChange={(e) => this.setState({text: e.target.value}) }
                />
            <div className='flexRow'>
                <div className='flexItem flexGrow1' />
                <button className='flexItem button' type="submit"
                    style={buttonStyle}
                    disabled={this.state.text.length === 0}
                    >
                    Post
                </button>
            </div>
        </form>
    }
}
