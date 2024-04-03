export type WSTraceRequest = {
  type: "trace_request";
  address: string;
};
export type WSStartTrace = {
  type: "start_trace";
};
export type WSEndTrace = {
  type: "end_trace";
};
export type WSTracePoint = {
  type: "trace_point";
  hop_idx: number;
  ip: string;
  name: string;
  avg_ping: number;
  country?: string;
  isp?: string;
  lon?: number;
  lat?: number;
};
export type WSPacket =
  | WSTracePoint
  | WSTraceRequest
  | WSEndTrace
  | WSStartTrace;
