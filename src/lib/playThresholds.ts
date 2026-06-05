import {
  createElement,
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type ReactElement
} from 'react'

export interface PlayThresholds {
  play: { maxScore: number; nearMiss: number }
  play_2: { maxScore: number; nearMiss: number }
}

// Hard defaults matching current 15/16 config — used until DB responds and during fallback
export const DEFAULT_THRESHOLDS: PlayThresholds = {
  play: { maxScore: 15, nearMiss: 14 },
  play_2: { maxScore: 16, nearMiss: 15 }
}

const PlayThresholdsContext = createContext<PlayThresholds>(DEFAULT_THRESHOLDS)

interface ThresholdRow {
  play_name: string
  max_score: string | number
  near_miss: string | number
}

export function PlayThresholdsProvider({ children }: { children: ReactNode }): ReactElement {
  const [thresholds, setThresholds] = useState<PlayThresholds>(DEFAULT_THRESHOLDS)

  useEffect(() => {
    void window.electronAPI.db
      .query(`SELECT play_name, max_score, near_miss FROM play_thresholds`)
      .then((rows) => {
        const r = rows as ThresholdRow[]
        const playRow = r.find((x) => x.play_name === 'play')
        const play2Row = r.find((x) => x.play_name === 'play_2')
        if (playRow && play2Row) {
          setThresholds({
            play: {
              maxScore: Math.round(Number(playRow.max_score)),
              nearMiss: Math.round(Number(playRow.near_miss))
            },
            play_2: {
              maxScore: Math.round(Number(play2Row.max_score)),
              nearMiss: Math.round(Number(play2Row.near_miss))
            }
          })
        }
      })
      .catch(() => {
        // DB unreachable — defaults remain; values match current config
      })
  }, [])

  return createElement(
    PlayThresholdsContext.Provider,
    { value: thresholds },
    children
  ) as ReactElement
}

export function usePlayThresholds(): PlayThresholds {
  return useContext(PlayThresholdsContext)
}
