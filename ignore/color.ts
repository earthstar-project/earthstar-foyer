
export type Color = {
    // range: 0 to 1
    r: number,
    g: number,
    b: number,
}

export type ColorNames = Record<string, Color>;

//================================================================================
// HELPERS

export let range = (n: number): number[] =>
    [...Array(n).keys() as any];

export let lerp = (a: number, b: number, t: number): number =>
    a + (b-a) * t;

export let clamp = (n: number, minn: number, maxx: number): number =>
    Math.max(minn, Math.min(maxx, n));

export let remap = (n: number, in0: number, in1: number, out0: number, out1: number): number => {
    let pct = (n - in0) / (in1 - in0);
    return out0 + (out1 - out0) * pct;
}
export let remapAndClamp = (n: number, in0: number, in1: number, out0: number, out1: number): number =>
    clamp(remap(n, in0, in1, out0, out1), out0, out1);

export let sign = (n: number): number =>
    n > 0 ? 1 : -1;

export let colorObjToHexObj = (co: Record<string, Color>): Record<string, string> => {
    let result: Record<string, string> = {};
    for (let [k, v] of Object.entries(co)) {
        result[k] = v === null ? 'none' : cToHexString(v);
    }
    return result;
}

//================================================================================
// STRINGS

let to255 = (n: number): number =>
    Math.round(n * 255);

export let cToRgbString = (c: Color): string =>
    `rgb(${to255(c.r)}, ${to255(c.g)}, ${to255(c.b)})`;

export let cToHexString = (c: Color): string => {
    let rh = Math.round(c.r * 255).toString(16).padStart(2, '0');
    let gh = Math.round(c.g * 255).toString(16).padStart(2, '0');
    let bh = Math.round(c.b * 255).toString(16).padStart(2, '0');
    return '#' + rh + gh + bh;
}
export let cFromHexString = (s: string): Color => 
    ({
        r: parseInt(s.slice(1, 3), 16) / 255,
        g: parseInt(s.slice(3, 5), 16) / 255,
        b: parseInt(s.slice(5, 7), 16) / 255,
    });

//================================================================================
// COLOR MATH

export let cLerp = (c1: Color, c2: Color, t: number): Color =>
    ({
        r: lerp(c1.r, c2.r, t),
        g: lerp(c1.g, c2.g, t),
        b: lerp(c1.b, c2.b, t),
    })

export let luminance = (c: Color): number => {
    // https://www.w3.org/TR/WCAG/#dfn-relative-luminance
    let r = c.r < 0.03928 ? c.r/12.92 : Math.pow((c.r + 0.055)/1.055, 2.4);
    let g = c.g < 0.03928 ? c.g/12.92 : Math.pow((c.g + 0.055)/1.055, 2.4);
    let b = c.b < 0.03928 ? c.b/12.92 : Math.pow((c.b + 0.055)/1.055, 2.4);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export let contrastRatio = (c1: Color, c2: Color): number => {
    // https://www.w3.org/TR/WCAG/#dfn-contrast-ratio
    let l1 = luminance(c1);
    let l2 = luminance(c2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}


//================================================================================
// GRADIENTS AND PALETTES

export type GradEntry = [number, Color];
export type Grad = GradEntry[];
export type Palette = Color[];

export let paletteToGrad = (palette: Palette): Grad =>
    palette.map((c, ii) => [ii / (palette.length - 1), c]);

export let evalGrad = (grad: Grad, t: number): Color => {
    if (t < grad[0][0]) { return grad[0][1]; }
    for (let ii = 0; ii < grad.length - 1; ii++) {
        let [t0, c0] = grad[ii];
        let [t1, c1] = grad[ii + 1];
        if (t0 <= t && t <= t1) {
            if (t0 === t1 && t === t0) { return c0; }
            let tpct = remap(t, t0, t1, 0.0, 1.0);
            return cLerp(c0, c1, tpct);
        }
    }
    return grad[grad.length-1][1];
}

export let evalPalette = (palette: Palette, tt: number): Color =>
    evalGrad(paletteToGrad(palette), tt);

export let sampleGradToPalette = (grad: Grad, n: number): Palette =>
    range(n).map(ii =>
        evalGrad(grad, ii / (n-1)));

export let resamplePalette = (palette: Palette, n: number): Palette =>
        sampleGradToPalette(paletteToGrad(palette), n);

export enum ContrastMode {
    INCREASE_ONLY,
    DECREASE_ONLY,
    BOTH,
}
export let traverseGradUntilContrast = (grad: Grad, threshold: number, mode: ContrastMode = ContrastMode.BOTH): Color => {
    let iters = 100;
    let cStart = grad[0][1];
    let maxContrast = 0;
    let maxC = grad[0][1];
    for (let ii = 0; ii <= iters; ii++) {
        let tt = ii / iters;
        let cHere = evalGrad(grad, tt);
        let ratio = contrastRatio(cStart, cHere);
        if (ratio > maxContrast) {
            maxContrast = ratio;
            maxC = cHere;
        }
        if (ratio > threshold) {
            if (mode === ContrastMode.INCREASE_ONLY) {
                if (tt <= 0.5 && grad.length === 3) { return grad[1][1]; }
            }
            if (mode === ContrastMode.DECREASE_ONLY) {
                if (tt >= 0.5 && grad.length === 3) { return grad[1][1]; }
            }
            return cHere;
        }
    }
    // didn't find contrast anywhere.
    // * return point in the grad with the highest contrast.
    return maxC;
    // * or return last color in grad
    //return grad[grad.length-1][1]; //cFromHexString('#ff00ff');
}
export let traversePaletteUntilContrast = (palette: Palette, threshold: number, mode: ContrastMode = ContrastMode.BOTH): Color =>
    traverseGradUntilContrast(paletteToGrad(palette), threshold, mode);
