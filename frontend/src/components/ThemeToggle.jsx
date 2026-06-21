export default function ThemeToggle({ mode, onToggle, theme }) {
  return (
    <button
      onClick={onToggle}
      title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: '34px',
        height: '34px',
        borderRadius: '8px',
        background: theme.purpleBg,
        border: '1px solid ' + theme.purpleBorder,
        color: theme.purpleLight,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '15px'
      }}
    >
      {mode === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}