import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Thunk } from './types';

//================================================================================

// from https://github.com/jmlweb/isMounted
export let useIsMounted = () => {
    const isMounted = useRef(false);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; }
    }, []);
    return isMounted;
};

/*
// from https://stackoverflow.com/questions/53215285/how-can-i-force-component-to-re-render-with-hooks-in-react
let useForceUpdate = () => {
    let [, forceUpdate] = useReducer(x => x + 1, 0);
    return forceUpdate;
}
*/

// also consider https://github.com/rauldeheer/use-async-effect

//================================================================================

// Use this when you can subscribe to generic changes, but you
// have to call an async function to actually get the data.
export let useAsyncDataOnChange = <T>(getter: () => Promise<T>, subscribe: (cb: Thunk) => Thunk, dependencies: any[]): T | 'LOADING' => {
    let isMounted = useIsMounted();
    let [result, setResult] = useState('LOADING' as (T | 'LOADING'));

    // reload data when deps change
    // we could have done this in useEffect, but useMemo runs before first render
    // se we get a little head start on loading the data.
    useMemo(() => {
        // first, zero out result so we don't show stale results while reloading the data
        setResult('LOADING');
        // load data
        getter().then(r => {
            // the component might not be mounted anymore by the time we have a result
            if (isMounted.current) {
                setResult(r);
            }
        });
    }, dependencies);

    // subscription
    useEffect(() => {
        let unsub = subscribe(() => {
            getter().then(r => {
                if (isMounted.current) {
                    setResult(r);
                }
            });
        });
        return unsub;
    }, dependencies);

    return result;
}

// Use this one when your subscription returns the changed data with every event.
// This also assumes the subscription fires once when you subscribe to give you
// the current value.
// 
// What I'm calling an "observable" looks like this:
// 
//   let unsub = layer.observeTodos(
//       (todo) => console.log(todo)
//   );
export let useObservable = <T>(observe: (cb: (data: T) => void) => Thunk, dependencies: any[]): T | 'LOADING' => {
    let isMounted = useIsMounted();
    let [result, setResult] = useState('LOADING' as (T | 'LOADING'));

    useEffect(() => {
        let unsub = observe((data: T) => {
            if (isMounted.current) {
                setResult(data);
            } else {
                unsub();
            }
        });
        return unsub;
    }, dependencies);

    return result;
}
