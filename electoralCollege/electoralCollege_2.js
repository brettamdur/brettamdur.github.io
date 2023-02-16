async function drawCharts() {

    ///////////////////////
    /// 1. Access data  ///
    ///////////////////////

    // load rData2016 data, converting numeric columns to numbers

    data2016 = await d3.csv("./data/rData2016.csv", function(d){
        return {
            State: d.State,
            Abbreviation: d.Abbreviation,
            Winner: d.Winner,
            ApportionPop: +d.ApportionPop,
            TotalEv: +d.TotalEv,
            ECVPM_ApportionPop: +d.ECVPM_ApportionPop,
            DVotes: +d.ClintonVotes,
            DPct: +d.Clinton,
            DEVotes: +d.ClintonEV,
            RVotes: +d.TrumpVotes,
            RPct: +d.Trump,
            REVotes: +d.TrumpEV,
            OtherVotes: +d.OtherVotes,
            Other: +d.Other,
            OtherEV: +d.OtherEV,
            TotalVotes: +d.TotalVotes,
            WinnerMargin: +d.WinnerMargin,
            WinnerMarginVotes: +d.WinnerMarginVotes,
            ECPerVoter: +d.ECPerVoter            
        }
    })

    // add a column to data2016 for the ECVPM_Deviation, which is ECVPM_ApportionPop - the mean of ECVPM_ApportionPop
    const meanECVPM_ApportionPop = d3.mean(data2016, d => d.ECVPM_ApportionPop) 
    data2016.forEach(d => d.ECVPM_Deviation = d.ECVPM_ApportionPop - meanECVPM_ApportionPop)

    
    const data2020 = await d3.csv("./data/rData2020.csv", function(d){
        return {
            State: d.State,
            Abbreviation: d.Abbreviate,
            Winner: d.Winner,
            ApportionPop: +d.ApportionPop,
            TotalEv: +d.ECVotes,
            ECVPM_ApportionPop: +d.ECVPM_ApportPop,
            ECVPM_Deviation: +d.ECVPM_deviation,
            DVotes: +d.BVotes,
            DPct: +d.Bpercentage,
            RVotes: +d.TVotes,
            RPct: +d.Tpercentage,
            TotalVotes: +d.TotalVotes, // 
            WinnerMargin: +d.WinnerMargin,
            ECPerVoter: +d.ECV_perTurnout,
            ECPerVoterDeviation: +d.ECV_deviation      
        } 
    })
    
    /////////////////////////////
    /// 2. Chart Dimensions  ///
    ///////////////////////////

    // set the dimensions of the svg
    svgWidth = 600
    svgHeight = 700 

    // set the dimensions of the chart area within the svg. This is where the chart will be drawn.
    gapMargin = {top: 10, right: 0, bottom: 30, left: 10}
    perfMargin = {top: 40, right: 0, bottom: 20, left: 100}
    perfAreaWidth = svgWidth - gapMargin.left - gapMargin.right
    perfAreaHeight = svgHeight - gapMargin.top - gapMargin.bottom
    dataAreaWidth = perfAreaWidth - perfMargin.left - perfMargin.right
    dataAreaHeight = perfAreaHeight - perfMargin.top - perfMargin.bottom

    /////////////////////////////
    /// 3. Draw Canvas       ///
    ///////////////////////////

    const deviation_svg = d3.select("#deviation")
        .append("svg")
        .attr("id", "deviation_svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)

    const deviationPerfArea = deviation_svg.append("g")
        .attr("id", "deviationPerfArea")
        .style("transform", `translate(${gapMargin.left}px, ${gapMargin.top}px)`)
        
    const deviationDataArea = deviationPerfArea.append("g")
        .attr("id", "deviationDataArea")
        .style("transform", `translate(${perfMargin.left + gapMargin.left}px, ${perfMargin.top + gapMargin.top}px)`)

  

    // Note that to update an already redered chart with new data, this function can't include the svg creation code. Otherwise the binding of the new data would happen on new svg elements, not the existing ones.
    function drawDeviationChart(ECVData, view){
    
          //////////////////////////////
         /// 4. Create Scales      ////
        //////////////////////////////

        /* const xScale = d3.scaleLinear()
            .domain(d3.extent(ECVData, d => d.ECVPM_Deviation))
            .range([0, dataAreaWidth])
            .nice() */
        
        const xScale = d3.scaleLinear()
            .domain(d3.extent(ECVData, d => {
                if(view <= 1){
                    return d.ECVPM_ApportionPop
                } else {
                    return d.ECVPM_Deviation
                }
            }))
            .range([0, dataAreaWidth])
            .nice()

        zeroValue = xScale(0);

          //////////////////////////////
         /// 5. Draw Chart         ////
        //////////////////////////////

        // Add property to ECVData to store the index of each object if it was sorted by ECVPM_Deviation        

        /* // sort data2016 by ECVPM_ApportionPop
        ECVData = ECVData.sort((a, b) => d3.descending(a.ECVPM_ApportionPop, b.ECVPM_ApportionPop))

        if(view > 1){
            ECVData = ECVData.sort((a, b) => d3.descending(a.ECVPM_Deviation, b.ECVPM_Deviation))
        }
        ECVData.forEach((d, i) => d.deviationIndex = i)
        // if(view == 0){
        //    ECVData = ECVData.sort((a, b) => d3.descending(a.Winner, b.Winner))
        //} 
        // Add property to ECVData to store the index of each object if it was sorted by Winner
        ECVData.sort((a, b) => d3.descending(a.Winner, b.Winner))
        ECVData.forEach((d, i) => d.winnerIndex = i) */


        // create indices for the three ways to sort the data
        ECVData = ECVData.sort((a, b) => d3.descending(a.ECVPM_Deviation, b.ECVPM_Deviation))
        ECVData.forEach((d, i) => d.deviationIndex = i)
        ECVData.sort((a, b) => d3.descending(a.Winner, b.Winner))
        ECVData.forEach((d, i) => d.winnerIndex = i)
        ECVData = ECVData.sort((a, b) => d3.descending(a.ECVPM_ApportionPop, b.ECVPM_ApportionPop))
        ECVData.forEach((d, i) => d.apportionIndex = i)

        
            
        // draw the rects for the data
        const barPadding = 2
        const barHeight = (dataAreaHeight / ECVData.length) - barPadding
        rects = deviationDataArea.selectAll("rect")
            .data(ECVData)
            .join("rect")
            .transition()
            .duration(2000)
            .attr("id", d => d.State)
            .attr("x", d =>{
                if(view >=2){ // for the deviation charts    
                    let zeroValue = xScale(0)
                    if(d.ECVPM_Deviation > 0){
                        return zeroValue
                    }
                    else {
                        return xScale(d.ECVPM_Deviation)
                    }
                }
                else { // for the apportionment charts
                    // return xScale(d.ECVPM_ApportionPop)
                    return 0;
                }
            })
            .attr("y", (d, i) => {
                if(view <= 1){
                    return (d.apportionIndex) * (barHeight + barPadding)
                }
                else{
                    if(view == 2){
                        return (d.deviationIndex) * (barHeight + barPadding)
                    }
                    else {
                        return (d.winnerIndex) * (barHeight + barPadding)
                    }
                }
            })
            .attr("width", d => {
                if(view <= 1){ // for the apportionment charts
                    return xScale(d.ECVPM_ApportionPop)
                }
                else { // for the deviation charts
                    return Math.abs(xScale(d.ECVPM_Deviation) - zeroValue)
                }
            })
            .attr("height", barHeight)
            // set fill to blue if Winner = Biden, red if Winner = Trump
            .attr("fill", d => {
                if(view == 0){
                    return ("orange")
                } else{
                    if(d.DPct > d.RPct){
                        // return "#3989CB"  // NYT blue
                        return '#a4a4d6' // Tableau blue
                        // return "#2d98ef"
                    }
                    else {
                        return "#d75c5c" // NYT red
                        // return '#ec1d2c' // Tableau red
                    }
                }
            })
            .attr("stroke", "black")
            .attr("stroke-width", 0)
            

          //////////////////////////////
         /// 6. Draw Peripherals    ////
        //////////////////////////////

        // draw the text labels in the y-axis
        deviationDataArea.selectAll("text")
            .data(ECVData)
            .join("text")
            .transition()
            .duration(2000)
            .attr("x", -20)
            // .attr("y", (d, i) => i * (barHeight + barPadding) + (barHeight / 2) + 4)
            .text(d => d.Abbreviation)
            .attr("font-size", 10)
            .attr("fill", "black")
            .attr("stroke", "none")
            .attr("stroke-width", 0)
            // set anchor to middle
            .attr("text-anchor", "middle")
            .attr("y", (d, i) => { 
                if(view <= 1){
                    return (d.apportionIndex    ) * (barHeight + barPadding) + 8
                }
                else{
                    if(view == 2){
                        return (d.deviationIndex) * (barHeight + barPadding) + 8
                    }
                    else {
                        return (d.winnerIndex) * (barHeight + barPadding) + 8
                    }
                }
            })


        // draw the x-axis
        // create the x-axis 
        /* const xAxis = d3.axisBottom(xScale)
            .tickSize(-dataAreaHeight)
            .tickFormat(d => d)

        // append the x-axis to the svg
        var xAxisGroup =   deviationPerfArea.append("g")
            .attr("id", "xAxisGroup")
            .style("transform", `translate(${perfMargin.left + gapMargin.left}px, ${perfMargin.top + gapMargin.top + dataAreaHeight}px)`)
            .call(xAxis) */
        
        if(!d3.select("#xAxisGroup").empty()){
            d3.select("#xAxisGroup")
            .transition()
            .duration(500)
            .style('opacity', 0)
            .remove()
            .call(updateXAxis)
        }
        else {
            updateXAxis()
        }

        function updateXAxis(){

           // create the x-axis object
            var xAxis = d3.axisBottom(xScale)
                .tickSize(-dataAreaHeight)
                .tickFormat(d => d)
            
            // append the x-axis object to the svg
            var xAxisGroup =   deviationPerfArea.append("g")
                .attr("id", "xAxisGroup")
                .style("transform", `translate(${perfMargin.left + gapMargin.left}px, ${perfMargin.top + gapMargin.top + dataAreaHeight}px)`)
                .transition()
                .duration(2000)
                .call(xAxis)
                .style('opacity', 1)
        }

        // updateXAxis()
        
        d3.selectAll(".tick line").style("stroke", "lightgray")

        // draw the title
        deviationPerfArea.append("text")
            .attr("id", "ECVPMTitle")
            .attr("x", perfMargin.left + gapMargin.left + (dataAreaWidth / 2))
            .attr("y", gapMargin.top)
            .attr("font-family", "Inter")
            .attr("font-weight", 700)
            // set anchor to middle
            .attr("text-anchor", "middle")
            .attr("font-size", 16)
            .text("Electoral College Votes Per Million in Population:")
        
        // draw the subtitle, if necessary
        // view >=2 ? subTitle = 'Deviation from Average' : subTitle = ' '
        if(view >= 2){
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
        else{
            if(!d3.select("#ECVPMsubTitle").empty()){
            }
            else{
            }
            d3.select("#ECVPMsubTitle")
                /* .transition()
                .duration(2000)            */
                .remove()
            
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

        d3.selectAll('div.step.is-active')
            /* .style("font-weight", 100) */
            /* .transition()
            .duration(4000) */
            .style('font-weight', 400)
            // .style("width", "100%")
            /* .style("opacity", 1) // add this line to ensure opacity is set to 1 after the transition
            .style("opacity", "1 !important"); // add this line to make the opacity style take precedence */

        d3.selectAll(".step")
            .filter(function() {
                return !d3.select(this).classed("is-active");
            })
            .style("font-weight", 100);
        

            
          ///////////////////////////////
         /// 7.  Add Interactivity  ////
        ///////////////////////////////

    }
    // drawECVPMChart()
    drawDeviationChart(data2020, 0)

    const button = d3.select("#toggleButton")
    .append("button")
    .text("Toggle View")
    // center the button on the page
    .style("position", "absolute")
    .style("left", "50%")
    /* .style("top", "50%")
    .style("transform", "translate(-50%, -50%)") */

    /* button.node().addEventListener("click", onClick)
    counter = 1
    function onClick() {
        selectedView = counter % 2
        drawDeviationChart(data2020, selectedView)
        counter += 1
    } */

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
        var stepH = Math.floor(window.innerHeight * 1);

        step.style("height", stepH + "px");

        // var figureHeight = window.innerHeight / 2;
        var figureHeight = window.innerHeight;
        // var figureMarginTop = (window.innerHeight - figureHeight) / 2;
        figureMarginTop = 10;

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
            drawDeviationChart(data2020, 0)
        } 
        else{
            if(response.index == 1){
                drawDeviationChart(data2020, 1)
            }
            else{
                if(response.index == 2){
                    drawDeviationChart(data2020, 2)
                }
                else{
                    if(response.index == 3){
                        drawDeviationChart(data2020, 3)
                    }
                }
            }
        }
    }

    function handleStepExit(response) {
       /*  // response = { element, direction, index }
        d3.selectAll(".step")
            .filter(function() {
                return !d3.select(this).classed("is-active");
            })
            .selectAll("p")
            .style("font-weight", 100); */
    }

    function init() {

        // 1. force a resize on load to ensure proper dimensions are sent to scrollama
        handleResize();

        // 2. setup the scroller passing options
        // 		this will also initialize trigger observations
        // 3. bind scrollama event handlers (this can be chained like below)
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
