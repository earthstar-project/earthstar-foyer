import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Earthbar } from './earthbar';
import { FoyerApp } from './apps/foyerApp';
import { HelloApp } from './apps/helloApp';

//================================================================================
// MAIN

// The "Earthbar" is the workspace and user switcher panel across the top.
// It's responsible for setting up Earthstar classes and rendering the "app".
// The "app" in this case is LobbyApp.

let apps = {
    Foyer: FoyerApp,
    Hello: HelloApp,
}

ReactDOM.render(
    <Earthbar apps={apps} />,
    document.getElementById('react-slot')
);
