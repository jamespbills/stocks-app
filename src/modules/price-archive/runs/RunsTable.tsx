import type { CSSProperties, ReactElement } from 'react'
import type { PriceRun, RunStatus } from '../types'

const RUN_STATUS_COLOR: Record<RunStatus, string> = {
  running: 'var(--color-text-muted)',
  ok: 'var(--color-up)',
  partial: 'var(--color-warning)',
  no_data: 'var(--color-text-muted)',
  failed: 'var(--color-danger)'
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '0 var(--space-4)',
  height: 32,
  fontSize: 10.5,
  fontWeight: 'var(--font-medium)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--color-text-muted)',
  position: 'sticky',
  top: 0,
  background: 'var(--color-bg-surface)',
  borderBottom: '1px solid var(--color-border-default)',
  whiteSpace: 'nowrap'
}

const tdStyle: CSSProperties = {
  padding: '0 var(--space-4)',
  height: 'var(--table-row-height-compact)',
  fontSize: 11.5,
  fontFamily: 'var(--font-mono)',
  color: 'var(--color-text-secondary)',
  borderBottom: '1px solid var(--color-border-subtle)',
  whiteSpace: 'nowrap'
}

const neutralChip: CSSProperties = {
  display: 'inline-block',
  padding: '1px 6px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--color-info-bg)',
  color: 'var(--color-text-muted)',
  fontSize: 10.5,
  letterSpacing: '0.3px'
}

export function RunsTable({ runs }: { runs: PriceRun[] }): ReactElement {
  if (runs.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--text-sm)'
        }}
      >
        No runs yet — build the archive to populate this log.
      </div>
    )
  }

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Ticker</th>
            <th style={thStyle}>Source</th>
            <th style={thStyle}>Requested</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Ins / Upd</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Triggered by</th>
            <th style={thStyle}>Started</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.runId}>
              <td style={{ ...tdStyle, color: 'var(--color-text-primary)' }}>{r.ticker}</td>
              <td style={tdStyle}>{r.source}</td>
              <td style={tdStyle}>
                {r.requestedFrom ?? '—'} → {r.requestedTo ?? '—'}
              </td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>
                {r.rowsInserted} / {r.rowsUpdated}
              </td>
              <td style={tdStyle}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: RUN_STATUS_COLOR[r.status], fontSize: 10, lineHeight: 1 }}>
                    ●
                  </span>
                  <span>{r.status}</span>
                </span>
                {r.errorMessage && (
                  <span
                    style={{ color: 'var(--color-text-muted)', marginLeft: 8 }}
                    title={r.errorMessage}
                  >
                    {r.errorMessage.slice(0, 40)}
                  </span>
                )}
              </td>
              <td style={tdStyle}>
                <span style={neutralChip}>{r.triggeredBy}</span>
              </td>
              <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>{r.startedAt ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
