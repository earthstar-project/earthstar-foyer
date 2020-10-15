import {
    Theme,
} from './theme';

export let makeStyles = (theme: Theme) => {
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
    return {sPage, sCard, sLoudButton, sQuietButton};
}
