
/*

let n = new Network();

let fah = n.source(32);
let cel = n.node(props => fToC(props.f));
let print = n.node(props => console.log(props.value));

cel.inputs({ f: fah });
print.inputs({ value: cel });

fah.set(212);
/*

/*
class Network {
    nods: Nod[] = [];
    constructor() {
    }
    node(fn: any): Nod {
        let n = new Nod(this, fn);
        this.nods.push(n);
        return n;
    }
    _getTopoSortedNods() {
        let sortedNodes = [];
        let active = [];
        for (let n of this.nods) { n._visited = false; }
        // find sources
        active = this.nods.filter(n => Object.keys(n._inputs).length === 0);
        // breadth-first search
        while (active.length > 0) {
            let me = active.shift() as Nod;
            sortedNodes.push(me);
            me._visited = true;
            for (let child of me._children) {
                if (child._visited) { throw new Error('not a DAG'); }
                active.push(child);
            }
        }
        return sortedNodes
    }
}

type NodFn = (props: object) => any;
class Nod {
    _fn: NodFn;
    _network: Network;
    _dirty: boolean = false;
    _value: any = undefined;
    _inputs: Record<string, Nod> = {};
    _children: Nod[] = [];
    _visited: boolean = false;
    constructor(net: Network, fn: NodFn) {
        this._network = net;
        this._fn = fn;
    }
}
*/


/*

let dag = {
    first: 'aaaaa',
    last: 'zzzzz',
    fullName: (first, last) => first + ' ' + last,
    showName: (fullName) => console.log(fullName),
}

let network = new Network(dag);
network.set('first', 'bbbbbbbb');
network.set('last', 'bbbbbbbb');
network.tick();  // prints

network.set('middle', 'mmmmmmm');
network.set('fullName', (first, middle, last) => [first, middle, last].join(' '));
network.tick();  // prints

network.tick();  // does not print

// from https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically
let getFnParams = (func: Function) => {
    let reg = new RegExp('(?:' + func.name + '\\s*|^)\\s*\\((.*?)\\)');
    let exec = reg.exec(func.toString().replace(/\n/g, ''));
    let group = (exec as any)[1] as string;
    return group
        .replace(/\/\*.*?\*\//g, '')
        .replace(/ /g, '')
        .split(',');
}

*/

/*

let mimo = new Mimo();
mimo.set('name.first', 'aaaaaa');
mimo.set('name.last', 'zzzzz');

mimo.autorun((m) => {
    m.set('name.full', m.get('name.first') + ' ' + m.get('name.last'));
});


*/

// a path is a string like 'foo.bar.baz'

let traverseGet = (obj: Record<string, any>, path: string): any => {
    let here = obj;
    let parts = path.split('.');
    while (parts) {
        let nextPart = parts.shift() as string;
        here = here[nextPart];
    }
    return here;
}
let traverseSet = (obj: Record<string, any>, path: string, value: any): any => {
    let here = obj;
    let parts = path.split('.');
    while (true) {
        let nextPart = parts.shift() as string;
        if (parts.length === 0) {
            here[nextPart] = value;
            return;
        } else {
            if (here[nextPart] === undefined) {
                here[nextPart] = {};
            }
            here = here[nextPart];
        }
    }
}

type Callback = (data: any) => void;
type Thunk = () => void;
interface IMimo {
    // cursor?
    root(): IMimo;
    get(path: string): any;
    set(path: string, value: any): void;
    onChange(pathPrefix: string, cb: Callback): Thunk;
}
class Mimo implements IMimo {
    _data: Record<string, any>;
    _subs: Record<string, Callback[]> = {};  // subscriptions: pathPrefix -> list of callbacks
    constructor(initial: object = {}) {
        this._data = initial;
    }
    root(): Mimo { return this; }
    cursor(): any {
        return new Cursor(this);
    }
    get(path: string): any {
        return traverseGet(this._data, path);
    }
    set(path: string, value: any): void {
        traverseSet(this._data, path, value);
        for (let subscribedPath of Object.keys(this._subs)) {
            if (path.startsWith(subscribedPath)) {
                for (let cb of this._subs[subscribedPath]) {
                    cb(value);
                }
            }
        }
    }
    onChange(pathPrefix: string, cb: Callback): Thunk {
        let subs = this._subs;
        if (subs[pathPrefix] === undefined) {
            subs[pathPrefix] = [];
        }
        subs[pathPrefix].push(cb);
        return () => {
            subs[pathPrefix] = subs[pathPrefix].filter(c => c !== cb);
            if (subs[pathPrefix].length === 0) {
                delete subs[pathPrefix];
            }
        };
    }
}
class Cursor implements IMimo {
    _root: Mimo;
    _reads: Record<string, boolean> = {};  // paths that have been read from this cursor
    _autorunCbs: Thunk[] = [];
    constructor(mimo: Mimo) {
        this._root = mimo;
        this._root.onChange('', (data) => {
        });
    }
    root(): Mimo { return this._root; }
    get(path: string): any {
        this._reads[path] = true;
        return this._root.get(path);
    }
    set(path: string, value: any): void {
        this._root.set(path, value);
    }
    onChange(pathPrefix: string, cb: Callback): Thunk {
        return this._root.onChange(pathPrefix, cb);
    }

    resetAutorun(): any { this._reads = {}; }
    onAutorun(cb: Thunk): Thunk {
        this._autorunCbs.push(cb);
        return () => { this._autorunCbs = this._autorunCbs.filter(c => c !== cb); }
    }
}












