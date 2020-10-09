import * as React from "react";
import {useState} from "react";
import "./styles.css";

import {
    Color,
    ColorNames,
    Palette,
    cFromHexString,
    ContrastMode,
    cLerp,
    cToHexString,
    cToRgbString,
    contrastRatio,
    evalGrad,
    luminance,
    paletteToGrad,
    range,
    resamplePalette,
    sampleGradToPalette,
    traverseGradUntilContrast,
    traversePaletteUntilContrast,
    colorObjToHexObj,
} from './color';

// middle colors
let midRed = '#ee0000';
let midOrange = '#b95c00';
let midYellow = '#7a7a00';
let midGreen = '#008900';
let midCyan = '#008383';
let midBlue = '#006aff';
let midBlueGray = '#5477a9';
let midIndigo = '#5e5eff'
let midLavender = '#bc00ff';
let midLavenderGray = '#9e5bb6';
let midMagenta2 = '#e50072';

// solarized
// https://ethanschoonover.com/solarized/
let solbase03  = '#002b36';  // darkest
let solbase02  = '#073642';
let solbase01  = '#586e75';
let solbase00  = '#657b83';
let solbase0   = '#839496';
let solbase1   = '#93a1a1';
let solbase2   = '#eee8d5';
let solbase3   = '#fdf6e3';  // lightest
let solyellow  = '#b58900';
let solorange  = '#cb4b16';
let solred     = '#dc322f';
let solmagenta = '#d33682';
let solviolet  = '#6c71c4';
let solblue    = '#268bd2';
let solcyan    = '#2aa198';
let solgreen   = '#859900';

let black = cFromHexString('#000000');
let white = cFromHexString('#ffffff');

let rust = '#7f1e20';

let lightYellow = '#fffce7';
let cyan = '#29857e';
let darkPurple = '#220d1e';

interface BasicPaints {
    gr6: Color,  // white
    gr0: Color,  // black
    ac3: Color,  // accent color
}
interface FullPaints {
    gr6: Color,  // white
    gr5: Color,
    gr4: Color,
    gr3: Color,  // middle gray
    gr2: Color,
    gr1: Color,
    gr0: Color,  // black

    ac4: Color,
    ac3: Color,  // accent color
    ac2: Color,
}
let extendPaints = (bp: BasicPaints): FullPaints => ({
    gr6: bp.gr6,
    gr5: cLerp(bp.gr0, bp.gr6, 0.79),
    gr4: cLerp(bp.gr0, bp.gr6, 0.60),
    gr3: cLerp(bp.gr0, bp.gr6, 0.44),
    gr2: cLerp(bp.gr0, bp.gr6, 0.30),
    gr1: cLerp(bp.gr0, bp.gr6, 0.16),
    gr0: bp.gr0,

    ac4: cLerp(bp.ac3, bp.gr6, 0.31),
    ac3: bp.ac3,
    ac2: cLerp(bp.ac3, bp.gr0, 0.31),
});
let invertPaints = (fp: FullPaints): FullPaints => ({
    gr6: fp.gr0,
    gr5: fp.gr1,
    gr4: fp.gr2,
    gr3: fp.gr3,
    gr2: fp.gr4,
    gr1: fp.gr5,
    gr0: fp.gr6,

    ac4: fp.ac2,
    ac3: fp.ac3,
    ac2: fp.ac4,
});

interface Theme {
    // brightest
    card: Color,
    page: Color,
    link: Color,
    faintText: Color,
    text: Color,
    // darkest

    quietButtonBg: Color,
    quietButtonBorder: Color | null,
    quietButtonText: Color,

    loudButtonBg: Color,
    loudButtonBorder: Color | null,
    loudButtonText: Color,
}
let theme1 = (fp: FullPaints): Theme => ({
    //                 0123456
    card:                    fp.gr6,
    page:                   fp.gr5,
    link:                 fp.ac3,
    faintText:            fp.gr3,
    text:              fp.gr0,
    //                 -------
    quietButtonBg:        fp.gr3,
    quietButtonBorder: null,
    quietButtonText:         fp.gr6,
    //                 -------
    loudButtonBg:        fp.ac2,
    loudButtonBorder:  null,
    loudButtonText:          fp.gr6,
    //                 0123456
});
let theme2 = (fp: FullPaints): Theme => ({
    //                 0123456
    card:                    fp.gr6,
    page:                   fp.gr5,
    link:                 fp.ac3,
    faintText:            fp.gr3,
    text:               fp.gr1,
    //                 -------
    quietButtonBg:           fp.gr6,
    quietButtonBorder:      fp.gr5,
    quietButtonText:     fp.gr2,
    //                 -------
    loudButtonBg:          fp.ac4,
    loudButtonBorder:  null,
    loudButtonText:    fp.gr0,
    //                 0123456
});

export default function App() {
    let [gr6, setGr6] = useState(cFromHexString(lightYellow));
    let [gr0, setGr0] = useState(cFromHexString(darkPurple));
    let [ac3, setAc3] = useState(cFromHexString(cyan));
    let basicPaints = { gr6, gr0, ac3 };
    let fp = extendPaints(basicPaints);
    let ip = invertPaints(fp);

    return (
        <div>
            <div>
                <p>Click to change colors:</p>
                <div className='indent'>
                    <ColorInput label="light" c={gr6} set={setGr6} />
                    <ColorInput label="accent" c={ac3} set={setAc3} />
                    <ColorInput label="dark" c={gr0} set={setGr0} />
                    <p>accent luminance should match gr3 luminance: {Math.round(luminance(fp.gr3)*100)/100}</p>
                </div>
                <p>Computed palette</p>
                <div className='group'>
                    <ColorSwatch c={fp.gr6} label="gr6" />
                    <ColorSwatch c={fp.gr5} label="gr5" />
                    <ColorSwatch c={fp.gr4} label="gr4" />
                    <ColorSwatch c={fp.gr3} label="gr3" />
                    <ColorSwatch c={fp.gr2} label="gr2" />
                    <ColorSwatch c={fp.gr1} label="gr1" />
                    <ColorSwatch c={fp.gr0} label="gr0" />
                </div>
                <br/>
                <div className='group'>
                    <ColorSwatch c={fp.gr6}   label=""    />
                    <ColorSwatch c={fp.gr6}   label=""    />
                    <ColorSwatch c={fp.ac4}   label="ac4" />
                    <ColorSwatch c={fp.ac3}   label="ac3" />
                    <ColorSwatch c={fp.ac2}   label="ac2" />
                    <ColorSwatch c={fp.gr0}   label=""    />
                    <ColorSwatch c={fp.gr0}   label=""    />
                </div>
                <p>Contrast Ratios</p>
                <div className='columnBlock'>
                    <div className='group'>
                        <ColorSwatch c={fp.gr6} label="gr6" />
                        <ColorSwatch c={fp.gr3} label="gr3" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr6, fp.gr3)*100)/100}
                        <br/>
                        <ColorSwatch c={fp.gr3} label="gr3" />
                        <ColorSwatch c={fp.gr0} label="gr0" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr3, fp.gr0)*100)/100}
                        <br/>
                        <br/>
                        <ColorSwatch c={fp.gr6} label="gr6" />
                        <ColorSwatch c={fp.gr2} label="gr2" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr6, fp.gr2)*100)/100}
                        <br/>
                        <ColorSwatch c={fp.gr5} label="gr5" />
                        <ColorSwatch c={fp.gr1} label="gr1" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr5, fp.gr1)*100)/100}
                        <br/>
                        <ColorSwatch c={fp.gr4} label="gr4" />
                        <ColorSwatch c={fp.gr0} label="gr0" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr4, fp.gr0)*100)/100}
                        <br/>
                        <br/>
                        <ColorSwatch c={fp.gr6} label="gr6" />
                        <ColorSwatch c={fp.gr1} label="gr1" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr6, fp.gr1)*100)/100}
                        <br/>
                        <ColorSwatch c={fp.gr5} label="gr5" />
                        <ColorSwatch c={fp.gr0} label="gr0" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr5, fp.gr0)*100)/100}
                    </div>
                </div>
                <div className='columnBlock'>
                    <div className='group'>
                        <ColorSwatch c={fp.gr6} label="gr6" />
                        <ColorSwatch c={fp.gr5} label="gr5" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr6, fp.gr5)*100)/100}
                        <br/>
                        <ColorSwatch c={fp.gr5} label="gr5" />
                        <ColorSwatch c={fp.gr4} label="gr4" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr5, fp.gr4)*100)/100}
                        <br/>
                        <ColorSwatch c={fp.gr4} label="gr4" />
                        <ColorSwatch c={fp.gr3} label="gr3" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr4, fp.gr3)*100)/100}
                        <br/>
                        <ColorSwatch c={fp.gr3} label="gr3" />
                        <ColorSwatch c={fp.gr2} label="gr2" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr3, fp.gr2)*100)/100}
                        <br/>
                        <ColorSwatch c={fp.gr2} label="gr2" />
                        <ColorSwatch c={fp.gr1} label="gr1" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr2, fp.gr1)*100)/100}
                        <br/>
                        <ColorSwatch c={fp.gr1} label="gr1" />
                        <ColorSwatch c={fp.gr0} label="gr0" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr1, fp.gr0)*100)/100}
                    </div>
                </div>
                <div className='columnBlock'>
                    <div className='group'>
                        <ColorSwatch c={fp.gr6} label="gr6" />
                        <ColorSwatch c={fp.ac3} label="ac3" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr6, fp.ac3)*100)/100}
                        <br/>
                        <ColorSwatch c={fp.ac3} label="ac3" />
                        <ColorSwatch c={fp.gr0} label="gr0" />
                        &nbsp;{Math.floor(contrastRatio(fp.ac3, fp.gr0)*100)/100}
                        <br/>
                        <br/>
                        <ColorSwatch c={fp.gr6} label="gr6" />
                        <ColorSwatch c={fp.ac2} label="ac2" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr6, fp.ac2)*100)/100}
                        <br/>
                        <ColorSwatch c={fp.ac4} label="ac4" />
                        <ColorSwatch c={fp.gr0} label="gr0" />
                        &nbsp;{Math.floor(contrastRatio(fp.ac4, fp.gr0)*100)/100}
                        <br/>
                        <br/>
                        <ColorSwatch c={fp.ac4} label="ac4" />
                        <ColorSwatch c={fp.ac3} label="ac3" />
                        &nbsp;{Math.floor(contrastRatio(fp.ac4, fp.ac3)*100)/100}
                        <br/>
                        <ColorSwatch c={fp.ac3} label="ac3" />
                        <ColorSwatch c={fp.ac2} label="ac2" />
                        &nbsp;{Math.floor(contrastRatio(fp.ac3, fp.ac2)*100)/100}
                    </div>
                </div>
                <div className='columnBlock'>
                    <div className='group'>
                        <ColorSwatch c={fp.gr4} label="gr4" />
                        <ColorSwatch c={fp.ac4} label="ac4" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr4, fp.ac4)*100)/100}
                        <br/>
                        <ColorSwatch c={fp.gr3} label="gr3" />
                        <ColorSwatch c={fp.ac3} label="ac3" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr3, fp.ac3)*100)/100}
                        <br/>
                        <ColorSwatch c={fp.gr2} label="gr2" />
                        <ColorSwatch c={fp.ac2} label="ac2" />
                        &nbsp;{Math.floor(contrastRatio(fp.gr2, fp.ac2)*100)/100}
                        <br/>
                    </div>
                </div>
            </div>
            <div>
                <p>Demo2</p>
                <div className='group'>
                    <ColorDemo2
                        title="Theme 1 light mode"
                        theme={theme1(fp)}
                        />
                    <ColorDemo2
                        title="Theme 1 dark mode"
                        theme={theme1(ip)}
                        />
                    <br/>
                    <br/>
                    <ColorDemo2
                        title="Theme 2 light mode"
                        theme={theme2(fp)}
                        />
                    <ColorDemo2
                        title="Theme 2 dark mode"
                        theme={theme2(ip)}
                        />
                </div>
            </div>
            <div>
                <p>Theme 1</p>
                <ContrastSwatches theme={theme1(fp)} />
                <br/>
                <br/>
                <ContrastSwatches theme={theme1(invertPaints(fp))} />
            </div>
            <div>
                <p>Theme 2</p>
                <ContrastSwatches theme={theme2(fp)} />
                <br/>
                <br/>
                <ContrastSwatches theme={theme2(invertPaints(fp))} />
            </div>
            <pre>
                palette:
                <br/>
                {JSON.stringify(colorObjToHexObj(fp as any), null, 4)}
                <br/>
                <br/>
                theme1 light:
                <br/>
                {JSON.stringify(colorObjToHexObj(theme1(fp) as any), null, 4)}
                <br/>
                <br/>
                theme1 dark:
                <br/>
                {JSON.stringify(colorObjToHexObj(theme1(ip) as any), null, 4)}
            </pre>
        </div>
    );
}

let ContrastSwatches = ({theme}: {theme: Theme}) => (
    <div className='group'>
        <ColorDemo1
            title="regular text"
            bg={theme.card}
            text={theme.text}
            />
        <ColorDemo1
            title="faintText"
            bg={theme.card}
            text={theme.faintText}
            />
        <ColorDemo1
            title="page text"
            bg={theme.page}
            text={theme.text}
            />
        <ColorDemo1
            title="faintText page"
            bg={theme.page}
            text={theme.faintText}
            />
        <ColorDemo1
            title="link"
            bg={theme.card}
            text={theme.link}
            />
        <ColorDemo1
            title="quiet button"
            bg={theme.quietButtonBg}
            text={theme.quietButtonText}
            />
        <ColorDemo1
            title="loud button"
            bg={theme.loudButtonBg}
            text={theme.loudButtonText}
            />
    </div>
);

type ColorSwatchProps = {
    c: Color,
    selected?: boolean,
    label?: string,
}
let ColorSwatch = ({ c, selected, label }: ColorSwatchProps) => (
    <div style={{
        display: 'inline-block',
        width: 40,
        height: 40,
        background: cToHexString(c),
        verticalAlign: 'middle',
        textAlign: 'center',
        paddingTop: 9,
        color: 'black',
    }}>
        <div style={{
            color: 'black',
            textShadow: '1px 1px 0px white',
            opacity: selected ? 0.3 : 0.7,
            fontSize: selected ? '150%' : '80%',
            overflow: 'hidden',
        }}>
            {selected ? '︿' : null}
            {label ? label : null}
        </div>
    </div>
);

type ColorInputProps = {
    label: string,
    c: Color,
    set?: (c: Color) => void,
}
let ColorInput = ({ label, c, set }: ColorInputProps) =>
    <div>
        <div className='colorInputWrapper'>
            <input type="color"
                value={cToHexString(c)}
                onChange={(e) => {
                    if (set) {
                        set(cFromHexString(e.target.value))
                    }
                }}
            />
        </div>
        <b>{' ' + label}</b>
        <code>{' ' + cToHexString(c)}</code>
        <code>{' ' + cToRgbString(c)}</code>
        luminance: {Math.round(luminance(c)*100)/100}
    </div>;

let contrastReport = (c1: Color, c2: Color): string => {
    let ratio = contrastRatio(c1, c2);
    let ratioString = '' + (Math.round(ratio * 100) / 100);
    let score = '❌'
    if (ratio > 3) { score = '😞'; }
    if (ratio > 4.5) { score = '❇️❇️'; }
    if (ratio > 7.0) { score = '🎆🎆🎆️️️️'; }
    return `${score} ${ratioString}`;
}

type ColorDemo1Props = {
    bg: Color,
    text: Color,
    title?: string,
}
let ColorDemo1 = ({ bg, text, title }: ColorDemo1Props) => (
    <div style={{
        background: cToHexString(bg),
        color: cToHexString(text),
        padding: '20px 30px',
        width: 180,
        display: 'inline-block',
    }}>
        <div>{contrastReport(text, bg)}</div>
        <br/>
        <div>{title || 'Example'}</div>
    </div>
);

type ColorDemo2Props = {
    theme: Theme,
    title?: string,
}
let ColorDemo2 = ({ theme, title }: ColorDemo2Props) => (
    <div style={{
        background: cToHexString(theme.page),
        color: cToHexString(theme.text),
        padding: '20px 40px',
        width: 360,
        display: 'inline-block',
    }}>
        <div style={{
            // card
            padding: 20,
            background: cToHexString(theme.card),
            borderRadius: 10,
            boxShadow: '5px 15px 20px -5px rgba(0,0,0,0.17)',
        }}>
            <div><b>{title || "Title"}</b></div>
            <br/>
            <div>
                Hello this is
                a <b style={{color: cToHexString(theme.link)}}>demo</b> of
                theme colors on some text.  Is it good?
            </div>
            <br/>
            <div style={{color: cToHexString(theme.faintText)}}>
                Faint text looks like this.
            </div>
            <br/>
            <div className='right'>
                <FakeButton bg={theme.quietButtonBg} text={theme.quietButtonText} border={theme.quietButtonBorder} caption="No" />
                <FakeButton bg={theme.loudButtonBg} text={theme.loudButtonText} border={theme.loudButtonBorder} caption="Ok" />
            </div>
        </div>
        <br/>
        <div>
            Here's some more text against the page color.
        </div>
        <br/>
        <div style={{color: cToHexString(theme.faintText)}}>
            Faint text looks like this.
        </div>
    </div>
);

type FakeButtonProps = {
    bg: Color,
    text: Color,
    border: Color | null,
    caption: string,
}
let FakeButton = ({ bg, text, border, caption }: FakeButtonProps) => (
    <div style={{
        background: cToHexString(bg),
        color: cToHexString(text),
        borderRadius: 10,
        padding: border ? '8px 13px' : '10px 15px',
        margin: '2px 5px',
        fontWeight: 'bold',
        display: 'inline-block',
        border: border ? '2px solid ' + cToHexString(border) : undefined,
        //boxShadow: '3px 5px 8px -2px rgba(0,0,0,0.3)',
    }}>
        {caption}
    </div>
)
