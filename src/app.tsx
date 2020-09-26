import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Earthbar } from './earthbar';
import { LobbyApp } from './lobbyApp';

//================================================================================
// MAIN

// The "Earthbar" is the workspace and user switcher panel across the top.
// It's responsible for setting up Earthstar classes and rendering the "app".
// The "app" in this case is LobbyApp.

ReactDOM.render(
    <div className='pageColumn'>
        <Earthbar app={LobbyApp}/>
    </div>,
    document.getElementById('react-slot')
);
