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


    function drawDeviationChart(debtData, view, startIndex, stopIndex, direction){  

        console.log(view)

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

        // if the user is scrolling down the page, render the rects in the active group.
        if (direction != "up"){
            const barPadding = 2
            const barWidth = (dataAreaWidth / debtData.length) - barPadding
            rRects = deviationDataArea.append("g")
                .attr("class", `barGroup-${view}`)
                .attr("id", `rRectArea-${view}`)
                .selectAll("rect")
                .data(debtData)
                .join("rect")
                .attr("x", d =>{
                    return xScale(d.Year) + barPadding
                })
                .attr("y", yScale(0))
                .attr("opacity", 0)
                .transition()
                .duration(2000)
                .attr("id", d => d.Year)
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
                .attr("fill", "red")
                .attr("stroke", "black")
                .attr("stroke-width", 0)
                .attr("opacity", (d, i) => {
                    if(i >=startIndex & i <= stopIndex){
                        console.log(startIndex)
                        return 1
                    } 
                    else {
                        return 0
                    }
                })
        
            dRects = deviationDataArea
                .append("g")
                .attr("class", `barGroup-${view}`)
                .attr("id", `dRectArea-${view}`)
                // .attr("id", "dRectArea")
                .selectAll("rect")
                .data(debtData)
                .join("rect")
                .attr("x", d =>{
                    return xScale(d.Year) + barPadding
                })
                .attr("y", yScale(0))
                .transition()
                .duration(2000)
                .attr("id", d => d.Year)
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
                .attr("fill", "blue")
                .attr("stroke", "black")
                .attr("stroke-width", 0)
                .attr("opacity", (d, i) => {
                    if(i >= startIndex & i <= stopIndex){
                        return 1
                    } 
                    else {
                        return 0
                    }
                }) 

            newDebtRects = deviationDataArea
                .append("g")
                .attr("class", `barGroup-${view}`)
                .attr("id", `newDebtRectArea-${view}`)
                // .attr("id", "newDebtRectArea")
                .selectAll("rect")
                .data(debtData)
                .join("rect")
                .attr("x", d =>{
                    return xScale(d.Year) + barPadding
                })
                .attr("y", yScale(0))
                .transition()
                .duration(2000)
                .attr("id", d => d.Year)
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
                .attr("fill", "orange")
                .attr("stroke", "black")
                .attr("stroke-width", 0) 
                .attr("opacity", (d, i) => {
                    if(i >= startIndex & i <= stopIndex){
                        return 1
                    } 
                    else {
                        return 0
                    }
                })
        } 
        else {
            // lighten the opacity for all barGroups except the active one
            d3.selectAll('[class^="barGroup-"]')
                .filter(function() {
                    return !d3.select(this).classed(`barGroup-${view}`);
                    })  
                .transition()
                .duration(1000)
                .attr('opacity', '0.2');    
            
            // make the active barGroup fully opaque
            d3.selectAll('.barGroup-' + view)
                .transition()
                .duration(1000)
                .attr('opacity', '1');  

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
                .text("US Deficit Since 1970")
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
    drawDeviationChart(debtData, -1, 200, 100, 0)

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
            // subset debtData to the first 10 entries
            drawDeviationChart(debtData, 0, 0, 10, response.direction)
        } 
        else{
            if(response.index == 1){
                drawDeviationChart(debtData, 1, 11, 20, response.direction)
            }
            else{
                if(response.index == 2){
                   drawDeviationChart(debtData, 2, 21, 30, response.direction)
                }
                else{
                    if(response.index == 3){
                        drawDeviationChart(debtData, 3, 31, 40, response.direction)
                    }
                    else{
                        if(response.index == 4){
                            drawDeviationChart(debtData, 4, 41, debtData.length, response.direction)
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
                offset: 0.9,
                debug: false
            })
            .onStepEnter(handleStepEnter)
            .onStepExit(handleStepExit);
    }

    // kick things off
    init();    
} 
drawCharts()
