-- Phase 2: replace hardcoded 13/14/12/13 in view_play_universe with play_thresholds subqueries.
-- Overrides the view defined in 005_price_archive.sql (later lexicographic order wins).
CREATE OR REPLACE VIEW view_play_universe AS
SELECT
  ticker,
  date_released,
  play,
  play_2,
  play_sector_rating,
  play_2_sector_rating
FROM stock_archive_flat
WHERE play   >= (SELECT max_score FROM play_thresholds WHERE play_name = 'play')
   OR play_2 >= (SELECT max_score FROM play_thresholds WHERE play_name = 'play_2')
   OR (play   = (SELECT near_miss FROM play_thresholds WHERE play_name = 'play')
       AND play_sector_rating   = 1)
   OR (play_2 = (SELECT near_miss FROM play_thresholds WHERE play_name = 'play_2')
       AND play_2_sector_rating = 1);
