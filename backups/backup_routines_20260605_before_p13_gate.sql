-- MySQL dump 10.13  Distrib 8.0.39, for Win64 (x86_64)
--
-- Host: localhost    Database: new_stocks_db
-- ------------------------------------------------------
-- Server version	8.0.39
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping routines for database 'new_stocks_db'
--
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `get_forward_metric`(
    p_report_id        INT,
    p_metric_name      VARCHAR(50),
    p_months_forward   INT
) RETURNS decimal(20,6)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE v_result              DECIMAL(20,6);
    DECLARE v_company_id          INT;
    DECLARE v_filing_identifier   VARCHAR(20);
    DECLARE v_financial_year      INT;
    DECLARE v_report_type         VARCHAR(20);
    DECLARE v_base_metric_id      INT;

    SELECT company_id, filing_identifier, financial_year, report_type
    INTO   v_company_id, v_filing_identifier, v_financial_year, v_report_type
    FROM   fact_reports
    WHERE  report_id = p_report_id;

    SELECT metric_id INTO v_base_metric_id
    FROM   dim_metrics
    WHERE  CAST(name AS BINARY) = CAST(p_metric_name AS BINARY)
    LIMIT 1;

    IF p_months_forward = 6 THEN
        
        
        
        
        
        SELECT fm.value INTO v_result
        FROM   fact_reports fr
        JOIN   fact_metrics fm ON fr.report_id = fm.report_id
        WHERE  fr.company_id = v_company_id
          AND  CAST(fr.report_type AS BINARY) != CAST(v_report_type AS BINARY)
          AND  fr.report_date = (
              SELECT MIN(fr2.report_date)
              FROM   fact_reports fr2
              WHERE  fr2.company_id = v_company_id
                AND  fr2.report_date > (
                         SELECT report_date FROM fact_reports WHERE report_id = p_report_id
                     )
                AND  fr2.report_date <= DATE_ADD(
                         (SELECT report_date FROM fact_reports WHERE report_id = p_report_id),
                         INTERVAL 10 MONTH
                     )
                AND  CAST(fr2.report_type AS BINARY) != CAST(v_report_type AS BINARY)
          )
          AND  fm.metric_id = v_base_metric_id
        LIMIT 1;

    ELSEIF p_months_forward IN (12, 24) THEN
        
        SELECT fm.value INTO v_result
        FROM   fact_reports fr
        JOIN   fact_metrics fm ON fr.report_id = fm.report_id
        WHERE  fr.company_id = v_company_id
          AND  CAST(fr.filing_identifier AS BINARY) = CAST(v_filing_identifier AS BINARY)
          AND  CAST(fr.report_type AS BINARY) = CAST(v_report_type AS BINARY)
          AND  fr.financial_year = (v_financial_year + (p_months_forward / 12))
          AND  fm.metric_id = v_base_metric_id
          AND  fr.report_date = (
              SELECT MAX(fr2.report_date)
              FROM   fact_reports fr2
              WHERE  fr2.company_id = v_company_id
                AND  CAST(fr2.filing_identifier AS BINARY) = CAST(v_filing_identifier AS BINARY)
                AND  CAST(fr2.report_type AS BINARY) = CAST(v_report_type AS BINARY)
                AND  fr2.financial_year = (v_financial_year + (p_months_forward / 12))
          )
        LIMIT 1;
    END IF;

    RETURN v_result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `get_historical_calculated_metric`(
    p_report_id       INT,
    p_metric_name     VARCHAR(50),
    p_months_back     INT
) RETURNS decimal(20,6)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE v_result              DECIMAL(20,6);
    DECLARE v_company_id          INT;
    DECLARE v_filing_identifier   VARCHAR(20);
    DECLARE v_financial_year      INT;
    DECLARE v_report_type         VARCHAR(20);
    DECLARE v_base_metric_id      INT;

    SELECT company_id, filing_identifier, financial_year, report_type
    INTO   v_company_id, v_filing_identifier, v_financial_year, v_report_type
    FROM   fact_reports
    WHERE  report_id = p_report_id;

    SELECT metric_id INTO v_base_metric_id
    FROM   dim_metrics
    WHERE  CAST(name AS BINARY) = CAST(p_metric_name AS BINARY)
    LIMIT 1;

    
    SELECT fm.value INTO v_result
    FROM   fact_reports hr
    JOIN   fact_metrics fm ON hr.report_id = fm.report_id
    WHERE  hr.company_id = v_company_id
      AND  CAST(hr.filing_identifier AS BINARY) = CAST(v_filing_identifier AS BINARY)
      AND  CAST(hr.report_type AS BINARY) = CAST(v_report_type AS BINARY)
      AND  hr.financial_year = (v_financial_year - (p_months_back / 12))
      AND  fm.metric_id = v_base_metric_id
      AND  hr.report_date = (
          SELECT MAX(hr2.report_date)
          FROM   fact_reports hr2
          WHERE  hr2.company_id = v_company_id
            AND  CAST(hr2.filing_identifier AS BINARY) = CAST(v_filing_identifier AS BINARY)
            AND  CAST(hr2.report_type AS BINARY) = CAST(v_report_type AS BINARY)
            AND  hr2.financial_year = (v_financial_year - (p_months_back / 12))
      )
    LIMIT 1;

    RETURN v_result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `get_historical_metric`(
    p_report_id       INT,
    p_metric_name     VARCHAR(50),
    p_months_back     INT
) RETURNS decimal(20,6)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE v_result              DECIMAL(20,6);
    DECLARE v_company_id          INT;
    DECLARE v_filing_identifier   VARCHAR(20);
    DECLARE v_financial_year      INT;
    DECLARE v_instance            INT;
    DECLARE v_base_metric_id      INT;

    SELECT company_id, filing_identifier, financial_year, instance
    INTO   v_company_id, v_filing_identifier, v_financial_year, v_instance
    FROM   fact_reports
    WHERE  report_id = p_report_id;

    SELECT metric_id INTO v_base_metric_id
    FROM   dim_metrics
    WHERE  CAST(name AS BINARY) = CAST(p_metric_name AS BINARY)
    LIMIT 1;

    IF p_months_back = 6 THEN
        
        SELECT fm.value INTO v_result
        FROM   fact_reports hr
        JOIN   fact_metrics fm ON hr.report_id = fm.report_id
        WHERE  hr.company_id = v_company_id
          AND  hr.instance = (v_instance - 1)
          AND  CAST(hr.filing_identifier AS BINARY) != CAST(v_filing_identifier AS BINARY)
          AND  fm.metric_id = v_base_metric_id
        LIMIT 1;

    ELSEIF p_months_back IN (12, 24, 36, 48) THEN
        
        SELECT fm.value INTO v_result
        FROM   fact_reports hr
        JOIN   fact_metrics fm ON hr.report_id = fm.report_id
        WHERE  hr.company_id = v_company_id
          AND  CAST(hr.filing_identifier AS BINARY) = CAST(v_filing_identifier AS BINARY)
          AND  hr.financial_year = (v_financial_year - (p_months_back / 12))
          AND  fm.metric_id = v_base_metric_id
          AND  hr.report_date = (
              SELECT MAX(hr2.report_date)
              FROM   fact_reports hr2
              WHERE  hr2.company_id = v_company_id
                AND  CAST(hr2.filing_identifier AS BINARY) = CAST(v_filing_identifier AS BINARY)
                AND  hr2.financial_year = (v_financial_year - (p_months_back / 12))
          )
        LIMIT 1;
    END IF;

    RETURN v_result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `get_industry_growth`(
    p_ticker VARCHAR(10),
    p_date DATE
) RETURNS decimal(5,2)
    READS SQL DATA
BEGIN
    DECLARE v_growth DECIMAL(5,2);
    
    -- Find the latest growth data before or on the specified date
    SELECT fig.expected_eps_growth_5y INTO v_growth
    FROM dim_companies c
    JOIN dim_industry_mapping im ON c.industry = im.yahoo_industry
    JOIN fact_industry_growth fig ON im.harvard_industry = fig.harvard_industry
    WHERE c.ticker = p_ticker
    AND fig.update_date <= p_date
    ORDER BY fig.update_date DESC
    LIMIT 1;
    
    RETURN v_growth;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `get_metric`(p_json JSON, p_key VARCHAR(100)) RETURNS varchar(255) CHARSET utf8mb4
    NO SQL
    DETERMINISTIC
BEGIN
    DECLARE v_path VARCHAR(110);
    SET v_path = CONCAT('$.', p_key);
    RETURN NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_json, v_path)), 'null');
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_all_play_rankings`()
BEGIN
    
    
    

    
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_play_def_id INT;
    DECLARE v_play_name VARCHAR(50);
    DECLARE v_missed_upon_name VARCHAR(50);
    DECLARE v_matrix_table_name VARCHAR(50);
    DECLARE v_categorization_metric VARCHAR(50);
    DECLARE v_category_column_low VARCHAR(50);
    DECLARE v_category_column_high VARCHAR(50);
    DECLARE v_category_result_column VARCHAR(50);

    
    DECLARE v_percentile_metric_id INT DEFAULT NULL;
    DECLARE v_play_metric_id INT DEFAULT NULL;
    DECLARE v_missed_upon_metric_id INT DEFAULT NULL;
    DECLARE v_category_metric_id INT DEFAULT NULL;
    DECLARE v_reference_metric_id INT DEFAULT NULL;
    DECLARE v_categorization_metric_id INT DEFAULT NULL;
    DECLARE v_coverage_metric_id INT DEFAULT NULL;
    DECLARE v_price_earnings_metric_id INT DEFAULT NULL;

    
    DECLARE v_categories_created INT DEFAULT 0;
    DECLARE v_references_created INT DEFAULT 0;
    DECLARE v_plays_created INT DEFAULT 0;
    DECLARE v_missed_upons_created INT DEFAULT 0;
    DECLARE v_total_plays_processed INT DEFAULT 0;

    
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);

    
    DECLARE v_sql_text LONGTEXT;
    DECLARE v_play_case_sql LONGTEXT;
    DECLARE v_missed_case_sql LONGTEXT;

    
    DECLARE v_crit_done INT DEFAULT FALSE;
    DECLARE v_criterion_order INT;
    DECLARE v_metric_name VARCHAR(50);
    DECLARE v_operator VARCHAR(10);
    DECLARE v_compound_logic VARCHAR(10);
    DECLARE v_matrix_column_low VARCHAR(50);
    DECLARE v_matrix_column_high VARCHAR(50);
    DECLARE v_secondary_metric_name VARCHAR(50);
    DECLARE v_secondary_operator VARCHAR(10);
    DECLARE v_secondary_matrix_column VARCHAR(50);

    
    DECLARE play_cursor CURSOR FOR
        SELECT
            play_def_id,
            play_name,
            missed_upon_name,
            matrix_table_name,
            categorization_metric,
            category_column_low,
            category_column_high,
            category_result_column
        FROM dim_play_definitions
        WHERE is_active = 1
        ORDER BY play_def_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    
    
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;

        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_all_play_rankings', 'ERROR',
                CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');

        SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
        ROLLBACK;
    END;

    
    
    
    SET v_session_id = CONCAT('PLAY_ALL_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;

    INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, 'calculate_all_play_rankings', 'INFO',
            'STARTING Dynamic Play Rankings Calculation for ALL active play definitions (v4 pivot rewrite)', 'START');

    
    
    

    SELECT metric_id INTO v_percentile_metric_id
    FROM dim_metrics WHERE name = 'percentile';

    SELECT metric_id INTO v_coverage_metric_id
    FROM dim_metrics WHERE name = 'coverage';

    SELECT metric_id INTO v_price_earnings_metric_id
    FROM dim_metrics WHERE name = 'price_earnings';

    IF v_percentile_metric_id IS NULL THEN
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_all_play_rankings', 'ERROR',
                'Required metric "percentile" not found. Run calculate_priority_98_rankings first.', 'DEPENDENCY_CHECK');
        SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Percentile metric not found';
    END IF;

    INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, 'calculate_all_play_rankings', 'INFO',
            CONCAT('Common metrics resolved: percentile=', v_percentile_metric_id,
                   ', coverage=', COALESCE(v_coverage_metric_id, 'NULL'),
                   ', price_earnings=', COALESCE(v_price_earnings_metric_id, 'NULL')), 'METRIC_LOOKUP');

    
    
    

    OPEN play_cursor;

    play_loop: LOOP
        FETCH play_cursor INTO
            v_play_def_id,
            v_play_name,
            v_missed_upon_name,
            v_matrix_table_name,
            v_categorization_metric,
            v_category_column_low,
            v_category_column_high,
            v_category_result_column;

        IF v_done THEN
            LEAVE play_loop;
        END IF;

        SET v_total_plays_processed = v_total_plays_processed + 1;

        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_all_play_rankings', 'INFO',
                CONCAT('Processing play definition: ', v_play_name,
                       ' (ID=', v_play_def_id, ', matrix=', v_matrix_table_name,
                       ', categorization=', v_categorization_metric, ')'),
                CONCAT('PLAY_', v_play_name, '_START'));

        
        
        

        SELECT metric_id INTO v_play_metric_id
        FROM dim_metrics WHERE name = v_play_name;

        SELECT metric_id INTO v_missed_upon_metric_id
        FROM dim_metrics WHERE name = v_missed_upon_name;

        SELECT metric_id INTO v_category_metric_id
        FROM dim_metrics WHERE name = v_category_result_column;

        
        SET @ref_name = CASE
            WHEN v_play_name = 'play' THEN 'reference'
            ELSE CONCAT('reference_', SUBSTRING(v_play_name, 6))
        END;

        SELECT metric_id INTO v_reference_metric_id
        FROM dim_metrics WHERE name = @ref_name;

        SELECT metric_id INTO v_categorization_metric_id
        FROM dim_metrics WHERE name = v_categorization_metric;

        IF v_play_metric_id IS NULL OR v_missed_upon_metric_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, 'calculate_all_play_rankings', 'WARNING',
                    CONCAT('Skipping ', v_play_name, ': play or missed_upon metric not found in dim_metrics'),
                    CONCAT('PLAY_', v_play_name, '_SKIP'));
            ITERATE play_loop;
        END IF;

        IF v_category_metric_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, 'calculate_all_play_rankings', 'WARNING',
                    CONCAT('Category metric "', v_category_result_column, '" not found - will skip category calculation'),
                    CONCAT('PLAY_', v_play_name, '_CAT_MISSING'));
        END IF;

        IF v_reference_metric_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, 'calculate_all_play_rankings', 'WARNING',
                    CONCAT('Reference metric "', @ref_name, '" not found - will skip reference calculation'),
                    CONCAT('PLAY_', v_play_name, '_REF_MISSING'));
        END IF;

        IF v_categorization_metric_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, 'calculate_all_play_rankings', 'WARNING',
                    CONCAT('Categorization source metric "', v_categorization_metric, '" not found in dim_metrics'),
                    CONCAT('PLAY_', v_play_name, '_CAT_SRC_MISSING'));
        END IF;

        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_all_play_rankings', 'INFO',
                CONCAT('Metric IDs for ', v_play_name, ': play=', v_play_metric_id,
                       ', missed_upon=', v_missed_upon_metric_id,
                       ', category=', COALESCE(v_category_metric_id, 'NULL'),
                       ', reference=', COALESCE(v_reference_metric_id, 'NULL'),
                       ', cat_source(', v_categorization_metric, ')=', COALESCE(v_categorization_metric_id, 'NULL')),
                CONCAT('PLAY_', v_play_name, '_METRICS'));

        START TRANSACTION;

        
        
        

        DELETE FROM fact_metrics WHERE metric_id = v_play_metric_id;
        DELETE FROM fact_metrics WHERE metric_id = v_missed_upon_metric_id;

        IF v_category_metric_id IS NOT NULL THEN
            DELETE FROM fact_metrics WHERE metric_id = v_category_metric_id;
        END IF;

        IF v_reference_metric_id IS NOT NULL THEN
            DELETE FROM fact_metrics WHERE metric_id = v_reference_metric_id;
        END IF;

        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_all_play_rankings', 'INFO',
                CONCAT('Deleted existing values for ', v_play_name, ' metrics'),
                CONCAT('PLAY_', v_play_name, '_DELETE'));

        
        
        

        IF v_category_metric_id IS NOT NULL AND v_categorization_metric_id IS NOT NULL THEN

            SET v_sql_text = CONCAT(
                'INSERT INTO fact_metrics (report_id, metric_id, value, calculation_date, source_flag, notes) ',
                'SELECT ',
                    'fm.report_id, ',
                    v_category_metric_id, ', ',
                    'COALESCE(( ',
                        'SELECT DISTINCT ',
                            CASE
                                WHEN v_category_result_column = 'asset_category' THEN 'mx.asset_category'
                                WHEN v_category_result_column = 'roa_category' THEN 'mx.roa_category'
                                ELSE CONCAT('mx.', v_category_result_column)
                            END, ' ',
                        'FROM ', v_matrix_table_name, ' mx ',
                        'WHERE fm.value >= mx.', v_category_column_low, ' ',
                        'AND fm.value < mx.', v_category_column_high, ' ',
                        'LIMIT 1 ',
                    '), 4) AS category, ',
                    'NOW(), ',
                    '''calculate_all_play_rankings'', ',
                    'CONCAT(''Category for ', v_play_name, ': '', ',
                           'COALESCE(( ',
                               'SELECT DISTINCT ',
                                   CASE
                                       WHEN v_category_result_column = 'asset_category' THEN 'mx.asset_category'
                                       WHEN v_category_result_column = 'roa_category' THEN 'mx.roa_category'
                                       ELSE CONCAT('mx.', v_category_result_column)
                                   END, ' ',
                               'FROM ', v_matrix_table_name, ' mx ',
                               'WHERE fm.value >= mx.', v_category_column_low, ' ',
                               'AND fm.value < mx.', v_category_column_high, ' ',
                               'LIMIT 1 ',
                           '), 4), ',
                           ''' based on ', v_categorization_metric, '='', ROUND(fm.value, 4)) ',
                'FROM fact_metrics fm ',
                'WHERE fm.metric_id = ', v_categorization_metric_id, ' ',
                'AND fm.value IS NOT NULL'
            );

            SET @dynamic_sql = v_sql_text;
            PREPARE stmt FROM @dynamic_sql;
            EXECUTE stmt;
            SET v_categories_created = ROW_COUNT();
            DEALLOCATE PREPARE stmt;

            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, records_affected, execution_step)
            VALUES (v_session_id, 'calculate_all_play_rankings', 'SUCCESS',
                    CONCAT('Category (', v_category_result_column, ') calculated for ', v_play_name,
                           ' using ', v_categorization_metric),
                    v_categories_created, CONCAT('PLAY_', v_play_name, '_CATEGORY'));

        END IF;

        
        
        

        IF v_reference_metric_id IS NOT NULL AND v_category_metric_id IS NOT NULL THEN

            INSERT INTO fact_metrics (report_id, metric_id, value, calculation_date, source_flag, notes)
            SELECT
                cat.report_id,
                v_reference_metric_id,
                ROUND(cat.value + (pct.value / 100), 4) AS reference_value,
                NOW(),
                'calculate_all_play_rankings',
                CONCAT('Reference for ', v_play_name, ': ', cat.value, ' + (', pct.value, '/100) = ',
                       ROUND(cat.value + (pct.value / 100), 4))
            FROM fact_metrics cat
            JOIN fact_metrics pct ON cat.report_id = pct.report_id
            WHERE cat.metric_id = v_category_metric_id
              AND pct.metric_id = v_percentile_metric_id
              AND cat.value IS NOT NULL
              AND pct.value IS NOT NULL
              AND cat.value BETWEEN 1 AND 4
              AND pct.value BETWEEN 0 AND 100;

            SET v_references_created = ROW_COUNT();

            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, records_affected, execution_step)
            VALUES (v_session_id, 'calculate_all_play_rankings', 'SUCCESS',
                    CONCAT('Reference calculated for ', v_play_name),
                    v_references_created, CONCAT('PLAY_', v_play_name, '_REFERENCE'));

        END IF;

        
        
        
        

        SET v_play_case_sql = '';
        SET v_missed_case_sql = '';

        criteria_block: BEGIN
            DECLARE v_crit_cursor_done INT DEFAULT FALSE;

            DECLARE criteria_cursor CURSOR FOR
                SELECT
                    criterion_order,
                    metric_name,
                    operator,
                    COALESCE(compound_logic, '') AS compound_logic,
                    matrix_column_low,
                    matrix_column_high,
                    secondary_metric_name,
                    secondary_operator,
                    secondary_matrix_column
                FROM dim_play_criteria
                WHERE play_def_id = v_play_def_id
                  AND is_active = 1
                ORDER BY criterion_order;

            DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_crit_cursor_done = TRUE;

            OPEN criteria_cursor;

            crit_loop: LOOP
                FETCH criteria_cursor INTO
                    v_criterion_order,
                    v_metric_name,
                    v_operator,
                    v_compound_logic,
                    v_matrix_column_low,
                    v_matrix_column_high,
                    v_secondary_metric_name,
                    v_secondary_operator,
                    v_secondary_matrix_column;

                IF v_crit_cursor_done THEN
                    LEAVE crit_loop;
                END IF;

                
                IF v_compound_logic = 'OR' THEN
                    SET v_play_case_sql = CONCAT(v_play_case_sql,
                        'CASE WHEN ',
                        '(wide.m_', v_criterion_order, ' IS NOT NULL AND wide.m_', v_criterion_order, ' ',
                            v_operator, ' matrix.', v_matrix_column_low, ') ',
                        'OR (wide.m_', v_criterion_order, 'b IS NOT NULL AND wide.m_', v_criterion_order, 'b ',
                            COALESCE(v_secondary_operator, v_operator), ' matrix.', COALESCE(v_secondary_matrix_column, v_matrix_column_low), ') ',
                        'THEN 1 ELSE 0 END + '
                    );
                    
                    SET v_missed_case_sql = CONCAT(v_missed_case_sql,
                        'CASE WHEN ',
                        '(wide.m_', v_criterion_order, ' IS NULL OR wide.m_', v_criterion_order, ' ',
                            CASE
                                WHEN v_operator = '<' THEN '>='
                                WHEN v_operator = '<=' THEN '>'
                                WHEN v_operator = '>' THEN '<='
                                WHEN v_operator = '>=' THEN '<'
                                ELSE '>='
                            END, ' matrix.', v_matrix_column_low, ') ',
                        'AND (wide.m_', v_criterion_order, 'b IS NULL OR wide.m_', v_criterion_order, 'b ',
                            CASE
                                WHEN COALESCE(v_secondary_operator, v_operator) = '<' THEN '>='
                                WHEN COALESCE(v_secondary_operator, v_operator) = '<=' THEN '>'
                                WHEN COALESCE(v_secondary_operator, v_operator) = '>' THEN '<='
                                WHEN COALESCE(v_secondary_operator, v_operator) = '>=' THEN '<'
                                ELSE '>='
                            END, ' matrix.', COALESCE(v_secondary_matrix_column, v_matrix_column_low), ') ',
                        'THEN ''', LPAD(v_criterion_order, 2, '0'), ''' ELSE '''' END, '
                    );

                
                ELSEIF v_compound_logic = 'AND' AND v_matrix_column_high IS NOT NULL THEN
                    SET v_play_case_sql = CONCAT(v_play_case_sql,
                        'CASE WHEN wide.m_', v_criterion_order, ' IS NOT NULL ',
                        'AND wide.m_', v_criterion_order, ' >= matrix.', v_matrix_column_low, ' ',
                        'AND wide.m_', v_criterion_order, ' <= matrix.', v_matrix_column_high, ' ',
                        'THEN 1 ELSE 0 END + '
                    );
                    SET v_missed_case_sql = CONCAT(v_missed_case_sql,
                        'CASE WHEN wide.m_', v_criterion_order, ' IS NULL ',
                        'OR wide.m_', v_criterion_order, ' < matrix.', v_matrix_column_low, ' ',
                        'OR wide.m_', v_criterion_order, ' > matrix.', v_matrix_column_high, ' ',
                        'THEN ''', LPAD(v_criterion_order, 2, '0'), ''' ELSE '''' END, '
                    );

                
                ELSEIF v_compound_logic = 'AND' AND v_secondary_metric_name IS NOT NULL THEN
                    SET v_play_case_sql = CONCAT(v_play_case_sql,
                        'CASE WHEN ',
                        'wide.m_', v_criterion_order, ' IS NOT NULL ',
                        'AND wide.m_', v_criterion_order, ' ', v_operator, ' matrix.', v_matrix_column_low, ' ',
                        'AND wide.m_', v_criterion_order, 'b IS NOT NULL ',
                        'AND wide.m_', v_criterion_order, 'b ', COALESCE(v_secondary_operator, v_operator), ' matrix.', COALESCE(v_secondary_matrix_column, v_matrix_column_low), ' ',
                        'THEN 1 ELSE 0 END + '
                    );
                    
                    SET v_missed_case_sql = CONCAT(v_missed_case_sql,
                        'CASE WHEN ',
                        'wide.m_', v_criterion_order, ' IS NULL ',
                        'OR wide.m_', v_criterion_order, ' ',
                            CASE
                                WHEN v_operator = '>=' THEN '<'
                                WHEN v_operator = '>' THEN '<='
                                WHEN v_operator = '<=' THEN '>'
                                WHEN v_operator = '<' THEN '>='
                                ELSE '<'
                            END, ' matrix.', v_matrix_column_low, ' ',
                        'OR wide.m_', v_criterion_order, 'b IS NULL ',
                        'OR wide.m_', v_criterion_order, 'b ',
                            CASE
                                WHEN COALESCE(v_secondary_operator, v_operator) = '>=' THEN '<'
                                WHEN COALESCE(v_secondary_operator, v_operator) = '>' THEN '<='
                                WHEN COALESCE(v_secondary_operator, v_operator) = '<=' THEN '>'
                                WHEN COALESCE(v_secondary_operator, v_operator) = '<' THEN '>='
                                ELSE '<'
                            END, ' matrix.', COALESCE(v_secondary_matrix_column, v_matrix_column_low), ' ',
                        'THEN ''', LPAD(v_criterion_order, 2, '0'), ''' ELSE '''' END, '
                    );

                
                ELSEIF v_operator = '>=' THEN
                    SET v_play_case_sql = CONCAT(v_play_case_sql,
                        'CASE WHEN wide.m_', v_criterion_order, ' IS NOT NULL ',
                        'AND wide.m_', v_criterion_order, ' >= matrix.', v_matrix_column_low, ' ',
                        'THEN 1 ELSE 0 END + '
                    );
                    SET v_missed_case_sql = CONCAT(v_missed_case_sql,
                        'CASE WHEN wide.m_', v_criterion_order, ' IS NULL ',
                        'OR wide.m_', v_criterion_order, ' < matrix.', v_matrix_column_low, ' ',
                        'THEN ''', LPAD(v_criterion_order, 2, '0'), ''' ELSE '''' END, '
                    );

                
                ELSEIF v_operator = '<=' THEN
                    SET v_play_case_sql = CONCAT(v_play_case_sql,
                        'CASE WHEN wide.m_', v_criterion_order, ' IS NOT NULL ',
                        'AND wide.m_', v_criterion_order, ' <= matrix.', v_matrix_column_low, ' ',
                        'THEN 1 ELSE 0 END + '
                    );
                    SET v_missed_case_sql = CONCAT(v_missed_case_sql,
                        'CASE WHEN wide.m_', v_criterion_order, ' IS NULL ',
                        'OR wide.m_', v_criterion_order, ' > matrix.', v_matrix_column_low, ' ',
                        'THEN ''', LPAD(v_criterion_order, 2, '0'), ''' ELSE '''' END, '
                    );

                
                ELSEIF v_operator = '>' THEN
                    SET v_play_case_sql = CONCAT(v_play_case_sql,
                        'CASE WHEN wide.m_', v_criterion_order, ' IS NOT NULL ',
                        'AND wide.m_', v_criterion_order, ' > matrix.', v_matrix_column_low, ' ',
                        'THEN 1 ELSE 0 END + '
                    );
                    SET v_missed_case_sql = CONCAT(v_missed_case_sql,
                        'CASE WHEN wide.m_', v_criterion_order, ' IS NULL ',
                        'OR wide.m_', v_criterion_order, ' <= matrix.', v_matrix_column_low, ' ',
                        'THEN ''', LPAD(v_criterion_order, 2, '0'), ''' ELSE '''' END, '
                    );

                
                ELSEIF v_operator = '<' THEN
                    SET v_play_case_sql = CONCAT(v_play_case_sql,
                        'CASE WHEN wide.m_', v_criterion_order, ' IS NOT NULL ',
                        'AND wide.m_', v_criterion_order, ' < matrix.', v_matrix_column_low, ' ',
                        'THEN 1 ELSE 0 END + '
                    );
                    SET v_missed_case_sql = CONCAT(v_missed_case_sql,
                        'CASE WHEN wide.m_', v_criterion_order, ' IS NULL ',
                        'OR wide.m_', v_criterion_order, ' >= matrix.', v_matrix_column_low, ' ',
                        'THEN ''', LPAD(v_criterion_order, 2, '0'), ''' ELSE '''' END, '
                    );

                
                ELSEIF v_operator = 'BETWEEN' THEN
                    SET v_play_case_sql = CONCAT(v_play_case_sql,
                        'CASE WHEN wide.m_', v_criterion_order, ' IS NOT NULL ',
                        'AND wide.m_', v_criterion_order, ' >= matrix.', v_matrix_column_low, ' ',
                        'AND wide.m_', v_criterion_order, ' <= matrix.', v_matrix_column_high, ' ',
                        'THEN 1 ELSE 0 END + '
                    );
                    SET v_missed_case_sql = CONCAT(v_missed_case_sql,
                        'CASE WHEN wide.m_', v_criterion_order, ' IS NULL ',
                        'OR wide.m_', v_criterion_order, ' < matrix.', v_matrix_column_low, ' ',
                        'OR wide.m_', v_criterion_order, ' > matrix.', v_matrix_column_high, ' ',
                        'THEN ''', LPAD(v_criterion_order, 2, '0'), ''' ELSE '''' END, '
                    );

                ELSE
                    
                    INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
                    VALUES (v_session_id, 'calculate_all_play_rankings', 'WARNING',
                            CONCAT('Unknown operator "', v_operator, '" (compound_logic="', v_compound_logic,
                                   '") for criterion ', v_criterion_order, ' - treating as >='),
                            CONCAT('PLAY_', v_play_name, '_CRIT_', v_criterion_order));

                    SET v_play_case_sql = CONCAT(v_play_case_sql,
                        'CASE WHEN wide.m_', v_criterion_order, ' IS NOT NULL ',
                        'AND wide.m_', v_criterion_order, ' >= matrix.', v_matrix_column_low, ' ',
                        'THEN 1 ELSE 0 END + '
                    );
                    SET v_missed_case_sql = CONCAT(v_missed_case_sql,
                        'CASE WHEN wide.m_', v_criterion_order, ' IS NULL ',
                        'OR wide.m_', v_criterion_order, ' < matrix.', v_matrix_column_low, ' ',
                        'THEN ''', LPAD(v_criterion_order, 2, '0'), ''' ELSE '''' END, '
                    );
                END IF;

            END LOOP crit_loop;

            CLOSE criteria_cursor;
        END criteria_block;

        
        IF LENGTH(v_play_case_sql) > 3 THEN
            SET v_play_case_sql = LEFT(v_play_case_sql, LENGTH(v_play_case_sql) - 3);
        ELSE
            SET v_play_case_sql = '0';
        END IF;

        IF LENGTH(v_missed_case_sql) > 2 THEN
            SET v_missed_case_sql = LEFT(v_missed_case_sql, LENGTH(v_missed_case_sql) - 2);
        ELSE
            SET v_missed_case_sql = '''0''';
        END IF;

        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_all_play_rankings', 'INFO',
                CONCAT('Built dynamic SQL for ', v_play_name, ' with criteria CASE statements'),
                CONCAT('PLAY_', v_play_name, '_SQL_BUILT'));

        
        
        
        

        
        SET @pivot_exprs = '';
        SET @needed_metric_ids = CONCAT(v_reference_metric_id, ',');
        IF v_coverage_metric_id IS NOT NULL THEN
            SET @needed_metric_ids = CONCAT(@needed_metric_ids, v_coverage_metric_id, ',');
        END IF;
        IF v_price_earnings_metric_id IS NOT NULL THEN
            SET @needed_metric_ids = CONCAT(@needed_metric_ids, v_price_earnings_metric_id, ',');
        END IF;

        pivot_block: BEGIN
            DECLARE v_pivot_done INT DEFAULT FALSE;
            DECLARE v_pivot_order INT;
            DECLARE v_pivot_metric VARCHAR(50);
            DECLARE v_pivot_secondary VARCHAR(50);
            DECLARE v_pivot_compound_logic VARCHAR(10);
            DECLARE v_pivot_metric_id INT;

            DECLARE pivot_cursor CURSOR FOR
                SELECT criterion_order, metric_name, secondary_metric_name,
                       COALESCE(compound_logic, '') AS compound_logic
                FROM dim_play_criteria
                WHERE play_def_id = v_play_def_id AND is_active = 1
                ORDER BY criterion_order;

            DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_pivot_done = TRUE;

            OPEN pivot_cursor;

            pivot_loop: LOOP
                FETCH pivot_cursor INTO v_pivot_order, v_pivot_metric, v_pivot_secondary, v_pivot_compound_logic;

                IF v_pivot_done THEN
                    LEAVE pivot_loop;
                END IF;

                
                SELECT metric_id INTO v_pivot_metric_id FROM dim_metrics WHERE name = v_pivot_metric;
                SET v_pivot_done = FALSE;

                SET @pivot_exprs = CONCAT(@pivot_exprs,
                    'MAX(CASE WHEN fm.metric_id = ', v_pivot_metric_id,
                    ' THEN fm.value END) AS m_', v_pivot_order, ', ');
                SET @needed_metric_ids = CONCAT(@needed_metric_ids, v_pivot_metric_id, ',');

                
                IF v_pivot_compound_logic IN ('OR', 'AND') AND v_pivot_secondary IS NOT NULL THEN
                    SELECT metric_id INTO v_pivot_metric_id FROM dim_metrics WHERE name = v_pivot_secondary;
                    SET v_pivot_done = FALSE;

                    SET @pivot_exprs = CONCAT(@pivot_exprs,
                        'MAX(CASE WHEN fm.metric_id = ', v_pivot_metric_id,
                        ' THEN fm.value END) AS m_', v_pivot_order, 'b, ');
                    SET @needed_metric_ids = CONCAT(@needed_metric_ids, v_pivot_metric_id, ',');
                END IF;

            END LOOP pivot_loop;

            CLOSE pivot_cursor;
        END pivot_block;

        
        IF LENGTH(@pivot_exprs) > 2 THEN
            SET @pivot_exprs = LEFT(@pivot_exprs, LENGTH(@pivot_exprs) - 2);
        END IF;
        IF LENGTH(@needed_metric_ids) > 0 THEN
            SET @needed_metric_ids = LEFT(@needed_metric_ids, LENGTH(@needed_metric_ids) - 1);
        END IF;

        
        
        

        IF v_reference_metric_id IS NOT NULL THEN
            SET v_sql_text = CONCAT(
                'INSERT INTO fact_metrics (report_id, metric_id, value, calculation_date, source_flag, notes) ',
                'SELECT wide.report_id, ',
                    v_play_metric_id, ', ',
                    '(', v_play_case_sql, ') AS play_score, ',
                    'NOW(), ',
                    '''calculate_all_play_rankings'', ',
                    'CONCAT(''', v_play_name, ' score: '', (', v_play_case_sql, '), '' of 14 criteria passed'') ',
                'FROM (',
                    'SELECT fm.report_id',
                    ', MAX(CASE WHEN fm.metric_id = ', v_reference_metric_id, ' THEN fm.value END) AS ref_val',
                    CASE WHEN v_coverage_metric_id IS NOT NULL THEN
                        CONCAT(', MAX(CASE WHEN fm.metric_id = ', v_coverage_metric_id, ' THEN fm.value END) AS cov_val')
                    ELSE '' END,
                    CASE WHEN v_price_earnings_metric_id IS NOT NULL THEN
                        CONCAT(', MAX(CASE WHEN fm.metric_id = ', v_price_earnings_metric_id, ' THEN fm.value END) AS pe_val')
                    ELSE '' END,
                    ', ', @pivot_exprs,
                    ' FROM fact_metrics fm',
                    ' WHERE fm.metric_id IN (', @needed_metric_ids, ')',
                    ' GROUP BY fm.report_id',
                ') wide ',
                'JOIN ', v_matrix_table_name, ' matrix ON ABS(wide.ref_val - matrix.reference) < 0.001 ',
                'JOIN fact_reports r ON r.report_id = wide.report_id ',
                'WHERE wide.ref_val IS NOT NULL ',
                CASE WHEN v_coverage_metric_id IS NOT NULL THEN
                    'AND wide.cov_val >= 0.5 '
                ELSE '' END,
                CASE WHEN v_price_earnings_metric_id IS NOT NULL THEN
                    'AND wide.pe_val IS NOT NULL '
                ELSE '' END
            );

            SET @dynamic_sql = v_sql_text;
            PREPARE stmt FROM @dynamic_sql;
            EXECUTE stmt;
            SET v_plays_created = ROW_COUNT();
            DEALLOCATE PREPARE stmt;

            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, records_affected, execution_step)
            VALUES (v_session_id, 'calculate_all_play_rankings', 'SUCCESS',
                    CONCAT('Play score calculated for ', v_play_name),
                    v_plays_created, CONCAT('PLAY_', v_play_name, '_SCORE'));
        END IF;

        
        
        

        IF v_reference_metric_id IS NOT NULL THEN
            SET v_sql_text = CONCAT(
                'INSERT INTO fact_metrics (report_id, metric_id, value, calculation_date, source_flag, notes) ',
                'SELECT wide.report_id, ',
                    v_missed_upon_metric_id, ', ',
                    'CASE WHEN CONCAT(', v_missed_case_sql, ') = '''' THEN 0 ',
                    'ELSE CAST(CONCAT(', v_missed_case_sql, ') AS DECIMAL(40,4)) END AS missed_codes, ',
                    'NOW(), ',
                    '''calculate_all_play_rankings'', ',
                    'CONCAT(''', v_missed_upon_name, ': '', ',
                           'CASE WHEN CONCAT(', v_missed_case_sql, ') = '''' THEN ''0 (all passed)'' ',
                           'ELSE CONCAT(CONCAT(', v_missed_case_sql, '), '' (missed criteria codes)'') END) ',
                'FROM (',
                    'SELECT fm.report_id',
                    ', MAX(CASE WHEN fm.metric_id = ', v_reference_metric_id, ' THEN fm.value END) AS ref_val',
                    CASE WHEN v_coverage_metric_id IS NOT NULL THEN
                        CONCAT(', MAX(CASE WHEN fm.metric_id = ', v_coverage_metric_id, ' THEN fm.value END) AS cov_val')
                    ELSE '' END,
                    CASE WHEN v_price_earnings_metric_id IS NOT NULL THEN
                        CONCAT(', MAX(CASE WHEN fm.metric_id = ', v_price_earnings_metric_id, ' THEN fm.value END) AS pe_val')
                    ELSE '' END,
                    ', ', @pivot_exprs,
                    ' FROM fact_metrics fm',
                    ' WHERE fm.metric_id IN (', @needed_metric_ids, ')',
                    ' GROUP BY fm.report_id',
                ') wide ',
                'JOIN ', v_matrix_table_name, ' matrix ON ABS(wide.ref_val - matrix.reference) < 0.001 ',
                'JOIN fact_reports r ON r.report_id = wide.report_id ',
                'WHERE wide.ref_val IS NOT NULL ',
                CASE WHEN v_coverage_metric_id IS NOT NULL THEN
                    'AND wide.cov_val >= 0.5 '
                ELSE '' END,
                CASE WHEN v_price_earnings_metric_id IS NOT NULL THEN
                    'AND wide.pe_val IS NOT NULL '
                ELSE '' END
            );

            SET @dynamic_sql = v_sql_text;
            PREPARE stmt FROM @dynamic_sql;
            EXECUTE stmt;
            SET v_missed_upons_created = ROW_COUNT();
            DEALLOCATE PREPARE stmt;

            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, records_affected, execution_step)
            VALUES (v_session_id, 'calculate_all_play_rankings', 'SUCCESS',
                    CONCAT('Missed_upon calculated for ', v_play_name),
                    v_missed_upons_created, CONCAT('PLAY_', v_play_name, '_MISSED'));
        END IF;

        COMMIT;

        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_all_play_rankings', 'SUCCESS',
                CONCAT('Completed ', v_play_name, ': categories=', v_categories_created,
                       ', references=', v_references_created,
                       ', plays=', v_plays_created,
                       ', missed_upons=', v_missed_upons_created),
                CONCAT('PLAY_', v_play_name, '_COMPLETE'));

        
        SET v_categories_created = 0;
        SET v_references_created = 0;
        SET v_plays_created = 0;
        SET v_missed_upons_created = 0;

    END LOOP play_loop;

    CLOSE play_cursor;

    
    
    

    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;

    SET @execution_time = TIMESTAMPDIFF(SECOND, v_start_time, NOW());

    INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, records_affected, execution_step)
    VALUES (v_session_id, 'calculate_all_play_rankings', 'SUCCESS',
            CONCAT('ALL PLAY RANKINGS COMPLETE (v4 pivot). Play definitions processed: ', v_total_plays_processed,
                   ', Execution time: ', @execution_time, ' seconds'),
            v_total_plays_processed, 'FINAL_SUMMARY');

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_all_sector_play_ratings`()
BEGIN
    
    DECLARE v_records_play INT DEFAULT 0;
    DECLARE v_records_play2 INT DEFAULT 0;
    DECLARE v_qualified_play INT DEFAULT 0;
    DECLARE v_qualified_play2 INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);

    
    DECLARE v_play_metric_id INT;
    DECLARE v_play_2_metric_id INT;
    DECLARE v_missed_upon_metric_id INT;
    DECLARE v_missed_upon_2_metric_id INT;
    DECLARE v_play_sector_rating_id INT;
    DECLARE v_play_2_sector_rating_id INT;

    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_all_sector_play_ratings', 'ERROR',
                CONCAT('SQL Error: ', @errno, ': ', @text), 'ERROR_HANDLER');
        SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
        ROLLBACK;
    END;

    
    SET v_session_id = CONCAT('SECPLAY_ALL_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;

    INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, 'calculate_all_sector_play_ratings', 'INFO',
            'Starting database-wide sector play rating recalculation', 'START');

    START TRANSACTION;

    main_block: BEGIN

        
        
        

        SELECT metric_id INTO v_play_metric_id
        FROM dim_metrics WHERE name = 'play';

        SELECT metric_id INTO v_play_2_metric_id
        FROM dim_metrics WHERE name = 'play_2';

        SELECT metric_id INTO v_missed_upon_metric_id
        FROM dim_metrics WHERE name = 'missed_upon';

        SELECT metric_id INTO v_missed_upon_2_metric_id
        FROM dim_metrics WHERE name = 'missed_upon_2';

        SELECT metric_id INTO v_play_sector_rating_id
        FROM dim_metrics WHERE name = 'play_sector_rating';

        SELECT metric_id INTO v_play_2_sector_rating_id
        FROM dim_metrics WHERE name = 'play_2_sector_rating';

        
        IF v_play_metric_id IS NULL OR v_missed_upon_metric_id IS NULL OR v_play_sector_rating_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, 'calculate_all_sector_play_ratings', 'ERROR',
                    CONCAT('Required metrics missing. play=', COALESCE(v_play_metric_id, 'NULL'),
                           ', missed_upon=', COALESCE(v_missed_upon_metric_id, 'NULL'),
                           ', play_sector_rating=', COALESCE(v_play_sector_rating_id, 'NULL')),
                    'VALIDATION');
            LEAVE main_block;
        END IF;

        IF v_play_2_metric_id IS NULL OR v_missed_upon_2_metric_id IS NULL OR v_play_2_sector_rating_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, 'calculate_all_sector_play_ratings', 'INFO',
                    CONCAT('Play_2 metrics missing - skipping play_2_sector_rating. play_2=', COALESCE(v_play_2_metric_id, 'NULL'),
                           ', missed_upon_2=', COALESCE(v_missed_upon_2_metric_id, 'NULL'),
                           ', play_2_sector_rating=', COALESCE(v_play_2_sector_rating_id, 'NULL')),
                    'VALIDATION');
        END IF;

        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_all_sector_play_ratings', 'INFO',
                CONCAT('Metrics resolved: play=', v_play_metric_id,
                       ', play_2=', COALESCE(v_play_2_metric_id, 'NULL'),
                       ', missed_upon=', v_missed_upon_metric_id,
                       ', missed_upon_2=', COALESCE(v_missed_upon_2_metric_id, 'NULL'),
                       ', play_sector_rating=', v_play_sector_rating_id,
                       ', play_2_sector_rating=', COALESCE(v_play_2_sector_rating_id, 'NULL')),
                'VALIDATION');

        
        
        

        SELECT COUNT(*) INTO @play_matrix_count
        FROM dim_sector_play_matrix WHERE is_active = 1;

        SELECT COUNT(*) INTO @play2_matrix_count
        FROM dim_sector_play_2_matrix WHERE is_active = 1;

        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_all_sector_play_ratings', 'INFO',
                CONCAT('Active matrix entries: dim_sector_play_matrix=', @play_matrix_count,
                       ', dim_sector_play_2_matrix=', @play2_matrix_count),
                'MATRIX_CHECK');

        
        
        

        DELETE FROM fact_metrics WHERE metric_id = v_play_sector_rating_id;

        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_all_sector_play_ratings', 'INFO',
                'Cleared all existing play_sector_rating values', 'CLEANUP');

        IF v_play_2_sector_rating_id IS NOT NULL THEN
            DELETE FROM fact_metrics WHERE metric_id = v_play_2_sector_rating_id;

            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, 'calculate_all_sector_play_ratings', 'INFO',
                    'Cleared all existing play_2_sector_rating values', 'CLEANUP');
        END IF;

        
        
        
        

        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, notes, calculation_date)
        SELECT
            r.report_id,
            v_play_sector_rating_id,
            CASE WHEN spm.sector_play_id IS NOT NULL THEN 1 ELSE 0 END,
            'CALC_SECTOR_PLAY',
            CASE
                WHEN spm.sector_play_id IS NOT NULL
                THEN CONCAT('Sector play QUALIFIED: ', c.sector, ' missed criterion ',
                            CAST(missed.value AS UNSIGNED), ' (', COALESCE(spm.criterion_name, 'unknown'), ')')
                ELSE CONCAT('Sector play not matched: ', c.sector, ' missed criterion ',
                            CAST(missed.value AS UNSIGNED))
            END,
            NOW()
        FROM fact_reports r
        JOIN dim_companies c ON r.company_id = c.company_id
        JOIN fact_metrics play ON r.report_id = play.report_id
            AND play.metric_id = v_play_metric_id
        JOIN fact_metrics missed ON r.report_id = missed.report_id
            AND missed.metric_id = v_missed_upon_metric_id
        LEFT JOIN dim_sector_play_matrix spm
            ON spm.sector = c.sector
            AND spm.missed_criterion = CAST(missed.value AS UNSIGNED)
            AND spm.is_active = 1
        WHERE play.value = (SELECT near_miss FROM play_thresholds WHERE play_name = 'play');

        SET v_records_play = ROW_COUNT();

        
        SELECT COUNT(*) INTO v_qualified_play
        FROM fact_metrics
        WHERE metric_id = v_play_sector_rating_id
          AND value = 1;

        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, records_affected, execution_step)
        VALUES (v_session_id, 'calculate_all_sector_play_ratings', 'SUCCESS',
                CONCAT('play_sector_rating: ', v_records_play, ' near-miss reports evaluated, ',
                       v_qualified_play, ' qualified (rating=1)'),
                v_records_play, 'PLAY_SECTOR_COMPLETE');

        
        
        
        

        IF v_play_2_metric_id IS NOT NULL AND v_missed_upon_2_metric_id IS NOT NULL AND v_play_2_sector_rating_id IS NOT NULL THEN

            INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, notes, calculation_date)
            SELECT
                r.report_id,
                v_play_2_sector_rating_id,
                CASE WHEN spm2.sector_play_id IS NOT NULL THEN 1 ELSE 0 END,
                'CALC_SECTOR_PLAY_2',
                CASE
                    WHEN spm2.sector_play_id IS NOT NULL
                    THEN CONCAT('Sector play_2 QUALIFIED: ', c.sector, ' missed criterion ',
                                CAST(missed2.value AS UNSIGNED), ' (', COALESCE(spm2.criterion_name, 'unknown'), ')')
                    ELSE CONCAT('Sector play_2 not matched: ', c.sector, ' missed criterion ',
                                CAST(missed2.value AS UNSIGNED))
                END,
                NOW()
            FROM fact_reports r
            JOIN dim_companies c ON r.company_id = c.company_id
            JOIN fact_metrics play2 ON r.report_id = play2.report_id
                AND play2.metric_id = v_play_2_metric_id
            JOIN fact_metrics missed2 ON r.report_id = missed2.report_id
                AND missed2.metric_id = v_missed_upon_2_metric_id
            LEFT JOIN dim_sector_play_2_matrix spm2
                ON spm2.sector = c.sector
                AND spm2.missed_criterion = CAST(missed2.value AS UNSIGNED)
                AND spm2.is_active = 1
            WHERE play2.value = (SELECT near_miss FROM play_thresholds WHERE play_name = 'play_2');

            SET v_records_play2 = ROW_COUNT();

            
            SELECT COUNT(*) INTO v_qualified_play2
            FROM fact_metrics
            WHERE metric_id = v_play_2_sector_rating_id
              AND value = 1;

            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, records_affected, execution_step)
            VALUES (v_session_id, 'calculate_all_sector_play_ratings', 'SUCCESS',
                    CONCAT('play_2_sector_rating: ', v_records_play2, ' near-miss reports evaluated, ',
                           v_qualified_play2, ' qualified (rating=1)'),
                    v_records_play2, 'PLAY_2_SECTOR_COMPLETE');

        END IF;

        
        
        

        SET SQL_SAFE_UPDATES = @old_sql_safe_updates;

    END main_block;

    COMMIT;

    
    INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, 'calculate_all_sector_play_ratings', 'SUCCESS',
            CONCAT('ALL SECTOR PLAY RATINGS COMPLETE. ',
                   'play_sector: ', v_records_play, ' evaluated / ', v_qualified_play, ' qualified. ',
                   'play_2_sector: ', v_records_play2, ' evaluated / ', v_qualified_play2, ' qualified. ',
                   'Execution time: ', TIMESTAMPDIFF(SECOND, v_start_time, NOW()), 's'),
            'FINAL_SUMMARY');

    
    SELECT CONCAT('Sector play ratings complete. ',
                  'play_sector: ', v_records_play, ' evaluated / ', v_qualified_play, ' qualified. ',
                  'play_2_sector: ', v_records_play2, ' evaluated / ', v_qualified_play2, ' qualified.') AS result;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_10_for_company`(
    IN p_company_id INT
)
BEGIN
    -- Variable declarations
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_metric_id INT;
    DECLARE v_metric_name VARCHAR(50);
    DECLARE v_base_metric_name VARCHAR(50);
    DECLARE v_base_metric_id INT;
    DECLARE v_lookback_years INT;
    DECLARE v_records_processed INT DEFAULT 0;
    DECLARE v_total_metrics INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);
    
    -- Cursor declaration MUST come before handlers
    DECLARE priority_10_cursor CURSOR FOR
        SELECT 
            metric_id,
            name,
            base_metric_name,
            CASE 
                WHEN name LIKE '%_1y_growth' THEN 1
                WHEN name LIKE '%_2y_growth' THEN 2
                WHEN name LIKE '%_3y_growth' THEN 3
                WHEN name LIKE '%_4y_growth' THEN 4
                ELSE 1
            END AS lookback_years
        FROM dim_metrics
        WHERE calculation_priority = 10
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
        ORDER BY base_metric_name, lookback_years;
    
    -- Handler declarations MUST come after cursor declarations
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;
        -- Log error to table (no SELECT statement)
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_10_for_company', 'ERROR', 
               CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        ROLLBACK;
    END;
    
    -- Get company ticker for logging
    SELECT ticker INTO @company_ticker 
    FROM dim_companies 
    WHERE company_id = p_company_id;
    
    -- Initialize session and variables
    SET v_session_id = CONCAT('P10_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;
    
    -- Start transaction
    START TRANSACTION;
    
    main_block: BEGIN
        -- Log procedure start
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_10_for_company', 'INFO', 
                CONCAT('Starting Priority 10 growth calculations for company_id: ', p_company_id), 'START');
        
        -- Validate company exists
        IF @company_ticker IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, 'UNKNOWN', 'calculate_priority_10_for_company', 'ERROR', 
                    CONCAT('Company_id ', p_company_id, ' not found in dim_companies'), 'VALIDATION');
            LEAVE main_block;
        END IF;
        
        -- Count metrics to process
        SELECT COUNT(*) INTO v_total_metrics
        FROM dim_metrics
        WHERE calculation_priority = 10
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY);
        
        -- Log metrics to process
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_10_for_company', 'INFO', 
                CONCAT('Found ', v_total_metrics, ' Priority 10 growth metrics to calculate'), 'METRICS_IDENTIFIED');
        
        -- Clear existing Priority 10 values for this company
        DELETE FROM fact_metrics 
        WHERE metric_id IN (
            SELECT metric_id FROM dim_metrics 
            WHERE calculation_priority = 10 
              AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
        )
        AND report_id IN (
            SELECT report_id FROM fact_reports 
            WHERE company_id = p_company_id
        );
        
        -- Log cleanup
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_10_for_company', 'INFO', 
                CONCAT('Cleared existing Priority 10 metrics for company_id: ', p_company_id), 'CLEANUP');
        
        -- ===================================================================
        -- PROCESS EACH PRIORITY 10 GROWTH METRIC
        -- ===================================================================
        
        OPEN priority_10_cursor;
        
        read_loop: LOOP
            FETCH priority_10_cursor INTO v_metric_id, v_metric_name, v_base_metric_name, v_lookback_years;
            
            IF done THEN
                LEAVE read_loop;
            END IF;
            
            -- Log current metric processing
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_10_for_company', 'INFO', 
                    CONCAT('Processing metric: ', v_metric_name, ' (base: ', v_base_metric_name, ', lookback: ', v_lookback_years, ' years)'), 
                    v_metric_name, 'METRIC_START');
            
            -- ===================================================================
            -- RESOLVE BASE METRIC ID (Handle potential naming inconsistencies)
            -- ===================================================================
            
            -- Reset base metric ID
            SET v_base_metric_id = NULL;
            
            -- First try the exact base_metric_name from dim_metrics
            SELECT metric_id INTO v_base_metric_id 
            FROM dim_metrics 
            WHERE CAST(name AS BINARY) = CAST(v_base_metric_name AS BINARY);
            
            -- If not found, try alternative naming patterns based on the metric group
            IF v_base_metric_id IS NULL THEN
                IF v_metric_name LIKE 'equity_%' THEN
                    -- Try equity_share for equity growth metrics
                    SELECT metric_id INTO v_base_metric_id 
                    FROM dim_metrics 
                    WHERE CAST(name AS BINARY) = CAST('equity_share' AS BINARY);
                ELSEIF v_metric_name LIKE 'revenue_%' THEN
                    -- Try revenue_share for revenue growth metrics
                    SELECT metric_id INTO v_base_metric_id 
                    FROM dim_metrics 
                    WHERE CAST(name AS BINARY) = CAST('revenue_share' AS BINARY);
                END IF;
            END IF;
            
            -- Log base metric resolution
            IF v_base_metric_id IS NULL THEN
                INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
                VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_10_for_company', 'WARNING', 
                        CONCAT('Base metric not found: ', v_base_metric_name, ' for ', v_metric_name), v_metric_name, 'BASE_METRIC_MISSING');
                ITERATE read_loop;
            ELSE
                INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
                VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_10_for_company', 'INFO', 
                        CONCAT('Base metric resolved: metric_id ', v_base_metric_id, ' for ', v_base_metric_name), v_metric_name, 'BASE_METRIC_RESOLVED');
            END IF;
            
            -- ===================================================================
            -- CALCULATE GROWTH METRIC
            -- ===================================================================
            
            -- Insert growth calculations for all reports of this company
            INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
            SELECT 
                current_fr.report_id,
                v_metric_id,
                CASE 
                    -- EPS Special Case: Negative to Positive transition
                    WHEN v_metric_name LIKE 'eps_1y_growth' 
                         AND current_fm.value > 0 
                         AND historical_fm.value < 0 THEN
                        0.4  -- 40% special case value
                    
                    -- 1-Year Growth: Simple annual growth
                    WHEN v_lookback_years = 1 THEN
                        (current_fm.value / historical_fm.value) - 1
                    
                    -- Multi-Year Growth: Compound Annual Growth Rate (CAGR)
                    ELSE
                        POWER(current_fm.value / historical_fm.value, 1.0 / v_lookback_years) - 1
                    
                END AS calculated_growth,
                CASE 
                    WHEN v_metric_name LIKE 'eps_1y_growth' 
                         AND current_fm.value > 0 
                         AND historical_fm.value < 0 THEN
                        'CALCULATED_1Y_SPECIAL'
                    WHEN v_lookback_years = 1 THEN
                        'CALCULATED_1Y_GROWTH'
                    WHEN v_lookback_years = 2 THEN
                        'CALCULATED_2Y_CAGR'
                    WHEN v_lookback_years = 3 THEN
                        'CALCULATED_3Y_CAGR'
                    WHEN v_lookback_years = 4 THEN
                        'CALCULATED_4Y_CAGR'
                    ELSE
                        'CALCULATED_GROWTH'
                END AS source_flag,
                NOW() AS calculation_date,
                CASE 
                    WHEN v_metric_name LIKE 'eps_1y_growth' 
                         AND current_fm.value > 0 
                         AND historical_fm.value < 0 THEN
                        CONCAT('EPS transition (negative to positive): ', ROUND(historical_fm.value, 4), ' to ', ROUND(current_fm.value, 4))
                    WHEN v_lookback_years = 1 THEN
                        CONCAT('1Y growth: ', ROUND(current_fm.value, 4), ' vs ', ROUND(historical_fm.value, 4))
                    ELSE
                        CONCAT(v_lookback_years, 'Y CAGR: ', ROUND(current_fm.value, 4), ' vs ', ROUND(historical_fm.value, 4))
                END AS notes
            FROM fact_reports current_fr
            
            -- Join to current metric values
            JOIN fact_metrics current_fm ON (
                current_fm.report_id = current_fr.report_id
                AND current_fm.metric_id = v_base_metric_id
            )
            
            -- Join to historical metric values (same company, same report type, N years back)
            JOIN fact_reports historical_fr ON (
                historical_fr.company_id = current_fr.company_id
                AND CAST(historical_fr.report_type AS BINARY) = CAST(current_fr.report_type AS BINARY)
                AND historical_fr.financial_year = (current_fr.financial_year - v_lookback_years)
            )
            
            JOIN fact_metrics historical_fm ON (
                historical_fm.report_id = historical_fr.report_id
                AND historical_fm.metric_id = v_base_metric_id
            )
            
            WHERE current_fr.company_id = p_company_id
              -- Standard growth rate conditions
              AND ((v_metric_name NOT LIKE 'eps_1y_growth' 
                    AND current_fm.value > 0 
                    AND historical_fm.value > 0)
                   -- OR special EPS 1Y case (negative to positive)
                   OR (v_metric_name LIKE 'eps_1y_growth' 
                       AND current_fm.value > 0));
            
            -- Count records processed for this metric
            SELECT ROW_COUNT() INTO @records_added;
            SET v_records_processed = v_records_processed + @records_added;
            
            -- Log metric completion
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_10_for_company', 'INFO', 
                    CONCAT('Completed metric: ', v_metric_name, ' - Records added: ', @records_added), v_metric_name, 'METRIC_COMPLETE');
            
        END LOOP read_loop;
        
        CLOSE priority_10_cursor;
        
        -- ===================================================================
        -- PROCEDURE COMPLETION AND SUMMARY
        -- ===================================================================
        
        -- Calculate execution time
        SET @execution_time = TIMESTAMPDIFF(SECOND, v_start_time, NOW());
        
        -- Log final summary
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_10_for_company', 'INFO', 
                CONCAT('Priority 10 calculation completed - Total records processed: ', v_records_processed, 
                      ', Execution time: ', @execution_time, ' seconds'), 'COMPLETION');
        
    END main_block;
    
    -- Cleanup and commit
    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    COMMIT;
    
    -- Final success log
    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_10_for_company', 'SUCCESS', 
            CONCAT('Successfully calculated Priority 10 growth metrics for ', @company_ticker), 'SUCCESS');
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_11_for_company`(
    IN p_company_id INT
)
BEGIN

    DECLARE done INT DEFAULT FALSE;
    DECLARE v_metric_id INT;
    DECLARE v_metric_name VARCHAR(50);
    DECLARE v_base_metric_name VARCHAR(50);
    DECLARE v_records_processed INT DEFAULT 0;
    DECLARE v_total_metrics INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);


    DECLARE priority_11_cursor CURSOR FOR
        SELECT
            metric_id,
            name,
            base_metric_name
        FROM dim_metrics
        WHERE calculation_priority = 11
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
        ORDER BY base_metric_name, name;


    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;


    SET v_session_id = CONCAT('P11_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;


    START TRANSACTION;

    main_block: BEGIN

        SELECT ticker INTO @company_ticker
        FROM dim_companies
        WHERE company_id = p_company_id;


        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_11_for_company', 'INFO',
                CONCAT('Starting Priority 11 calculations for company_id: ', p_company_id), 'START');


        IF @company_ticker IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, 'UNKNOWN', 'calculate_priority_11_for_company', 'ERROR',
                    CONCAT('Company_id ', p_company_id, ' not found in dim_companies'), 'VALIDATION');
            LEAVE main_block;
        END IF;


        SELECT COUNT(*) INTO v_total_metrics
        FROM dim_metrics
        WHERE calculation_priority = 11
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY);


        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_11_for_company', 'INFO',
                CONCAT('Found ', v_total_metrics, ' Priority 11 metrics to calculate'), 'METRICS_IDENTIFIED');


        DELETE FROM fact_metrics
        WHERE metric_id IN (
            SELECT metric_id FROM dim_metrics
            WHERE calculation_priority = 11
              AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
        )
        AND report_id IN (
            SELECT report_id FROM fact_reports
            WHERE company_id = p_company_id
        );

        SET @cleared_count = ROW_COUNT();


        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_11_for_company', 'INFO',
                'Cleared existing priority 11 metrics for clean calculation', @cleared_count, 'CLEANUP');


        OPEN priority_11_cursor;

        read_loop: LOOP
            FETCH priority_11_cursor INTO v_metric_id, v_metric_name, v_base_metric_name;

            IF done THEN
                LEAVE read_loop;
            END IF;


            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_11_for_company', 'INFO',
                    CONCAT('Processing metric: ', v_metric_name, ' (base: ', v_base_metric_name, ')'), v_metric_name, 'METRIC_START');


            IF v_metric_name LIKE '%_2y_av' THEN

                
                
                
                INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
                SELECT
                    current_metric.report_id,
                    v_metric_id,
                    (current_metric.value
                        + get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 12)) / 2,
                    CONCAT('CALC_2Y_AVG_', UPPER(v_base_metric_name)),
                    NOW(),
                    CONCAT('2Y avg: curr=', ROUND(current_metric.value, 4),
                           ', 12m=', ROUND(get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 12), 4))
                FROM fact_metrics current_metric
                INNER JOIN dim_metrics dm_current ON
                    current_metric.metric_id = dm_current.metric_id AND
                    CAST(dm_current.name AS BINARY) = CAST(v_base_metric_name AS BINARY) AND
                    dm_current.calculation_priority = 7
                WHERE current_metric.report_id IN (
                    SELECT report_id FROM fact_reports WHERE company_id = p_company_id
                )
                AND get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 12) IS NOT NULL;

            ELSEIF v_metric_name LIKE '%_3y_av' THEN

                
                INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
                SELECT
                    current_metric.report_id,
                    v_metric_id,
                    (current_metric.value
                        + get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 12)
                        + get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 24)) / 3,
                    CONCAT('CALC_3Y_AVG_', UPPER(v_base_metric_name)),
                    NOW(),
                    CONCAT('3Y avg: curr=', ROUND(current_metric.value, 4),
                           ', 12m=', ROUND(get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 12), 4),
                           ', 24m=', ROUND(get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 24), 4))
                FROM fact_metrics current_metric
                INNER JOIN dim_metrics dm_current ON
                    current_metric.metric_id = dm_current.metric_id AND
                    CAST(dm_current.name AS BINARY) = CAST(v_base_metric_name AS BINARY) AND
                    dm_current.calculation_priority = 7
                WHERE current_metric.report_id IN (
                    SELECT report_id FROM fact_reports WHERE company_id = p_company_id
                )
                AND get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 12) IS NOT NULL
                AND get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 24) IS NOT NULL;

            ELSEIF v_metric_name LIKE '%_4y_av' THEN

                
                INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
                SELECT
                    current_metric.report_id,
                    v_metric_id,
                    (current_metric.value
                        + get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 12)
                        + get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 24)
                        + get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 36)) / 4,
                    CONCAT('CALC_4Y_AVG_', UPPER(v_base_metric_name)),
                    NOW(),
                    CONCAT('4Y avg: curr=', ROUND(current_metric.value, 4),
                           ', 12m=', ROUND(get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 12), 4),
                           ', 24m=', ROUND(get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 24), 4),
                           ', 36m=', ROUND(get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 36), 4))
                FROM fact_metrics current_metric
                INNER JOIN dim_metrics dm_current ON
                    current_metric.metric_id = dm_current.metric_id AND
                    CAST(dm_current.name AS BINARY) = CAST(v_base_metric_name AS BINARY) AND
                    dm_current.calculation_priority = 7
                WHERE current_metric.report_id IN (
                    SELECT report_id FROM fact_reports WHERE company_id = p_company_id
                )
                AND get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 12) IS NOT NULL
                AND get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 24) IS NOT NULL
                AND get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 36) IS NOT NULL;

            ELSEIF v_metric_name LIKE '%_5y_av' THEN

                
                INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
                SELECT
                    current_metric.report_id,
                    v_metric_id,
                    (current_metric.value
                        + get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 12)
                        + get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 24)
                        + get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 36)
                        + get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 48)) / 5,
                    CONCAT('CALC_5Y_AVG_', UPPER(v_base_metric_name)),
                    NOW(),
                    CONCAT('5Y avg: curr=', ROUND(current_metric.value, 4),
                           ', 12m=', ROUND(get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 12), 4),
                           ', 24m=', ROUND(get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 24), 4),
                           ', 36m=', ROUND(get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 36), 4),
                           ', 48m=', ROUND(get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 48), 4))
                FROM fact_metrics current_metric
                INNER JOIN dim_metrics dm_current ON
                    current_metric.metric_id = dm_current.metric_id AND
                    CAST(dm_current.name AS BINARY) = CAST(v_base_metric_name AS BINARY) AND
                    dm_current.calculation_priority = 7
                WHERE current_metric.report_id IN (
                    SELECT report_id FROM fact_reports WHERE company_id = p_company_id
                )
                AND get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 12) IS NOT NULL
                AND get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 24) IS NOT NULL
                AND get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 36) IS NOT NULL
                AND get_historical_calculated_metric(current_metric.report_id, v_base_metric_name, 48) IS NOT NULL;

            END IF;

            SET @inserted_count = ROW_COUNT();
            SET v_records_processed = v_records_processed + @inserted_count;


            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_11_for_company', 'INFO',
                    CONCAT('Completed ', v_metric_name, ' - inserted ', @inserted_count, ' values'), v_metric_name, @inserted_count, 'METRIC_COMPLETE');

        END LOOP read_loop;

        CLOSE priority_11_cursor;


        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_11_for_company', 'SUCCESS',
                CONCAT('Completed Priority 11 calculations. Created ', v_records_processed, ' metric values. Execution time: ', TIMESTAMPDIFF(SECOND, v_start_time, NOW()), ' seconds'),
                v_records_processed, 'COMPLETION');

    END main_block;


    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    COMMIT;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_12_for_company`(
    IN p_company_id INT
)
BEGIN
    -- Variable declarations
    DECLARE v_records_processed INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);
    
    -- Error handler
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_12_for_company', 'ERROR', 
                CONCAT('SQL Error: ', @errno, ': ', @text), 'ERROR_HANDLER');
        ROLLBACK;
    END;
    
    -- Generate session ID
    SET v_session_id = CONCAT('P12_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    
    START TRANSACTION;
    
    main_block: BEGIN
        -- Get company ticker
        SELECT ticker INTO @company_ticker FROM dim_companies WHERE company_id = p_company_id;
        
        -- Log start
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_12_for_company', 'INFO', 
                'Starting Priority 12 calculations', 'START');
        
        -- Disable safe updates
        SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
        SET SQL_SAFE_UPDATES = 0;
        
        -- Clear existing Priority 12 metrics
        DELETE fm FROM fact_metrics fm
        JOIN fact_reports fr ON fm.report_id = fr.report_id
        JOIN dim_metrics dm ON fm.metric_id = dm.metric_id
        WHERE fr.company_id = p_company_id AND dm.calculation_priority = 12;
        
        SET @cleared_count = ROW_COUNT();
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_12_for_company', 'INFO', 
                'Cleared existing Priority 12 metrics', @cleared_count, 'CLEANUP');
        
        -- ===================================================================
        -- INDIVIDUAL METRIC CALCULATIONS (like Priority 11 pattern)
        -- ===================================================================
        
        -- 1. EV_SALES (CORRECTED FORMULA)
		INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
		SELECT 
			fr.report_id,
			dm.metric_id,
			(IFNULL(mc.value, 0) + IFNULL(std.value, 0) + IFNULL(ltd.value, 0) - (IFNULL(cash.value, 0) + IFNULL(rc.value, 0))) / rev_ttm.value,
			'CALC_EV_SALES',
			NOW(),
			CONCAT('EV/Sales: ', ROUND((IFNULL(mc.value, 0) + IFNULL(std.value, 0) + IFNULL(ltd.value, 0) - (IFNULL(cash.value, 0) + IFNULL(rc.value, 0))) / rev_ttm.value, 4))
		FROM fact_reports fr
		LEFT JOIN fact_metrics mc ON fr.report_id = mc.report_id AND mc.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'market_cap')
		LEFT JOIN fact_metrics std ON fr.report_id = std.report_id AND std.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'short_term_debt')
		LEFT JOIN fact_metrics ltd ON fr.report_id = ltd.report_id AND ltd.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'long_term_debt')
		LEFT JOIN fact_metrics cash ON fr.report_id = cash.report_id AND cash.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'cash')
		LEFT JOIN fact_metrics rc ON fr.report_id = rc.report_id AND rc.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'restricted_cash')
		INNER JOIN fact_metrics rev_ttm ON fr.report_id = rev_ttm.report_id AND rev_ttm.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'revenue_ttm')
		INNER JOIN dim_metrics dm ON dm.name = 'ev_sales'
		WHERE fr.company_id = p_company_id
		  AND rev_ttm.value > 0
		  AND NOT EXISTS (SELECT 1 FROM fact_metrics existing_fm WHERE existing_fm.report_id = fr.report_id AND existing_fm.metric_id = dm.metric_id);

		SET @inserted_count = ROW_COUNT();
		SET v_records_processed = v_records_processed + @inserted_count;

		INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
		VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_12_for_company', 'INFO', 
				CONCAT('Completed ev_sales - inserted ', @inserted_count, ' values'), 'ev_sales', @inserted_count, 'METRIC_COMPLETE');
        
        -- 2. PRICE_EARNINGS (AMENDED WITH RESTRICTED_CASH)
		INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
		SELECT 
			fr.report_id,
			dm.metric_id,
			(IFNULL(mc.value, 0) + IFNULL(std.value, 0) + IFNULL(ltd.value, 0) - (IFNULL(cash.value, 0) + IFNULL(rc.value, 0))) / fcf.value,
			'CALC_PRICE_EARN',
			NOW(),
			CONCAT('EV/FCF: ', ROUND((IFNULL(mc.value, 0) + IFNULL(std.value, 0) + IFNULL(ltd.value, 0) - (IFNULL(cash.value, 0) + IFNULL(rc.value, 0))) / fcf.value, 4))
		FROM fact_reports fr
		LEFT JOIN fact_metrics mc ON fr.report_id = mc.report_id AND mc.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'market_cap')
		LEFT JOIN fact_metrics std ON fr.report_id = std.report_id AND std.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'short_term_debt')
		LEFT JOIN fact_metrics ltd ON fr.report_id = ltd.report_id AND ltd.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'long_term_debt')
		LEFT JOIN fact_metrics cash ON fr.report_id = cash.report_id AND cash.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'cash')
		LEFT JOIN fact_metrics rc ON fr.report_id = rc.report_id AND rc.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'restricted_cash')
		INNER JOIN fact_metrics fcf ON fr.report_id = fcf.report_id AND fcf.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'free_cash_flow')
		INNER JOIN dim_metrics dm ON dm.name = 'price_earnings'
		WHERE fr.company_id = p_company_id
		  AND fcf.value > 0
		  AND NOT EXISTS (SELECT 1 FROM fact_metrics existing_fm WHERE existing_fm.report_id = fr.report_id AND existing_fm.metric_id = dm.metric_id);
        
        SET @inserted_count = ROW_COUNT();
        SET v_records_processed = v_records_processed + @inserted_count;
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_12_for_company', 'INFO', 
                CONCAT('Completed price_earnings - inserted ', @inserted_count, ' values'), 'price_earnings', @inserted_count, 'METRIC_COMPLETE');
        
        -- 3. CASH_CONVERSION (KEEPING ORIGINAL)
        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
        SELECT 
            fr.report_id,
            dm.metric_id,
            CASE 
                WHEN ibt.value < 0 AND fcf.value > 0 THEN 1.0000
                WHEN ibt.value > 0 AND fcf.value > 0 THEN fcf.value / ibt.value
                ELSE NULL
            END,
            'CALC_CASH_CONV',
            NOW(),
            CONCAT('CashConv: IBT=', ROUND(ibt.value, 0), ' FCF=', ROUND(fcf.value, 0))
        FROM fact_reports fr
        INNER JOIN fact_metrics ibt ON fr.report_id = ibt.report_id AND ibt.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'income_before_tax_ttm')
        INNER JOIN fact_metrics fcf ON fr.report_id = fcf.report_id AND fcf.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'free_cash_flow')
        INNER JOIN dim_metrics dm ON dm.name = 'cash_conversion'
        WHERE fr.company_id = p_company_id
          AND ((ibt.value < 0 AND fcf.value > 0) OR (ibt.value > 0 AND fcf.value > 0))
          AND NOT EXISTS (SELECT 1 FROM fact_metrics existing_fm WHERE existing_fm.report_id = fr.report_id AND existing_fm.metric_id = dm.metric_id);
        
        SET @inserted_count = ROW_COUNT();
        SET v_records_processed = v_records_processed + @inserted_count;
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_12_for_company', 'INFO', 
                CONCAT('Completed cash_conversion - inserted ', @inserted_count, ' values'), 'cash_conversion', @inserted_count, 'METRIC_COMPLETE');
        
        -- 4. COVERAGE (CORRECTED - 15 fields as per Excel formula)
        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
        SELECT 
            fr.report_id,
            dm.metric_id,
            1 - (
                (CASE WHEN roic_4y_av.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN roic_3y_av.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN roic.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN roa.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN equity_3y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN equity_2y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN equity_1y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN eps_3y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN eps_2y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN eps_1y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN revenue_3y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN revenue_2y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN revenue_1y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN cash_2y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN cash_1y_growth.value IS NULL THEN 1 ELSE 0 END)
            ) / 15.0,
            'CALC_COVERAGE',
            NOW(),
            CONCAT('Coverage: 15 metrics - ROIC (4y/3y/current), ROA, Equity Growth (3y/2y/1y), EPS Growth (3y/2y/1y), Revenue Growth (3y/2y/1y), Cash Growth (2y/1y)')
        FROM fact_reports fr
        LEFT JOIN fact_metrics roic_4y_av ON fr.report_id = roic_4y_av.report_id AND roic_4y_av.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roic_4y_av')
        LEFT JOIN fact_metrics roic_3y_av ON fr.report_id = roic_3y_av.report_id AND roic_3y_av.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roic_3y_av')
        LEFT JOIN fact_metrics roic ON fr.report_id = roic.report_id AND roic.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roic')
        LEFT JOIN fact_metrics roa ON fr.report_id = roa.report_id AND roa.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roa')
        LEFT JOIN fact_metrics equity_3y_growth ON fr.report_id = equity_3y_growth.report_id AND equity_3y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'equity_3y_growth')
        LEFT JOIN fact_metrics equity_2y_growth ON fr.report_id = equity_2y_growth.report_id AND equity_2y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'equity_2y_growth')
        LEFT JOIN fact_metrics equity_1y_growth ON fr.report_id = equity_1y_growth.report_id AND equity_1y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'equity_1y_growth')
        LEFT JOIN fact_metrics eps_3y_growth ON fr.report_id = eps_3y_growth.report_id AND eps_3y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'eps_3y_growth')
        LEFT JOIN fact_metrics eps_2y_growth ON fr.report_id = eps_2y_growth.report_id AND eps_2y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'eps_2y_growth')
        LEFT JOIN fact_metrics eps_1y_growth ON fr.report_id = eps_1y_growth.report_id AND eps_1y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'eps_1y_growth')
        LEFT JOIN fact_metrics revenue_3y_growth ON fr.report_id = revenue_3y_growth.report_id AND revenue_3y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'revenue_3y_growth')
        LEFT JOIN fact_metrics revenue_2y_growth ON fr.report_id = revenue_2y_growth.report_id AND revenue_2y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'revenue_2y_growth')
        LEFT JOIN fact_metrics revenue_1y_growth ON fr.report_id = revenue_1y_growth.report_id AND revenue_1y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'revenue_1y_growth')
        LEFT JOIN fact_metrics cash_2y_growth ON fr.report_id = cash_2y_growth.report_id AND cash_2y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'cash_2y_growth')
        LEFT JOIN fact_metrics cash_1y_growth ON fr.report_id = cash_1y_growth.report_id AND cash_1y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'cash_1y_growth')
        INNER JOIN dim_metrics dm ON dm.name = 'coverage'
        WHERE fr.company_id = p_company_id
          AND NOT EXISTS (SELECT 1 FROM fact_metrics existing_fm WHERE existing_fm.report_id = fr.report_id AND existing_fm.metric_id = dm.metric_id);
        
        SET @inserted_count = ROW_COUNT();
        SET v_records_processed = v_records_processed + @inserted_count;
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_12_for_company', 'INFO', 
                CONCAT('Completed coverage - inserted ', @inserted_count, ' values'), 'coverage', @inserted_count, 'METRIC_COMPLETE');
        
        -- 5. COVERAGE_NEW (CORRECTED - 29 fields as specified)
        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
        SELECT 
            fr.report_id,
            dm.metric_id,
            1 - (
                (CASE WHEN roic_5y_av.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN roic_4y_av.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN roic_3y_av.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN roic_2y_av.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN roic.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN roa_5y_av.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN roa_4y_av.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN roa_3y_av.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN roa_2y_av.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN roa.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN roe_5y_av.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN roe_4y_av.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN roe_3y_av.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN roe_2y_av.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN roe.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN equity_4y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN equity_3y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN equity_2y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN equity_1y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN eps_4y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN eps_3y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN eps_2y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN eps_1y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN revenue_4y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN revenue_3y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN revenue_2y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN revenue_1y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN cash_2y_growth.value IS NULL THEN 1 ELSE 0 END) +
                (CASE WHEN cash_1y_growth.value IS NULL THEN 1 ELSE 0 END)
            ) / 29.0,
            'CALC_COVERAGE_NEW',
            NOW(),
            CONCAT('Coverage New: 29 metrics - ROIC (5y/4y/3y/2y/current), ROA (5y/4y/3y/2y/current), ROE (5y/4y/3y/2y/current), Equity Growth (4y/3y/2y/1y), EPS Growth (4y/3y/2y/1y), Revenue Growth (4y/3y/2y/1y), Cash Growth (2y/1y)')
        FROM fact_reports fr
        LEFT JOIN fact_metrics roic_5y_av ON fr.report_id = roic_5y_av.report_id AND roic_5y_av.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roic_5y_av')
        LEFT JOIN fact_metrics roic_4y_av ON fr.report_id = roic_4y_av.report_id AND roic_4y_av.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roic_4y_av')
        LEFT JOIN fact_metrics roic_3y_av ON fr.report_id = roic_3y_av.report_id AND roic_3y_av.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roic_3y_av')
        LEFT JOIN fact_metrics roic_2y_av ON fr.report_id = roic_2y_av.report_id AND roic_2y_av.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roic_2y_av')
        LEFT JOIN fact_metrics roic ON fr.report_id = roic.report_id AND roic.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roic')
        LEFT JOIN fact_metrics roa_5y_av ON fr.report_id = roa_5y_av.report_id AND roa_5y_av.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roa_5y_av')
        LEFT JOIN fact_metrics roa_4y_av ON fr.report_id = roa_4y_av.report_id AND roa_4y_av.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roa_4y_av')
        LEFT JOIN fact_metrics roa_3y_av ON fr.report_id = roa_3y_av.report_id AND roa_3y_av.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roa_3y_av')
        LEFT JOIN fact_metrics roa_2y_av ON fr.report_id = roa_2y_av.report_id AND roa_2y_av.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roa_2y_av')
        LEFT JOIN fact_metrics roa ON fr.report_id = roa.report_id AND roa.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roa')
        LEFT JOIN fact_metrics roe_5y_av ON fr.report_id = roe_5y_av.report_id AND roe_5y_av.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roe_5y_av')
        LEFT JOIN fact_metrics roe_4y_av ON fr.report_id = roe_4y_av.report_id AND roe_4y_av.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roe_4y_av')
        LEFT JOIN fact_metrics roe_3y_av ON fr.report_id = roe_3y_av.report_id AND roe_3y_av.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roe_3y_av')
        LEFT JOIN fact_metrics roe_2y_av ON fr.report_id = roe_2y_av.report_id AND roe_2y_av.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roe_2y_av')
        LEFT JOIN fact_metrics roe ON fr.report_id = roe.report_id AND roe.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roe')
        LEFT JOIN fact_metrics equity_4y_growth ON fr.report_id = equity_4y_growth.report_id AND equity_4y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'equity_4y_growth')
        LEFT JOIN fact_metrics equity_3y_growth ON fr.report_id = equity_3y_growth.report_id AND equity_3y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'equity_3y_growth')
        LEFT JOIN fact_metrics equity_2y_growth ON fr.report_id = equity_2y_growth.report_id AND equity_2y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'equity_2y_growth')
        LEFT JOIN fact_metrics equity_1y_growth ON fr.report_id = equity_1y_growth.report_id AND equity_1y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'equity_1y_growth')
        LEFT JOIN fact_metrics eps_4y_growth ON fr.report_id = eps_4y_growth.report_id AND eps_4y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'eps_4y_growth')
        LEFT JOIN fact_metrics eps_3y_growth ON fr.report_id = eps_3y_growth.report_id AND eps_3y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'eps_3y_growth')
        LEFT JOIN fact_metrics eps_2y_growth ON fr.report_id = eps_2y_growth.report_id AND eps_2y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'eps_2y_growth')
        LEFT JOIN fact_metrics eps_1y_growth ON fr.report_id = eps_1y_growth.report_id AND eps_1y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'eps_1y_growth')
        LEFT JOIN fact_metrics revenue_4y_growth ON fr.report_id = revenue_4y_growth.report_id AND revenue_4y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'revenue_4y_growth')
        LEFT JOIN fact_metrics revenue_3y_growth ON fr.report_id = revenue_3y_growth.report_id AND revenue_3y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'revenue_3y_growth')
        LEFT JOIN fact_metrics revenue_2y_growth ON fr.report_id = revenue_2y_growth.report_id AND revenue_2y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'revenue_2y_growth')
        LEFT JOIN fact_metrics revenue_1y_growth ON fr.report_id = revenue_1y_growth.report_id AND revenue_1y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'revenue_1y_growth')
        LEFT JOIN fact_metrics cash_2y_growth ON fr.report_id = cash_2y_growth.report_id AND cash_2y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'cash_2y_growth')
        LEFT JOIN fact_metrics cash_1y_growth ON fr.report_id = cash_1y_growth.report_id AND cash_1y_growth.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'cash_1y_growth')
        INNER JOIN dim_metrics dm ON dm.name = 'coverage_new'
        WHERE fr.company_id = p_company_id
          AND NOT EXISTS (SELECT 1 FROM fact_metrics existing_fm WHERE existing_fm.report_id = fr.report_id AND existing_fm.metric_id = dm.metric_id);
        
        SET @inserted_count = ROW_COUNT();
        SET v_records_processed = v_records_processed + @inserted_count;
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_12_for_company', 'INFO', 
                CONCAT('Completed coverage_new - inserted ', @inserted_count, ' values'), 'coverage_new', @inserted_count, 'METRIC_COMPLETE');
        
        -- 6. debt_equity_v_3y_av (MODIFIED with 2Y fallback)
		INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
		SELECT 
			fr.report_id,
			dm.metric_id,
			de.value / COALESCE(de3y.value, de2y.value),
			'CALC_DEBT_EQ_3Y',
			NOW(),
			CONCAT('D/E vs Avg: ', 
				   ROUND(de.value / COALESCE(de3y.value, de2y.value), 4),
				   CASE 
					   WHEN de3y.value IS NOT NULL THEN ' (using 3Y avg)'
					   WHEN de2y.value IS NOT NULL THEN ' (using 2Y avg fallback)'
					   ELSE ' (no avg available)'
				   END)
		FROM fact_reports fr
		INNER JOIN fact_metrics de ON fr.report_id = de.report_id 
			AND de.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'debt_equity')
		LEFT JOIN fact_metrics de3y ON fr.report_id = de3y.report_id 
			AND de3y.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'debt_equity_3y_av')
		LEFT JOIN fact_metrics de2y ON fr.report_id = de2y.report_id 
			AND de2y.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'debt_equity_2y_av')
		INNER JOIN dim_metrics dm ON dm.name = 'debt_equity_v_3y_av'
		WHERE fr.company_id = p_company_id
		  AND de.value IS NOT NULL 
		  AND (de3y.value IS NOT NULL OR de2y.value IS NOT NULL)
		  AND COALESCE(de3y.value, de2y.value) != 0
		  AND NOT EXISTS (SELECT 1 FROM fact_metrics existing_fm 
						  WHERE existing_fm.report_id = fr.report_id 
						  AND existing_fm.metric_id = dm.metric_id);

		SET @inserted_count = ROW_COUNT();
		SET v_records_processed = v_records_processed + @inserted_count;

		INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
		VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_12_for_company', 'INFO', 
				CONCAT('Completed debt_equity_v_3y_av - inserted ', @inserted_count, ' values'), 'debt_equity_v_3y_av', @inserted_count, 'METRIC_COMPLETE');
        
        -- 7. GROSS_PROFITABILITY (KEEPING ORIGINAL)
        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
        SELECT 
            fr.report_id,
            dm.metric_id,
            ct.value * gm.value,
            'CALC_GROSS_PROF',
            NOW(),
            CONCAT('GrossProf: ', ROUND(ct.value * gm.value, 4))
        FROM fact_reports fr
        INNER JOIN fact_metrics ct ON fr.report_id = ct.report_id AND ct.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'capital_turn')
        INNER JOIN fact_metrics gm ON fr.report_id = gm.report_id AND gm.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'gross_margin')
        INNER JOIN dim_metrics dm ON dm.name = 'gross_profitability'
        WHERE fr.company_id = p_company_id
          AND ct.value IS NOT NULL AND gm.value IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM fact_metrics existing_fm WHERE existing_fm.report_id = fr.report_id AND existing_fm.metric_id = dm.metric_id);
        
        SET @inserted_count = ROW_COUNT();
        SET v_records_processed = v_records_processed + @inserted_count;
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_12_for_company', 'INFO', 
                CONCAT('Completed gross_profitability - inserted ', @inserted_count, ' values'), 'gross_profitability', @inserted_count, 'METRIC_COMPLETE');
        
        -- 8. TAX_INTEREST_BURDEN (KEEPING ORIGINAL)
        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
        SELECT 
            fr.report_id,
            dm.metric_id,
            (-it.value) / fcf.value,
            'CALC_TAX_INT_BUR',
            NOW(),
            CONCAT('TaxIntBurden: ', ROUND((-it.value) / fcf.value, 4))
        FROM fact_reports fr
        INNER JOIN fact_metrics it ON fr.report_id = it.report_id AND it.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'interest_tax_ttm')
        INNER JOIN fact_metrics fcf ON fr.report_id = fcf.report_id AND fcf.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'free_cash_flow')
        INNER JOIN dim_metrics dm ON dm.name = 'tax_interest_burden'
        WHERE fr.company_id = p_company_id
          AND it.value IS NOT NULL AND fcf.value IS NOT NULL AND fcf.value > 0
          AND NOT EXISTS (SELECT 1 FROM fact_metrics existing_fm WHERE existing_fm.report_id = fr.report_id AND existing_fm.metric_id = dm.metric_id);
        
        SET @inserted_count = ROW_COUNT();
        SET v_records_processed = v_records_processed + @inserted_count;
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_12_for_company', 'INFO', 
                CONCAT('Completed tax_interest_burden - inserted ', @inserted_count, ' values'), 'tax_interest_burden', @inserted_count, 'METRIC_COMPLETE');
        
    END main_block;
    
    -- Restore settings and commit
    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    COMMIT;
    
    -- Final summary
    SELECT COUNT(*) INTO @total_priority_12_values
    FROM fact_metrics fm
    JOIN fact_reports fr ON fm.report_id = fr.report_id
    JOIN dim_metrics dm ON fm.metric_id = dm.metric_id
    WHERE fr.company_id = p_company_id AND dm.calculation_priority = 12;
    
    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_12_for_company', 'SUCCESS', 
            CONCAT('Priority 12 completed. Total values: ', @total_priority_12_values, '. Execution time: ', TIMESTAMPDIFF(SECOND, v_start_time, NOW()), ' seconds'), 
            @total_priority_12_values, 'PROCEDURE_COMPLETE');

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_13_for_company`(IN p_company_id INT)
BEGIN
    -- ===================================================================
    -- VARIABLE DECLARATIONS (MUST BE FIRST)
    -- ===================================================================
    
    -- Session management
    DECLARE v_session_id VARCHAR(50);
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_records_processed INT DEFAULT 0;
    DECLARE v_total_metrics INT DEFAULT 0;
    
    -- Priority 13 metric IDs
    DECLARE v_momentum_id INT DEFAULT NULL;
    DECLARE v_momentum_new_id INT DEFAULT NULL;
    DECLARE v_median_growth_id INT DEFAULT NULL;
    
    -- Coverage metric IDs
    DECLARE v_coverage_id INT DEFAULT NULL;
    DECLARE v_coverage_new_id INT DEFAULT NULL;
    
    -- Component metric IDs
    DECLARE v_roic_id INT DEFAULT NULL;
    DECLARE v_roic_3y_av_id INT DEFAULT NULL;
    DECLARE v_roic_4y_av_id INT DEFAULT NULL;
    DECLARE v_roic_5y_av_id INT DEFAULT NULL;
    
    DECLARE v_equity_1y_growth_id INT DEFAULT NULL;
    DECLARE v_equity_2y_growth_id INT DEFAULT NULL;
    DECLARE v_equity_3y_growth_id INT DEFAULT NULL;
    DECLARE v_equity_4y_growth_id INT DEFAULT NULL;
    
    DECLARE v_eps_1y_growth_id INT DEFAULT NULL;
    DECLARE v_eps_2y_growth_id INT DEFAULT NULL;
    DECLARE v_eps_3y_growth_id INT DEFAULT NULL;
    DECLARE v_eps_4y_growth_id INT DEFAULT NULL;
    
    DECLARE v_revenue_1y_growth_id INT DEFAULT NULL;
    DECLARE v_revenue_2y_growth_id INT DEFAULT NULL;
    DECLARE v_revenue_3y_growth_id INT DEFAULT NULL;
    DECLARE v_revenue_4y_growth_id INT DEFAULT NULL;
    
    DECLARE v_cash_1y_growth_id INT DEFAULT NULL;
    DECLARE v_cash_2y_growth_id INT DEFAULT NULL;
    
    DECLARE v_roa_2y_av_id INT DEFAULT NULL;
    DECLARE v_roa_3y_av_id INT DEFAULT NULL;
    DECLARE v_roa_4y_av_id INT DEFAULT NULL;
    DECLARE v_roa_5y_av_id INT DEFAULT NULL;
    
    DECLARE v_roe_2y_av_id INT DEFAULT NULL;
    DECLARE v_roe_3y_av_id INT DEFAULT NULL;
    DECLARE v_roe_4y_av_id INT DEFAULT NULL;
    DECLARE v_roe_5y_av_id INT DEFAULT NULL;
    
    -- ===================================================================
    -- HANDLER DECLARATIONS (MUST BE LAST)
    -- ===================================================================
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_13_for_company', 'ERROR', 
               CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        ROLLBACK;
    END;
    
    -- ===================================================================
    -- INITIALIZATION
    -- ===================================================================
    
    -- Get company ticker for logging
    SELECT ticker INTO @company_ticker 
    FROM dim_companies 
    WHERE company_id = p_company_id;
    
    -- Initialize session
    SET v_session_id = CONCAT('P13_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;
    
    -- Start transaction
    START TRANSACTION;
    
    main_block: BEGIN
        
        -- Log procedure start
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_13_for_company', 'INFO', 
                CONCAT('Starting Priority 13 calculations for company_id: ', p_company_id), 'START');
        
        -- Validate company exists
        IF @company_ticker IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, 'UNKNOWN', 'calculate_priority_13_for_company', 'ERROR', 
                    CONCAT('Company_id ', p_company_id, ' not found'), 'VALIDATION');
            LEAVE main_block;
        END IF;
        
        -- ===================================================================
        -- METRIC ID LOOKUPS
        -- ===================================================================
        
        SELECT metric_id INTO v_momentum_id FROM dim_metrics WHERE name = 'momentum';
        SELECT metric_id INTO v_momentum_new_id FROM dim_metrics WHERE name = 'momentum_new';
        SELECT metric_id INTO v_median_growth_id FROM dim_metrics WHERE name = 'median_growth';
        
        SELECT metric_id INTO v_coverage_id FROM dim_metrics WHERE name = 'coverage';
        SELECT metric_id INTO v_coverage_new_id FROM dim_metrics WHERE name = 'coverage_new';
        
        SELECT metric_id INTO v_roic_id FROM dim_metrics WHERE name = 'roic';
        SELECT metric_id INTO v_roic_3y_av_id FROM dim_metrics WHERE name = 'roic_3y_av';
        SELECT metric_id INTO v_roic_4y_av_id FROM dim_metrics WHERE name = 'roic_4y_av';
        SELECT metric_id INTO v_roic_5y_av_id FROM dim_metrics WHERE name = 'roic_5y_av';
        
        SELECT metric_id INTO v_equity_1y_growth_id FROM dim_metrics WHERE name = 'equity_1y_growth';
        SELECT metric_id INTO v_equity_2y_growth_id FROM dim_metrics WHERE name = 'equity_2y_growth';
        SELECT metric_id INTO v_equity_3y_growth_id FROM dim_metrics WHERE name = 'equity_3y_growth';
        SELECT metric_id INTO v_equity_4y_growth_id FROM dim_metrics WHERE name = 'equity_4y_growth';
        
        SELECT metric_id INTO v_eps_1y_growth_id FROM dim_metrics WHERE name = 'eps_1y_growth';
        SELECT metric_id INTO v_eps_2y_growth_id FROM dim_metrics WHERE name = 'eps_2y_growth';
        SELECT metric_id INTO v_eps_3y_growth_id FROM dim_metrics WHERE name = 'eps_3y_growth';
        SELECT metric_id INTO v_eps_4y_growth_id FROM dim_metrics WHERE name = 'eps_4y_growth';
        
        SELECT metric_id INTO v_revenue_1y_growth_id FROM dim_metrics WHERE name = 'revenue_1y_growth';
        SELECT metric_id INTO v_revenue_2y_growth_id FROM dim_metrics WHERE name = 'revenue_2y_growth';
        SELECT metric_id INTO v_revenue_3y_growth_id FROM dim_metrics WHERE name = 'revenue_3y_growth';
        SELECT metric_id INTO v_revenue_4y_growth_id FROM dim_metrics WHERE name = 'revenue_4y_growth';
        
        SELECT metric_id INTO v_cash_1y_growth_id FROM dim_metrics WHERE name = 'cash_1y_growth';
        SELECT metric_id INTO v_cash_2y_growth_id FROM dim_metrics WHERE name = 'cash_2y_growth';
        
        SELECT metric_id INTO v_roa_2y_av_id FROM dim_metrics WHERE name = 'roa_2y_av';
        SELECT metric_id INTO v_roa_3y_av_id FROM dim_metrics WHERE name = 'roa_3y_av';
        SELECT metric_id INTO v_roa_4y_av_id FROM dim_metrics WHERE name = 'roa_4y_av';
        SELECT metric_id INTO v_roa_5y_av_id FROM dim_metrics WHERE name = 'roa_5y_av';
        
        SELECT metric_id INTO v_roe_2y_av_id FROM dim_metrics WHERE name = 'roe_2y_av';
        SELECT metric_id INTO v_roe_3y_av_id FROM dim_metrics WHERE name = 'roe_3y_av';
        SELECT metric_id INTO v_roe_4y_av_id FROM dim_metrics WHERE name = 'roe_4y_av';
        SELECT metric_id INTO v_roe_5y_av_id FROM dim_metrics WHERE name = 'roe_5y_av';
        
        -- Clear existing Priority 13 values
        DELETE FROM fact_metrics 
        WHERE metric_id IN (v_momentum_id, v_momentum_new_id, v_median_growth_id)
        AND report_id IN (SELECT report_id FROM fact_reports WHERE company_id = p_company_id);
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_13_for_company', 'INFO', 
                'Cleared existing Priority 13 values', 'CLEANUP');
        
        -- ===================================================================
        -- METRIC 1: MOMENTUM (9 trend comparisons)
        -- ===================================================================
        
        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
        SELECT 
            fr.report_id,
            v_momentum_id,
            (
                CASE WHEN roic_4y.value IS NOT NULL AND roic_3y.value IS NOT NULL THEN
                    CASE WHEN roic_3y.value > roic_4y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN roic_3y.value IS NOT NULL AND roic.value IS NOT NULL THEN
                    CASE WHEN roic.value > roic_3y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN eq_3y.value IS NOT NULL AND eq_2y.value IS NOT NULL THEN
                    CASE WHEN eq_2y.value > eq_3y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN eq_2y.value IS NOT NULL AND eq_1y.value IS NOT NULL THEN
                    CASE WHEN eq_1y.value > eq_2y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN eps_3y.value IS NOT NULL AND eps_2y.value IS NOT NULL THEN
                    CASE WHEN eps_2y.value > eps_3y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN eps_2y.value IS NOT NULL AND eps_1y.value IS NOT NULL THEN
                    CASE WHEN eps_1y.value > eps_2y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN rev_3y.value IS NOT NULL AND rev_2y.value IS NOT NULL THEN
                    CASE WHEN rev_2y.value > rev_3y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN rev_2y.value IS NOT NULL AND rev_1y.value IS NOT NULL THEN
                    CASE WHEN rev_1y.value > rev_2y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN cash_2y.value IS NOT NULL AND cash_1y.value IS NOT NULL THEN
                    CASE WHEN cash_1y.value > cash_2y.value THEN 1 ELSE -1 END ELSE 0 END
            ) AS momentum_score,
            'CALC_MOMENTUM',
            NOW(),
            'Momentum: 9 trend comparisons'
        FROM fact_reports fr
        LEFT JOIN fact_metrics coverage ON fr.report_id = coverage.report_id AND coverage.metric_id = v_coverage_id
        LEFT JOIN fact_metrics roic ON fr.report_id = roic.report_id AND roic.metric_id = v_roic_id
        LEFT JOIN fact_metrics roic_3y ON fr.report_id = roic_3y.report_id AND roic_3y.metric_id = v_roic_3y_av_id
        LEFT JOIN fact_metrics roic_4y ON fr.report_id = roic_4y.report_id AND roic_4y.metric_id = v_roic_4y_av_id
        LEFT JOIN fact_metrics eq_1y ON fr.report_id = eq_1y.report_id AND eq_1y.metric_id = v_equity_1y_growth_id
        LEFT JOIN fact_metrics eq_2y ON fr.report_id = eq_2y.report_id AND eq_2y.metric_id = v_equity_2y_growth_id
        LEFT JOIN fact_metrics eq_3y ON fr.report_id = eq_3y.report_id AND eq_3y.metric_id = v_equity_3y_growth_id
        LEFT JOIN fact_metrics eps_1y ON fr.report_id = eps_1y.report_id AND eps_1y.metric_id = v_eps_1y_growth_id
        LEFT JOIN fact_metrics eps_2y ON fr.report_id = eps_2y.report_id AND eps_2y.metric_id = v_eps_2y_growth_id
        LEFT JOIN fact_metrics eps_3y ON fr.report_id = eps_3y.report_id AND eps_3y.metric_id = v_eps_3y_growth_id
        LEFT JOIN fact_metrics rev_1y ON fr.report_id = rev_1y.report_id AND rev_1y.metric_id = v_revenue_1y_growth_id
        LEFT JOIN fact_metrics rev_2y ON fr.report_id = rev_2y.report_id AND rev_2y.metric_id = v_revenue_2y_growth_id
        LEFT JOIN fact_metrics rev_3y ON fr.report_id = rev_3y.report_id AND rev_3y.metric_id = v_revenue_3y_growth_id
        LEFT JOIN fact_metrics cash_1y ON fr.report_id = cash_1y.report_id AND cash_1y.metric_id = v_cash_1y_growth_id
        LEFT JOIN fact_metrics cash_2y ON fr.report_id = cash_2y.report_id AND cash_2y.metric_id = v_cash_2y_growth_id
        WHERE fr.company_id = p_company_id AND coverage.value >= 0.5;
        
        SET @inserted_count = ROW_COUNT();
        SET v_records_processed = v_records_processed + @inserted_count;
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_13_for_company', 'INFO', 
                CONCAT('Momentum: ', @inserted_count, ' records'), 'MOMENTUM_COMPLETE');
        
        -- ===================================================================
        -- METRIC 2: MOMENTUM_NEW (19 trend comparisons)
        -- ===================================================================
        
        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
        SELECT 
            fr.report_id,
            v_momentum_new_id,
            (
                CASE WHEN cash_2y.value IS NOT NULL AND cash_1y.value IS NOT NULL THEN
                    CASE WHEN cash_1y.value > cash_2y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN eps_4y.value IS NOT NULL AND eps_3y.value IS NOT NULL THEN
                    CASE WHEN eps_3y.value > eps_4y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN eps_3y.value IS NOT NULL AND eps_2y.value IS NOT NULL THEN
                    CASE WHEN eps_2y.value > eps_3y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN eps_2y.value IS NOT NULL AND eps_1y.value IS NOT NULL THEN
                    CASE WHEN eps_1y.value > eps_2y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN eq_4y.value IS NOT NULL AND eq_3y.value IS NOT NULL THEN
                    CASE WHEN eq_3y.value > eq_4y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN eq_3y.value IS NOT NULL AND eq_2y.value IS NOT NULL THEN
                    CASE WHEN eq_2y.value > eq_3y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN eq_2y.value IS NOT NULL AND eq_1y.value IS NOT NULL THEN
                    CASE WHEN eq_1y.value > eq_2y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN rev_4y.value IS NOT NULL AND rev_3y.value IS NOT NULL THEN
                    CASE WHEN rev_3y.value > rev_4y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN rev_3y.value IS NOT NULL AND rev_2y.value IS NOT NULL THEN
                    CASE WHEN rev_2y.value > rev_3y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN rev_2y.value IS NOT NULL AND rev_1y.value IS NOT NULL THEN
                    CASE WHEN rev_1y.value > rev_2y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN roa_5y.value IS NOT NULL AND roa_4y.value IS NOT NULL THEN
                    CASE WHEN roa_4y.value > roa_5y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN roa_4y.value IS NOT NULL AND roa_3y.value IS NOT NULL THEN
                    CASE WHEN roa_3y.value > roa_4y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN roa_3y.value IS NOT NULL AND roa_2y.value IS NOT NULL THEN
                    CASE WHEN roa_2y.value > roa_3y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN roe_5y.value IS NOT NULL AND roe_4y.value IS NOT NULL THEN
                    CASE WHEN roe_4y.value > roe_5y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN roe_4y.value IS NOT NULL AND roe_3y.value IS NOT NULL THEN
                    CASE WHEN roe_3y.value > roe_4y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN roe_3y.value IS NOT NULL AND roe_2y.value IS NOT NULL THEN
                    CASE WHEN roe_2y.value > roe_3y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN roic_5y.value IS NOT NULL AND roic_4y.value IS NOT NULL THEN
                    CASE WHEN roic_4y.value > roic_5y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN roic_4y.value IS NOT NULL AND roic_3y.value IS NOT NULL THEN
                    CASE WHEN roic_3y.value > roic_4y.value THEN 1 ELSE -1 END ELSE 0 END +
                CASE WHEN roic_3y.value IS NOT NULL AND roic_2y.value IS NOT NULL THEN
                    CASE WHEN roic_2y.value > roic_3y.value THEN 1 ELSE -1 END ELSE 0 END
            ) AS momentum_new_score,
            'CALC_MOMENTUM_NEW',
            NOW(),
            'Momentum New: 19 trend comparisons'
        FROM fact_reports fr
        LEFT JOIN fact_metrics coverage_new ON fr.report_id = coverage_new.report_id AND coverage_new.metric_id = v_coverage_new_id
        LEFT JOIN fact_metrics cash_1y ON fr.report_id = cash_1y.report_id AND cash_1y.metric_id = v_cash_1y_growth_id
        LEFT JOIN fact_metrics cash_2y ON fr.report_id = cash_2y.report_id AND cash_2y.metric_id = v_cash_2y_growth_id
        LEFT JOIN fact_metrics eps_1y ON fr.report_id = eps_1y.report_id AND eps_1y.metric_id = v_eps_1y_growth_id
        LEFT JOIN fact_metrics eps_2y ON fr.report_id = eps_2y.report_id AND eps_2y.metric_id = v_eps_2y_growth_id
        LEFT JOIN fact_metrics eps_3y ON fr.report_id = eps_3y.report_id AND eps_3y.metric_id = v_eps_3y_growth_id
        LEFT JOIN fact_metrics eps_4y ON fr.report_id = eps_4y.report_id AND eps_4y.metric_id = v_eps_4y_growth_id
        LEFT JOIN fact_metrics eq_1y ON fr.report_id = eq_1y.report_id AND eq_1y.metric_id = v_equity_1y_growth_id
        LEFT JOIN fact_metrics eq_2y ON fr.report_id = eq_2y.report_id AND eq_2y.metric_id = v_equity_2y_growth_id
        LEFT JOIN fact_metrics eq_3y ON fr.report_id = eq_3y.report_id AND eq_3y.metric_id = v_equity_3y_growth_id
        LEFT JOIN fact_metrics eq_4y ON fr.report_id = eq_4y.report_id AND eq_4y.metric_id = v_equity_4y_growth_id
        LEFT JOIN fact_metrics rev_1y ON fr.report_id = rev_1y.report_id AND rev_1y.metric_id = v_revenue_1y_growth_id
        LEFT JOIN fact_metrics rev_2y ON fr.report_id = rev_2y.report_id AND rev_2y.metric_id = v_revenue_2y_growth_id
        LEFT JOIN fact_metrics rev_3y ON fr.report_id = rev_3y.report_id AND rev_3y.metric_id = v_revenue_3y_growth_id
        LEFT JOIN fact_metrics rev_4y ON fr.report_id = rev_4y.report_id AND rev_4y.metric_id = v_revenue_4y_growth_id
        LEFT JOIN fact_metrics roa_2y ON fr.report_id = roa_2y.report_id AND roa_2y.metric_id = v_roa_2y_av_id
        LEFT JOIN fact_metrics roa_3y ON fr.report_id = roa_3y.report_id AND roa_3y.metric_id = v_roa_3y_av_id
        LEFT JOIN fact_metrics roa_4y ON fr.report_id = roa_4y.report_id AND roa_4y.metric_id = v_roa_4y_av_id
        LEFT JOIN fact_metrics roa_5y ON fr.report_id = roa_5y.report_id AND roa_5y.metric_id = v_roa_5y_av_id
        LEFT JOIN fact_metrics roe_2y ON fr.report_id = roe_2y.report_id AND roe_2y.metric_id = v_roe_2y_av_id
        LEFT JOIN fact_metrics roe_3y ON fr.report_id = roe_3y.report_id AND roe_3y.metric_id = v_roe_3y_av_id
        LEFT JOIN fact_metrics roe_4y ON fr.report_id = roe_4y.report_id AND roe_4y.metric_id = v_roe_4y_av_id
        LEFT JOIN fact_metrics roe_5y ON fr.report_id = roe_5y.report_id AND roe_5y.metric_id = v_roe_5y_av_id
        LEFT JOIN fact_metrics roic_2y ON fr.report_id = roic_2y.report_id AND roic_2y.metric_id = (SELECT metric_id FROM dim_metrics WHERE name = 'roic_2y_av')
        LEFT JOIN fact_metrics roic_3y ON fr.report_id = roic_3y.report_id AND roic_3y.metric_id = v_roic_3y_av_id
        LEFT JOIN fact_metrics roic_4y ON fr.report_id = roic_4y.report_id AND roic_4y.metric_id = v_roic_4y_av_id
        LEFT JOIN fact_metrics roic_5y ON fr.report_id = roic_5y.report_id AND roic_5y.metric_id = v_roic_5y_av_id
        WHERE fr.company_id = p_company_id AND coverage_new.value >= 0.5;
        
        SET @inserted_count = ROW_COUNT();
        SET v_records_processed = v_records_processed + @inserted_count;
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_13_for_company', 'INFO', 
                CONCAT('Momentum New: ', @inserted_count, ' records'), 'MOMENTUM_NEW_COMPLETE');
        
        -- ===================================================================
        -- METRIC 3: MEDIAN_GROWTH
        -- ===================================================================
        
        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
        SELECT 
            fr.report_id,
            v_median_growth_id,
            0.75 * (
                (
                    CASE 
                        WHEN eps_1y.value IS NULL AND eps_2y.value IS NULL AND eps_3y.value IS NULL THEN NULL
                        WHEN eps_1y.value IS NULL AND eps_2y.value IS NULL THEN eps_3y.value
                        WHEN eps_1y.value IS NULL AND eps_3y.value IS NULL THEN eps_2y.value
                        WHEN eps_2y.value IS NULL AND eps_3y.value IS NULL THEN eps_1y.value
                        WHEN eps_1y.value IS NULL THEN (eps_2y.value + eps_3y.value) / 2
                        WHEN eps_2y.value IS NULL THEN (eps_1y.value + eps_3y.value) / 2
                        WHEN eps_3y.value IS NULL THEN (eps_1y.value + eps_2y.value) / 2
                        WHEN eps_1y.value <= eps_2y.value AND eps_2y.value <= eps_3y.value THEN eps_2y.value
                        WHEN eps_1y.value <= eps_3y.value AND eps_3y.value <= eps_2y.value THEN eps_3y.value
                        WHEN eps_2y.value <= eps_1y.value AND eps_1y.value <= eps_3y.value THEN eps_1y.value
                        WHEN eps_2y.value <= eps_3y.value AND eps_3y.value <= eps_1y.value THEN eps_3y.value
                        WHEN eps_3y.value <= eps_1y.value AND eps_1y.value <= eps_2y.value THEN eps_1y.value
                        ELSE eps_2y.value
                    END +
                    CASE 
                        WHEN rev_1y.value IS NULL AND rev_2y.value IS NULL AND rev_3y.value IS NULL THEN NULL
                        WHEN rev_1y.value IS NULL AND rev_2y.value IS NULL THEN rev_3y.value
                        WHEN rev_1y.value IS NULL AND rev_3y.value IS NULL THEN rev_2y.value
                        WHEN rev_2y.value IS NULL AND rev_3y.value IS NULL THEN rev_1y.value
                        WHEN rev_1y.value IS NULL THEN (rev_2y.value + rev_3y.value) / 2
                        WHEN rev_2y.value IS NULL THEN (rev_1y.value + rev_3y.value) / 2
                        WHEN rev_3y.value IS NULL THEN (rev_1y.value + rev_2y.value) / 2
                        WHEN rev_1y.value <= rev_2y.value AND rev_2y.value <= rev_3y.value THEN rev_2y.value
                        WHEN rev_1y.value <= rev_3y.value AND rev_3y.value <= rev_2y.value THEN rev_3y.value
                        WHEN rev_2y.value <= rev_1y.value AND rev_1y.value <= rev_3y.value THEN rev_1y.value
                        WHEN rev_2y.value <= rev_3y.value AND rev_3y.value <= rev_1y.value THEN rev_3y.value
                        WHEN rev_3y.value <= rev_1y.value AND rev_1y.value <= rev_2y.value THEN rev_1y.value
                        ELSE rev_2y.value
                    END
                ) / 2
            ) AS median_growth_score,
            'CALC_MEDIAN_GROWTH',
            NOW(),
            'Median Growth: 0.75 * MEDIAN(EPS, Revenue)'
        FROM fact_reports fr
        LEFT JOIN fact_metrics coverage ON fr.report_id = coverage.report_id AND coverage.metric_id = v_coverage_id
        LEFT JOIN fact_metrics eps_1y ON fr.report_id = eps_1y.report_id AND eps_1y.metric_id = v_eps_1y_growth_id
        LEFT JOIN fact_metrics eps_2y ON fr.report_id = eps_2y.report_id AND eps_2y.metric_id = v_eps_2y_growth_id
        LEFT JOIN fact_metrics eps_3y ON fr.report_id = eps_3y.report_id AND eps_3y.metric_id = v_eps_3y_growth_id
        LEFT JOIN fact_metrics rev_1y ON fr.report_id = rev_1y.report_id AND rev_1y.metric_id = v_revenue_1y_growth_id
        LEFT JOIN fact_metrics rev_2y ON fr.report_id = rev_2y.report_id AND rev_2y.metric_id = v_revenue_2y_growth_id
        LEFT JOIN fact_metrics rev_3y ON fr.report_id = rev_3y.report_id AND rev_3y.metric_id = v_revenue_3y_growth_id
        WHERE fr.company_id = p_company_id
          AND coverage.value >= 0.5
          AND (eps_1y.value IS NOT NULL OR eps_2y.value IS NOT NULL OR eps_3y.value IS NOT NULL)
          AND (rev_1y.value IS NOT NULL OR rev_2y.value IS NOT NULL OR rev_3y.value IS NOT NULL);
        
        SET @inserted_count = ROW_COUNT();
        SET v_records_processed = v_records_processed + @inserted_count;
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_13_for_company', 'INFO', 
                CONCAT('Median Growth: ', @inserted_count, ' records'), 'MEDIAN_GROWTH_COMPLETE');
        
        -- ===================================================================
        -- COMPLETION
        -- ===================================================================
        
        SET @execution_time = TIMESTAMPDIFF(SECOND, v_start_time, NOW());
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_13_for_company', 'SUCCESS', 
                CONCAT('Priority 13 completed: ', v_records_processed, ' total records in ', @execution_time, ' seconds'), 'COMPLETION');
        
    END main_block;
    
    -- Restore settings and commit
    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    COMMIT;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_14_for_company`(
    IN p_company_id INT
)
BEGIN

    DECLARE done INT DEFAULT FALSE;
    DECLARE v_records_processed INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);
    DECLARE v_error_count INT DEFAULT 0;

    
    DECLARE v_est_growth_rate_id INT DEFAULT NULL;

    
    DECLARE v_dividend_yield_id INT DEFAULT NULL;
    DECLARE v_price_earnings_id INT DEFAULT NULL;
    DECLARE v_coverage_id INT DEFAULT NULL;
    DECLARE v_median_growth_id INT DEFAULT NULL;
    DECLARE v_industry_growth_id INT DEFAULT NULL;


    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;
        SET v_error_count = v_error_count + 1;
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_14_for_company', 'ERROR',
                CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        ROLLBACK;
        SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    END;


    SET v_session_id = CONCAT('P14_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;


    SET @company_ticker = '';
    SELECT ticker INTO @company_ticker FROM dim_companies WHERE company_id = p_company_id LIMIT 1;


    START TRANSACTION;


    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_14_for_company', 'INFO',
            'Starting Priority 14 calculations', 'START');


    
    SELECT metric_id INTO v_est_growth_rate_id FROM dim_metrics
    WHERE CAST(name AS BINARY) = CAST('est_growth_rate' AS BINARY);

    
    SELECT metric_id INTO v_dividend_yield_id FROM dim_metrics
    WHERE CAST(name AS BINARY) = CAST('dividend_yield' AS BINARY);

    SELECT metric_id INTO v_price_earnings_id FROM dim_metrics
    WHERE CAST(name AS BINARY) = CAST('price_earnings' AS BINARY);

    SELECT metric_id INTO v_coverage_id FROM dim_metrics
    WHERE CAST(name AS BINARY) = CAST('coverage' AS BINARY);

    SELECT metric_id INTO v_median_growth_id FROM dim_metrics
    WHERE CAST(name AS BINARY) = CAST('median_growth' AS BINARY);

    SELECT metric_id INTO v_industry_growth_id FROM dim_metrics
    WHERE CAST(name AS BINARY) = CAST('industry_growth' AS BINARY);


    
    IF v_est_growth_rate_id IS NULL THEN
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_14_for_company', 'ERROR',
                'Missing est_growth_rate metric definition in dim_metrics', 'VALIDATION');
        ROLLBACK;
        SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
        RESIGNAL;
    END IF;


    IF v_dividend_yield_id IS NULL OR v_price_earnings_id IS NULL OR v_coverage_id IS NULL THEN
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_14_for_company', 'ERROR',
                'Missing required dependency metrics (dividend_yield, price_earnings, coverage)', 'VALIDATION');
        ROLLBACK;
        SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
        RESIGNAL;
    END IF;


    
    DELETE FROM fact_metrics
    WHERE metric_id = v_est_growth_rate_id
      AND report_id IN (
          SELECT report_id FROM fact_reports
          WHERE company_id = p_company_id
      );

    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_14_for_company', 'INFO',
            CONCAT('Deleted existing Priority 14 metrics for company_id: ', p_company_id), 'CLEANUP');

    
    
    


    
    INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date)
    SELECT
        fr.report_id,
        v_est_growth_rate_id,
        CASE
            
            WHEN pe.value IS NULL THEN NULL
            
            WHEN cov.value < 0.5 THEN 0.05
            
            ELSE
                CASE
                    WHEN ig.value IS NULL AND mg.value IS NULL THEN NULL
                    WHEN mg.value IS NULL THEN
                        CASE WHEN ig.value >= 0.4 THEN 0.4 ELSE ig.value END
                    WHEN ig.value IS NULL THEN
                        CASE WHEN mg.value >= 0.4 THEN 0.4 ELSE mg.value END
                    ELSE
                        CASE
                            WHEN (ig.value + mg.value) / 2 >= 0.4 THEN 0.4
                            ELSE (ig.value + mg.value) / 2
                        END
                END
        END AS calculated_growth,
        'CALC_EST_GROWTH',
        NOW()
    FROM fact_reports fr
    INNER JOIN fact_metrics pe ON (
        pe.report_id = fr.report_id
        AND pe.metric_id = v_price_earnings_id
        AND pe.value IS NOT NULL
    )
    INNER JOIN fact_metrics cov ON (
        cov.report_id = fr.report_id
        AND cov.metric_id = v_coverage_id
        AND cov.value IS NOT NULL
    )
    LEFT JOIN fact_metrics ig ON (
        ig.report_id = fr.report_id
        AND ig.metric_id = v_industry_growth_id
    )
    LEFT JOIN fact_metrics mg ON (
        mg.report_id = fr.report_id
        AND mg.metric_id = v_median_growth_id
    )
    WHERE fr.company_id = p_company_id
      AND (
          cov.value < 0.5
          OR
          (cov.value >= 0.5 AND (ig.value IS NOT NULL OR mg.value IS NOT NULL))
      );

    SET v_records_processed = v_records_processed + ROW_COUNT();

    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_14_for_company', 'INFO',
            CONCAT('Calculated est_growth_rate for ', ROW_COUNT(), ' reports'), 'EST_GROWTH_RATE');


    COMMIT;

    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_14_for_company', 'SUCCESS',
            CONCAT('Priority 14 calculations completed. Total records: ', v_records_processed,
                   '. Execution time: ', TIMESTAMPDIFF(SECOND, v_start_time, NOW()), ' seconds'),
            v_records_processed, 'COMPLETION');


    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_15_for_company`(
    IN p_company_id INT
)
BEGIN
    -- Variable declarations
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_records_processed INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);
    DECLARE v_error_count INT DEFAULT 0;
    
    -- Metric IDs for Priority 15 metrics
    DECLARE v_gd_over_pe_id INT DEFAULT NULL;
    DECLARE v_est_future_pe_id INT DEFAULT NULL;
    
    -- Dependency metric IDs
    DECLARE v_coverage_id INT DEFAULT NULL;
    DECLARE v_price_earnings_id INT DEFAULT NULL;
    DECLARE v_share_price_id INT DEFAULT NULL;
    DECLARE v_median_growth_id INT DEFAULT NULL;
    DECLARE v_est_growth_rate_id INT DEFAULT NULL;
    
    -- Handler declarations MUST come after all other declarations
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;
        SET v_error_count = v_error_count + 1;
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_15_for_company', 'ERROR', 
                CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        ROLLBACK;
        SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    END;
    
    -- Initialize session and safe mode
    SET v_session_id = CONCAT('P15_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;
    
    -- Get company ticker for logging
    SET @company_ticker = '';
    SELECT ticker INTO @company_ticker FROM dim_companies WHERE company_id = p_company_id LIMIT 1;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Log procedure start
    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_15_for_company', 'INFO', 
            'Starting Priority 15 calculations', 'START');
    
    -- ========================================================
    -- STEP 1: GET METRIC IDS AND VALIDATE DEPENDENCIES
    -- ========================================================
    
    -- Get Priority 15 metric IDs
    SELECT metric_id INTO v_gd_over_pe_id FROM dim_metrics 
    WHERE CAST(name AS BINARY) = CAST('gd_over_pe' AS BINARY);
    
    SELECT metric_id INTO v_est_future_pe_id FROM dim_metrics 
    WHERE CAST(name AS BINARY) = CAST('est_future_pe' AS BINARY);
    
    -- Get dependency metric IDs
    SELECT metric_id INTO v_coverage_id FROM dim_metrics 
    WHERE CAST(name AS BINARY) = CAST('coverage' AS BINARY);
    
    SELECT metric_id INTO v_price_earnings_id FROM dim_metrics 
    WHERE CAST(name AS BINARY) = CAST('price_earnings' AS BINARY);
    
    SELECT metric_id INTO v_share_price_id FROM dim_metrics 
    WHERE CAST(name AS BINARY) = CAST('share_price' AS BINARY);
    
    SELECT metric_id INTO v_median_growth_id FROM dim_metrics 
    WHERE CAST(name AS BINARY) = CAST('median_growth' AS BINARY);
    
    SELECT metric_id INTO v_est_growth_rate_id FROM dim_metrics 
    WHERE CAST(name AS BINARY) = CAST('est_growth_rate' AS BINARY);
    
    -- Validate that all required Priority 15 metrics exist
    IF v_gd_over_pe_id IS NULL OR v_est_future_pe_id IS NULL THEN
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_15_for_company', 'ERROR', 
                'Missing Priority 15 metric definitions in dim_metrics', 'VALIDATION');
        ROLLBACK;
        SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
        RESIGNAL;
    END IF;
    
    -- Validate critical dependency metrics exist
    IF v_price_earnings_id IS NULL OR v_est_growth_rate_id IS NULL THEN
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_15_for_company', 'ERROR', 
                'Missing critical dependency metrics (price_earnings, est_growth_rate)', 'VALIDATION');
        ROLLBACK;
        SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
        RESIGNAL;
    END IF;
    
    -- ========================================================
    -- STEP 2: DELETE EXISTING PRIORITY 15 DATA FOR THIS COMPANY
    -- ========================================================
    
    DELETE FROM fact_metrics 
    WHERE metric_id IN (v_gd_over_pe_id, v_est_future_pe_id)
      AND report_id IN (
          SELECT report_id FROM fact_reports 
          WHERE company_id = p_company_id
      );
    
    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_15_for_company', 'INFO', 
            CONCAT('Deleted existing Priority 15 metrics for company_id: ', p_company_id, ' (', ROW_COUNT(), ' records)'), 'CLEANUP');
    
    -- ========================================================
    -- STEP 3: CALCULATE gd_over_pe (Growth/Dollar over P/E)
    -- ========================================================
    -- Formula: (est_growth_rate * 100) / price_earnings
    -- Gate conditions: coverage >= 0.5 AND price_earnings > 0 
    --                 AND share_price IS NOT NULL AND median_growth IS NOT NULL 
    --                 AND est_growth_rate IS NOT NULL
    
    INSERT INTO fact_metrics (
        report_id, 
        metric_id, 
        value, 
        source_flag, 
        calculation_date
    )
    SELECT 
        fr.report_id,
        v_gd_over_pe_id,
        -- Calculate: (est_growth_rate * 100) / price_earnings
        ROUND((egr.value * 100) / pe.value, 6) as gd_over_pe,
        'CALC_GD_OVER_PE',
        NOW()
    FROM fact_reports fr
    -- ALL required components must be present (INNER JOINs)
    INNER JOIN fact_metrics cov ON (
        cov.report_id = fr.report_id 
        AND cov.metric_id = v_coverage_id
        AND cov.value >= 0.5  -- Gate: coverage must be >= 50%
    )
    INNER JOIN fact_metrics pe ON (
        pe.report_id = fr.report_id 
        AND pe.metric_id = v_price_earnings_id
        AND pe.value > 0  -- Gate: price_earnings must be positive (division protection)
    )
    INNER JOIN fact_metrics sp ON (
        sp.report_id = fr.report_id 
        AND sp.metric_id = v_share_price_id
        AND sp.value IS NOT NULL  -- Gate: share_price must exist
    )
    INNER JOIN fact_metrics mg ON (
        mg.report_id = fr.report_id 
        AND mg.metric_id = v_median_growth_id
        AND mg.value IS NOT NULL  -- Gate: median_growth must exist
    )
    INNER JOIN fact_metrics egr ON (
        egr.report_id = fr.report_id 
        AND egr.metric_id = v_est_growth_rate_id
        AND egr.value IS NOT NULL  -- Gate: est_growth_rate must exist
    )
    WHERE fr.company_id = p_company_id;
    
    SET v_records_processed = v_records_processed + ROW_COUNT();
    
    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_15_for_company', 'INFO', 
            CONCAT('Calculated gd_over_pe for ', ROW_COUNT(), ' reports (high-quality data only)'), ROW_COUNT(), 'GD_OVER_PE');
    
    -- ========================================================
    -- STEP 4: CALCULATE est_future_pe (Estimated Future P/E)
    -- ========================================================
    -- Logic: 
    -- - IF est_growth_rate IS NULL THEN NULL (skip calculation)
    -- - IF est_growth_rate > 0 THEN:
    --   - IF price_earnings < (200 * est_growth_rate) THEN price_earnings
    --   - ELSE 200 * est_growth_rate (growth-based capping)
    -- - ELSE price_earnings (for zero/negative growth)
    
    INSERT INTO fact_metrics (
        report_id, 
        metric_id, 
        value, 
        source_flag, 
        calculation_date
    )
    SELECT 
        fr.report_id,
        v_est_future_pe_id,
        -- Calculate est_future_pe with growth-based capping logic
        CASE 
            WHEN egr.value > 0 THEN
                CASE 
                    WHEN pe.value < (200 * egr.value) THEN pe.value
                    ELSE ROUND(200 * egr.value, 4)
                END
            ELSE pe.value  -- For zero/negative growth, use current P/E
        END as est_future_pe,
        'CALC_EST_FUTURE_PE',
        NOW()
    FROM fact_reports fr
    -- Required components: est_growth_rate and price_earnings
    INNER JOIN fact_metrics egr ON (
        egr.report_id = fr.report_id 
        AND egr.metric_id = v_est_growth_rate_id
        AND egr.value IS NOT NULL  -- Gate: est_growth_rate must exist
    )
    INNER JOIN fact_metrics pe ON (
        pe.report_id = fr.report_id 
        AND pe.metric_id = v_price_earnings_id
        AND pe.value IS NOT NULL  -- price_earnings must exist
    )
    WHERE fr.company_id = p_company_id;
    
    SET v_records_processed = v_records_processed + ROW_COUNT();
    
    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_15_for_company', 'INFO', 
            CONCAT('Calculated est_future_pe for ', ROW_COUNT(), ' reports (with conservative capping logic)'), ROW_COUNT(), 'EST_FUTURE_PE');
    
    -- ========================================================
    -- STEP 5: COMPLETION AND SUMMARY
    -- ========================================================
    
    COMMIT;
    
    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_15_for_company', 'SUCCESS', 
            CONCAT('Priority 15 calculations completed. Total records: ', v_records_processed, 
                   '. Execution time: ', TIMESTAMPDIFF(SECOND, v_start_time, NOW()), ' seconds'), 
            v_records_processed, 'COMPLETION');
    
    -- Restore safe mode
    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_16_for_company`(
    IN p_company_id INT
)
BEGIN

    DECLARE v_records_processed INT DEFAULT 0;
    DECLARE v_total_metrics INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);

    
    DECLARE v_1y_price_vs_earnings_id INT;
    DECLARE v_2y_price_vs_earnings_id INT;
    DECLARE v_3y_price_vs_earnings_id INT;
    DECLARE v_return_1y_id INT;
    DECLARE v_return_2y_id INT;
    DECLARE v_return_6m_id INT;
    DECLARE v_shares_vs_2y_ago_id INT;
    DECLARE v_shares_vs_ly_id INT;


    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;

        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_16_for_company', 'ERROR',
                CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        ROLLBACK;

        SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    END;


    SELECT ticker INTO @company_ticker
    FROM dim_companies
    WHERE company_id = p_company_id;


    SET v_session_id = CONCAT('P16_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;


    START TRANSACTION;

    main_block: BEGIN

        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_16_for_company', 'INFO',
                CONCAT('Starting Priority 16 calculations for company_id: ', p_company_id), 'START');


        IF @company_ticker IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, 'UNKNOWN', 'calculate_priority_16_for_company', 'ERROR',
                    CONCAT('Company_id ', p_company_id, ' not found in dim_companies'), 'VALIDATION');
            LEAVE main_block;
        END IF;


        SELECT COUNT(*) INTO v_total_metrics
        FROM dim_metrics
        WHERE calculation_priority = 16
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY);


        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_16_for_company', 'INFO',
                CONCAT('Found ', v_total_metrics, ' Priority 16 metrics to calculate'), 'METRICS_IDENTIFIED');


        
        SELECT metric_id INTO v_1y_price_vs_earnings_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('1y_price_vs_earnings' AS BINARY);
        SELECT metric_id INTO v_2y_price_vs_earnings_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('2y_price_vs_earnings' AS BINARY);
        SELECT metric_id INTO v_3y_price_vs_earnings_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('3y_price_vs_earnings' AS BINARY);
        SELECT metric_id INTO v_return_1y_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('return_1y' AS BINARY);
        SELECT metric_id INTO v_return_2y_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('return_2y' AS BINARY);
        SELECT metric_id INTO v_return_6m_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('return_6m' AS BINARY);
        SELECT metric_id INTO v_shares_vs_2y_ago_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('shares_vs_2y_ago' AS BINARY);
        SELECT metric_id INTO v_shares_vs_ly_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('shares_vs_ly' AS BINARY);


        IF v_1y_price_vs_earnings_id IS NULL OR v_2y_price_vs_earnings_id IS NULL OR v_3y_price_vs_earnings_id IS NULL OR
           v_return_1y_id IS NULL OR v_return_2y_id IS NULL OR v_return_6m_id IS NULL OR
           v_shares_vs_2y_ago_id IS NULL OR v_shares_vs_ly_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_16_for_company', 'ERROR',
                    'Missing Priority 16 metric definitions in dim_metrics', 'VALIDATION');
            ROLLBACK;
            SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
            LEAVE main_block;
        END IF;


        
        DELETE FROM fact_metrics
        WHERE metric_id IN (v_1y_price_vs_earnings_id, v_2y_price_vs_earnings_id, v_3y_price_vs_earnings_id,
                           v_return_1y_id, v_return_2y_id, v_return_6m_id,
                           v_shares_vs_2y_ago_id, v_shares_vs_ly_id)
          AND report_id IN (
              SELECT report_id FROM fact_reports
              WHERE company_id = p_company_id
          );

        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_16_for_company', 'INFO',
                CONCAT('Deleted existing Priority 16 metrics for company_id: ', p_company_id), 'CLEANUP');


        
        
        
        
        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
        SELECT
            fr.report_id,
            v_1y_price_vs_earnings_id,
            (current_price.value / historical_price.value - 1) - eps_growth.value,
            'CALC_LYNCH_1Y',
            NOW(),
            CONCAT('Price 1Y: ', ROUND((current_price.value / historical_price.value - 1) * 100, 2),
                   '%, EPS 1Y: ', ROUND(eps_growth.value * 100, 2), '%')
        FROM fact_reports fr
        INNER JOIN fact_metrics current_price ON fr.report_id = current_price.report_id
            AND current_price.metric_id = (SELECT metric_id FROM dim_metrics
                                           WHERE CAST(name AS BINARY) = CAST('share_price' AS BINARY))
        
        INNER JOIN fact_reports fr_hist_1y ON (
            fr_hist_1y.company_id = fr.company_id
            AND CAST(fr_hist_1y.report_type AS BINARY) = CAST(fr.report_type AS BINARY)
            AND fr_hist_1y.financial_year = (fr.financial_year - 1)
            AND fr_hist_1y.report_date = (
                SELECT MAX(fh.report_date) FROM fact_reports fh
                WHERE fh.company_id = fr.company_id
                  AND CAST(fh.report_type AS BINARY) = CAST(fr.report_type AS BINARY)
                  AND fh.financial_year = (fr.financial_year - 1)
            )
        )
        INNER JOIN fact_metrics historical_price ON (
            historical_price.report_id = fr_hist_1y.report_id
            AND historical_price.metric_id = (SELECT metric_id FROM dim_metrics
                                              WHERE CAST(name AS BINARY) = CAST('share_price' AS BINARY))
        )
        INNER JOIN fact_metrics eps_growth ON fr.report_id = eps_growth.report_id
            AND eps_growth.metric_id = (SELECT metric_id FROM dim_metrics
                                        WHERE CAST(name AS BINARY) = CAST('eps_1y_growth' AS BINARY))
        WHERE fr.company_id = p_company_id
          AND current_price.value > 0
          AND historical_price.value > 0
          AND eps_growth.value IS NOT NULL;

        SET @inserted_count = ROW_COUNT();
        SET v_records_processed = v_records_processed + @inserted_count;

        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_16_for_company', 'INFO',
                CONCAT('Completed 1y_price_vs_earnings - inserted ', @inserted_count, ' values'), '1y_price_vs_earnings', @inserted_count, 'METRIC_COMPLETE');


        
        
        
        
        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
        SELECT
            fr.report_id,
            v_2y_price_vs_earnings_id,
            POWER(current_price.value / historical_price.value, 0.5) - 1 - eps_growth.value,
            'CALC_LYNCH_2Y',
            NOW(),
            CONCAT('Price 2Y CAGR: ', ROUND((POWER(current_price.value / historical_price.value, 0.5) - 1) * 100, 2),
                   '%, EPS 2Y CAGR: ', ROUND(eps_growth.value * 100, 2), '%')
        FROM fact_reports fr
        INNER JOIN fact_metrics current_price ON fr.report_id = current_price.report_id
            AND current_price.metric_id = (SELECT metric_id FROM dim_metrics
                                           WHERE CAST(name AS BINARY) = CAST('share_price' AS BINARY))
        
        INNER JOIN fact_reports fr_hist_2y ON (
            fr_hist_2y.company_id = fr.company_id
            AND CAST(fr_hist_2y.report_type AS BINARY) = CAST(fr.report_type AS BINARY)
            AND fr_hist_2y.financial_year = (fr.financial_year - 2)
            AND fr_hist_2y.report_date = (
                SELECT MAX(fh.report_date) FROM fact_reports fh
                WHERE fh.company_id = fr.company_id
                  AND CAST(fh.report_type AS BINARY) = CAST(fr.report_type AS BINARY)
                  AND fh.financial_year = (fr.financial_year - 2)
            )
        )
        INNER JOIN fact_metrics historical_price ON (
            historical_price.report_id = fr_hist_2y.report_id
            AND historical_price.metric_id = (SELECT metric_id FROM dim_metrics
                                              WHERE CAST(name AS BINARY) = CAST('share_price' AS BINARY))
        )
        INNER JOIN fact_metrics eps_growth ON fr.report_id = eps_growth.report_id
            AND eps_growth.metric_id = (SELECT metric_id FROM dim_metrics
                                        WHERE CAST(name AS BINARY) = CAST('eps_2y_growth' AS BINARY))
        WHERE fr.company_id = p_company_id
          AND current_price.value > 0
          AND historical_price.value > 0
          AND eps_growth.value IS NOT NULL;

        SET @inserted_count = ROW_COUNT();
        SET v_records_processed = v_records_processed + @inserted_count;

        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_16_for_company', 'INFO',
                CONCAT('Completed 2y_price_vs_earnings - inserted ', @inserted_count, ' values'), '2y_price_vs_earnings', @inserted_count, 'METRIC_COMPLETE');


        
        
        
        
        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
        SELECT
            fr.report_id,
            v_3y_price_vs_earnings_id,
            POWER(current_price.value / historical_price.value, 1.0/3.0) - 1 - eps_growth.value,
            'CALC_LYNCH_3Y',
            NOW(),
            CONCAT('Price 3Y CAGR: ', ROUND((POWER(current_price.value / historical_price.value, 1.0/3.0) - 1) * 100, 2),
                   '%, EPS 3Y CAGR: ', ROUND(eps_growth.value * 100, 2), '%')
        FROM fact_reports fr
        INNER JOIN fact_metrics current_price ON fr.report_id = current_price.report_id
            AND current_price.metric_id = (SELECT metric_id FROM dim_metrics
                                           WHERE CAST(name AS BINARY) = CAST('share_price' AS BINARY))
        
        INNER JOIN fact_reports fr_hist_3y ON (
            fr_hist_3y.company_id = fr.company_id
            AND CAST(fr_hist_3y.report_type AS BINARY) = CAST(fr.report_type AS BINARY)
            AND fr_hist_3y.financial_year = (fr.financial_year - 3)
            AND fr_hist_3y.report_date = (
                SELECT MAX(fh.report_date) FROM fact_reports fh
                WHERE fh.company_id = fr.company_id
                  AND CAST(fh.report_type AS BINARY) = CAST(fr.report_type AS BINARY)
                  AND fh.financial_year = (fr.financial_year - 3)
            )
        )
        INNER JOIN fact_metrics historical_price ON (
            historical_price.report_id = fr_hist_3y.report_id
            AND historical_price.metric_id = (SELECT metric_id FROM dim_metrics
                                              WHERE CAST(name AS BINARY) = CAST('share_price' AS BINARY))
        )
        INNER JOIN fact_metrics eps_growth ON fr.report_id = eps_growth.report_id
            AND eps_growth.metric_id = (SELECT metric_id FROM dim_metrics
                                        WHERE CAST(name AS BINARY) = CAST('eps_3y_growth' AS BINARY))
        WHERE fr.company_id = p_company_id
          AND current_price.value > 0
          AND historical_price.value > 0
          AND eps_growth.value IS NOT NULL;

        SET @inserted_count = ROW_COUNT();
        SET v_records_processed = v_records_processed + @inserted_count;

        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_16_for_company', 'INFO',
                CONCAT('Completed 3y_price_vs_earnings - inserted ', @inserted_count, ' values'), '3y_price_vs_earnings', @inserted_count, 'METRIC_COMPLETE');


        
        
        
        
        
        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
        SELECT
            fr.report_id,
            v_return_6m_id,
            (future_price.value / current_price.value - 1) + COALESCE(dividend_yield.value / 2, 0),
            'CALC_RET_6M_PLUS',
            NOW(),
            CONCAT('Price Return: ', ROUND((future_price.value / current_price.value - 1) * 100, 2),
                   '%, Dividend Yield (6m): ', ROUND(COALESCE(dividend_yield.value, 0) * 100, 2), '%')
        FROM fact_reports fr
        INNER JOIN fact_metrics current_price ON fr.report_id = current_price.report_id
            AND current_price.metric_id = (SELECT metric_id FROM dim_metrics
                                           WHERE CAST(name AS BINARY) = CAST('share_price' AS BINARY))
        
        
        
        INNER JOIN fact_reports fr_future_6m ON (
            fr_future_6m.company_id = fr.company_id
            AND CAST(fr_future_6m.report_type AS BINARY) != CAST(fr.report_type AS BINARY)
            AND fr_future_6m.report_date = (
                SELECT MIN(fh.report_date) FROM fact_reports fh
                WHERE fh.company_id = fr.company_id
                  AND fh.report_date > fr.report_date
                  AND fh.report_date <= DATE_ADD(fr.report_date, INTERVAL 10 MONTH)
                  AND CAST(fh.report_type AS BINARY) != CAST(fr.report_type AS BINARY)
            )
        )
        INNER JOIN fact_metrics future_price ON (
            future_price.report_id = fr_future_6m.report_id
            AND future_price.metric_id = (SELECT metric_id FROM dim_metrics
                                          WHERE CAST(name AS BINARY) = CAST('share_price' AS BINARY))
            AND future_price.value > 0
        )
        
        LEFT JOIN fact_metrics dividend_yield ON (
            dividend_yield.report_id = fr_future_6m.report_id
            AND dividend_yield.metric_id = (SELECT metric_id FROM dim_metrics
                                            WHERE CAST(name AS BINARY) = CAST('dividend_yield' AS BINARY))
        )
        WHERE fr.company_id = p_company_id
          AND current_price.value > 0;

        SET @inserted_count = ROW_COUNT();
        SET v_records_processed = v_records_processed + @inserted_count;

        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_16_for_company', 'INFO',
                CONCAT('Completed return_6m - inserted ', @inserted_count, ' values'), 'return_6m', @inserted_count, 'METRIC_COMPLETE');


        
        
        
        
        
        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
        SELECT
            fr.report_id,
            v_return_1y_id,
            (future_price.value / current_price.value - 1) + COALESCE(dividend_yield.value, 0),
            'CALC_RET_1Y_PLUS',
            NOW(),
            CONCAT('Price Return: ', ROUND((future_price.value / current_price.value - 1) * 100, 2),
                   '%, Dividend Yield (1y): ', ROUND(COALESCE(dividend_yield.value, 0) * 100, 2), '%')
        FROM fact_reports fr
        INNER JOIN fact_metrics current_price ON fr.report_id = current_price.report_id
            AND current_price.metric_id = (SELECT metric_id FROM dim_metrics
                                           WHERE CAST(name AS BINARY) = CAST('share_price' AS BINARY))
        
        INNER JOIN fact_reports fr_future_1y ON (
            fr_future_1y.company_id = fr.company_id
            AND CAST(fr_future_1y.filing_identifier AS BINARY) = CAST(fr.filing_identifier AS BINARY)
            AND CAST(fr_future_1y.report_type AS BINARY) = CAST(fr.report_type AS BINARY)
            AND fr_future_1y.financial_year = (fr.financial_year + 1)
        )
        INNER JOIN fact_metrics future_price ON (
            future_price.report_id = fr_future_1y.report_id
            AND future_price.metric_id = (SELECT metric_id FROM dim_metrics
                                          WHERE CAST(name AS BINARY) = CAST('share_price' AS BINARY))
            AND future_price.value > 0
        )
        
        LEFT JOIN fact_metrics dividend_yield ON (
            dividend_yield.report_id = fr_future_1y.report_id
            AND dividend_yield.metric_id = (SELECT metric_id FROM dim_metrics
                                            WHERE CAST(name AS BINARY) = CAST('dividend_yield' AS BINARY))
        )
        WHERE fr.company_id = p_company_id
          AND current_price.value > 0;

        SET @inserted_count = ROW_COUNT();
        SET v_records_processed = v_records_processed + @inserted_count;

        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_16_for_company', 'INFO',
                CONCAT('Completed return_1y - inserted ', @inserted_count, ' values'), 'return_1y', @inserted_count, 'METRIC_COMPLETE');


        
        
        
        
        
        
        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
        SELECT
            fr.report_id,
            v_return_2y_id,
            (future_price.value / current_price.value - 1)
                + COALESCE(dividend_yield_1y.value, 0)
                + COALESCE(dividend_yield_2y.value, 0),
            'CALC_RET_2Y_PLUS',
            NOW(),
            CONCAT('Price Return: ', ROUND((future_price.value / current_price.value - 1) * 100, 2),
                   '%, Dividend Y1: ', ROUND(COALESCE(dividend_yield_1y.value, 0) * 100, 2),
                   '%, Dividend Y2: ', ROUND(COALESCE(dividend_yield_2y.value, 0) * 100, 2), '%')
        FROM fact_reports fr
        INNER JOIN fact_metrics current_price ON fr.report_id = current_price.report_id
            AND current_price.metric_id = (SELECT metric_id FROM dim_metrics
                                           WHERE CAST(name AS BINARY) = CAST('share_price' AS BINARY))
        
        INNER JOIN fact_reports fr_future_1y ON (
            fr_future_1y.company_id = fr.company_id
            AND CAST(fr_future_1y.filing_identifier AS BINARY) = CAST(fr.filing_identifier AS BINARY)
            AND CAST(fr_future_1y.report_type AS BINARY) = CAST(fr.report_type AS BINARY)
            AND fr_future_1y.financial_year = (fr.financial_year + 1)
        )
        
        INNER JOIN fact_reports fr_future_2y ON (
            fr_future_2y.company_id = fr.company_id
            AND CAST(fr_future_2y.filing_identifier AS BINARY) = CAST(fr.filing_identifier AS BINARY)
            AND CAST(fr_future_2y.report_type AS BINARY) = CAST(fr.report_type AS BINARY)
            AND fr_future_2y.financial_year = (fr.financial_year + 2)
        )
        INNER JOIN fact_metrics future_price ON (
            future_price.report_id = fr_future_2y.report_id
            AND future_price.metric_id = (SELECT metric_id FROM dim_metrics
                                          WHERE CAST(name AS BINARY) = CAST('share_price' AS BINARY))
            AND future_price.value > 0
        )
        LEFT JOIN fact_metrics dividend_yield_1y ON (
            dividend_yield_1y.report_id = fr_future_1y.report_id
            AND dividend_yield_1y.metric_id = (SELECT metric_id FROM dim_metrics
                                               WHERE CAST(name AS BINARY) = CAST('dividend_yield' AS BINARY))
        )
        LEFT JOIN fact_metrics dividend_yield_2y ON (
            dividend_yield_2y.report_id = fr_future_2y.report_id
            AND dividend_yield_2y.metric_id = (SELECT metric_id FROM dim_metrics
                                               WHERE CAST(name AS BINARY) = CAST('dividend_yield' AS BINARY))
        )
        WHERE fr.company_id = p_company_id
          AND current_price.value > 0;

        SET @inserted_count = ROW_COUNT();
        SET v_records_processed = v_records_processed + @inserted_count;

        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_16_for_company', 'INFO',
                CONCAT('Completed return_2y - inserted ', @inserted_count, ' values'), 'return_2y', @inserted_count, 'METRIC_COMPLETE');


        
        
        
        
        
        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
        SELECT
            fr.report_id,
            v_shares_vs_ly_id,
            current_shares.value / historical_shares.value,
            'CALC_SHARES_1Y',
            NOW(),
            CONCAT('Current shares: ', ROUND(current_shares.value, 0),
                   ', Historical shares (1y): ', ROUND(historical_shares.value, 0),
                   ', Ratio: ', ROUND(current_shares.value / historical_shares.value, 4))
        FROM fact_reports fr
        INNER JOIN fact_metrics current_shares ON fr.report_id = current_shares.report_id
            AND current_shares.metric_id = (SELECT metric_id FROM dim_metrics
                                            WHERE CAST(name AS BINARY) = CAST('diluted_shares' AS BINARY))
        
        INNER JOIN fact_reports fr_hist_1y ON (
            fr_hist_1y.company_id = fr.company_id
            AND CAST(fr_hist_1y.filing_identifier AS BINARY) = CAST(fr.filing_identifier AS BINARY)
            AND CAST(fr_hist_1y.report_type AS BINARY) = CAST(fr.report_type AS BINARY)
            AND fr_hist_1y.financial_year = (fr.financial_year - 1)
        )
        INNER JOIN fact_metrics historical_shares ON (
            historical_shares.report_id = fr_hist_1y.report_id
            AND historical_shares.metric_id = (SELECT metric_id FROM dim_metrics
                                               WHERE CAST(name AS BINARY) = CAST('diluted_shares' AS BINARY))
        )
        WHERE fr.company_id = p_company_id
          AND current_shares.value > 0
          AND historical_shares.value > 0;

        SET @inserted_count = ROW_COUNT();
        SET v_records_processed = v_records_processed + @inserted_count;

        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_16_for_company', 'INFO',
                CONCAT('Completed shares_vs_ly - inserted ', @inserted_count, ' values'), 'shares_vs_ly', @inserted_count, 'METRIC_COMPLETE');


        
        
        
        
        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
        SELECT
            fr.report_id,
            v_shares_vs_2y_ago_id,
            current_shares.value / historical_shares.value,
            'CALC_SHARES_2Y',
            NOW(),
            CONCAT('Current shares: ', ROUND(current_shares.value, 0),
                   ', Historical shares (2y): ', ROUND(historical_shares.value, 0),
                   ', Ratio: ', ROUND(current_shares.value / historical_shares.value, 4))
        FROM fact_reports fr
        INNER JOIN fact_metrics current_shares ON fr.report_id = current_shares.report_id
            AND current_shares.metric_id = (SELECT metric_id FROM dim_metrics
                                            WHERE CAST(name AS BINARY) = CAST('diluted_shares' AS BINARY))
        
        INNER JOIN fact_reports fr_hist_2y ON (
            fr_hist_2y.company_id = fr.company_id
            AND CAST(fr_hist_2y.filing_identifier AS BINARY) = CAST(fr.filing_identifier AS BINARY)
            AND CAST(fr_hist_2y.report_type AS BINARY) = CAST(fr.report_type AS BINARY)
            AND fr_hist_2y.financial_year = (fr.financial_year - 2)
        )
        INNER JOIN fact_metrics historical_shares ON (
            historical_shares.report_id = fr_hist_2y.report_id
            AND historical_shares.metric_id = (SELECT metric_id FROM dim_metrics
                                               WHERE CAST(name AS BINARY) = CAST('diluted_shares' AS BINARY))
        )
        WHERE fr.company_id = p_company_id
          AND current_shares.value > 0
          AND historical_shares.value > 0;

        SET @inserted_count = ROW_COUNT();
        SET v_records_processed = v_records_processed + @inserted_count;

        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_16_for_company', 'INFO',
                CONCAT('Completed shares_vs_2y_ago - inserted ', @inserted_count, ' values'), 'shares_vs_2y_ago', @inserted_count, 'METRIC_COMPLETE');


        COMMIT;


        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_16_for_company', 'SUCCESS',
                CONCAT('Priority 16 calculations completed successfully. Total records processed: ', v_records_processed,
                       '. Execution time: ', TIMESTAMPDIFF(SECOND, v_start_time, NOW()), ' seconds'),
                v_records_processed, 'COMPLETION');

    END main_block;


    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_17_for_company`(
    IN p_company_id INT
)
BEGIN
    -- Variable declarations
    DECLARE v_records_processed INT DEFAULT 0;
    DECLARE v_records_calculated INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);
    DECLARE v_error_count INT DEFAULT 0;
    
    -- Metric ID variables
    DECLARE v_sticker_price_id INT DEFAULT NULL;
    DECLARE v_eps_id INT DEFAULT NULL;
    DECLARE v_est_growth_rate_id INT DEFAULT NULL;
    DECLARE v_est_future_pe_id INT DEFAULT NULL;
    
    -- Handler declarations MUST come after all other declarations
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;
        SET v_error_count = v_error_count + 1;
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_17_for_company', 'ERROR', 
                CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        ROLLBACK;
        -- Restore safe mode
        SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    END;
    
    -- Get company ticker for logging
    SELECT ticker INTO @company_ticker 
    FROM dim_companies 
    WHERE company_id = p_company_id;
    
    -- Initialize session and variables
    SET v_session_id = CONCAT('P17_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;
    
    -- Start transaction
    START TRANSACTION;
    
    main_block: BEGIN
        -- Log procedure start
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_17_for_company', 'INFO', 
                CONCAT('Starting Priority 17 sticker_price calculation for company_id: ', p_company_id), 'START');
        
        -- Validate company exists
        IF @company_ticker IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, 'UNKNOWN', 'calculate_priority_17_for_company', 'ERROR', 
                    CONCAT('Company_id ', p_company_id, ' not found in dim_companies'), 'VALIDATION');
            LEAVE main_block;
        END IF;
        
        -- ===================================================================
        -- RESOLVE COMPONENT METRIC IDs
        -- ===================================================================
        
        -- Get sticker_price metric ID (Priority 17)
        SELECT metric_id INTO v_sticker_price_id
        FROM dim_metrics
        WHERE name = 'sticker_price'
          AND calculation_priority = 17;
        
        -- Get dependency metric IDs
        SELECT metric_id INTO v_eps_id
        FROM dim_metrics
        WHERE name = 'eps';
        
        SELECT metric_id INTO v_est_growth_rate_id
        FROM dim_metrics
        WHERE name = 'est_growth_rate';
        
        SELECT metric_id INTO v_est_future_pe_id
        FROM dim_metrics
        WHERE name = 'est_future_pe';
        
        -- Log metric ID resolution
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_17_for_company', 'INFO', 
                CONCAT('Metric IDs - sticker_price: ', COALESCE(v_sticker_price_id, 'NULL'), 
                      ', eps: ', COALESCE(v_eps_id, 'NULL'),
                      ', est_growth_rate: ', COALESCE(v_est_growth_rate_id, 'NULL'),
                      ', est_future_pe: ', COALESCE(v_est_future_pe_id, 'NULL')), 'METRIC_RESOLUTION');
        
        -- Validate required metrics exist
        IF v_sticker_price_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_17_for_company', 'ERROR', 
                    'sticker_price metric not found in dim_metrics', 'VALIDATION');
            LEAVE main_block;
        END IF;
        
        IF v_eps_id IS NULL OR v_est_growth_rate_id IS NULL OR v_est_future_pe_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_17_for_company', 'ERROR', 
                    'Required dependency metrics not found in dim_metrics', 'VALIDATION');
            LEAVE main_block;
        END IF;
        
        -- ===================================================================
        -- DELETE EXISTING PRIORITY 17 DATA FOR THIS COMPANY
        -- Following lessons learned: Use DELETE-then-INSERT, NO NOT EXISTS
        -- ===================================================================
        
        DELETE FROM fact_metrics 
        WHERE metric_id = v_sticker_price_id
          AND report_id IN (
              SELECT report_id FROM fact_reports 
              WHERE company_id = p_company_id
          );
        
        GET DIAGNOSTICS v_records_processed = ROW_COUNT;
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_17_for_company', 'INFO', 
                CONCAT('Deleted ', v_records_processed, ' existing sticker_price records for recalculation'), 'DELETE_EXISTING');
        
        -- ===================================================================
        -- CREATE TEMPORARY TABLE FOR COMPLEX DCF CALCULATIONS
        -- ===================================================================
        
        DROP TEMPORARY TABLE IF EXISTS temp_dcf_calculations;
        
        CREATE TEMPORARY TABLE temp_dcf_calculations (
            report_id INT PRIMARY KEY,
            eps_value DECIMAL(20,6),
            growth_rate DECIMAL(20,6),
            future_pe DECIMAL(20,6),
            year_1_eps DECIMAL(20,6),
            year_2_eps DECIMAL(20,6),
            year_3_eps DECIMAL(20,6),
            year_4_eps DECIMAL(20,6),
            year_5_eps DECIMAL(20,6),
            year_6_eps DECIMAL(20,6),
            year_7_eps DECIMAL(20,6),
            year_8_eps DECIMAL(20,6),
            year_9_eps DECIMAL(20,6),
            year_10_eps DECIMAL(20,6),
            dcf_sum DECIMAL(20,6),
            terminal_value DECIMAL(20,6),
            sticker_price DECIMAL(20,6)
        );
        
        -- ===================================================================
        -- POPULATE INTERMEDIATE CALCULATIONS WITH PROGRESSIVE EPS GROWTH
        -- Implementing declining growth rates: 100%, 95%, 90.25%, etc.
        -- ===================================================================
        
        INSERT INTO temp_dcf_calculations (
            report_id, eps_value, growth_rate, future_pe,
            year_1_eps, year_2_eps, year_3_eps, year_4_eps, year_5_eps,
            year_6_eps, year_7_eps, year_8_eps, year_9_eps, year_10_eps
        )
        SELECT 
            fr.report_id,
            eps.value as eps_value,
            egr.value as growth_rate,
            efpe.value as future_pe,
            -- Progressive EPS calculations with declining growth rates
            eps.value * (1 + egr.value) as year_1_eps,
            eps.value * (1 + egr.value) * (1 + egr.value * 0.95) as year_2_eps,
            eps.value * (1 + egr.value) * (1 + egr.value * 0.95) * (1 + egr.value * 0.9025) as year_3_eps,
            eps.value * (1 + egr.value) * (1 + egr.value * 0.95) * (1 + egr.value * 0.9025) * (1 + egr.value * 0.857375) as year_4_eps,
            eps.value * (1 + egr.value) * (1 + egr.value * 0.95) * (1 + egr.value * 0.9025) * (1 + egr.value * 0.857375) * (1 + egr.value * 0.81450625) as year_5_eps,
            eps.value * (1 + egr.value) * (1 + egr.value * 0.95) * (1 + egr.value * 0.9025) * (1 + egr.value * 0.857375) * (1 + egr.value * 0.81450625) * (1 + egr.value * 0.77378094) as year_6_eps,
            eps.value * (1 + egr.value) * (1 + egr.value * 0.95) * (1 + egr.value * 0.9025) * (1 + egr.value * 0.857375) * (1 + egr.value * 0.81450625) * (1 + egr.value * 0.77378094) * (1 + egr.value * 0.73509189) as year_7_eps,
            eps.value * (1 + egr.value) * (1 + egr.value * 0.95) * (1 + egr.value * 0.9025) * (1 + egr.value * 0.857375) * (1 + egr.value * 0.81450625) * (1 + egr.value * 0.77378094) * (1 + egr.value * 0.73509189) * (1 + egr.value * 0.6983373) as year_8_eps,
            eps.value * (1 + egr.value) * (1 + egr.value * 0.95) * (1 + egr.value * 0.9025) * (1 + egr.value * 0.857375) * (1 + egr.value * 0.81450625) * (1 + egr.value * 0.77378094) * (1 + egr.value * 0.73509189) * (1 + egr.value * 0.6983373) * (1 + egr.value * 0.66342043) as year_9_eps,
            eps.value * (1 + egr.value) * (1 + egr.value * 0.95) * (1 + egr.value * 0.9025) * (1 + egr.value * 0.857375) * (1 + egr.value * 0.81450625) * (1 + egr.value * 0.77378094) * (1 + egr.value * 0.73509189) * (1 + egr.value * 0.6983373) * (1 + egr.value * 0.66342043) * (1 + egr.value * 0.63024941) as year_10_eps
        FROM fact_reports fr
        INNER JOIN fact_metrics eps ON fr.report_id = eps.report_id AND eps.metric_id = v_eps_id
        INNER JOIN fact_metrics egr ON fr.report_id = egr.report_id AND egr.metric_id = v_est_growth_rate_id
        INNER JOIN fact_metrics efpe ON fr.report_id = efpe.report_id AND efpe.metric_id = v_est_future_pe_id
        WHERE fr.company_id = p_company_id
          AND eps.value > 0                    -- Positive earnings required
          AND egr.value > -1.0                 -- Growth rate > -100% (company survival)
          AND efpe.value > 0;                  -- Positive future P/E required
        
        GET DIAGNOSTICS v_records_processed = ROW_COUNT;
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_17_for_company', 'INFO', 
                CONCAT('Created ', v_records_processed, ' intermediate DCF calculation records'), 'DCF_SETUP');
        
        -- ===================================================================
        -- CALCULATE DCF SUM AND TERMINAL VALUE
        -- ===================================================================
        
        UPDATE temp_dcf_calculations 
        SET dcf_sum = (
            -- Discounted cash flows for years 1-10 with 15% discount rate
            (year_1_eps * POW(1/1.15, 1)) +
            (year_2_eps * POW(1/1.15, 2)) +
            (year_3_eps * POW(1/1.15, 3)) +
            (year_4_eps * POW(1/1.15, 4)) +
            (year_5_eps * POW(1/1.15, 5)) +
            (year_6_eps * POW(1/1.15, 6)) +
            (year_7_eps * POW(1/1.15, 7)) +
            (year_8_eps * POW(1/1.15, 8)) +
            (year_9_eps * POW(1/1.15, 9)) +
            (year_10_eps * POW(1/1.15, 10))
        ),
        terminal_value = (
            -- Terminal value: Future P/E * Final Growth Factor * Year 10 EPS * Discount Factor
            future_pe * 0.63024941 * year_10_eps * POW(1/1.15, 10)
        );
        
        -- Calculate final sticker price
        UPDATE temp_dcf_calculations 
        SET sticker_price = dcf_sum + terminal_value;
        
        -- ===================================================================
        -- INSERT FINAL STICKER PRICE CALCULATIONS
        -- Following lessons learned: NO NOT EXISTS clause, just INSERT
        -- ===================================================================
        
        INSERT INTO fact_metrics (
            report_id, 
            metric_id, 
            value, 
            source_flag, 
            calculation_date, 
            notes
        )
        SELECT 
            temp.report_id,
            v_sticker_price_id,
            temp.sticker_price,
            'CALC_STICKER_PRICE',
            NOW(),
            CONCAT('DCF calculation - EPS: ', ROUND(temp.eps_value, 4),
                   ', Growth: ', ROUND(temp.growth_rate * 100, 2), '%',
                   ', Future P/E: ', ROUND(temp.future_pe, 2),
                   ', DCF Sum: ', ROUND(temp.dcf_sum, 2),
                   ', Terminal: ', ROUND(temp.terminal_value, 2))
        FROM temp_dcf_calculations temp;
        
        GET DIAGNOSTICS v_records_calculated = ROW_COUNT;
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_17_for_company', 'INFO', 
                CONCAT('Successfully calculated ', v_records_calculated, ' sticker_price values'), 'CALCULATION_COMPLETE');
        
        -- ===================================================================
        -- CLEANUP TEMPORARY TABLE
        -- ===================================================================
        
        DROP TEMPORARY TABLE IF EXISTS temp_dcf_calculations;
        
        -- Log final summary
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_17_for_company', 'INFO', 
                CONCAT('Priority 17 calculation completed successfully. ',
                       'Records processed: ', v_records_calculated, 
                       '. Processing time: ', TIMESTAMPDIFF(SECOND, v_start_time, NOW()), ' seconds'), 'SUMMARY');
        
    END main_block;
    
    -- Cleanup and commit
    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    COMMIT;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_18_for_company`(
    IN p_company_id INT
)
BEGIN
    -- Variable declarations
    DECLARE v_records_processed INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);
    
    -- Metric ID declarations
    DECLARE v_adjusted_price_metric_id INT;
    DECLARE v_sticker_price_metric_id INT;
    DECLARE v_opportunity_metric_id INT;
    
    -- Error handler
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_18_for_company', 'ERROR', 
                CONCAT('SQL Error: ', @errno, ': ', @text), 'ERROR_HANDLER');
        ROLLBACK;
    END;
    
    -- Generate session ID
    SET v_session_id = CONCAT('P18_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    
    START TRANSACTION;
    
    main_block: BEGIN
        -- Get company ticker for logging
        SELECT ticker INTO @company_ticker FROM dim_companies WHERE company_id = p_company_id;
        
        -- Log start
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_18_for_company', 'INFO', 
                'Starting Priority 18 opportunity calculations', 'START');
        
        -- Disable safe updates temporarily
        SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
        SET SQL_SAFE_UPDATES = 0;
        
        -- ================================================================
        -- STEP 1: Validate Component Metrics Exist
        -- ================================================================
        
        -- Get adjusted_price metric ID
        SELECT metric_id INTO v_adjusted_price_metric_id 
        FROM dim_metrics 
        WHERE CAST(name AS BINARY) = 'adjusted_price';
        
        IF v_adjusted_price_metric_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_18_for_company', 'ERROR', 
                    'Required metric adjusted_price not found in dim_metrics', 'VALIDATION');
            LEAVE main_block;
        END IF;
        
        -- Get sticker_price metric ID
        SELECT metric_id INTO v_sticker_price_metric_id 
        FROM dim_metrics 
        WHERE CAST(name AS BINARY) = 'sticker_price';
        
        IF v_sticker_price_metric_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_18_for_company', 'ERROR', 
                    'Required metric sticker_price not found in dim_metrics', 'VALIDATION');
            LEAVE main_block;
        END IF;
        
        -- Get opportunity metric ID
        SELECT metric_id INTO v_opportunity_metric_id 
        FROM dim_metrics 
        WHERE CAST(name AS BINARY) = 'opportunity' AND calculation_priority = 18;
        
        IF v_opportunity_metric_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_18_for_company', 'ERROR', 
                    'Target metric opportunity not found in dim_metrics with priority 18', 'VALIDATION');
            LEAVE main_block;
        END IF;
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_18_for_company', 'INFO', 
                'Component metrics validated successfully', 'VALIDATION');
        
        -- ================================================================
        -- STEP 2: Clear Existing Priority 18 Data for This Company
        -- ================================================================
        
        DELETE FROM fact_metrics 
        WHERE metric_id = v_opportunity_metric_id
          AND report_id IN (SELECT report_id FROM fact_reports WHERE company_id = p_company_id);
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_18_for_company', 'INFO', 
                CONCAT('Cleared existing opportunity data for company_id: ', p_company_id), 'CLEANUP');
        
        -- ================================================================
        -- STEP 3: Calculate Opportunity Metric
        -- ================================================================
        
        INSERT INTO fact_metrics (
            report_id,
            metric_id,
            value,
            source_flag,
            notes,
            calculation_date
        )
        SELECT DISTINCT
            fr.report_id,
            v_opportunity_metric_id,
            ROUND((ap.value / sp.value) - 1, 6) as opportunity_value,
            'CALC_OPPORTUNITY' as source_flag,
            CONCAT('Opportunity calculation: (', ROUND(ap.value, 4), ' / ', ROUND(sp.value, 4), ') - 1 = ', 
                   ROUND((ap.value / sp.value) - 1, 6)) as notes,
            NOW() as calculation_date
        FROM fact_reports fr
        INNER JOIN fact_metrics ap ON (fr.report_id = ap.report_id AND ap.metric_id = v_adjusted_price_metric_id)
        INNER JOIN fact_metrics sp ON (fr.report_id = sp.report_id AND sp.metric_id = v_sticker_price_metric_id)
        WHERE fr.company_id = p_company_id
          AND ap.value IS NOT NULL 
          AND ap.value > 0
          AND sp.value IS NOT NULL 
          AND sp.value > 0;
        
        SET v_records_processed = ROW_COUNT();
        
        -- ================================================================
        -- STEP 4: Log Results and Completion
        -- ================================================================
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_18_for_company', 'INFO', 
                CONCAT('Opportunity calculations completed. Records processed: ', v_records_processed, 
                       '. Execution time: ', TIMESTAMPDIFF(SECOND, v_start_time, NOW()), ' seconds'), 
                'COMPLETION');
        
        -- Restore safe mode
        SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
        
    END main_block;
    
    -- Commit transaction
    COMMIT;
    
    -- Final success log
    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_18_for_company', 'SUCCESS', 
            CONCAT('Successfully completed Priority 18 opportunity calculations for ', @company_ticker), 'SUCCESS');
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_2_for_company`(
    IN p_company_id INT
)
BEGIN
    -- Variable declarations
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_metric_id INT;
    DECLARE v_metric_name VARCHAR(50);
    DECLARE v_base_metric_name VARCHAR(50);
    DECLARE v_time_offset_months INT;
    DECLARE v_base_metric_id INT;
    DECLARE v_records_processed INT DEFAULT 0;
    DECLARE v_total_metrics INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);
    
    -- Cursor declaration MUST come before handlers
    DECLARE priority_2_cursor CURSOR FOR
        SELECT 
            metric_id,
            name,
            base_metric_name,
            time_offset_months
        FROM dim_metrics
        WHERE calculation_priority = 2
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
          AND base_metric_name IS NOT NULL
          AND time_offset_months IS NOT NULL
        ORDER BY name;
    
    -- Handler declarations MUST come after cursor declarations
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;
        -- Log error to table (no SELECT statement)
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_2_for_company', 'ERROR', 
                CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        ROLLBACK;
    END;
    
    -- Generate unique session ID
    SET v_session_id = CONCAT('P2_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    
    -- Start transaction for data consistency
    START TRANSACTION;
    
    -- Main processing block
    main_block: BEGIN
        -- Get company ticker for logging
        SELECT ticker INTO @company_ticker 
        FROM dim_companies 
        WHERE company_id = p_company_id;
        
        IF @company_ticker IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, 'UNKNOWN', 'calculate_priority_2_for_company', 'ERROR', 
                    CONCAT('Company ID ', p_company_id, ' not found in dim_companies'), 'VALIDATION');
            ROLLBACK;
            LEAVE main_block;
        END IF;
        
        -- Log start
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_2_for_company', 'INFO', 
                CONCAT('Starting Priority 2 calculations for company: ', @company_ticker), 'START');
        
        -- Temporarily disable safe updates
        SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
        SET SQL_SAFE_UPDATES = 0;
        
        -- Count total metrics to process
        SELECT COUNT(*) INTO v_total_metrics
        FROM dim_metrics
        WHERE calculation_priority = 2
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
          AND base_metric_name IS NOT NULL
          AND time_offset_months IS NOT NULL;
        
        -- Log metrics count
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_2_for_company', 'INFO', 
                CONCAT('Found ', v_total_metrics, ' priority 2 metrics to calculate'), v_total_metrics, 'METRICS_COUNT');
        
        -- Delete existing priority 2 metrics for this company to ensure clean calculation
        DELETE fm FROM fact_metrics fm
        JOIN fact_reports fr ON fm.report_id = fr.report_id
        JOIN dim_metrics dm ON fm.metric_id = dm.metric_id
        WHERE fr.company_id = p_company_id
          AND dm.calculation_priority = 2;
        
        SET @cleared_count = ROW_COUNT();
        
        -- Log cleanup
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_2_for_company', 'INFO', 
                'Cleared existing priority 2 metrics for clean calculation', @cleared_count, 'CLEANUP');
        
        -- Open cursor and process each metric
        OPEN priority_2_cursor;
        
        read_loop: LOOP
            FETCH priority_2_cursor INTO v_metric_id, v_metric_name, v_base_metric_name, v_time_offset_months;
            
            IF done THEN
                LEAVE read_loop;
            END IF;
            
            -- Get base metric ID
            SELECT metric_id INTO v_base_metric_id
            FROM dim_metrics
            WHERE CAST(name AS BINARY) = CAST(v_base_metric_name AS BINARY)
              AND calculation_priority = 1;
            
            IF v_base_metric_id IS NULL THEN
                INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
                VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_2_for_company', 'WARNING', 
                        CONCAT('Base metric not found: ', v_base_metric_name), v_metric_name, 'BASE_METRIC_LOOKUP');
                ITERATE read_loop;
            END IF;
            
            -- Log current metric processing
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_2_for_company', 'INFO', 
                    CONCAT('Processing metric: ', v_metric_name, ' (offset: ', v_time_offset_months, ' months)'), v_metric_name, 'METRIC_START');
            
            -- ===================================================================
            -- CALCULATE BASED ON TIME OFFSET
            -- ===================================================================
            
            IF v_time_offset_months = 6 THEN
                -- =============================================
                -- 6-MONTH LOOKBACK: Previous report with different filing_identifier
                -- =============================================
                INSERT INTO fact_metrics (
                    report_id,
                    metric_id,
                    value,
                    source_flag,
                    calculation_date,
                    notes,
                    created_at,
                    updated_at
                )
                SELECT DISTINCT
                    current_report.report_id,
                    v_metric_id,
                    historical_metric.value,
                    'CALC_6M_PREV',
                    NOW(),
                    CONCAT('6-month lookback from report_id: ', historical_report.report_id),
                    NOW(),
                    NOW()
                FROM fact_reports current_report
                
                -- Find previous report (instance - 1) with different filing_identifier
                JOIN fact_reports historical_report ON 
                    historical_report.company_id = current_report.company_id
                    AND historical_report.instance = (current_report.instance - 1)
                    AND CAST(historical_report.filing_identifier AS BINARY) != CAST(current_report.filing_identifier AS BINARY)
                
                -- Get historical metric value
                JOIN fact_metrics historical_metric ON 
                    historical_metric.report_id = historical_report.report_id
                    AND historical_metric.metric_id = v_base_metric_id
                
                WHERE current_report.company_id = p_company_id
                  AND historical_metric.value IS NOT NULL;
            
            ELSEIF v_time_offset_months IN (12, 24) THEN
                -- =============================================
                -- 12/24-MONTH LOOKBACK: Same filing_identifier from N years ago
                -- =============================================
                SET @years_back = v_time_offset_months / 12;
                
                INSERT INTO fact_metrics (
                    report_id,
                    metric_id,
                    value,
                    source_flag,
                    calculation_date,
                    notes,
                    created_at,
                    updated_at
                )
                SELECT DISTINCT
                    current_report.report_id,
                    v_metric_id,
                    historical_metric.value,
                    CASE 
                        WHEN v_time_offset_months = 12 THEN 'CALC_12M_BACK'
                        WHEN v_time_offset_months = 24 THEN 'CALC_24M_BACK'
                    END,
                    NOW(),
                    CONCAT(v_time_offset_months, '-month lookback from report_id: ', historical_report.report_id),
                    NOW(),
                    NOW()
                FROM fact_reports current_report
                
                -- Find report from N years ago with SAME filing_identifier
                JOIN fact_reports historical_report ON 
                    historical_report.company_id = current_report.company_id
                    AND CAST(historical_report.filing_identifier AS BINARY) = CAST(current_report.filing_identifier AS BINARY)
                    AND historical_report.financial_year = (current_report.financial_year - @years_back)
                
                -- Get historical metric value
                JOIN fact_metrics historical_metric ON 
                    historical_metric.report_id = historical_report.report_id
                    AND historical_metric.metric_id = v_base_metric_id
                
                WHERE current_report.company_id = p_company_id
                  AND historical_metric.value IS NOT NULL
                
                -- Handle multiple reports per year - take the most recent
                AND historical_report.report_date = (
                    SELECT MAX(hr2.report_date)
                    FROM fact_reports hr2
                    WHERE hr2.company_id = current_report.company_id
                      AND CAST(hr2.filing_identifier AS BINARY) = CAST(current_report.filing_identifier AS BINARY)
                      AND hr2.financial_year = (current_report.financial_year - @years_back)
                );
                
            ELSE
                INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
                VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_2_for_company', 'WARNING', 
                        CONCAT('Unsupported time offset: ', v_time_offset_months, ' months'), v_metric_name, 'UNSUPPORTED_OFFSET');
                ITERATE read_loop;
            END IF;
            
            -- Count records processed for this metric
            SET v_records_processed = ROW_COUNT();
            
            -- Log completion for this metric
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_2_for_company', 'SUCCESS', 
                    CONCAT('Completed ', v_metric_name, ': ', v_records_processed, ' values calculated'), v_metric_name, v_records_processed, 'METRIC_COMPLETE');
            
        END LOOP;
        
        CLOSE priority_2_cursor;
        
    END main_block;
    
    -- Restore safe updates setting
    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    
    -- Commit transaction
    COMMIT;
    
    -- ===================================================================
    -- FINAL SUMMARY (using logging table only - NO SELECT statements)
    -- ===================================================================
    
    -- Calculate execution time
    SET @execution_time = TIMESTAMPDIFF(SECOND, v_start_time, NOW());
    
    -- Count final results
    SELECT COUNT(*) INTO @total_priority_2_values
    FROM fact_metrics fm
    JOIN fact_reports fr ON fm.report_id = fr.report_id
    JOIN dim_metrics dm ON fm.metric_id = dm.metric_id
    WHERE fr.company_id = p_company_id
      AND dm.calculation_priority = 2;
    
    -- Log final summary (NO SELECT statement - just INSERT)
    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_2_for_company', 'SUCCESS', 
            CONCAT('Priority 2 calculations completed. Total values: ', @total_priority_2_values, 
                   ', Execution time: ', @execution_time, ' seconds'), @total_priority_2_values, 'FINAL_SUMMARY');

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_3_for_company`(
    IN p_company_id INT
)
BEGIN

    DECLARE done INT DEFAULT FALSE;
    DECLARE v_metric_id INT;
    DECLARE v_metric_name VARCHAR(50);
    DECLARE v_base_metric_name VARCHAR(50);
    DECLARE v_base_metric_id INT;
    
    DECLARE v_records_processed INT DEFAULT 0;
    DECLARE v_total_metrics INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);


    DECLARE priority_3_cursor CURSOR FOR
        SELECT
            metric_id,
            name,
            base_metric_name
        FROM dim_metrics
        WHERE calculation_priority = 3
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
          AND base_metric_name IS NOT NULL
          AND CAST(name AS BINARY) LIKE CAST('%_ttm' AS BINARY)
        ORDER BY name;


    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;

        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_3_for_company', 'ERROR',
                CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        ROLLBACK;
    END;


    SET v_session_id = CONCAT('P3_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));


    START TRANSACTION;


    main_block: BEGIN

        SELECT ticker INTO @company_ticker
        FROM dim_companies
        WHERE company_id = p_company_id;

        IF @company_ticker IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, 'UNKNOWN', 'calculate_priority_3_for_company', 'ERROR',
                    CONCAT('Company ID ', p_company_id, ' not found in dim_companies'), 'VALIDATION');
            ROLLBACK;
            LEAVE main_block;
        END IF;


        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_3_for_company', 'INFO',
                CONCAT('Starting Priority 3 TTM calculations for company: ', @company_ticker), 'START');


        SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
        SET SQL_SAFE_UPDATES = 0;


        SELECT COUNT(*) INTO v_total_metrics
        FROM dim_metrics
        WHERE calculation_priority = 3
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
          AND base_metric_name IS NOT NULL
          AND CAST(name AS BINARY) LIKE CAST('%_ttm' AS BINARY);


        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_3_for_company', 'INFO',
                CONCAT('Found ', v_total_metrics, ' priority 3 TTM metrics to calculate'), v_total_metrics, 'METRICS_COUNT');


        DELETE fm FROM fact_metrics fm
        JOIN fact_reports fr ON fm.report_id = fr.report_id
        JOIN dim_metrics dm ON fm.metric_id = dm.metric_id
        WHERE fr.company_id = p_company_id
          AND dm.calculation_priority = 3;

        SET @cleared_count = ROW_COUNT();


        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_3_for_company', 'INFO',
                'Cleared existing priority 3 TTM metrics for clean calculation', @cleared_count, 'CLEANUP');


        OPEN priority_3_cursor;

        read_loop: LOOP
            FETCH priority_3_cursor INTO v_metric_id, v_metric_name, v_base_metric_name;

            IF done THEN
                LEAVE read_loop;
            END IF;


            SET v_base_metric_id = NULL;
            


            SELECT metric_id INTO v_base_metric_id
            FROM dim_metrics
            WHERE CAST(name AS BINARY) = CAST(v_base_metric_name AS BINARY)
              AND calculation_priority = 1;

            IF v_base_metric_id IS NULL THEN
                INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
                VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_3_for_company', 'WARNING',
                        CONCAT('Base metric not found: ', v_base_metric_name), v_metric_name, 'BASE_METRIC_LOOKUP');
                ITERATE read_loop;
            END IF;


            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_3_for_company', 'INFO',
                    CONCAT('Processing TTM metric: ', v_metric_name, ' (base: ', v_base_metric_name, ')'), v_metric_name, 'METRIC_START');


            
            INSERT INTO fact_metrics (
                report_id,
                metric_id,
                value,
                source_flag,
                calculation_date,
                notes
            )
            SELECT
                current_fm.report_id,
                v_metric_id,
                current_fm.value,
                'ANNUAL_TTM',
                NOW(),
                CONCAT('Annual TTM for ', v_metric_name, ': direct assignment from ', v_base_metric_name)
            FROM fact_metrics current_fm
            JOIN fact_reports current_fr ON current_fm.report_id = current_fr.report_id
            WHERE current_fr.company_id = p_company_id
              AND current_fm.metric_id = v_base_metric_id
              AND CAST(current_fr.report_type AS BINARY) = CAST('annual' AS BINARY)
              AND NOT EXISTS (
                  SELECT 1 FROM fact_metrics existing_fm
                  WHERE existing_fm.report_id = current_fm.report_id
                    AND existing_fm.metric_id = v_metric_id
              );

            SET @annual_records = ROW_COUNT();


            
            
            
            
            INSERT INTO fact_metrics (
                report_id,
                metric_id,
                value,
                source_flag,
                calculation_date,
                notes
            )
            SELECT
                current_fm.report_id,
                v_metric_id,
                current_fm.value
                    + COALESCE(get_historical_metric(current_fm.report_id, v_base_metric_name, 6), 0)
                    - COALESCE(get_historical_metric(current_fm.report_id, v_base_metric_name, 12), 0),
                'SEMI_ANNUAL_TTM',
                NOW(),
                CONCAT('Semi-annual TTM for ', v_metric_name,
                       ': current=', ROUND(current_fm.value, 2),
                       ', t-6m(fn)=', ROUND(COALESCE(get_historical_metric(current_fm.report_id, v_base_metric_name, 6), 0), 2),
                       ', t-12m(fn)=', ROUND(COALESCE(get_historical_metric(current_fm.report_id, v_base_metric_name, 12), 0), 2))
            FROM fact_metrics current_fm
            JOIN fact_reports current_fr ON current_fm.report_id = current_fr.report_id
            WHERE current_fr.company_id = p_company_id
              AND current_fm.metric_id = v_base_metric_id
              AND CAST(current_fr.report_type AS BINARY) = CAST('semi-annual' AS BINARY)
              
              AND get_historical_metric(current_fm.report_id, v_base_metric_name, 12) IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM fact_metrics existing_fm
                  WHERE existing_fm.report_id = current_fm.report_id
                    AND existing_fm.metric_id = v_metric_id
              );

            SET @semi_annual_records = ROW_COUNT();


            SET v_records_processed = @annual_records + @semi_annual_records;


            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_3_for_company', 'SUCCESS',
                    CONCAT('Completed ', v_metric_name, ': ', @annual_records, ' annual + ', @semi_annual_records, ' semi-annual = ', v_records_processed, ' total TTM values'), v_metric_name, v_records_processed, 'METRIC_COMPLETE');

        END LOOP;

        CLOSE priority_3_cursor;

    END main_block;


    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;


    COMMIT;


    SET @execution_time = TIMESTAMPDIFF(SECOND, v_start_time, NOW());


    SELECT COUNT(*) INTO @total_priority_3_values
    FROM fact_metrics fm
    JOIN fact_reports fr ON fm.report_id = fr.report_id
    JOIN dim_metrics dm ON fm.metric_id = dm.metric_id
    WHERE fr.company_id = p_company_id
      AND dm.calculation_priority = 3;


    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_3_for_company', 'SUCCESS',
            CONCAT('Priority 3 TTM calculations completed. Total values: ', @total_priority_3_values,
                   ', Execution time: ', @execution_time, ' seconds'), @total_priority_3_values, 'FINAL_SUMMARY');

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_4_for_company`(
    IN p_company_id INT
)
BEGIN
    -- Variable declarations
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_metric_id INT;
    DECLARE v_metric_name VARCHAR(50);
    DECLARE v_base_metric_name VARCHAR(50);
    DECLARE v_time_offset_months INT;
    DECLARE v_base_ttm_metric_id INT;
    DECLARE v_records_processed INT DEFAULT 0;
    DECLARE v_total_metrics INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);
    
    -- Cursor declaration MUST come before handlers
    DECLARE priority_4_cursor CURSOR FOR
        SELECT 
            metric_id,
            name,
            base_metric_name,
            time_offset_months
        FROM dim_metrics
        WHERE calculation_priority = 4
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
          AND base_metric_name IS NOT NULL
          AND time_offset_months IS NOT NULL
        ORDER BY name;
    
    -- Handler declarations MUST come after cursor declarations
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;
        -- Log error to table (no SELECT statement)
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_4_for_company', 'ERROR', 
                CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        ROLLBACK;
    END;
    
    -- Generate unique session ID
    SET v_session_id = CONCAT('P4_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    
    -- Start transaction for data consistency
    START TRANSACTION;
    
    -- Main processing block
    main_block: BEGIN
        -- Get company ticker for logging
        SELECT ticker INTO @company_ticker 
        FROM dim_companies 
        WHERE company_id = p_company_id;
        
        IF @company_ticker IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, 'UNKNOWN', 'calculate_priority_4_for_company', 'ERROR', 
                    CONCAT('Company ID ', p_company_id, ' not found in dim_companies'), 'VALIDATION');
            ROLLBACK;
            LEAVE main_block;
        END IF;
        
        -- Log start
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_4_for_company', 'INFO', 
                CONCAT('Starting Priority 4 historical TTM calculations for company: ', @company_ticker), 'START');
        
        -- Temporarily disable safe updates
        SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
        SET SQL_SAFE_UPDATES = 0;
        
        -- Count total metrics to process
        SELECT COUNT(*) INTO v_total_metrics
        FROM dim_metrics
        WHERE calculation_priority = 4
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
          AND base_metric_name IS NOT NULL
          AND time_offset_months IS NOT NULL;
        
        -- Log metrics count
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_4_for_company', 'INFO', 
                CONCAT('Found ', v_total_metrics, ' priority 4 historical TTM metrics to calculate'), v_total_metrics, 'METRICS_COUNT');
        
        -- Delete existing priority 4 metrics for this company to ensure clean calculation
        DELETE fm FROM fact_metrics fm
        JOIN fact_reports fr ON fm.report_id = fr.report_id
        JOIN dim_metrics dm ON fm.metric_id = dm.metric_id
        WHERE fr.company_id = p_company_id
          AND dm.calculation_priority = 4;
        
        SET @cleared_count = ROW_COUNT();
        
        -- Log cleanup
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_4_for_company', 'INFO', 
                'Cleared existing priority 4 metrics for clean calculation', @cleared_count, 'CLEANUP');
        
        -- Open cursor and process each historical TTM metric
        OPEN priority_4_cursor;
        
        read_loop: LOOP
            FETCH priority_4_cursor INTO v_metric_id, v_metric_name, v_base_metric_name, v_time_offset_months;
            
            IF done THEN
                LEAVE read_loop;
            END IF;
            
            -- Get base TTM metric ID (priority 3)
            SELECT metric_id INTO v_base_ttm_metric_id
            FROM dim_metrics
            WHERE CAST(name AS BINARY) = CAST(v_base_metric_name AS BINARY)
              AND calculation_priority = 3;
            
            IF v_base_ttm_metric_id IS NULL THEN
                INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
                VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_4_for_company', 'WARNING', 
                        CONCAT('Base TTM metric not found: ', v_base_metric_name), v_metric_name, 'TTM_METRIC_LOOKUP');
                ITERATE read_loop;
            END IF;
            
            -- Log current metric processing
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_4_for_company', 'INFO', 
                    CONCAT('Processing metric: ', v_metric_name, ' (base: ', v_base_metric_name, ', offset: ', v_time_offset_months, ' months)'), v_metric_name, 'METRIC_START');
            
            -- ===================================================================
            -- CALCULATE HISTORICAL TTM VALUES
            -- Logic: Find TTM value from N years ago for same report type
            -- ===================================================================
            
            -- Calculate years back from months
            SET @years_back = v_time_offset_months / 12;
            
            -- Insert historical TTM values for this company
            INSERT INTO fact_metrics (
                report_id,
                metric_id,
                value,
                source_flag,
                calculation_date,
                notes
            )
            SELECT DISTINCT
                current_reports.report_id,
                v_metric_id,
                historical_ttm.value,
                CONCAT('HISTORICAL_TTM_', @years_back, 'Y'),
                NOW(),
                CONCAT('Historical TTM lookback: ', v_base_metric_name, ' from ', 
                       @years_back, ' years ago (', current_reports.financial_year, ' -> ', 
                       historical_reports.financial_year, ', report_type: ', current_reports.report_type, ')')
            FROM fact_reports current_reports
            JOIN fact_reports historical_reports ON (
                historical_reports.company_id = current_reports.company_id
                AND CAST(historical_reports.report_type AS BINARY) = CAST(current_reports.report_type AS BINARY)
                AND historical_reports.financial_year = (current_reports.financial_year - @years_back)
            )
            JOIN fact_metrics historical_ttm ON (
                historical_ttm.report_id = historical_reports.report_id
                AND historical_ttm.metric_id = v_base_ttm_metric_id
                AND historical_ttm.value IS NOT NULL
            )
            WHERE current_reports.company_id = p_company_id
              AND NOT EXISTS (
                  SELECT 1 FROM fact_metrics existing_fm
                  WHERE existing_fm.report_id = current_reports.report_id
                    AND existing_fm.metric_id = v_metric_id
              );
            
            -- Count records processed for this metric
            SET v_records_processed = ROW_COUNT();
            
            -- Log completion for this metric
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_4_for_company', 'SUCCESS', 
                    CONCAT('Completed ', v_metric_name, ': ', v_records_processed, ' historical TTM values calculated'), v_metric_name, v_records_processed, 'METRIC_COMPLETE');
            
        END LOOP;
        
        CLOSE priority_4_cursor;
        
    END main_block;
    
    -- Restore safe updates setting
    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    
    -- Commit transaction
    COMMIT;
    
    -- ===================================================================
    -- FINAL SUMMARY (using logging table only - NO SELECT statements)
    -- ===================================================================
    
    -- Calculate execution time
    SET @execution_time = TIMESTAMPDIFF(SECOND, v_start_time, NOW());
    
    -- Count final results
    SELECT COUNT(*) INTO @total_priority_4_values
    FROM fact_metrics fm
    JOIN fact_reports fr ON fm.report_id = fr.report_id
    JOIN dim_metrics dm ON fm.metric_id = dm.metric_id
    WHERE fr.company_id = p_company_id
      AND dm.calculation_priority = 4;
    
    -- Log final summary (NO SELECT statement - just INSERT)
    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_4_for_company', 'SUCCESS', 
            CONCAT('Priority 4 historical TTM calculations completed. Total values: ', @total_priority_4_values, 
                   ', Execution time: ', @execution_time, ' seconds'), @total_priority_4_values, 'FINAL_SUMMARY');

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_5_for_company`(
    IN p_company_id INT
)
BEGIN

    DECLARE done INT DEFAULT FALSE;
    DECLARE v_metric_id INT;
    DECLARE v_metric_name VARCHAR(50);
    DECLARE v_base_metric_name VARCHAR(50);
    DECLARE v_base_ttm_metric_id INT;
    
    DECLARE v_records_processed INT DEFAULT 0;
    DECLARE v_total_metrics INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);


    DECLARE priority_5_cursor CURSOR FOR
        SELECT
            metric_id,
            name,
            base_metric_name
        FROM dim_metrics
        WHERE calculation_priority = 5
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
          AND base_metric_name IS NOT NULL
          AND CAST(name AS BINARY) LIKE CAST('%_3y_av' AS BINARY)
        ORDER BY name;


    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;

        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_5_for_company', 'ERROR',
                CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        ROLLBACK;
    END;


    SELECT ticker INTO @company_ticker
    FROM dim_companies
    WHERE company_id = p_company_id;


    SET v_session_id = CONCAT('P5_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;


    START TRANSACTION;

    main_block: BEGIN

        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_5_for_company', 'INFO',
                CONCAT('Starting Priority 5 3-year average calculations for company_id: ', p_company_id), 'START');


        IF @company_ticker IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, 'UNKNOWN', 'calculate_priority_5_for_company', 'ERROR',
                    CONCAT('Company_id ', p_company_id, ' not found in dim_companies'), 'VALIDATION');
            LEAVE main_block;
        END IF;


        SELECT COUNT(*) INTO v_total_metrics
        FROM dim_metrics
        WHERE calculation_priority = 5
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
          AND base_metric_name IS NOT NULL
          AND CAST(name AS BINARY) LIKE CAST('%_3y_av' AS BINARY);


        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_5_for_company', 'INFO',
                CONCAT('Found ', v_total_metrics, ' Priority 5 metrics to calculate'), 'METRICS_IDENTIFIED');


        OPEN priority_5_cursor;

        read_loop: LOOP
            FETCH priority_5_cursor INTO v_metric_id, v_metric_name, v_base_metric_name;

            IF done THEN
                LEAVE read_loop;
            END IF;


            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_5_for_company', 'INFO',
                    CONCAT('Processing metric: ', v_metric_name, ' (base: ', v_base_metric_name, ')'), v_metric_name, 'METRIC_START');


            
            SELECT metric_id INTO v_base_ttm_metric_id
            FROM dim_metrics
            WHERE CAST(name AS BINARY) = CAST(v_base_metric_name AS BINARY);
            

            IF v_base_ttm_metric_id IS NULL THEN
                INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
                VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_5_for_company', 'WARNING',
                        CONCAT('Missing base TTM metric: ', v_base_metric_name), v_metric_name, 'DEPENDENCY_MISSING');
                ITERATE read_loop;
            END IF;


            DELETE FROM fact_metrics
            WHERE metric_id = v_metric_id
              AND report_id IN (
                  SELECT report_id FROM fact_reports
                  WHERE company_id = p_company_id
              );


            
            
            INSERT INTO fact_metrics (
                report_id,
                metric_id,
                value,
                source_flag,
                calculation_date,
                notes
            )
            SELECT
                ttm_current.report_id,
                v_metric_id,
                (
                    CASE
                        
                        WHEN ttm_current.value IS NOT NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12) IS NOT NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24) IS NOT NULL
                        THEN (ttm_current.value
                              + get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12)
                              + get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24)) / 3
                        
                        WHEN ttm_current.value IS NOT NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12) IS NOT NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24) IS NULL
                        THEN (ttm_current.value
                              + get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12)) / 2
                        
                        WHEN ttm_current.value IS NOT NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12) IS NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24) IS NOT NULL
                        THEN (ttm_current.value
                              + get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24)) / 2
                        
                        WHEN ttm_current.value IS NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12) IS NOT NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24) IS NOT NULL
                        THEN (get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12)
                              + get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24)) / 2
                        
                        WHEN ttm_current.value IS NOT NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12) IS NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24) IS NULL
                        THEN ttm_current.value
                        
                        WHEN ttm_current.value IS NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12) IS NOT NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24) IS NULL
                        THEN get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12)
                        
                        WHEN ttm_current.value IS NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12) IS NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24) IS NOT NULL
                        THEN get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24)
                        ELSE NULL
                    END
                ),
                'CALCULATED_3Y_AVG_DYNAMIC',
                NOW(),
                CONCAT(
                    'Dynamic 3-year average: ',
                    CASE
                        WHEN ttm_current.value IS NOT NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12) IS NOT NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24) IS NOT NULL
                        THEN CONCAT('3 components: current=', ROUND(ttm_current.value, 2),
                                    ', 12m=', ROUND(get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12), 2),
                                    ', 24m=', ROUND(get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24), 2))
                        WHEN ttm_current.value IS NOT NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12) IS NOT NULL
                        THEN CONCAT('2 components: current=', ROUND(ttm_current.value, 2),
                                    ', 12m=', ROUND(get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12), 2))
                        WHEN ttm_current.value IS NOT NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24) IS NOT NULL
                        THEN CONCAT('2 components: current=', ROUND(ttm_current.value, 2),
                                    ', 24m=', ROUND(get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24), 2))
                        WHEN get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12) IS NOT NULL
                             AND get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24) IS NOT NULL
                        THEN CONCAT('2 components: 12m=', ROUND(get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12), 2),
                                    ', 24m=', ROUND(get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24), 2))
                        WHEN ttm_current.value IS NOT NULL
                        THEN CONCAT('1 component: current=', ROUND(ttm_current.value, 2))
                        WHEN get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12) IS NOT NULL
                        THEN CONCAT('1 component: 12m=', ROUND(get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12), 2))
                        WHEN get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24) IS NOT NULL
                        THEN CONCAT('1 component: 24m=', ROUND(get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24), 2))
                        ELSE 'ERROR: No components available'
                    END
                )
            FROM fact_metrics ttm_current
            JOIN fact_reports fr ON ttm_current.report_id = fr.report_id
            WHERE ttm_current.metric_id = v_base_ttm_metric_id
              AND fr.company_id = p_company_id
              
              AND (
                  ttm_current.value IS NOT NULL
                  OR get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 12) IS NOT NULL
                  OR get_historical_calculated_metric(ttm_current.report_id, v_base_metric_name, 24) IS NOT NULL
              );


            SET v_records_processed = ROW_COUNT();


            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_5_for_company', 'SUCCESS',
                    CONCAT('Completed ', v_metric_name, ': ', v_records_processed, ' 3-year average values calculated'), v_metric_name, v_records_processed, 'METRIC_COMPLETE');

        END LOOP;

        CLOSE priority_5_cursor;

    END main_block;


    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;


    COMMIT;


    SET @execution_time = TIMESTAMPDIFF(SECOND, v_start_time, NOW());


    SELECT COUNT(*) INTO @total_priority_5_values
    FROM fact_metrics fm
    JOIN fact_reports fr ON fm.report_id = fr.report_id
    JOIN dim_metrics dm ON fm.metric_id = dm.metric_id
    WHERE fr.company_id = p_company_id
      AND dm.calculation_priority = 5;


    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_5_for_company', 'SUCCESS',
            CONCAT('Priority 5 3-year average calculations completed. Total values: ', @total_priority_5_values,
                   ', Execution time: ', @execution_time, ' seconds'), @total_priority_5_values, 'FINAL_SUMMARY');

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_6_for_company`(
    IN p_company_id INT
)
BEGIN
    -- Variable declarations
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_metric_id INT;
    DECLARE v_metric_name VARCHAR(50);
    DECLARE v_records_processed INT DEFAULT 0;
    DECLARE v_total_metrics INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);
    
    -- Component metric IDs for dependencies
    DECLARE v_current_assets_id INT DEFAULT NULL;
    DECLARE v_non_current_assets_id INT DEFAULT NULL;
    DECLARE v_current_liabilities_id INT DEFAULT NULL;
    DECLARE v_non_current_liabilities_id INT DEFAULT NULL;
    DECLARE v_operating_cash_flow_ttm_id INT DEFAULT NULL;
    DECLARE v_capital_expenditure_3y_av_id INT DEFAULT NULL;
    DECLARE v_emp_stock_plans_ttm_id INT DEFAULT NULL;
    DECLARE v_restricted_cash_id INT DEFAULT NULL;
    DECLARE v_interest_income_ttm_id INT DEFAULT NULL;
    DECLARE v_base_rate_id INT DEFAULT NULL;
    DECLARE v_cash_id INT DEFAULT NULL;
    
    -- Cursor declaration MUST come before handlers
    DECLARE priority_6_cursor CURSOR FOR
        SELECT 
            metric_id,
            name
        FROM dim_metrics
        WHERE calculation_priority = 6
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
        ORDER BY name;
    
    -- Handler declarations MUST come after cursor declarations
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;
        -- Log error to table (no SELECT statement)
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_6_for_company', 'ERROR', 
               CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        ROLLBACK;
    END;
    
    -- Get company ticker for logging
    SELECT ticker INTO @company_ticker 
    FROM dim_companies 
    WHERE company_id = p_company_id;
    
    -- Initialize session and variables
    SET v_session_id = CONCAT('P6_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;
    
    -- Start transaction
    START TRANSACTION;
    
    main_block: BEGIN
        -- Log procedure start
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_6_for_company', 'INFO', 
                CONCAT('Starting Priority 6 calculations for company_id: ', p_company_id), 'START');
        
        -- Validate company exists
        IF @company_ticker IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, 'UNKNOWN', 'calculate_priority_6_for_company', 'ERROR', 
                    CONCAT('Company_id ', p_company_id, ' not found in dim_companies'), 'VALIDATION');
            LEAVE main_block;
        END IF;
        
        -- Count metrics to process
        SELECT COUNT(*) INTO v_total_metrics
        FROM dim_metrics
        WHERE calculation_priority = 6
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY);
        
        -- Log metrics to process
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_6_for_company', 'INFO', 
                CONCAT('Found ', v_total_metrics, ' Priority 6 metrics to calculate'), 'METRICS_IDENTIFIED');
        
        -- ===================================================================
        -- RESOLVE COMPONENT METRIC IDs (Priority 1, 3, and 5 dependencies)
        -- ===================================================================
        
        -- Priority 1 balance sheet components for equity calculation
        SELECT metric_id INTO v_current_assets_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('current_assets' AS BINARY);
        SELECT metric_id INTO v_non_current_assets_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('non_current_assets' AS BINARY);
        SELECT metric_id INTO v_current_liabilities_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('current_liabilities' AS BINARY);
        SELECT metric_id INTO v_non_current_liabilities_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('non_current_liabilities' AS BINARY);
        
        -- Priority 3 and 5 components for free_cash_flow calculation
        SELECT metric_id INTO v_operating_cash_flow_ttm_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('operating_cash_flow_ttm' AS BINARY);
        SELECT metric_id INTO v_capital_expenditure_3y_av_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('capital_expenditure_3y_av' AS BINARY);
        SELECT metric_id INTO v_emp_stock_plans_ttm_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('emp_stock_plans_ttm' AS BINARY);
        
        -- Priority 1 and 3 components for excess_cash calculation
        SELECT metric_id INTO v_restricted_cash_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('restricted_cash' AS BINARY);
        SELECT metric_id INTO v_interest_income_ttm_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('interest_income_ttm' AS BINARY);
        SELECT metric_id INTO v_base_rate_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('base_rate' AS BINARY);
        SELECT metric_id INTO v_cash_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('cash' AS BINARY);
        
        -- Log dependency resolution status
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_6_for_company', 'INFO', 
                CONCAT('Dependency resolution: equity components=', 
                       CASE WHEN v_current_assets_id IS NOT NULL AND v_non_current_assets_id IS NOT NULL AND 
                                 v_current_liabilities_id IS NOT NULL AND v_non_current_liabilities_id IS NOT NULL THEN 'OK' ELSE 'MISSING' END,
                       ', FCF components=',
                       CASE WHEN v_operating_cash_flow_ttm_id IS NOT NULL AND v_capital_expenditure_3y_av_id IS NOT NULL THEN 'OK' ELSE 'MISSING' END,
                       ', emp_stock_plans_ttm=',
                       CASE WHEN v_emp_stock_plans_ttm_id IS NOT NULL THEN 'OK' ELSE 'OPTIONAL' END,
                       ', excess_cash components=',
                       CASE WHEN v_restricted_cash_id IS NOT NULL AND v_interest_income_ttm_id IS NOT NULL AND 
                                 v_base_rate_id IS NOT NULL AND v_cash_id IS NOT NULL THEN 'OK' ELSE 'MISSING' END), 'DEPENDENCIES');
        
        -- ===================================================================
        -- PROCESS EACH PRIORITY 6 METRIC
        -- ===================================================================
        
        OPEN priority_6_cursor;
        
        read_loop: LOOP
            FETCH priority_6_cursor INTO v_metric_id, v_metric_name;
            
            IF done THEN
                LEAVE read_loop;
            END IF;
            
            -- Log processing start for this metric
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_6_for_company', 'INFO', 
                    CONCAT('Processing metric: ', v_metric_name), v_metric_name, 'METRIC_START');
            
            -- Clear existing Priority 6 values for this metric and company
            DELETE FROM fact_metrics 
            WHERE metric_id = v_metric_id
              AND report_id IN (
                  SELECT report_id FROM fact_reports 
                  WHERE company_id = p_company_id
              );
            
            -- ===============================================================
            -- EQUITY CALCULATION
            -- ===============================================================
            IF CAST(v_metric_name AS BINARY) = CAST('equity' AS BINARY) THEN
                
                -- Validate all equity dependencies exist
                IF v_current_assets_id IS NULL OR v_non_current_assets_id IS NULL OR 
                   v_current_liabilities_id IS NULL OR v_non_current_liabilities_id IS NULL THEN
                    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
                    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_6_for_company', 'WARNING', 
                            CONCAT('Missing equity dependency components for ', v_metric_name), v_metric_name, 'DEPENDENCY_MISSING');
                    ITERATE read_loop;
                END IF;
                
                -- Calculate equity = current_assets + non_current_assets - current_liabilities - non_current_liabilities
                INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
                SELECT 
                    r.report_id,
                    v_metric_id,
                    (current_assets.value + non_current_assets.value - current_liabilities.value - non_current_liabilities.value) AS equity_value,
                    'CALCULATED_P6',
                    NOW(),
                    CONCAT('Priority 6: Equity = Assets - Liabilities (', 
                           COALESCE(current_assets.value, 0), ' + ', COALESCE(non_current_assets.value, 0), 
                           ' - ', COALESCE(current_liabilities.value, 0), ' - ', COALESCE(non_current_liabilities.value, 0), ')')
                FROM fact_reports r
                JOIN fact_metrics current_assets ON r.report_id = current_assets.report_id AND current_assets.metric_id = v_current_assets_id
                JOIN fact_metrics non_current_assets ON r.report_id = non_current_assets.report_id AND non_current_assets.metric_id = v_non_current_assets_id
                JOIN fact_metrics current_liabilities ON r.report_id = current_liabilities.report_id AND current_liabilities.metric_id = v_current_liabilities_id
                JOIN fact_metrics non_current_liabilities ON r.report_id = non_current_liabilities.report_id AND non_current_liabilities.metric_id = v_non_current_liabilities_id
                WHERE r.company_id = p_company_id
                  -- All components must be non-null for equity calculation
                  AND current_assets.value IS NOT NULL
                  AND non_current_assets.value IS NOT NULL
                  AND current_liabilities.value IS NOT NULL
                  AND non_current_liabilities.value IS NOT NULL;
            
            -- ===============================================================
            -- FREE CASH FLOW CALCULATION (MODIFIED - emp_stock_plans_ttm OPTIONAL)
            -- ===============================================================
            ELSEIF CAST(v_metric_name AS BINARY) = CAST('free_cash_flow' AS BINARY) THEN
                
                -- Validate REQUIRED FCF dependencies exist (emp_stock_plans_ttm is now optional)
                IF v_operating_cash_flow_ttm_id IS NULL OR v_capital_expenditure_3y_av_id IS NULL THEN
                    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
                    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_6_for_company', 'WARNING', 
                            CONCAT('Missing required free cash flow dependency components for ', v_metric_name), v_metric_name, 'DEPENDENCY_MISSING');
                    ITERATE read_loop;
                END IF;
                
                -- Calculate free_cash_flow = operating_cash_flow_ttm + capital_expenditure_3y_av + emp_stock_plans_ttm (optional)
                INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
                SELECT 
                    r.report_id,
                    v_metric_id,
                    (ocf_ttm.value + capex_3y.value + COALESCE(emp_stock.value, 0)) AS free_cash_flow_value,
                    'CALCULATED_P6',
                    NOW(),
                    CONCAT('Priority 6: FCF = OCF_TTM + CapEx_3Y_Avg + EmpStock_TTM (', 
                           COALESCE(ocf_ttm.value, 0), ' + ', COALESCE(capex_3y.value, 0), 
                           ' + ', COALESCE(emp_stock.value, 0), 
                           CASE WHEN emp_stock.value IS NULL THEN ' [emp_stock_plans_ttm: NULL - treated as 0]' ELSE '' END, ')')
                FROM fact_reports r
                JOIN fact_metrics ocf_ttm ON r.report_id = ocf_ttm.report_id AND ocf_ttm.metric_id = v_operating_cash_flow_ttm_id
                JOIN fact_metrics capex_3y ON r.report_id = capex_3y.report_id AND capex_3y.metric_id = v_capital_expenditure_3y_av_id
                LEFT JOIN fact_metrics emp_stock ON r.report_id = emp_stock.report_id AND emp_stock.metric_id = v_emp_stock_plans_ttm_id
                WHERE r.company_id = p_company_id
                  -- Only the required components must be non-null for FCF calculation
                  AND ocf_ttm.value IS NOT NULL
                  AND capex_3y.value IS NOT NULL;
                  -- emp_stock.value can be NULL (will be treated as 0 via COALESCE)
            
            -- ===============================================================
            -- EXCESS CASH CALCULATION
            -- ===============================================================
            ELSEIF CAST(v_metric_name AS BINARY) = CAST('excess_cash' AS BINARY) THEN
                
                -- Validate all excess cash dependencies exist
                IF v_restricted_cash_id IS NULL OR v_interest_income_ttm_id IS NULL OR 
                   v_base_rate_id IS NULL OR v_cash_id IS NULL THEN
                    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
                    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_6_for_company', 'WARNING', 
                            CONCAT('Missing excess cash dependency components for ', v_metric_name), v_metric_name, 'DEPENDENCY_MISSING');
                    ITERATE read_loop;
                END IF;
                
                -- Calculate excess_cash using complex conditional logic
                INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
                SELECT 
                    r.report_id,
                    v_metric_id,
                    CASE 
                        -- Condition 1: If restricted cash > 100,000, use restricted cash
                        WHEN COALESCE(restricted_cash.value, 0) > 100000 THEN restricted_cash.value
                        
                        -- Condition 2: If interest earning capacity > total cash, use 80% of total cash
                        WHEN (COALESCE(interest_income.value, 0) / (COALESCE(base_rate.value, 0) + 0.01)) > 
                             (COALESCE(cash.value, 0) + COALESCE(restricted_cash.value, 0)) THEN
                            0.8 * (COALESCE(cash.value, 0) + COALESCE(restricted_cash.value, 0))
                        
                        -- Condition 3: Default to interest earning capacity
                        ELSE (COALESCE(interest_income.value, 0) / (COALESCE(base_rate.value, 0) + 0.01))
                    END AS excess_cash_value,
                    'CALCULATED_P6',
                    NOW(),
                    CONCAT('Priority 6: Excess Cash - Conditional logic with restricted=', 
                           COALESCE(restricted_cash.value, 0), ', interest=', COALESCE(interest_income.value, 0),
                           ', base_rate=', COALESCE(base_rate.value, 0), ', cash=', COALESCE(cash.value, 0))
                FROM fact_reports r
                LEFT JOIN fact_metrics restricted_cash ON r.report_id = restricted_cash.report_id AND restricted_cash.metric_id = v_restricted_cash_id
                LEFT JOIN fact_metrics interest_income ON r.report_id = interest_income.report_id AND interest_income.metric_id = v_interest_income_ttm_id
                LEFT JOIN fact_metrics base_rate ON r.report_id = base_rate.report_id AND base_rate.metric_id = v_base_rate_id
                LEFT JOIN fact_metrics cash ON r.report_id = cash.report_id AND cash.metric_id = v_cash_id
                WHERE r.company_id = p_company_id
                  -- At least one component must exist for excess cash calculation
                  AND (restricted_cash.value IS NOT NULL OR interest_income.value IS NOT NULL OR 
                       base_rate.value IS NOT NULL OR cash.value IS NOT NULL)
                  -- Protect against division by zero
                  AND (COALESCE(base_rate.value, 0) + 0.01) != 0;
            
            END IF;
            
            -- Count records processed for this metric
            SET v_records_processed = ROW_COUNT();
            
            -- Log completion for this metric
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_6_for_company', 'SUCCESS', 
                    CONCAT('Completed ', v_metric_name, ': ', v_records_processed, ' values calculated'), v_metric_name, v_records_processed, 'METRIC_COMPLETE');
            
        END LOOP;
        
        CLOSE priority_6_cursor;
        
    END main_block;
    
    -- Restore safe updates setting
    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    
    -- Commit transaction
    COMMIT;
    
    -- ===================================================================
    -- FINAL SUMMARY (using logging table only - NO SELECT statements)
    -- ===================================================================
    
    -- Calculate execution time
    SET @execution_time = TIMESTAMPDIFF(SECOND, v_start_time, NOW());
    
    -- Count final results
    SELECT COUNT(*) INTO @total_priority_6_values
    FROM fact_metrics fm
    JOIN fact_reports fr ON fm.report_id = fr.report_id
    JOIN dim_metrics dm ON fm.metric_id = dm.metric_id
    WHERE fr.company_id = p_company_id
      AND dm.calculation_priority = 6;
    
    -- Log final summary (NO SELECT statement - just INSERT)
    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_6_for_company', 'SUCCESS', 
            CONCAT('Priority 6 calculations completed. Total values: ', @total_priority_6_values, 
                   ', Execution time: ', @execution_time, ' seconds'), @total_priority_6_values, 'FINAL_SUMMARY');

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_7_for_company`(
    IN p_company_id INT
)
BEGIN
    -- Variable declarations
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_metric_id INT;
    DECLARE v_metric_name VARCHAR(50);
    DECLARE v_records_processed INT DEFAULT 0;
    DECLARE v_total_metrics INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);
    
    -- Component metric IDs for dependencies (Priority 1, 3, and 6)
    DECLARE v_share_price_id INT DEFAULT NULL;
    DECLARE v_exchange_rate_id INT DEFAULT NULL;
    DECLARE v_free_cash_flow_id INT DEFAULT NULL;
    DECLARE v_diluted_shares_id INT DEFAULT NULL;
    DECLARE v_current_assets_id INT DEFAULT NULL;
    DECLARE v_non_current_assets_id INT DEFAULT NULL;
    DECLARE v_excess_cash_id INT DEFAULT NULL;
    DECLARE v_goodwill_id INT DEFAULT NULL;
    DECLARE v_equity_id INT DEFAULT NULL;
    DECLARE v_current_liabilities_id INT DEFAULT NULL;
    DECLARE v_short_term_debt_id INT DEFAULT NULL;
    DECLARE v_ppe_id INT DEFAULT NULL;
    DECLARE v_revenue_ttm_id INT DEFAULT NULL;
    DECLARE v_long_term_debt_id INT DEFAULT NULL;
    
    -- Cursor declaration MUST come before handlers
    DECLARE priority_7_cursor CURSOR FOR
        SELECT 
            metric_id,
            name
        FROM dim_metrics
        WHERE calculation_priority = 7
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
        ORDER BY name;
    
    -- Handler declarations MUST come after cursor declarations
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;
        -- Log error to table (no SELECT statement)
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_7_for_company', 'ERROR', 
               CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        ROLLBACK;
    END;
    
    -- Get company ticker for logging
    SELECT ticker INTO @company_ticker 
    FROM dim_companies 
    WHERE company_id = p_company_id;
    
    -- Initialize session and variables
    SET v_session_id = CONCAT('P7_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;
    
    -- Start transaction
    START TRANSACTION;
    
    main_block: BEGIN
        -- Log procedure start
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_7_for_company', 'INFO', 
                CONCAT('Starting Priority 7 calculations for company_id: ', p_company_id), 'START');
        
        -- Validate company exists
        IF @company_ticker IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, 'UNKNOWN', 'calculate_priority_7_for_company', 'ERROR', 
                    CONCAT('Company_id ', p_company_id, ' not found in dim_companies'), 'VALIDATION');
            LEAVE main_block;
        END IF;
        
        -- Count metrics to process
        SELECT COUNT(*) INTO v_total_metrics
        FROM dim_metrics
        WHERE calculation_priority = 7
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY);
        
        -- Log metrics to process
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_7_for_company', 'INFO', 
                CONCAT('Found ', v_total_metrics, ' Priority 7 metrics to calculate'), 'METRICS_IDENTIFIED');
        
        -- ===================================================================
        -- RESOLVE COMPONENT METRIC IDs (Dependencies from various priorities)
        -- ===================================================================
        
        -- Priority 1 base metrics
        SELECT metric_id INTO v_share_price_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('share_price' AS BINARY);
        SELECT metric_id INTO v_exchange_rate_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('exchange_rate' AS BINARY);
        SELECT metric_id INTO v_diluted_shares_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('diluted_shares' AS BINARY);
        SELECT metric_id INTO v_current_assets_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('current_assets' AS BINARY);
        SELECT metric_id INTO v_non_current_assets_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('non_current_assets' AS BINARY);
        SELECT metric_id INTO v_current_liabilities_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('current_liabilities' AS BINARY);
        SELECT metric_id INTO v_short_term_debt_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('short_term_debt' AS BINARY);
        SELECT metric_id INTO v_ppe_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('ppe' AS BINARY);
        SELECT metric_id INTO v_goodwill_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('goodwill' AS BINARY);
        SELECT metric_id INTO v_long_term_debt_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('long_term_debt' AS BINARY);
        
        -- Priority 3 TTM metrics
        SELECT metric_id INTO v_revenue_ttm_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('revenue_ttm' AS BINARY);
        
        -- Priority 6 calculated metrics
        SELECT metric_id INTO v_free_cash_flow_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('free_cash_flow' AS BINARY);
        SELECT metric_id INTO v_equity_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('equity' AS BINARY);
        SELECT metric_id INTO v_excess_cash_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('excess_cash' AS BINARY);
        
        -- Log dependency resolution
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_7_for_company', 'INFO', 
                CONCAT('Resolved component metric IDs: share_price(', IFNULL(v_share_price_id, 'NULL'), 
                      '), free_cash_flow(', IFNULL(v_free_cash_flow_id, 'NULL'), 
                      '), equity(', IFNULL(v_equity_id, 'NULL'), ')'), 'DEPENDENCIES_RESOLVED');
        
        -- ===================================================================
        -- CLEAR EXISTING PRIORITY 7 VALUES FOR THIS COMPANY
        -- ===================================================================
        
        DELETE fact_metrics
        FROM fact_metrics
        JOIN fact_reports ON fact_metrics.report_id = fact_reports.report_id
        JOIN dim_metrics ON fact_metrics.metric_id = dim_metrics.metric_id
        WHERE fact_reports.company_id = p_company_id
          AND dim_metrics.calculation_priority = 7;
        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_7_for_company', 'INFO', 
                CONCAT('Cleared existing Priority 7 values: ', ROW_COUNT(), ' records deleted'), 'CLEANUP');
        
        -- ===================================================================
        -- PROCESS EACH PRIORITY 7 METRIC
        -- ===================================================================
        
        OPEN priority_7_cursor;
        
        read_loop: LOOP
            FETCH priority_7_cursor INTO v_metric_id, v_metric_name;
            
            IF done THEN
                LEAVE read_loop;
            END IF;
            
            -- Log current metric processing
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_7_for_company', 'INFO', 
                    CONCAT('Processing metric: ', v_metric_name), v_metric_name, 'METRIC_START');
            
            -- ===================================================================
            -- METRIC-SPECIFIC CALCULATIONS
            -- ===================================================================
            
            -- ADJUSTED PRICE: share_price * exchange_rate (or share_price if no exchange_rate)
            IF CAST(v_metric_name AS BINARY) = CAST('adjusted_price' AS BINARY) THEN
                INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
                SELECT 
                    r.report_id,
                    v_metric_id,
                    CASE 
                        WHEN share_price.value IS NULL THEN NULL
                        WHEN exchange_rate.value IS NULL THEN share_price.value
                        ELSE share_price.value * exchange_rate.value
                    END,
                    'CALCULATED_ADJ_PRICE',
                    NOW(),
                    CONCAT('Adjusted price calculation - Share price: ', IFNULL(share_price.value, 'NULL'), 
                          ', Exchange rate: ', IFNULL(exchange_rate.value, 'NULL'))
                FROM fact_reports r
                LEFT JOIN fact_metrics share_price ON r.report_id = share_price.report_id AND share_price.metric_id = v_share_price_id
                LEFT JOIN fact_metrics exchange_rate ON r.report_id = exchange_rate.report_id AND exchange_rate.metric_id = v_exchange_rate_id
                WHERE r.company_id = p_company_id
                  AND share_price.value IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM fact_metrics existing_fm
                      WHERE existing_fm.report_id = r.report_id
                        AND existing_fm.metric_id = v_metric_id
                  );
            
            -- EPS: free_cash_flow / diluted_shares
            ELSEIF CAST(v_metric_name AS BINARY) = CAST('eps' AS BINARY) THEN
                INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
                SELECT 
                    r.report_id,
                    v_metric_id,
                    CASE 
                        WHEN free_cash_flow.value IS NULL OR diluted_shares.value IS NULL THEN NULL
                        WHEN diluted_shares.value = 0 THEN NULL
                        ELSE free_cash_flow.value / diluted_shares.value
                    END,
                    'CALCULATED_EPS',
                    NOW(),
                    CONCAT('EPS calculation - FCF: ', IFNULL(free_cash_flow.value, 'NULL'), 
                          ', Diluted shares: ', IFNULL(diluted_shares.value, 'NULL'))
                FROM fact_reports r
                LEFT JOIN fact_metrics free_cash_flow ON r.report_id = free_cash_flow.report_id AND free_cash_flow.metric_id = v_free_cash_flow_id
                LEFT JOIN fact_metrics diluted_shares ON r.report_id = diluted_shares.report_id AND diluted_shares.metric_id = v_diluted_shares_id
                WHERE r.company_id = p_company_id
                  AND free_cash_flow.value IS NOT NULL
                  AND diluted_shares.value IS NOT NULL
                  AND diluted_shares.value > 0
                  AND NOT EXISTS (
                      SELECT 1 FROM fact_metrics existing_fm
                      WHERE existing_fm.report_id = r.report_id
                        AND existing_fm.metric_id = v_metric_id
                  );
            
            -- ROA: free_cash_flow / (current_assets + non_current_assets - excess_cash - goodwill)
            ELSEIF CAST(v_metric_name AS BINARY) = CAST('roa' AS BINARY) THEN
                INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
                SELECT 
                    r.report_id,
                    v_metric_id,
                    CASE 
                        WHEN free_cash_flow.value IS NULL OR current_assets.value IS NULL OR non_current_assets.value IS NULL THEN NULL
                        WHEN (current_assets.value + non_current_assets.value - IFNULL(excess_cash.value, 0) - IFNULL(goodwill.value, 0)) <= 0 THEN NULL
                        ELSE free_cash_flow.value / (current_assets.value + non_current_assets.value - IFNULL(excess_cash.value, 0) - IFNULL(goodwill.value, 0))
                    END,
                    'CALCULATED_ROA',
                    NOW(),
                    CONCAT('ROA calculation - FCF: ', IFNULL(free_cash_flow.value, 'NULL'), 
                          ', Total assets: ', IFNULL(current_assets.value + non_current_assets.value, 'NULL'),
                          ', Excess cash: ', IFNULL(excess_cash.value, 'NULL'),
                          ', Goodwill: ', IFNULL(goodwill.value, 'NULL'))
                FROM fact_reports r
                LEFT JOIN fact_metrics free_cash_flow ON r.report_id = free_cash_flow.report_id AND free_cash_flow.metric_id = v_free_cash_flow_id
                LEFT JOIN fact_metrics current_assets ON r.report_id = current_assets.report_id AND current_assets.metric_id = v_current_assets_id
                LEFT JOIN fact_metrics non_current_assets ON r.report_id = non_current_assets.report_id AND non_current_assets.metric_id = v_non_current_assets_id
                LEFT JOIN fact_metrics excess_cash ON r.report_id = excess_cash.report_id AND excess_cash.metric_id = v_excess_cash_id
                LEFT JOIN fact_metrics goodwill ON r.report_id = goodwill.report_id AND goodwill.metric_id = v_goodwill_id
                WHERE r.company_id = p_company_id
                  AND free_cash_flow.value IS NOT NULL
                  AND current_assets.value IS NOT NULL
                  AND non_current_assets.value IS NOT NULL
                  AND (current_assets.value + non_current_assets.value - IFNULL(excess_cash.value, 0) - IFNULL(goodwill.value, 0)) > 0
                  AND NOT EXISTS (
                      SELECT 1 FROM fact_metrics existing_fm
                      WHERE existing_fm.report_id = r.report_id
                        AND existing_fm.metric_id = v_metric_id
                  );
            
            -- ROE: free_cash_flow / equity
            ELSEIF CAST(v_metric_name AS BINARY) = CAST('roe' AS BINARY) THEN
                INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
                SELECT 
                    r.report_id,
                    v_metric_id,
                    CASE 
                        WHEN free_cash_flow.value IS NULL OR equity.value IS NULL THEN NULL
                        WHEN equity.value <= 0 THEN NULL
                        ELSE free_cash_flow.value / equity.value
                    END,
                    'CALCULATED_ROE',
                    NOW(),
                    CONCAT('ROE calculation - FCF: ', IFNULL(free_cash_flow.value, 'NULL'), 
                          ', Equity: ', IFNULL(equity.value, 'NULL'))
                FROM fact_reports r
                LEFT JOIN fact_metrics free_cash_flow ON r.report_id = free_cash_flow.report_id AND free_cash_flow.metric_id = v_free_cash_flow_id
                LEFT JOIN fact_metrics equity ON r.report_id = equity.report_id AND equity.metric_id = v_equity_id
                WHERE r.company_id = p_company_id
                  AND free_cash_flow.value IS NOT NULL
                  AND equity.value IS NOT NULL
                  AND equity.value > 0
                  AND NOT EXISTS (
                      SELECT 1 FROM fact_metrics existing_fm
                      WHERE existing_fm.report_id = r.report_id
                        AND existing_fm.metric_id = v_metric_id
                  );
            
            -- ROIC: free_cash_flow / invested_capital
            -- Invested Capital = current_assets - current_liabilities - excess_cash + short_term_debt + ppe
            ELSEIF CAST(v_metric_name AS BINARY) = CAST('roic' AS BINARY) THEN
                INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
                SELECT 
                    r.report_id,
                    v_metric_id,
                    CASE 
                        WHEN free_cash_flow.value IS NULL OR current_assets.value IS NULL OR current_liabilities.value IS NULL OR ppe.value IS NULL THEN NULL
                        WHEN (current_assets.value - current_liabilities.value - IFNULL(excess_cash.value, 0) + IFNULL(short_term_debt.value, 0) + ppe.value) <= 0 THEN 
                            CASE 
                                WHEN free_cash_flow.value < 0 THEN NULL
                                ELSE 100  -- Exceptional performance: positive FCF with negative invested capital
                            END
                        ELSE free_cash_flow.value / (current_assets.value - current_liabilities.value - IFNULL(excess_cash.value, 0) + IFNULL(short_term_debt.value, 0) + ppe.value)
                    END,
                    'CALCULATED_ROIC',
                    NOW(),
                    CONCAT('ROIC calculation - FCF: ', IFNULL(free_cash_flow.value, 'NULL'), 
                          ', Invested Capital: ', IFNULL(current_assets.value - current_liabilities.value - IFNULL(excess_cash.value, 0) + IFNULL(short_term_debt.value, 0) + ppe.value, 'NULL'))
                FROM fact_reports r
                LEFT JOIN fact_metrics free_cash_flow ON r.report_id = free_cash_flow.report_id AND free_cash_flow.metric_id = v_free_cash_flow_id
                LEFT JOIN fact_metrics current_assets ON r.report_id = current_assets.report_id AND current_assets.metric_id = v_current_assets_id
                LEFT JOIN fact_metrics current_liabilities ON r.report_id = current_liabilities.report_id AND current_liabilities.metric_id = v_current_liabilities_id
                LEFT JOIN fact_metrics excess_cash ON r.report_id = excess_cash.report_id AND excess_cash.metric_id = v_excess_cash_id
                LEFT JOIN fact_metrics short_term_debt ON r.report_id = short_term_debt.report_id AND short_term_debt.metric_id = v_short_term_debt_id
                LEFT JOIN fact_metrics ppe ON r.report_id = ppe.report_id AND ppe.metric_id = v_ppe_id
                WHERE r.company_id = p_company_id
                  AND free_cash_flow.value IS NOT NULL
                  AND current_assets.value IS NOT NULL
                  AND current_liabilities.value IS NOT NULL
                  AND ppe.value IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM fact_metrics existing_fm
                      WHERE existing_fm.report_id = r.report_id
                        AND existing_fm.metric_id = v_metric_id
                  );
            
            -- EQUITY_SHARE: equity / diluted_shares
            ELSEIF CAST(v_metric_name AS BINARY) = CAST('equity_share' AS BINARY) THEN
                INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
                SELECT 
                    r.report_id,
                    v_metric_id,
                    CASE 
                        WHEN equity.value IS NULL OR diluted_shares.value IS NULL THEN NULL
                        WHEN diluted_shares.value = 0 THEN NULL
                        ELSE equity.value / diluted_shares.value
                    END,
                    'CALCULATED_EQUITY_SHARE',
                    NOW(),
                    CONCAT('Equity share calculation - Equity: ', IFNULL(equity.value, 'NULL'), 
                          ', Diluted shares: ', IFNULL(diluted_shares.value, 'NULL'))
                FROM fact_reports r
                LEFT JOIN fact_metrics equity ON r.report_id = equity.report_id AND equity.metric_id = v_equity_id
                LEFT JOIN fact_metrics diluted_shares ON r.report_id = diluted_shares.report_id AND diluted_shares.metric_id = v_diluted_shares_id
                WHERE r.company_id = p_company_id
                  AND equity.value IS NOT NULL
                  AND diluted_shares.value IS NOT NULL
                  AND diluted_shares.value > 0
                  AND NOT EXISTS (
                      SELECT 1 FROM fact_metrics existing_fm
                      WHERE existing_fm.report_id = r.report_id
                        AND existing_fm.metric_id = v_metric_id
                  );
            
            -- REVENUE_SHARE: revenue_ttm / diluted_shares
            ELSEIF CAST(v_metric_name AS BINARY) = CAST('revenue_share' AS BINARY) THEN
                INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
                SELECT 
                    r.report_id,
                    v_metric_id,
                    CASE 
                        WHEN revenue_ttm.value IS NULL OR diluted_shares.value IS NULL THEN NULL
                        WHEN diluted_shares.value = 0 THEN NULL
                        ELSE revenue_ttm.value / diluted_shares.value
                    END,
                    'CALCULATED_REVENUE_SHARE',
                    NOW(),
                    CONCAT('Revenue share calculation - Revenue TTM: ', IFNULL(revenue_ttm.value, 'NULL'), 
                          ', Diluted shares: ', IFNULL(diluted_shares.value, 'NULL'))
                FROM fact_reports r
                LEFT JOIN fact_metrics revenue_ttm ON r.report_id = revenue_ttm.report_id AND revenue_ttm.metric_id = v_revenue_ttm_id
                LEFT JOIN fact_metrics diluted_shares ON r.report_id = diluted_shares.report_id AND diluted_shares.metric_id = v_diluted_shares_id
                WHERE r.company_id = p_company_id
                  AND revenue_ttm.value IS NOT NULL
                  AND diluted_shares.value IS NOT NULL
                  AND diluted_shares.value > 0
                  AND NOT EXISTS (
                      SELECT 1 FROM fact_metrics existing_fm
                      WHERE existing_fm.report_id = r.report_id
                        AND existing_fm.metric_id = v_metric_id
                  );
            
            -- DEBT_EQUITY: (short_term_debt + long_term_debt) / equity
            ELSEIF CAST(v_metric_name AS BINARY) = CAST('debt_equity' AS BINARY) THEN
                INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
                SELECT 
                    r.report_id,
                    v_metric_id,
                    CASE 
                        WHEN equity.value IS NULL OR equity.value <= 0 THEN NULL
                        ELSE (IFNULL(short_term_debt.value, 0) + IFNULL(long_term_debt.value, 0)) / equity.value
                    END,
                    'CALCULATED_DEBT_EQUITY',
                    NOW(),
                    CONCAT('Debt/Equity calculation - Short-term debt: ', IFNULL(short_term_debt.value, 'NULL'), 
                          ', Long-term debt: ', IFNULL(long_term_debt.value, 'NULL'),
                          ', Equity: ', IFNULL(equity.value, 'NULL'))
                FROM fact_reports r
                LEFT JOIN fact_metrics equity ON r.report_id = equity.report_id AND equity.metric_id = v_equity_id
                LEFT JOIN fact_metrics short_term_debt ON r.report_id = short_term_debt.report_id AND short_term_debt.metric_id = v_short_term_debt_id
                LEFT JOIN fact_metrics long_term_debt ON r.report_id = long_term_debt.report_id AND long_term_debt.metric_id = v_long_term_debt_id
                WHERE r.company_id = p_company_id
                  AND equity.value IS NOT NULL
                  AND equity.value > 0
                  AND NOT EXISTS (
                      SELECT 1 FROM fact_metrics existing_fm
                      WHERE existing_fm.report_id = r.report_id
                        AND existing_fm.metric_id = v_metric_id
                  );
            
            ELSE
                -- Log unknown metric
                INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
                VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_7_for_company', 'WARNING', 
                        CONCAT('Unknown metric in Priority 7: ', v_metric_name), v_metric_name, 'UNKNOWN_METRIC');
            
            END IF;
            
            -- Count records processed for this metric
            SET v_records_processed = ROW_COUNT();
            
            -- Log completion for this metric
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_7_for_company', 'SUCCESS', 
                    CONCAT('Completed ', v_metric_name, ': ', v_records_processed, ' values calculated'), v_metric_name, v_records_processed, 'METRIC_COMPLETE');
            
        END LOOP;
        
        CLOSE priority_7_cursor;
        
    END main_block;
    
    -- Restore safe updates setting
    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    
    -- Commit transaction
    COMMIT;
    
    -- ===================================================================
    -- FINAL SUMMARY (using logging table only - NO SELECT statements)
    -- ===================================================================
    
    -- Calculate execution time
    SET @execution_time = TIMESTAMPDIFF(SECOND, v_start_time, NOW());
    
    -- Count final results
    SELECT COUNT(*) INTO @total_priority_7_values
    FROM fact_metrics fm
    JOIN fact_reports fr ON fm.report_id = fr.report_id
    JOIN dim_metrics dm ON fm.metric_id = dm.metric_id
    WHERE fr.company_id = p_company_id
      AND dm.calculation_priority = 7;
    
    -- Log final summary (NO SELECT statement - just INSERT)
    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_7_for_company', 'SUCCESS', 
            CONCAT('Priority 7 calculations completed. Total values: ', @total_priority_7_values, 
                  '. Execution time: ', @execution_time, ' seconds'), @total_priority_7_values, 'PROCEDURE_COMPLETE');

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_8_for_company`(
    IN p_company_id INT
)
BEGIN
    -- Variable declarations
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_metric_id INT;
    DECLARE v_metric_name VARCHAR(50);
    DECLARE v_base_metric_name VARCHAR(50);
    DECLARE v_time_offset_months INT;
    DECLARE v_time_forward_months INT;
    DECLARE v_base_metric_id INT;
    DECLARE v_records_processed INT DEFAULT 0;
    DECLARE v_total_metrics INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);
    
    -- Cursor declaration MUST come before handlers
    DECLARE priority_8_cursor CURSOR FOR
        SELECT 
            metric_id,
            name,
            base_metric_name,
            time_offset_months,
            time_forward_months
        FROM dim_metrics
        WHERE calculation_priority = 8
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
          AND is_time_series = 1
        ORDER BY base_metric_name, time_offset_months, time_forward_months;
    
    -- Handler declarations MUST come after cursor declarations
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;
        -- Log error to table (no SELECT statement)
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_8_for_company', 'ERROR', 
               CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        ROLLBACK;
    END;
    
    -- Get company ticker for logging
    SELECT ticker INTO @company_ticker 
    FROM dim_companies 
    WHERE company_id = p_company_id;
    
    -- Initialize session and variables
    SET v_session_id = CONCAT('P8_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;
    
    -- Start transaction
    START TRANSACTION;
    
    main_block: BEGIN
        -- Log procedure start
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_8_for_company', 'INFO', 
                CONCAT('Starting Priority 8 time-series calculations for company_id: ', p_company_id), 'START');
        
        -- Validate company exists
        IF @company_ticker IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, 'UNKNOWN', 'calculate_priority_8_for_company', 'ERROR', 
                    CONCAT('Company_id ', p_company_id, ' not found in dim_companies'), 'VALIDATION');
            LEAVE main_block;
        END IF;
        
        -- Count metrics to process
        SELECT COUNT(*) INTO v_total_metrics
        FROM dim_metrics
        WHERE calculation_priority = 8
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
          AND is_time_series = 1;
        
        -- Log metrics to process
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_8_for_company', 'INFO', 
                CONCAT('Found ', v_total_metrics, ' Priority 8 time-series metrics to calculate'), 'METRICS_IDENTIFIED');
        
        -- Clear existing Priority 8 values for this company
        DELETE FROM fact_metrics 
        WHERE metric_id IN (
            SELECT metric_id FROM dim_metrics 
            WHERE calculation_priority = 8
              AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
        )
        AND report_id IN (
            SELECT report_id FROM fact_reports 
            WHERE company_id = p_company_id
        );
        
        SET @cleared_count = ROW_COUNT();
        
        -- Log cleanup
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_8_for_company', 'INFO', 
                'Cleared existing priority 8 metrics for clean calculation', @cleared_count, 'CLEANUP');
        
        -- ===================================================================
        -- PROCESS EACH PRIORITY 8 METRIC
        -- ===================================================================
        
        OPEN priority_8_cursor;
        
        read_loop: LOOP
            FETCH priority_8_cursor INTO v_metric_id, v_metric_name, v_base_metric_name, v_time_offset_months, v_time_forward_months;
            
            IF done THEN
                LEAVE read_loop;
            END IF;
            
            -- Log current metric processing
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_8_for_company', 'INFO', 
                    CONCAT('Processing metric: ', v_metric_name, ' (base: ', v_base_metric_name, ')'), v_metric_name, 'METRIC_START');
            
            -- Get base metric ID
            SELECT metric_id INTO v_base_metric_id
            FROM dim_metrics
            WHERE CAST(name AS BINARY) = CAST(v_base_metric_name AS BINARY);
            
            IF v_base_metric_id IS NULL THEN
                INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
                VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_8_for_company', 'WARNING', 
                        CONCAT('Base metric not found: ', v_base_metric_name), v_metric_name, 'BASE_METRIC_LOOKUP');
                ITERATE read_loop;
            END IF;
            
            -- ===================================================================
            -- BACKWARD-LOOKING METRICS (time_offset_months)
            -- ===================================================================
            IF v_time_offset_months IS NOT NULL THEN
                
                -- Calculate years back from months
                SET @years_back = v_time_offset_months / 12;
                
                -- Insert historical values for this company
                INSERT INTO fact_metrics (
                    report_id,
                    metric_id,
                    value,
                    source_flag,
                    calculation_date,
                    notes
                )
                SELECT DISTINCT
                    current_reports.report_id,
                    v_metric_id,
                    historical_metric.value,
                    CASE 
                        WHEN v_time_offset_months = 12 THEN 'HISTORICAL_1Y'
                        WHEN v_time_offset_months = 24 THEN 'HISTORICAL_2Y'
                        WHEN v_time_offset_months = 36 THEN 'HISTORICAL_3Y'
                        WHEN v_time_offset_months = 48 THEN 'HISTORICAL_4Y'
                        ELSE CONCAT('HISTORICAL_', v_time_offset_months, 'M')
                    END,
                    NOW(),
                    CONCAT('Historical lookback: ', v_base_metric_name, ' from ', 
                           @years_back, ' years ago (', current_reports.financial_year, ' -> ', 
                           historical_reports.financial_year, ', report_type: ', current_reports.report_type, ')')
                FROM fact_reports current_reports
                JOIN fact_reports historical_reports ON (
                    historical_reports.company_id = current_reports.company_id
                    AND CAST(historical_reports.report_type AS BINARY) = CAST(current_reports.report_type AS BINARY)
                    AND historical_reports.financial_year = (current_reports.financial_year - @years_back)
                )
                JOIN fact_metrics historical_metric ON (
                    historical_metric.report_id = historical_reports.report_id
                    AND historical_metric.metric_id = v_base_metric_id
                    AND historical_metric.value IS NOT NULL
                )
                WHERE current_reports.company_id = p_company_id
                
                -- Handle multiple reports per year - take the most recent
                AND historical_reports.report_date = (
                    SELECT MAX(hr2.report_date)
                    FROM fact_reports hr2
                    WHERE hr2.company_id = current_reports.company_id
                      AND CAST(hr2.report_type AS BINARY) = CAST(current_reports.report_type AS BINARY)
                      AND hr2.financial_year = (current_reports.financial_year - @years_back)
                );
            
            -- ===================================================================
            -- FORWARD-LOOKING METRICS (time_forward_months)
            -- ===================================================================
            ELSEIF v_time_forward_months IS NOT NULL THEN
                
                -- Calculate years forward from months
                SET @years_forward = v_time_forward_months / 12;
                
                -- For 6-month forward, use special logic
                IF v_time_forward_months = 6 THEN
                    
                    -- =========================================================
                    -- FIXED: 6-month forward values
                    -- OLD: For each future report, find its immediate predecessor
                    -- NEW: For each current report, find its FIRST future report of different type
                    -- =========================================================
                    INSERT INTO fact_metrics (
                        report_id,
                        metric_id,
                        value,
                        source_flag,
                        calculation_date,
                        notes
                    )
                    SELECT DISTINCT
                        current_reports.report_id,
                        v_metric_id,
                        future_metric.value,
                        'FORWARD_6M',
                        NOW(),
                        CONCAT('6-month forward lookout: ', v_base_metric_name, 
                               ' (first next different type: ', current_reports.report_type, ' -> ', future_reports.report_type, ')')
                    FROM fact_reports current_reports
                    JOIN fact_reports future_reports ON (
                        future_reports.company_id = current_reports.company_id
                        AND CAST(future_reports.report_type AS BINARY) != CAST(current_reports.report_type AS BINARY)
                        -- FIXED: Find the FIRST (MIN) future report of different type for each current report
                        AND future_reports.report_date = (
                            SELECT MIN(fr2.report_date)
                            FROM fact_reports fr2
                            WHERE fr2.company_id = current_reports.company_id
                              AND fr2.report_date > current_reports.report_date
                              AND CAST(fr2.report_type AS BINARY) != CAST(current_reports.report_type AS BINARY)
                        )
                    )
                    JOIN fact_metrics future_metric ON (
                        future_metric.report_id = future_reports.report_id
                        AND future_metric.metric_id = v_base_metric_id
                        AND future_metric.value IS NOT NULL
                    )
                    WHERE current_reports.company_id = p_company_id;
                    
                ELSE
                    -- Insert standard forward values (12m, 24m forward) - same report_type
                    INSERT INTO fact_metrics (
                        report_id,
                        metric_id,
                        value,
                        source_flag,
                        calculation_date,
                        notes
                    )
                    SELECT DISTINCT
                        current_reports.report_id,
                        v_metric_id,
                        future_metric.value,
                        CASE 
                            WHEN v_time_forward_months = 12 THEN 'FORWARD_1Y'
                            WHEN v_time_forward_months = 24 THEN 'FORWARD_2Y'
                            ELSE CONCAT('FORWARD_', v_time_forward_months, 'M')
                        END,
                        NOW(),
                        CONCAT('Forward lookout: ', v_base_metric_name, ' from ', 
                               @years_forward, ' years later (', current_reports.financial_year, ' -> ', 
                               future_reports.financial_year, ', report_type: ', current_reports.report_type, ')')
                    FROM fact_reports current_reports
                    JOIN fact_reports future_reports ON (
                        future_reports.company_id = current_reports.company_id
                        AND CAST(future_reports.report_type AS BINARY) = CAST(current_reports.report_type AS BINARY)
                        AND future_reports.financial_year = (current_reports.financial_year + @years_forward)
                    )
                    JOIN fact_metrics future_metric ON (
                        future_metric.report_id = future_reports.report_id
                        AND future_metric.metric_id = v_base_metric_id
                        AND future_metric.value IS NOT NULL
                    )
                    WHERE current_reports.company_id = p_company_id
                    
                    -- Handle multiple reports per year - take the most recent
                    AND future_reports.report_date = (
                        SELECT MAX(fr2.report_date)
                        FROM fact_reports fr2
                        WHERE fr2.company_id = current_reports.company_id
                          AND CAST(fr2.report_type AS BINARY) = CAST(current_reports.report_type AS BINARY)
                          AND fr2.financial_year = (current_reports.financial_year + @years_forward)
                    );
                    
                END IF;
                
            ELSE
                -- Log unknown time configuration
                INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
                VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_8_for_company', 'WARNING', 
                        CONCAT('No time offset or forward months defined for metric: ', v_metric_name), v_metric_name, 'UNKNOWN_TIME_CONFIG');
                ITERATE read_loop;
            
            END IF;
            
            -- Count records processed for this metric
            SET v_records_processed = ROW_COUNT();
            
            -- Log completion for this metric
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, records_affected, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_8_for_company', 'SUCCESS', 
                    CONCAT('Completed ', v_metric_name, ': ', v_records_processed, ' values calculated'), v_metric_name, v_records_processed, 'METRIC_COMPLETE');
            
        END LOOP;
        
        CLOSE priority_8_cursor;
        
    END main_block;
    
    -- Restore safe updates setting
    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    
    -- Commit transaction
    COMMIT;
    
    -- ===================================================================
    -- FINAL SUMMARY (using logging table only - NO SELECT statements)
    -- ===================================================================
    
    -- Calculate execution time
    SET @execution_time = TIMESTAMPDIFF(SECOND, v_start_time, NOW());
    
    -- Count final results
    SELECT COUNT(*) INTO @total_priority_8_values
    FROM fact_metrics fm
    JOIN fact_reports fr ON fm.report_id = fr.report_id
    JOIN dim_metrics dm ON fm.metric_id = dm.metric_id
    WHERE fr.company_id = p_company_id
      AND dm.calculation_priority = 8;
    
    -- Log final summary (NO SELECT statement - just INSERT)
    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_8_for_company', 'SUCCESS', 
            CONCAT('Priority 8 time-series calculations completed. Total values: ', @total_priority_8_values, 
                   ', Execution time: ', @execution_time, ' seconds'), @total_priority_8_values, 'FINAL_SUMMARY');
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_96_rankings`()
BEGIN
    -- Variable declarations MUST come first
    DECLARE v_pe_rank_metric_id INT DEFAULT NULL;
    DECLARE v_roic_rank_metric_id INT DEFAULT NULL;
    DECLARE v_pe_metric_id INT DEFAULT NULL;
    DECLARE v_roic_metric_id INT DEFAULT NULL;
    DECLARE v_pe_rankings_created INT DEFAULT 0;
    DECLARE v_roic_rankings_created INT DEFAULT 0;
    DECLARE v_total_companies_ranked INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);
    
    -- Handler declarations MUST come after variable declarations
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;
        
        -- Log error to table (no SELECT statement)
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_96_rankings', 'ERROR', 
                CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        
        -- Restore safe updates setting
        SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
        ROLLBACK;
    END;
    
    -- Initialize session tracking
    SET v_session_id = CONCAT('PRI96_RANKS_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    
    -- Store original safe updates setting
    SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;
    
    START TRANSACTION;
    
    -- Log procedure start
    INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, 'calculate_priority_96_rankings', 'INFO', 
            'STARTING DATABASE-WIDE PRIORITY 96 RANKINGS for PRODUCTION tables', 'START');
    
    INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, 'calculate_priority_96_rankings', 'WARNING', 
            'CRITICAL: This will recalculate PE and ROIC ranks for ALL companies in the database', 'WARNING');
    
    main_block: BEGIN
        -- =====================================================================
        -- GET METRIC IDs FOR RANKING CALCULATIONS
        -- =====================================================================
        
        -- Get pe_rank metric ID
        SELECT metric_id INTO v_pe_rank_metric_id
        FROM dim_metrics
        WHERE name = 'pe_rank' 
          AND calculation_priority = 96;
        
        IF v_pe_rank_metric_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, 'calculate_priority_96_rankings', 'ERROR', 
                    'pe_rank metric not found in dim_metrics', 'METRIC_LOOKUP');
            LEAVE main_block;
        END IF;
        
        -- Get roic_rank metric ID  
        SELECT metric_id INTO v_roic_rank_metric_id
        FROM dim_metrics
        WHERE name = 'roic_rank'
          AND calculation_priority = 96;
        
        IF v_roic_rank_metric_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, 'calculate_priority_96_rankings', 'ERROR', 
                    'roic_rank metric not found in dim_metrics', 'METRIC_LOOKUP');
            LEAVE main_block;
        END IF;
        
        -- Get source metric IDs for dependency validation
        SELECT metric_id INTO v_pe_metric_id
        FROM dim_metrics
        WHERE name = 'price_earnings';
        
        SELECT metric_id INTO v_roic_metric_id  
        FROM dim_metrics
        WHERE name = 'roic';
        
        IF v_pe_metric_id IS NULL OR v_roic_metric_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, 'calculate_priority_96_rankings', 'ERROR', 
                    'Required dependency metrics (price_earnings, roic) not found', 'DEPENDENCY_CHECK');
            LEAVE main_block;
        END IF;
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_96_rankings', 'INFO', 
                'Metric IDs resolved successfully', 'METRIC_LOOKUP');
        
        -- =====================================================================
        -- DELETE EXISTING RANKINGS (DATABASE-WIDE RECALCULATION)
        -- =====================================================================
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_96_rankings', 'INFO', 
                'Deleting ALL existing priority 96 rankings for database-wide recalculation', 'DELETE_START');
        
        -- Delete existing pe_rank values for ALL companies
        DELETE FROM fact_metrics WHERE metric_id = v_pe_rank_metric_id;
        
        -- Delete existing roic_rank values for ALL companies  
        DELETE FROM fact_metrics WHERE metric_id = v_roic_rank_metric_id;
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_96_rankings', 'SUCCESS', 
                'Existing rankings deleted successfully', 'DELETE_COMPLETE');
        
        -- =====================================================================
        -- CALCULATE PE RANKINGS (LOWER P/E = BETTER RANK)
        -- =====================================================================
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_96_rankings', 'INFO', 
                'Calculating PE rankings for ALL reports with P/E data (lower P/E = better rank)', 'PE_RANK_START');
        
        -- Calculate PE rankings using window function
        -- Ranking ALL reports that have P/E data, not just latest per company
        -- Excluding Financial Services sector per Greenblatt methodology
        -- Excluding NULL and negative P/E values
        INSERT INTO fact_metrics (report_id, metric_id, value, calculation_date, source_flag, notes)
        SELECT 
            pe_data.report_id,
            v_pe_rank_metric_id,
            DENSE_RANK() OVER (ORDER BY pe_data.value ASC) as pe_rank,
            NOW(),
            'Priority96_PE_Ranking',
            CONCAT('PE Rank ', DENSE_RANK() OVER (ORDER BY pe_data.value ASC), 
                   ' - P/E: ', pe_data.value, ' (ALL reports, excluding Financial Services)')
        FROM (
            -- Get ALL reports with P/E data (not just latest per company)
            SELECT 
                fm.report_id,
                fm.value
            FROM fact_metrics fm
            JOIN fact_reports r ON fm.report_id = r.report_id
            JOIN dim_companies c ON r.company_id = c.company_id
            WHERE fm.metric_id = v_pe_metric_id
              AND fm.value IS NOT NULL
              AND fm.value > 0  -- Exclude negative P/E (loss-making companies)
              AND c.sector != 'Financial Services'
        ) pe_data;
        
        SET v_pe_rankings_created = ROW_COUNT();
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, records_affected, execution_step)
        VALUES (v_session_id, 'calculate_priority_96_rankings', 'SUCCESS', 
                CONCAT('PE rankings calculated: ', v_pe_rankings_created, ' companies ranked'), 
                v_pe_rankings_created, 'PE_RANK_COMPLETE');
        
        -- =====================================================================
        -- CALCULATE ROIC RANKINGS (HIGHER ROIC = BETTER RANK)
        -- =====================================================================
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_96_rankings', 'INFO', 
                'Calculating ROIC rankings for ALL reports with ROIC data (higher ROIC = better rank)', 'ROIC_RANK_START');
        
        -- Calculate ROIC rankings using window function
        -- Ranking ALL reports that have ROIC data, not just latest per company
        -- Excluding Financial Services sector per Greenblatt methodology  
        -- Excluding NULL ROIC values
        INSERT INTO fact_metrics (report_id, metric_id, value, calculation_date, source_flag, notes)
        SELECT 
            roic_data.report_id,
            v_roic_rank_metric_id,
            DENSE_RANK() OVER (ORDER BY roic_data.value DESC) as roic_rank,
            NOW(),
            'Priority96_ROIC_Ranking',
            CONCAT('ROIC Rank ', DENSE_RANK() OVER (ORDER BY roic_data.value DESC), 
                   ' - ROIC: ', ROUND(roic_data.value, 4), ' (ALL reports, excluding Financial Services)')
        FROM (
            -- Get ALL reports with ROIC data (not just latest per company)
            SELECT 
                fm.report_id,
                fm.value
            FROM fact_metrics fm
            JOIN fact_reports r ON fm.report_id = r.report_id
            JOIN dim_companies c ON r.company_id = c.company_id
            WHERE fm.metric_id = v_roic_metric_id
              AND fm.value IS NOT NULL
              AND c.sector != 'Financial Services'
        ) roic_data;
        
        SET v_roic_rankings_created = ROW_COUNT();
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, records_affected, execution_step)
        VALUES (v_session_id, 'calculate_priority_96_rankings', 'SUCCESS', 
                CONCAT('ROIC rankings calculated: ', v_roic_rankings_created, ' companies ranked'), 
                v_roic_rankings_created, 'ROIC_RANK_COMPLETE');
        
        -- =====================================================================
        -- VALIDATION AND FINAL SUMMARY
        -- =====================================================================
        
        -- Count total reports with both rankings (intersection)
        SELECT COUNT(*) INTO v_total_companies_ranked
        FROM fact_reports r
        WHERE EXISTS (
            SELECT 1 FROM fact_metrics fm 
            WHERE fm.report_id = r.report_id AND fm.metric_id = v_pe_rank_metric_id
        )
        AND EXISTS (
            SELECT 1 FROM fact_metrics fm 
            WHERE fm.report_id = r.report_id AND fm.metric_id = v_roic_rank_metric_id
        );
        
    END main_block;
    
    -- Restore safe updates setting
    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    
    -- Commit transaction
    COMMIT;
    
    -- =====================================================================
    -- FINAL SUMMARY (using logging table only - NO SELECT statements)
    -- =====================================================================
    
    -- Calculate execution time
    SET @execution_time = TIMESTAMPDIFF(SECOND, v_start_time, NOW());
    
    -- Log final summary
    INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, records_affected, execution_step)
    VALUES (v_session_id, 'calculate_priority_96_rankings', 'SUCCESS', 
            CONCAT('DATABASE-WIDE Priority 96 rankings completed. ',
                   'PE Rankings: ', v_pe_rankings_created, ', ',
                   'ROIC Rankings: ', v_roic_rankings_created, ', ',
                   'Reports with both rankings: ', v_total_companies_ranked, ', ',
                   'Execution time: ', @execution_time, ' seconds'), 
            v_total_companies_ranked, 'FINAL_SUMMARY');
    
    INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, 'calculate_priority_96_rankings', 'INFO', 
            'All reports in database now have current PE and ROIC rankings for Magic Formula screening', 'COMPLETION');

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_97_rankings`()
BEGIN
    -- Variable declarations MUST come first
    DECLARE v_calculated_rank_metric_id INT DEFAULT NULL;
    DECLARE v_pe_rank_metric_id INT DEFAULT NULL;
    DECLARE v_roic_rank_metric_id INT DEFAULT NULL;
    DECLARE v_combined_rankings_created INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);
    
    -- Handler declarations MUST come after variable declarations
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;
        
        -- Log error to table (no SELECT statement)
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_97_rankings', 'ERROR', 
                CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        
        -- Restore safe updates setting
        SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
        ROLLBACK;
    END;
    
    -- Initialize session tracking
    SET v_session_id = CONCAT('PRI97_CALC_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    
    -- Store original safe updates setting
    SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;
    
    START TRANSACTION;
    
    -- Log procedure start
    INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, 'calculate_priority_97_rankings', 'INFO', 
            'STARTING DATABASE-WIDE PRIORITY 97 RANKINGS - Magic Formula Combined Score', 'START');
    
    INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, 'calculate_priority_97_rankings', 'INFO', 
            'Calculating: calculated_rank = pe_rank + roic_rank for ALL reports', 'FORMULA_INFO');
    
    main_block: BEGIN
        -- =====================================================================
        -- GET METRIC IDs FOR CALCULATION
        -- =====================================================================
        
        -- Get calculated_rank metric ID
        SELECT metric_id INTO v_calculated_rank_metric_id
        FROM dim_metrics
        WHERE name = 'calculated_rank' 
          AND calculation_priority = 97;
        
        IF v_calculated_rank_metric_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, 'calculate_priority_97_rankings', 'ERROR', 
                    'calculated_rank metric not found in dim_metrics', 'METRIC_LOOKUP');
            LEAVE main_block;
        END IF;
        
        -- Get dependency metric IDs (Priority 96)
        SELECT metric_id INTO v_pe_rank_metric_id
        FROM dim_metrics
        WHERE name = 'pe_rank' 
          AND calculation_priority = 96;
        
        SELECT metric_id INTO v_roic_rank_metric_id
        FROM dim_metrics
        WHERE name = 'roic_rank'
          AND calculation_priority = 96;
        
        IF v_pe_rank_metric_id IS NULL OR v_roic_rank_metric_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, 'calculate_priority_97_rankings', 'ERROR', 
                    'Required dependency metrics (pe_rank, roic_rank) not found - Priority 96 must run first', 'DEPENDENCY_CHECK');
            LEAVE main_block;
        END IF;
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_97_rankings', 'INFO', 
                'Dependency metrics resolved successfully', 'METRIC_LOOKUP');
        
        -- =====================================================================
        -- DELETE EXISTING CALCULATED_RANK VALUES (DATABASE-WIDE RECALCULATION)
        -- =====================================================================
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_97_rankings', 'INFO', 
                'Deleting ALL existing calculated_rank values for database-wide recalculation', 'DELETE_START');
        
        -- Delete existing calculated_rank values for ALL reports
        DELETE FROM fact_metrics WHERE metric_id = v_calculated_rank_metric_id;
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_97_rankings', 'SUCCESS', 
                'Existing calculated_rank values deleted successfully', 'DELETE_COMPLETE');
        
        -- =====================================================================
        -- CALCULATE COMBINED RANKINGS (pe_rank + roic_rank)
        -- =====================================================================
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_97_rankings', 'INFO', 
                'Calculating Magic Formula combined rankings for ALL reports with both pe_rank and roic_rank', 'CALCULATION_START');
        
        -- Calculate calculated_rank = pe_rank + roic_rank
        -- Only process reports that have BOTH pe_rank AND roic_rank values
        INSERT INTO fact_metrics (report_id, metric_id, value, calculation_date, source_flag, notes)
        SELECT 
            pe_rank_data.report_id,
            v_calculated_rank_metric_id,
            (pe_rank_data.pe_rank_value + roic_rank_data.roic_rank_value) as calculated_rank,
            NOW(),
            'Priority97_Magic_Formula',
            CONCAT('Magic Formula Rank: ', 
                   (pe_rank_data.pe_rank_value + roic_rank_data.roic_rank_value),
                   ' (PE:', pe_rank_data.pe_rank_value, ' + ROIC:', roic_rank_data.roic_rank_value, ')')
        FROM (
            -- Get all reports with pe_rank values
            SELECT 
                fm.report_id,
                fm.value as pe_rank_value
            FROM fact_metrics fm
            WHERE fm.metric_id = v_pe_rank_metric_id
              AND fm.value IS NOT NULL
        ) pe_rank_data
        INNER JOIN (
            -- Get all reports with roic_rank values  
            SELECT 
                fm.report_id,
                fm.value as roic_rank_value
            FROM fact_metrics fm
            WHERE fm.metric_id = v_roic_rank_metric_id
              AND fm.value IS NOT NULL
        ) roic_rank_data ON pe_rank_data.report_id = roic_rank_data.report_id;
        
        SET v_combined_rankings_created = ROW_COUNT();
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, records_affected, execution_step)
        VALUES (v_session_id, 'calculate_priority_97_rankings', 'SUCCESS', 
                CONCAT('Magic Formula combined rankings calculated: ', v_combined_rankings_created, ' reports processed'), 
                v_combined_rankings_created, 'CALCULATION_COMPLETE');
        
        -- =====================================================================
        -- VALIDATION: Check that calculated_rank = pe_rank + roic_rank
        -- =====================================================================
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_97_rankings', 'INFO', 
                'Validating calculation accuracy: calculated_rank = pe_rank + roic_rank', 'VALIDATION_START');
        
        -- Count any calculation mismatches (should be zero)
        SELECT COUNT(*) INTO @validation_errors
        FROM fact_metrics calc_rank
        JOIN fact_metrics pe_rank ON calc_rank.report_id = pe_rank.report_id
        JOIN fact_metrics roic_rank ON calc_rank.report_id = roic_rank.report_id
        WHERE calc_rank.metric_id = v_calculated_rank_metric_id
          AND pe_rank.metric_id = v_pe_rank_metric_id
          AND roic_rank.metric_id = v_roic_rank_metric_id
          AND calc_rank.value != (pe_rank.value + roic_rank.value);
        
        IF @validation_errors > 0 THEN
            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, 'calculate_priority_97_rankings', 'ERROR', 
                    CONCAT('CALCULATION ERROR: ', @validation_errors, ' reports have incorrect calculated_rank values'), 'VALIDATION_FAILED');
        ELSE
            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, 'calculate_priority_97_rankings', 'SUCCESS', 
                    'Validation passed: All calculated_rank values match pe_rank + roic_rank formula', 'VALIDATION_PASSED');
        END IF;
        
    END main_block;
    
    -- Restore safe updates setting
    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    
    -- Commit transaction
    COMMIT;
    
    -- =====================================================================
    -- FINAL SUMMARY (using logging table only - NO SELECT statements)
    -- =====================================================================
    
    -- Calculate execution time
    SET @execution_time = TIMESTAMPDIFF(SECOND, v_start_time, NOW());
    
    -- Log final summary
    INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, records_affected, execution_step)
    VALUES (v_session_id, 'calculate_priority_97_rankings', 'SUCCESS', 
            CONCAT('DATABASE-WIDE Priority 97 Magic Formula rankings completed. ',
                   'Combined rankings created: ', v_combined_rankings_created, ', ',
                   'Execution time: ', @execution_time, ' seconds'), 
            v_combined_rankings_created, 'FINAL_SUMMARY');
    
    INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, 'calculate_priority_97_rankings', 'INFO', 
            'All reports now have Magic Formula calculated_rank for investment screening and portfolio construction', 'COMPLETION');

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_98_rankings`()
BEGIN
    -- =========================================================================
    -- VARIABLE DECLARATIONS
    -- =========================================================================
    DECLARE v_percentile_metric_id INT DEFAULT NULL;
    DECLARE v_calculated_rank_metric_id INT DEFAULT NULL;
    DECLARE v_percentile_rankings_created INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);
    
    -- =========================================================================
    -- ERROR HANDLER
    -- =========================================================================
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_98_rankings', 'ERROR', 
                CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        
        SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
        ROLLBACK;
    END;
    
    -- =========================================================================
    -- INITIALIZATION
    -- =========================================================================
    SET v_session_id = CONCAT('PRI98_PCT_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;
    
    START TRANSACTION;
    
    INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, 'calculate_priority_98_rankings', 'INFO', 
            'STARTING Priority 98 - Percentile Calculation (Simplified)', 'START');
    
    main_block: BEGIN
        -- =====================================================================
        -- GET METRIC IDs
        -- =====================================================================
        
        SELECT metric_id INTO v_percentile_metric_id
        FROM dim_metrics
        WHERE name = 'percentile' AND calculation_priority = 98;
        
        SELECT metric_id INTO v_calculated_rank_metric_id
        FROM dim_metrics
        WHERE name = 'calculated_rank' AND calculation_priority = 97;
        
        IF v_percentile_metric_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, 'calculate_priority_98_rankings', 'ERROR', 
                    'Percentile metric not found in dim_metrics (priority 98)', 'METRIC_LOOKUP');
            LEAVE main_block;
        END IF;
        
        IF v_calculated_rank_metric_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, 'calculate_priority_98_rankings', 'ERROR', 
                    'Dependency calculated_rank not found in dim_metrics (priority 97)', 'DEPENDENCY_CHECK');
            LEAVE main_block;
        END IF;
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_98_rankings', 'INFO', 
                CONCAT('Metric IDs resolved: percentile=', v_percentile_metric_id, 
                       ', calculated_rank=', v_calculated_rank_metric_id), 'METRIC_LOOKUP');
        
        -- =====================================================================
        -- DELETE EXISTING PERCENTILE VALUES
        -- =====================================================================
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_98_rankings', 'INFO', 
                'Deleting existing percentile metrics for database-wide recalculation', 'DELETE_START');
        
        DELETE FROM fact_metrics WHERE metric_id = v_percentile_metric_id;
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_98_rankings', 'SUCCESS', 
                CONCAT('Deleted existing percentile metrics. Rows affected: ', ROW_COUNT()), 'DELETE_COMPLETE');
        
        -- =====================================================================
        -- CALCULATE PERCENTILES
        -- =====================================================================
        -- Magic Formula percentile: lower calculated_rank = better stock = higher percentile
        -- Percentile capped at 90 (top 10% of stocks)
        -- Buckets: 0, 10, 20, 30, 40, 50, 60, 70, 80, 90
        -- =====================================================================
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_98_rankings', 'INFO', 
                'Calculating Magic Formula percentiles (lower rank = higher percentile, capped at 90)', 'PERCENTILE_START');
        
        INSERT INTO fact_metrics (report_id, metric_id, value, calculation_date, source_flag, notes)
        SELECT 
            calc_rank_data.report_id,
            v_percentile_metric_id,
            -- Inverted percentile: best ranks (lowest numbers) get highest percentile
            -- DENSE_RANK ascending means rank 1 = best, gets highest percentile
            -- Formula: (1 - normalized_position) * 100, floored to nearest 10, capped at 90
            LEAST(90, 
                FLOOR(
                    (1 - (DENSE_RANK() OVER (ORDER BY calc_rank_data.calculated_rank ASC) - 1) 
                        / COUNT(*) OVER ()
                    ) * 10
                ) * 10
            ) AS percentile,
            NOW(),
            'Priority98_Percentile',
            CONCAT('Magic Formula Percentile: Rank ', calc_rank_data.calculated_rank, 
                   ' → ', 
                   LEAST(90, 
                       FLOOR(
                           (1 - (DENSE_RANK() OVER (ORDER BY calc_rank_data.calculated_rank ASC) - 1) 
                               / COUNT(*) OVER ()
                           ) * 10
                       ) * 10
                   ),
                   'th percentile (capped at 90)')
        FROM (
            SELECT 
                fm.report_id,
                fm.value AS calculated_rank
            FROM fact_metrics fm
            WHERE fm.metric_id = v_calculated_rank_metric_id
              AND fm.value IS NOT NULL
        ) calc_rank_data;
        
        SET v_percentile_rankings_created = ROW_COUNT();
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, records_affected, execution_step)
        VALUES (v_session_id, 'calculate_priority_98_rankings', 'SUCCESS', 
                CONCAT('Percentile calculations completed: ', v_percentile_rankings_created, ' reports processed'), 
                v_percentile_rankings_created, 'PERCENTILE_COMPLETE');
        
        -- =====================================================================
        -- VALIDATION: Check percentile distribution
        -- =====================================================================
        
        SELECT COUNT(DISTINCT fm.value) INTO @percentile_buckets
        FROM fact_metrics fm
        WHERE fm.metric_id = v_percentile_metric_id;
        
        INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, 'calculate_priority_98_rankings', 'INFO', 
                CONCAT('Validation: ', @percentile_buckets, ' distinct percentile buckets created'), 
                'VALIDATION_COMPLETE');
        
    END main_block;
    
    -- =========================================================================
    -- FINALIZATION
    -- =========================================================================
    
    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    COMMIT;
    
    SET @execution_time = TIMESTAMPDIFF(SECOND, v_start_time, NOW());
    
    INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, records_affected, execution_step)
    VALUES (v_session_id, 'calculate_priority_98_rankings', 'SUCCESS', 
            CONCAT('Priority 98 completed. Percentiles created: ', v_percentile_rankings_created,
                   ', Execution time: ', @execution_time, ' seconds'), 
            v_percentile_rankings_created, 'FINAL_SUMMARY');
    
    INSERT INTO calculation_logs (session_id, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, 'calculate_priority_98_rankings', 'INFO', 
            'NOTE: asset_category now calculated by calculate_all_play_rankings()', 'COMPLETION');

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_priority_9_for_company`(
    IN p_company_id INT
)
BEGIN
    -- Variable declarations
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_metric_id INT;
    DECLARE v_metric_name VARCHAR(50);
    DECLARE v_records_processed INT DEFAULT 0;
    DECLARE v_total_metrics INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);
    
    -- Component metric IDs for dependencies
    DECLARE v_equity_share_id INT DEFAULT NULL;
    DECLARE v_adjusted_price_id INT DEFAULT NULL;
    DECLARE v_revenue_ttm_id INT DEFAULT NULL;
    DECLARE v_current_assets_id INT DEFAULT NULL;
    DECLARE v_non_current_assets_id INT DEFAULT NULL;
    DECLARE v_current_liabilities_id INT DEFAULT NULL;
    DECLARE v_short_term_debt_id INT DEFAULT NULL;
    DECLARE v_long_term_debt_id INT DEFAULT NULL;
    DECLARE v_dividends_ttm_id INT DEFAULT NULL;
    DECLARE v_diluted_shares_id INT DEFAULT NULL;
    DECLARE v_free_cash_flow_id INT DEFAULT NULL;
    DECLARE v_cost_of_sales_ttm_id INT DEFAULT NULL;
    
    -- Cursor declaration MUST come before handlers
    DECLARE priority_9_cursor CURSOR FOR
        SELECT 
            metric_id,
            name
        FROM dim_metrics
        WHERE calculation_priority = 9
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
        ORDER BY name;
    
    -- Handler declarations MUST come after cursor declarations
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;
        -- Log error to table (no SELECT statement)
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_9_for_company', 'ERROR', 
               CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        ROLLBACK;
    END;
    
    -- Get company ticker for logging
    SELECT ticker INTO @company_ticker 
    FROM dim_companies 
    WHERE company_id = p_company_id;
    
    -- Initialize session and variables
    SET v_session_id = CONCAT('P9_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;
    
    -- Start transaction
    START TRANSACTION;
    
    main_block: BEGIN
        -- Log procedure start
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_9_for_company', 'INFO', 
                CONCAT('Starting Priority 9 financial ratio calculations for company_id: ', p_company_id), 'START');
        
        -- Validate company exists
        IF @company_ticker IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, 'UNKNOWN', 'calculate_priority_9_for_company', 'ERROR', 
                    CONCAT('Company_id ', p_company_id, ' not found in dim_companies'), 'VALIDATION');
            LEAVE main_block;
        END IF;
        
        -- Count metrics to process
        SELECT COUNT(*) INTO v_total_metrics
        FROM dim_metrics
        WHERE calculation_priority = 9
          AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY);
        
        -- Log metrics to process
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_9_for_company', 'INFO', 
                CONCAT('Found ', v_total_metrics, ' Priority 9 metrics to calculate'), 'METRICS_IDENTIFIED');
        
        -- ===================================================================
        -- RESOLVE COMPONENT METRIC IDs (Dependencies from various priorities)
        -- ===================================================================
        
        -- Priority 1 base metrics
        SELECT metric_id INTO v_current_assets_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('current_assets' AS BINARY);
        SELECT metric_id INTO v_non_current_assets_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('non_current_assets' AS BINARY);
        SELECT metric_id INTO v_current_liabilities_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('current_liabilities' AS BINARY);
        SELECT metric_id INTO v_short_term_debt_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('short_term_debt' AS BINARY);
        SELECT metric_id INTO v_long_term_debt_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('long_term_debt' AS BINARY);
        SELECT metric_id INTO v_diluted_shares_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('diluted_shares' AS BINARY);
        
        -- Priority 3 TTM metrics
        SELECT metric_id INTO v_revenue_ttm_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('revenue_ttm' AS BINARY);
        SELECT metric_id INTO v_dividends_ttm_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('dividends_ttm' AS BINARY);
        SELECT metric_id INTO v_cost_of_sales_ttm_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('cost_of_sales_ttm' AS BINARY);
        
        -- Priority 6 calculated metrics
        SELECT metric_id INTO v_free_cash_flow_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('free_cash_flow' AS BINARY);
        
        -- Priority 7 advanced metrics
        SELECT metric_id INTO v_equity_share_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('equity_share' AS BINARY);
        SELECT metric_id INTO v_adjusted_price_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('adjusted_price' AS BINARY);
        
        -- Log dependency resolution
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_9_for_company', 'INFO', 
                CONCAT('Resolved component metric IDs - current_assets(', IFNULL(v_current_assets_id, 'NULL'), 
                      '), revenue_ttm(', IFNULL(v_revenue_ttm_id, 'NULL'), 
                      '), free_cash_flow(', IFNULL(v_free_cash_flow_id, 'NULL'), 
                      '), equity_share(', IFNULL(v_equity_share_id, 'NULL'), ')'), 'DEPENDENCY_RESOLUTION');
        
        -- Clear existing Priority 9 values for this company
        DELETE FROM fact_metrics 
        WHERE metric_id IN (
            SELECT metric_id FROM dim_metrics 
            WHERE calculation_priority = 9 
              AND CAST(calculation_scope AS BINARY) = CAST('ticker' AS BINARY)
        )
        AND report_id IN (
            SELECT report_id FROM fact_reports 
            WHERE company_id = p_company_id
        );
        
        -- Log cleanup
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_9_for_company', 'INFO', 
                CONCAT('Cleared existing Priority 9 metrics for company_id: ', p_company_id), 'CLEANUP');
        
        -- ===================================================================
        -- PROCESS EACH PRIORITY 9 METRIC
        -- ===================================================================
        
        OPEN priority_9_cursor;
        
        read_loop: LOOP
            FETCH priority_9_cursor INTO v_metric_id, v_metric_name;
            
            IF done THEN
                LEAVE read_loop;
            END IF;
            
            -- Log current metric processing
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_9_for_company', 'INFO', 
                    CONCAT('Processing metric: ', v_metric_name), v_metric_name, 'METRIC_START');
            
            -- ===================================================================
            -- METRIC-SPECIFIC CALCULATIONS
            -- ===================================================================
            
            -- 1. BOOK VALUE = equity_share / adjusted_price
            IF CAST(v_metric_name AS BINARY) = CAST('book_value' AS BINARY) THEN
                INSERT INTO fact_metrics (
                    report_id, 
                    metric_id, 
                    value,  
                    source_flag, 
                    calculation_date, 
                    notes
                )
                SELECT 
                    r.report_id,
                    v_metric_id,
                    (equity_share.value / adjusted_price.value), -- Book value calculation
                    'CALCULATED_P9', -- source_flag
                    NOW(), -- calculation_date
                    CONCAT('Book value = equity_share(', equity_share.value, ') / adjusted_price(', adjusted_price.value, ')') -- notes
                FROM fact_reports r
                -- Get equity_share value
                JOIN fact_metrics equity_share ON (
                    r.report_id = equity_share.report_id 
                    AND equity_share.metric_id = v_equity_share_id
                )
                -- Get adjusted_price value
                JOIN fact_metrics adjusted_price ON (
                    r.report_id = adjusted_price.report_id 
                    AND adjusted_price.metric_id = v_adjusted_price_id
                )
                WHERE r.company_id = p_company_id
                  AND equity_share.value IS NOT NULL
                  AND adjusted_price.value IS NOT NULL
                  AND adjusted_price.value != 0  -- Division by zero protection
                  -- Ensure no duplicate exists
                  AND NOT EXISTS (
                      SELECT 1 FROM fact_metrics existing 
                      WHERE existing.report_id = r.report_id 
                        AND existing.metric_id = v_metric_id
                  );
            
            -- 2. CAPITAL TURN = revenue_ttm / (current_assets + non_current_assets)
            ELSEIF CAST(v_metric_name AS BINARY) = CAST('capital_turn' AS BINARY) THEN
                INSERT INTO fact_metrics (
                    report_id, 
                    metric_id, 
                    value,  
                    source_flag, 
                    calculation_date, 
                    notes
                )
                SELECT 
                    r.report_id,
                    v_metric_id,
                    (revenue_ttm.value / (current_assets.value + non_current_assets.value)), -- Capital turn calculation
                    'CALCULATED_P9', -- source_flag
                    NOW(), -- calculation_date
                    CONCAT('Capital turn = revenue_ttm(', revenue_ttm.value, ') / total_assets(', 
                           (current_assets.value + non_current_assets.value), ')') -- notes
                FROM fact_reports r
                -- Get revenue_ttm value
                JOIN fact_metrics revenue_ttm ON (
                    r.report_id = revenue_ttm.report_id 
                    AND revenue_ttm.metric_id = v_revenue_ttm_id
                )
                -- Get current_assets value
                JOIN fact_metrics current_assets ON (
                    r.report_id = current_assets.report_id 
                    AND current_assets.metric_id = v_current_assets_id
                )
                -- Get non_current_assets value
                JOIN fact_metrics non_current_assets ON (
                    r.report_id = non_current_assets.report_id 
                    AND non_current_assets.metric_id = v_non_current_assets_id
                )
                WHERE r.company_id = p_company_id
                  AND revenue_ttm.value IS NOT NULL
                  AND current_assets.value IS NOT NULL
                  AND non_current_assets.value IS NOT NULL
                  AND (current_assets.value + non_current_assets.value) != 0  -- Division by zero protection
                  -- Ensure no duplicate exists
                  AND NOT EXISTS (
                      SELECT 1 FROM fact_metrics existing 
                      WHERE existing.report_id = r.report_id 
                        AND existing.metric_id = v_metric_id
                  );
            
            -- 3. CURRENT RATIO = current_assets / current_liabilities
            ELSEIF CAST(v_metric_name AS BINARY) = CAST('current_ratio' AS BINARY) THEN
                INSERT INTO fact_metrics (
                    report_id, 
                    metric_id, 
                    value,  
                    source_flag, 
                    calculation_date, 
                    notes
                )
                SELECT 
                    r.report_id,
                    v_metric_id,
                    (current_assets.value / current_liabilities.value), -- Current ratio calculation
                    'CALCULATED_P9', -- source_flag
                    NOW(), -- calculation_date
                    CONCAT('Current ratio = current_assets(', current_assets.value, ') / current_liabilities(', current_liabilities.value, ')') -- notes
                FROM fact_reports r
                -- Get current_assets value
                JOIN fact_metrics current_assets ON (
                    r.report_id = current_assets.report_id 
                    AND current_assets.metric_id = v_current_assets_id
                )
                -- Get current_liabilities value
                JOIN fact_metrics current_liabilities ON (
                    r.report_id = current_liabilities.report_id 
                    AND current_liabilities.metric_id = v_current_liabilities_id
                )
                WHERE r.company_id = p_company_id
                  AND current_assets.value IS NOT NULL
                  AND current_liabilities.value IS NOT NULL
                  AND current_liabilities.value != 0  -- Division by zero protection
                  -- Ensure no duplicate exists
                  AND NOT EXISTS (
                      SELECT 1 FROM fact_metrics existing 
                      WHERE existing.report_id = r.report_id 
                        AND existing.metric_id = v_metric_id
                  );
            
            -- 4. DEBT ASSETS = (short_term_debt + long_term_debt) / (current_assets + non_current_assets)
            ELSEIF CAST(v_metric_name AS BINARY) = CAST('debt_assets' AS BINARY) THEN
                INSERT INTO fact_metrics (
                    report_id, 
                    metric_id, 
                    value,  
                    source_flag, 
                    calculation_date, 
                    notes
                )
                SELECT 
                    r.report_id,
                    v_metric_id,
                    ((IFNULL(short_term_debt.value, 0) + IFNULL(long_term_debt.value, 0)) / 
                     (current_assets.value + non_current_assets.value)), -- Debt assets calculation
                    'CALCULATED_P9', -- source_flag
                    NOW(), -- calculation_date
                    CONCAT('Debt/assets = total_debt(', 
                           (IFNULL(short_term_debt.value, 0) + IFNULL(long_term_debt.value, 0)), 
                           ') / total_assets(', (current_assets.value + non_current_assets.value), ')') -- notes
                FROM fact_reports r
                -- Get current_assets value (required)
                JOIN fact_metrics current_assets ON (
                    r.report_id = current_assets.report_id 
                    AND current_assets.metric_id = v_current_assets_id
                )
                -- Get non_current_assets value (required)
                JOIN fact_metrics non_current_assets ON (
                    r.report_id = non_current_assets.report_id 
                    AND non_current_assets.metric_id = v_non_current_assets_id
                )
                -- Get short_term_debt value (optional)
                LEFT JOIN fact_metrics short_term_debt ON (
                    r.report_id = short_term_debt.report_id 
                    AND short_term_debt.metric_id = v_short_term_debt_id
                )
                -- Get long_term_debt value (optional)
                LEFT JOIN fact_metrics long_term_debt ON (
                    r.report_id = long_term_debt.report_id 
                    AND long_term_debt.metric_id = v_long_term_debt_id
                )
                WHERE r.company_id = p_company_id
                  AND current_assets.value IS NOT NULL
                  AND non_current_assets.value IS NOT NULL
                  AND (current_assets.value + non_current_assets.value) != 0  -- Division by zero protection
                  AND (IFNULL(short_term_debt.value, 0) + IFNULL(long_term_debt.value, 0)) > 0  -- At least some debt exists
                  -- Ensure no duplicate exists
                  AND NOT EXISTS (
                      SELECT 1 FROM fact_metrics existing 
                      WHERE existing.report_id = r.report_id 
                        AND existing.metric_id = v_metric_id
                  );
            
            -- 5. DIVIDEND YIELD = -(dividends_ttm / diluted_shares) / adjusted_price
            ELSEIF CAST(v_metric_name AS BINARY) = CAST('dividend_yield' AS BINARY) THEN
                INSERT INTO fact_metrics (
                    report_id, 
                    metric_id, 
                    value,  
                    source_flag, 
                    calculation_date, 
                    notes
                )
                SELECT 
                    r.report_id,
                    v_metric_id,
                    (-(dividends_ttm.value / diluted_shares.value) / adjusted_price.value), -- Dividend yield calculation (negative sign for expense convention)
                    'CALCULATED_P9', -- source_flag
                    NOW(), -- calculation_date
                    CONCAT('Dividend yield = -(dividends_ttm(', dividends_ttm.value, ') / diluted_shares(', 
                           diluted_shares.value, ')) / adjusted_price(', adjusted_price.value, ')') -- notes
                FROM fact_reports r
                -- Get dividends_ttm value (required and must be non-null)
                JOIN fact_metrics dividends_ttm ON (
                    r.report_id = dividends_ttm.report_id 
                    AND dividends_ttm.metric_id = v_dividends_ttm_id
                )
                -- Get diluted_shares value
                JOIN fact_metrics diluted_shares ON (
                    r.report_id = diluted_shares.report_id 
                    AND diluted_shares.metric_id = v_diluted_shares_id
                )
                -- Get adjusted_price value
                JOIN fact_metrics adjusted_price ON (
                    r.report_id = adjusted_price.report_id 
                    AND adjusted_price.metric_id = v_adjusted_price_id
                )
                WHERE r.company_id = p_company_id
                  AND dividends_ttm.value IS NOT NULL  -- Only calculate when dividends exist
                  AND diluted_shares.value IS NOT NULL
                  AND adjusted_price.value IS NOT NULL
                  AND diluted_shares.value != 0  -- Division by zero protection
                  AND adjusted_price.value != 0  -- Division by zero protection
                  -- Ensure no duplicate exists
                  AND NOT EXISTS (
                      SELECT 1 FROM fact_metrics existing 
                      WHERE existing.report_id = r.report_id 
                        AND existing.metric_id = v_metric_id
                  );
            
            -- 6. FCF MARGIN = free_cash_flow / revenue_ttm (only when FCF > 0)
            ELSEIF CAST(v_metric_name AS BINARY) = CAST('fcf_margin' AS BINARY) THEN
                INSERT INTO fact_metrics (
                    report_id, 
                    metric_id, 
                    value,  
                    source_flag, 
                    calculation_date, 
                    notes
                )
                SELECT 
                    r.report_id,
                    v_metric_id,
                    (free_cash_flow.value / revenue_ttm.value), -- FCF margin calculation
                    'CALCULATED_P9', -- source_flag
                    NOW(), -- calculation_date
                    CONCAT('FCF margin = free_cash_flow(', free_cash_flow.value, ') / revenue_ttm(', revenue_ttm.value, ')') -- notes
                FROM fact_reports r
                -- Get free_cash_flow value (required and must be positive)
                JOIN fact_metrics free_cash_flow ON (
                    r.report_id = free_cash_flow.report_id 
                    AND free_cash_flow.metric_id = v_free_cash_flow_id
                )
                -- Get revenue_ttm value
                JOIN fact_metrics revenue_ttm ON (
                    r.report_id = revenue_ttm.report_id 
                    AND revenue_ttm.metric_id = v_revenue_ttm_id
                )
                WHERE r.company_id = p_company_id
                  AND free_cash_flow.value IS NOT NULL
                  AND free_cash_flow.value > 0  -- Only calculate when FCF is positive (business rule)
                  AND revenue_ttm.value IS NOT NULL
                  AND revenue_ttm.value != 0  -- Division by zero protection
                  -- Ensure no duplicate exists
                  AND NOT EXISTS (
                      SELECT 1 FROM fact_metrics existing 
                      WHERE existing.report_id = r.report_id 
                        AND existing.metric_id = v_metric_id
                  );
            
            -- 7. FIXED OVER TOTAL ASSETS = non_current_assets / (current_assets + non_current_assets)
            ELSEIF CAST(v_metric_name AS BINARY) = CAST('fixed_over_total_assets' AS BINARY) THEN
                INSERT INTO fact_metrics (
                    report_id, 
                    metric_id, 
                    value,  
                    source_flag, 
                    calculation_date, 
                    notes
                )
                SELECT 
                    r.report_id,
                    v_metric_id,
                    (non_current_assets.value / (current_assets.value + non_current_assets.value)), -- Fixed assets ratio calculation
                    'CALCULATED_P9', -- source_flag
                    NOW(), -- calculation_date
                    CONCAT('Fixed/total assets = non_current_assets(', non_current_assets.value, 
                           ') / total_assets(', (current_assets.value + non_current_assets.value), ')') -- notes
                FROM fact_reports r
                -- Get current_assets value
                JOIN fact_metrics current_assets ON (
                    r.report_id = current_assets.report_id 
                    AND current_assets.metric_id = v_current_assets_id
                )
                -- Get non_current_assets value
                JOIN fact_metrics non_current_assets ON (
                    r.report_id = non_current_assets.report_id 
                    AND non_current_assets.metric_id = v_non_current_assets_id
                )
                WHERE r.company_id = p_company_id
                  AND current_assets.value IS NOT NULL
                  AND non_current_assets.value IS NOT NULL
                  AND (current_assets.value + non_current_assets.value) != 0  -- Division by zero protection
                  -- Ensure no duplicate exists
                  AND NOT EXISTS (
                      SELECT 1 FROM fact_metrics existing 
                      WHERE existing.report_id = r.report_id 
                        AND existing.metric_id = v_metric_id
                  );
            
            -- 8. GROSS MARGIN = (revenue_ttm - cost_of_sales_ttm) / revenue_ttm
            ELSEIF CAST(v_metric_name AS BINARY) = CAST('gross_margin' AS BINARY) THEN
                INSERT INTO fact_metrics (
                    report_id, 
                    metric_id, 
                    value,  
                    source_flag, 
                    calculation_date, 
                    notes
                )
                SELECT 
                    r.report_id,
                    v_metric_id,
                    ((revenue_ttm.value - cost_of_sales_ttm.value) / revenue_ttm.value), -- Gross margin calculation
                    'CALCULATED_P9', -- source_flag
                    NOW(), -- calculation_date
                    CONCAT('Gross margin = (revenue_ttm(', revenue_ttm.value, ') - cost_of_sales_ttm(', 
                           cost_of_sales_ttm.value, ')) / revenue_ttm(', revenue_ttm.value, ')') -- notes
                FROM fact_reports r
                -- Get revenue_ttm value
                JOIN fact_metrics revenue_ttm ON (
                    r.report_id = revenue_ttm.report_id 
                    AND revenue_ttm.metric_id = v_revenue_ttm_id
                )
                -- Get cost_of_sales_ttm value (required and must be non-null)
                JOIN fact_metrics cost_of_sales_ttm ON (
                    r.report_id = cost_of_sales_ttm.report_id 
                    AND cost_of_sales_ttm.metric_id = v_cost_of_sales_ttm_id
                )
                WHERE r.company_id = p_company_id
                  AND revenue_ttm.value IS NOT NULL
                  AND cost_of_sales_ttm.value IS NOT NULL  -- Only calculate when cost of sales exists
                  AND revenue_ttm.value != 0  -- Division by zero protection
                  -- Ensure no duplicate exists
                  AND NOT EXISTS (
                      SELECT 1 FROM fact_metrics existing 
                      WHERE existing.report_id = r.report_id 
                        AND existing.metric_id = v_metric_id
                  );
            
            -- 9. MARKET CAP = diluted_shares * adjusted_price
            ELSEIF CAST(v_metric_name AS BINARY) = CAST('market_cap' AS BINARY) THEN
                INSERT INTO fact_metrics (
                    report_id, 
                    metric_id, 
                    value,  
                    source_flag, 
                    calculation_date, 
                    notes
                )
                SELECT 
                    r.report_id,
                    v_metric_id,
                    (diluted_shares.value * adjusted_price.value), -- Market cap calculation
                    'CALCULATED_P9', -- source_flag
                    NOW(), -- calculation_date
                    CONCAT('Market cap = diluted_shares(', diluted_shares.value, ') * adjusted_price(', adjusted_price.value, ')') -- notes
                FROM fact_reports r
                -- Get diluted_shares value
                JOIN fact_metrics diluted_shares ON (
                    r.report_id = diluted_shares.report_id 
                    AND diluted_shares.metric_id = v_diluted_shares_id
                )
                -- Get adjusted_price value
                JOIN fact_metrics adjusted_price ON (
                    r.report_id = adjusted_price.report_id 
                    AND adjusted_price.metric_id = v_adjusted_price_id
                )
                WHERE r.company_id = p_company_id
                  AND diluted_shares.value IS NOT NULL
                  AND adjusted_price.value IS NOT NULL
                  AND diluted_shares.value != 0  -- Protection (though shares should never be zero)
                  AND adjusted_price.value != 0  -- Protection (though price should never be zero)
                  -- Ensure no duplicate exists
                  AND NOT EXISTS (
                      SELECT 1 FROM fact_metrics existing 
                      WHERE existing.report_id = r.report_id 
                        AND existing.metric_id = v_metric_id
                  );
            
            END IF; -- End of metric-specific calculations
            
            -- Count records processed for this metric
            SELECT ROW_COUNT() INTO @records_added;
            SET v_records_processed = v_records_processed + @records_added;
            
            -- Log metric completion
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, metric_name, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_9_for_company', 'INFO', 
                    CONCAT('Completed metric: ', v_metric_name, ' - Records added: ', @records_added), v_metric_name, 'METRIC_COMPLETE');
            
        END LOOP read_loop;
        
        CLOSE priority_9_cursor;
        
        -- ===================================================================
        -- PROCEDURE COMPLETION AND SUMMARY
        -- ===================================================================
        
        -- Calculate execution time
        SET @execution_time = TIMESTAMPDIFF(SECOND, v_start_time, NOW());
        
        -- Log final summary
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_9_for_company', 'INFO', 
                CONCAT('Priority 9 calculation completed - Total records processed: ', v_records_processed, 
                      ', Execution time: ', @execution_time, ' seconds'), 'COMPLETION');
        
    END main_block;
    
    -- Cleanup and commit
    SET SQL_SAFE_UPDATES = @old_sql_safe_updates;
    COMMIT;
    
    -- Final success log
    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_priority_9_for_company', 'SUCCESS', 
            CONCAT('Successfully completed Priority 9 calculations for ', @company_ticker), 'SUCCESS');

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `calculate_sector_play_for_company`(
    IN p_company_id INT
)
BEGIN
    
    DECLARE v_records_play INT DEFAULT 0;
    DECLARE v_records_play2 INT DEFAULT 0;
    DECLARE v_start_time TIMESTAMP DEFAULT NOW();
    DECLARE v_session_id VARCHAR(50);

    
    DECLARE v_play_metric_id INT;
    DECLARE v_play_2_metric_id INT;
    DECLARE v_missed_upon_metric_id INT;
    DECLARE v_missed_upon_2_metric_id INT;
    DECLARE v_play_sector_rating_id INT;
    DECLARE v_play_2_sector_rating_id INT;

    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_sector_play_for_company', 'ERROR',
                CONCAT('SQL Error: ', @errno, ': ', @text), 'ERROR_HANDLER');
        ROLLBACK;
    END;

    
    SET v_session_id = CONCAT('SECPLAY_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));

    START TRANSACTION;

    main_block: BEGIN
        
        SELECT ticker INTO @company_ticker FROM dim_companies WHERE company_id = p_company_id;

        
        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_sector_play_for_company', 'INFO',
                'Starting sector play rating calculations', 'START');

        SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
        SET SQL_SAFE_UPDATES = 0;

        
        
        

        SELECT metric_id INTO v_play_metric_id
        FROM dim_metrics WHERE name = 'play';

        SELECT metric_id INTO v_play_2_metric_id
        FROM dim_metrics WHERE name = 'play_2';

        SELECT metric_id INTO v_missed_upon_metric_id
        FROM dim_metrics WHERE name = 'missed_upon';

        SELECT metric_id INTO v_missed_upon_2_metric_id
        FROM dim_metrics WHERE name = 'missed_upon_2';

        SELECT metric_id INTO v_play_sector_rating_id
        FROM dim_metrics WHERE name = 'play_sector_rating';

        SELECT metric_id INTO v_play_2_sector_rating_id
        FROM dim_metrics WHERE name = 'play_2_sector_rating';

        
        IF v_play_metric_id IS NULL OR v_missed_upon_metric_id IS NULL OR v_play_sector_rating_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_sector_play_for_company', 'ERROR',
                    CONCAT('Required metrics missing. play=', COALESCE(v_play_metric_id, 'NULL'),
                           ', missed_upon=', COALESCE(v_missed_upon_metric_id, 'NULL'),
                           ', play_sector_rating=', COALESCE(v_play_sector_rating_id, 'NULL')),
                    'VALIDATION');
            LEAVE main_block;
        END IF;

        IF v_play_2_metric_id IS NULL OR v_missed_upon_2_metric_id IS NULL OR v_play_2_sector_rating_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_sector_play_for_company', 'INFO',
                    CONCAT('Play_2 metrics missing — skipping play_2_sector_rating. play_2=', COALESCE(v_play_2_metric_id, 'NULL'),
                           ', missed_upon_2=', COALESCE(v_missed_upon_2_metric_id, 'NULL'),
                           ', play_2_sector_rating=', COALESCE(v_play_2_sector_rating_id, 'NULL')),
                    'VALIDATION');
        END IF;

        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_sector_play_for_company', 'INFO',
                CONCAT('Metrics resolved: play=', v_play_metric_id,
                       ', missed_upon=', v_missed_upon_metric_id,
                       ', play_sector_rating=', v_play_sector_rating_id),
                'VALIDATION');

        
        
        

        DELETE FROM fact_metrics
        WHERE metric_id = v_play_sector_rating_id
          AND report_id IN (SELECT report_id FROM fact_reports WHERE company_id = p_company_id);

        IF v_play_2_sector_rating_id IS NOT NULL THEN
            DELETE FROM fact_metrics
            WHERE metric_id = v_play_2_sector_rating_id
              AND report_id IN (SELECT report_id FROM fact_reports WHERE company_id = p_company_id);
        END IF;

        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_sector_play_for_company', 'INFO',
                'Cleared existing sector play ratings', 'CLEANUP');

        
        
        

        INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, notes, calculation_date)
        SELECT
            r.report_id,
            v_play_sector_rating_id,
            CASE WHEN spm.sector_play_id IS NOT NULL THEN 1 ELSE 0 END,
            'CALC_SECTOR_PLAY',
            CASE
                WHEN spm.sector_play_id IS NOT NULL
                THEN CONCAT('Sector play QUALIFIED: ', c.sector, ' missed criterion ',
                            CAST(missed.value AS UNSIGNED), ' (', COALESCE(spm.criterion_name, 'unknown'), ')')
                ELSE CONCAT('Sector play not matched: ', c.sector, ' missed criterion ',
                            CAST(missed.value AS UNSIGNED))
            END,
            NOW()
        FROM fact_reports r
        JOIN dim_companies c ON r.company_id = c.company_id
        JOIN fact_metrics play ON r.report_id = play.report_id
            AND play.metric_id = v_play_metric_id
        JOIN fact_metrics missed ON r.report_id = missed.report_id
            AND missed.metric_id = v_missed_upon_metric_id
        LEFT JOIN dim_sector_play_matrix spm
            ON spm.sector = c.sector
            AND spm.missed_criterion = CAST(missed.value AS UNSIGNED)
            AND spm.is_active = 1
        WHERE r.company_id = p_company_id
          AND play.value = (SELECT near_miss FROM play_thresholds WHERE play_name = 'play');

        SET v_records_play = ROW_COUNT();

        INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
        VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_sector_play_for_company', 'INFO',
                CONCAT('play_sector_rating calculated: ', v_records_play, ' near-miss reports evaluated'),
                v_records_play, 'PLAY_SECTOR_COMPLETE');

        
        
        

        IF v_play_2_metric_id IS NOT NULL AND v_missed_upon_2_metric_id IS NOT NULL AND v_play_2_sector_rating_id IS NOT NULL THEN

            INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, notes, calculation_date)
            SELECT
                r.report_id,
                v_play_2_sector_rating_id,
                CASE WHEN spm2.sector_play_id IS NOT NULL THEN 1 ELSE 0 END,
                'CALC_SECTOR_PLAY_2',
                CASE
                    WHEN spm2.sector_play_id IS NOT NULL
                    THEN CONCAT('Sector play_2 QUALIFIED: ', c.sector, ' missed criterion ',
                                CAST(missed2.value AS UNSIGNED), ' (', COALESCE(spm2.criterion_name, 'unknown'), ')')
                    ELSE CONCAT('Sector play_2 not matched: ', c.sector, ' missed criterion ',
                                CAST(missed2.value AS UNSIGNED))
                END,
                NOW()
            FROM fact_reports r
            JOIN dim_companies c ON r.company_id = c.company_id
            JOIN fact_metrics play2 ON r.report_id = play2.report_id
                AND play2.metric_id = v_play_2_metric_id
            JOIN fact_metrics missed2 ON r.report_id = missed2.report_id
                AND missed2.metric_id = v_missed_upon_2_metric_id
            LEFT JOIN dim_sector_play_2_matrix spm2
                ON spm2.sector = c.sector
                AND spm2.missed_criterion = CAST(missed2.value AS UNSIGNED)
                AND spm2.is_active = 1
            WHERE r.company_id = p_company_id
              AND play2.value = (SELECT near_miss FROM play_thresholds WHERE play_name = 'play_2');

            SET v_records_play2 = ROW_COUNT();

            INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, records_affected, execution_step)
            VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_sector_play_for_company', 'INFO',
                    CONCAT('play_2_sector_rating calculated: ', v_records_play2, ' near-miss reports evaluated'),
                    v_records_play2, 'PLAY_2_SECTOR_COMPLETE');

        END IF;

        
        
        

        SET SQL_SAFE_UPDATES = @old_sql_safe_updates;

    END main_block;

    COMMIT;

    
    INSERT INTO calculation_logs (session_id, company_id, ticker, procedure_name, log_level, message, execution_step)
    VALUES (v_session_id, p_company_id, @company_ticker, 'calculate_sector_play_for_company', 'SUCCESS',
            CONCAT('Completed sector play ratings for ', @company_ticker,
                   '. play_sector: ', v_records_play, ' reports, play_2_sector: ', v_records_play2, ' reports.',
                   ' Execution time: ', TIMESTAMPDIFF(SECOND, v_start_time, NOW()), 's'),
            'SUCCESS');

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `cleanup_test_environment`()
BEGIN
    -- Store current safe mode setting
    DECLARE v_old_safe_updates INT;
    
    -- Error handler
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Restore safe mode on error
        SET SQL_SAFE_UPDATES = v_old_safe_updates;
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;
        SELECT CONCAT('Error during cleanup: ', @errno, ' (', @sqlstate, '): ', @text) as Error_Message;
        ROLLBACK;
    END;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Store and disable safe mode
    SET v_old_safe_updates = @@SQL_SAFE_UPDATES;
    SET SQL_SAFE_UPDATES = 0;
    
    -- Clear test data (now without safe mode restrictions)
    DELETE FROM test_fact_metrics;
    DELETE FROM test_fact_reports;
    DELETE FROM test_dim_companies;
    
    -- Reset auto-increment counters
    ALTER TABLE test_dim_companies AUTO_INCREMENT = 1;
    ALTER TABLE test_fact_reports AUTO_INCREMENT = 1;
    ALTER TABLE test_fact_metrics AUTO_INCREMENT = 1;
    
    -- Restore safe mode
    SET SQL_SAFE_UPDATES = v_old_safe_updates;
    
    -- Commit changes
    COMMIT;
    
    -- Success message
    SELECT 'Test environment cleaned successfully' as Status,
           ROW_COUNT() as Total_Records_Cleared;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `delete_ticker_complete`()
BEGIN
    -- ===================================================================
    -- VARIABLE DECLARATION SECTION - UPDATE TICKER HERE
    -- ===================================================================
    DECLARE v_ticker VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
    DECLARE v_company_id INT;
    DECLARE v_reports_deleted INT DEFAULT 0;
    DECLARE v_metrics_deleted INT DEFAULT 0;
    DECLARE v_company_deleted INT DEFAULT 0;
    
    -- ***** UPDATE THIS LINE WITH THE TICKER TO DELETE *****
    SET v_ticker = 'EMIS.L';  -- Change this ticker before running
    -- ********************************************************
    
    -- ===================================================================
    -- VALIDATION AND COMPANY LOOKUP
    -- ===================================================================
    
    -- Get the company_id for the specified ticker
    SELECT company_id INTO v_company_id
    FROM dim_companies
    WHERE ticker = v_ticker;
    
    -- Check if ticker exists
    IF v_company_id IS NULL THEN
        SELECT CONCAT('ERROR: Ticker "', v_ticker, '" not found in database.') AS message;
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Ticker not found';
    END IF;
    
    SELECT CONCAT('Starting deletion process for ticker: ', v_ticker, 
                  ' (company_id: ', v_company_id, ')') AS message;
    
    -- ===================================================================
    -- STEP 1: DELETE METRICS (fact_metrics)
    -- ===================================================================
    -- Delete all metric values associated with reports for this company
    
    DELETE FROM fact_metrics
    WHERE report_id IN (
        SELECT report_id 
        FROM fact_reports 
        WHERE company_id = v_company_id
    );
    
    SET v_metrics_deleted = ROW_COUNT();
    SELECT CONCAT('Deleted ', v_metrics_deleted, ' metric records') AS message;
    
    -- ===================================================================
    -- STEP 2: DELETE REPORTS (fact_reports)
    -- ===================================================================
    -- Delete all financial reports for this company
    
    DELETE FROM fact_reports
    WHERE company_id = v_company_id;
    
    SET v_reports_deleted = ROW_COUNT();
    SELECT CONCAT('Deleted ', v_reports_deleted, ' report records') AS message;
    
    -- ===================================================================
    -- STEP 3: DELETE COMPANY (dim_companies)
    -- ===================================================================
    -- Finally, delete the company record itself
    
    DELETE FROM dim_companies
    WHERE company_id = v_company_id;
    
    SET v_company_deleted = ROW_COUNT();
    SELECT CONCAT('Deleted ', v_company_deleted, ' company record') AS message;
    
    -- ===================================================================
    -- COMPLETION SUMMARY
    -- ===================================================================
    
    SELECT 
        v_ticker AS ticker_deleted,
        v_company_id AS company_id_deleted,
        v_company_deleted AS companies_deleted,
        v_reports_deleted AS reports_deleted,
        v_metrics_deleted AS metrics_deleted,
        'Deletion completed successfully' AS status;
        
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `log_calculation_step`(
    IN p_session_id VARCHAR(50),
    IN p_company_id INT,
    IN p_ticker VARCHAR(10),
    IN p_procedure_name VARCHAR(100),
    IN p_log_level VARCHAR(20),
    IN p_message TEXT,
    IN p_metric_name VARCHAR(50),
    IN p_records_affected INT,
    IN p_execution_step VARCHAR(50)
)
BEGIN
    INSERT INTO calculation_logs (
        session_id, company_id, ticker, procedure_name, 
        log_level, message, metric_name, records_affected, execution_step
    ) VALUES (
        p_session_id, p_company_id, p_ticker, p_procedure_name,
        p_log_level, p_message, p_metric_name, p_records_affected, p_execution_step
    );
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `populate_fact_reports`()
BEGIN
    -- Declare variables to track progress
    DECLARE rows_added INT;
    
    -- Insert financial reports from the archive table
    INSERT INTO fact_reports (
        company_id,
        time_id,
        report_date,
        report_type,
        financial_year,
        filing_identifier,
        instance,
        date_released,
        release_lag_days,
        sort_key
    )
    SELECT 
        c.company_id,
        t.time_id,
        src.date,
        CASE 
            WHEN src.filing = 'A' THEN 'annual'
            WHEN src.filing = 'H' THEN 'semi-annual'
            ELSE 'annual' -- Default to annual if unexpected value
        END AS report_type,
        src.year,
        src.filing,
        src.instance,
        src.date_released,
        DATEDIFF(src.date_released, src.date),
        CONCAT(src.ticker, DATE_FORMAT(src.date, '%Y%m%d')) AS sort_key
    FROM stocks_db.archive src
    JOIN dim_companies c ON src.ticker = c.ticker
    JOIN dim_time t ON src.date = t.full_date
    WHERE src.filing IN ('A', 'H'); -- Only annual and semi-annual reports
    
    -- Store the number of rows affected
    SET rows_added = ROW_COUNT();
    
    -- Commit the transaction
    COMMIT;
    
    -- Log procedure completion
    SELECT CONCAT('Populated ', rows_added, ' financial reports into fact_reports') AS result;
    
    -- Provide summary statistics
    SELECT 
        COUNT(*) AS total_reports,
        COUNT(DISTINCT company_id) AS distinct_companies,
        SUM(CASE WHEN report_type = 'annual' THEN 1 ELSE 0 END) AS annual_reports,
        SUM(CASE WHEN report_type = 'semi-annual' THEN 1 ELSE 0 END) AS semi_annual_reports,
        MIN(report_date) AS earliest_report,
        MAX(report_date) AS latest_report
    FROM fact_reports;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_refresh_flat_for_company`(IN p_company_id INT)
BEGIN
    
    DELETE FROM stock_archive_flat
    WHERE report_id IN (
        SELECT report_id FROM fact_reports WHERE company_id = p_company_id
    );

    
    INSERT INTO stock_archive_flat
    SELECT
        r.report_id,
        r.report_date,
        r.date_released,
        c.name,
        c.ticker,
        r.financial_year,
        r.filing_identifier,
        r.instance,
        r.sort_key,
        c.sector,
        c.industry,
        MAX(CASE WHEN dm.name = 'reference'                 THEN fm.value END),
        MAX(CASE WHEN dm.name = 'operating_cash_flow'       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'interest_tax'              THEN fm.value END),
        MAX(CASE WHEN dm.name = 'capital_expenditure'       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'cost_of_sales'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'revenue'                   THEN fm.value END),
        MAX(CASE WHEN dm.name = 'income_before_tax'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'operating_cash_flow_ttm'   THEN fm.value END),
        MAX(CASE WHEN dm.name = 'interest_tax_3y_av'        THEN fm.value END),
        MAX(CASE WHEN dm.name = 'interest_tax_ttm'          THEN fm.value END),
        MAX(CASE WHEN dm.name = 'capital_expenditure_3y_av' THEN fm.value END),
        MAX(CASE WHEN dm.name = 'capital_expenditure_ttm'   THEN fm.value END),
        MAX(CASE WHEN dm.name = 'cost_of_sales_ttm'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'revenue_ttm'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'income_before_tax_ttm'     THEN fm.value END),
        MAX(CASE WHEN dm.name = 'free_cash_flow'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'current_assets'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'current_liabilities'       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'non_current_assets'        THEN fm.value END),
        MAX(CASE WHEN dm.name = 'cash'                      THEN fm.value END),
        MAX(CASE WHEN dm.name = 'restricted_cash'           THEN fm.value END),
        MAX(CASE WHEN dm.name = 'goodwill'                  THEN fm.value END),
        MAX(CASE WHEN dm.name = 'short_term_debt'           THEN fm.value END),
        MAX(CASE WHEN dm.name = 'long_term_debt'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'non_current_liabilities'   THEN fm.value END),
        MAX(CASE WHEN dm.name = 'ppe'                       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'equity'                    THEN fm.value END),
        MAX(CASE WHEN dm.name = 'emp_stock_plans'           THEN fm.value END),
        MAX(CASE WHEN dm.name = 'dividends'                 THEN fm.value END),
        MAX(CASE WHEN dm.name = 'interest_income'           THEN fm.value END),
        MAX(CASE WHEN dm.name = 'base_rate'                 THEN fm.value END),
        MAX(CASE WHEN dm.name = 'excess_cash'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'emp_stock_plans_ttm'       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'dividends_ttm'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'interest_income_ttm'       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'current_ratio'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'debt_equity'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'ev_sales'                  THEN fm.value END),
        MAX(CASE WHEN dm.name = 'capital_turn'              THEN fm.value END),
        MAX(CASE WHEN dm.name = 'debt_assets'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'debt_equity_2y_av'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'debt_equity_3y_av'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'debt_equity_4y_av'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'debt_equity_v_3y_av'       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'diluted_shares'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'share_price'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'exchange_rate'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'adjusted_price'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'market_cap'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'dividend_yield'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'gross_margin'              THEN fm.value END),
        MAX(CASE WHEN dm.name = 'fcf_margin'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'book_value'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'fixed_over_total_assets'   THEN fm.value END),
        MAX(CASE WHEN dm.name = 'tax_interest_burden'       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'price_earnings'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'gd_over_pe'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'revenue_share'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'equity_share'              THEN fm.value END),
        MAX(CASE WHEN dm.name = 'eps'                       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roic_5y_av'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roic_4y_av'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roic_3y_av'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roic_2y_av'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roic'                      THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roa_5y_av'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roa_4y_av'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roa_3y_av'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roa_2y_av'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roa'                       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roe_5y_av'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roe_4y_av'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roe_3y_av'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roe_2y_av'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roe'                       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'equity_4y_growth'          THEN fm.value END),
        MAX(CASE WHEN dm.name = 'equity_3y_growth'          THEN fm.value END),
        MAX(CASE WHEN dm.name = 'equity_2y_growth'          THEN fm.value END),
        MAX(CASE WHEN dm.name = 'equity_1y_growth'          THEN fm.value END),
        MAX(CASE WHEN dm.name = 'eps_4y_growth'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'eps_3y_growth'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'eps_2y_growth'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'eps_1y_growth'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'revenue_4y_growth'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'revenue_3y_growth'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'revenue_2y_growth'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'revenue_1y_growth'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'cash_2y_growth'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'cash_1y_growth'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'median_growth'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'industry_growth'           THEN fm.value END),
        MAX(CASE WHEN dm.name = 'est_growth_rate'           THEN fm.value END),
        MAX(CASE WHEN dm.name = 'est_future_pe'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'sticker_price'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'opportunity'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'return_6m'                 THEN fm.value END),
        MAX(CASE WHEN dm.name = 'return_1y'                 THEN fm.value END),
        MAX(CASE WHEN dm.name = 'return_2y'                 THEN fm.value END),
        MAX(CASE WHEN dm.name = 'momentum'                  THEN fm.value END),
        MAX(CASE WHEN dm.name = 'momentum_new'              THEN fm.value END),
        MAX(CASE WHEN dm.name = 'coverage'                  THEN fm.value END),
        MAX(CASE WHEN dm.name = 'coverage_new'              THEN fm.value END),
        MAX(CASE WHEN dm.name = 'pe_rank'                   THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roic_rank'                 THEN fm.value END),
        MAX(CASE WHEN dm.name = 'percentile'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'play'                      THEN fm.value END),
        MAX(CASE WHEN dm.name = 'missed_upon'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'reference_2'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'play_2'                    THEN fm.value END),
        MAX(CASE WHEN dm.name = 'missed_upon_2'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'shares_vs_ly'              THEN fm.value END),
        MAX(CASE WHEN dm.name = 'shares_vs_2y_ago'          THEN fm.value END),
        MAX(CASE WHEN dm.name = '1y_price_vs_earnings'      THEN fm.value END),
        MAX(CASE WHEN dm.name = '2y_price_vs_earnings'      THEN fm.value END),
        MAX(CASE WHEN dm.name = '3y_price_vs_earnings'      THEN fm.value END),
        MAX(CASE WHEN dm.name = 'cash_conversion'           THEN fm.value END),
        MAX(CASE WHEN dm.name = 'gross_profitability'       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'play_sector_rating'        THEN fm.value END),
        MAX(CASE WHEN dm.name = 'play_2_sector_rating'      THEN fm.value END)

    FROM fact_reports r
    JOIN dim_companies c   ON r.company_id  = c.company_id
    LEFT JOIN fact_metrics fm ON fm.report_id = r.report_id
    LEFT JOIN dim_metrics dm  ON fm.metric_id = dm.metric_id
    WHERE r.company_id = p_company_id
      AND c.sector <> 'Financial Services'
    GROUP BY
        r.report_id, r.report_date, r.date_released,
        c.name, c.ticker, r.financial_year, r.filing_identifier,
        r.instance, r.sort_key, c.sector, c.industry
    ORDER BY r.sort_key;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_refresh_stock_archive_flat`()
BEGIN
    
    
    
    DELETE f FROM `stock_archive_flat` f
    LEFT JOIN `fact_reports` r ON f.report_id = r.report_id
    LEFT JOIN `dim_companies` c ON r.company_id = c.company_id
    WHERE r.report_id IS NULL           
       OR c.sector = 'Financial Services'; 

    
    
    
    INSERT INTO `stock_archive_flat`
    SELECT
        r.report_id,
        r.report_date,
        r.date_released,
        c.name,
        c.ticker,
        r.financial_year,
        r.filing_identifier,
        r.instance,
        r.sort_key,
        c.sector,
        c.industry,
        MAX(CASE WHEN dm.name = 'reference'                 THEN fm.value END),
        MAX(CASE WHEN dm.name = 'operating_cash_flow'       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'interest_tax'              THEN fm.value END),
        MAX(CASE WHEN dm.name = 'capital_expenditure'       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'cost_of_sales'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'revenue'                   THEN fm.value END),
        MAX(CASE WHEN dm.name = 'income_before_tax'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'operating_cash_flow_ttm'   THEN fm.value END),
        MAX(CASE WHEN dm.name = 'interest_tax_3y_av'        THEN fm.value END),
        MAX(CASE WHEN dm.name = 'interest_tax_ttm'          THEN fm.value END),
        MAX(CASE WHEN dm.name = 'capital_expenditure_3y_av' THEN fm.value END),
        MAX(CASE WHEN dm.name = 'capital_expenditure_ttm'   THEN fm.value END),
        MAX(CASE WHEN dm.name = 'cost_of_sales_ttm'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'revenue_ttm'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'income_before_tax_ttm'     THEN fm.value END),
        MAX(CASE WHEN dm.name = 'free_cash_flow'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'current_assets'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'current_liabilities'       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'non_current_assets'        THEN fm.value END),
        MAX(CASE WHEN dm.name = 'cash'                      THEN fm.value END),
        MAX(CASE WHEN dm.name = 'restricted_cash'           THEN fm.value END),
        MAX(CASE WHEN dm.name = 'goodwill'                  THEN fm.value END),
        MAX(CASE WHEN dm.name = 'short_term_debt'           THEN fm.value END),
        MAX(CASE WHEN dm.name = 'long_term_debt'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'non_current_liabilities'   THEN fm.value END),
        MAX(CASE WHEN dm.name = 'ppe'                       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'equity'                    THEN fm.value END),
        MAX(CASE WHEN dm.name = 'emp_stock_plans'           THEN fm.value END),
        MAX(CASE WHEN dm.name = 'dividends'                 THEN fm.value END),
        MAX(CASE WHEN dm.name = 'interest_income'           THEN fm.value END),
        MAX(CASE WHEN dm.name = 'base_rate'                 THEN fm.value END),
        MAX(CASE WHEN dm.name = 'excess_cash'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'emp_stock_plans_ttm'       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'dividends_ttm'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'interest_income_ttm'       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'current_ratio'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'debt_equity'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'ev_sales'                  THEN fm.value END),
        MAX(CASE WHEN dm.name = 'capital_turn'              THEN fm.value END),
        MAX(CASE WHEN dm.name = 'debt_assets'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'debt_equity_2y_av'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'debt_equity_3y_av'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'debt_equity_4y_av'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'debt_equity_v_3y_av'       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'diluted_shares'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'share_price'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'exchange_rate'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'adjusted_price'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'market_cap'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'dividend_yield'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'gross_margin'              THEN fm.value END),
        MAX(CASE WHEN dm.name = 'fcf_margin'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'book_value'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'fixed_over_total_assets'   THEN fm.value END),
        MAX(CASE WHEN dm.name = 'tax_interest_burden'       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'price_earnings'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'gd_over_pe'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'revenue_share'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'equity_share'              THEN fm.value END),
        MAX(CASE WHEN dm.name = 'eps'                       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roic_5y_av'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roic_4y_av'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roic_3y_av'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roic_2y_av'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roic'                      THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roa_5y_av'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roa_4y_av'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roa_3y_av'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roa_2y_av'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roa'                       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roe_5y_av'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roe_4y_av'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roe_3y_av'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roe_2y_av'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roe'                       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'equity_4y_growth'          THEN fm.value END),
        MAX(CASE WHEN dm.name = 'equity_3y_growth'          THEN fm.value END),
        MAX(CASE WHEN dm.name = 'equity_2y_growth'          THEN fm.value END),
        MAX(CASE WHEN dm.name = 'equity_1y_growth'          THEN fm.value END),
        MAX(CASE WHEN dm.name = 'eps_4y_growth'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'eps_3y_growth'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'eps_2y_growth'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'eps_1y_growth'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'revenue_4y_growth'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'revenue_3y_growth'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'revenue_2y_growth'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'revenue_1y_growth'         THEN fm.value END),
        MAX(CASE WHEN dm.name = 'cash_2y_growth'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'cash_1y_growth'            THEN fm.value END),
        MAX(CASE WHEN dm.name = 'median_growth'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'industry_growth'           THEN fm.value END),
        MAX(CASE WHEN dm.name = 'est_growth_rate'           THEN fm.value END),
        MAX(CASE WHEN dm.name = 'est_future_pe'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'sticker_price'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'opportunity'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'return_6m'                 THEN fm.value END),
        MAX(CASE WHEN dm.name = 'return_1y'                 THEN fm.value END),
        MAX(CASE WHEN dm.name = 'return_2y'                 THEN fm.value END),
        MAX(CASE WHEN dm.name = 'momentum'                  THEN fm.value END),
        MAX(CASE WHEN dm.name = 'momentum_new'              THEN fm.value END),
        MAX(CASE WHEN dm.name = 'coverage'                  THEN fm.value END),
        MAX(CASE WHEN dm.name = 'coverage_new'              THEN fm.value END),
        MAX(CASE WHEN dm.name = 'pe_rank'                   THEN fm.value END),
        MAX(CASE WHEN dm.name = 'roic_rank'                 THEN fm.value END),
        MAX(CASE WHEN dm.name = 'percentile'                THEN fm.value END),
        MAX(CASE WHEN dm.name = 'play'                      THEN fm.value END),
        MAX(CASE WHEN dm.name = 'missed_upon'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'reference_2'               THEN fm.value END),
        MAX(CASE WHEN dm.name = 'play_2'                    THEN fm.value END),
        MAX(CASE WHEN dm.name = 'missed_upon_2'             THEN fm.value END),
        MAX(CASE WHEN dm.name = 'shares_vs_ly'              THEN fm.value END),
        MAX(CASE WHEN dm.name = 'shares_vs_2y_ago'          THEN fm.value END),
        MAX(CASE WHEN dm.name = '1y_price_vs_earnings'      THEN fm.value END),
        MAX(CASE WHEN dm.name = '2y_price_vs_earnings'      THEN fm.value END),
        MAX(CASE WHEN dm.name = '3y_price_vs_earnings'      THEN fm.value END),
        MAX(CASE WHEN dm.name = 'cash_conversion'           THEN fm.value END),
        MAX(CASE WHEN dm.name = 'gross_profitability'       THEN fm.value END),
        MAX(CASE WHEN dm.name = 'play_sector_rating'        THEN fm.value END),
        MAX(CASE WHEN dm.name = 'play_2_sector_rating'      THEN fm.value END)

    FROM `fact_reports` r
    JOIN `dim_companies` c   ON r.company_id  = c.company_id
    LEFT JOIN `fact_metrics` fm ON fm.report_id = r.report_id
    LEFT JOIN `dim_metrics` dm  ON fm.metric_id = dm.metric_id
    WHERE c.sector <> 'Financial Services'
    GROUP BY
        r.report_id, r.report_date, r.date_released,
        c.name, c.ticker, r.financial_year, r.filing_identifier,
        r.instance, r.sort_key, c.sector, c.industry
    ORDER BY r.sort_key

    ON DUPLICATE KEY UPDATE
        `report_date`             = VALUES(`report_date`),
        `date_released`           = VALUES(`date_released`),
        `name`                    = VALUES(`name`),
        `ticker`                  = VALUES(`ticker`),
        `financial_year`          = VALUES(`financial_year`),
        `filing_identifier`       = VALUES(`filing_identifier`),
        `instance`                = VALUES(`instance`),
        `sort_key`                = VALUES(`sort_key`),
        `sector`                  = VALUES(`sector`),
        `industry`                = VALUES(`industry`),
        `reference`               = VALUES(`reference`),
        `operating_cash_flow`     = VALUES(`operating_cash_flow`),
        `interest_tax`            = VALUES(`interest_tax`),
        `capital_expenditure`     = VALUES(`capital_expenditure`),
        `cost_of_sales`           = VALUES(`cost_of_sales`),
        `revenue`                 = VALUES(`revenue`),
        `income_before_tax`       = VALUES(`income_before_tax`),
        `operating_cash_flow_ttm` = VALUES(`operating_cash_flow_ttm`),
        `interest_tax_3y_av`      = VALUES(`interest_tax_3y_av`),
        `interest_tax_ttm`        = VALUES(`interest_tax_ttm`),
        `capital_expenditure_3y_av` = VALUES(`capital_expenditure_3y_av`),
        `capital_expenditure_ttm` = VALUES(`capital_expenditure_ttm`),
        `cost_of_sales_ttm`       = VALUES(`cost_of_sales_ttm`),
        `revenue_ttm`             = VALUES(`revenue_ttm`),
        `income_before_tax_ttm`   = VALUES(`income_before_tax_ttm`),
        `free_cash_flow`          = VALUES(`free_cash_flow`),
        `current_assets`          = VALUES(`current_assets`),
        `current_liabilities`     = VALUES(`current_liabilities`),
        `non_current_assets`      = VALUES(`non_current_assets`),
        `cash`                    = VALUES(`cash`),
        `restricted_cash`         = VALUES(`restricted_cash`),
        `goodwill`                = VALUES(`goodwill`),
        `short_term_debt`         = VALUES(`short_term_debt`),
        `long_term_debt`          = VALUES(`long_term_debt`),
        `non_current_liabilities` = VALUES(`non_current_liabilities`),
        `ppe`                     = VALUES(`ppe`),
        `equity`                  = VALUES(`equity`),
        `emp_stock_plans`         = VALUES(`emp_stock_plans`),
        `dividends`               = VALUES(`dividends`),
        `interest_income`         = VALUES(`interest_income`),
        `base_rate`               = VALUES(`base_rate`),
        `excess_cash`             = VALUES(`excess_cash`),
        `emp_stock_plans_ttm`     = VALUES(`emp_stock_plans_ttm`),
        `dividends_ttm`           = VALUES(`dividends_ttm`),
        `interest_income_ttm`     = VALUES(`interest_income_ttm`),
        `current_ratio`           = VALUES(`current_ratio`),
        `debt_equity`             = VALUES(`debt_equity`),
        `ev_sales`                = VALUES(`ev_sales`),
        `capital_turn`            = VALUES(`capital_turn`),
        `debt_assets`             = VALUES(`debt_assets`),
        `debt_equity_2y_av`       = VALUES(`debt_equity_2y_av`),
        `debt_equity_3y_av`       = VALUES(`debt_equity_3y_av`),
        `debt_equity_4y_av`       = VALUES(`debt_equity_4y_av`),
        `debt_equity_v_3y_av`     = VALUES(`debt_equity_v_3y_av`),
        `diluted_shares`          = VALUES(`diluted_shares`),
        `share_price`             = VALUES(`share_price`),
        `exchange_rate`           = VALUES(`exchange_rate`),
        `adjusted_price`          = VALUES(`adjusted_price`),
        `market_cap`              = VALUES(`market_cap`),
        `dividend_yield`          = VALUES(`dividend_yield`),
        `gross_margin`            = VALUES(`gross_margin`),
        `fcf_margin`              = VALUES(`fcf_margin`),
        `book_value`              = VALUES(`book_value`),
        `fixed_over_total_assets` = VALUES(`fixed_over_total_assets`),
        `tax_interest_burden`     = VALUES(`tax_interest_burden`),
        `price_earnings`          = VALUES(`price_earnings`),
        `gd_over_pe`              = VALUES(`gd_over_pe`),
        `revenue_share`           = VALUES(`revenue_share`),
        `equity_share`            = VALUES(`equity_share`),
        `eps`                     = VALUES(`eps`),
        `roic_5y_av`              = VALUES(`roic_5y_av`),
        `roic_4y_av`              = VALUES(`roic_4y_av`),
        `roic_3y_av`              = VALUES(`roic_3y_av`),
        `roic_2y_av`              = VALUES(`roic_2y_av`),
        `roic`                    = VALUES(`roic`),
        `roa_5y_av`               = VALUES(`roa_5y_av`),
        `roa_4y_av`               = VALUES(`roa_4y_av`),
        `roa_3y_av`               = VALUES(`roa_3y_av`),
        `roa_2y_av`               = VALUES(`roa_2y_av`),
        `roa`                     = VALUES(`roa`),
        `roe_5y_av`               = VALUES(`roe_5y_av`),
        `roe_4y_av`               = VALUES(`roe_4y_av`),
        `roe_3y_av`               = VALUES(`roe_3y_av`),
        `roe_2y_av`               = VALUES(`roe_2y_av`),
        `roe`                     = VALUES(`roe`),
        `equity_4y_growth`        = VALUES(`equity_4y_growth`),
        `equity_3y_growth`        = VALUES(`equity_3y_growth`),
        `equity_2y_growth`        = VALUES(`equity_2y_growth`),
        `equity_1y_growth`        = VALUES(`equity_1y_growth`),
        `eps_4y_growth`           = VALUES(`eps_4y_growth`),
        `eps_3y_growth`           = VALUES(`eps_3y_growth`),
        `eps_2y_growth`           = VALUES(`eps_2y_growth`),
        `eps_1y_growth`           = VALUES(`eps_1y_growth`),
        `revenue_4y_growth`       = VALUES(`revenue_4y_growth`),
        `revenue_3y_growth`       = VALUES(`revenue_3y_growth`),
        `revenue_2y_growth`       = VALUES(`revenue_2y_growth`),
        `revenue_1y_growth`       = VALUES(`revenue_1y_growth`),
        `cash_2y_growth`          = VALUES(`cash_2y_growth`),
        `cash_1y_growth`          = VALUES(`cash_1y_growth`),
        `median_growth`           = VALUES(`median_growth`),
        `industry_growth`         = VALUES(`industry_growth`),
        `est_growth_rate`         = VALUES(`est_growth_rate`),
        `est_future_pe`           = VALUES(`est_future_pe`),
        `sticker_price`           = VALUES(`sticker_price`),
        `opportunity`             = VALUES(`opportunity`),
        `return_6m`               = VALUES(`return_6m`),
        `return_1y`               = VALUES(`return_1y`),
        `return_2y`               = VALUES(`return_2y`),
        `momentum`                = VALUES(`momentum`),
        `momentum_new`            = VALUES(`momentum_new`),
        `coverage`                = VALUES(`coverage`),
        `coverage_new`            = VALUES(`coverage_new`),
        `pe_rank`                 = VALUES(`pe_rank`),
        `roic_rank`               = VALUES(`roic_rank`),
        `percentile`              = VALUES(`percentile`),
        `play`                    = VALUES(`play`),
        `missed_upon`             = VALUES(`missed_upon`),
        `reference_2`             = VALUES(`reference_2`),
        `play_2`                  = VALUES(`play_2`),
        `missed_upon_2`           = VALUES(`missed_upon_2`),
        `shares_vs_ly`            = VALUES(`shares_vs_ly`),
        `shares_vs_2y_ago`        = VALUES(`shares_vs_2y_ago`),
        `1y_price_vs_earnings`    = VALUES(`1y_price_vs_earnings`),
        `2y_price_vs_earnings`    = VALUES(`2y_price_vs_earnings`),
        `3y_price_vs_earnings`    = VALUES(`3y_price_vs_earnings`),
        `cash_conversion`         = VALUES(`cash_conversion`),
        `gross_profitability`     = VALUES(`gross_profitability`),
        `play_sector_rating`      = VALUES(`play_sector_rating`),
        `play_2_sector_rating`    = VALUES(`play_2_sector_rating`);

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `update_delisted_return_metrics`(
    IN p_company_id INT,
    IN p_report_ids TEXT,
    IN p_delisting_price DECIMAL(40,4)
)
BEGIN
    -- Variable declarations
    DECLARE v_report_id INT;
    DECLARE v_current_share_price DECIMAL(40,4);
    DECLARE v_dividend_yield_6m DECIMAL(40,4) DEFAULT 0;
    DECLARE v_dividend_yield_1y DECIMAL(40,4) DEFAULT 0;
    DECLARE v_dividend_yield_2y DECIMAL(40,4) DEFAULT 0;
    DECLARE v_return_6m_value DECIMAL(40,4);
    DECLARE v_return_1y_value DECIMAL(40,4);
    DECLARE v_return_2y_value DECIMAL(40,4);
    DECLARE v_records_updated INT DEFAULT 0;
    DECLARE v_session_id VARCHAR(50);
    DECLARE done INT DEFAULT FALSE;
    
    -- Metric ID variables
    DECLARE v_return_6m_id INT;
    DECLARE v_return_1y_id INT;
    DECLARE v_return_2y_id INT;
    DECLARE v_share_price_id INT;
    DECLARE v_dividend_yield_plus_6_id INT;
    DECLARE v_dividend_yield_plus_12_id INT;
    DECLARE v_dividend_yield_plus_24_id INT;
    
    -- Cursor to iterate through report IDs
    DECLARE report_cursor CURSOR FOR
        SELECT CAST(TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(p_report_ids, ',', numbers.n), ',', -1)) AS UNSIGNED) AS report_id
        FROM (
            SELECT 1 + a.N + b.N * 10 AS n
            FROM (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION 
                  SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
                 (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION 
                  SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b
        ) numbers
        WHERE n <= CHAR_LENGTH(p_report_ids) - CHAR_LENGTH(REPLACE(p_report_ids, ',', '')) + 1;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Error handler
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE,
            @errno = MYSQL_ERRNO,
            @text = MESSAGE_TEXT;
        
        INSERT INTO calculation_logs (session_id, company_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, 'update_delisted_return_metrics', 'ERROR', 
                CONCAT('SQL Error: ', @errno, ' (', @sqlstate, '): ', @text), 'ERROR_HANDLER');
        ROLLBACK;
    END;
    
    -- Initialize session
    SET v_session_id = CONCAT('DELIST_', p_company_id, '_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    
    -- Start transaction
    START TRANSACTION;
    
    main_block: BEGIN
        -- Log procedure start
        INSERT INTO calculation_logs (session_id, company_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, 'update_delisted_return_metrics', 'INFO', 
                CONCAT('Starting delisted return metrics update for company_id: ', p_company_id, 
                       ', delisting_price: $', p_delisting_price), 'START');
        
        -- Resolve metric IDs
        SELECT metric_id INTO v_return_6m_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('return_6m' AS BINARY);
        SELECT metric_id INTO v_return_1y_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('return_1y' AS BINARY);
        SELECT metric_id INTO v_return_2y_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('return_2y' AS BINARY);
        SELECT metric_id INTO v_share_price_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('share_price' AS BINARY);
        SELECT metric_id INTO v_dividend_yield_plus_6_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('dividend_yield_plus_6' AS BINARY);
        SELECT metric_id INTO v_dividend_yield_plus_12_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('dividend_yield_plus_12' AS BINARY);
        SELECT metric_id INTO v_dividend_yield_plus_24_id FROM dim_metrics WHERE CAST(name AS BINARY) = CAST('dividend_yield_plus_24' AS BINARY);
        
        -- Validate metric IDs exist
        IF v_return_6m_id IS NULL OR v_return_1y_id IS NULL OR v_return_2y_id IS NULL OR v_share_price_id IS NULL THEN
            INSERT INTO calculation_logs (session_id, company_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, 'update_delisted_return_metrics', 'ERROR', 
                    'Required metric definitions not found in dim_metrics', 'VALIDATION');
            ROLLBACK;
            LEAVE main_block;
        END IF;
        
        INSERT INTO calculation_logs (session_id, company_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, 'update_delisted_return_metrics', 'INFO', 
                CONCAT('Processing report IDs: ', p_report_ids), 'PROCESSING');
        
        -- Open cursor to process each report
        OPEN report_cursor;
        
        read_loop: LOOP
            SET done = FALSE;
            FETCH report_cursor INTO v_report_id;
            
            IF done THEN
                LEAVE read_loop;
            END IF;
            
            -- Get current share price for this report
            SELECT fm.value INTO v_current_share_price
            FROM fact_metrics fm
            WHERE fm.report_id = v_report_id
              AND fm.metric_id = v_share_price_id;
            
            IF v_current_share_price IS NULL THEN
                INSERT INTO calculation_logs (session_id, company_id, procedure_name, log_level, message, execution_step)
                VALUES (v_session_id, p_company_id, 'update_delisted_return_metrics', 'WARNING', 
                        CONCAT('No share price found for report_id: ', v_report_id), 'DATA_MISSING');
                ITERATE read_loop;
            END IF;
            
            -- Get dividend yields (if they exist)
            SELECT COALESCE(fm.value, 0) INTO v_dividend_yield_6m
            FROM fact_metrics fm
            WHERE fm.report_id = v_report_id
              AND fm.metric_id = v_dividend_yield_plus_6_id;
            
            SELECT COALESCE(fm.value, 0) INTO v_dividend_yield_1y
            FROM fact_metrics fm
            WHERE fm.report_id = v_report_id
              AND fm.metric_id = v_dividend_yield_plus_12_id;
            
            SELECT COALESCE(fm.value, 0) INTO v_dividend_yield_2y
            FROM fact_metrics fm
            WHERE fm.report_id = v_report_id
              AND fm.metric_id = v_dividend_yield_plus_24_id;
            
            -- Calculate return metrics using delisting price
            -- return_6m = (delisting_price / current_price - 1) + dividend_yield_6m
            SET v_return_6m_value = (p_delisting_price / v_current_share_price - 1) + COALESCE(v_dividend_yield_6m, 0);
            
            -- return_1y = (delisting_price / current_price - 1) + dividend_yield_1y  
            SET v_return_1y_value = (p_delisting_price / v_current_share_price - 1) + COALESCE(v_dividend_yield_1y, 0);
            
            -- return_2y = (delisting_price / current_price - 1) + dividend_yield_1y + dividend_yield_2y
            SET v_return_2y_value = (p_delisting_price / v_current_share_price - 1) + COALESCE(v_dividend_yield_1y, 0) + COALESCE(v_dividend_yield_2y, 0);
            
            -- Delete existing return metrics for this report (if any)
            DELETE FROM fact_metrics 
            WHERE report_id = v_report_id 
              AND metric_id IN (v_return_6m_id, v_return_1y_id, v_return_2y_id);
            
            -- Insert updated return_6m (Priority 16: dividend yield halved for 6-month period)
            INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
            VALUES (v_report_id, v_return_6m_id, v_return_6m_value, 'DELISTED_6M', NOW(), 
                    CONCAT('Delisted return: (', p_delisting_price, '/', v_current_share_price, ' - 1) + div_yield/2: ', COALESCE(v_dividend_yield_6m, 0), '/2'));
            
            -- Insert updated return_1y
            INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
            VALUES (v_report_id, v_return_1y_id, v_return_1y_value, 'DELISTED_1Y', NOW(), 
                    CONCAT('Delisted return: (', p_delisting_price, '/', v_current_share_price, ' - 1) + div_yield: ', COALESCE(v_dividend_yield_1y, 0)));
            
            -- Insert updated return_2y (Priority 16: uses both year 1 and year 2 dividend yields)
            INSERT INTO fact_metrics (report_id, metric_id, value, source_flag, calculation_date, notes)
            VALUES (v_report_id, v_return_2y_id, v_return_2y_value, 'DELISTED_2Y', NOW(), 
                    CONCAT('Delisted return: (', p_delisting_price, '/', v_current_share_price, ' - 1) + div_yields Y1+Y2: ', COALESCE(v_dividend_yield_1y, 0), '+', COALESCE(v_dividend_yield_2y, 0)));
            
            SET v_records_updated = v_records_updated + 3; -- 3 metrics per report
            
            INSERT INTO calculation_logs (session_id, company_id, procedure_name, log_level, message, execution_step)
            VALUES (v_session_id, p_company_id, 'update_delisted_return_metrics', 'INFO', 
                    CONCAT('Updated return metrics for report_id: ', v_report_id, 
                           ' - 6m: ', ROUND(v_return_6m_value * 100, 2), '%, 1y: ', ROUND(v_return_1y_value * 100, 2), 
                           '%, 2y: ', ROUND(v_return_2y_value * 100, 2), '%'), 'CALCULATION_COMPLETE');
        
        END LOOP;
        
        CLOSE report_cursor;
        
        -- Final logging and commit
        INSERT INTO calculation_logs (session_id, company_id, procedure_name, log_level, message, execution_step)
        VALUES (v_session_id, p_company_id, 'update_delisted_return_metrics', 'INFO', 
                CONCAT('Delisted return metrics update completed. Total metrics updated: ', v_records_updated), 'COMPLETE');
        
        COMMIT;
        
        -- Return summary (for Python script to display)
        SELECT v_records_updated AS metrics_updated, 
               'SUCCESS' AS status, 
               'Return metrics updated using delisting price' AS message;
    
    END main_block;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `update_earnings_status`()
BEGIN
    -- Update days_until_release for all records
    UPDATE earnings_calendar_tracking
    SET days_until_release = DATEDIFF(api_report_date, CURDATE());
    
    -- Update status based on days_until_release
    UPDATE earnings_calendar_tracking
    SET status = CASE
        WHEN eps_actual IS NOT NULL THEN 'processed'  -- Already has actual results
        WHEN days_until_release < -7 THEN 'missed'    -- More than 7 days overdue
        WHEN days_until_release < 0 THEN 'missed'     -- Past due
        WHEN days_until_release = 0 THEN 'due_today'
        WHEN days_until_release <= 7 THEN 'due_soon'  -- Within a week
        ELSE 'upcoming'
    END
    WHERE status NOT IN ('processed', 'cancelled');
    
    SELECT 
        status,
        COUNT(*) as count
    FROM earnings_calendar_tracking
    GROUP BY status;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `validate_test_environment`()
BEGIN
    DECLARE company_count INT DEFAULT 0;
    DECLARE report_count INT DEFAULT 0;
    DECLARE metric_count INT DEFAULT 0;
    DECLARE time_count INT DEFAULT 0;
    
    -- Check test table existence and row counts
    SELECT COUNT(*) INTO company_count FROM test_dim_companies;
    SELECT COUNT(*) INTO report_count FROM test_fact_reports;
    SELECT COUNT(*) INTO metric_count FROM test_fact_metrics;
    SELECT COUNT(*) INTO time_count FROM test_dim_time;
    
    -- Report status
    SELECT 
        'TEST ENVIRONMENT STATUS' as Check_Type,
        company_count as Companies,
        report_count as Reports,
        metric_count as Metrics,
        time_count as Time_Records;
        
    -- Check for essential metrics definitions
    SELECT 
        calculation_priority,
        COUNT(*) as metric_count,
        GROUP_CONCAT(name SEPARATOR ', ') as sample_metrics
    FROM dim_metrics 
    WHERE calculation_priority IN (1, 2, 3)
    GROUP BY calculation_priority
    ORDER BY calculation_priority;
    
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
ALTER DATABASE `new_stocks_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-05 23:21:26
