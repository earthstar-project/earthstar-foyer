import * as React from 'react';
import {
    randomColor,
} from './util';

/*
    This is a React component that changes color every time it's rendered.
    It also shows a small history of its previous colors so you can
    see how many times it rendered in a row.
*/

let sOuter : React.CSSProperties = {
    display: 'inline-block',
    padding: 5,
    borderRadius: 3,
    marginRight: 10,
};
let sTopLeft : React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    marginRight: 0,
};
let sTopRight : React.CSSProperties = {
    position: 'absolute',
    top: 0,
    right: 0,
    marginRight: 0,
};
let sInner : React.CSSProperties = {
    display: 'inline-block',
    height: '1.2em',
    width: '0.5em',
    border: '1px solid black',
};
interface RainbowBugProps {
    name?: string,
    // Default is inline.
    // For topLeft or topRight, the parent element must have a position set
    // such as 'relative' or the absolute positioning won't work.
    position?: 'inline' | 'topLeft' | 'topRight',
}
let blank : string[] = ['white', 'white', 'white', 'white', 'white', 'white', 'white'];
export class RainbowBug extends React.Component<RainbowBugProps, any> {
    colors : string[] = [...blank];
    _clear() {
        this.colors = [...blank];
        this.forceUpdate();
    }
    render() {
        this.colors.unshift(randomColor());
        this.colors.pop();
        return <div style={{
                ...sOuter,
                ...(this.props.position === 'topLeft' ? sTopLeft : {}),
                ...(this.props.position === 'topRight' ? sTopRight : {}),
                backgroundColor: this.colors[0],
            }}
            onClick={() => this._clear()}
            >
            {this.props.name ? this.props.name + ' ' : null}
            {this.colors.map((c, ii) => <div key={ii} style={{
                ...sInner,
                backgroundColor: c,
            }}></div>)}
        </div>
    }
}