svg.selectAll("*").remove();

Shiny.addCustomMessageHandler('colorUpdate', function(message) {
  window.colorVar = message.colorVariable;
  //alert(JSON.stringify(window.colorVar));
  
  if(d3.map(data.nodes, function(d){return d[window.colorVar];} ).keys().length < 7) {
    var colorScale = d3.scaleOrdinal().domain(d3.map(data.nodes, function(d){return d[window.colorVar];} ).keys())
                                  .range(d3.schemeSet1);
  } else {
    var colorScale = d3.scaleSequential(d3.interpolateOrRd).domain([d3.min(data.nodes, function(d){return d[window.colorVar]}),d3.max(data.nodes, function(d){return d[window.colorVar]})]);
  }
    

  node.style('fill', d => colorScale(d[window.colorVar]));
});

Shiny.addCustomMessageHandler('nodeUpdate', function(message) {
  window.nodeSize = message.newSize;
  
  node.attr("r", window.nodeSize);
});

Shiny.addCustomMessageHandler('nodeByObject', function(message) {
  window.nodeObject = message.nodeVariable;
  
  var nodeScale = d3.scaleLinear().domain([d3.min(data.nodes, function(d){return d[window.nodeObject]}),d3.max(data.nodes, function(d){return d[window.nodeObject]})]).range([20,90]);
  
  node.attr("r", d => nodeScale(d[window.nodeObject]));
});


//var colorScale = d3.scaleOrdinal().domain(d3.map(data.nodes, function(d){return d[window.colorVar];} ).keys())
//                                  .range(d3.schemeSet1);

var g = svg.append("g")
             .attr("class", "network-area");
             
var link = g.append("g").attr("class", "links")
                            .selectAll("line")
                            .data(data.links)
                            .enter()
                            .append("line")
                              .style("stroke", "#aaa");

var node = g.append("g").attr("class", "nodes")
                            .selectAll("circle")
                            .data(data.nodes)
                            .enter()
                            .append("circle")
                              .attr("r", 40)
                              .call(d3.drag()
                                      .on("start", dragstarted)
                                      .on("drag", dragged)
                                      .on("end", dragended))
                              .on('mouseover.fade', fade(0.1))
                              .on('mouseout.fade', fade(1))
                              .attr("d", function(d) { return d.label; })
                              .on("mouseover", function(){
                                Shiny.setInputValue("node_clicked", 
                                                    d3.select(this).attr("d"),
                                                    {priority: "event"}
                                                    );
                              });

      
  // Let's list the force we wanna apply on the network
  var simulation = d3.forceSimulation(data.nodes)
                      .force("link", d3.forceLink() 
                      .id(function(d) { return d.id; })
                      .links(data.links)
                      )
                      .force("charge", d3.forceManyBody().strength(-600))
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
      node.style('opacity', function (o) { return isConnected(d, o) ? 1 : opacity });
      link.style('stroke-opacity', o => (o.source === d || o.target === d ? 1 : opacity));
      if(opacity === 1){
        node.style('opacity', 1);
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
