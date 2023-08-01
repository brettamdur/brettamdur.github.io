
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
svgHeight = 600 * (500 / 600);


// width and height here are chartWidth and chartHeight, not svgWidth and svgHeight.
// Chart is contained inside the svg. 
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

function drawChart(medianByTract) {

    // filter medianByTract to desired counties
    // medianByTractCounties = medianByTract.filter(d => 
    //     d.county === "New York" ||
    //     d.county === "Nassau" ||
    //     d.county === "Erie" ||
    //     d.county === "Bronx" ||
    //     d.county === "Kings" ||
    //     d.county === "Queens" ||
    //     d.county === "Suffolk"
    // )

    function drawIA(countyScope, yMax, chartSize){

        // NOTE: unlike the case with tracts, here the data is coming in with the frequency of households per income bracket already calculated.  So we don't need to do any binning or histogramming.

        /////////////////////////////////////////////////
        /////////// DATA SETUP /////////////////////////
        ///////////////////////////////////////////////

        // this is the 5Y data from the ACS
        d3.csv("./data/bucketsByTract_cleaned_Adjusted.csv").then(d => {
        // d3.csv("./data/acs-1Y-Westchester-inALICE.csv").then(d => {
            var householdCount = d.filter(d => d.county === countyScope)
              
            householdCount.sort(function(a, b) {
                var incomeA = parseFloat(a.income.split("-")[0]);
                var incomeB = parseFloat(b.income.split("-")[0]);
                return incomeA - incomeB;
            });
              
            bracketCount = householdCount.length


            ////////////////////////////////////////////////
            /////////// SVG SETUP /////////////////////////
            //////////////////////////////////////////////

            var svg = d3.select(".chart-body")
                .append("div")
                .attr("class", "iaChart")
                .attr("id", (d, i) => `${countyScope}`)
                .append("svg")
                .attr("class", "chartContent")
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
                .attr("transform", "translate(10,0)")
                .append("g")
                .attr("class", "chartArea")

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
                .domain([0, 250000])  // hardcoding this for now
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
                // .attr("id", (d, i) => `${d.income}`)
                .attr("id", (d, i) => d.income)
                .attr("x", (d,n) => margin.left + (n * totalBarWidth)+ 10)
                .attr("y", d => yScale(d.estimate))
                .attr("width", d => barColorWidth)
                // .attr("height", 10)
                .attr("height", d => height - yScale(d.estimate))
                .style("fill", "#7eb0d5")

            // set the category of each bar
            var povertyBars = d3.selectAll(".bar")
                // .filter((d, i) => i < 5)
                .filter((d, i) => i < 4)
                .attr("class", "bar povertyBar")

            var aliceBars = d3.selectAll(".bar")
                .filter((d, i) => i >= 4 && i <= 10)
                .attr("class", "bar aliceBar")

            var aboveAliceBars = d3.selectAll(".bar")
                .filter((d, i) => i >= 11 && i <= 15)
                .attr("class", "bar aboveAliceBar")  

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
                .text("Household Income ($000s)");
                
            reduceDeets()

        })

        function reduceDeets(){  // reduces the details around axes and labels, etc.

            d3.selectAll(".yAxis .domain").style("stroke", "blue")
                    d3.selectAll(".xAxis .domain").style("stroke", "blue")
                    d3.selectAll(".tick").remove()
                    d3.select(".chartTitle").text("Westchester")
                    d3.selectAll(".chartTitle")
                        .style("font-weight", 600)
                        .style("font-size", 18)
                        .attr("y", 60)
                        .attr("x", margin.left + (svgWidth / 4) + 18)
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
                        .attr("id", "textToHide")
                        .attr("x", svgWidth - margin.right - 34)
                        .attr("y", svgHeight - 38)
                        .attr("text-anchor", "end")
                        .style("font-size", 16)
                        .text("200+")
                    d3.selectAll(".chartArea")
                        .append("text")
                        .attr("class", "lightAxisValue")
                        .attr("x", margin.left)
                        .attr("y", svgHeight - 38)
                        .attr("text-anchor", "end")
                        .style("font-size", 16)
                        .text("0")
                    d3.selectAll(".chartArea")
                        .append("text")
                        .attr("class", "lightAxisValue")
                        .attr("id", "yMaxValue")
                        .attr("x", margin.left)
                        .attr("y", margin.top + 16)
                        .attr("text-anchor", "end")
                        .style("font-size", 16)
                        .text("250")
                    d3.selectAll("svg")
                        .transition()
                        .duration(500)
                        .attr("opacity", 1);
                    d3.selectAll(".chartTitle").attr("opacity", 1)
        }
        return Promise.resolve();
    }

    function colorPovertyBars() {
        // gsap.to(".povertyBar", {duration: 1, fill: "orange"})

        gsap.to(".povertyBar", { 
            scrollTrigger: {
                trigger: "#step2",
                start: "top center",
                end: "bottom center",
                toggleActions: "play none none reverse", 
            },
            duration: 1,
            fill: "orange"                  
        })


    }

    function stackPovertyBars() {
    
        var povertyBars = d3.selectAll(".povertyBar");
        var startY = parseFloat(povertyBars.nodes()[3].getBBox().y);
        var startX = parseFloat(povertyBars.nodes()[3].getBBox().x);

        povertyBars.each(function(d, i) {
            if (i < 3) {
                var currentBar = d3.select(this);
                thisHeight = parseFloat(currentBar.attr("height"));
                newY = startY - thisHeight;
                deltaX = startX - this.getBBox().x;  // Change in X
                deltaY = newY - this.getBBox().y;  // Change in Y
                startY = newY;
        
                gsap.to(this, { 
                    scrollTrigger: {
                        trigger: "#step3",
                        start: "top center",
                        end: "bottom center",
                        toggleActions: "play none none reverse",
                    },
                    duration: 1,
                    onStart: function() {
                        deltaY = newY - currentBar.node().getBBox().y;  // Recalculate deltaY
                        deltaX = startX - currentBar.node().getBBox().x;  // Recalculate deltaX
                    },
                    onComplete: function() {
                        // Update your data on each frame of the animation
                        d.position2X = currentBar.node().getBBox().x;
                        d.position2Y = currentBar.node().getBBox().y;

                        console.log(d.position2X, d.position2Y)
                    },
                    y: `+=${deltaY}`,
                    x: `+=${deltaX}`                    
                })   
            }
            // else{
            //     var currentBar = d3.select(this);
            //     thisHeight = parseFloat(currentBar.attr("height"));
            //     newY = startY - thisHeight;
            //     deltaX = startX - this.getBBox().x;  // Change in X
            //     deltaY = newY - this.getBBox().y;  // Change in Y
            //     startY = newY;

            //     d.position2X = currentBar.node().getBBox().x;
            //     d.position2Y = currentBar.node().getBBox().y;

            //     console.log(d.position2X, d.position2Y)
            // }
        });

        const svgImage = d3.selectAll(".svgImage").attr("opacity", 0)

        const imageUrl = "./images/bp.png";
        const imageWidth = 346 * .8; 
        const imageHeight = 74 * .8; 
        const xPosition = 75; 
        const yPosition = 80;

        d3.select(".chartArea")
            .append("image")
            .attr("class", "svgImage")
            .attr("id", "bpImage")
            .attr("xlink:href", imageUrl)
            .attr("width", imageWidth)
            .attr("height", imageHeight)
            .attr("x", xPosition)
            .attr("y", yPosition)
            .attr("opacity", 0)

        gsap.to("#bpImage", {
            scrollTrigger: {
                trigger: "#step3",
                start: "top center",
                end: "bottom center",
                toggleActions: "play none none reverse",
            },
            opacity: 1,
            // x: xPosition, 
            // y: yPosition, 
            duration: 1, 
            ease: "power2.inOut", 
            });
    }
        
    function stackAliceBars() {

        var aliceBars = d3.selectAll(".aliceBar");
        var startY = parseFloat(aliceBars.nodes()[6].getBBox().y);
        var startX = parseFloat(aliceBars.nodes()[6].getBBox().x);

        aliceBars.each(function(d, i) {
            if (i < 6) {
                var currentBar = d3.select(this);
                thisHeight = parseFloat(currentBar.attr("height"));
                newY = startY - thisHeight;
                deltaX = startX - this.getBBox().x;  // Change in X
                deltaY = newY - this.getBBox().y;  // Change in Y
                startY = newY;
        
                gsap.to(this, { 
                    scrollTrigger: {
                        trigger: "#step4",
                        start: "top center",
                        end: "bottom center",
                        toggleActions: "play none none reverse", 
                    },
                    duration: 1,
                    onStart: function() {
                        deltaY = newY - currentBar.node().getBBox().y;  // Recalculate deltaY
                        deltaX = startX - currentBar.node().getBBox().x;  // Recalculate deltaX
                    },
                    y: `+=${deltaY}`,
                    x: `+=${deltaX}`,
                    fill: "yellowgreen"
                })
            }
            else{
                gsap.to(this, { 
                    scrollTrigger: {
                        trigger: "#step4",
                        start: "top center",
                        end: "bottom center",
                        toggleActions: "play none none reverse", 
                    },
                    fill: "yellowgreen",
                    duration: 1,
                });
            }
        });

        const imageUrl = "./images/bp-ba.png";
        const imageWidth = 346 * .8; 
        const imageHeight = 74 * .8; 
        const xPosition = 75; 
        const yPosition = 80;

        d3.select(".chartArea")
            .append("image")
            .attr("class", "svgImage")
            .attr("id", "bpBaImage")
            .attr("xlink:href", imageUrl)
            .attr("width", imageWidth)
            .attr("height", imageHeight)
            .attr("x", xPosition)
            .attr("y", yPosition)
            .attr("opacity", 0)

        gsap.to("#bpBaImage", {
            scrollTrigger: {
                trigger: "#step4",
                start: "top center",
                end: "bottom center",
                toggleActions: "play none none reverse",
            },
            opacity: 1, 
            duration: 1, 
            ease: "power2.inOut", 
            });

        gsap.to("#bpImage", {
            scrollTrigger: {
                trigger: "#step4",
                start: "top center",
                end: "bottom center",
                toggleActions: "play none none reverse",
            },
            opacity: 0, 
            duration: 1, 
            ease: "power2.inOut", 
            });
    }

    function stackAboveAliceBars() {
        var aboveAliceBars = d3.selectAll(".aboveAliceBar");
        var startY = parseFloat(aboveAliceBars.nodes()[4].getBBox().y);
        var startX = parseFloat(aboveAliceBars.nodes()[4].getBBox().x);

        aboveAliceBars.each(function(d, i) {
            if (i < 4) {
                var currentBar = d3.select(this);
                thisHeight = parseFloat(currentBar.attr("height"));
                newY = startY - thisHeight;
                deltaX = startX - this.getBBox().x;  // Change in X
                deltaY = newY - this.getBBox().y;  // Change in Y
                startY = newY;
        
                gsap.to(this, { 
                    scrollTrigger: {
                        trigger: "#step5",
                        start: "top center",
                        end: "bottom center",
                        toggleActions: "play none none reverse", 
                    },
                    duration: 1,
                    onStart: function() {
                        deltaY = newY - currentBar.node().getBBox().y;  // Recalculate deltaY
                        deltaX = startX - currentBar.node().getBBox().x;  // Recalculate deltaX
                    },
                    y: `+=${deltaY}`,
                    x: `+=${deltaX}`,
                    // fill: "yellowgreen"
                })
            }
        });

        const imageUrl = "./images/bp-ba-aa.png";
        const imageWidth = 346 * .8; 
        const imageHeight = 74 * .8; 
        const xPosition = 75; 
        const yPosition = 80; 

        d3.select(".chartArea")
            .append("image")
            .attr("class", "svgImage")
            .attr("id", "bpBaAaImage")
            .attr("xlink:href", imageUrl)
            .attr("width", imageWidth)
            .attr("height", imageHeight)
            .attr("x", xPosition)
            .attr("y", yPosition)
            .attr("opacity", 0)

        gsap.to("#bpBaAaImage", {
            scrollTrigger: {
                trigger: "#step5",
                start: "top center",
                end: "bottom center",
                toggleActions: "play none none reverse",
            },
            opacity: 1, 
            duration: 1, 
            ease: "power2.inOut", 
            });

        gsap.to("#bpBaImage", {
            scrollTrigger: {
                trigger: "#step5",
                start: "top center",
                end: "bottom center",
                toggleActions: "play none none reverse",
            },
            opacity: 0, 
            duration: 1, 
            ease: "power2.inOut", 
            });

        gsap.to("#textToHide", {
            scrollTrigger: {
                trigger: "#step5",
                start: "top center",
                end: "bottom center",
                toggleActions: "play none none reverse",
            },
            opacity: 0, 
            duration: 1, 
            ease: "power2.inOut", 
            });    
        
    }

    function stackPovAndBelowAliceBars() {
        var povertyBars = d3.selectAll(".povertyBar");
        var topAliceBar = d3.select('[id="50-59.9"]');

        startY =  413.7354736328125 - 109.4614  // the top of the bar that we're stacking on top of.  It starts as the bottom bar, and then updates to the top of the most recently stacked bar in each iteration of the loop.
        startX = 274.28570556640625 + 23.8095   // the left edge of the bar that we're stacking on top of.  This actually never changes bcse the bars all start at the same x position.

        povertyBars.each(function(d, i) {  // for each poverty bar, move it to the top of the stack
            
            var currentBar = d3.select(this);  // select the current bar
            thisHeight = parseFloat(currentBar.attr("height")); // grab the current bar's height
            newY = startY - thisHeight; // the new starting point for this bar is the y value of the last bar stacked minus the height of the current bar (remembering that as y values decrease they move toword the top of the screen).  This calculation moves the starting point up the screen.
            deltaY = newY - this.getBBox().y;  // gsap requires not the absolute value of the new coordinate, but the change in the coordinate relative to its current position.  So we need to calculate that.  This is the new y coordinate of this box minus the current y coordinate of this box, which of course equals the change in y.
            deltaX = startX - this.getBBox().x;  // same thing for x values
            
            startY = newY;  // We reset startY, because in the next iteration of the loop, i.e. the next box, the starting point will be the new y coordinate of this box

            gsap.to(this, { 
                scrollTrigger: {
                    trigger: "#step5",
                    start: "top center",
                    end: "bottom center",
                    toggleActions: "play none none reverse", 
                },
                duration: 1,
                onStart: function() {
                    // deltaY = newY - currentBar.node().getBBox().y;  // Recalculate deltaY
                    // deltaX = startX - currentBar.node().getBBox().x;  // Recalculate deltaX
                },
                y: `+=${deltaY}`,
                x: `+=${deltaX}`,
            })

            // var currentBar = d3.select(this);
            // thisHeight = parseFloat(currentBar.attr("height"));
            // newY = startY - thisHeight;

            // var currentPosition2X = parseFloat(currentBar.attr("x"));
            // var currentPosition2Y = parseFloat(currentBar.attr("y"));
            
            // var deltaX = startX - currentPosition2X;  // Change in X
            // var deltaY = newY - currentPosition2Y;  // Change in Y

            // startY = newY;

            // gsap.fromTo(
            //     this, 
            //     {
            //         x: currentPosition2X,
            //         y: currentPosition2Y,
            //     },
            //     { 
            //         scrollTrigger: {
            //             trigger: "#step5",
            //             start: "top center",
            //             end: "bottom center",
            //             // start: "top top",
            //             // end: "bottom bottom",
            //             toggleActions: "play none none reverse", 
            //         },
            //         duration: 1,
            //         onStart: function() {
            //             // deltaY = newY - currentBar.node().getBBox().y;  // Recalculate deltaY
            //             // deltaX = startX - currentBar.node().getBBox().x;  // Recalculate deltaX
            //         },
            //         y: `+=${deltaY}`,
            //         x: `+=${deltaX}`,
            //     }
            // )
        })

        // draw a horizontal line to show the ALICE line
        var aliceLine = d3.select(".chartArea")
            .append("line")
            .attr("class", "aliceLine")
            .attr("x1", margin.left)
            .attr("y1", 436.62213134765625 - 192.5291)
            // .attr("x2", svgWidth - margin.right)
            .attr("x2", width - barColorWidth - 20)
            .attr("y2", 436.62213134765625 - 192.5291)
            .attr("stroke-width", 0.4)
            .attr("stroke", "black")
            .attr("opacity", 0)

        gsap.to(".aliceLine", { 
            scrollTrigger: {
                trigger: "#step5",
                start: "top center",
                end: "bottom center",
                toggleActions: "play none none reverse", 
            },
            duration: 1,
            opacity: 1
        })

        // label the Alice line with some text
        var aliceLineText = d3.select(".chartArea")
            .append("text")
            .attr("class", "aliceLineText")
            //.attr("x", width - barColorWidth - 20)  // svgWidth - margin.right - 20)
            .attr("x", margin.left + 10)  // svgWidth - margin.right - 20)
            .attr("y", 436.62213134765625 - 192.5291 - 6)
            .attr("text-anchor", "start")
            .style("font-size", 12)
            .text("Westchester ALICE + Poverty Line: 125,562 Households")          
            .attr("opacity", 0)
            
        gsap.to(".aliceLineText", { 
            scrollTrigger: {
                trigger: "#step5",
                start: "top center",
                end: "bottom center",
                toggleActions: "play none none reverse", 
            },
            duration: 1,
            opacity: 1
        })
    }

    function drawWcHorizHundred() {

        const imageUrl = "./images/westchesterHorizHundred.png";
        const imageWidth = "100%"; 
        // const imageHeight = 74 * .8; 
        const xPosition = 0; 
        const yPosition = 0; 

        d3.select(".chartContent")
            .append("g")
            .append("image")
            .attr("class", "wcHundredPctImage")
            .attr("xlink:href", imageUrl)
            .attr("width", imageWidth)
            // .attr("height", imageHeight)
            .attr("x", xPosition)
            .attr("y", yPosition)
            .attr("opacity", 0)
        
        gsap.to(".wcHundredPctImage", {
            scrollTrigger: {
                trigger: "#step6",
                start: "top center",
                end: "bottom center",
                toggleActions: "play none none reverse",
            },
            opacity: 1,
            duration: 1,
            ease: "power2.inOut",
        });

        gsap.to(".chartArea", {
            scrollTrigger: {
                trigger: "#step6",
                start: "top center",
                end: "bottom center",
                toggleActions: "play none none reverse",
            },
            opacity: 0,
            duration: 1,
            ease: "power2.inOut",
        });

    }

    function drawHorizStripes() {
        
        gsap.to(".wcHundredPctImage", {
            scrollTrigger: {
                trigger: "#step7",
                start: "top center",
                end: "bottom center",
                toggleActions: "play none none reverse",
            },
            // x: "50%",
            // y: 0,
            scale: 0,
            transformOrigin: "center center",
            duration: 1,
            ease: "power2.inOut",
        });
      
        const imageUrl = "./images/horizHundredPct_small.png";
        const imageWidth = "100%"; 
        // const imageHeight = 74 * .8; 
        const xPosition = 0; 
        const yPosition = 0; 

        d3.select(".chartContent")
            .append("g")
            .append("image")
            .attr("class", "hundredPctImage")
            .attr("xlink:href", imageUrl)
            .attr("width", imageWidth)
            // .attr("height", imageHeight)
            .attr("x", xPosition)
            .attr("y", yPosition)
            .attr("opacity", 0)
        
        gsap.to(".hundredPctImage", {
            scrollTrigger: {
                trigger: "#step7",
                start: "top center",
                end: "bottom center",
                toggleActions: "play none none reverse",
            },
            opacity: 1,
            duration: 1,
            ease: "power2.inOut",
        });
            
    }
    
    // ////////////////////////////////////////////
    // //// SCROLL TRIGGER ////////////////////////
    // ////////////////////////////////////////////

    ScrollTrigger.create({
        // NOTE: this doesn't animate anything.  It just pins the chart area to the middle of the screen while scrolling through the steps.
        trigger: ".bar-chart-steps",
        start: "top 10%",  // first argument is relative to the trigger, second is relative to the viewport.  So this means "When the top of the trigger element hits the point 10% down from the top of the viewport, start the stickiness."
        end: "bottom 80%", // "When the bottom of the trigger element hits a point 80% of the way down the viewport, end the stickiness."
        pin: ".to-pin",  
        pinSpacing: false,
        scrub: true,
        onEnter: function() {
        },
        // when user scrolls down past the entire scrollTrigger area
        onLeave: function() {
            // wait one second, then remove all of the children of container1
            setTimeout(function() {
                
            }
            , 1000)
        },
        // when user scrolls back up past the entire scrollTrigger area
        onLeaveBack: function() {
            // wait one second, then remove all the chartArea divs
            setTimeout(function() {

            }, 2000)
        },
        markers: false,
    })

    drawIA("Westchester", 90, "large", 1)
        .then(() => {
            // timeout approach not very elegant, but promise isn't working.
            setTimeout(() => {
                // each function includes: a) functionality to draw its content with zero opacity as soon as the page renders, with zero opacity, and b) a scrolltrigger to fade it in when the user scrolls to the triggering area on the page, and out when the user leaves that area.
                colorPovertyBars();
                stackPovertyBars();
                stackAliceBars();
                stackAboveAliceBars();
                stackPovAndBelowAliceBars();
                drawWcHorizHundred();
                drawHorizStripes();
            }, 200);
        })
        .catch((error) => {
            console.error(error);
        });
}

