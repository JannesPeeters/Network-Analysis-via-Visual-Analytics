// r2d3: https://rstudio.github.io/r2d3
//
svg.selectAll("*").remove();

var colorScale = d3.scaleOrdinal().domain(['2', '3', '4', '5', '6', '7'])
                                  .range(["grey", "brown", "blue", "darkgreen", "purple", "orange", "yellow"]);

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
                              .attr("r", 10)
                              .style("fill", d => colorScale(d.hh_size))
                              .on('mouseover.fade', fade(0.1))
                              .on('mouseout.fade', fade(1))
                              .attr("d", function(d) { return d.id; })
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
