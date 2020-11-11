

interface Atom {
    _kind: 'atom',
    key: string,
    value: any,
}

type InnerGet = (lump: Lump) => any;
type ComputeFn = (get: InnerGet) => any;

interface Derived {
    _kind: 'derived',
    key: string,
    computeFn: ComputeFn,
}

type Lump = Atom | Derived;

class World {
    lumps: Record<string, Lump> = {};
    constructor() {
    }
    addAtom({ key, initial }: { key: string, initial: any }): Atom {
        let atom: Atom = {
            _kind: 'atom',
            key: key,
            value: initial,
        }
        if (this.lumps[key] !== undefined) { throw new Error('key already exists: ' + key); }
        this.lumps[key] = atom;
        return atom;
    }
    addDerived({ key, computeFn }: { key: string, computeFn: ComputeFn }): Derived {
        let derived: Derived = {
            _kind: 'derived',
            key: key,
            computeFn: computeFn
        }
        if (this.lumps[key] !== undefined) { throw new Error('key already exists: ' + key); }
        this.lumps[key] = derived;
        return derived;
    }
    setAtom(a: Atom, v: any) {
        a.value = v;
    }
}


let w = new World();
let firstName = w.addAtom({ key: 'firstName', initial: 'Suzy' });
let lastName = w.addAtom({ key: 'lastName', initial: 'Bigglethorpe' });
let fullName = w.addDerived({
    key: 'fullName',
    computeFn: (get) => {
        return get(firstName) + ' ' + get(lastName);
    },
});
w.setAtom(lastName, 'Wigglesticks');







/*
type Value = Atom | Derived;

class Atom {
    key: string;
    value: any;
    constructor(key: string, initial: any) {
        this.key = key;
        this.value = initial;
    }
    set(v: any) {
        this.value = v;
    }
    update(fn: (prev: any) => any) {
        this.value = fn(this.value);
    }
}

type GrabFn = (value: Value) => any;
type ComputeFn = (grabFn: GrabFn) => any;

class Derived {
    key: string;
    computeFn: ComputeFn;
    constructor(key: string, computeFn: ComputeFn) {
        this.key = key;
        this.computeFn = computeFn;
    }
}
*/














