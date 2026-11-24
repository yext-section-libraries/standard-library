import { closeSync, openSync, writeSync } from "node:fs";

export type Diagnostic = (
  event: string,
  fields?: Record<string, string | number | undefined>
) => void;

export function openRunLog(path: string) {
  const fd = openSync(path, "wx", 0o600);
  const record: Diagnostic = (event, fields) => {
    const details = fields && JSON.stringify(fields);
    writeSync(
      fd,
      `${new Date().toISOString()} ${event}${details ? " " + details : ""}\n`
    );
  };
  return { record, close: () => closeSync(fd) };
}
