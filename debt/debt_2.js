async function drawCharts() {

    ///////////////////////
    /// 1. Access data  ///
    ///////////////////////

    debtData = await d3.csv("data/debt_forD3Import.csv", function(d){
        return {
            // keep the Year column as a string
            Year: d.Year,
            President: d.President,
            Party: d.Party,
            NewDebt: +d.NewDebtScaled,
            PreviousR: +d.PreviousRScaled,
            PreviousD: +d.PreviousDScaled,
            NewDebtPct: +d.NewDebtPct,
            TotalDebtInflationAdj: +d.TotalDebtInflationAdj
        }
    })

    // convert d.Year to a number
    /* debtData.forEach(d => {
        d.Year = +d.Year
    }) */

    // add a property to the data, called idNumber, that is equal to its index in the array
    debtData.forEach((d, i) => {
        d.idNumber = i
    })

    // assign each data point to a barView group
    debtData.forEach((d, i) => {
        switch(true){
            case (d.Year >= 1970 && d.Year <= 1980):
                d.barView = 1    
                break
            case (d.Year >= 1981 && d.Year <= 1992):
                d.barView = 2
                break
            case (d.Year >= 1993 && d.Year <= 2000):
                d.barView = 3
                break
            case (d.Year >= 2001 && d.Year <= 2007):
                d.barView = 4
                break
            case (d.Year >= 2008):
                d.barView = 5
                break
        }
    })

    /////////////////////////////
    /// 2. Chart Dimensions  ///
    ///////////////////////////

    svgWidth = 600
    svgHeight = 500 

    // set the dimensions of the chart area within the svg. This is where the chart will be drawn.
    gapMargin = {top: 10, bottom: 80, right: 0, left: 10}
    perfMargin = {top: 40, bottom: 20, right: 0, left: 15}
    perfAreaWidth = svgWidth - gapMargin.left - gapMargin.right
    perfAreaHeight = svgHeight - gapMargin.top - gapMargin.bottom
    dataAreaWidth = perfAreaWidth - perfMargin.left - perfMargin.right
    dataAreaHeight = perfAreaHeight - perfMargin.top - perfMargin.bottom

    /////////////////////////////
    /// 3. Create Canvas     ///
    ///////////////////////////

    const deviation_svg = d3.select("#deviation")
        .append("svg")
        .attr("id", "deviation_svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)

    const deviationPerfArea = deviation_svg.append("g")
        .attr("id", "deviationPerfArea")
        .attr("width", perfAreaWidth)
        .attr("height", perfAreaHeight)
        .attr("transform", `translate(${gapMargin.left}, ${gapMargin.top})`)
        
    const deviationDataArea = deviationPerfArea.append("g")
        .attr("id", "deviationDataArea")
        .attr("width", dataAreaWidth)
        .attr("height", dataAreaHeight)
        .attr("transform", `translate(${perfMargin.left + gapMargin.left}, ${perfMargin.top + gapMargin.top})`)
  

    // Note that to update an already redered chart with new data, this function can't include the svg creation code. Otherwise the binding of the new data would happen on new svg elements, not the existing ones.

    ////////////////////////////// DEVIATION FUNCTION BEGIN //////////////////////////////
    function drawDeviationChart(debtData, view, direction){  

        rProperty = "PreviousR"
        dProperty = "PreviousD"
        newProperty = "NewDebt"
    
          //////////////////////////////
         /// 4. Create Scales      ////
        //////////////////////////////

         const xScale = d3.scaleLinear()
            // set domain to the min and max values of the Year column
            .domain(d3.extent(debtData, d => d.Year))
            // set range to the width of the chart area
            // not sure what's going on here and why I need to set the range to 20 less than the dataAreaWidth, but it works for now.  Need to investigate why deviationPerfArea and deviationDataArea are taking up the same space on the page.
            .range([0, dataAreaWidth - 20])

        const yScale = d3.scaleLinear()
            // set domain to the min and max values of the TotalDebtInflationAdj column
            .domain([0, d3.max(debtData, d => d.TotalDebtInflationAdj)])
            .range([dataAreaHeight, 0])

          //////////////////////////////
         /// 5. Draw Chart         ////
        //////////////////////////////
        
        // draw the rects for the data
        
        if (view == 0 && direction != "up"){  // if this is the first view
            const barPadding = 2
            const barWidth = (dataAreaWidth / debtData.length) - barPadding
            rRects = deviationDataArea.append("g")
                // .attr("class", `barGroup-`)
                // .attr("id", `rRectArea-${view}`)
                //.attr("class", `barView${view}`)
                .selectAll("rect")
                .data(debtData)
                .join("rect")
                .attr("class", "barPartyR")
                .attr("id", d => d.Year + "previousR")
                .attr("x", d =>{
                    return xScale(d.Year) + barPadding
                })
                .attr("y", yScale(0))
                .attr("opacity", 0)
                .transition()
                .duration(2000)
                .attr("x", d =>{
                    return xScale(d.Year) + barPadding
                })
                .attr("y", (d, i) => {
                    // return (yScale(d.PreviousR))    
                    return (yScale(d[rProperty]))    
                })
                .attr("width", d => {
                    return barWidth
                })
                .attr("height", d => {
                    //return (dataAreaHeight - yScale(d.PreviousR))
                    return (dataAreaHeight - yScale(d[rProperty]))
                })
                .attr("fill" , d => {
                    if (view == 0){
                        return "orange"
                    } else {
                        return "red"
                    }
                })
                .attr("stroke", "black")
                .attr("stroke-width", 0)
                .attr("opacity", (d, i) => {
                    if(view == 0) {
                        return 1
                    } 
                })
        
            dRects = deviationDataArea
                .append("g")
                //.attr("class", `barGroup-${view}`)
                //.attr("id", `dRectArea-${view}`)
                //.attr("class", `barView${view}`)
                .selectAll("rect")
                .data(debtData)
                .join("rect")
                .attr("class", "barPartyD")
                .attr("x", d =>{
                    return xScale(d.Year) + barPadding
                })
                .attr("y", yScale(0))
                .transition()
                .duration(2000)
                .attr("id", d => d.Year + "previousD")
                .attr("x", d =>{
                    return xScale(d.Year) + barPadding
                })
                .attr("y", (d, i) => {
                    return (yScale(d[dProperty]) - (dataAreaHeight - yScale(d[rProperty])))    
                })
                .attr("width", d => {
                    return barWidth
                })
                .attr("height", d => {
                    return (dataAreaHeight - yScale(d[dProperty]))
                })
                .attr("stroke", "black")
                .attr("stroke-width", 0)
                // AFTER SETTING ALL ORANGE FOR GROUP 0, FIX THINGS BY SELECTING EACH GROUP AND THEN SELECTING THE RECTS, AND THEN SETTING THE FILL AND OPACITY FOR EACH GROUP.
                .attr("fill", d => {
                    if (view == 0){
                        return "orange"
                    } else {
                        return "blue"
                    }
                })
                .attr("opacity", (d, i) => {
                    if(view == 0){
                        return 1
                    }
                }) 

            newDebtRects = deviationDataArea
                .append("g")
                //.attr("class", `barGroup-${view}`)
                // .attr("id", `newDebtRectArea-${view}`)
                //.attr("class", `barView${view}`)
                .selectAll("rect")
                .data(debtData)
                .join("rect")
                .attr("class", "barPartyNewDebt")
                .attr("x", d =>{
                    return xScale(d.Year) + barPadding
                })
                .attr("y", yScale(0))
                .transition()
                .duration(2000)
                .attr("id", d => "newDebt" + d.Year)
                .attr("x", d =>{
                    return xScale(d.Year) + barPadding
                })
                .attr("y", (d, i) => {
                    return  (
                            yScale(d[newProperty]) 
                                - (dataAreaHeight - yScale(d[dProperty])) 
                                - (dataAreaHeight - yScale(d[rProperty]))
                            )
                
                })
                .attr("width", d => {
                    return barWidth
                })
                .attr("height", d => {
                    return (dataAreaHeight - yScale(d[newProperty]))
                })
                .attr("fill", d => {
                    if (view == 0){
                        return "orange"
                    } else {
                        return "yellow"
                    }
                })
                .attr("stroke", "black")
                .attr("stroke-width", 0) 
                .attr("opacity", (d, i) => {
                    if(view == 0){
                        return 1
                    } 
                })
        } 
        else {  // if it's not the first view
            if (view != 7) { // and it's not view #7
                d3.selectAll(".barPartyR")
                    .transition()
                    .duration(2000)
                    .attr("fill", (d, i) => {
                            if (d.barView <= view){
                                return("red")
                            } else {
                                return("orange")
                            }
                    })
                    .attr("opacity", (d, i) => {
                        if(d.barView == view || view == 6){
                            return 1
                        } else {
                            if (d.barView <= view){
                                return 0.5
                            } else {
                                return 0.2
                            }
                        }
                    })
                d3.selectAll(".barPartyD")
                    .transition()
                    .duration(2000)
                    .attr("fill", (d, i) => {
                            if (d.barView <= view){
                                return("blue")
                            } else {
                                return("orange")
                            }
                    })
                    .attr("opacity", (d, i) => {
                        if(d.barView == view || view == 6){
                            return 1
                        } else {
                            if (d.barView <= view){
                                return 0.5
                            } else {
                                return 0.2
                            }
                        }
                    })
                d3.selectAll(".barPartyNewDebt")
                    .transition()
                    .duration(2000)
                    .attr("fill", (d, i) => {
                            if (d.barView <= view){
                                return("limegreen")
                            } else {
                                return("orange")
                            }
                    })
                    .attr("opacity", (d, i) => {
                        if(d.barView == view || view == 6){
                            return 1
                        } else {
                            if (d.barView <= view){
                                return 0.5
                            } else {
                                return 0.2
                            }
                        }
                    })
            } else { // if it's view #7

                /* d3.selectAll('rect:not([id="2022"])').attr("opacity", 0)
                // d3.selectAll('rect:not([id="2022"])').remove()

                lastRects = d3.selectAll("#2022")
                    // .select("#2022")
                    .transition()
                    .duration(2000)
                    .attr("x", xScale(1990)) */
            }
        }

          //////////////////////////////
         /// 6. Draw Peripherals    ////
        //////////////////////////////

        /// X Axis ///
           // create the x-axis object
            var xAxis = d3.axisBottom(xScale)
                // .tickSize(-dataAreaHeight)
                .tickFormat(d => d)
                // .tickSizeOuter(0)
                // keep the labels, but remove the lines and ticks
                .tickSize(0)
                .tickPadding(0)
                .ticks(10)
                // use all the years as tick values
                .tickValues(debtData.map(d => d.Year))
                // remove the horizontaal x-axis line
            
            // append the x-axis object to the svg
            if(view == 0){
                var xText = deviationPerfArea
                    .append("g")
                    .attr("id", "xAxisGroup")
                    .attr("transform", `translate(${gapMargin.left + perfMargin.left + 2}, ${perfAreaHeight - 5})`)
                    .call(xAxis)
                    .selectAll("text")
                    .style("text-anchor", "end")
                    //.attr("x", "-.8em")
                    // .attr("y", ".05em")
                    .attr("transform", "rotate(-90)")
                    // use an evenly spaced font family
                    .attr("font-family", "sans-serif")
                    .attr("font-size", 10)
                    .attr("fill", "black")
                    .attr("stroke", "none")
                    .attr("stroke-width", 0)
            }

            d3.select("#xAxisGroup").selectAll("path").remove()

        /// Y Axis ///
        // create the y-axis object
        if(view == 0 && direction != "up"){
            var yAxis = d3.axisLeft(yScale)
            deviationPerfArea.append("g")
                    .attr("id", "yAxisGroup")
                    .attr("transform", `translate(${gapMargin.left + perfMargin.left}, ${perfMargin.top + gapMargin.top})`)
                    .transition()
                    .duration(2000)
                    .call(yAxis)
                    .style('opacity', 1)
                    // divide the y-axis labels by 1000 and add a T at the end 
                    .call(g => g.selectAll(".tick text")
                        .text(d => "$" + d / 1000 + "T"))
        }

        // draw the title
        if(view == 0){
            deviationPerfArea.append("text")
                .attr("id", "ChartTitle")
                .attr("x", perfMargin.left + gapMargin.left + (dataAreaWidth / 2))
                .attr("y", gapMargin.top)
                .attr("font-family", "Arial")
                // .attr("font-family", "Inter")
                .attr("font-weight", 700)
                .attr("text-anchor", "middle")
                .attr("font-size", 16)
                .text("Accumulated US Debt Since 1970 \(Inflation Adjusted\)")
        }

        // draw the president names
        if(view == 0){
            presNameArea = deviationPerfArea
                .append("g")
                .attr("id", "presidentName")
                .attr("transform", `translate(${gapMargin.left + perfMargin.left + 2}, ${perfAreaHeight + 25})`)
                .selectAll("text")
                .data(debtData)
                .join('text')
                .text(d => d.President)
                .attr("y", d => xScale(d.Year) + 7)
                .style("text-anchor", "end")
                .attr("transform", "rotate(-90)")
                .attr("font-family", "sans-serif")
                .attr("font-size", 10)
                .attr("stroke", "none")
                .attr("stroke-width", 0)
                .attr("fill", d => {
                    if(d.Party == "R"){
                        return "red"
                    } else {
                        return "blue"
                    }
                })
                .attr("font-weight", "300")
        }

        /////////// ANNOTATIONS ///////////

        /* switch(true){
            case (d.Year >= 1970 && d.Year <= 1980):
                d.barView = 1    
                break
            case (d.Year >= 1981 && d.Year <= 1992):
                d.barView = 2
                break
            case (d.Year >= 1993 && d.Year <= 2000):
                d.barView = 3
                break
            case (d.Year >= 2001 && d.Year <= 2007):
                d.barView = 4
                break
            case (d.Year >= 2008):
                d.barView = 5
                break
        } */

        /* switch(view){
            case (view == 5):
                annotationPoint = d3.select("#newDebt2020")

                annotations = [
                    {
                    note: {
                        label: "Pandemic Spending",
                        title: ""
                    },
                    type: d3.annotationCalloutRect,
                        subject: {
                        width: annotationPoint.attr("width"),
                        height: annotationPoint.attr("height")
                        },
                    x: annotationPoint.attr("x"),
                    y: annotationPoint.attr("y"),
                    dx: annotationPoint.attr("x") - 600,
                    dy: annotationPoint.attr("y") - 12
                    }
                ]
                break;
            
            case (view == 1):
                annotationPoint = d3.select("#newDebt1979")

                annotations = [
                    {
                    note: {
                        label: "Spending Cuts to Reduce Inflation",
                        title: ""
                    },
                    type: d3.annotationCalloutRect,
                        subject: {
                        width: annotationPoint.attr("width"),
                        height: annotationPoint.attr("height")
                        },
                    x: annotationPoint.attr("x"),
                    y: annotationPoint.attr("y"),
                    dx: annotationPoint.attr("x") - 600,
                    dy: annotationPoint.attr("y") - 12
                    }
                ]
             
        } */

        let annotations = []
        console.log("running remove")

        let oldAnnotations = d3.selectAll(".annotationsGroup")
            .transition()
            .duration(2000)  
            .attr("opacity", 0)
            
        oldAnnotations.remove()

        if (view == 2){
            let annotationPoint = d3.select("#newDebt1990")

            annotations = [
                {
                note: {
                    label: "First Iraq War",
                    title: ""
                },
                type: d3.annotationCalloutRect,
                    subject: {
                    width: annotationPoint.attr("width"),
                    height: annotationPoint.attr("height")
                    },
                x: annotationPoint.attr("x"),
                y: annotationPoint.attr("y"),
                dx: annotationPoint.attr("x") - 250,
                dy: annotationPoint.attr("y") - 300
                }
            ] 

            drawAnnotation()
        } 

        if (view == 3){
            let annotationPoint = d3.select("#newDebt1998")

            annotations = [
                {
                note: {
                    label: "Clinton's Balanced Budget Act takes Effect",
                    title: ""
                },
                type: d3.annotationCalloutRect,
                    subject: {
                    width: annotationPoint.attr("width"),
                    height: annotationPoint.attr("height")
                    },
                x: annotationPoint.attr("x"),
                y: annotationPoint.attr("y"),
                dx: annotationPoint.attr("x") - 350,
                dy: annotationPoint.attr("y") - 250
                }
            ] 
            drawAnnotation()
        }
        
        if (view == 4){
            let annotationPoint = d3.select("#newDebt2004")

            annotations = [
                {
                note: {
                    label: "Second Iraq War",
                    title: ""
                },
                type: d3.annotationCalloutRect,
                    subject: {
                    width: annotationPoint.attr("width"),
                    height: annotationPoint.attr("height")
                    },
                x: annotationPoint.attr("x"),
                y: annotationPoint.attr("y"),
                dx: annotationPoint.attr("x") - 400,
                dy: annotationPoint.attr("y") - 250
                }
            ] 
            drawAnnotation()
        }

        if (view == 5){

            let annotationPoint = d3.select("#newDebt2007")

            annotations = [
                {
                note: {
                    label: "Great Recession Starts",
                    title: ""
                },
                type: d3.annotationCalloutRect,
                    subject: {
                        width: annotationPoint.attr("width"),
                        height: annotationPoint.attr("height")
                    },
                x: annotationPoint.attr("x"),
                y: annotationPoint.attr("y"),
                dx: annotationPoint.attr("x") - 400,
                dy: annotationPoint.attr("y") - 200
                }
            ]
            drawAnnotation()

            annotationPoint = d3.select("#newDebt2020")

            annotations = [
                {
                note: {
                    label: "Pandemic Spending",
                    title: ""
                },
                type: d3.annotationCalloutRect,
                    subject: {
                        width: annotationPoint.attr("width"),
                        height: annotationPoint.attr("height")
                    },
                x: annotationPoint.attr("x"),
                y: annotationPoint.attr("y"),
                dx: annotationPoint.attr("x") - 600,
                dy: annotationPoint.attr("y") - 12
                }
            ]
            drawAnnotation()


        }
            // Add annotation to the chart
        function drawAnnotation(){
            const makeAnnotations = d3.annotation()
            .annotations(annotations)

            const annotationsGroup = d3.select("#deviationDataArea")
                .append("g")
                .attr("class", "annotationsGroup")

            annotationsGroup.call(makeAnnotations)
            console.log("ran annoation create")
                
            annotationsGroup.selectAll("g.annotation")
                .style("opacity", 0)                 
                .transition()
                .duration(2000)
                .style("opacity", 1);
        }

        


        // draw the subtitle, if necessary
        /* if(view ==2){  // if we're working on view 2 or 3, draw the subtitle
            deviationPerfArea.append("text")
                .attr("id", "ECVPMsubTitle")
                .attr("x", perfMargin.left + gapMargin.left + (dataAreaWidth / 2))
                .attr("y", gapMargin.top + 22)
                .attr("font-family", "Inter")
                .attr("font-weight", 700)
                .attr("text-anchor", "middle")
                .attr("font-size", 16)
                .attr("opacity", 0)
                .text('Deviation from Average')
                .transition()
                .duration(2000)
                .attr("opacity", 1)
        } 
        if(view == 1){
            console.log(view)
            d3.selectAll("#ECVPMsubTitle")
                .transition()
                .duration(2000)
                .attr("opacity", 0)
                .remove()
            console.log("got here")
        }


        // draw the x-axis label
        deviationPerfArea.append("text")
            .attr("id", "ECVPMLabel")
            .attr("x", perfMargin.left + gapMargin.left + (dataAreaWidth / 2))
            .attr("y", svgHeight - gapMargin.bottom / 2)
            .attr("font-family", "Inter")
            .attr("font-weight", 400)
            // set anchor to middle
            .attr("text-anchor", "middle")
            .attr("font-size", 14)
            .text("Electoral College Votes")

        // transition the active .step.is-active text to darker weight

        */ 

        d3.selectAll('div.step.is-active')
            .style('font-weight', 400)

        d3.selectAll(".step")
            .filter(function() {
                return !d3.select(this).classed("is-active");
            })
            .style("font-weight", 100);
        

            
          ///////////////////////////////
         /// 7.  Add Interactivity  ////
        /////////////////////////////// 

    }

    /////////////// SCROLLAMA STUFF ///////////////

    // using d3 for convenience
    var main = d3.select("main");
    var scrolly = main.select("#scrolly");
    var figure = scrolly.select("figure");
    var article = scrolly.select("article");
    var step = article.selectAll(".step");

    // initialize the scrollama
    var scroller = scrollama();

    // generic window resize listener event
    function handleResize() {
        // 1. update height of step elements
        // var stepH = Math.floor(window.innerHeight * 0.75);
        // var stepH = Math.floor(window.innerHeight * 1);
        var stepH = window.innerHeight * 0.75;  

        step.style("height", stepH + "px");

        var figureHeight = window.innerHeight / 2;
        //var figureHeight = window.innerHeight;
        var figureMarginTop = (window.innerHeight - figureHeight) / 2;
        // figureMarginTop = 40;

        figure
            .style("height", figureHeight + "px")
            .style("top", figureMarginTop + "px");

        // 3. tell scrollama to update new element dimensions
        scroller.resize();
    }

    // scrollama event handlers
    function handleStepEnter(response) {
        // response = { element, direction, index }

        // add color to current step only
        // This sets the class of the step to "is-active" if it is the current step
        step.classed("is-active", function (d, i) {
            return i === response.index;
        });

        // update text inside figure area based on step
        // figure.select("p").text(response.index + 1);
        if(response.index == 0){
            // parameters of drawDeviationChart are: data, view, start, end, direction    
            drawDeviationChart(debtData, 0, response.direction)
        } 
        else{
            if(response.index == 1){
                drawDeviationChart(debtData, 1, response.direction)
            }
            else{
                if(response.index == 2){
                   drawDeviationChart(debtData, 2, response.direction)
                }
                else{
                    if(response.index == 3){
                        drawDeviationChart(debtData, 3, response.direction)
                    }
                    else{
                        if(response.index == 4){
                            drawDeviationChart(debtData, 4, response.direction)
                        }
                        else{
                            if(response.index == 5){
                                drawDeviationChart(debtData, 5, response.direction)
                            } else {
                                if(response.index == 6){
                                    drawDeviationChart(debtData, 6, response.direction)
                                } else {
                                    if(response.index == 7){
                                        drawDeviationChart(debtData, 7, response.direction)
                                    }
                                }
                            }
                        } 
                    }
                }                
            }
        }
    }

    function handleStepExit(response) {
        // response = { element, direction, index }
        step.classed("is-active", function (d, i) {
            return i === response.index;
        });
    }

    function init() {

        // 1. force a resize on load to ensure proper dimensions are sent to scrollama
        handleResize();

        // 2. setup the scroller passing options
        // 		this will also initialize trigger observations
        // 3. bind scrollama event handlers (this can be chained like below)

        var midpoint = Math.floor(window.innerHeight * 0.5) + "px"

        scroller
            .setup({
                step: "#scrolly article .step",
                offset: 0.5,
                debug: false
            })
            .onStepEnter(handleStepEnter)
            .onStepExit(handleStepExit);
    }

    // kick things off
    init();    
} 
drawCharts()
