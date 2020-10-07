
let smul = (s: string, n: number): string =>
    // repeat a string, n times
    Array.from(Array(n)).map(x => s).join('');

let makeLogger = (indent: number, tag: string, style: string = '') =>
    (...args: any[]) =>
        console.log(`${smul('    ', indent)}%c| ${tag} `, style, ...args);

export let logEarthbarStore = makeLogger(0, 'earthbar store', 'color: black; background: pink');
export let logKit           = makeLogger(1, 'kit', 'color: black; background: #f94ac5');
export let logEarthbar      = makeLogger(2, 'earthbar view', 'color: black; background: cyan');
export let logEarthbarPanel = makeLogger(3, 'earthbar panel', 'color: black; background: #08f');
export let logLobbyApp      = makeLogger(3, 'lobby app', 'color: black; background: orange');
export let logHelloApp      = makeLogger(3, 'hello app', 'color: black; background: yellow');
