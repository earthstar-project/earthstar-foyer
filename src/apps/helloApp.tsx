import * as React from 'react';
import { Kit } from '../kit';
import {
    logHelloApp,
} from '../log';

export interface HelloProps {
    // This prop changes whenever something in the earthstar kit has changed,
    // helping trigger a re-render.
    changeKey: string;
    // A "Kit" is a collection of Earthstar-related classes (storage, syncer, etc).
    // See kit.ts
    kit: Kit | null;
}
export interface HelloState {
}
export class HelloApp extends React.PureComponent<HelloProps, HelloState> {
    constructor(props: HelloProps) {
        super(props);
    }
    render() {
        logHelloApp('🎨 render.  changeKey:', this.props.changeKey);
        return <div style={{background: '#ddd', minHeight: '100vh'}}>
            <div className='stack centeredReadableWidth' style={{padding: 'var(--s0)'}}>
                <h3>Hello world</h3>
                This is an example app.
            </div>
        </div>;
    }
}
