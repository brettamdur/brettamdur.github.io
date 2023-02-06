async function drawCharts() {

    ///////////////////////
    /// 1. Access data  ///
    ///////////////////////

    // load rData2016 data, converting numeric columns to numbers
    let data2016 = await d3.csv("./data/rData2016.csv")

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

    function drawECVPMChart(){
        
        /////////////////////////////
        /// 2. Chart Dimensions  ///
        ///////////////////////////

        // set the dimensions of the svg
        svgWidth = 600
        svgHeight = 700 

        // set the dimensions of the chart area within the svg. This is where the chart will be drawn.
        const gapMargin = {top: 10, right: 0, bottom: 30, left: 10}
        const perfMargin = {top: 18, right: 0, bottom: 20, left: 100}
        const perfAreaWidth = svgWidth - gapMargin.left - gapMargin.right
        const perfAreaHeight = svgHeight - gapMargin.top - gapMargin.bottom
        const dataAreaWidth = perfAreaWidth - perfMargin.left - perfMargin.right
        const dataAreaHeight = perfAreaHeight - perfMargin.top - perfMargin.bottom

        /////////////////////////////
        /// 3. Draw Canvas       ///
        ///////////////////////////

        const ECVPM_svg = d3.select("#ECVPM")
            .append("svg")
            .attr("id", "ECVPM_svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)

        const ECVPMPerfArea = ECVPM_svg.append("g")
            .attr("id", "ECVPMPerfArea")
            .style("transform", `translate(${gapMargin.left}px, ${gapMargin.top}px)`)
            
        const ECVPMDataArea = ECVPMPerfArea.append("g")
            .attr("id", "ECVPMDataArea")
            .style("transform", `translate(${perfMargin.left + gapMargin.left}px, ${perfMargin.top + gapMargin.top}px)`)

          //////////////////////////////
         /// 4. Create Scales      ////
        //////////////////////////////

        const xScale = d3.scaleLinear()
            .domain(d3.extent(data2016, d => d.ECVPM_ApportionPop))
            .range([0, dataAreaWidth])
            .nice()

          //////////////////////////////
         /// 5. Draw Chart         ////
        /////////////////////////////

        // sort data2016 by ECVPM_ApportionPop
        data2016.sort((a, b) => d3.descending(a.ECVPM_ApportionPop, b.ECVPM_ApportionPop))

        // draw the rects for ECVPM_ApportionPop
        const barPadding = 2
        const barHeight = (dataAreaHeight / data2016.length) - barPadding
        ECVPMDataArea.selectAll("rect")
            .data(data2016)
            .join("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * (barHeight + barPadding))
            .attr("width", d => xScale(d.ECVPM_ApportionPop))
            .attr("height", barHeight)
            .attr("fill", "orange")
            .attr("stroke", "black")
            .attr("stroke-width", 0)

        // draw the text labels for each bar
        ECVPMDataArea.selectAll("text")
            .data(data2016)
            .join("text")
            .attr("x", -20)
            .attr("y", (d, i) => i * (barHeight + barPadding) + (barHeight / 2) + 4)
            .text(d => d.Abbreviation)
            .attr("font-size", 10)
            .attr("fill", "black")
            .attr("stroke", "none")
            .attr("stroke-width", 0)
            // set anchor to middle
            .attr("text-anchor", "middle")

          //////////////////////////////
         /// 5. Draw Periferals    ////
        //////////////////////////////

        // draw the x-axis
        const xAxis = d3.axisBottom(xScale)
            .ticks(5)
            .tickSize(-dataAreaHeight)
            .tickFormat(d => d)
        ECVPMPerfArea.append("g")
            .attr("id", "xAxis")
            .style("transform", `translate(${perfMargin.left + gapMargin.left}px, ${perfMargin.top + gapMargin.top + dataAreaHeight}px)`)
            .call(xAxis)
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line").attr("stroke", "lightgrey"))
            .call(g => g.selectAll(".tick text").attr("font-size", 10))

        // draw the title
        ECVPMPerfArea.append("text")
            .attr("id", "ECVPMTitle")
            .attr("x", perfMargin.left + gapMargin.left + (dataAreaWidth / 2))
            .attr("y", gapMargin.top)
            .attr("font-family", "Inter")
            .attr("font-weight", 700)
            // set anchor to middle
            .attr("text-anchor", "middle")
            .attr("font-size", 16)
            .text("Electoral College Votes Per Million in Population")

        // draw the x-axis label
        ECVPMPerfArea.append("text")
            .attr("id", "ECVPMLabel")
            .attr("x", perfMargin.left + gapMargin.left + (dataAreaWidth / 2))
            .attr("y", svgHeight - gapMargin.bottom / 2)
            .attr("font-family", "Inter")
            .attr("font-weight", 400)
            // set anchor to middle
            .attr("text-anchor", "middle")
            .attr("font-size", 14)
            .text("Electoral College Votes")
            
          ///////////////////////////////
         /// 6.  Add Interactivity  ////
        ///////////////////////////////
    }

    /////// DEVIATION SVG ///////
    
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

  

    // Note that this function call has to be after the creation of the svg. Otherwise the binding of the new data happens on new svg elements, not the existing ones.
    function drawDeviationChart(ECVData, view){

          //////////////////////////////
         /// 4. Create Scales      ////
        //////////////////////////////

        const xScale = d3.scaleLinear()
            .domain(d3.extent(ECVData, d => d.ECVPM_Deviation))
            .range([0, dataAreaWidth])
            .nice()

        zeroValue = xScale(0);

          //////////////////////////////
         /// 5. Draw Chart         ////
        //////////////////////////////


        // sort ECVData by ECVPM_Deviation

        ECVData = ECVData.sort((a, b) => d3.descending(a.ECVPM_Deviation, b.ECVPM_Deviation))
        if(view == 0){
            ECVData = ECVData.sort((a, b) => d3.descending(a.Winner, b.Winner))
        }

        console.log(ECVData)
        // draw the rects for ECVPM_Deviation
        const barPadding = 2
        const barHeight = (dataAreaHeight / ECVData.length) - barPadding
        rects = deviationDataArea.selectAll("rect")
            .data(ECVData)
            .join("rect")
            .transition()
            .attr("id", d => d.State)
            .attr("x", d =>{
                let zeroValue = xScale(0)
                if(d.ECVPM_Deviation > 0){
                    return zeroValue
                }
                else {
                    return xScale(d.ECVPM_Deviation)
                }
            })
            .attr("width", d => {
                return Math.abs(xScale(d.ECVPM_Deviation) - zeroValue)
            })
            .attr("height", barHeight)
            // set fill to blue if Winner = Biden, red if Winner = Trump
            .attr("fill", d => {
                if(d.DPct > d.RPct){
                    // return "#3989CB"  // NYT blue
                    return '#a4a4d6' // Tableau blue
                    // return "#2d98ef"
                }
                else {
                    return "#d75c5c" // NYT red
                    // return '#ec1d2c' // Tableau red
                }
            })
            .attr("stroke", "black")
            .attr("stroke-width", 0)
            /* .transition()
            .duration(1000) 
            .delay((d, i) => i * 100)
            .ease(d3.easeLinear) */
            .attr("y", (d, i) => i * (barHeight + barPadding))

          //////////////////////////////
         /// 6. Draw Peripherals    ////
        //////////////////////////////

        // draw the text labels in the y-axis
        deviationDataArea.selectAll("text")
            .data(ECVData)
            .join("text")
            .attr("x", -20)
            .attr("y", (d, i) => i * (barHeight + barPadding) + (barHeight / 2) + 4)
            .text(d => d.Abbreviation)
            .attr("font-size", 10)
            .attr("fill", "black")
            .attr("stroke", "none")
            .attr("stroke-width", 0)
            // set anchor to middle
            .attr("text-anchor", "middle")


        // draw the x-axis
        const xAxis = d3.axisBottom(xScale)
            //.ticks(5)
            .tickSize(-dataAreaHeight)
            .tickFormat(d => d)
        deviationPerfArea.append("g")
            .attr("id", "xAxis")
            .style("transform", `translate(${perfMargin.left + gapMargin.left}px, ${perfMargin.top + gapMargin.top + dataAreaHeight}px)`)
            .call(xAxis)
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line").attr("stroke", "lightgrey"))
            .call(g => g.selectAll(".tick text").attr("font-size", 10))

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
        deviationPerfArea.append("text")
            .attr("id", "ECVPMTitle")
            .attr("x", perfMargin.left + gapMargin.left + (dataAreaWidth / 2))
            .attr("y", gapMargin.top + 22)
            .attr("font-family", "Inter")
            .attr("font-weight", 700)
            // set anchor to middle
            .attr("text-anchor", "middle")
            .attr("font-size", 16)
            .text("Deviation from Mean")

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
            
          ///////////////////////////////
         /// 7.  Add Interactivity  ////
        ///////////////////////////////

    }
    drawECVPMChart()
    drawDeviationChart(data2020, 0)

    const button = d3.select("body")
    .append("button")
    .text("Change metric")

    button.node().addEventListener("click", onClick)
    counter = 1
    function onClick() {
        selectedView = counter % 2
        drawDeviationChart(data2020, selectedView)
        counter += 1
    }
}
drawCharts()
