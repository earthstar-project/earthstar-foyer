import {
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from 'react';

import {
    logTodoHook,
} from '../log';
import {
    Todo,
    TodoLayer,
} from '../layers/todoLayer';
import { IStorage, AuthorKeypair, StorageIsClosedError } from 'earthstar';

//================================================================================

// from https://github.com/jmlweb/isMounted
let useIsMounted = () => {
    const isMounted = useRef(false);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; }
    }, []);
    return isMounted;
};

// from https://stackoverflow.com/questions/53215285/how-can-i-force-component-to-re-render-with-hooks-in-react
let useForceUpdate = () => {
    let [, forceUpdate] = useReducer(x => x + 1, 0);
    return forceUpdate;
}

// also consider https://github.com/rauldeheer/use-async-effect

//================================================================================

export let useTodoLayer = (storage: IStorage, keypair: AuthorKeypair | null): TodoLayer =>
    useMemo(() => {
        logTodoHook('🛐 useTodoLayer: useMemo: making new TodoLayer');
        return new TodoLayer(storage, keypair)
    }, [storage, keypair]);

//================================================================================

export let useTodos = (todoLayer: TodoLayer): Todo[] | 'LOADING' => {
    let isMounted = useIsMounted();
    let [todos, setTodos] = useState('LOADING' as (Todo[] | 'LOADING'));

    // when todoLayer changes...
    useMemo(() => {
        // zero out todos
        // (todoLayer changes when storage or keypair changes,
        //  so we don't want to keep showing the old stale todos we had before)
        logTodoHook('🛐 useTodos: useMemo: todoLayer changed. setting todos to "LOADING"');
        setTodos('LOADING');
        // reload them
        logTodoHook('🛐 useTodos: useMemo: starting async query...');
        // whenever we do an async call we have to do all this nonsense...
        todoLayer.listTodosAsync().then(todos => {
            logTodoHook('🛐 useTodos: useMemo: ...got todos.  setting.');
            // the component might not be mounted anymore, e.g. if we switch to a different earthstar app
            if (isMounted.current) {
                setTodos(todos);
            } else {
                logTodoHook('🛐 useTodos: useMemo: ...(skipped because not mounted)');
            }
        }).catch(e => {
            // the storage might be closed, e.g. if we switch to a different workspace
            if (e instanceof StorageIsClosedError) {
                logTodoHook('🛐 useTodos: useMemo: ...(storage was closed)');
            } else {
                throw e;
            }
        });
    }, [todoLayer]);

    // when todoLayer has a change event...
    useEffect(() => {
        // subscribe & load when change happens
        logTodoHook('🛐 useTodos: useEffect: subscribing');
        let unsub = todoLayer.onChange.subscribe(() => {
            logTodoHook('🛐 useTodos: TodoLayer.onChange: starting async query...');
            // all the same nonsense again
            todoLayer.listTodosAsync().then(todos => {
                logTodoHook('🛐 useTodos: TodoLayer.onChange: ...got todos.  setting.');
                if (isMounted.current) {
                    setTodos(todos);
                } else {
                    logTodoHook('🛐 useTodos: Todolayer.onChange: ...(skipped because not mounted)');
                }
            }).catch(e => {
                if (e instanceof StorageIsClosedError) {
                    logTodoHook('🛐 useTodos: TodoLayer.onChange: ...(storage was closed)');
                } else {
                    throw e;
                }
            });
        });

        // unsubscribe
        return () => {
            logTodoHook('🛐 useTodos: useEffect: unsubscribing');
            unsub();
        };
    }, [todoLayer]);

    return todos;
}
