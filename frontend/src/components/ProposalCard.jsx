function getStateColor(state, theme) {
  if (state === 'Active') return theme.blue
  if (state === 'Defeated') return theme.coral
  if (state === 'Succeeded') return theme.teal
  if (state === 'Queued') return theme.amber
  if (state === 'Executed') return theme.purple
  return theme.textMuted
}

export default function ProposalCard({
  proposal, quorumRequired, onVote, onQueue,
  onExecute, onCancel, loading, account, theme
}) {
  const votesFor = parseFloat(proposal.votesFor)
  const votesAgainst = parseFloat(proposal.votesAgainst)
  const totalVotes = votesFor + votesAgainst
  const quorum = parseFloat(quorumRequired)
  const quorumPct = quorum > 0 ? Math.min((totalVotes / quorum) * 100, 100) : 0
  const forPct = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0
  const color = getStateColor(proposal.state, theme)
  const isProposer = proposal.proposer.toLowerCase() === account.toLowerCase()

  const now = Math.floor(Date.now() / 1000)
  const votingActive = now <= proposal.endTime
  const timelockReady = proposal.queuedAt > 0 && now >= proposal.queuedAt + 86400

  function fmt(n) {
    return parseFloat(n).toLocaleString(undefined, { maximumFractionDigits: 1 })
  }

  return (
    <div style={{
      background: theme.surface,
      border: '1px solid ' + theme.border,
      borderRadius: '12px',
      padding: '1.25rem',
      marginBottom: '14px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '4px' }}>
            Proposal #{proposal.id}
          </div>
          <h4 style={{ fontSize: '15px', fontWeight: '500', color: theme.text }}>
            {proposal.title}
          </h4>
        </div>
        <span style={{
          fontSize: '11px',
          padding: '3px 10px',
          borderRadius: '20px',
          background: color + '22',
          color: color,
          border: '1px solid ' + color + '44',
          whiteSpace: 'nowrap'
        }}>
          {proposal.state}
        </span>
      </div>

      <p style={{ fontSize: '13px', color: theme.textFaint, marginBottom: '14px', lineHeight: '1.5' }}>
        {proposal.description}
      </p>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span style={{ color: theme.tealLight }}>For: {fmt(votesFor)} JGOV</span>
          <span style={{ color: theme.coralLight }}>Against: {fmt(votesAgainst)} JGOV</span>
        </div>
        <div style={{ height: '8px', background: theme.inputBg, borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: forPct + '%', background: theme.teal }} />
          <div style={{ width: (100 - forPct) + '%', background: theme.coral }} />
        </div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: theme.textMuted, marginBottom: '4px' }}>
          <span>Quorum progress</span>
          <span>{fmt(totalVotes)} / {fmt(quorum)} JGOV</span>
        </div>
        <div style={{ height: '6px', background: theme.inputBg, borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: quorumPct + '%', background: theme.purple, height: '100%' }} />
        </div>
      </div>

      {proposal.hasVoted && (
        <div style={{
          fontSize: '12px',
          color: theme.purpleLight,
          background: theme.purpleBg,
          border: '1px solid ' + theme.purpleBorder,
          borderRadius: '8px',
          padding: '6px 10px',
          marginBottom: '10px'
        }}>
          You voted with {fmt(proposal.voteWeight)} JGOV voting power
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {votingActive && !proposal.hasVoted && (
          <>
            <button
              onClick={function () { onVote(proposal.id, true) }}
              disabled={loading}
              style={{
                flex: 1, height: '34px', background: theme.teal, color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '12px',
                fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Vote For
            </button>
            <button
              onClick={function () { onVote(proposal.id, false) }}
              disabled={loading}
              style={{
                flex: 1, height: '34px', background: theme.coral, color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '12px',
                fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Vote Against
            </button>
          </>
        )}

        {proposal.state === 'Succeeded' && proposal.queuedAt === 0 && (
          <button
            onClick={function () { onQueue(proposal.id) }}
            disabled={loading}
            style={{
              flex: 1, height: '34px', background: theme.purple, color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: '12px',
              fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Queue for execution
          </button>
        )}

        {proposal.state === 'Queued' && timelockReady && (
          <button
            onClick={function () { onExecute(proposal.id) }}
            disabled={loading}
            style={{
              flex: 1, height: '34px', background: theme.teal, color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: '12px',
              fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Execute proposal
          </button>
        )}

        {proposal.state === 'Queued' && !timelockReady && (
          <div style={{
            flex: 1, textAlign: 'center', fontSize: '12px',
            color: theme.amber, padding: '8px', background: theme.amberBg, borderRadius: '8px'
          }}>
            Timelock active — execute available soon
          </div>
        )}

        {votingActive && isProposer && (
          <button
            onClick={function () { onCancel(proposal.id) }}
            disabled={loading}
            style={{
              height: '34px', padding: '0 14px', background: 'transparent',
              color: theme.textFaint, border: '1px solid ' + theme.border, borderRadius: '8px',
              fontSize: '12px', cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}