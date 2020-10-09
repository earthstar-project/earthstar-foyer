import * as React from 'react';
import {
    useState,
} from 'react';
import { Kit } from '../kit';
import {
    logHelloApp,
} from '../log';

import {
    BasicPalette,
    invertPalette,
    makeFullPalette,
    makeTheme,
    Theme,
} from '../theme';

let basicPalette: BasicPalette = {
    gr6: "#fffce7",
    gr0: "#220d1e",
    ac3: "#29857e",
}
let fullPalette = makeFullPalette(basicPalette);
let lightTheme = makeTheme(fullPalette);
let darkTheme = makeTheme(invertPalette(fullPalette));
let theme = lightTheme;

let makeStyles = (theme: Theme) => {
    let sPage: React.CSSProperties = {
        background: theme.page,
        color: theme.text,
    }
    let sCard: React.CSSProperties = {
        background: theme.card,
        color: theme.text,
        padding: 'var(--s0)',
        borderRadius: 'var(--slightlyRound)',
        boxShadow: '5px 15px 20px -5px rgba(0,0,0,0.17)',
    }
    let sLoudButton: React.CSSProperties = {
        background: theme.loudButtonBg,
        color: theme.loudButtonText,
        borderRadius: 10,
        padding: theme.loudButtonBorder === 'none' ? '8px 13px' : '10px 15px',
        margin: '2px 5px',
        fontWeight: 'bold',
        display: 'inline-block',
        border: theme.loudButtonBorder === 'none' ? 'none' : '2px solid ' + theme.loudButtonBorder,
    }
    return {sPage, sCard, sLoudButton};
}

export interface HelloProps {
    // This prop changes whenever something in the earthstar kit has changed,
    // helping trigger a re-render.
    changeKey: string;
    // A "Kit" is a collection of Earthstar-related classes (storage, syncer, etc).
    // See kit.ts
    kit: Kit | null;
}
export let HelloApp = ({ changeKey, kit }: HelloProps) => {
    let [darkMode, setDarkMode] = useState(false);

    let theme = darkMode ? darkTheme : lightTheme;
    let styles = makeStyles(theme);

    logHelloApp('🎨 render.  changeKey:', changeKey);
    return <div style={{...styles.sPage, padding: 'var(--s0)', minHeight: '100vh'}}>
        <div className='stack centeredReadableWidth'>
            <div style={styles.sCard}>
                <h3>Hello world</h3>
                <p>This is an example app.</p>
            </div>
            <div style={styles.sCard}>
                <h3>Themes</h3>
                <p>You can change the color theme!</p>
                <p className='right'>
                    <button type="button" style={styles.sLoudButton}
                        onClick={() => setDarkMode(!darkMode)}
                        >
                        Toggle dark mode
                    </button>
                </p>
            </div>
        </div>
    </div>;
}
