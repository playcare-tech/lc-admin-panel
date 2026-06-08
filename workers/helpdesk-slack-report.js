import { accountTableName } from "../functions/_lib/accounts.js";

const DEFAULT_TIME_ZONE = "Europe/Nicosia";
const DEFAULT_CHANNEL = "C0B8SQY3LNR";
const PUBLIC_REPLIES_DAILY_TABLE = "helpdesk_analytics_daily_v7";
const COMMENTS_DAILY_TABLE = "helpdesk_analytics_comment_daily_v1";
const DEFAULT_INCLUDED_AGENT_EMAILS = [
  "aleksandr.lavrushkin@boomerang-partners.com",
  "aleksandr.b@playcare.tech",
  "valerii.b@playcare.tech",
  "ryhor.a@playcare.tech",
  "tamazi.m@playcare.tech",
];
const DEFAULT_EXCLUDED_AGENT_EMAILS = ["daryia.spirydovich@boomerang-partners.com"];
const DEFAULT_INCLUDED_AGENT_NAMES = [
  "Megan",
  "Emma",
  "Alice",
  "Liliana",
  "Nicole",
  "Matt",
  "Oliver",
  "Nelly",
  "Robert",
  "Luke",
  "Gary",
  "Nate",
  "Litta",
  "Aaron",
  "Sarah",
  "Lara",
  "Celina",
  "Rosa",
  "Oscar",
  "Melany",
  "Beatrice",
  "Mollie",
  "Bob",
  "Jasper",
  "Leo",
  "Noah",
  "Billie",
  "Sandra",
  "Stella",
  "Kyle",
  "Layla",
  "Hugo",
  "Ian",
  "Kirk",
  "Nancy",
  "Jennie",
  "Otis",
  "Benedict",
  "Ben",
  "Sabrina",
  "Nicky",
  "Douglas",
  "Violet",
  "Ada",
  "Mia",
  "Murphy",
  "Zoe",
  "Michael",
  "Evelyn",
  "Milky",
  "Maryia Kavalchuk",
  "Anna Makarova",
  "Alesia Misura",
  "Alina Savchuk",
  "Kateryna Brezhneva",
  "Matvey Ivanov",
  "Oleg Fadeev",
  "Naima Voloshina",
  "Konstantin Dziamida",
  "Valeriya Ilhan",
  "Garnik Makvetsyan",
  "Timur Hamidov",
  "Aleksandr Lavrushkin",
  "Daria Potapova",
  "Andrey Solovyev",
  "Bela Boyajyan",
  "Victoria Namupala",
  "Mariia Priakhina",
  "Yehor Starchev",
  "Mikhail Desiatov",
  "Elgin Bakhishov",
  "Yury Rybakov",
  "Irada Mukhtarova",
  "Oscar Tuleshov",
  "Arslan Abubikirov",
  "Zhomart Adanbekov",
  "Artemiy Selyushkov",
  "Maksim Yerdenov",
  "Alexandra Mirzaliyeva",
  "Elizaveta Kozlovskaya",
  "Stepan Ptashnik",
  "Nikolay Baranchuk",
  "Arman Harutyunyan",
  "Ilya Pantsiukhou",
  "Alexander Shishkin",
  "Hanna Mashchytskaya",
  "Khushnur Turgunbaev",
  "Ivan Sakovich",
  "Igor Filonik",
  "Vladislav Kholkin",
  "Anastasiia Amelkina",
  "Mikhail Kipel",
  "Anatoliy Tolstov",
  "Aldiyar Kadyrbekov",
  "Anastasiia Kozlova",
  "Alisa Maisiuk",
  "Anastasiya Leonchikova",
  "Nikita Tsyganov",
  "Gurgen Abelyan",
  "Sofia Kalinovskaya",
  "Viktoria Zaitsava",
  "Oswald",
  "Stan",
  "Freya",
  "Rachel",
];
const DEFAULT_EXCLUDED_EMAIL_DOMAINS = ["playtraffpartners.com"];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function dateKeyInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function localHourInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { hour: Number(value.hour), minute: Number(value.minute) };
}

function addDateKeyDays(value, days) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function reportDateForNow(now, timeZone) {
  return addDateKeyDays(dateKeyInTimeZone(now, timeZone), -1);
}

function localWeekdayInTimeZone(date, timeZone) {
  const value = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[value] ?? 0;
}

function previousWeekRangeForNow(now, timeZone) {
  const today = dateKeyInTimeZone(now, timeZone);
  const weekday = localWeekdayInTimeZone(now, timeZone);
  const currentMonday = addDateKeyDays(today, -((weekday + 6) % 7));
  const from = addDateKeyDays(currentMonday, -7);
  return { from, to: addDateKeyDays(from, 6) };
}

function displayDate(dateKey) {
  const [year, month, day] = `${dateKey || ""}`.split("-");
  return year && month && day ? `${day}/${month}/${year}` : dateKey;
}

function validateDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(`${value || ""}`) ? value : "";
}

function shouldSendForSchedule(now, timeZone) {
  const local = localHourInTimeZone(now, timeZone);
  return local.hour === 9 && local.minute === 0;
}

async function readDailyRows(env, tableBaseName, date) {
  const table = accountTableName(env, tableBaseName);
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS ${table} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      agent_name TEXT,
      agent_email TEXT,
      handled_tickets INTEGER NOT NULL DEFAULT 0,
      cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, agent_id)
    )`,
  ).run();
  const { results } = await env.DB.prepare(
    `SELECT agent_id, agent_name, agent_email, handled_tickets
     FROM ${table}
     WHERE date = ? AND handled_tickets > 0
     ORDER BY handled_tickets DESC, agent_name ASC, agent_email ASC`,
  )
    .bind(date)
    .all();
  return (results || [])
    .map((row) => ({
      agentId: String(row.agent_id || ""),
      name: String(row.agent_name || row.agent_id || "Unknown agent"),
      email: String(row.agent_email || ""),
      count: Number(row.handled_tickets || 0),
    }))
    .filter((row) => isIncludedReportAgent(env, row));
}

async function readWeeklyRows(env, tableBaseName, fromDate, toDate) {
  const table = accountTableName(env, tableBaseName);
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS ${table} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      agent_name TEXT,
      agent_email TEXT,
      handled_tickets INTEGER NOT NULL DEFAULT 0,
      cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, agent_id)
    )`,
  ).run();
  const { results } = await env.DB.prepare(
    `SELECT
       agent_id,
       COALESCE(MAX(NULLIF(agent_name, '')), agent_id) AS agent_name,
       COALESCE(MAX(NULLIF(agent_email, '')), '') AS agent_email,
       SUM(handled_tickets) AS handled_tickets
     FROM ${table}
     WHERE date >= ? AND date <= ? AND handled_tickets > 0
     GROUP BY agent_id
     ORDER BY handled_tickets DESC, agent_name ASC, agent_email ASC`,
  )
    .bind(fromDate, toDate)
    .all();
  return (results || [])
    .map((row) => ({
      agentId: String(row.agent_id || ""),
      name: String(row.agent_name || row.agent_id || "Unknown agent"),
      email: String(row.agent_email || ""),
      count: Number(row.handled_tickets || 0),
    }))
    .filter((row) => isIncludedReportAgent(env, row));
}

function excludedEmailDomains(env) {
  const configured = `${env.HELPDESK_SLACK_EXCLUDED_EMAIL_DOMAINS || ""}`
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
  return configured.length ? configured : DEFAULT_EXCLUDED_EMAIL_DOMAINS;
}

function isExcludedReportAgent(env, row) {
  const email = `${row.email || ""}`.trim().toLowerCase();
  if (!email.includes("@")) return false;
  return excludedEmailDomains(env).some((domain) => email.endsWith(`@${domain}`));
}

function normalizeAgentValue(value) {
  return `${value || ""}`.trim().toLowerCase();
}

function isDefaultHelpDeskAnalyticsAgent(row) {
  const name = normalizeAgentValue(row.name);
  const email = normalizeAgentValue(row.email);
  if (DEFAULT_EXCLUDED_AGENT_EMAILS.map(normalizeAgentValue).includes(email)) return false;
  return DEFAULT_INCLUDED_AGENT_NAMES.map(normalizeAgentValue).includes(name) || DEFAULT_INCLUDED_AGENT_EMAILS.map(normalizeAgentValue).includes(email);
}

function isIncludedReportAgent(env, row) {
  return !isExcludedReportAgent(env, row) && isDefaultHelpDeskAnalyticsAgent(row);
}

function formatReport(title, date, rows, countLabel) {
  const lines = [`${title} ${displayDate(date)}:`];
  if (!rows.length) {
    lines.push("No data recorded.");
    return lines.join("\n");
  }

  rows.forEach((row, index) => {
    const email = row.email || "-";
    lines.push(`${index + 1}. ${row.name} - ${email} - ${row.count} ${countLabel}`);
  });
  return lines.join("\n");
}

async function buildReports(env, date) {
  if (!env?.DB) throw new Error("Missing DB binding.");

  const publicReplyRows = await readDailyRows(env, PUBLIC_REPLIES_DAILY_TABLE, date);
  const commentRows = await readDailyRows(env, COMMENTS_DAILY_TABLE, date);

  return [
    {
      metric: "public_replies",
      text: formatReport("HelpDesk Public replies Report", date, publicReplyRows, "sent replies"),
      rows: publicReplyRows,
    },
    {
      metric: "comments",
      text: formatReport("HelpDesk internal comments Report", date, commentRows, "private messages"),
      rows: commentRows,
    },
  ];
}

async function buildWeeklyReports(env, fromDate, toDate) {
  if (!env?.DB) throw new Error("Missing DB binding.");

  const publicReplyRows = await readWeeklyRows(env, PUBLIC_REPLIES_DAILY_TABLE, fromDate, toDate);
  const commentRows = await readWeeklyRows(env, COMMENTS_DAILY_TABLE, fromDate, toDate);

  return [
    {
      metric: "public_replies",
      sheetName: "Public replies",
      title: "HelpDesk Public replies Report",
      countHeader: "Sent replies",
      countLabel: "sent replies",
      rows: publicReplyRows,
    },
    {
      metric: "comments",
      sheetName: "Internal comments",
      title: "HelpDesk internal comments Report",
      countHeader: "Private messages",
      countLabel: "private messages",
      rows: commentRows,
    },
  ];
}

function escapeXml(value) {
  return `${value ?? ""}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function columnName(index) {
  let value = "";
  let current = index;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    value = String.fromCharCode(65 + remainder) + value;
    current = Math.floor((current - 1) / 26);
  }
  return value;
}

function xlsxCell(rowIndex, colIndex, value) {
  const ref = `${columnName(colIndex)}${rowIndex}`;
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
}

function xlsxRow(rowIndex, values) {
  return `<row r="${rowIndex}">${values.map((value, index) => xlsxCell(rowIndex, index + 1, value)).join("")}</row>`;
}

function buildWorksheetXml(report, fromDate, toDate) {
  const rows = [
    [report.title],
    [`Period: ${displayDate(fromDate)} - ${displayDate(toDate)}`],
    [],
    ["#", "Agent name", "Email", report.countHeader],
    ...report.rows.map((row, index) => [index + 1, row.name, row.email || "-", row.count]),
  ];

  const sheetRows = rows
    .map((row, index) => xlsxRow(index + 1, row))
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="8" customWidth="1"/>
    <col min="2" max="2" width="24" customWidth="1"/>
    <col min="3" max="3" width="38" customWidth="1"/>
    <col min="4" max="4" width="18" customWidth="1"/>
  </cols>
  <sheetData>${sheetRows}</sheetData>
</worksheet>`;
}

function buildWorkbookXml(reports) {
  const sheets = reports
    .map((report, index) => `<sheet name="${escapeXml(report.sheetName)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheets}</sheets>
</workbook>`;
}

function buildWorkbookRelsXml(reports) {
  const sheetRels = reports
    .map(
      (_report, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheetRels}
</Relationships>`;
}

function buildContentTypesXml(reports) {
  const sheetOverrides = reports
    .map(
      (_report, index) =>
        `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheetOverrides}
</Types>`;
}

function buildRootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(view, offset, value) {
  view.setUint16(offset, value, true);
}

function writeUint32(view, offset, value) {
  view.setUint32(offset, value, true);
}

function concatBytes(parts) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function zipStored(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = typeof file.data === "string" ? encoder.encode(file.data) : file.data;
    const crc = crc32(dataBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    writeUint32(localView, 0, 0x04034b50);
    writeUint16(localView, 4, 20);
    writeUint16(localView, 6, 0);
    writeUint16(localView, 8, 0);
    writeUint16(localView, 10, 0);
    writeUint16(localView, 12, 0);
    writeUint32(localView, 14, crc);
    writeUint32(localView, 18, dataBytes.length);
    writeUint32(localView, 22, dataBytes.length);
    writeUint16(localView, 26, nameBytes.length);
    writeUint16(localView, 28, 0);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    writeUint32(centralView, 0, 0x02014b50);
    writeUint16(centralView, 4, 20);
    writeUint16(centralView, 6, 20);
    writeUint16(centralView, 8, 0);
    writeUint16(centralView, 10, 0);
    writeUint16(centralView, 12, 0);
    writeUint16(centralView, 14, 0);
    writeUint32(centralView, 16, crc);
    writeUint32(centralView, 20, dataBytes.length);
    writeUint32(centralView, 24, dataBytes.length);
    writeUint16(centralView, 28, nameBytes.length);
    writeUint16(centralView, 30, 0);
    writeUint16(centralView, 32, 0);
    writeUint16(centralView, 34, 0);
    writeUint16(centralView, 36, 0);
    writeUint32(centralView, 38, 0);
    writeUint32(centralView, 42, offset);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + dataBytes.length;
  }

  const centralDirectory = concatBytes(centralParts);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  writeUint32(endView, 0, 0x06054b50);
  writeUint16(endView, 4, 0);
  writeUint16(endView, 6, 0);
  writeUint16(endView, 8, files.length);
  writeUint16(endView, 10, files.length);
  writeUint32(endView, 12, centralDirectory.length);
  writeUint32(endView, 16, offset);
  writeUint16(endView, 20, 0);

  return concatBytes([...localParts, centralDirectory, end]);
}

function buildWeeklyWorkbook(reports, fromDate, toDate) {
  const files = [
    { name: "[Content_Types].xml", data: buildContentTypesXml(reports) },
    { name: "_rels/.rels", data: buildRootRelsXml() },
    { name: "xl/workbook.xml", data: buildWorkbookXml(reports) },
    { name: "xl/_rels/workbook.xml.rels", data: buildWorkbookRelsXml(reports) },
    ...reports.map((report, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      data: buildWorksheetXml(report, fromDate, toDate),
    })),
  ];
  return zipStored(files);
}

async function postSlackMessage(env, text) {
  const token = `${env.SLACK_BOT_TOKEN || ""}`.trim();
  if (!token) throw new Error("Missing SLACK_BOT_TOKEN secret.");

  const channel = `${env.SLACK_HELPDESK_REPORT_CHANNEL || DEFAULT_CHANNEL}`.trim();
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ channel, text }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    throw new Error(`Slack post failed: ${payload.error || response.status}`);
  }
  return { channel: payload.channel, ts: payload.ts };
}

async function slackApi(env, method, body) {
  const token = `${env.SLACK_BOT_TOKEN || ""}`.trim();
  if (!token) throw new Error("Missing SLACK_BOT_TOKEN secret.");

  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(body || {})) {
    form.set(key, typeof value === "string" ? value : JSON.stringify(value));
  }

  const response = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    },
    body: form.toString(),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    const messages = payload.response_metadata?.messages?.join("; ");
    throw new Error(`Slack ${method} failed: ${payload.error || response.status}${messages ? ` (${messages})` : ""}`);
  }
  return payload;
}

async function uploadSlackFile(env, { bytes, filename, title, initialComment }) {
  const channel = `${env.SLACK_HELPDESK_REPORT_CHANNEL || DEFAULT_CHANNEL}`.trim();
  const upload = await slackApi(env, "files.getUploadURLExternal", {
    filename,
    length: bytes.length,
  });

  const uploadResponse = await fetch(upload.upload_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    body: bytes,
  });
  if (!uploadResponse.ok) {
    throw new Error(`Slack file upload failed: ${uploadResponse.status}`);
  }

  const complete = await slackApi(env, "files.completeUploadExternal", {
    channel_id: channel,
    initial_comment: initialComment,
    files: [{ id: upload.file_id, title }],
  });

  return { channel, fileId: upload.file_id, files: complete.files || [] };
}

async function sendReports(env, { date, dryRun = false } = {}) {
  const reportDate = validateDateKey(date) || reportDateForNow(new Date(), env.HELPDESK_ANALYTICS_TIME_ZONE || DEFAULT_TIME_ZONE);
  const reports = await buildReports(env, reportDate);
  const posts = [];

  if (!dryRun) {
    for (const report of reports) {
      posts.push(await postSlackMessage(env, report.text));
    }
  }

  return { date: reportDate, dryRun, reports, posts };
}

async function sendWeeklyReport(env, { fromDate, toDate, dryRun = false } = {}) {
  const timeZone = env.HELPDESK_ANALYTICS_TIME_ZONE || DEFAULT_TIME_ZONE;
  const range =
    validateDateKey(fromDate) && validateDateKey(toDate)
      ? { from: fromDate, to: toDate }
      : previousWeekRangeForNow(new Date(), timeZone);
  const reports = await buildWeeklyReports(env, range.from, range.to);
  const files = reports.map((report) => {
    const workbook = buildWeeklyWorkbook([report], range.from, range.to);
    const metricSlug = report.metric === "comments" ? "internal-comments" : "public-replies";
    return {
      metric: report.metric,
      filename: `helpdesk-weekly-${metricSlug}-${range.from}-to-${range.to}.xlsx`,
      title: `${report.title} ${displayDate(range.from)} - ${displayDate(range.to)}`,
      initialComment: `${report.title} ${displayDate(range.from)} - ${displayDate(range.to)}`,
      byteLength: workbook.length,
      bytes: workbook,
    };
  });
  const uploads = [];

  if (!dryRun) {
    for (const file of files) {
      uploads.push(
        await uploadSlackFile(env, {
          bytes: file.bytes,
          filename: file.filename,
          title: file.title,
          initialComment: file.initialComment,
        }),
      );
    }
  }

  return {
    fromDate: range.from,
    toDate: range.to,
    dryRun,
    files: files.map(({ bytes, ...file }) => file),
    reports,
    uploads,
  };
}

function manualRequestAllowed(request, env) {
  const expectedToken = `${env.SLACK_REPORT_TOKEN || ""}`.trim();
  if (!expectedToken) return false;
  const header = request.headers.get("Authorization") || "";
  return header === `Bearer ${expectedToken}`;
}

export default {
  async scheduled(event, env, ctx) {
    const timeZone = env.HELPDESK_ANALYTICS_TIME_ZONE || DEFAULT_TIME_ZONE;
    const now = new Date(event.scheduledTime || Date.now());
    if (!shouldSendForSchedule(now, timeZone)) return;

    const tasks = [sendReports(env, { date: reportDateForNow(now, timeZone) })];
    if (localWeekdayInTimeZone(now, timeZone) === 1) {
      const range = previousWeekRangeForNow(now, timeZone);
      tasks.push(sendWeeklyReport(env, { fromDate: range.from, toDate: range.to }));
    }
    ctx.waitUntil(Promise.all(tasks));
  },

  async fetch(request, env) {
    if (!manualRequestAllowed(request, env)) return json({ ok: false, error: "unauthorized" }, 401);

    try {
      const url = new URL(request.url);
      const dryRun = url.searchParams.get("dry_run") === "1";
      const result =
        url.searchParams.get("weekly") === "1"
          ? await sendWeeklyReport(env, {
              fromDate: validateDateKey(url.searchParams.get("from")),
              toDate: validateDateKey(url.searchParams.get("to")),
              dryRun,
            })
          : await sendReports(env, {
              date: validateDateKey(url.searchParams.get("date")),
              dryRun,
            });
      return json({ ok: true, ...result });
    } catch (error) {
      console.error("Failed to send HelpDesk Slack report.", error);
      return json({ ok: false, error: error.message || "Failed to send HelpDesk Slack report." }, 500);
    }
  },
};
