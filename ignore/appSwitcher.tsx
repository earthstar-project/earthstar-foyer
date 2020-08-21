import * as React from 'react';

import { Thunk } from './types';
import { EarthstarRouter } from './router';

let logAppSwitcher = (...args : any[]) => console.log('AppSwitcher |', ...args);

//================================================================================

export type AppProps = {
    router : EarthstarRouter,
}
type ClassComponent = typeof React.Component;
type FuncComponent = React.FunctionComponent<AppProps>
export type AppToComponent = {
    [app:string] : ClassComponent | FuncComponent,
};

interface AppSwitcherProps {
    router: EarthstarRouter;
    appComponents: AppToComponent;
}
export class AppSwitcher extends React.Component<AppSwitcherProps, any> {
    unsub : Thunk | null = null;
    componentDidMount() {
        logAppSwitcher('subscribing to router changes');
        this.unsub = this.props.router.onAppChange.subscribe(() => this.forceUpdate());
    }
    componentWillUnmount() {
        if (this.unsub) { this.unsub(); }
    }
    render() {
        logAppSwitcher('render');
        let router = this.props.router;
        if (router.app === null) {
            return <div>No app selected</div>;
        }
        let AppComponent = this.props.appComponents[router.app];
        if (AppComponent === undefined) {
            return <div>Unknown app: <code>{router.app}</code></div>;
        }
        return <AppComponent router={router} />;
    }
}