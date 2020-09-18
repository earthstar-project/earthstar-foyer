let makeLogger = (tag: string) =>
    (...args: any[]) =>
        console.log(tag + ' |', ...args);

export let logEarthbarStore = makeLogger('earthbar store');
export let logKit           = makeLogger('    kit');
export let logEarthbar      = makeLogger('        earthbar view');
export let logEarthbarPanel = makeLogger('            earthbar panel');
export let logLobbyApp      = makeLogger('            lobby view');
