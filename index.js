'use strict';

import d3 from 'd3';
import graph from 'eg-graph/lib/graph';
import Renderer from 'eg-graph/lib/renderer';
import StraightEdgeRenderer from 'eg-graph/lib/renderer/edge-renderer/straight-edge-renderer';
import horizontalCompaction from 'eg-graph/lib/layout/position-assignment/brandes/horizontal-compaction';

const normalize = function (g, layers, edgeMargin) {
  var i, w1, w2;
  for (let [u, v] of g.edges()) {
    const d = g.edge(u, v);
    if (layers[v] - layers[u] > 1) {
      w1 = u;
      for (i = layers[u] + 1; i < layers[v]; ++i) {
        w2 = g.addVertex({
          dummy: true,
          width: d.width + edgeMargin,
          height: 0,
          layer: i
        });
        g.addEdge(w1, w2, {
          width: d.width,
          dummy: true
        });
        w1 = w2;
      }
      g.addEdge(w1, v, {
        dummy: true
      });
      g.removeEdge(u, v);
    }
  }
};

const vertexPositions = (gOrig, g, layers) => {
  const vertices = gOrig.vertices(),
        n = vertices.length,
        sink = {};

  sink[vertices[0]] = n - 1;
  for (let i = n - 1; i >= 0; --i) {
    const v = vertices[i];
    if (sink[v] !== undefined) {
      continue;
    }
    sink[v] = i;
    let u = gOrig.inVertices(v)[0];
    while (gOrig.inDegree(u) > 0 && sink[u] === undefined) {
      sink[u] = sink[v];
      u = gOrig.inVertices(u)[0];
    }
  }

  const offset = {},
        x = {};
  for (let i = 0; i < n; ++i) {
    offset[i] = 0;
  }
  x[vertices[0]] = g.vertex(vertices[0]).width / 2;

  const assignX = (u, w) => {
    let xMax = 0,
        i = layers[w],
        v = w;
    while (v !== u) {
      xMax = Math.max(xMax, offset[i] + g.vertex(v).width / 2);
      v = g.inVertices(v)[0];
      i -= 1;
    }
    xMax = Math.max(xMax, x[u]);
    x[w] = xMax;

    i = layers[w];
    v = w;
    while (v !== u) {
      offset[i] = xMax + g.vertex(v).width / 2;
      v = g.inVertices(v)[0];
      i -= 1;
    }
  };

  const dfs = (u) => {
    const vs = gOrig.outVertices(u);
    vs.sort((v1, v2) => sink[v2] - sink[v1]);
    for (const v of vs) {
      assignX(u, v);
      dfs(v);
    }
  };

  dfs(vertices[0], 0);

  return x;
};

class ImaiTreeLayouter {
  layout(gOrig) {
    const vertexWidth = 10,
          vertexHeight = 10,
          edgeWidth = 1,
          layerMargin = 10,
          vertexMargin = 1,
          edgeMargin = 1;

    const g = graph(),
          layers = {};
    let index = 0;
    for (const u of gOrig.vertices()) {
      layers[u] = index++;
      g.addVertex(u, {
        width: vertexWidth + vertexMargin,
        height: vertexHeight + layerMargin
      });
    }
    for (const [u, v] of gOrig.edges()) {
      g.addEdge(u, v, {
        width: edgeWidth + edgeMargin
      });
    }

    normalize(g, layers, edgeMargin);

    const x = vertexPositions(gOrig, g, layers),
          vertices = {},
          edges = {};
    for (const u of gOrig.vertices()) {
      vertices[u] = {
        x: x[u],
        y: (layers[u] + 1) * (vertexHeight + layerMargin),
        width: vertexWidth,
        height: vertexHeight
      };
    }
    for (const u of gOrig.vertices()) {
      edges[u] = {};
      for (const v of gOrig.outVertices(u)) {
        const points = layers[v] - layers[u] > 1
          ? [
              [vertices[u].x, vertices[u].y + vertices[u].height / 2],
              [vertices[v].x, vertices[u].y + vertices[u].height + layerMargin],
              [vertices[v].x, vertices[v].y - vertices[v].height / 2]
            ]
          : [
              [vertices[u].x, vertices[u].y + vertices[u].height / 2],
              [vertices[v].x, vertices[v].y - vertices[v].height / 2]
            ];
        edges[u][v] = {
          points: points,
          width: edgeWidth
        };
      }
    }

    return {vertices, edges};
  }
}

const generateData = () => {
  const g = graph();
  const u1 = g.addVertex();
  const u2 = g.addVertex();
  const u3 = g.addVertex();
  const u4 = g.addVertex();
  const u5 = g.addVertex();
  const u6 = g.addVertex();
  const u7 = g.addVertex();
  const u8 = g.addVertex();
  const u9 = g.addVertex();
  const u10 = g.addVertex();
  const u11 = g.addVertex();
  const u12 = g.addVertex();
  const u13 = g.addVertex();
  const u14 = g.addVertex();
  const u15 = g.addVertex();
  g.addEdge(u1, u2);
  g.addEdge(u1, u3);
  g.addEdge(u2, u4);
  g.addEdge(u3, u5);
  g.addEdge(u5, u6);
  g.addEdge(u5, u7);
  g.addEdge(u6, u8);
  g.addEdge(u7, u9);
  g.addEdge(u9, u10);
  g.addEdge(u9, u11);
  g.addEdge(u7, u12);
  g.addEdge(u5, u13);
  g.addEdge(u6, u14);
  g.addEdge(u6, u15);
  return g;
};

(() => {
  const g = generateData();
  const renderer = new Renderer()
    .layouter(new ImaiTreeLayouter())
    .edgeRenderer(new StraightEdgeRenderer());
  renderer.vertexRenderer()
    .vertexColor(() => '#00f');

  const zoom = d3.behavior.zoom()
    .scaleExtent([1, 1])
    .on('zoom', () => {
      const e = d3.event;
      const [x, y] = e.translate;
      d3.select('g.contents')
        .attr('transform', `translate(${x},${y})`);
    });

  const wrapper = d3.select('body').append('div')
    .style({
      position: 'absolute',
      left: '10px',
      right: '10px',
      top: '10px',
      bottom: '10px'
    });
  const svg = wrapper.append('svg')
    .attr({
      width: wrapper.node().clientWidth,
      height: wrapper.node().clientHeight
    })
    .datum(g)
    .call(renderer.render())
    .call(zoom);

  d3.select(window)
    .on('resize', () => {
      svg.attr({
        width: wrapper.node().clientWidth,
        height: wrapper.node().clientHeight
      });
    });

  setInterval(() => {
    const vertices = g.vertices(),
          n = vertices.length,
          i = Math.floor(Math.random() * n),
          u = vertices[i],
          v = g.addVertex();
    g.addEdge(u, v);
    svg.transition()
      .duration(500)
      .call(renderer.render());
  }, 1000);
})();
