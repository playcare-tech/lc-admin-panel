import { accountTableName } from "../functions/_lib/accounts.js";
import { helpDeskAnalyticsAgentProfile } from "../functions/_lib/helpdesk-analytics-agents.js";

const DEFAULT_TIME_ZONE = "Europe/Nicosia";
const DEFAULT_CHANNEL = "C0B8SQY3LNR";
const PUBLIC_REPLIES_DAILY_TABLE = "helpdesk_analytics_daily_v7";
const PUBLIC_REPLIES_DETAILS_TABLE = "helpdesk_analytics_reply_details_v4";
const COMMENTS_DAILY_TABLE = "helpdesk_analytics_comment_daily_v1";
const COMMENTS_DETAILS_TABLE = "helpdesk_analytics_comment_details_v1";
const DEFAULT_INCLUDED_AGENT_EMAILS = [
  "maryia.kavalchuk@boomerang-partners.com",
  "alina.savchuk@boomerang-partners.com",
  "matvey.ivanov@boomerang-partners.com",
  "kateryna.brezhneva@boomerang-partners.com",
  "daniil.yermakovich@boomerang-partners.com",
  "naima.voloshina@boomerang-partners.com",
  "oleg.fadeev@boomerang-partners.com",
  "valeriya.ilhan@boomerang-partners.com",
  "garnik.makvetsyan@boomerang-partners.com",
  "aleksandr.lavrushkin@boomerang-partners.com",
  "daria.potapova@boomerang-partners.com",
  "andrey.solovyev@boomerang-partners.com",
  "victoria.namupala@boomerang-partners.com",
  "mariia.priakhina@boomerang-partners.com",
  "yehor.starchev@boomerang-partners.com",
  "mikhail.desiatov@boomerang-partners.com",
  "elgin.bakhishov@boomerang-partners.com",
  "yury.rybakov@boomerang-partners.com",
  "irada.muxtarova@boomerang-partners.com",
  "arslan.abubikirov@boomerang-partners.com",
  "zhomart.adanbekov@boomerang-partners.com",
  "maksim.yerdenov@boomerang-partners.com",
  "elizaveta.kozlovskaya@boomerang-partners.com",
  "tamerlan.aghamaliyev@boomerang-partners.com",
  "nikolay.baranchuk@boomerang-partners.com",
  "arman.harutyunyan@boomerang-partners.com",
  "ilya.pantsiukhou@boomerang-partners.com",
  "hanna.mashchytskaya@boomerang-partners.com",
  "khushnur.turgunbaev@boomerang-partners.com",
  "ivan.sakovich@boomerang-partners.com",
  "vladislav.kholkin@boomerang-partners.com",
  "mikhail.kipel@boomerang-partners.com",
  "ihar.filonik@boomerang-partners.com",
  "anatoliy.tolstov@boomerang-partners.com",
  "anastasiia.amelkina@boomerang-partners.com",
  "alisa.maisiuk@boomerang-partners.com",
  "anastasiia.kozlova@boomerang-partners.com",
  "gurgen.a@playcare.tech",
  "oleh.v@playcare.tech",
  "nikita.t@playcare.tech",
  "anastasiya.l@playcare.tech",
  "sofia.k@playcare.tech",
  "viktoria.z@playcare.tech",
  "aleksandr.b@playcare.tech",
  "ryhor.a@playcare.tech",
  "tamazi.m@playcare.tech",
  "kiryl.ch@playcare.tech",
  "elijah.b@playcare.tech",
  "mikhail.g@playcare.tech",
  "aytun.m@playcare.tech",
  "yuri.p@playcare.tech",
  "marina.g@playcare.tech",
  "ivo.k@playcare.tech",
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
  "Mikhail G",
  "Sofia Kalinovskaya",
  "Viktoria Zaitsava",
  "Oswald",
  "Stan",
  "Freya",
  "Rachel",
];
const DEFAULT_EXCLUDED_EMAIL_DOMAINS = [];

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

function previousMonthRangeForNow(now, timeZone) {
  const today = dateKeyInTimeZone(now, timeZone);
  const [year, month] = today.split("-").map(Number);
  const firstOfCurrentMonth = new Date(Date.UTC(year, month - 1, 1, 12));
  const previousMonthEnd = addDateKeyDays(firstOfCurrentMonth.toISOString().slice(0, 10), -1);
  return { from: previousMonthEnd.slice(0, 8) + "01", to: previousMonthEnd };
}

function localMonthDayInTimeZone(date, timeZone) {
  return Number(dateKeyInTimeZone(date, timeZone).slice(8, 10));
}

function dateKeysBetween(fromDate, toDate) {
  const dates = [];
  let cursor = fromDate;
  while (cursor <= toDate) {
    dates.push(cursor);
    cursor = addDateKeyDays(cursor, 1);
  }
  return dates;
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

function defaultAgentNameFromEmail(email) {
  const localPart = String(email || "").split("@")[0] || "";
  const name = localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return name || email;
}

function defaultIncludedReportAgents() {
  const excludedEmails = new Set(DEFAULT_EXCLUDED_AGENT_EMAILS.map(normalizeAgentValue));
  const agents = new Map();
  for (const email of DEFAULT_INCLUDED_AGENT_EMAILS) {
    const normalizedEmail = normalizeAgentValue(email);
    if (!normalizedEmail || excludedEmails.has(normalizedEmail)) continue;
    agents.set(normalizedEmail, {
      agentId: `default:${normalizedEmail}`,
      name: defaultAgentNameFromEmail(normalizedEmail),
      email: normalizedEmail,
    });
  }
  return [...agents.values()];
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

const METRIC_REPORT_CONFIGS = [
  {
    metric: "public_replies",
    dailyTable: PUBLIC_REPLIES_DAILY_TABLE,
    detailsTable: PUBLIC_REPLIES_DETAILS_TABLE,
    sheetName: "Public replies",
    title: "HelpDesk Public replies Report",
    countHeader: "Sent replies",
    timeLabel: "Reply time",
  },
  {
    metric: "comments",
    dailyTable: COMMENTS_DAILY_TABLE,
    detailsTable: COMMENTS_DETAILS_TABLE,
    sheetName: "Internal comments",
    title: "HelpDesk internal comments Report",
    countHeader: "Private messages",
    timeLabel: "Comment time",
  },
];

async function ensureDailyReportTable(env, tableBaseName) {
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
  return table;
}

async function ensureDetailReportTable(env, tableBaseName) {
  const table = accountTableName(env, tableBaseName);
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS ${table} (
      event_key TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      agent_name TEXT,
      agent_email TEXT,
      ticket_id TEXT,
      short_id TEXT,
      event_date TEXT,
      cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ).run();
  return table;
}

async function readReportRange(env, config, fromDate, toDate) {
  const dailyTable = await ensureDailyReportTable(env, config.dailyTable);
  const detailsTable = await ensureDetailReportTable(env, config.detailsTable);
  const daily = await env.DB.prepare(
    `SELECT date, agent_id, agent_name, agent_email, handled_tickets
     FROM ${dailyTable}
     WHERE date >= ? AND date <= ? AND handled_tickets > 0
     ORDER BY date ASC, handled_tickets DESC, agent_name ASC, agent_email ASC`,
  )
    .bind(fromDate, toDate)
    .all();
  const details = await env.DB.prepare(
    `SELECT date, agent_id, agent_name, agent_email, ticket_id, short_id, event_date, event_key
     FROM ${detailsTable}
     WHERE date >= ? AND date <= ?
     ORDER BY date ASC, event_date ASC, short_id ASC`,
  )
    .bind(fromDate, toDate)
    .all();

  return buildMetricReport(env, config, fromDate, toDate, daily.results || [], details.results || []);
}

function buildMetricReport(env, config, fromDate, toDate, dailyRows, detailRows) {
  const days = dateKeysBetween(fromDate, toDate);
  const agentsById = new Map();

  const ensureAgent = (row) => {
    const agentId = String(row.agent_id || row.agentId || "");
    if (!agentId) return null;
    const override = helpDeskAnalyticsAgentProfile(agentId);
    const profile = {
      agentId,
      name: String(override?.name || row.agent_name || row.name || agentId || "Unknown agent"),
      email: String(override?.email || row.agent_email || row.email || ""),
    };
    if (!isIncludedReportAgent(env, profile)) return null;
    if (!agentsById.has(agentId)) {
      agentsById.set(agentId, {
        agentId,
        name: profile.name,
        email: profile.email,
        total: 0,
        days: new Map(days.map((date) => [date, 0])),
        details: [],
      });
    }
    const agent = agentsById.get(agentId);
    agent.name = agent.name || profile.name;
    agent.email = agent.email || profile.email;
    return agent;
  };

  for (const row of dailyRows) {
    const agent = ensureAgent(row);
    if (!agent) continue;
    const date = String(row.date || "");
    const count = Number(row.handled_tickets || 0);
    agent.days.set(date, Number(agent.days.get(date) || 0) + count);
    agent.total += count;
  }

  for (const detail of detailRows) {
    const agent = ensureAgent(detail);
    if (!agent) continue;
    agent.details.push({
      date: String(detail.date || ""),
      ticketId: String(detail.ticket_id || ""),
      shortId: String(detail.short_id || detail.ticket_id || ""),
      eventDate: String(detail.event_date || ""),
      eventKey: String(detail.event_key || ""),
      points: 1,
    });
  }

  const existingEmails = new Set(
    [...agentsById.values()]
      .map((agent) => normalizeAgentValue(agent.email))
      .filter(Boolean),
  );
  const existingNames = new Set(
    [...agentsById.values()]
      .map((agent) => normalizeAgentValue(agent.name))
      .filter(Boolean),
  );
  for (const defaultAgent of defaultIncludedReportAgents()) {
    const email = normalizeAgentValue(defaultAgent.email);
    const name = normalizeAgentValue(defaultAgent.name);
    if (existingEmails.has(email) || existingNames.has(name)) continue;
    if (!isIncludedReportAgent(env, defaultAgent)) continue;
    agentsById.set(defaultAgent.agentId, {
      agentId: defaultAgent.agentId,
      name: defaultAgent.name,
      email: defaultAgent.email,
      total: 0,
      days: new Map(days.map((date) => [date, 0])),
      details: [],
    });
    existingEmails.add(email);
    existingNames.add(name);
  }

  for (const agent of agentsById.values()) {
    if (!agent.total && agent.details.length) {
      agent.days = new Map(days.map((date) => [date, 0]));
      for (const detail of agent.details) {
        if (agent.days.has(detail.date)) agent.days.set(detail.date, Number(agent.days.get(detail.date) || 0) + 1);
      }
      agent.total = [...agent.days.values()].reduce((sum, count) => sum + Number(count || 0), 0);
    }
    agent.details.sort((left, right) => {
      const dateOrder = left.date.localeCompare(right.date);
      return dateOrder || left.eventDate.localeCompare(right.eventDate) || left.shortId.localeCompare(right.shortId);
    });
  }

  const rows = [...agentsById.values()]
    .sort((left, right) => Number(right.total || 0) - Number(left.total || 0) || left.name.localeCompare(right.name) || left.email.localeCompare(right.email))
    .map((agent, index) => ({
      ...agent,
      rank: index + 1,
      dayCounts: days.map((date) => Number(agent.days.get(date) || 0)),
    }));
  const timeline = days.map((date, index) => ({
    date,
    count: rows.reduce((sum, row) => sum + Number(row.dayCounts[index] || 0), 0),
  }));

  return {
    ...config,
    fromDate,
    toDate,
    days,
    rows,
    timeline,
    total: rows.reduce((sum, row) => sum + Number(row.total || 0), 0),
    activeAgents: rows.filter((row) => Number(row.total || 0) > 0).length,
  };
}

async function buildReportsForRange(env, fromDate, toDate) {
  if (!env?.DB) throw new Error("Missing DB binding.");
  return Promise.all(METRIC_REPORT_CONFIGS.map((config) => readReportRange(env, config, fromDate, toDate)));
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
  const text = `${value ?? ""}`;
  const preserve = text.trim() !== text ? ' xml:space="preserve"' : "";
  return `<c r="${ref}" t="inlineStr"><is><t${preserve}>${escapeXml(text)}</t></is></c>`;
}

function xlsxRow(rowIndex, values) {
  return `<row r="${rowIndex}">${values.map((value, index) => xlsxCell(rowIndex, index + 1, value)).join("")}</row>`;
}

function buildWorksheetXml(sheet) {
  const sheetRows = sheet.rows
    .map((row, index) => xlsxRow(index + 1, row))
    .join("");
  const widths = sheet.widths || [];
  const cols = widths.length
    ? `<cols>${widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join("")}</cols>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  ${cols}
  <sheetData>${sheetRows}</sheetData>
</worksheet>`;
}

function buildWorkbookXml(sheets) {
  const sheetRefs = sheets
    .map((sheet, index) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheetRefs}</sheets>
</workbook>`;
}

function buildWorkbookRelsXml(sheets) {
  const sheetRels = sheets
    .map((_sheet, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheetRels}
</Relationships>`;
}

function buildContentTypesXml(sheets) {
  const sheetOverrides = sheets
    .map((_sheet, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
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

function safeXlsxSheetName(value, fallback = "Sheet") {
  const name = `${value || fallback}`
    .replace(/[\\/?*:[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^'+|'+$/g, "");
  return (name || fallback).slice(0, 31);
}

function uniqueXlsxSheetName(value, usedNames, fallback = "Sheet") {
  const base = safeXlsxSheetName(value, fallback);
  let name = base;
  let index = 2;
  while (usedNames.has(name.toLowerCase())) {
    const suffix = ` ${index}`;
    name = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    index += 1;
  }
  usedNames.add(name.toLowerCase());
  return name;
}

function displayDateTime(value, timeZone) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function combinedAgentSummaryRows(reports) {
  const publicReplies = reports.find((report) => report.metric === "public_replies");
  const internalComments = reports.find((report) => report.metric === "comments");
  const agents = new Map();

  const mergeReport = (report, field) => {
    for (const row of report?.rows || []) {
      const normalizedEmail = normalizeAgentValue(row.email);
      const normalizedName = normalizeAgentValue(row.name);
      const key = row.agentId ? `id:${row.agentId}` : normalizedEmail ? `email:${normalizedEmail}` : `name:${normalizedName}`;
      const current = agents.get(key) || {
        agentId: row.agentId || "",
        name: row.name || row.agentId || "Unknown agent",
        email: row.email || "",
        publicReplies: 0,
        internalComments: 0,
      };
      current.agentId ||= row.agentId || "";
      current.name ||= row.name || row.agentId || "Unknown agent";
      current.email ||= row.email || "";
      current[field] += Number(row.total || 0);
      agents.set(key, current);
    }
  };

  mergeReport(publicReplies, "publicReplies");
  mergeReport(internalComments, "internalComments");

  const rows = [...agents.values()].sort(
    (left, right) =>
      right.publicReplies - left.publicReplies ||
      right.internalComments - left.internalComments ||
      left.name.localeCompare(right.name) ||
      left.email.localeCompare(right.email),
  );

  return {
    publicRepliesTotal: rows.reduce((sum, row) => sum + row.publicReplies, 0),
    internalCommentsTotal: rows.reduce((sum, row) => sum + row.internalComments, 0),
    rows: rows.map((row, index) => [index + 1, row.name, row.email || row.agentId || "-", row.publicReplies, row.internalComments]),
  };
}

function reportWorkbookSheets(reports, { title, periodLabel, timeZone }) {
  const usedNames = new Set();
  const summary = combinedAgentSummaryRows(reports);
  const sheets = [
    {
      name: uniqueXlsxSheetName("Summary", usedNames),
      widths: [8, 28, 38, 18, 20],
      rows: [
        [title],
        [`Period: ${periodLabel}`],
        [`Generated: ${displayDateTime(new Date().toISOString(), timeZone)}`],
        [],
        ["Rank", "Agent name", "Email", "Public Replies", "Internal Comments"],
        ["", "Account summary", "", summary.publicRepliesTotal, summary.internalCommentsTotal],
        ...summary.rows,
      ],
    },
  ];

  for (const report of reports) {
    for (const agent of report.rows) {
      const detailRows = agent.details.length
        ? agent.details.map((detail) => [
            detail.date || "",
            detail.shortId || detail.ticketId || "",
            displayDateTime(detail.eventDate, timeZone),
            Number(detail.points || 1),
          ])
        : [["No details recorded for this agent in the selected period.", "", "", ""]];
      sheets.push({
        name: uniqueXlsxSheetName(`${report.metric === "comments" ? "Comments" : "Replies"} - ${agent.name}`, usedNames, "Agent"),
        widths: [16, 18, 24, 10],
        rows: [
          ["Agent", agent.name],
          ["Email / ID", agent.email || agent.agentId],
          [report.countHeader, Number(agent.total || 0)],
          ["Report", report.sheetName],
          ["Period", periodLabel],
          [],
          ["Counted date", "Ticket short ID", report.timeLabel, "Points"],
          ...detailRows,
        ],
      });
    }
  }

  return sheets;
}

function buildWorkbook(sheets) {
  const files = [
    { name: "[Content_Types].xml", data: buildContentTypesXml(sheets) },
    { name: "_rels/.rels", data: buildRootRelsXml() },
    { name: "xl/workbook.xml", data: buildWorkbookXml(sheets) },
    { name: "xl/_rels/workbook.xml.rels", data: buildWorkbookRelsXml(sheets) },
    ...sheets.map((sheet, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      data: buildWorksheetXml(sheet),
    })),
  ];
  return zipStored(files);
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

function periodLabel(fromDate, toDate) {
  return fromDate === toDate ? displayDate(fromDate) : `${displayDate(fromDate)} - ${displayDate(toDate)}`;
}

function reportFilename(periodType, fromDate, toDate) {
  return fromDate === toDate
    ? `helpdesk-${periodType}-report-${fromDate}.xlsx`
    : `helpdesk-${periodType}-report-${fromDate}-to-${toDate}.xlsx`;
}

function buildSlackReportFile(reports, { periodType, fromDate, toDate, timeZone }) {
  const label = periodLabel(fromDate, toDate);
  const title = `HelpDesk ${periodType} report ${label}`;
  const workbook = buildWorkbook(reportWorkbookSheets(reports, { title, periodLabel: label, timeZone }));
  return {
    filename: reportFilename(periodType, fromDate, toDate),
    title,
    initialComment: `${title} attached.`,
    byteLength: workbook.length,
    bytes: workbook,
  };
}

function reportResponseSummary(report) {
  return {
    metric: report.metric,
    sheetName: report.sheetName,
    title: report.title,
    total: report.total,
    activeAgents: report.activeAgents,
    days: report.days,
    rows: report.rows.map((row) => ({
      rank: row.rank,
      agentId: row.agentId,
      name: row.name,
      email: row.email,
      total: row.total,
      dayCounts: row.dayCounts,
      detailCount: row.details.length,
    })),
  };
}

async function sendReportRange(env, { periodType, fromDate, toDate, dryRun = false } = {}) {
  const timeZone = env.HELPDESK_ANALYTICS_TIME_ZONE || DEFAULT_TIME_ZONE;
  const reports = await buildReportsForRange(env, fromDate, toDate);
  const file = buildSlackReportFile(reports, { periodType, fromDate, toDate, timeZone });
  const uploads = [];

  if (!dryRun) {
    uploads.push(
      await uploadSlackFile(env, {
        bytes: file.bytes,
        filename: file.filename,
        title: file.title,
        initialComment: file.initialComment,
      }),
    );
  }

  return {
    periodType,
    fromDate,
    toDate,
    dryRun,
    file: { ...file, bytes: undefined },
    reports: reports.map(reportResponseSummary),
    uploads,
  };
}

async function sendReports(env, { date, dryRun = false } = {}) {
  const reportDate = validateDateKey(date) || reportDateForNow(new Date(), env.HELPDESK_ANALYTICS_TIME_ZONE || DEFAULT_TIME_ZONE);
  return sendReportRange(env, { periodType: "daily", fromDate: reportDate, toDate: reportDate, dryRun });
}

async function sendWeeklyReport(env, { fromDate, toDate, dryRun = false } = {}) {
  const timeZone = env.HELPDESK_ANALYTICS_TIME_ZONE || DEFAULT_TIME_ZONE;
  const range =
    validateDateKey(fromDate) && validateDateKey(toDate)
      ? { from: fromDate, to: toDate }
      : previousWeekRangeForNow(new Date(), timeZone);
  return sendReportRange(env, { periodType: "weekly", fromDate: range.from, toDate: range.to, dryRun });
}

async function sendMonthlyReport(env, { fromDate, toDate, dryRun = false } = {}) {
  const timeZone = env.HELPDESK_ANALYTICS_TIME_ZONE || DEFAULT_TIME_ZONE;
  const range =
    validateDateKey(fromDate) && validateDateKey(toDate)
      ? { from: fromDate, to: toDate }
      : previousMonthRangeForNow(new Date(), timeZone);
  return sendReportRange(env, { periodType: "monthly", fromDate: range.from, toDate: range.to, dryRun });
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
    if (localMonthDayInTimeZone(now, timeZone) === 1) {
      const range = previousMonthRangeForNow(now, timeZone);
      tasks.push(sendMonthlyReport(env, { fromDate: range.from, toDate: range.to }));
    }
    ctx.waitUntil(Promise.all(tasks));
  },

  async fetch(request, env) {
    if (!manualRequestAllowed(request, env)) return json({ ok: false, error: "unauthorized" }, 401);

    try {
      const url = new URL(request.url);
      const dryRun = url.searchParams.get("dry_run") === "1";
      const fromDate = validateDateKey(url.searchParams.get("from"));
      const toDate = validateDateKey(url.searchParams.get("to"));
      const result =
        url.searchParams.get("monthly") === "1"
          ? await sendMonthlyReport(env, { fromDate, toDate, dryRun })
          : url.searchParams.get("weekly") === "1"
            ? await sendWeeklyReport(env, { fromDate, toDate, dryRun })
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
