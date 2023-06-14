
gsap.registerPlugin(ScrollTrigger);

// don't do anything before data is loaded
d3.csv("./data/medianByTract.csv").then(d => {
    // now do stuff
    drawChart(d); // run it first so all the elements are created
    // setupScroll(); // setup animation for those elements once they exist
});

const margin = {
    top: 44, 
    right: 10, 
    bottom: 10, 
    left: 50
};
// const width = 960 - margin.left - margin.right;
// const height = 500 - margin.top - margin.bottom;
svgWidth = 500;
svgHeight = 400 * (500 / 600);


// width and height here are chartWidth and chartHeight, not svgWidth and svgHeight. 
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

function drawChart(medianByTract) {

    // filter medianByTract to desired counties
    medianByTractCounties = medianByTract.filter(d => 
        d.county === "New York" ||
        d.county === "Nassau" ||
        d.county === "Erie" ||
        d.county === "Bronx" ||
        d.county === "Kings" ||
        d.county === "Queens" ||
        d.county === "Suffolk"
    )

    function drawHist(countyScope, yMax, chartSize, container){

        ////////////////////////////////////////////////
        /////////// SVG SETUP /////////////////////////
        //////////////////////////////////////////////

        // if (d3.select(".histDiv#" + countyScope).node()) {
        //     // div with id = countyScope exists
        //     svg = d3.select(".histDiv#" + countyScope)
        //         .append("svg")
        // } else {
        //     // div with id = countyScope does not exist
            svg = d3.select(".container" + container)
                .append("div")
                .attr("class", "chartArea")
                .append("div")
                .attr("class", "histDiv") 
                .attr("id", countyScope)
                .append("svg")
        // }           
        svg
            // .append("svg")
            .attr("class", "chartContent")
            .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom))
            // .attr("width", width + margin.left + margin.right)
            // .attr("height", height + margin.top + margin.bottom)
            .attr("width", function(){
                return chartSize == "small" ? 
                    (width / 2) + (margin.left / 2) + (margin.right / 2) 
                    : 
                    width + margin.left + margin.right
                })
            .attr("height", function(){
                return chartSize == "small" ? 
                    (height / 2) + (margin.top / 2) + (margin.bottom / 2) 
                    : 
                    height + margin.top + margin.bottom
                })
            // .append("g")
            // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        ////////////////////////////////////////////////
        /////////// SCALES AND AXES ///////////////////
        //////////////////////////////////////////////

        // X AXIS
        // Don't need to know what geographies we're filtering for, like we do with Y scaling, bcse x values (income brackets) are the same for all datasets.

        // create xScale generator
        var xScale = d3.scaleLinear()
            .domain([0, d3.max(medianByTract, d => +d.estimate / 1000)])
            .range([margin.left, width])
            // .padding(0.2);

        var xAxis = d3.axisBottom(xScale).tickSizeOuter(0);

        
        // add x axis to svg
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            // .call(d3.axisBottom(xScale))
            .call(xAxis)
            .attr("class", "xAxis")
            .selectAll("text")
            .attr("font-size", 14) 
            // don't show the 0 value of the axis
            .filter(d => d === 0)
            .remove()
        
        // setting the outertick size doesn't get rid of the first tick of the axis, so we have to hide it
        d3.select(".xAxis .tick").style("opacity", 0)

        // HISTOGRAM AND Y AXIS

        switch(countyScope) {
            case "all":
                var geoData = medianByTract;
                break;
            case "countyGroup":
                var geoData = medianByTractCounties;
                break;
            default:
                var geoData = medianByTract.filter(d => d.county === countyScope);
        }
        
        // doing this to generate exactly 30 bins, to match what I did in r:
        var max = d3.max(geoData, d => +d.estimate / 1000);
        var binWidth = max / 30;
        var thresholds = d3.range(0, max, binWidth);

        var createHistogram = d3.histogram()
            .value(d => +d.estimate / 1000)
            .domain(xScale.domain())
            .thresholds(thresholds);

        switch(countyScope) {
            case "all":
                var bins = createHistogram(medianByTract);
                break;
            case "countyGroup":
                var bins = createHistogram(medianByTractCounties);
                break;
            default:
                var bins = createHistogram(geoData);
        }

        yUse = yMax ? yMax : d3.max(bins, d => d.length);

        var yScale = d3.scaleLinear()
            .range([height, margin.top])
            // .domain([0, d3.max(bins, d => d.length)]);   // d3.hist has to be called before the Y axis obviously
            .domain([0, yUse])
        
        var yAxis = d3.axisLeft(yScale).tickSizeOuter(0);

        svg.append("g")
            .attr("class", "yAxis")
            .attr("transform", "translate(" + margin.left + ", 0)")  
            // .call(d3.axisLeft(yScale))
            .call (yAxis)
            .selectAll("text")
            // .attr("font-size", 14)
            .attr("fill", "black")
            // don't show the 0 value of the axis
            .filter(d => d === 0)
            .remove()

        // setting the outertick size doesn't get rid of  the first tick of the axis, so we have to hide it
        d3.select(".yAxis .tick").style("opacity", 0)

        ////////////////////////////////////////////////
        /////////// DRAW THE CHART ////////////////////
        //////////////////////////////////////////////

        svg.selectAll("rect")
            .data(bins) 
            .join("rect")
            .attr("class", "bar")
            .attr("x", 1)
            .attr("transform", d => "translate(" + xScale(d.x0) + "," + yScale(d.length) + ")") // SWITCH
            // .attr("width", function(d) { return xScale(d.x1) - xScale(d.x0) -1 ; })
            .attr("width", function(d) { return xScale(xScale.domain()[1] / 30) - xScale(0) - 1; })
            .attr("height", function(d) { return height - yScale(d.length); }) // SWITCH
            .style("fill", function(d) {
                if(container == 1){  
                    return "#7eb0d5"
                 } else {
                    return "orange"
                }
            })

        ////////////////////////////////////////////////
        /////////// PERIPHERALS ///////////////////////
        //////////////////////////////////////////////

        // chart title
        svg.append("text")
            .attr("class", "chartTitle")
            .attr("x", (svgWidth / 2))
            .attr("y", 14)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(function() {
                switch(countyScope) {
                    case "all":
                        return "All counties";
                    case "countyGroup":
                        return "All counties except Westchester";
                    case "Westchester":
                        return "Number of Census Tracts by Median Income in Westchester County";                        
                    default:
                        return countyScope;
                }
            })

        // y axis label
        var yLabel = svg.append("text")
            .attr("class", "yLabel")
            .text("# of Census Tracts");

        var textWidth = yLabel.node().getBBox().width;
        var textHeight = yLabel.node().getBBox().height;

        var centerX = margin.left / 2  //+ textWidth / 2;
        var centerY = height / 2 + textHeight / 2;

        yLabel.attr("transform", "translate(" + 8 + ", " + centerY + ") rotate(-90)")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")

        // x axis label
        svg.append("text")
            .attr("class", "xLabel")
            .attr("x", (svgWidth / 2))
            .attr("y", svgHeight - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Median Income ($000s)");

        // hide the svg if it's not the first one
        var svgCount = d3.selectAll("svg").size();
        svgCount == 1 ? svg.attr("opacity", 1) : svg.attr("opacity", 0);            
    }

    function reduceDeets(){
        d3.selectAll(".yAxis .domain").style("stroke", "blue")
                d3.selectAll(".xAxis .domain").style("stroke", "blue")
                d3.selectAll(".tick").remove()
                d3.select(".chartTitle").text("Westchester")
                d3.selectAll(".chartTitle")
                    .style("font-weight", 600)
                    .style("font-size", 18)
                    .attr("y", 70)
                    .attr("x", svgWidth - margin.right - 80)
                    .style("text-anchor", "end")
                d3.selectAll(".yLabel")
                    .style("font-size", 18)
                    .attr("x", -20)
                    .attr("y", 18)
                d3.selectAll(".xLabel")
                    .style("font-size", 18)
                    .attr("y", svgHeight - 24)
                d3.selectAll("svg")
                    .append("text")
                    .attr("class", "lightAxisValue")
                    .attr("x", svgWidth - margin.right - 34)
                    .attr("y", svgHeight - 38)
                    .attr("text-anchor", "end")
                    .style("font-size", 16)
                    .text("250+")
                d3.selectAll("svg")
                    .append("text")
                    .attr("class", "lightAxisValue")
                    .attr("x", margin.left)
                    .attr("y", svgHeight - 38)
                    .attr("text-anchor", "end")
                    .style("font-size", 16)
                    .text("0")
                d3.selectAll("svg")
                    .append("text")
                    .attr("class", "lightAxisValue")
                    .attr("id", "yMaxValue")
                    .attr("x", margin.left)
                    .attr("y", margin.top + 16)
                    .attr("text-anchor", "end")
                    .style("font-size", 16)
                    .text("200")
                d3.selectAll("svg")
                    .transition()
                    .duration(500)
                    .attr("opacity", 1);
                d3.selectAll(".chartTitle").attr("opacity", 1)
    }

    function drawIA(countyScope, yMax, chartSize){

        // NOTE: unlike the case with tracts, here the data is coming in with the frequency of households per income bracket already calculated.  So we don't need to do any binning or histogramming.

        /////////////////////////////////////////////////
        /////////// DATA SETUP /////////////////////////
        ///////////////////////////////////////////////

        d3.csv("./data/bucketsByTract.csv").then(d => {
            // var householdCount = d
            var householdCount = d.filter(d => d.county === countyScope)
              
            householdCount.sort(function(a, b) {
                var incomeA = parseFloat(a.income.split("-")[0]);
                var incomeB = parseFloat(b.income.split("-")[0]);
                return incomeA - incomeB;
            });
              
            // console.log(householdCount);
              


            bracketCount = householdCount.length


            ////////////////////////////////////////////////
            /////////// SVG SETUP /////////////////////////
            //////////////////////////////////////////////

            var svg = d3.select(".container2")
                .append("div")
                .attr("class", "chartArea")
                .append("div")
                .attr("class", "histDiv")
                .attr("id", (d, i) => `${countyScope}`)
                .append("svg")
                .attr("class", "chartContent")
                .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom))
                .attr("width", function(){
                    return chartSize == "small" ? 
                        (width / 2) + (margin.left / 2) + (margin.right / 2) 
                        : 
                        width + margin.left + margin.right
                    })
                .attr("height", function(){
                    return chartSize == "small" ? 
                        (height / 2) + (margin.top / 2) + (margin.bottom / 2) 
                        : 
                        height + margin.top + margin.bottom
                    })
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            ////////////////////////////////////////////////
            /////////// SCALES AND AXES ///////////////////
            //////////////////////////////////////////////

            // X AXIS
            // Don't need to know what geographies we're filtering for, like we do with Y scaling, bcse x values (income brackets) are the same for all datasets.

            // create xScale generator
            var xScale = d3.scaleBand()
                .domain(householdCount.map(d => d.income))
                .range([margin.left, width])

            var xAxis = d3.axisBottom(xScale).tickSizeOuter(0);

            // add x axis to svg
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .attr("class", "xAxis")
                .selectAll("text")
                .attr("font-size", 10) 
                // rotate the text 90 degrees
                .attr("transform", "translate(0, 10) rotate(-90)")
                .attr("text-anchor", "end")
                // don't show the 0 value of the axis
                .filter(d => d === 0)
                .remove()
            
            // setting the outertick size doesn't get rid of the first tick of the axis, so we have to hide it
            d3.select(".xAxis .tick").style("opacity", 0)

            // Y AXIS

            switch(countyScope) {
                case "all":
                    var geoData = householdCount;
                    break;
                case "countyGroup":
                    var geoData = medianByTractCounties;
                    break;
                default:
                    var geoData = householdCount.filter(d => d.county === countyScope);
            }

            var yScale = d3.scaleLinear()
                .domain([0, 200000])  // hardcoding this for nowå
                .range([height, margin.top])  
            
            var yAxis = d3.axisLeft(yScale).tickSizeOuter(0);

            svg.append("g")
                .attr("class", "yAxis")
                .attr("transform", "translate(" + margin.left + ", 0)")  
                .call (yAxis)
                .selectAll("text")
                // .attr("font-size", 14)
                .attr("fill", "black")
                // don't show the 0 value of the axis
                .filter(d => d === 0)
                .remove()

            // setting the outertick size doesn't get rid of  the first tick of the axis, so we have to hide it
            d3.select(".yAxis .tick").style("opacity", 0)

            ////////////////////////////////////////////////
            /////////// DRAW THE CHART ////////////////////
            //////////////////////////////////////////////
            barPadding = 5
            totalBarWidth = svgWidth / (bracketCount + barPadding)
            barColorWidth = totalBarWidth - barPadding
            svg.selectAll("rect")
                .data(householdCount) 
                .join("rect")
                .attr("class", "bar")
                // .attr("x", 1)
                // .attr("transform", d => "translate(" + xScale(d.income) + "," + yScale(d.length) + ")") // SWITCH
                // .attr("width", function(d) { return xScale(d.x1) - xScale(d.x0) -1 ; })
                // .attr("width", function(d) { return xScale(xScale.domain()[1] / 30) - xScale(0) - 1; })
                // .attr("height", function(d) { return height - yScale(d.length); }) // SWITCH
                .attr("x", (d,n) => margin.left + (n * totalBarWidth)+ 10)
                .attr("y", d => yScale(d.estimate))
                .attr("width", d => barColorWidth)
                // .attr("height", 10)
                .attr("height", d => height - yScale(d.estimate))
                // .style("fill", "#7eb0d5")
                .style("fill", "orange")

            ////////////////////////////////////////////////
            /////////// PERIPHERALS ///////////////////////
            //////////////////////////////////////////////

            // chart title
            svg.append("text")
                .attr("class", "chartTitle")
                .attr("x", (svgWidth / 2))
                .attr("y", 14)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .text(function() {
                    switch(countyScope) {
                        case "all":
                            return "All counties";
                        case "countyGroup":
                            return "All counties except Westchester";
                        case "Westchester":
                            return "Number of Census Tracts by Median Income in Westchester County";                        
                        default:
                            return countyScope;
                    }
                })

            // y axis label
            var yLabel = svg.append("text")
                .attr("class", "yLabel")
                .text("# Households (000s)");

            var textWidth = yLabel.node().getBBox().width;
            var textHeight = yLabel.node().getBBox().height;

            var centerX = margin.left / 2  //+ textWidth / 2;
            var centerY = height / 2 + textHeight / 2;

            yLabel.attr("transform", "translate(" + 8 + ", " + centerY + ") rotate(-90)")
                .attr("text-anchor", "middle")
                .style("font-size", "12px")

            // x axis label
            svg.append("text")
                .attr("class", "xLabel")
                .attr("x", (svgWidth / 2))
                .attr("y", svgHeight - 10)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .text("Median Income ($000s)");
                
            reduceDeets()

            // hide the svg if it's not the first one
            // var svgCount = d3.selectAll("svg").size();
            // svgCount == 1 ? svg.attr("opacity", 1) : svg.attr("opacity", 0);        
            
            // select any chartArea that doesn't have child elements and remove it
            d3.selectAll(".chartArea").filter(function() {
                return !this.hasChildNodes();
            })
            .remove();
        })
    }

    function drawLollipop() {

        ////////////////////////////////////////////////
        /////////// DATA SETUP ////////////////////////
        //////////////////////////////////////////////

        // calculate sd by county
        var groupedByCounty = Array.from(d3.group(medianByTract, d => d.county));
        groupedByCounty.forEach(function(d){
            d.sd = d3.deviation(d[1], d => +d.estimate / 1000);
        })

        // sort by sd
        groupedByCounty.sort(function(a, b){
            return d3.descending(a.sd, b.sd);
        })

        /////////////////////////////////////////////
        /////////// SVG AREA SET UP ////////////////
        ///////////////////////////////////////////

        // clear the playing field and create a new svg
            var histDivs = d3.selectAll(".histDiv");
            var count = histDivs.size();

            // when you run operataions on a selection, the operations apply individually to each item in the selection.  So this is how we remove each svg individually, and then add the new one only after the last one has transitioned out.  They start transitioning at the same time.  The "last" one is the one that ends last.

            let lollipopSvg;

            histDivs
                .transition()
                .duration(1000)
                .style("opacity", "0")
                .on("end", function() {
                    count--;
                    d3.select(this).remove();

                    if(count === 0) {
                        var lollipopHeight = 700;
                        var lollipopDiv = d3.select(".chartArea")
                            .append("div")
                            .attr("class", "lollipopDiv")
                        var lollipopSvg = lollipopDiv
                            .append("svg")
                            .attr("transform", "translate(" + margin.left + "," + (margin.top + 18) + ")")
                            .attr("transform", "translate(" + margin.left + ", 0)")
                            .attr("class", "lollipopChart")
                            // .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " +  (lollipopHeight + margin.top + margin.bottom))
                            .attr("width", width + margin.left + margin.right)
                            .attr("height", lollipopHeight + margin.top + margin.bottom)
                        
                        ///////////////////////////////////////////////
                        /////////// SCALES AND AXES ///////////////////
                        ///////////////////////////////////////////////

                        // X AXIS

                        // create xScale function
                        var xScale = d3.scaleLinear()
                        .domain([0, d3.max(groupedByCounty, d => +d.sd)])
                        .range([margin.left, width])
                        // .padding(0.2);

                        // create x axis generator
                        var xAxis = d3.axisBottom(xScale).tickSizeOuter(0);

                        // add x axis to svg
                        // d3.select(".lollipopChart")
                        // lollipopSvg
                        lollipopSvg
                            .append("g")
                            .attr("class", "xAxis")
                            .attr("transform", "translate(56," + (lollipopHeight - 10)+ ")")
                            .call(xAxis)
                            .selectAll("text")
                            .attr("font-size", 14) 
                            // don't show the 0 value of the axis
                            .filter(d => d === 0)
                            .remove()

                        // setting the outertick size doesn't get rid of the first tick of the axis, so we have to hide it
                        d3.select(".xAxis .tick").style("opacity", 0)

                        // Y AXIS

                        // create yScale function
                        // var yScale = d3.scaleBand()
                        //     .domain(groupedByCounty.map(d => d[0]))
                        //     .range([margin.top, lollipopHeight])
                        var yScale = d3.scaleBand()
                            .domain(groupedByCounty.map(d => d[0]))
                            .range([0, lollipopHeight - margin.top - margin.bottom])


                        // create y axis generator
                        var yAxis = d3.axisLeft(yScale).tickSizeOuter(0);

                        // add y axis to svg
                        // d3.select(".lollipopChart")
                        // lollipopSvg
                        lollipopSvg
                            .append("g")
                            .attr("class", "yAxis")
                            // .attr("transform", "translate(" + (margin.left + 56) + ", 0)")
                            .attr("transform", "translate(" + (margin.left + 56) + "," + margin.top + ")")
                            .call(yAxis)
                            .selectAll("text")
                            .attr("font-size", 12)
                            .attr("fill", "black")

                        // bold the label if it's Westchester
                        d3.selectAll(".yAxis .tick")
                            .filter(d => d === "Westchester")
                            .select("text")
                            .style("font-weight", 600)
                            .style("font-size", 12)

                        lollipopSvg.selectAll(".yAxis .tick line").style("opacity", 0)
                        lollipopSvg.selectAll(".line").style("color", "black")
                        lollipopSvg.selectAll("text").style("fill", "black")
                            
                        ////////////////////////////////////////////////
                        /////////// DRAW THE CHART ////////////////////
                        //////////////////////////////////////////////

                        lollipopSvg.append("g")
                            .attr("class", "bar")
                            .selectAll("rect")
                            .data(groupedByCounty)
                            .join("rect")
                            .attr("class", "bar")
                            .attr("x", margin.left + 56)
                            .attr("y", d => yScale(d[0]) + margin.top + 4)
                            .attr("width", 0)
                            // .attr("height", yScale.bandwidth() - 2)
                            .attr("height", 2)
                            .style("fill", "#7eb0d5") 
                            .transition()
                            .duration(1000)
                            .attr("width", d => xScale(d.sd) - margin.left)

                        lollipopSvg.append("g")
                            .attr("class", "circle")
                            .selectAll("circle")
                            .data(groupedByCounty)
                            .join("circle")
                            .attr("cx", margin.left + 56)
                            .attr("cy", d => yScale(d[0]) + margin.top + 5)
                            .attr("r", 4)
                            .style("fill", "#7eb0d5")
                            .transition()
                            .duration(1000)
                            .attr("cx", d => xScale(d.sd) + 56)

                        ////////////////////////////////////////////////
                        /////////// PERIPHERALS ///////////////////////
                        ////////////////////////////////////////////// 
                        
                        // chart title
                        lollipopSvg.append("text")
                            .attr("class", "chartTitle")
                            .attr("x", ((svgWidth + margin.left + margin.right) / 2))
                            .attr("y", 22)
                            .attr("text-anchor", "middle")
                            .style("font-size", "14px")
                            .style("font-weight", "bold")
                            .text("Average Distance of Tract Income From Median County Income");

                        
                        // x axis label
                        lollipopSvg.append("text")
                            .attr("class", "yAxisLabel")
                            .attr("x", ((svgWidth + margin.left + margin.right) / 2))
                            .attr("y", lollipopHeight + 25)
                            .attr("text-anchor", "middle")
                            .style("font-size", "12px")
                            .text("USD ($000s)");
                    }

                    // select all chartArea divs that do not have any divs under them and remove them
                    d3.selectAll(".chartArea")
                        .filter(function() {
                            return !this.hasChildNodes();
                        }
                        )
                        .remove()  
                    })  
                
    }

    drawHist("Westchester", undefined, "large", 1);


    ////////////////////////////////////////////
    //// SCROLL TRIGGER ////////////////////////
    ////////////////////////////////////////////

    ScrollTrigger.create({
        // NOTE: this doesn't animate anything.  It just pins the chart area to the middle of the screen while scrolling through the steps.
        trigger: ".bar-chart-steps",
        start: "top 0%",  // first argument is relative to the trigger, second is relative to the viewport.  So this means "When the top of the trigger element hits the top of the viewport, start the animation."
        end: "bottom 80%", // "When the bottom of the trigger element hits a point 80% of the way down the viewport, end the animation."
        pin: ".to-pin",  
        pinSpacing: false,
        // onLeave: () => transitionSVGs,
        // onEnterBack: () => transitionSVGs,
        onEnter: function() {
            updateStartStatus("P E");
        },
        onLeave: function() {
            updateEndStatus("P L");
        },
        markers: false
    })

    gsap.to("svg", {   
        scrollTrigger: {
            trigger: "#step1",
            start: "top top",  
            end: "bottom 80%", 
            onEnterBack: function() {
                updateStartStatus("S1 EB");
                transitionSVGs("larger");
                redrawHist("larger");
            },
            // markers: true,
            onEnter: updateStartStatus("S1 E"),
            onLeave: updateEndStatus("S1 L"),
            onLeaveBack: updateEndStatus("S1 LB"),
        }
    });

    gsap.to("svg", {   // select the svg elements
        scrollTrigger: {
            trigger: "#step2",  
            start: "top 20%",  
            end: "bottom 80%",
            onEnter: function() {
                updateStartStatus("S2 E");
                redrawHist("smaller");
            },
            onEnterBack: function() {
                d3.selectAll(".histDiv").transition().duration(1000)
                    .style("opacity", 0)
                    .on("end", function(){
                        d3.selectAll("svg").remove()
                        .transition()
                        .duration(1000)
                        drawHist("Westchester", 90, "large", 1);
                    })
            }

        }
    });

    gsap.to("svg", {   
        scrollTrigger: {
            trigger: "#step3",  
            start: "top 20%",  
            end: "bottom 80%",
            // ON ENTER AND ENTERBACK ARE IDENTICAL.  PUT THIS INTO A FUNCTION.
            onEnter: function(){
                // d3.selectAll("#chartArea").remove();
                d3.selectAll("svg").transition().duration(1000)
                .style("opacity", 0)
                    .on("end", function(){
                        d3.selectAll(".chartArea").remove()
                        drawHist("Westchester", 90, "small", 1);
                        drawHist("Bronx", 90, "small" ,1);
                        drawHist("Erie", 90, "small", 1);
                        drawHist("Kings", 90, "small", 1);
                        drawHist("Nassau", 90, "small", 1);
                        drawHist("New York", 90, "small", 1);
                        drawHist("Queens", 90, "small", 1);
                        drawHist("Suffolk", 90, "small", 1);
                        d3.selectAll(".yAxis .domain").style("stroke", "blue")
                        d3.selectAll(".xAxis .domain").style("stroke", "blue")
                        d3.selectAll(".tick").remove()
                        d3.select(".chartTitle").text("Westchester")
                        d3.selectAll(".chartTitle")
                            .style("font-weight", 600)
                            .style("font-size", 18)
                            .attr("y", 70)
                            .attr("x", svgWidth - margin.right - 80)
                            .style("text-anchor", "end")
                        d3.selectAll(".yLabel")
                            .style("font-size", 18)
                            .attr("x", -20)
                            .attr("y", 18)
                        d3.selectAll(".xLabel")
                            .style("font-size", 18)
                            .attr("y", svgHeight - 24)
                            // .on("end", function(){
                            //     return d3.selectAll("svg")
                            //     .transition()
                            //     .duration(100)
                            //     .attr("opacity", 1)
                            // })
                        d3.selectAll("svg")
                            .append("text")
                            .attr("class", "lightAxisValue")
                            .attr("x", svgWidth - margin.right - 34)
                            .attr("y", svgHeight - 38)
                            .attr("text-anchor", "end")
                            .style("font-size", 16)
                            .text("250+")
                        d3.selectAll("svg")
                            .append("text")
                            .attr("class", "lightAxisValue")
                            .attr("x", margin.left)
                            .attr("y", svgHeight - 38)
                            .attr("text-anchor", "end")
                            .style("font-size", 16)
                            .text("0")
                        d3.selectAll("svg")
                            .append("text")
                            .attr("class", "lightAxisValue")
                            .attr("x", margin.left)
                            .attr("y", margin.top + 16)
                            .attr("text-anchor", "end")
                            .style("font-size", 16)
                            .text("90")
                        d3.selectAll("svg")
                            .transition()
                            .duration(500)
                            .attr("opacity", 1);
                        d3.selectAll(".chartTitle").attr("opacity", 1)
                    })
            },
            onEnterBack: function(){
                d3.selectAll("svg").transition().duration(1000).style("opacity", 0)
                        .on("end", function(){
                            d3.selectAll("svg").remove()
                            drawHist("Westchester", 90, "small", 1);
                            drawHist("Bronx", 90, "small", 1);
                            drawHist("Erie", 90, "small", 1);
                            drawHist("Kings", 90, "small", 1);
                            drawHist("Nassau", 90, "small", 1);
                            drawHist("New York", 90, "small", 1);
                            drawHist("Queens", 90, "small", 1);
                            drawHist("Suffolk", 90, "small", 1);
                            d3.selectAll(".yAxis .domain").style("stroke", "blue")
                            d3.selectAll(".xAxis .domain").style("stroke", "blue")
                            d3.selectAll(".tick").remove()
                            d3.select(".chartTitle").text("Westchester")
                            d3.selectAll(".chartTitle")
                                .style("font-weight", 600)
                                .style("font-size", 18)
                                .attr("y", 70)
                                .attr("x", svgWidth - margin.right - 80)
                                .style("text-anchor", "end")
                            d3.selectAll(".yLabel")
                                .style("font-size", 18)
                                .attr("x", -20)
                                .attr("y", 18)
                            d3.selectAll(".xLabel")
                                .style("font-size", 18)
                                .attr("y", svgHeight - 24)
                                // .on("end", function(){
                                //     return d3.selectAll("svg")
                                //     .transition()
                                //     .duration(100)
                                //     .attr("opacity", 1)
                                // })
                            d3.selectAll("svg")
                                .append("text")
                                .attr("class", "lightAxisValue")
                                .attr("x", svgWidth - margin.right - 34)
                                .attr("y", svgHeight - 38)
                                .attr("text-anchor", "end")
                                .style("font-size", 16)
                                .text("250+")
                            d3.selectAll("svg")
                                .append("text")
                                .attr("class", "lightAxisValue")
                                .attr("x", margin.left)
                                .attr("y", svgHeight - 38)
                                .attr("text-anchor", "end")
                                .style("font-size", 16)
                                .text("0")
                            d3.selectAll("svg")
                                .append("text")
                                .attr("class", "lightAxisValue")
                                .attr("x", margin.left)
                                .attr("y", margin.top + 16)
                                .attr("text-anchor", "end")
                                .style("font-size", 16)
                                .text("90")
                            d3.selectAll("svg")
                                .transition()
                                .duration(500)
                                .attr("opacity", 1);
                            d3.selectAll(".chartTitle").attr("opacity", 1)
                        })
          },
        //   markers: true,
          // toggleActions: "play none reverse reverse", // maps to onEnter, onLeave, onEnterBack, onLeaveBack
        }
    });

    gsap.to("svg", {   
        scrollTrigger: {
            trigger: "#step4",  
            start: "top 20%",  
            end: "bottom 80%",
            onEnter: function(){
                drawLollipop();
            },
            onEnterBack: function(){
                drawLollipop();
            }
        }
    })

    gsap.to("svg", {   
        scrollTrigger: {
            trigger: "#step5",  
            start: "top 20%",  
            end: "bottom 80%",
            onEnter: function(){
                d3.selectAll(".lollipopDiv").remove();
                drawIA("Westchester", 200000, "small", 2);
                drawIA("Bronx", 200000, "small", 2);
                drawIA("Erie", 200000, "small", 2);
                drawIA("Kings", 200000, "small", 2);
                drawIA("Nassau", 200000, "small", 2);
                drawIA("New York", 200000, "small", 2);
                drawIA("Queens", 200000, "small", 2);
                drawIA("Suffolk", 200000, "small", 2);                        
            }
        }
    })

    
    
    var checkbox = document.getElementById("toggleSwitch")
    
    checkbox.addEventListener('change', function(){
        if(this.checked){
            drawHist("Westchester", 90, "small", 1);
            drawHist("Bronx", 90, "small", 1);
            drawHist("Erie", 90, "small", 1);
            drawHist("Kings", 90, "small", 1);
            drawHist("Nassau", 90, "small", 1);
            drawHist("New York", 90, "small", 1);
            drawHist("Queens", 90, "small", 1);
            drawHist("Suffolk", 90, "small", 1);
            d3.selectAll(".yAxis .domain").style("stroke", "blue")
            d3.selectAll(".xAxis .domain").style("stroke", "blue")
            d3.selectAll(".tick").remove()
            d3.select(".chartTitle").text("Westchester")
            d3.selectAll(".chartTitle")
                .style("font-weight", 600)
                .style("font-size", 18)
                .attr("y", 70)
                .attr("x", svgWidth - margin.right - 80)
                .style("text-anchor", "end")
            d3.selectAll(".xLabel")
                .style("font-size", 18)
                .attr("y", svgHeight - 24)
                // .on("end", function(){
                //     return d3.selectAll("svg")
                //     .transition()
                //     .duration(100)
                //     .attr("opacity", 1)
                // })
            d3.selectAll("svg")
                .append("text")
                .attr("class", "lightAxisValue")
                .attr("x", svgWidth - margin.right - 34)
                .attr("y", svgHeight - 38)
                .attr("text-anchor", "end")
                .style("font-size", 16)
                .text("250+")
            d3.selectAll("svg")
                .append("text")
                .attr("class", "lightAxisValue")
                .attr("x", margin.left)
                .attr("y", svgHeight - 38)
                .attr("text-anchor", "end")
                .style("font-size", 16)
                .text("0")
            d3.selectAll("svg")
                .append("text")
                .attr("class", "lightAxisValue")
                .attr("x", margin.left)
                .attr("y", margin.top + 16)
                .attr("text-anchor", "end")
                .style("font-size", 16)
                .text("90")
            d3.selectAll("svg")
                .transition()
                .duration(500)
                .attr("opacity", 1);
            d3.selectAll(".chartTitle").attr("opacity", 1)
            /* TOGGLE */
            d3.selectAll(".yLabel")
                .style("font-size", 18)
                .attr("x", -20)
                .attr("y", 18)
                .attr("opacity", 0)
            d3.selectAll(".yAxis")
                .transition()
                .duration(500)
                .attr("opacity", 0)
            d3.selectAll("text")
                .filter(function(){
                    return d3.select(this).text() == "200"
                })
                .transition()
                .duration(500)
                .attr("opacity", 0)
                d3.selectAll("text")
                .filter(function(){
                    return d3.select(this).text() == "90"
                })
                .transition()
                .duration(500)
                .attr("opacity", 0)
                // add image to .container1
                // d3.select(".container1")
                //     .append("img")
                //     .attr("class", "image")
                //     .attr("src", "./images/scaleExplain.png")
                //     .attr("width", 200)
                //     .attr("height", 50)

        }  else {
            d3.select(".container1")
                .selectAll(".chartArea")
                .selectAll(".histDiv")
                .selectAll("svg")   
                .transition().duration(1000)
                .attr("opacity", 0)
                .on("end", function(){
                    d3.select(this)
                        .remove()           
                })
                /* TOGGLE */
                d3.selectAll(".yLabel")
                    .style("font-size", 18)
                    .attr("x", -20)
                    .attr("y", 18)
                    .attr("opacity", 1)
                d3.selectAll(".yAxis")
                    .transition()
                    .duration(500)
                    .attr("opacity", 1)
                d3.selectAll("text")
                    .filter(function(){
                        return d3.select(this).text() == "200"
                    })
                    .transition()
                    .duration(500)
                    .attr("opacity", 1)
                d3.selectAll("text")
                    .filter(function(){
                        return d3.select(this).text() == "90"
                    })
                    .transition()
                    .duration(500)
                    .attr("opacity", 0)
        } 
    }) 

    const startElement = document.querySelector('.gsap-marker-start');
    // console.log(startElement);
    const endElement = document.querySelector('.gsap-marker-end');

    function updateStartStatus(message){
        // startElement.textContent = message;
        // console.log(message);
    }

    function updateEndStatus(message){
        // endElement.textContent = message;
        // console.log(message);
    }

    function redrawHist(scaleBreadth) {
        
        var scaleCreator = (scaleBreadth == "smaller") ?
            function (){
                return d3.scaleLinear()
                    .domain([0, 90])
                    .range([height, margin.top])
            }
            :
            function (){
                return d3.scaleLinear()
                    .domain([0, 20])
                    .range([height, margin.top])
            }

        newYScale = scaleCreator(); 
        
        var newYAxis = d3.axisLeft(newYScale).tickSizeOuter(0);

        var xScale = d3.scaleLinear()
            .domain([0, d3.max(medianByTract, d => +d.estimate / 1000)])
            .range([margin.left, width])            

        d3.selectAll(".yAxis")
            .transition()
            .duration(1000)
            // .call(d3.axisLeft(newYScale))
            .call(newYAxis)
            // .attr("font-size", 8)

        d3.select(".yAxis .tick").style("opacity", 0)

        d3.selectAll("rect")
            .transition()
            .duration(1000)
            .attr("transform", d => "translate(" + xScale(d.x0) + "," + newYScale(d.length) + ")")
            .attr("height", function(d) { return height - newYScale(d.length); })
    }

    function transitionSVGs(sizing) {
        return d3.selectAll("svg")
            .style("transform-origin", "top left")
            .transition()
            .duration(1000)
            .attr("width", function() {
                return sizing == "smaller" ? width / 2 : width + margin.left + margin.right;
            })
            .attr("height", function() {
                return sizing == "smaller" ? height / 2 : height + margin.top + margin.bottom;
            })

    }
}

