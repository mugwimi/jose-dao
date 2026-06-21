import { useState, useCallback, useEffect } from 'react'
import { ethers } from 'ethers'
import GovTokenABI from '../contracts/GovernanceToken.json'
import DAOABI from '../contracts/JoseDAO.json'

const TOKEN_ADDRESS = '0xfFEc655192F306a555C7ba353F8131391632F7F0'
const DAO_ADDRESS = '0x1D254B85f2c3ce683977f67aFEd6D46a2EF7c9eF'

const STATE_LABELS = ['Active', 'Defeated', 'Succeeded', 'Queued', 'Executed', 'Expired']
const HISTORY_KEY = 'jose-dao-history'

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

function saveHistory(list) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Could not save history', e)
  }
}

export function useJoseDAO() {
  const [token, setToken] = useState(null)
  const [dao, setDao] = useState(null)
  const [account, setAccount] = useState('')
  const [tokenBalance, setTokenBalance] = useState('0')
  const [totalSupply, setTotalSupply] = useState('0')
  const [quorumRequired, setQuorumRequired] = useState('0')
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)
  const [history, setHistory] = useState(loadHistory)

  const addHistoryItem = useCallback(function (item) {
    setHistory(function (prev) {
      const next = [{ ...item, timestamp: Date.now() }, ...prev].slice(0, 50)
      saveHistory(next)
      return next
    })
  }, [])

  const loadProposals = useCallback(async (_dao, _account) => {
    try {
      const count = await _dao.proposalCount()
      const list = []

      for (let i = 1; i <= Number(count); i++) {
        const p = await _dao.proposals(i)
        const state = await _dao.getProposalState(i)
        const hasVoted = await _dao.hasVoted(i, _account)
        const voteWeight = await _dao.voteWeight(i, _account)

        list.push({
          id: Number(p.id),
          proposer: p.proposer,
          title: p.title,
          description: p.description,
          votesFor: ethers.formatEther(p.votesFor),
          votesAgainst: ethers.formatEther(p.votesAgainst),
          startTime: Number(p.startTime),
          endTime: Number(p.endTime),
          queuedAt: Number(p.queuedAt),
          executed: p.executed,
          canceled: p.canceled,
          state: STATE_LABELS[Number(state)],
          hasVoted,
          voteWeight: ethers.formatEther(voteWeight)
        })
      }

      list.reverse()
      setProposals(list)
    } catch (err) {
      console.error('loadProposals error:', err)
    }
  }, [])

  const loadData = useCallback(async (_token, _dao, _account) => {
    try {
      const bal = await _token.balanceOf(_account)
      const supply = await _token.totalSupply()
      const quorum = await _dao.getQuorumRequired()

      setTokenBalance(ethers.formatEther(bal))
      setTotalSupply(ethers.formatEther(supply))
      setQuorumRequired(ethers.formatEther(quorum))

      await loadProposals(_dao, _account)
    } catch (err) {
      console.error('loadData error:', err)
      setError('Failed to load DAO data: ' + (err.message || ''))
    }
  }, [loadProposals])

  const connect = useCallback(async () => {
    try {
      setError('')

      if (!window.ethereum) {
        setError('MetaMask not detected. Please install MetaMask.')
        return
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' })

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const _account = await signer.getAddress()

      const network = await provider.getNetwork()
      const chainId = Number(network.chainId)

      if (chainId !== 11155111) {
        setError('Wrong network. Please switch MetaMask to Sepolia testnet.')
        return
      }

      const _token = new ethers.Contract(TOKEN_ADDRESS, GovTokenABI.abi, signer)
      const _dao = new ethers.Contract(DAO_ADDRESS, DAOABI.abi, signer)

      setToken(_token)
      setDao(_dao)
      setAccount(_account)
      setConnected(true)

      await loadData(_token, _dao, _account)

    } catch (err) {
      console.error('connect error:', err)
      setError(err.message || 'Failed to connect wallet')
    }
  }, [loadData])

  useEffect(() => {
    if (!window.ethereum) return

    function handleAccountsChanged() {
      connect()
    }

    function handleChainChanged() {
      connect()
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return function () {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [connect])

  const refresh = useCallback(() => {
    if (token && dao && account) loadData(token, dao, account)
  }, [token, dao, account, loadData])

  const sendTx = async (txPromise, historyMeta) => {
    setLoading(true)
    setError('')
    setTxHash('')
    try {
      const tx = await txPromise
      setTxHash(tx.hash)
      await tx.wait()
      addHistoryItem({ ...historyMeta, txHash: tx.hash })
      await loadData(token, dao, account)
    } catch (err) {
      console.error('tx error:', err)
      setError(err.reason || err.shortMessage || err.message || 'Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  const createProposal = (title, description) =>
    sendTx(dao.createProposal(title, description), { type: 'create' })

  const castVote = (proposalId, support) =>
    sendTx(
      dao.castVote(proposalId, support),
      { type: support ? 'voteFor' : 'voteAgainst', proposalId }
    )

  const queueProposal = (proposalId) =>
    sendTx(dao.queueProposal(proposalId), { type: 'queue', proposalId })

  const executeProposal = (proposalId) =>
    sendTx(dao.executeProposal(proposalId), { type: 'execute', proposalId })

  const cancelProposal = (proposalId) =>
    sendTx(dao.cancelProposal(proposalId), { type: 'cancel', proposalId })

  return {
    account, tokenBalance, totalSupply, quorumRequired,
    proposals, loading, txHash, error, connected, history,
    connect, refresh, createProposal, castVote,
    queueProposal, executeProposal, cancelProposal
  }
}