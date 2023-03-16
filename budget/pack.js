async function drawCharts() {

    budgetData = await d3.csv("data/bigAgencyTopBureaus.csv", 
        d =>d)

    // var budgetData = await d3.csv("./data/bigAgencyTopBureaus.csv")
    
    console.log(budgetData)

    var root = {
        "name": "flare",
        "children": [
         {
          "name": "analytics",
          "children": [
           {
            "name": "cluster",
            "children": [
             {"name": "AgglomerativeCluster", "size": 3938},
             {"name": "CommunityStructure", "size": 3812},
             {"name": "HierarchicalCluster", "size": 6714},
             {"name": "MergeEdge", "size": 743}
            ]
           },
           {
            "name": "graph",
            "children": [
             {"name": "BetweennessCentrality", "size": 3534},
             {"name": "LinkDistance", "size": 5731},
             {"name": "MaxFlowMinCut", "size": 7840},
             {"name": "ShortestPaths", "size": 5914},
             {"name": "SpanningTree", "size": 3416}
            ]
           },
           {
            "name": "optimization",
            "children": [
             {"name": "AspectRatioBanker", "size": 7074}
            ]
           }
          ]
         },
         {
            "name": "test",
            "children": [
                {"name": "test1", "size": 7074},
                {"name": "test2", "size": 7074},
                {"name": "test3", "size": 7074},
                {"name": "test4", "size": 7074}
            ]
         },
         {
          "name": "animate",
          "children": [
           {"name": "Easing", "size": 17010},
           {"name": "FunctionSequence", "size": 5842},
           {
            "name": "interpolate",
            "children": [
             {"name": "ArrayInterpolator", "size": 1983},
             {"name": "ColorInterpolator", "size": 2047},
             {"name": "DateInterpolator", "size": 1375},
             {"name": "Interpolator", "size": 8746},
             {"name": "MatrixInterpolator", "size": 2202},
             {"name": "NumberInterpolator", "size": 1382},
             {"name": "ObjectInterpolator", "size": 1629},
             {"name": "PointInterpolator", "size": 1675},
             {"name": "RectangleInterpolator", "size": 2042}
            ]
           },
           {"name": "ISchedulable", "size": 1041},
           {"name": "Parallel", "size": 5176},
           {"name": "Pause", "size": 449},
           {"name": "Scheduler", "size": 5593},
           {"name": "Sequence", "size": 5534},
           {"name": "Transition", "size": 9201},
           {"name": "Transitioner", "size": 19975},
           {"name": "TransitionEvent", "size": 1116},
           {"name": "Tween", "size": 6006}
          ]
         },
        ]
       };

    var addExtraNode = function(item, percentSize){
        var percentSizeOfNode = percentSize || 60; //if not given it will occupy 60 percent of the space
        if(!item.children){
        return;
        }
        var totalChildSize = 0;
        item.children.forEach(function(citm, index){
        totalChildSize = totalChildSize + citm.size;
        })
        
        var nodeSize = (percentSizeOfNode / 50) * totalChildSize;
        var name = 'NAME: '+item.name;
        item.children.push({
        'name': name,
        'size': nodeSize,
        'isextra':true
        })
        
        item.children.forEach(function(citm, index){
        if(citm.children){
            addExtraNode(citm, percentSize);
        }
        })
    };
    
    addExtraNode(root, 55);
    
    var diameter = 500,
        format = d3.format(",d");
    
    var pack = d3.layout.pack()
        .size([diameter - 4, diameter - 4])
        .value(function(d) { return d.size; });
    
    var svg = d3.select("body").append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .append("g")
        .attr("transform", "translate(2,2)");    
    
    var node = svg.datum(root).selectAll(".node")
        .data(pack.nodes)
        .enter().append("g")
        .attr("class", function(d) {  
            if(d.isextra){
            return 'extra';
            }
            return d.children ? "node" : "leaf node"; })
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    
    node.append("title")
        .text(function(d) { return d.name + (d.children ? "" : ": " + format(d.size)); });
    
    node.append("circle")
        .attr("r", function(d) { return d.r; });
    
    node.filter(function(d) { return !d.children; }).append("text")
        .attr("dy", ".3em")
        .style("text-anchor", "middle")
        .text(function(d) { return d.name.substring(0, d.r / 3); });
       
}
drawCharts();

