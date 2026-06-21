export default function StatCard({ label, value, color, sub, theme }) {
  return (
    <div style={{
      background: theme.surface,
      border: '1px solid ' + theme.border,
      borderRadius: '12px',
      padding: '1.25rem',
      borderTop: '3px solid ' + color
    }}>
      <div style={{
        fontSize: '11px',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '8px'
      }}>
        {label}
      </div>
      <div style={{ fontSize: '22px', fontWeight: '500', color: theme.text }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px' }}>
          {sub}
        </div>
      )}
    </div>
  )
}