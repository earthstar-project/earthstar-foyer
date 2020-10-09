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

export default function App() {
    let [cWh, setCWh] = useState(cFromHexString(solbase3));
    let [cBl, setCBl] = useState(cFromHexString(solbase03));
    let [cAc, setCAc] = useState(cFromHexString(solviolet));
    let [threshold, setThreshold] = useState(5.5);
    let [faintThreshold, setFaintThreshold] = useState(1.333);

    let cGr = cLerp(cWh, cBl, 0.5);
    let mode = ContrastMode.BOTH;  // BOTH or INCREASE_ONLY

    // bleach: range 0-1.
    // what happens when the given cBl and cWh are not contrasty enough?
    // 0: accent color hits limit at cBl and cWh
    // 1: accent color goes past limits to pure black / white
    let bleach = 0.5;
    let cBlBl = cLerp(cBl, black, bleach);
    let cWhWh = cLerp(cWh, white, bleach);

    let cAcOnBl = traversePaletteUntilContrast([cBl, cAc, cWhWh], threshold, mode);
    let cAcOnWh = traversePaletteUntilContrast([cWh, cAc, cBlBl], threshold, mode);
    let cGrOnBl = traversePaletteUntilContrast([cBl, cWh], threshold, mode);
    let cGrOnWh = traversePaletteUntilContrast([cWh, cBl], threshold, mode);

    let gradSize = 9;
    let graddedMono = resamplePalette([cWh, cBl], gradSize);
    let graddedAccent = resamplePalette([cWh, cAc, cBl], gradSize);
    let graddedAcOnBl = resamplePalette([cWhWh, cAc, cBl], gradSize);
    let graddedAcOnWh = resamplePalette([cWh, cAc, cBlBl], gradSize);

    let threshPalettes: Palette[] = [];
    let demoThresholds = [1.25, 2, 3, 4.5, 6, 7, 8.5, 10, 15];
    for (let threshold of demoThresholds) {
        threshPalettes.push([
            cWh,
            traversePaletteUntilContrast([cWh, cAc, cBlBl], threshold, mode),
            traversePaletteUntilContrast([cBl, cAc, cWhWh], threshold, mode),
            cBl,
        ]);
    }

    let cWh2 = traversePaletteUntilContrast([cWh, cBl], faintThreshold);
    let cBl2 = traversePaletteUntilContrast([cBl, cWh], faintThreshold);

    let names: ColorNames = {
        cWh, cBl,
        cWh2, cBl2,
        cAc, cAcOnWh, cAcOnBl,
        cGr, cGrOnWh, cGrOnBl,
    }

    return (
        <div>
            <div className='columnBlock'>
                <ColorInput label="light" c={cWh} set={setCWh} />
                <ColorInput label="accent" c={cAc} set={setCAc} />
                <ColorInput label="dark" c={cBl} set={setCBl} />
                <div>
                    <input type="range"
                        min={1} max={20} step={0.5}
                        value={threshold}
                        style={{
                            width: 300,
                        }}
                        onChange={(e) => setThreshold(parseFloat(e.target.value))}
                        />
                    <b>contrast threshold</b>
                    <code style={{marginLeft: 10, width: '4ch', display: 'inline-block'}}>
                        {' ' + threshold}
                    </code>
                </div>
                <div>
                    <input type="range"
                        min={1} max={7.5} step={0.25}
                        value={faintThreshold}
                        style={{
                            width: 300,
                        }}
                        onChange={(e) => setFaintThreshold(parseFloat(e.target.value))}
                        />
                    <b>faint threshold</b>
                    <code style={{marginLeft: 10, width: '4ch', display: 'inline-block'}}>
                        {' ' + faintThreshold}
                    </code>
                </div>
                <div>
                    <p>Gradients</p>
                    <div className='card'>
                        {graddedMono.map((c, ii) => <ColorSwatch key={ii} c={c} />)}
                        <br/>
                        {graddedAccent.map((c, ii) =>
                            <ColorSwatch key={ii} c={c} selected={ii===gradSize/2-0.5}/>
                        )}
                        <br/>
                        <br/>
                        {graddedAcOnBl.map((c, ii) => <ColorSwatch key={ii} c={c} />)}
                        <br/>
                        {graddedAcOnWh.map((c, ii) => <ColorSwatch key={ii} c={c} />)}
                    </div>
                </div>
                <div className='columnBlock'>
                    <p>Accent color adjustment</p>
                    <div className='card'>
                        <ColorSwatch c={cWh}                     />
                        <ColorSwatch c={cGrOnWh}                 />
                        <ColorSwatch c={cGr}                     />
                        <ColorSwatch c={cGrOnBl}                 />
                        <ColorSwatch c={cBl}                     />
                        <br/>
                        <ColorSwatch c={cWh}                     />
                        <ColorSwatch c={cAcOnWh}                 />
                        <ColorSwatch c={cAc}     selected={true} />
                        <ColorSwatch c={cAcOnBl}                 />
                        <ColorSwatch c={cBl}                     />
                    </div>
                </div>
                <div className='columnBlock'>
                    <p>Computed palette</p>
                    <div className='card'>
                        <ColorSwatch c={cWh}     label="Wh"   />
                        <ColorSwatch c={cAcOnWh} label="AcW"  />
                        <ColorSwatch c={cAcOnBl} label="AcB"  />
                        <ColorSwatch c={cBl}     label="Bl"   />
                        <br/>
                        <ColorSwatch c={cWh}     label=""    />  
                        <ColorSwatch c={cGrOnWh} label="GrW" />
                        <ColorSwatch c={cGrOnBl} label="GrB" />
                        <ColorSwatch c={cBl}     label=""    />
                        <br/>
                        <ColorSwatch c={cWh}     label=""    />
                        <ColorSwatch c={cWh2}    label="Wh2" />
                        <ColorSwatch c={cBl2}    label="Bl2" />
                        <ColorSwatch c={cBl}     label=""    />
                    </div>
                </div>
            </div>
            <div className='columnBlock'>
                <p>Varying the threshold</p>
                <div className='card'>
                    {threshPalettes.map((grad, gg) =>
                        <>
                            {grad.map((c, ii) =>
                                <ColorSwatch key={ii} c={c} />
                            )}
                            <span>&nbsp;{demoThresholds[gg]}&nbsp;</span>
                            <br />
                        </>
                    )}
                </div>
            </div>
            <p>Demo2</p>
            <div className='columnBlock'>
                <div className='card'>
                    <ColorDemo2
                        bg={cWh} text={cBl}
                        link={cAcOnWh}
                        buttonBg={cAcOnBl} buttonText={cBl}
                        caption="Bl on AcOnBl"
                    />
                    <ColorDemo2
                        bg={cBl} text={cWh}
                        link={cAcOnBl}
                        buttonBg={cAcOnWh} buttonText={cWh}
                        caption="Wh on AcOnWh"
                    />
                    <br/>
                    <ColorDemo2
                        bg={cWh} text={cBl}
                        link={cAcOnWh}
                        buttonBg={cAcOnWh} buttonText={cWh}
                        caption="Wh on AcOnWh"
                    />
                    <ColorDemo2
                        bg={cBl} text={cWh}
                        link={cAcOnBl}
                        buttonBg={cAcOnBl} buttonText={cBl}
                        caption="Bl on AcOnBl"
                    />
                    <br/>
                    <ColorDemo2
                        bg={cWh} text={cBl}
                        link={cAcOnWh}
                        buttonBg={cWh} buttonText={cAcOnWh}
                        caption="AcOnWh on Wh"
                    />
                    <ColorDemo2
                        bg={cBl} text={cWh}
                        link={cAcOnBl}
                        buttonBg={cBl} buttonText={cAcOnBl}
                        caption="AcOnBl on Bl"
                    />
                    <br/>
                    <br/>

                    <ColorDemo2
                        bg={cWh} text={cBl}
                        link={cAcOnWh}
                        buttonBg={cBl} buttonText={cAcOnBl}
                        caption="AcOnBl on Bl"
                    />
                    <ColorDemo2
                        bg={cBl} text={cWh}
                        link={cAcOnBl}
                        buttonBg={cWh} buttonText={cAcOnWh}
                        caption="AcOnWh on Wh"
                    />
                    <br/>
                    <ColorDemo2
                        bg={cWh} text={cBl}
                        link={cAcOnWh}
                        buttonBg={cWh2} buttonText={cAcOnWh}
                        caption="AcOnWh on Wh2"
                    />
                    <ColorDemo2
                        bg={cBl} text={cWh}
                        link={cAcOnBl}
                        buttonBg={cBl2} buttonText={cAcOnBl}
                        caption="AcOnBl on Bl2"
                    />
                </div>
            </div>
            <div className='columnBlock'>
                <div className='card'>
                    <ColorDemo2
                        bg={cWh} text={cBl}
                        link={cGrOnWh}
                        buttonBg={cGrOnBl} buttonText={cBl}
                        caption="Bl on GrOnBl"
                    />
                    <ColorDemo2
                        bg={cBl} text={cWh}
                        link={cGrOnBl}
                        buttonBg={cGrOnWh} buttonText={cWh}
                        caption="Wh on GrOnWh"
                    />
                    <br/>
                    <ColorDemo2
                        bg={cWh} text={cGrOnWh}
                        link={cBl}
                        buttonBg={cGrOnWh} buttonText={cWh}
                        caption="Wh on GrOnWh"
                    />
                    <ColorDemo2
                        bg={cBl} text={cGrOnBl}
                        link={cWh}
                        buttonBg={cGrOnBl} buttonText={cBl}
                        caption="Bl on GrOnBl"
                    />
                    <br/>
                    <br/>

                    <ColorDemo2
                        bg={cWh} text={cBl}
                        link={cGrOnWh}
                        buttonBg={cWh2} buttonText={cBl2}
                        caption="Bl2 on Wh2"
                    />
                    <ColorDemo2
                        bg={cBl} text={cWh}
                        link={cGrOnBl}
                        buttonBg={cBl2} buttonText={cWh2}
                        caption="Wh2 on Bl2"
                    />
                    <br/>
                    <br/>

                    <ColorDemo2
                        bg={cWh} text={cGr}
                        link={cBl}
                        buttonBg={cGr} buttonText={cWh}
                        caption="Wh on Gr (gr)"
                    />
                    <ColorDemo2
                        bg={cBl} text={cGr}
                        link={cWh}
                        buttonBg={cGr} buttonText={cBl}
                        caption="Bl on Gr (gr)"
                    />
                    <br/>
                    <ColorDemo2
                        bg={cWh} text={cBl}
                        link={cGr}
                        buttonBg={cGr} buttonText={cWh}
                        caption="Wh on Gr"
                    />
                    <ColorDemo2
                        bg={cBl} text={cWh}
                        link={cGr}
                        buttonBg={cGr} buttonText={cBl}
                        caption="Bl on Gr"
                    />
                    <br/>
                    <ColorDemo2
                        bg={cWh} text={cBl}
                        link={cGr}
                        buttonBg={cGr} buttonText={cBl}
                        caption="Bl on Gr"
                    />
                    <ColorDemo2
                        bg={cBl} text={cWh}
                        link={cGr}
                        buttonBg={cGr} buttonText={cWh}
                        caption="Wh on Gr"
                    />
                    <br/>
                    <ColorDemo2
                        bg={cWh} text={cBl}
                        link={cGrOnWh}
                        buttonBg={cWh} buttonText={cGr}
                        caption="Gr on Wh"
                    />
                    <ColorDemo2
                        bg={cBl} text={cWh}
                        link={cGrOnBl}
                        buttonBg={cBl} buttonText={cGr}
                        caption="Gr on Bl"
                    />
                </div>
            </div>
            <p>Demo1</p>
            <div className='card'>
                <div>
                    {/* light mode, dark mode*/}
                    <ColorDemo1 bg={cWh} text={cBl} title="Light mode" />
                    <ColorDemo1 bg={cBl} text={cWh} title="Dark mode" />
                </div>
            </div>
            <br/>
            <br/>
            <div className='columnBlock'>
                <div className='card'>
                    <div>
                        {/* light mode, dark mode with accent text */}
                        <ColorDemo1 bg={cWh} text={cAcOnWh} title="Computed accent color" />
                        <ColorDemo1 bg={cAcOnWh} text={cWh} title="Computed accent color" />
                    </div>
                    <div>
                        {/* light mode, dark mode on accent bg */}
                        <ColorDemo1 bg={cAcOnBl} text={cBl} title="Computed accent color" />
                        <ColorDemo1 bg={cBl} text={cAcOnBl} title="Computed accent color" />
                    </div>
                </div>
                <br/>
                <br/>
            </div>
            <div className='columnBlock'>
                <div className='card'>
                    <div>
                        {/* light mode, dark mode with accent text */}
                        <ColorDemo1 bg={cWh} text={cAc} title="Original accent color" />
                        <ColorDemo1 bg={cAc} text={cWh} title="Original accent color" />
                    </div>
                    <div>
                        {/* light mode, dark mode on accent bg */}
                        <ColorDemo1 bg={cAc} text={cBl} title="Original accent color" />
                        <ColorDemo1 bg={cBl} text={cAc} title="Original accent color" />
                    </div>
                </div>
            </div>
        </div>
    );
}

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
        textShadow: '1px 1px 0px #ffffff',
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
    let score = '😞'
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
        //marginLeft: 20,
        //marginTop: 20,
        width: 250,
        //border: '1px dotted black',
        display: 'inline-block',
        //borderRadius: 5,
    }}>
        <div>{contrastReport(text, bg)}</div>
        <br/>
        <div>{title || 'Example'}</div>
        <br/>
        <div>Hello this is a <b>demo</b> of <i>text</i> on a background.</div>
    </div>
);

type ColorDemo2Props = {
    bg: Color,
    text: Color,
    link: Color,
    buttonBg: Color,
    buttonText: Color,
    caption?: string,
}
let ColorDemo2 = ({ bg, text, link, buttonBg, buttonText, caption }: ColorDemo2Props) => (
    <div style={{
        background: cToHexString(bg),
        color: cToHexString(text),
        padding: '20px 30px',
        width: 250,
        display: 'inline-block',
    }}>
        <div>
            Hello this is
            a <b style={{color: cToHexString(link)}}>demo</b> of text on
            a background.
            <br/>
            <i>{caption}</i>
        </div>
        <br/>
        <div className='right'>
            <FakeButton bg={buttonBg} text={buttonText} caption="Like" />
            <FakeButton bg={buttonBg} text={buttonText} caption="Edit" />
        </div>
    </div>
);

type FakeButtonProps = {
    bg: Color,
    text: Color,
    caption: string,
}
let FakeButton = ({ bg, text, caption }: FakeButtonProps) => (
    <div style={{
        background: cToHexString(bg),
        color: cToHexString(text),
        borderRadius: 10,
        padding: '10px 15px',
        margin: '2px 5px',
        fontWeight: 'bold',
        display: 'inline-block',
    }}>
        {caption}
    </div>
)

