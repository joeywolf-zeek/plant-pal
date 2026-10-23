// Build an .ics calendar file with a recurring watering reminder.
// Spec: RFC 5545 (lines end in CRLF, long lines folded at 75 chars).

const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

function fold(line) {
  const out = [];
  while (line.length > 74) {
    out.push(line.slice(0, 74));
    line = " " + line.slice(74);
  }
  out.push(line);
  return out.join("\r\n");
}

const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); // 20261023T120000Z

/**
 * @param {object} o { id, title, description, startDate: "YYYY-MM-DD", everyDays, appName }
 * Event is at 9:00 local ("floating" time, so it stays 9am wherever you are).
 */
export function buildICS({ id, title, description, startDate, everyDays, appName }) {
  const d = startDate.replace(/-/g, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${esc(appName)}//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${id}-${Date.now()}@plant-app`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${d}T090000`,
    `DTEND:${d}T091500`,
    `RRULE:FREQ=DAILY;INTERVAL=${everyDays}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(description)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(title)}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
