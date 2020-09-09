
type Thunk = () => void;

type SortFn<T> = (a: T, b: T) => number;
type Ob = {[index: string]: any};

export let sortFnByField = <T extends Ob>(field: string): SortFn<T> => {
    return (a: T, b: T): number => {
        if (a[field] > b[field]) { return 1; }
        if (a[field] < b[field]) { return -1; }
        return 0;
    }
}
export let sortByField = <T extends Ob>(arr: T[], field: string): T[] => {
    return arr.sort(sortFnByField(field));
}

export let cutAtPeriod = (s: string): string => {
    return s.split('.')[0];
}

export let ellipsifyAddress = (s : string) : string => {
    // assume s has zero or one periods
    // truncate the part after the period
    let chars = 8;
    let [a, b] = s.split('.');
    if (b === undefined) { return a; }
    if (b.length > chars) {
        b = b.slice(0, chars) + '...'
    }
    return a + '.' + b;
}

/*
export let arrayHasMatch = <T extends Ob>(arr: T[], x: T, field: string): boolean => {
    for (let a of arr) {
        if (a[field] === x[field]) { return true; }
    }
    return false;
}
*/

/*
export let removeDupesAndSort = <T extends Ob>(arr: T[], field: string): void => {
    let keyMap: Ob = {};
    for (let x of arr) {
        keyMap[x[field]] = true;
    }
    let keys = Object.keys(keyMap);
    keys.sort();
    // TODO:...
}
*/
