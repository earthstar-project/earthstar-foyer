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
    // twilight lavender with purple button
    gr6: "#dee5ff",
    gr0: "#0e1222",
    ac3: "#b937b2",
});

export interface BunchProps {
    // This prop changes whenever something in the earthstar kit has changed,
    // helping trigger a re-render.
    changeKey: string;
    // A "Kit" is a collection of Earthstar-related classes (storage, syncer, etc).
    // See kit.ts
    kit: Kit | null;
}
export let BunchApp = ({ changeKey, kit }: BunchProps) => {
    let [darkMode, setDarkMode] = useState(false);

    let theme = darkMode ? darkTheme : lightTheme;
    let styles = makeStyles(theme);

    logHelloApp('🎨 render.  changeKey:', changeKey);
    return <div style={{...styles.sPage, padding: 'var(--s0)', minHeight: '100vh'}}>
        <div className='stack centeredReadableWidth'>
            <div style={styles.sCard}>
                <CellView kit={kit} pageId={'page1'} cellId={0} />
            </div>
            <div style={styles.sCard}>
                <CellView kit={kit} pageId={'page1'} cellId={1} />
            </div>
            <div style={styles.sCard}>
                <CellView kit={kit} pageId={'page1'} cellId={2} />
            </div>
        </div>
    </div>;
}

interface CellContent {
    label: string,
}
export interface CellProps {
    kit: Kit | null;
    pageId: string,
    cellId: number;
}
export let CellView = ({ kit, pageId, cellId }: CellProps) => {
    if (kit === null) { return null; }

    let storage = kit.storage;
    let path = `/bunch/${pageId}/${cellId}.json`;

    let contentStr = storage.getContent(path);
    let content: CellContent;
    if (contentStr === undefined) {
        content = { label: '???' };
    } else {
        try {
            content = JSON.parse(contentStr);
        } catch (err) {
            content = { label: '???' };
        }
    }

    return <div>
        <div><i>This is {pageId} and cell {cellId}</i></div>
        <div><b>{content.label}</b></div>
        <div><input></input></div>
    </div>
}

