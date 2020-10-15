import * as React from 'react';
import {
    useState,
} from 'react';
import { Kit } from '../kit';
import {
    logHelloApp,
} from '../log';
import {
    makeLightAndDarkThemes
} from '../theme';
import {
    makeStyles
} from '../themeStyle';

let { lightTheme, darkTheme } = makeLightAndDarkThemes({
    gr6: "#fffce7",
    gr0: "#220d1e",
    ac3: "#29857e",
});

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
