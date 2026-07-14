export async function drawGraph(containerId) {
  // Fetch graph data
  const response = await fetch('/pages/graph.json');
  const graphData = await response.json();

  // DOM element
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Graph container with ID '${containerId}' not found.`);
    return; // Exit if container is not found
  }
  console.log('Graph container dimensions:', container.offsetWidth, container.offsetHeight); // 디버깅용 로그
  console.log('Graph container dimensions:', container.offsetWidth, container.offsetHeight); // 디버깅용 로그

  // Read CSS variables for theme colors
  const style = getComputedStyle(document.documentElement);
  const accentViolet = style.getPropertyValue('--accent-violet').trim();
  const accentCyan = style.getPropertyValue('--accent-cyan').trim();
  const neonMagenta = style.getPropertyValue('--neon-magenta').trim(); // New variable
  const neonYellow = style.getPropertyValue('--neon-yellow').trim(); // New variable
  const panelBg = style.getPropertyValue('--panel').trim();
  const fgMain = style.getPropertyValue('--fg-main').trim();
  const border = style.getPropertyValue('--border').trim();

  // Section-mapped palette (matches /map legend + nav diamonds).
  // Solid fills, Obsidian graph-view style.
  function mkColor(fill) {
    return {
      background: fill,
      border: fill,
      highlight: { background: fill, border: fill }
    };
  }
  const nodeColorPalette = {
    'wiki':    mkColor('#C8A8E9'), // lilac
    'studies': mkColor('#906CBE'), // purple
    'log':     mkColor('#4D5488'), // muted
    'default': mkColor('#906CBE')
  };

  // Graph options — Obsidian-like: small solid dots, thin subtle edges,
  // labels below each node, gentle force-directed layout.
  const options = {
    nodes: {
      shape: 'dot',
      size: 7,
      borderWidth: 0,
      font: {
        size: 11,
        color: fgMain,
        face: style.getPropertyValue('--sans').trim(),
        vadjust: 4,
        strokeWidth: 0
      },
      shadow: false
    },
    edges: {
      width: 1,
      // Edges hidden by default — surfaced only when a node is clicked.
      color: {
        color: 'rgba(0, 0, 0, 0)',
        highlight: 'rgba(144, 108, 190, 0.75)',
        hover: 'rgba(0, 0, 0, 0)'
      },
      smooth: { type: 'continuous', roundness: 0.35 },
      shadow: false
    },
    physics: {
      stabilization: { iterations: 220, updateInterval: 25 },
      barnesHut: {
        gravitationalConstant: -1400,
        centralGravity: 0.28,
        springConstant: 0.045,
        springLength: 90,
        damping: 0.32,
        avoidOverlap: 0.3
      }
    },
    interaction: {
      tooltipDelay: 200,
      hover: true,
      hideEdgesOnDrag: false,
      dragNodes: true
    },
    // Group palette — overrides vis-network's default rainbow groups.
    groups: {
      wiki:    { color: { background: '#C8A8E9', border: '#C8A8E9',
                          highlight: { background: '#C8A8E9', border: '#C8A8E9' },
                          hover:     { background: '#C8A8E9', border: '#C8A8E9' } } },
      studies: { color: { background: '#906CBE', border: '#906CBE',
                          highlight: { background: '#906CBE', border: '#906CBE' },
                          hover:     { background: '#906CBE', border: '#906CBE' } } },
      log:     { color: { background: '#4D5488', border: '#4D5488',
                          highlight: { background: '#4D5488', border: '#4D5488' },
                          hover:     { background: '#4D5488', border: '#4D5488' } } }
    }
  };

  // Initialize DataSets for dynamic updates
  const nodes = new vis.DataSet();
  const edges = new vis.DataSet();
  const data = { nodes: nodes, edges: edges };

  let network = new vis.Network(container, data, options);
  network.setSize(container.offsetWidth, container.offsetHeight);

  const loader = document.getElementById('graph-loader');
  const showLoader = () => loader && loader.classList.add('is-loading');
  const hideLoader = () => loader && loader.classList.remove('is-loading');

  // Edge visibility — hidden by default. A click on a node reveals only that
  // node's connections; clicking the canvas hides them again.
  const EDGE_ON  = 'rgba(144, 108, 190, 0.6)';
  const EDGE_OFF = 'rgba(0, 0, 0, 0)';

  function fadeConnectedNodes(centerId) {
    const connected = new Set(network.getConnectedNodes(centerId));
    connected.add(centerId);
    const updates = nodes.get().map(n => ({
      id: n.id,
      opacity: connected.has(n.id) ? 1 : 0.22
    }));
    nodes.update(updates);
  }

  function resetNodeOpacity() {
    nodes.update(nodes.get().map(n => ({ id: n.id, opacity: 1 })));
  }

  function showEdgesFor(nodeId) {
    const connectedEdgeIds = new Set(network.getConnectedEdges(nodeId));
    edges.update(edges.get().map(e => ({
      id: e.id,
      color: connectedEdgeIds.has(e.id) ? EDGE_ON : EDGE_OFF
    })));
  }

  function hideAllEdges() {
    edges.update(edges.get().map(e => ({ id: e.id, color: EDGE_OFF })));
  }

  network.on('selectNode', function (params) {
    if (!params.nodes.length) return;
    const id = params.nodes[0];
    showEdgesFor(id);
    fadeConnectedNodes(id);
  });

  network.on('deselectNode', function () {
    hideAllEdges();
    resetNodeOpacity();
  });

  network.on('click', function (params) {
    if (params.nodes.length === 0) {
      hideAllEdges();
      resetNodeOpacity();
    }
  });

  window.addEventListener('resize', () => {
    network.fit();
    network.redraw();
  });

  // Sort nodes by date for timelapse
  const sortedNodes = graphData.nodes.sort((a, b) => new Date(a.date) - new Date(b.date));
  const sortedLinks = graphData.links; // Links will be added with nodes

  let nodeIndex = 0;
  let edgeIndex = 0;
  let interval = null;

  function addNextNode() {
    if (nodeIndex < sortedNodes.length) {
      const node = sortedNodes[nodeIndex];
      nodes.add(node);

      // Add edges connected to this node
      sortedLinks.filter(link => link.from === node.id || link.to === node.id)
                 .forEach(link => {
                     // Only add edge if both connected nodes already exist
                     if (nodes.get(link.from) && nodes.get(link.to)) {
                         edges.add(link);
                     }
                 });
      nodeIndex++;
    } else {
      clearInterval(interval);
      // Add any remaining edges that connect already existing nodes
      sortedLinks.forEach(link => {
          if (!edges.get(link.id) && nodes.get(link.from) && nodes.get(link.to)) {
              edges.add(link);
          }
      });
    }
  }

  function startTimelapse() {
    resetGraph();
    showLoader();
    interval = setInterval(() => {
      addNextNode();
      if (nodeIndex >= sortedNodes.length) hideLoader();
    }, 500);
  }

  function resetGraph() {
    clearInterval(interval);
    showLoader();
    nodes.clear();
    edges.clear();
    nodeIndex = 0;
    edgeIndex = 0;
    graphData.nodes.forEach(node => {
      nodes.add(node);
    });
    graphData.links.forEach(link => edges.add(link));
    network.fit();
    network.redraw();
    setTimeout(hideLoader, 350);
  }

  const startTimelapseButton = document.getElementById('start-timelapse');
  const resetGraphButton = document.getElementById('reset-graph');

  if (startTimelapseButton) {
    startTimelapseButton.addEventListener('click', startTimelapse);
  }
  if (resetGraphButton) {
    resetGraphButton.addEventListener('click', resetGraph);
  }

  // Initial full graph display
  resetGraph();
}


