import {
    logTodoApp, logTodoLayer,
} from '../log';
import {
    AuthorKeypair,
    IStorage,
    isErr,
} from 'earthstar';

//================================================================================
// GENERIC HELPERS

let randInt = (lo: number, hi: number): number =>
    // inclusive of endpoints
    Math.floor(Math.random() * ((hi+1) - lo) + lo);

//================================================================================

export type TodoId = string;
export interface Todo {
    id: TodoId,  // ids will sort in chronological order, oldest first
    text: string,
    isDone: boolean,
}
const fieldNames = [
    'text.txt',
    'isDone.json'
] as const;

// convert the above list to a discriminated union type like 'a' | 'b'
type TodoFieldName = (typeof fieldNames)[number];

export class TodoLayer {
    static layerName = 'todo';  // used as top level of earthstar path

    storage: IStorage;
    keypair: AuthorKeypair | null;
    constructor(storage: IStorage, keypair: AuthorKeypair | null) {
        logTodoLayer('constructor');
        this.storage = storage;
        this.keypair = keypair;
    }

    static makeTodoId(): TodoId {
        return `${Date.now() * 1000}-${randInt(1000000, 9999999)}`;
    }
    static makeTodoPath(id: string, fieldName: TodoFieldName) {
        return `/${this.layerName}/${id}/${fieldName}`;
    }
    static parseTodoPath(path: string):
        null | { id: string, fieldName: TodoFieldName }
        {
        try {
            let [_, todo, id, fieldName] = path.split('/');
            if (todo !== TodoLayer.layerName) { return null; }
            if (fieldNames.indexOf(fieldName as TodoFieldName) === -1) { return null; }
            return { id: id, fieldName: fieldName as TodoFieldName };
        } catch (e) {
            throw e;
            return null;
        }
    }

    listIds(): TodoId[] {
        logTodoLayer('listIds()');
        // storage.paths will give us results in sorted order (oldest first)
        return this.storage
            .paths({ pathPrefix: '/todo/' })
            .map(path => {
                let parsed = TodoLayer.parseTodoPath(path);
                if (parsed === null) { return ''; }
                if (parsed.fieldName !== 'text.txt') { return ''; }
                return parsed.id;
            })
            .filter(id => id !== '');
    }
    getTodo(id: TodoId): Todo | undefined {
        let text = this.storage.getContent(TodoLayer.makeTodoPath(id, 'text.txt'));
        if (text === undefined || text === '') { return undefined; }
        let isDoneStr = this.storage.getContent(TodoLayer.makeTodoPath(id, 'isDone.json'));
        let isDone = (isDoneStr === 'true') ? true : false;
        return { id, text, isDone };
    }
    setTodoText(id: TodoId, text: string): void {
        logTodoLayer(`set id=${id} text="${text}"`);
        if (!this.keypair) {
            console.error("can't save todo.  keypair is not provided");
            return;
        }
        let err = this.storage.set(this.keypair, {
            format: 'es.4',
            path: TodoLayer.makeTodoPath(id, 'text.txt'),
            content: text,
        });
        if (isErr(err)) { console.error(err); }
    }
    setTodoIsDone(id: TodoId, isDone: boolean): void {
        if (!this.keypair) {
            console.error("can't save todo.  keypair is not provided");
            return;
        }
        let err = this.storage.set(this.keypair, {
            format: 'es.4',
            path: TodoLayer.makeTodoPath(id, 'isDone.json'),
            content: '' + isDone,
        });
        if (isErr(err)) { console.error(err); }
    }
    setTodo(todo: Todo): void {
        this.setTodoText(todo.id, todo.text);
        this.setTodoIsDone(todo.id, todo.isDone);
    }
    setNewTodo(text: string, isDone: boolean = false): void {
        this.setTodo({
            id: TodoLayer.makeTodoId(),
            text,
            isDone
        });
    }
}

