import * as React from 'react';
import {
    useEffect,
    useMemo,
    useState,
    useReducer,
} from 'react';
import { Kit } from '../kit';
import {
    logTodoApp,
} from '../log';
import {
    makeLightAndDarkThemes
} from '../theme';
import {
    Styles,
    makeStyles
} from '../themeStyle';
import {
    Todo,
    TodoId,
    TodoLayer,
} from '../layers/todoLayer';

//================================================================================

let { lightTheme, darkTheme } = makeLightAndDarkThemes({
    // white on dark green with frog colored buttons
    gr6: '#ffffff',
    gr0: '#0c2122',
    ac3: '#2c960c',
});

let useForceUpdate = () => {
    // https://stackoverflow.com/questions/53215285/how-can-i-force-component-to-re-render-with-hooks-in-react
    let [, forceUpdate] = useReducer(x => x + 1, 0);
    return forceUpdate;
}

export interface TodoAppProps {
    // This prop changes whenever something in the earthstar kit has changed,
    // helping trigger a re-render.
    changeKey: string;
    // A 'Kit' is a collection of Earthstar-related classes (storage, syncer, etc).
    // See kit.ts
    kit: Kit | null;
}
export let TodoApp = ({ changeKey, kit }: TodoAppProps) => {
    logTodoApp('🎨 render.  changeKey:', changeKey);

    if (kit === null) { return <div>No workspace</div>; }

    let todoLayer = useMemo(() => {
        logTodoApp('🛐 useMemo: making new todo layer');
        return new TodoLayer(kit.storage, kit.authorKeypair);
    }, [kit.storage, kit.authorKeypair]);

    let forceUpdate = useForceUpdate();
    useEffect(() => {
        logTodoApp('🛐️ useEffect: subscribing to todo layer');
        let unsub = todoLayer.onChange.subscribe(() => {
            logTodoApp('🛐 todoLayer.onChange -- calling forceUpdate');
            forceUpdate();
        });
        return () => {
            logTodoApp('🛐️ useEffect: UN-subscribing from old todo layer');
            unsub();
            todoLayer.close();
        }
    }, [todoLayer]);

    let [darkMode, setDarkMode] = useState(false);
    let [newText, setNewText] = useState('');

    let theme = darkMode ? darkTheme : lightTheme;
    let styles = makeStyles(theme);

    // load the todos
    // we should not do this on every render...
    let todoIds: TodoId[] = todoLayer.listIds();
    let todos: Todo[] = []
    for (let id of todoIds) {
        let todo = todoLayer.getTodo(id);
        if (todo) { todos.push(todo); }
    }

    return <div style={{...styles.sPage, padding: 'var(--s0)', minHeight: '100vh'}}>
        <div className='stack centeredReadableWidth'>
            <div style={styles.sCard}>
                <h3>Todos</h3>
                <ul>
                    {todos.map(todo =>
                        <SingleTodoView
                            key={todo.id}
                            todoLayer={todoLayer}
                            todo={todo}
                            styles={styles}
                            />
                    )}
                </ul>
                {kit.authorKeypair === null
                  ? <div>Log in to add your own todos.</div>
                  : <form className='flexRow'
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (kit.authorKeypair === null) { return; }
                            setNewText('');
                            todoLayer.setNewTodo(newText);
                        }}
                        >
                        <input type='text'
                            className='flexItem flexGrow1'
                            style={styles.sTextInput}
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            />
                        <button type='submit'
                            className='flexItem'
                            style={styles.sLoudButton}>
                            Add
                        </button>
                    </form>
                }
            </div>
            <p style={{ color: theme.faintText }}>
                To delete an item, give it an empty description.
            </p>
            <p className='right'>
                <button type="button" style={styles.sQuietButton}
                    onClick={() => setDarkMode(!darkMode)}
                    >
                    Toggle dark mode
                </button>
            </p>
        </div>
    </div>;
}

interface SingleTodoProps {
    todoLayer: TodoLayer,
    todo: Todo,
    styles: Styles,
}
export let SingleTodoView = ({ todoLayer, todo, styles }: SingleTodoProps) => {
    // todo.text is the current value from Storage, which may have changed from a sync.
    let [originalText, setOriginalText] = useState(todo.text);  // old value (from first render)
    let [editedText, setEditedText] = useState(todo.text);  // value in <input>, possibly edited by user and not saved yet

    if (originalText !== todo.text) {
        // A change arrived from the outside world, by sync
        if (editedText === originalText) {
            // User has not edited the field.
            // Accept the new value from the sync.
            setOriginalText(todo.text);
            setEditedText(todo.text);
        } else {
            // User has edited the field but not saved it yet,
            // and we also have a change arriving by sync.
            // Ideally we would show a warning message like
            //     "Someone else changed this to 'foo' while you were
            //      editing it.  [accept][save mine]"
            // Instead, for simplicity let's just discard the edits in progress
            // and accept the value from the sync.
            setOriginalText(todo.text);
            setEditedText(todo.text);
        }
    }

    // Should we render the field with a highlight?
    let userInputNeedsSaving = editedText !== todo.text;

    let saveText = (text: string) => {
        todoLayer.setTodoText(todo.id, text);
        setEditedText(text);
    }

    let toggleTodo = () => {
        todoLayer.setTodoIsDone(todo.id, !todo.isDone);
    }

    logTodoApp('🎨     render todo: ' + todo.id);
    return <li style={{ listStyle: 'none' }}>
        <form
            className='flexRow'
            style={{ alignItems: 'center' }}
            onSubmit={(e) => { e.preventDefault(); saveText(editedText); }}
            >
            <input type='checkbox' className='flexItem'
                style={{ transform: 'scale(2)' }}
                checked={todo.isDone}
                onChange={ (e) => toggleTodo() }
                />
            <input type='text' className='flexItem flexGrow1'
                style={{
                    ...styles.sTextInput,
                    border: 'none',
                    paddingLeft: 0,
                    fontWeight: userInputNeedsSaving ? 'bold' : 'normal',
                }}
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                onBlur={(e) => saveText(e.target.value)}
                />
        </form>
    </li>;
};
