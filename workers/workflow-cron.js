export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runWorkflowCron(env));
  },
};

async function runWorkflowCron(env) {
  const secret = `${env.WORKFLOW_CRON_SECRET || ""}`.trim();
  if (!secret) {
    throw new Error("Missing WORKFLOW_CRON_SECRET.");
  }

  const url = env.WORKFLOW_CRON_URL || "https://lc-admin.pages.dev/api/helpdesk/workflow-cron";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-Workflow-Cron-Secret": secret,
      "User-Agent": "lc-admin-workflow-cron/1.0",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Workflow cron failed with ${response.status}: ${text.slice(0, 500)}`);
  }
}
