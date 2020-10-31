
let upper = async (url: string): Promise<string> => {
    return url.toUpperCase();
}


let LOADING = '!!loading!!';
type Loading = '!!loading!!';

type Props = {
    url: string,
}
let serializeProps = (props: Props) : string =>
    JSON.stringify(props);

let vals: Record<string, string | Loading> = {};
let memoUpper = (url: string): string | Loading => {
    let propsString = serializeProps({ url });
    let thisVal = vals[propsString];
    if (thisVal === undefined) {
        thisVal = LOADING;
        upper(url).then(x => { vals[propsString] = x; });
    }
    return thisVal;
}


/*
memoUpper('abc') --> LOADING
memoUpper('abc') --> LOADING
memoUpper('abc') --> ABC
memoUpper('abc') --> ABC

*/

//================================================================================

type LruRecord = {
    item: any,
    key: string,
    timestamp: number,
}
class LruCache {
    items: LruRecord[] = [];
    constructor(public n: number) {
    }
    get(key: string, getFn: () => any): any {
        // try to read
        for (let i of this.items) {
            if (i.key === key) {
                // update timestamp but don't sort on read,
                // only sort when saving a new item
                i.timestamp = Date.now();
                return i.item;
            }
        }
        // item not found.  compute it.
        let item = getFn();
        // discard something if needed
        if (this.items.length > this.n) {
            // sort newest first
            this.items.sort((a, b) => a.timestamp - b.timestamp);
            // remove last item
            this.items.pop();
        }
        // save the new item
        this.items.unshift({ item, key, timestamp: Date.now() });
        // return the new item
        return item;
    }
    getAsync(key: string, getFn: () => any): any | Loading {
        // try to read
        for (let i of this.items) {
            if (i.key === key) {
                // update timestamp but don't sort on read,
                // only sort when saving a new item
                i.timestamp = Date.now();
                return i.item;
            }
        }
        // item not found.  compute it.
        getFn().then((item: any) => {
            // discard something if needed
            if (this.items.length > this.n) {
                // sort newest first
                this.items.sort((a, b) => a.timestamp - b.timestamp);
                // remove last item
                this.items.pop();
            }
            // save the new item
            this.items.unshift({ item, key, timestamp: Date.now() });
        });
        return LOADING;
    }
    getAsyncAndNotify(key: string, getFn: () => Promise<any>, onReady: (item: any) => void): any | Loading {
        // try to read
        for (let i of this.items) {
            if (i.key === key) {
                // update timestamp but don't sort on read,
                // only sort when saving a new item
                i.timestamp = Date.now();
                return i.item;
            }
        }
        // item not found.  compute it.
        getFn().then((item: any) => {
            // discard something if needed
            if (this.items.length > this.n) {
                // sort newest first
                this.items.sort((a, b) => a.timestamp - b.timestamp);
                // remove last item
                this.items.pop();
            }
            // save the new item
            this.items.unshift({ item, key, timestamp: Date.now() });
            // alert the listener
            onReady(item);
        });
        return LOADING;
    }
}




let cache = new LruCache(10);
let memoUpper2 = (url: string): string | Loading => {
    let key = serializeProps({ url });
    return cache.get(key, () => upper(url));
}


/*

let cache = new LruCache(10);
let component = () => {
    let [state, setState] = useState(() => {   // state will be any | Loading
        return cache.getAsyncAndNotify(
            'myKey',
            () => getThingAsync(),
            (thing) => setState(thing),
        );
    });
}

*/

