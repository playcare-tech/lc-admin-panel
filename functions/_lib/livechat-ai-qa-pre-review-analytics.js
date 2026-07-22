import { ensureLivechatAiQaTables } from "./livechat-ai-qa-tagging.js";

function parseJson(value, fallback = []) {
  try {
    const parsed = JSON.parse(value || "");
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function unique(values = []) {
  return [...new Set(values.map((value) => canonicalAnalyticsTag(value)).filter(Boolean))];
}

function canonicalAnalyticsTag(value) {
  const tag = `${value || ""}`.trim();
  const aliases = {
    "promo bonus": "promo_bonus",
    "loyalty bonus": "loyalty_bonus",
  };
  return aliases[tag.toLowerCase()] || tag;
}

function sameTags(left, right) {
  const a = unique(left).sort();
  const b = unique(right).sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function percent(value, total) {
  return total ? Math.round((Number(value || 0) / total) * 1000) / 10 : 0;
}

function confidencePercent(value) {
  if (value === null || value === undefined || `${value}`.trim() === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 100) return null;
  return number <= 1 ? number * 100 : number;
}

function emptySummary(type) {
  return {
    type,
    reviewed: 0,
    approved: 0,
    corrected: 0,
    exactMatches: 0,
    exactMatchRate: 0,
    averageConfidence: null,
    confidenceTotal: 0,
    confidenceCount: 0,
  };
}

function finalizeSummary(summary) {
  return {
    type: summary.type,
    reviewed: summary.reviewed,
    approved: summary.approved,
    corrected: summary.corrected,
    exactMatches: summary.exactMatches,
    exactMatchRate: percent(summary.exactMatches, summary.reviewed),
    correctionRate: percent(summary.corrected, summary.reviewed),
    averageConfidence: summary.confidenceCount
      ? Math.round((summary.confidenceTotal / summary.confidenceCount) * 10) / 10
      : null,
  };
}

function dateWhere(alias, filters, field = "reviewed_at") {
  const where = [`${alias}.status IN ('approved', 'corrected')`];
  const binds = [];
  if (filters.from) {
    where.push(`${alias}.${field} >= ?`);
    binds.push(filters.from);
  }
  if (filters.to) {
    where.push(`${alias}.${field} <= ?`);
    binds.push(filters.to);
  }
  if (filters.reviewer) {
    where.push(`${alias}.reviewer LIKE ?`);
    binds.push(`%${filters.reviewer}%`);
  }
  return { where: where.join(" AND "), binds };
}

function feedbackWhere(alias, filters) {
  const where = ["1 = 1"];
  const binds = [];
  if (filters.from) {
    where.push(`${alias}.created_at >= ?`);
    binds.push(filters.from);
  }
  if (filters.to) {
    where.push(`${alias}.created_at <= ?`);
    binds.push(filters.to);
  }
  if (filters.reviewer) {
    where.push(`${alias}.reviewer LIKE ?`);
    binds.push(`%${filters.reviewer}%`);
  }
  return { where: where.join(" AND "), binds };
}

function addCounter(map, key, seed, update) {
  if (!map.has(key)) map.set(key, seed());
  update(map.get(key));
}

function analyzeReviews(autoRows, agentRows, reviewType) {
  const summaries = new Map([
    ["auto_tag", emptySummary("auto_tag")],
    ["agent_qa", emptySummary("agent_qa")],
  ]);
  const daily = new Map();
  const tags = new Map();
  const confusions = new Map();
  const versions = new Map();

  const consume = (row, type, suggestedField) => {
    if (reviewType !== "all" && reviewType !== type) return;
    const suggested = unique(parseJson(row[suggestedField], []));
    const finalTags = unique(parseJson(row.final_tags_json, []));
    const exact = sameTags(suggested, finalTags);
    const summary = summaries.get(type);
    summary.reviewed += 1;
    summary.approved += row.status === "approved" ? 1 : 0;
    summary.corrected += row.status === "corrected" ? 1 : 0;
    summary.exactMatches += exact ? 1 : 0;
    const confidence = confidencePercent(row.ai_overall_confidence);
    if (confidence !== null) {
      summary.confidenceTotal += confidence;
      summary.confidenceCount += 1;
    }

    const date = `${row.reviewed_at || ""}`.slice(0, 10) || "unknown";
    addCounter(
      daily,
      `${date}|${type}`,
      () => ({ date, type, reviewed: 0, exactMatches: 0, corrected: 0 }),
      (item) => {
        item.reviewed += 1;
        item.exactMatches += exact ? 1 : 0;
        item.corrected += row.status === "corrected" ? 1 : 0;
      },
    );

    const model = row.ai_fallback_model || row.ai_model || "unknown";
    const promptVersion = row.prompt_version || "unknown";
    addCounter(
      versions,
      `${type}|${model}|${promptVersion}`,
      () => ({ type, model, promptVersion, reviewed: 0, exactMatches: 0, corrected: 0 }),
      (item) => {
        item.reviewed += 1;
        item.exactMatches += exact ? 1 : 0;
        item.corrected += row.status === "corrected" ? 1 : 0;
      },
    );

    const suggestedSet = new Set(suggested);
    const finalSet = new Set(finalTags);
    for (const tag of new Set([...suggested, ...finalTags])) {
      addCounter(
        tags,
        `${type}|${tag}`,
        () => ({ type, tag, suggested: 0, final: 0, kept: 0, wrong: 0, missed: 0 }),
        (item) => {
          const inAi = suggestedSet.has(tag);
          const inFinal = finalSet.has(tag);
          item.suggested += inAi ? 1 : 0;
          item.final += inFinal ? 1 : 0;
          item.kept += inAi && inFinal ? 1 : 0;
          item.wrong += inAi && !inFinal ? 1 : 0;
          item.missed += !inAi && inFinal ? 1 : 0;
        },
      );
    }

    if (!exact) {
      const removed = suggested.filter((tag) => !finalSet.has(tag));
      const added = finalTags.filter((tag) => !suggestedSet.has(tag));
      const sources = removed.length ? removed : ["(missed)"];
      const targets = added.length ? added : ["(removed)"];
      for (const fromTag of sources) {
        for (const toTag of targets) {
          addCounter(
            confusions,
            `${type}|${fromTag}|${toTag}`,
            () => ({ type, fromTag, toTag, count: 0 }),
            (item) => {
              item.count += 1;
            },
          );
        }
      }
    }
  };

  for (const row of autoRows) consume(row, "auto_tag", "suggested_tags_json");
  for (const row of agentRows) consume(row, "agent_qa", "check_tags_json");

  const typeSummaries = [...summaries.values()]
    .filter((item) => reviewType === "all" || item.type === reviewType)
    .map(finalizeSummary);
  const overallRaw = typeSummaries.reduce(
    (total, item) => ({
      reviewed: total.reviewed + item.reviewed,
      approved: total.approved + item.approved,
      corrected: total.corrected + item.corrected,
      exactMatches: total.exactMatches + item.exactMatches,
    }),
    { reviewed: 0, approved: 0, corrected: 0, exactMatches: 0 },
  );

  return {
    overall: {
      ...overallRaw,
      exactMatchRate: percent(overallRaw.exactMatches, overallRaw.reviewed),
      correctionRate: percent(overallRaw.corrected, overallRaw.reviewed),
    },
    types: typeSummaries,
    daily: [...daily.values()]
      .map((item) => ({ ...item, exactMatchRate: percent(item.exactMatches, item.reviewed) }))
      .sort((left, right) => right.date.localeCompare(left.date) || left.type.localeCompare(right.type)),
    tags: [...tags.values()]
      .map((item) => ({
        ...item,
        precision: percent(item.kept, item.suggested),
        recall: percent(item.kept, item.final),
        errors: item.wrong + item.missed,
      }))
      .sort((left, right) => right.errors - left.errors || right.suggested - left.suggested)
      .slice(0, 100),
    confusions: [...confusions.values()]
      .sort((left, right) => right.count - left.count || left.fromTag.localeCompare(right.fromTag))
      .slice(0, 50),
    versions: [...versions.values()]
      .map((item) => ({
        ...item,
        exactMatchRate: percent(item.exactMatches, item.reviewed),
        correctionRate: percent(item.corrected, item.reviewed),
      }))
      .sort((left, right) => right.reviewed - left.reviewed),
  };
}

export async function getLivechatAiQaPreReviewAnalytics(env, filters = {}) {
  const tables = await ensureLivechatAiQaTables(env);
  const reviewType = ["auto_tag", "agent_qa"].includes(filters.reviewType) ? filters.reviewType : "all";
  const autoWhere = dateWhere("r", filters);
  const agentWhere = dateWhere("r", filters);
  const autoFeedbackWhere = feedbackWhere("f", filters);
  const agentFeedbackWhere = feedbackWhere("f", filters);
  const pipelineBinds = [filters.from, filters.to];

  const statements = [
    env.DB.prepare(`
      SELECT id, chat_id, thread_id, status, ai_model, ai_fallback_model, prompt_version,
             suggested_tags_json, final_tags_json, ai_overall_confidence, reviewed_at, reviewer
      FROM ${tables.reviews} r
      WHERE ${autoWhere.where}
      ORDER BY reviewed_at DESC
      LIMIT 20000
    `).bind(...autoWhere.binds),
    env.DB.prepare(`
      SELECT id, chat_id, thread_id, status, ai_model, ai_fallback_model, prompt_version,
             check_tags_json, final_tags_json, ai_overall_confidence, reviewed_at, reviewer
      FROM ${tables.agentQaReviews} r
      WHERE ${agentWhere.where}
      ORDER BY reviewed_at DESC
      LIMIT 20000
    `).bind(...agentWhere.binds),
    env.DB.prepare(`
      SELECT 'auto_tag' AS type, r.chat_id, r.thread_id, f.tag, f.feedback_type,
             CASE WHEN f.ai_suggested = 1 THEN f.tag ELSE '' END AS ai_tag,
             CASE WHEN f.final_selected = 1 THEN f.tag ELSE '' END AS final_tag,
             f.comment, f.reviewer, f.created_at
      FROM ${tables.feedback} f
      JOIN ${tables.reviews} r ON r.id = f.review_id
      WHERE ${autoFeedbackWhere.where} AND f.comment <> ''
      ORDER BY f.created_at DESC
      LIMIT 30
    `).bind(...autoFeedbackWhere.binds),
    env.DB.prepare(`
      SELECT 'agent_qa' AS type, r.chat_id, r.thread_id, f.rule_key AS tag, f.feedback_type,
             f.ai_tag, f.final_tag, f.comment, f.reviewer, f.created_at
      FROM ${tables.agentQaFeedback} f
      JOIN ${tables.agentQaReviews} r ON r.id = f.review_id
      WHERE ${agentFeedbackWhere.where} AND f.comment <> ''
      ORDER BY f.created_at DESC
      LIMIT 30
    `).bind(...agentFeedbackWhere.binds),
    env.DB.prepare(`
      SELECT 'auto_tag' AS type, ai_status, COUNT(*) AS count
      FROM ${tables.reviews}
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY ai_status
    `).bind(...pipelineBinds),
    env.DB.prepare(`
      SELECT 'agent_qa' AS type, ai_status, COUNT(*) AS count
      FROM ${tables.agentQaReviews}
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY ai_status
    `).bind(...pipelineBinds),
    env.DB.prepare(`
      SELECT usage_date, neuron_limit, requests_count, skipped_count, failed_count,
             estimated_neurons, actual_neurons, prompt_tokens, completion_tokens
      FROM ${tables.usageDaily}
      WHERE usage_date >= substr(?, 1, 10) AND usage_date <= substr(?, 1, 10)
      ORDER BY usage_date DESC
    `).bind(...pipelineBinds),
    env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM ${tables.knowledgeBase} WHERE status = 'active') AS auto_tag,
        (SELECT COUNT(*) FROM ${tables.agentQaKnowledgeBase} WHERE status = 'active') AS agent_qa
    `),
  ];

  const results = await env.DB.batch(statements);
  const analysis = analyzeReviews(results[0].results || [], results[1].results || [], reviewType);
  const recentComments = [...(results[2].results || []), ...(results[3].results || [])]
    .filter((row) => reviewType === "all" || row.type === reviewType)
    .sort((left, right) => `${right.created_at}`.localeCompare(`${left.created_at}`))
    .slice(0, 30)
    .map((row) => ({
      type: row.type,
      chatId: row.chat_id,
      threadId: row.thread_id,
      tag: canonicalAnalyticsTag(row.tag),
      feedbackType: row.feedback_type || "",
      aiTag: canonicalAnalyticsTag(row.ai_tag),
      finalTag: canonicalAnalyticsTag(row.final_tag),
      comment: row.comment || "",
      reviewer: row.reviewer || "",
      createdAt: row.created_at,
    }));

  const pipeline = [...(results[4].results || []), ...(results[5].results || [])]
    .filter((row) => reviewType === "all" || row.type === reviewType)
    .map((row) => ({ type: row.type, aiStatus: row.ai_status, count: Number(row.count || 0) }));
  const usage = (results[6].results || []).map((row) => ({
    date: row.usage_date,
    limit: Number(row.neuron_limit || 0),
    requests: Number(row.requests_count || 0),
    skipped: Number(row.skipped_count || 0),
    failed: Number(row.failed_count || 0),
    estimatedNeurons: Number(row.estimated_neurons || 0),
    actualNeurons: Number(row.actual_neurons || 0),
    promptTokens: Number(row.prompt_tokens || 0),
    completionTokens: Number(row.completion_tokens || 0),
  }));
  const usageTotals = usage.reduce(
    (total, row) => ({
      requests: total.requests + row.requests,
      skipped: total.skipped + row.skipped,
      failed: total.failed + row.failed,
      actualNeurons: total.actualNeurons + row.actualNeurons,
      limit: total.limit + row.limit,
    }),
    { requests: 0, skipped: 0, failed: 0, actualNeurons: 0, limit: 0 },
  );
  const knowledgeRow = results[7].results?.[0] || {};

  return {
    filters: { reviewType, from: filters.from, to: filters.to, reviewer: filters.reviewer || "" },
    ...analysis,
    pipeline,
    usage,
    usageTotals: {
      ...usageTotals,
      utilization: percent(usageTotals.actualNeurons, usageTotals.limit),
    },
    knowledge: {
      autoTag: Number(knowledgeRow.auto_tag || 0),
      agentQa: Number(knowledgeRow.agent_qa || 0),
      total: Number(knowledgeRow.auto_tag || 0) + Number(knowledgeRow.agent_qa || 0),
    },
    recentComments,
  };
}
