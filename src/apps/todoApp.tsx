import * as React from 'react';
import {
    useState,
} from 'react';
import { Kit } from '../kit';
import {
    logTodoApp,
} from '../log';
import {
    makeLightAndDarkThemes, makeFullPalette
} from '../theme';
import {
    Styles,
    makeStyles
} from '../themeStyle';
import { IStorage, isErr, AuthorKeypair, ValidationError } from 'earthstar';

//================================================================================
// GENERIC HELPERS

let randInt = (lo: number, hi: number): number =>
    // inclusive of endpoints
    Math.floor(Math.random() * ((hi+1) - lo) + lo);

let sortedAndUnique = <T, _>(items: T[]) : T[] => {
    // return a sorted version of the array with duplicates removed.
    // (checks for reference equality, ===)
    items = [...items];
    items.sort();
    let result: T[] = [];
    for (let item of items) {
        if (result.length === 0 || item !== result[result.length-1]) {
            result.push(item);
        }
    }
    return result;
};

//================================================================================
// TODO HELPERS

interface Todo {
    id: string,  // actually a creation timetamp in microseconds
    text: string,
    isDone: boolean,
}
enum TodoFieldName {
    text = 'text.txt',  // required.  set to '' to delete the todo.
    isDone = 'isDone.json',  // optional, only content === 'true' counts as done
}
let makeTodoId = () =>
    `${Date.now() * 1000}-${randInt(1000000, 9999999)}`;
let makeTodoPath = (id: string, fieldName: TodoFieldName) => {
    return `/todo/${id}/${fieldName}`;
}
let parseTodoPath = (path: string): null | {id: string, fieldName: TodoFieldName} => {
    try {
        let [_, todo, id, fieldName] = path.split('/');
        if (todo !== 'todo') { return null; }
        let fieldNames = Object.values(TodoFieldName);
        if (fieldNames.indexOf(fieldName as any) === -1) { return null; }
        return { id: id, fieldName: fieldName as TodoFieldName };
    } catch (e) {
        return null;
    }
}
let listTodoIds = (storage: IStorage): string[] =>
    // sort by path, which turns out to be oldest first
    // since we use a timestamp in the path
    sortedAndUnique(
        storage
            .paths({ pathPrefix: '/todo/' })
            .map(path => {
                // only keep parsable paths which end in '/text.txt'
                let parsed = parseTodoPath(path)
                if (parsed === null) { return ''; }
                if (parsed.fieldName !== TodoFieldName.text) { return ''; }
                return parsed.id;
            })
            .filter(id => id !== '')
    );

let loadTodo = (storage: IStorage, id: string): Todo | null => {
    let text = storage.getContent(makeTodoPath(id, TodoFieldName.text));
    if (text === undefined || text === '') { return null; }
    let isDoneStr = storage.getContent(makeTodoPath(id, TodoFieldName.isDone));
    let isDone: boolean = (isDoneStr === 'true') ? true : false;
    return { id, text, isDone };
}

let saveTodo = (storage: IStorage, keypair: AuthorKeypair, todo: Todo): void => {
    let err = storage.set(keypair, {
        format: 'es.4',
        path: makeTodoPath(todo.id, TodoFieldName.text),
        content: todo.text,
    });
    if (isErr(err)) { console.error(err); }
    let err2 = storage.set(keypair, {
        format: 'es.4',
        path: makeTodoPath(todo.id, TodoFieldName.isDone),
        content: '' + todo.isDone,
    });
    if (isErr(err2)) { console.error(err2); }
}

//================================================================================

let { lightTheme, darkTheme } = makeLightAndDarkThemes({
    // white on dark green with frog colored buttons
    gr6: '#ffffff',
    gr0: '#0c2122',
    ac3: '#2c960c',
});

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

    let [darkMode, setDarkMode] = useState(false);
    let [newText, setNewText] = useState('');

    let theme = darkMode ? darkTheme : lightTheme;
    let styles = makeStyles(theme);

    if (kit === null) { return <div>No workspace</div>; }

    // load the todos
    // we should not do this on every render...
    let todoIds: string[] = listTodoIds(kit.storage)
    let todos: Todo[] = []
    for (let id of todoIds) {
        let todo = loadTodo(kit.storage, id);
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
                            kit={kit}
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
                            setNewText('');
                            if (kit.authorKeypair === null) { return; }
                            saveTodo(kit.storage, kit.authorKeypair, {
                                id: makeTodoId(),
                                text: newText,
                                isDone: false,
                            });
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

export interface SingleTodoProps {
    kit: Kit;
    todo: Todo;
    styles: Styles;
}
export let SingleTodoView = ({ kit, todo, styles }: SingleTodoProps) => {
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
        if (kit.authorKeypair === null) { return; }
        saveTodo(kit.storage, kit.authorKeypair, {
            ...todo,
            text: text,
        });
        setEditedText(text);
    }

    let toggleTodo = () => {
        if (kit.authorKeypair === null) { return; }
        saveTodo(kit.storage, kit.authorKeypair, {
            ...todo,
            isDone: !todo.isDone,
        });
    }

    logTodoApp('🎨     render ' + todo.id);
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
