import * as React from 'react';
import {
    useState,
} from 'react';
import { Kit } from '../kit';
import {
    logDebugApp,
} from '../log';
import {
    makeLightAndDarkThemes
} from '../theme';
import {
    makeStyles
} from '../themeStyle';

let { lightTheme, darkTheme } = makeLightAndDarkThemes({
    // yellow and purple with green button
    gr6: "#fffce7",
    gr0: "#220d1e",
    ac3: "#29857e",
});

export interface DebugProps {
    // This prop changes whenever something in the earthstar kit has changed,
    // helping trigger a re-render.
    changeKey: string;
    // A "Kit" is a collection of Earthstar-related classes (storage, syncer, etc).
    // See kit.ts
    kit: Kit | null;
}
export let DebugApp = ({ changeKey, kit }: DebugProps) => {
    let [darkMode, setDarkMode] = useState(false);

    let theme = darkMode ? darkTheme : lightTheme;
    let styles = makeStyles(theme);

    logDebugApp('🎨 render.  changeKey:', changeKey);
    return <div style={{...styles.sPage, padding: 'var(--s0)', minHeight: '100vh'}}>
        <div className='stack centeredReadableWidth'>
            <div style={styles.sCard}>
                <h3>Kit</h3>
                <pre>
                    {JSON.stringify({
                        workspaceAddress: kit?.workspaceAddress,
                        authorKeypair: kit?.authorKeypair,
                    }, null, 4)}
                </pre>
                <p>{kit?.storage.documents({ includeHistory: true }).length} documents</p>
            </div>
            <div style={styles.sCard}>
                <h3>Syncers</h3>
                {kit === null
                  ? null
                  : Object.values(kit.syncers)
                        .map(syncer =>
                            <div key={syncer.domain}>
                                <h4>{syncer.domain}</h4>
                                <pre>{JSON.stringify(syncer.state, null, 4)}</pre>
                                <div className='right'>
                                    Bulk:
                                    <button type="button" style={styles.sQuietButton}
                                        onClick={() => syncer.pushOnce()} disabled={syncer.state.isBulkPushing}>
                                        pushOnce
                                    </button>
                                    <button type="button" style={styles.sQuietButton}
                                        onClick={() => syncer.pullOnce()} disabled={syncer.state.isBulkPulling}>
                                        pullOnce
                                    </button>
                                    <button type="button" style={styles.sLoudButton}
                                        onClick={() => syncer.syncOnce()} disabled={syncer.state.isBulkSyncing || syncer.state.isBulkPushing || syncer.state.isBulkPulling}>
                                        syncOnce
                                    </button>
                                </div>
                                <div className='right'>
                                    Pull stream:
                                    <button type="button" style={styles.sQuietButton}
                                        onClick={() => syncer.startPullStream()} disabled={syncer.state.isPullStreaming}>
                                        start
                                    </button>
                                    <button type="button" style={styles.sQuietButton}
                                        onClick={() => syncer.stopPullStream()} disabled={!syncer.state.isPullStreaming}>
                                        stop
                                    </button>
                                </div>
                                <div className='right'>
                                    Push stream:
                                    <button type="button" style={styles.sQuietButton}
                                        onClick={() => syncer.startPushStream()} disabled={syncer.state.isPushStreaming}>
                                        start
                                    </button>
                                    <button type="button" style={styles.sQuietButton}
                                        onClick={() => syncer.stopPushStream()} disabled={!syncer.state.isPushStreaming}>
                                        stop
                                    </button>
                                </div>
                                <hr/>
                            </div>
                        )
                }
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
