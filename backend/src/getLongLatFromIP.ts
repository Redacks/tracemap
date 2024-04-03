import { WSTracePoint } from "../../shared/webSocketTypes";
export type IPApiResponse = {
  status: "success" | "fail";
  country: string;
  city: string;
  lat: number;
  lon: number;
  isp: string;
  query: string;
};

export async function getIpApiDataFromIP(
  ip: string
): Promise<IPApiResponse | null> {
  const response = await fetch(
    `http://ip-api.com/json/${ip}?fields=status,country,city,lat,lon,isp,query`
  );
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as IPApiResponse;
}

export async function getTracePointFromIP(
  ip: string,
  name: string,
  hop_idx: number,
  avg_ping: number
): Promise<WSTracePoint> {
  const tracePoint = await getIpApiDataFromIP(ip);
  return {
    avg_ping: avg_ping,
    country: tracePoint.country,
    isp: tracePoint.isp,
    hop_idx: hop_idx,
    ip: tracePoint.query,
    name: name,
    lon: tracePoint.lon,
    lat: tracePoint.lat,
    type: "trace_point",
  };
}
