export type Thunk = () => void;
export type Callback<T> = (t : T) => void | Promise<void>;

let log = (...args : any[]) => console.log('Emitter |', ...args);

export class Emitter<T> {
    // Allow subscribing to an event using callbacks.
    // T is the type of event that will be emitted.
    // If the callbacks return promises (are async callbacks),
    // then we will await them here.  In other words, only one
    // callback will run at a time, assuming the event is
    // sent with "await send(...)" and not just "send(...)".
    _callbacks : Callback<T>[] = [];
    name : string;
    constructor(name : string) {
        this.name = name;
    }
    subscribe(cb : Callback<T>) : Thunk {
        log('📫 subscribe to ' + this.name);
        this._callbacks.push(cb);
        // return an unsubscribe function
        return () => {
            this._callbacks = this._callbacks.filter(c => c !== cb);
        };
    }
    async send(t : T) : Promise<void> {
        log('-->📪 ️send to ' + this.name);
        // do at the end of the current tick, instead of immediately
        process.nextTick(async () => {
            log('📪--> firing callbacks from ' + this.name);
            for (let cb of this._callbacks) {
                let result = cb(t);
                if (result instanceof Promise) {
                    await result;
                }
            }
            log('📪 done firing callbacks from ' + this.name);
        });
    }
}


export let subscribeToMany = <T>(emitters : Emitter<T>[], cb : Callback<T>) : Thunk => {
    // Run the callback when any of the emitters fire.
    // Return a thunk which unsubscribes from all the emitters.
    let unsubs = emitters.map(e => e.subscribe(cb));
    let unsubAll = () => unsubs.forEach(u => u());
    return unsubAll;
}
