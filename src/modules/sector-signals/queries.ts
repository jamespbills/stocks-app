// Matrix stats for play=12 near-misses
// Columns: sector, missed_criterion, criterion_name, count, with_returns,
//          blanks, unique_tickers, avg_roi (decimal fraction), signal
export const MATRIX_STATS_PLAY_SQL = `SELECT * FROM vw_play12_by_sector_criterion`

// Matrix stats for play_2=13 near-misses
// Same column shape as above; missed_criterion maps to missed_upon_2 codes 1–16
export const MATRIX_STATS_PLAY2_SQL = `SELECT * FROM vw_play2_13_by_sector_criterion`

// Active flags from the dim table for play=12
// Columns: sector, criterion_code, is_active
export const ACTIVE_MATRIX_PLAY_SQL = `
  SELECT sector, missed_criterion AS criterion_code, is_active
  FROM dim_sector_play_matrix
`

// Active flags from the dim table for play_2=13
export const ACTIVE_MATRIX_PLAY2_SQL = `
  SELECT sector, missed_criterion AS criterion_code, is_active
  FROM dim_sector_play_2_matrix
`

// Ticker list for a near-miss play combo — params: [nearMiss, sector, criterionCode]
// Columns: ticker, roi (decimal fraction), report_date, financial_year, filing_identifier, roi_6m
export const COMBO_TICKERS_PLAY_SQL = `
  SELECT
    dc.ticker,
    fm_ret.value          AS roi,
    fr.date_released      AS report_date,
    fr.financial_year,
    fr.filing_identifier,
    fm_6m.value           AS roi_6m
  FROM fact_reports fr
  JOIN dim_companies dc            ON fr.company_id  = dc.company_id
  JOIN fact_metrics fm_play        ON fr.report_id   = fm_play.report_id
                                  AND fm_play.metric_id = (
                                    SELECT metric_id FROM dim_metrics WHERE name = 'play')
  JOIN fact_metrics fm_miss        ON fr.report_id   = fm_miss.report_id
                                  AND fm_miss.metric_id = (
                                    SELECT metric_id FROM dim_metrics WHERE name = 'missed_upon')
  LEFT JOIN fact_metrics fm_ret    ON fr.report_id   = fm_ret.report_id
                                  AND fm_ret.metric_id = (
                                    SELECT metric_id FROM dim_metrics WHERE name = 'return_1y')
  LEFT JOIN fact_metrics fm_6m     ON fr.report_id   = fm_6m.report_id
                                  AND fm_6m.metric_id = (
                                    SELECT metric_id FROM dim_metrics WHERE name = 'return_6m')
  WHERE fm_play.value = ?
    AND dc.sector = ?
    AND fm_miss.value = ?
  ORDER BY fm_ret.value DESC
`

// Ticker list for a near-miss play_2 combo — params: [nearMiss, sector, criterionCode]
export const COMBO_TICKERS_PLAY2_SQL = `
  SELECT
    dc.ticker,
    fm_ret.value          AS roi,
    fr.date_released      AS report_date,
    fr.financial_year,
    fr.filing_identifier,
    fm_6m.value           AS roi_6m
  FROM fact_reports fr
  JOIN dim_companies dc            ON fr.company_id  = dc.company_id
  JOIN fact_metrics fm_play        ON fr.report_id   = fm_play.report_id
                                  AND fm_play.metric_id = (
                                    SELECT metric_id FROM dim_metrics WHERE name = 'play_2')
  JOIN fact_metrics fm_miss        ON fr.report_id   = fm_miss.report_id
                                  AND fm_miss.metric_id = (
                                    SELECT metric_id FROM dim_metrics WHERE name = 'missed_upon_2')
  LEFT JOIN fact_metrics fm_ret    ON fr.report_id   = fm_ret.report_id
                                  AND fm_ret.metric_id = (
                                    SELECT metric_id FROM dim_metrics WHERE name = 'return_1y')
  LEFT JOIN fact_metrics fm_6m     ON fr.report_id   = fm_6m.report_id
                                  AND fm_6m.metric_id = (
                                    SELECT metric_id FROM dim_metrics WHERE name = 'return_6m')
  WHERE fm_play.value = ?
    AND dc.sector = ?
    AND fm_miss.value = ?
  ORDER BY fm_ret.value DESC
`

// Apply active state to dim_sector_play_matrix — params: [sector, criterionCode, 0|1]
// Creates row if it doesn't exist (combo activated from UI for the first time)
export const UPSERT_ACTIVE_PLAY_SQL = `
  INSERT INTO dim_sector_play_matrix (sector, missed_criterion, is_active)
  VALUES (?, ?, ?)
  ON DUPLICATE KEY UPDATE is_active = VALUES(is_active), updated_at = NOW()
`

// Apply active state to dim_sector_play_2_matrix — params: [sector, criterionCode, 0|1]
export const UPSERT_ACTIVE_PLAY2_SQL = `
  INSERT INTO dim_sector_play_2_matrix (sector, missed_criterion, is_active)
  VALUES (?, ?, ?)
  ON DUPLICATE KEY UPDATE is_active = VALUES(is_active), updated_at = NOW()
`

// Read combo note — params: [strategy, sector, criterionCode]
// Columns: note
export const SELECT_COMBO_NOTE_SQL = `
  SELECT note FROM app_sector_combo_notes
  WHERE strategy = ? AND sector = ? AND missed_criterion = ?
`

// Upsert combo note — params: [strategy, sector, criterionCode, note]
export const UPSERT_COMBO_NOTE_SQL = `
  INSERT INTO app_sector_combo_notes (strategy, sector, missed_criterion, note)
  VALUES (?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE note = VALUES(note)
`

// Read all ticker notes for a combo — params: [strategy, sector, criterionCode]
// Columns: ticker, note
export const SELECT_TICKER_NOTES_SQL = `
  SELECT ticker, note FROM app_sector_ticker_notes
  WHERE strategy = ? AND sector = ? AND missed_criterion = ?
`

// Upsert ticker note — params: [strategy, sector, criterionCode, ticker, note]
export const UPSERT_TICKER_NOTE_SQL = `
  INSERT INTO app_sector_ticker_notes (strategy, sector, missed_criterion, ticker, note)
  VALUES (?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE note = VALUES(note)
`

// Leaderboard aggregate for near-miss play — all combos ranked by cumulative return
// params: [nearMiss]
// Columns: sector, criterion_code, n_plays, n_unique_tickers, wins, losses,
//          avg_roi, cumulative_roi, median_roi (all decimal fractions), is_active (0|1)
export const COMBO_LEADERBOARD_PLAY_SQL = `
  WITH base AS (
    SELECT
      dc.sector,
      fm_miss.value                                                                     AS criterion_code,
      fm_ret.value                                                                      AS roi,
      dc.ticker,
      ROW_NUMBER() OVER (PARTITION BY dc.sector, fm_miss.value ORDER BY fm_ret.value)  AS rn,
      COUNT(*)      OVER (PARTITION BY dc.sector, fm_miss.value)                       AS cnt
    FROM fact_reports fr
    JOIN dim_companies dc
      ON fr.company_id = dc.company_id
    JOIN fact_metrics fm_play
      ON fr.report_id     = fm_play.report_id
     AND fm_play.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'play')
    JOIN fact_metrics fm_miss
      ON fr.report_id     = fm_miss.report_id
     AND fm_miss.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'missed_upon')
    JOIN fact_metrics fm_ret
      ON fr.report_id     = fm_ret.report_id
     AND fm_ret.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'return_1y')
    WHERE fm_play.value = ?
      AND fm_ret.value IS NOT NULL
  )
  SELECT
    b.sector,
    b.criterion_code,
    COUNT(*)                                                                             AS n_plays,
    COUNT(DISTINCT b.ticker)                                                            AS n_unique_tickers,
    SUM(CASE WHEN b.roi > 0 THEN 1 ELSE 0 END)                                         AS wins,
    SUM(CASE WHEN b.roi <= 0 THEN 1 ELSE 0 END)                                        AS losses,
    AVG(b.roi)                                                                          AS avg_roi,
    SUM(b.roi)                                                                          AS cumulative_roi,
    AVG(CASE
          WHEN b.rn IN (FLOOR((b.cnt + 1) / 2.0), CEIL((b.cnt + 1) / 2.0))
          THEN b.roi
        END)                                                                            AS median_roi,
    COALESCE(MAX(a.is_active), 0)                                                      AS is_active
  FROM base b
  LEFT JOIN dim_sector_play_matrix a
    ON b.sector = a.sector
   AND b.criterion_code = a.missed_criterion
  GROUP BY b.sector, b.criterion_code
  ORDER BY SUM(b.roi) DESC
`

// Leaderboard aggregate for near-miss play_2 — same shape as above
// params: [nearMiss]
export const COMBO_LEADERBOARD_PLAY2_SQL = `
  WITH base AS (
    SELECT
      dc.sector,
      fm_miss.value                                                                     AS criterion_code,
      fm_ret.value                                                                      AS roi,
      dc.ticker,
      ROW_NUMBER() OVER (PARTITION BY dc.sector, fm_miss.value ORDER BY fm_ret.value)  AS rn,
      COUNT(*)      OVER (PARTITION BY dc.sector, fm_miss.value)                       AS cnt
    FROM fact_reports fr
    JOIN dim_companies dc
      ON fr.company_id = dc.company_id
    JOIN fact_metrics fm_play
      ON fr.report_id     = fm_play.report_id
     AND fm_play.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'play_2')
    JOIN fact_metrics fm_miss
      ON fr.report_id     = fm_miss.report_id
     AND fm_miss.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'missed_upon_2')
    JOIN fact_metrics fm_ret
      ON fr.report_id     = fm_ret.report_id
     AND fm_ret.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'return_1y')
    WHERE fm_play.value = ?
      AND fm_ret.value IS NOT NULL
  )
  SELECT
    b.sector,
    b.criterion_code,
    COUNT(*)                                                                             AS n_plays,
    COUNT(DISTINCT b.ticker)                                                            AS n_unique_tickers,
    SUM(CASE WHEN b.roi > 0 THEN 1 ELSE 0 END)                                         AS wins,
    SUM(CASE WHEN b.roi <= 0 THEN 1 ELSE 0 END)                                        AS losses,
    AVG(b.roi)                                                                          AS avg_roi,
    SUM(b.roi)                                                                          AS cumulative_roi,
    AVG(CASE
          WHEN b.rn IN (FLOOR((b.cnt + 1) / 2.0), CEIL((b.cnt + 1) / 2.0))
          THEN b.roi
        END)                                                                            AS median_roi,
    COALESCE(MAX(a.is_active), 0)                                                      AS is_active
  FROM base b
  LEFT JOIN dim_sector_play_2_matrix a
    ON b.sector = a.sector
   AND b.criterion_code = a.missed_criterion
  GROUP BY b.sector, b.criterion_code
  ORDER BY SUM(b.roi) DESC
`
