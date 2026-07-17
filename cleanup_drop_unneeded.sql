-- Drop obsolete D1 tables only.
-- Keeps current app tables and user/admin/workflow data.

DROP TABLE IF EXISTS analytics_agent_daily_fetches;

DROP TABLE IF EXISTS helpdesk_analytics_agent_fetches;
DROP TABLE IF EXISTS helpdesk_analytics_agent_fetches_v2;
DROP TABLE IF EXISTS helpdesk_analytics_agent_fetches_v3;
DROP TABLE IF EXISTS helpdesk_analytics_agent_fetches_v4;

DROP TABLE IF EXISTS helpdesk_analytics_daily;
DROP TABLE IF EXISTS helpdesk_analytics_daily_v2;
DROP TABLE IF EXISTS helpdesk_analytics_daily_v3;
DROP TABLE IF EXISTS helpdesk_analytics_daily_v4;
DROP TABLE IF EXISTS helpdesk_analytics_daily_v5;
DROP TABLE IF EXISTS helpdesk_analytics_daily_v6;

DROP TABLE IF EXISTS helpdesk_analytics_daily_fetches;
DROP TABLE IF EXISTS helpdesk_analytics_daily_fetches_v2;
DROP TABLE IF EXISTS helpdesk_analytics_daily_fetches_v3;
DROP TABLE IF EXISTS helpdesk_analytics_daily_fetches_v4;

DROP TABLE IF EXISTS helpdesk_analytics_handled_tickets_v3;
DROP TABLE IF EXISTS helpdesk_analytics_handled_tickets_v4;

DROP TABLE IF EXISTS helpdesk_analytics_message_events;
DROP TABLE IF EXISTS helpdesk_analytics_message_events_v2;
DROP TABLE IF EXISTS helpdesk_analytics_message_events_v3;
DROP TABLE IF EXISTS helpdesk_analytics_reply_details_v1;
DROP TABLE IF EXISTS helpdesk_analytics_reply_details_v2;
DROP TABLE IF EXISTS helpdesk_analytics_reply_details_v3;

DROP TABLE IF EXISTS helpdesk_webhook_events;
DROP TABLE IF EXISTS helpdesk_workflow_run_stats;
DROP TABLE IF EXISTS helpdesk_workflow_runs;
