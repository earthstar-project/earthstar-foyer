import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Earthbar } from './earthbar';
import { FoyerApp } from './apps/foyerApp';
import { HelloApp } from './apps/helloApp';
import { DebugApp } from './apps/debugApp';
import { TodoApp } from './apps/todoApp';

//================================================================================
// MAIN

// The "Earthbar" is the workspace and user switcher panel across the top.
// It's responsible for setting up Earthstar classes and rendering the "app".
// The "app" in this case is LobbyApp.

// first app listed here is the default
let apps = {
    Todo: TodoApp,
    Foyer: FoyerApp,
    Debug: DebugApp,
    Hello: HelloApp,
}

ReactDOM.render(
    <Earthbar apps={apps} />,
    document.getElementById('react-slot')
);
