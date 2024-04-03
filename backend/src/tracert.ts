import { WSTraceRequest } from "../../shared/webSocketTypes";
import { exec } from "child_process";

export type TracerouteHop = {
  name?: string;
  ip: string;
  avg_ping: number;
  hop_idx: number;
};

export async function trace(
  trace: WSTraceRequest,
  tracePointCallback: (tp: TracerouteHop) => void,
  traceEnd: () => void
) {
  const tracertProcess = exec("traceroute " + trace.address, {
    cwd: "/usr/bin/",
  });
  let dataBuffer = "";
  tracertProcess.stdout.on("data", async (chunk) => {
    dataBuffer += chunk;
    if (dataBuffer.includes("\n")) {
      const lines = dataBuffer.split("\n");
      dataBuffer = lines.pop();
      for (const line of lines) {
        const traceRouteHop = parseTraceRouteLine(line);
        if (traceRouteHop != null) {
          tracePointCallback(traceRouteHop);
        }
      }
    }
  });
  tracertProcess.on("close", () => {
    setTimeout(() => {
      traceEnd();
    }, 200);
  });
}

function parseTraceRouteLine(trLine: string): TracerouteHop | null {
  if (trLine.startsWith("traceroute")) return null;
  trLine = trLine.trim();
  trLine = trLine.replace("  ", " ");
  const trParts = trLine.split(" ");
  if (trParts.length < 4) return null;
  if (trParts[1] == "*") return null;
  if (trParts[2] == "*") return null;
  const hop_idx = parseInt(trParts[0]) ?? 1;
  const hop_name = trParts[1];
  const hop_ip = trParts[2].slice(1, -1);

  let valid_pings = 0;
  let ping_sum = 0;
  for (let i = 3; i <= trParts.length; i++) {
    if (
      trParts[i] &&
      trParts[i] != "*" &&
      trParts[i] != "ms" &&
      !trParts[i].startsWith("(") &&
      parseFloat(trParts[i])
    ) {
      ping_sum += parseFloat(trParts[i]);
      valid_pings++;
    }
  }
  const avg_ping = Math.round((ping_sum / valid_pings) * 1000) / 1000 ?? 0;
  return {
    hop_idx: hop_idx,
    ip: hop_ip,
    name: hop_name,
    avg_ping: avg_ping,
  };
}
