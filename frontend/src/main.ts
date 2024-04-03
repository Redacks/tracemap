import "../index.css";
import { Feature, Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import {
  WSPacket,
  WSTracePoint,
  WSTraceRequest,
} from "../../shared/webSocketTypes";
import { LineString } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import { Vector } from "ol/source";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import { fromLonLat } from "ol/proj";

const styleFunction = function (feature) {
  const styles = [
    // linestring
    new Style({
      stroke: new Stroke({
        color: "red",
        width: 3,
        lineDash: [8, 8],
        lineDashOffset: feature.get("dashOffset"),
        lineJoin: "bevel",
        lineCap: "square",
      }),
    }),
  ];
  return styles;
};

const lineLayer = new VectorLayer({
  source: new Vector(),
  style: styleFunction,
});

const line_feature = new Feature({
  geometry: new LineString([]),
  dashOffset: 0,
});
const lineLayerSource = lineLayer.getSource();
if (lineLayerSource != null) lineLayerSource.addFeature(line_feature);

const map = new Map({
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
map.addLayer(lineLayer);

let trace_hops: WSTracePoint[] = [];
let trace_running = false;

const socket = new WebSocket("ws://localhost:3000/ws");
let socketRunning = false;
socket.onopen = function () {
  console.log("WebSocket connection opened.");
  socketRunning = true;
  (<HTMLInputElement>document.getElementById("button")).disabled = false;
};
socket.onclose = function (event) {
  if (event.wasClean) {
    console.log("WebSocket connection closed cleanly, code:", event.code);
  } else {
    console.log("WebSocket connection closed unexpectedly");
  }
  socketRunning = false;
  (<HTMLInputElement>document.getElementById("button")).disabled = true;
};

socket.onmessage = function (event) {
  if (!event.data) return;
  const wsPacket = JSON.parse(event.data) as WSPacket;

  if (wsPacket.type == "start_trace" && !trace_running) {
    trace_hops = [];
    document.getElementById("hops")!.innerHTML = "";
    line_feature.setGeometry(new LineString([]));
    trace_running = true;
    (<HTMLInputElement>document.getElementById("button")).disabled = true;
  }
  if (wsPacket.type == "end_trace" && trace_running) {
    trace_running = false;
    (<HTMLInputElement>document.getElementById("button")).disabled = false;
  }
  if (wsPacket.type == "trace_point" && trace_running) {
    trace_hops.push(wsPacket);
    const new_line_string = new LineString(
      trace_hops
        .filter((val) => val.lon && val.lat)
        .sort((a, b) => a.hop_idx - b.hop_idx)
        .map((th) => fromLonLat([th.lon ?? 0, th.lat ?? 0]))
    );
    line_feature.setGeometry(new_line_string);
    map.getView().fit(new_line_string.getSimplifiedGeometry(0), {
      padding: [60, 60, 60, 60],
    });
    document.getElementById("hops")!.innerHTML = "";
    for (const hop of trace_hops) {
      document.getElementById("hops")!.innerHTML += `<div>${hop.hop_idx}: ${
        hop.name ?? "*"
      } (${hop.ip}) | ${hop.avg_ping} ms</div>`;
    }
  }
};

declare global {
  interface Window {
    traceroute: () => void;
  }
}

window.traceroute = function () {
  if (socketRunning) {
    if (trace_running) {
      alert("Wait for trace to finish!");
      return;
    }
    const ipInputElement = document.getElementById("ip");
    if (!ipInputElement) {
      alert("");
      return;
    }
    socket.send(
      JSON.stringify({
        type: "trace_request",
        address: ipInputElement["value"],
      } as WSTraceRequest)
    );
  } else {
    alert("No Connection to Server! Reload?");
  }
};

setInterval(function () {
  let offset = line_feature.get("dashOffset");
  offset = offset == 8 ? 0 : offset - 1;
  line_feature.set("dashOffset", offset);
}, 100);
