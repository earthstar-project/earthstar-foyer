import {
    Theme,
} from './theme';

export interface Styles {
    sPage: React.CSSProperties,
    sCard: React.CSSProperties,
    sLoudButton: React.CSSProperties,
    sQuietButton: React.CSSProperties,
    sTextInput: React.CSSProperties,
}

export let makeStyles = (theme: Theme): Styles => {
    let sPage: React.CSSProperties = {
        background: theme.page,
        color: theme.text,
    }
    let sCard: React.CSSProperties = {
        background: theme.card,
        color: theme.text,
        padding: 'var(--s0)',
        borderRadius: 'var(--slightlyRound)',
        boxShadow: '5px 15px 20px -5px rgba(0,0,0,0.17)',
    }
    let sLoudButton: React.CSSProperties = {
        background: theme.loudButtonBg,
        color: theme.loudButtonText,
        borderRadius: 10,
        padding: theme.loudButtonBorder === 'none' ? '8px 13px' : '10px 15px',
        margin: '2px 5px',
        fontWeight: 'bold',
        display: 'inline-block',
        border: theme.loudButtonBorder === 'none' ? 'none' : '2px solid ' + theme.loudButtonBorder,
    }
    let sQuietButton: React.CSSProperties = {
        ...sLoudButton,
        background: theme.quietButtonBg,
        color: theme.quietButtonText,
        padding: theme.quietButtonBorder === 'none' ? '8px 13px' : '10px 15px',
        border: theme.quietButtonBorder === 'none' ? 'none' : '2px solid ' + theme.quietButtonBorder,
    }
    let sTextInput: React.CSSProperties = {
        border: theme.textInputBorder === 'none' ? 'none' : '2px solid ' + theme.textInputBorder,
        background: theme.textInputBg,
        color: theme.textInputText,

        // same padding as button
        padding: theme.textInputBorder === 'none' ? '8px 13px' : '10px 15px',
    }
    return {sPage, sCard, sLoudButton, sQuietButton, sTextInput};
}
