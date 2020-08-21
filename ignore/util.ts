export let sleep = async (ms : number) : Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}

// Return the non-null items in a list.
// Normally you'd just use a filter() for this, but
// Typescript doesn't understand that properly.
export let notNull = <T>(items : Array<T | null>) : T[] =>
    items.filter(t => t !== null) as T[];

// sort the array, mutating it, and return the mutated array
export let sorted = <T>(items : T[]) : T[] => {
    items.sort();
    return items;
}

// mutate the array and return it
export let sortedByKey = <T>(items : T[], keyFn : (a : T) => any) : T[] => {
    items.sort((a : T, b : T) : number => {
        let keyA = keyFn(a);
        let keyB = keyFn(b);
        if (keyA < keyB) { return -1; }
        if (keyA > keyB) { return 1; }
        return 0;
    });
    return items;
}
// mutate the array and return nothing
export let sortByKey = <T>(items : T[], keyFn : (a : T) => any) : void => {
    sortedByKey(items, keyFn);
}

export let parseNum = (s : string) : number | null => {
    let n = parseInt(s, 10);
    if (isNaN(n)) { return null; }
    return n;
}

export let ellipsify = (s : string, len : number) : string => {
    if (s.length <= len) { return s };
    return s.slice(0, Math.max(1, len-3)) + '...';
}

export let randint = (min : number, max : number) : number =>
    // inclusive
    Math.floor(Math.random() * ((max+1) - min)) + min;

export let randomColor = () : string => {
    let r = randint(80, 240);
    let g = randint(80, 240);
    let b = randint(80, 240);
    return `rgb(${r},${g},${b})`;
}
