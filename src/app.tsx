import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Earthbar } from './earthbar';
import { LobbyApp } from './apps/lobbyApp';
import { HelloApp } from './apps/helloApp';

//================================================================================
// MAIN

// The "Earthbar" is the workspace and user switcher panel across the top.
// It's responsible for setting up Earthstar classes and rendering the "app".
// The "app" in this case is LobbyApp.

let apps = {
    Lobby: LobbyApp,
    Hello: HelloApp,
}

ReactDOM.render(
    <div className='pageColumn'>
        <Earthbar apps={apps} />
    </div>,
    document.getElementById('react-slot')
);
