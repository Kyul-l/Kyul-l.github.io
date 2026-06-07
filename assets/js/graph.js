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

  // Define a color palette for node groups
  const nodeColorPalette = {
    'default': {
      background: 'radial-gradient(circle at 30% 30%, #fff, ' + accentCyan + ')',
      border: 'rgba(144, 108, 190,0.35)',
      highlight: {
        background: 'radial-gradient(circle at 30% 30%, #fff, ' + accentCyan + ')',
        border: 'rgba(144, 108, 190,0.45)'
      }
    },
    'security': { // Example category
      background: 'radial-gradient(circle at 30% 30%, #fff, ' + neonMagenta + ')',
      border: 'rgba(255,62,198,0.35)',
      highlight: {
        background: 'radial-gradient(circle at 30% 30%, #fff, ' + neonMagenta + ')',
        border: 'rgba(255,62,198,0.45)'
      }
    },
    'development': { // Example category
      background: 'radial-gradient(circle at 30% 30%, #fff, ' + neonYellow + ')',
      border: 'rgba(255,210,74,0.35)',
      highlight: {
        background: 'radial-gradient(circle at 30% 30%, #fff, ' + neonYellow + ')',
        border: 'rgba(255,210,74,0.45)'
      }
    },
    'general': { // Example category
      background: 'radial-gradient(circle at 30% 30%, #fff, ' + accentViolet + ')',
      border: 'rgba(144, 108, 190,0.35)',
      highlight: {
        background: 'radial-gradient(circle at 30% 30%, #fff, ' + accentViolet + ')',
        border: 'rgba(144, 108, 190,0.45)'
      }
    }
    // Add more categories as needed
  };

  // Graph options
  const options = {
    nodes: {
      shape: 'dot',
      size: 10, // Reduced size as requested
      font: {
        size: 12,
        color: 'rgba(200,220,255,0.8)', // Adapted from .label color
        face: style.getPropertyValue('--mono').trim() // Use the updated --mono variable
      },
      borderWidth: 2,
      // Removed default color object, colors will be set per node
      shadow: {
        enabled: true,
        color: 'rgba(144, 108, 190,0.35)', // Adapted from .dot box-shadow
        size: 10,
        x: 0,
        y: 0
      }
      // Removed inherit: false
    },
    edges: {
      width: 0.6, // Adapted from .link stroke-width
      color: { 
        color: 'rgba(144, 108, 190,0.18)', // Adapted from .link stroke
        highlight: 'rgba(144, 108, 190,0.4)' // Brighter highlight
      },
      smooth: {
        type: 'continuous'
      },
      shadow: {
        enabled: true,
        color: 'rgba(144, 108, 190,0.08)', // Adapted from .link filter drop-shadow
        size: 6,
        x: 0,
        y: 0
      },
      dashes: [6, 6], // Corrected from dashing: true and dash: [6,6]
      // Removed inherit: false
    },
    physics: {
      stabilization: false,
      barnesHut: {
        gravitationalConstant: -8000,
        springConstant: 0.04,
        springLength: 200
      }
    },
    interaction: {
      tooltipDelay: 200,
      hideEdgesOnDrag: true
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

  // Focus effect — hovered node and its connections highlighted, others fade
  network.on('hoverNode', function (params) {
    const connected = new Set(network.getConnectedNodes(params.node));
    connected.add(params.node);
    const updates = nodes.get().map(n => ({
      id: n.id,
      opacity: connected.has(n.id) ? 1 : 0.18,
    }));
    nodes.update(updates);
  });

  network.on('blurNode', function () {
    const updates = nodes.get().map(n => ({ id: n.id, opacity: 1 }));
    nodes.update(updates);
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
      const nodeColor = nodeColorPalette[node.group] || nodeColorPalette['default'];
      nodes.add({ ...node, color: nodeColor });

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
      const nodeColor = nodeColorPalette[node.group] || nodeColorPalette['default'];
      nodes.add({ ...node, color: nodeColor });
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


