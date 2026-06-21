import { useJoseDAO } from './hooks/useJoseDAO'
import { useTheme } from './hooks/useTheme'
import StatCard from './components/StatCard'
import CreateProposal from './components/CreateProposal'
import ProposalCard from './components/ProposalCard'
import ThemeToggle from './components/ThemeToggle'
import TransactionHistory from './components/TransactionHistory'

const TOKEN_ETHERSCAN = 'https://sepolia.etherscan.io/address/0xfFEc655192F306a555C7ba353F8131391632F7F0'
const DAO_ETHERSCAN = 'https://sepolia.etherscan.io/address/0x1D254B85f2c3ce683977f67aFEd6D46a2EF7c9eF'

function truncateAddress(a) {
  if (!a) return ''
  return a.slice(0, 6) + '...' + a.slice(-4)
}

function formatNumber(n) {
  return parseFloat(n).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export default function App() {
  const hook = useJoseDAO()
  const account = hook.account
  const tokenBalance = hook.tokenBalance
  const totalSupply = hook.totalSupply
  const quorumRequired = hook.quorumRequired
  const proposals = hook.proposals
  const loading = hook.loading
  const txHash = hook.txHash
  const error = hook.error
  const connected = hook.connected
  const history = hook.history
  const connect = hook.connect
  const createProposal = hook.createProposal
  const castVote = hook.castVote
  const queueProposal = hook.queueProposal
  const executeProposal = hook.executeProposal
  const cancelProposal = hook.cancelProposal

  const themeHook = useTheme()
  const mode = themeHook.mode
  const theme = themeHook.theme
  const toggleTheme = themeHook.toggleTheme

  const daoLinkStyle = {
    fontSize: '12px',
    color: theme.purpleLight,
    textDecoration: 'none',
    padding: '4px 12px',
    border: '1px solid ' + theme.purpleBorder,
    borderRadius: '20px',
    background: theme.purpleBg
  }

  const tokenLinkStyle = {
    fontSize: '12px',
    color: theme.purpleLight,
    textDecoration: 'none'
  }

  const txLinkStyle = {
    color: theme.tealLight,
    fontSize: '12px',
    fontFamily: 'monospace',
    textDecoration: 'none'
  }

  const txEtherscanUrl = txHash ? ('https://sepolia.etherscan.io/tx/' + txHash) : ''
  const txShort = txHash ? (txHash.slice(0, 10) + '...' + txHash.slice(-6)) : ''

  const navbar = (
    <nav style={{
      background: theme.surface,
      borderBottom: '1px solid ' + theme.border,
      padding: '0 2rem',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: theme.purple,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: '500',
          color: '#fff'
        }}>
          D
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: theme.text }}>
            JoseDAO
          </div>
          <div style={{ fontSize: '11px', color: theme.textMuted }}>
            On-chain governance — Sepolia
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ThemeToggle mode={mode} onToggle={toggleTheme} theme={theme} />

        <a href={DAO_ETHERSCAN} target="_blank" rel="noopener noreferrer" style={daoLinkStyle}>
          DAO on Etherscan
        </a>

        {connected === true && (
          <div style={{
            fontSize: '12px',
            fontFamily: 'monospace',
            color: theme.purpleLight,
            padding: '4px 12px',
            border: '1px solid ' + theme.purpleBorder,
            borderRadius: '20px',
            background: theme.purpleBg
          }}>
            {truncateAddress(account)}
          </div>
        )}

        {connected === false && (
          <button
            onClick={connect}
            style={{
              height: '34px',
              padding: '0 16px',
              background: theme.purple,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Connect MetaMask
          </button>
        )}
      </div>
    </nav>
  )

  const connectScreen = (
    <div style={{
      textAlign: 'center',
      padding: '4rem 2rem',
      background: theme.surface,
      borderRadius: '16px',
      border: '1px solid ' + theme.border
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>
        🗳️
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: '500', color: theme.text, marginBottom: '8px' }}>
        Connect your wallet
      </h2>
      <p style={{ fontSize: '14px', color: theme.textMuted, marginBottom: '24px' }}>
        Connect MetaMask on Sepolia testnet to participate in governance
      </p>
      <button
        onClick={connect}
        style={{
          height: '44px',
          padding: '0 32px',
          background: theme.purple,
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: '500',
          cursor: 'pointer'
        }}
      >
        Connect MetaMask
      </button>
    </div>
  )

  const statsRow = (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '12px',
      marginBottom: '2rem'
    }}>
      <StatCard label="Your voting power" value={formatNumber(tokenBalance) + ' JGOV'} color={theme.purple} theme={theme} />
      <StatCard label="Total supply" value={formatNumber(totalSupply) + ' JGOV'} color={theme.teal} theme={theme} />
      <StatCard label="Quorum required" value={formatNumber(quorumRequired) + ' JGOV'} color={theme.coral} sub="10% of supply" theme={theme} />
      <StatCard label="Total proposals" value={proposals.length} color={theme.blue} theme={theme} />
    </div>
  )

  const errorBanner = error ? (
    <div style={{
      padding: '12px 16px',
      background: theme.coralBg,
      border: '1px solid ' + theme.coral,
      borderRadius: '8px',
      color: theme.coralLight,
      fontSize: '13px',
      marginBottom: '1rem'
    }}>
      {error}
    </div>
  ) : null

  const txBanner = txHash ? (
    <div style={{
      padding: '12px 16px',
      background: theme.tealBg,
      border: '1px solid ' + theme.teal,
      borderRadius: '8px',
      fontSize: '13px',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <span style={{ color: theme.tealLight }}>
        Transaction confirmed
      </span>
      <a href={txEtherscanUrl} target="_blank" rel="noopener noreferrer" style={txLinkStyle}>
        {txShort}
      </a>
    </div>
  ) : null

  const proposalsList = proposals.length === 0 ? (
    <div style={{
      textAlign: 'center',
      padding: '3rem',
      background: theme.surface,
      borderRadius: '12px',
      border: '1px solid ' + theme.border,
      color: theme.textMuted,
      fontSize: '13px'
    }}>
      No proposals yet. Create the first one above.
    </div>
  ) : (
    proposals.map(function (p) {
      return (
        <ProposalCard
          key={p.id}
          proposal={p}
          quorumRequired={quorumRequired}
          onVote={castVote}
          onQueue={queueProposal}
          onExecute={executeProposal}
          onCancel={cancelProposal}
          loading={loading}
          account={account}
          theme={theme}
        />
      )
    })
  )

  const dashboard = (
    <div>
      {statsRow}
      {errorBanner}
      {txBanner}

      <CreateProposal onCreate={createProposal} loading={loading} theme={theme} />

      <h3 style={{ fontSize: '16px', fontWeight: '500', color: theme.text, marginBottom: '14px' }}>
        Proposals ({proposals.length})
      </h3>

      {proposalsList}

      <TransactionHistory history={history} theme={theme} />

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <a href={TOKEN_ETHERSCAN} target="_blank" rel="noopener noreferrer" style={tokenLinkStyle}>
          View GovernanceToken contract on Etherscan
        </a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: theme.bg }}>
      {navbar}

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '500', color: theme.text, marginBottom: '8px' }}>
          JoseDAO <span style={{ color: theme.purple }}>Governance</span>
        </h1>

        <p style={{ fontSize: '14px', color: theme.textMuted, marginBottom: '2rem', maxWidth: '520px' }}>
          Token-weighted voting with quorum requirements and timelock execution.
          Create proposals, vote with JGOV tokens, and execute on-chain decisions.
        </p>

        {connected === false && connectScreen}
        {connected === true && dashboard}
      </div>
    </div>
  )
}