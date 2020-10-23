import { Thunk } from '../types';

type FeedCallback<T> = (val: T) => void | Promise<void>;

export class Box<T> {
    _value: T;
    _feeds: FeedCallback<T>[] = [];
    _dirty: boolean = false;
    _delay: number;  // -1 = nextTick, 0 = setImmediate, 1+ = setTimeout(ms)
    _pendingInterval: any = null;
    constructor(initial: T, delay: number = -1) {
        this._value = initial;
        this._delay = delay;
    }
    get value(): T {
        return this._value;
    }
    set value(val: T) {
        if (val === this._value) { return; }
        this._value = val;

        if (this._delay === -1) {
            process.nextTick(() => this._notify());
        } else {
            this._dirty = true;
            if (!this._pendingInterval) {
                this._pendingInterval = setTimeout(() => {
                    this._dirty = false;
                    this._notify();
                }, this._delay);
            }
        }
    }
    _notify() {
        for (let cb of this._feeds) {
            cb(this._value);
        }
    }
    subscribe(cb: FeedCallback<T>): Thunk {
        if (this._delay === -1) {
            process.nextTick(() => cb(this._value));
        } else {
            setImmediate(() => cb(this._value), 0);
        }

        this._feeds.push(cb);
        return () => {
            this._feeds = this._feeds.filter(c => c !== cb);
        }
    }
}







