import * as React from 'react';

import {
    ValidatorEs4,
    isErr,
    notErr,
    AuthorKeypair,
    generateAuthorKeypair,
} from 'earthstar';

import {
    Thunk,
} from './types';
import {
    cutAtPeriod,
    sortByField,
} from './util';
import {
    WorkspaceConfig,
    EarthbarStore,
} from './earthbarStore';
import {
    logEarthbarPanel, logEarthbar,
} from './log';

//================================================================================

let sAppPanel : React.CSSProperties = {
    padding: 'var(--s0)',
    // change colors
    '--cBackground': 'var(--cApp)',
    '--cText': 'var(--cWhite)',
    // apply color variables
    background: 'var(--cBackground)',
    color: 'var(--cText)',
    borderTopLeftRadius: 'var(--round)',
    borderTopRightRadius: 'var(--round)',
    borderBottomLeftRadius: 'var(--round)',
    borderBottomRightRadius: 'var(--round)',
    boxShadow: '0px 13px 10px 0px rgba(0,0,0,0.3)',
} as React.CSSProperties;

//================================================================================
// COMPONENTS

interface EbPanelProps {
    appNames: string[],
    activeApp: string,
    changeApp: (appName: string) => void,
}
export class EarthbarAppPanel extends React.Component<EbPanelProps, any> {
    render() {
        logEarthbarPanel('🎨 render app panel');
        return <div className='stack' style={sAppPanel}>
            <div className='faint'>Apps</div>
            <hr className='faint' />
            {this.props.appNames.map(appName => {
                logEarthbarPanel(appName, this.props.activeApp);
                let style : React.CSSProperties = appName === this.props.activeApp
                    ? {display: 'block', fontStyle: 'italic', background: 'rgba(255,255,255,0.2)'}
                    : {display: 'block'};
                return <a href="#"
                    key={appName}
                    className='linkButton indent'
                    style={style}
                    onClick={() => this.props.changeApp(appName)}
                    >
                    {appName}
                </a>;
            })}
        </div>;
    }
}
