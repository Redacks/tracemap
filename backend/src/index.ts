import express from "express";
import expressWS from "express-ws";
import {
  WSEndTrace,
  WSPacket,
  WSStartTrace,
} from "../../shared/webSocketTypes";
import { getTracePointFromIP } from "./getLongLatFromIP";
import { trace } from "./tracert";
const { app } = expressWS(express());

if (process.env.NODE_ENV == "production") {
  app.use(express.static("/app/frontend/dist/"));
} else {
  app.use(express.static("../frontend/dist/"));
}

app.ws("/ws", function (ws) {
  ws.on("message", async function (raw) {
    const msg = JSON.parse(raw.toString()) as WSPacket;
    if (msg.type != "trace_request" || !msg.address) return;
    const tracePoint = await getTracePointFromIP("", "Start", 0, 0);
    ws.send(JSON.stringify({ type: "start_trace" } as WSStartTrace));
    ws.send(JSON.stringify(tracePoint));
    trace(
      msg,
      async (tp) => {
        const tracePoint = await getTracePointFromIP(
          tp.ip,
          tp.name,
          tp.hop_idx,
          tp.avg_ping
        );
        ws.send(JSON.stringify(tracePoint));
      },
      () => {
        ws.send(JSON.stringify({ type: "end_trace" } as WSEndTrace));
      }
    );
  });
});

app.listen(3000, () => {
  console.log(`Server started on http://localhost:${3000}`);
});
