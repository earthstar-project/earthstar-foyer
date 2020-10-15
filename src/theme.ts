
//================================================================================
// TYPES

export type ColorRGB = {
    // range: 0 to 1
    r: number,
    g: number,
    b: number,
}

export type ColorHexString = string;  // '#ff9900' or can also be 'none'

export interface BasicPalette {
    gr6: ColorHexString,  // white
    gr0: ColorHexString,  // black
    ac3: ColorHexString,  // accent color
}

export interface FullPalette {
    gr6: ColorHexString,  // white
    gr5: ColorHexString,
    gr4: ColorHexString,
    gr3: ColorHexString,  // middle gray
    gr2: ColorHexString,
    gr1: ColorHexString,
    gr0: ColorHexString,  // black
    ac4: ColorHexString,  // accent color light
    ac3: ColorHexString,  // accent color
    ac2: ColorHexString,  // accent color dark
}

export let makeFullPalette = (p: BasicPalette): FullPalette => ({
    gr6: p.gr6,
    gr5: cLerpStr(p.gr0, p.gr6, 0.79),
    gr4: cLerpStr(p.gr0, p.gr6, 0.60),
    gr3: cLerpStr(p.gr0, p.gr6, 0.44),
    gr2: cLerpStr(p.gr0, p.gr6, 0.30),
    gr1: cLerpStr(p.gr0, p.gr6, 0.16),
    gr0: p.gr0,

    ac4: cLerpStr(p.ac3, p.gr6, 0.31),
    ac3: p.ac3,
    ac2: cLerpStr(p.ac3, p.gr0, 0.31),
});

export let invertPalette = (p: FullPalette): FullPalette => ({
    gr6: p.gr0,
    gr5: p.gr1,
    gr4: p.gr2,
    gr3: p.gr3,
    gr2: p.gr4,
    gr1: p.gr5,
    gr0: p.gr6,
    ac4: p.ac2,
    ac3: p.ac3,
    ac2: p.ac4,
});

export interface Theme {
    // brightest
    card: ColorHexString,
    page: ColorHexString,
    link: ColorHexString,
    faintText: ColorHexString,
    text: ColorHexString,
    // darkest

    quietButtonBg: ColorHexString,
    quietButtonBorder: ColorHexString,
    quietButtonText: ColorHexString,

    loudButtonBg: ColorHexString,
    loudButtonBorder: ColorHexString,  // or 'none'
    loudButtonText: ColorHexString,

    textInputBg: ColorHexString,
    textInputText: ColorHexString,
    textInputBorder: ColorHexString,  // or 'none'
}

export let makeTheme = (p: FullPalette): Theme => ({
    //                 0123456
    card:                    p.gr6,
    page:                   p.gr5,
    link:                 p.ac3,
    faintText:            p.gr3,
    text:              p.gr0,
    //                 -------
    quietButtonBg:        p.gr3,
    quietButtonBorder: 'none',
    quietButtonText:         p.gr6,
    //                 -------
    loudButtonBg:        p.ac2,
    loudButtonBorder:  'none',
    loudButtonText:          p.gr6,
    //                 -------
    textInputBg:       'none',
    textInputBorder:       p.gr4,
    textInputText:     p.gr0,
    //                 0123456
});

export let makeLightAndDarkThemes = (p: BasicPalette | FullPalette) => {
    // expand basic palette into full palette if needed
    let fp : FullPalette;
    if ((p as FullPalette).gr3) { fp = p as FullPalette; }
    else { fp = makeFullPalette(p); }
    return {
        lightTheme: makeTheme(fp),
        darkTheme: makeTheme(invertPalette(fp)),
    }
};

/*
let theme2 = (p: FullPalette): Theme => ({
    //                 0123456
    card:                    p.gr6,
    page:                   p.gr5,
    link:                 p.ac3,
    faintText:            p.gr3,
    text:               p.gr1,
    //                 -------
    quietButtonBg:           p.gr6,
    quietButtonBorder:      p.gr5,
    quietButtonText:     p.gr2,
    //                 -------
    loudButtonBg:          p.ac4,
    loudButtonBorder:  'none',
    loudButtonText:    p.gr0,
    //                 0123456
});
*/


//================================================================================
// HELPERS

let range = (n: number): number[] =>
    [...Array(n).keys() as any];

export let colorObjToHexObj = (co: Record<string, ColorRGB>): Record<string, string> => {
    let result: Record<string, string> = {};
    for (let [k, v] of Object.entries(co)) {
        result[k] = v === null ? 'none' : cToHexString(v);
    }
    return result;
}

//================================================================================
// STRINGS

//let to255 = (n: number): number =>
//    Math.round(n * 255);
//
//export let cToRgbString = (c: Color): string =>
//    `rgb(${to255(c.r)}, ${to255(c.g)}, ${to255(c.b)})`;

export let cToHexString = (c: ColorRGB): string => {
    let rh = Math.round(c.r * 255).toString(16).padStart(2, '0');
    let gh = Math.round(c.g * 255).toString(16).padStart(2, '0');
    let bh = Math.round(c.b * 255).toString(16).padStart(2, '0');
    return '#' + rh + gh + bh;
}
export let cFromHexString = (s: ColorHexString): ColorRGB | null => {
    if (s === 'none' || !s.startsWith('#') || s.length !== 7) { return null; }
    return {
        r: parseInt(s.slice(1, 3), 16) / 255,
        g: parseInt(s.slice(3, 5), 16) / 255,
        b: parseInt(s.slice(5, 7), 16) / 255,
    };
}

//================================================================================
// COLOR MATH

let lerp = (a: number, b: number, t: number): number =>
    a + (b-a) * t;

export let cLerp = (c1: ColorRGB, c2: ColorRGB, t: number): ColorRGB =>
    ({
        r: lerp(c1.r, c2.r, t),
        g: lerp(c1.g, c2.g, t),
        b: lerp(c1.b, c2.b, t),
    })

export let cLerpStr = (c1s: ColorHexString, c2s: ColorHexString, t: number): ColorHexString => {
    let c1 = cFromHexString(c1s);
    let c2 = cFromHexString(c2s);
    if (c1 && c2) {
        return cToHexString(cLerp(c1, c2, t));
    } else {
        return 'none';
    }
}

export let luminance = (c: ColorRGB): number => {
    // https://www.w3.org/TR/WCAG/#dfn-relative-luminance
    let r = c.r < 0.03928 ? c.r/12.92 : Math.pow((c.r + 0.055)/1.055, 2.4);
    let g = c.g < 0.03928 ? c.g/12.92 : Math.pow((c.g + 0.055)/1.055, 2.4);
    let b = c.b < 0.03928 ? c.b/12.92 : Math.pow((c.b + 0.055)/1.055, 2.4);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export let contrastRatio = (c1: ColorRGB, c2: ColorRGB): number => {
    // https://www.w3.org/TR/WCAG/#dfn-contrast-ratio
    let l1 = luminance(c1);
    let l2 = luminance(c2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
