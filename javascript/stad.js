svg.selectAll("*").remove();

svg.attr('height', window.innerHeight - 102)
      .style('margin-bottom', 21)
      .style('position', 'fixed');

//Stop - Restart button
Shiny.addCustomMessageHandler('stopRunning', function(message) {
  simulation.stop();
});
Shiny.addCustomMessageHandler('restartRunning', function(message) {
  simulation.restart();
});

//Adjust color based on selected variable
var colorsHex = ["#FFFF00", "#1CE6FF", "#FF34FF", "#FF4A46", "#008941", "#006FA6", "#A30059",
"#FFDBE5", "#7A4900", "#0000A6", "#63FFAC", "#B79762", "#004D43", "#8FB0FF", "#997D87",
"#5A0007", "#809693", "#FEFFE6", "#1B4400", "#4FC601", "#3B5DFF", "#4A3B53", "#FF2F80",
"#61615A", "#BA0900", "#6B7900", "#00C2A0", "#FFAA92", "#FF90C9", "#B903AA", "#D16100",
"#DDEFFF", "#000035", "#7B4F4B", "#A1C299", "#300018", "#0AA6D8", "#013349", "#00846F",
"#372101", "#FFB500", "#C2FFED", "#A079BF", "#CC0744", "#C0B9B2", "#C2FF99", "#001E09",
"#00489C", "#6F0062", "#0CBD66", "#EEC3FF", "#456D75", "#B77B68", "#7A87A1", "#788D66",
"#885578", "#FAD09F", "#FF8A9A", "#D157A0", "#BEC459", "#456648", "#0086ED", "#886F4C",
"#34362D", "#B4A8BD", "#00A6AA", "#452C2C", "#636375", "#A3C8C9", "#FF913F", "#938A81",
"#575329", "#00FECF", "#B05B6F", "#8CD0FF", "#3B9700", "#04F757", "#C8A1A1", "#1E6E00",
"#7900D7", "#A77500", "#6367A9", "#A05837", "#6B002C", "#772600", "#D790FF", "#9B9700",
"#549E79", "#FFF69F", "#201625", "#72418F", "#BC23FF", "#99ADC0", "#3A2465", "#922329",
"#5B4534", "#FDE8DC", "#404E55", "#0089A3", "#CB7E98", "#A4E804", "#324E72", "#6A3A4C"];

Shiny.addCustomMessageHandler('colorUpdate', function(message) {
  window.colorVar = message.colorVariable;
  
  if ((window.colorVar == 'modularity_class') || (window.colorVar == 'hh_size') || (window.colorVar == 'children') || (window.colorVar == 'gender') || (window.colorVar == 'role') || (window.colorVar == 'touch') || (window.colorVar == 'loc_home') || (window.colorVar == 'loc_work') || (window.colorVar == 'loc_school') || (window.colorVar == 'loc_kindergarden') || (window.colorVar == 'loc_transport') || (window.colorVar == 'loc_leisure') || (window.colorVar == 'loc_grandparents') || (window.colorVar == 'loc_other') || (window.colorVar == 'loc_missing') || (window.colorVar == 'betweenHHmembers') || (window.colorVar == 'relation')) {
    window.colorScale = d3.scaleOrdinal().domain(d3.map(data.nodes, function(d){return d[window.colorVar];} ).keys())
                                  .range(colorsHex);
  } else {
    window.colorScale = d3.scaleSequential(d3.interpolateOrRd).domain([d3.min(data.nodes, function(d){return d[window.colorVar]}),d3.max(data.nodes, function(d){return d[window.colorVar]})]);
  }

  node.style('fill', d => colorScale(d[window.colorVar]));
});

// Adjust node size by variable or fixed number
Shiny.addCustomMessageHandler('nodeUpdate', function(message) {
  window.nodeSize = message.newSize;
  
  node.attr("r", window.nodeSize);
});

Shiny.addCustomMessageHandler('nodeByObject', function(message) {
  window.nodeObject = message.nodeVariable;
  
  var nodeScale = d3.scaleLinear().domain([d3.min(data.nodes, function(d){return d[window.nodeObject]}),d3.max(data.nodes, function(d){return d[window.nodeObject]})]).range([40,140]);
  
  node.attr("r", d => nodeScale(d[window.nodeObject]));
});



// Draw Nodes and Links
var g = svg.append("g")
             .attr("class", "network-area");
             
var link = g.append("g").attr("class", "links")
                            .selectAll("line")
                            .data(data.links)
                            .enter()
                            .append("line")
                              .style("stroke", "#aaa");

window.node = g.append("g").attr("class", "nodes")
                            .selectAll("circle")
                            .data(data.nodes)
                            .enter()
                            .append("circle")
                              .attr("r", 40)
                              .call(d3.drag()                     //Drag function
                                      .on("start", dragstarted)
                                      .on("drag", dragged)
                                      .on("end", dragended))
                              .on('mouseover.fade', fade(0.1))    //Highlight nodes when hover
                              .on('mouseout.fade', fade(1))
                              .attr("id", function(d) { return d.Label; })   //Return node ID
                              .on("mouseover", function(){
                                Shiny.setInputValue("node_clicked", 
                                                    d3.select(this).attr("id"),
                                                    {priority: "event"}
                                                    );
                              });

      
  // Force directed layout that performs most likely to Gephi's Force Atlas algorithm
  var simulation = d3.forceSimulation(data.nodes)
                      .alphaTarget(0.02)    //Make iterations run forever
                      .alphaDecay(0)      
                      .velocityDecay(120/data.nodes.length - 0.08)    //Speed of node movement based on nr of nodes.
                      .force("link", d3.forceLink(data.links))
                      .force("manybody", d3.forceManyBody().strength(-200))
                      .force("collide", d3.forceCollide())
                      .force("center", d3.forceCenter(width / 2, height / 2))
                      .on("tick", ticked);
    
  function zoom_actions(){
    g.attr("transform", d3.event.transform);
    }
  
  var zoom_handler = d3.zoom()
      .on("zoom", zoom_actions);

  zoom_handler(svg);
    
  // This function is run at each iteration of the force algorithm, updating the nodes position.
  function ticked() {
    link
        .attr("x1", function(d) { return d.source.x })
        .attr("y1", function(d) { return d.source.y })
        .attr("x2", function(d) { return d.target.x })
        .attr("y2", function(d) { return d.target.y });

    node
         .attr("cx", function (d) { return d.x })
         .attr("cy", function(d) { return d.y });
  }

function fade(opacity) {
    return d => {
      if(typeof dots !== 'undefined') {
        dots._groups[0].forEach(o => o.id === d.label ? o.style.opacity = 1 : o.style.opacity = opacity); // beeswarm
      }
      node.style('opacity', function (o) { return isConnected(d, o) ? 1 : opacity });
      link.style('stroke-opacity', o => (o.source === d || o.target === d ? 1 : opacity));
      if(opacity === 1){
        node.style('opacity', 1);
        if(typeof dots !== 'undefined') { dots.style('opacity', 1); } //beeswarm
        link.style('stroke-opacity', 0.3);
      }
    };
}

const linkedByIndex = {};
  data.links.forEach(d => {
    linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
  });

function isConnected(a, b) {
    return linkedByIndex[`${a.index},${b.index}`] || linkedByIndex[`${b.index},${a.index}`] || a.index === b.index;
  }


function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}
