import { useState } from 'react'

export default function CreateProposal({ onCreate, loading, theme }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return
    onCreate(title.trim(), description.trim())
    setTitle('')
    setDescription('')
  }

  return (
    <div style={{
      background: theme.surface,
      border: '1px solid ' + theme.border,
      borderRadius: '12px',
      padding: '1.25rem',
      marginBottom: '2rem'
    }}>
      <h3 style={{ fontSize: '14px', fontWeight: '500', color: theme.text, marginBottom: '14px' }}>
        Create a proposal
      </h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', color: theme.textMuted, display: 'block', marginBottom: '5px' }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={function (e) { setTitle(e.target.value) }}
            placeholder="e.g. Increase treasury allocation"
            required
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px',
              background: theme.inputBg,
              border: '1px solid ' + theme.border,
              borderRadius: '8px',
              color: theme.text,
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', color: theme.textMuted, display: 'block', marginBottom: '5px' }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={function (e) { setDescription(e.target.value) }}
            placeholder="Explain what this proposal does..."
            required
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: theme.inputBg,
              border: '1px solid ' + theme.border,
              borderRadius: '8px',
              color: theme.text,
              fontSize: '13px',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            height: '38px',
            background: loading ? theme.border : theme.purple,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Waiting for confirmation...' : 'Submit proposal'}
        </button>
      </form>
    </div>
  )
}