import * as React from 'react';
import * as ReactDOM from 'react-dom';

let logHello = (...args : any[]) => console.log('Hello |', ...args);

interface HelloProps {
}
export class HelloView extends React.Component<HelloProps, any> {
    render() {
        logHello('render');
        return <h1>Hello</h1>;
    }
}

ReactDOM.render(
    <HelloView />,
    document.getElementById('react-slot')
);
