const electionPromise = d3.csv('./data/senateRExport10.csv')

electionPromise.then(allElections => {
    
    function generateCharts(start, stop){

        d3.selectAll('svg').remove()
        const startYear = start
        const stopYear = stop

        function yearSet(startYear, stopYear){
            return allElections.filter(election => 
                election.year >= startYear && election.year <= stopYear)        
        }

        var filteredElections = yearSet(startYear, stopYear)
        // hmmm ... I should probably change the state to OK vs excluding the special election
        filteredElections = filteredElections.filter(election => election.state != "OKLAHOMA - SPECIAL")

        // returns an array of all the winnerVSecond values
        allWVS = filteredElections.map(d => d.winnerVSecond)
        // returns an array of two element arrays.  Each inside array is [winnerVSecond, statename] 
        avgWVS = d3.mean(allWVS)
        // putting this here bcse no need to recalculate this (an array of all years in the dataset) for every state:
        const allYears = new Set
        filteredElections.forEach(e => {
            allYears.add(e.year)
        })       


        const electionsByState = d3.group(filteredElections, d => d.state);
        const electionsByYear = d3.group(filteredElections, d => d.year);
        
        
        svgWidth = 210
        svgHeight = 210 

        // set the dimensions of the chart area within the svg. So "width", "height", and all "margin" references, after this, refer to the chart area, not the svg area. 
        var margin = {top: 15, right: 10, bottom: 30, left: 25},
        width = svgWidth - margin.left - margin.right,
        height = svgHeight - margin.top - margin.bottom;

        var avgWVSByState = [];

        
        electionsByState.forEach(state => {
            // each state is an array of objects, where each object is an election.  Note that the element here (the state) is not an object -- it doesn't have a key. It's an array.

            // obviously, the state stuff is calculations within a state, vs allWVS, which is nationwide.
            const stateWVS = state.map(d => d.winnerVSecond)
            // avg below is used for trend line, and for allStatesBarChart
            const avgStateWVS = d3.mean(stateWVS)
            // caclulate % of D wins, for bar color later
            const dWins = state.filter(obj => {
                if(obj.winnerParty == 'DEMOCRAT'){
                    return true;
                }
                return false;
            }).length
            const dWinPct = (dWins / state.length) * 100;
            // yeah, ok, I used "state" as the parameter and "state" as the state name in the data.  Led to "state[0].state" below. Sorry.
            avgWVSByState.push([state[0].state, avgStateWVS, dWinPct])

            yAxisArea = 22;
            stateName = state[0].state // for use later with popup in svg

            
            
            const xScale = d3.scaleLinear()
                            .domain([startYear, stopYear])
                            .range([margin.left + 7, width])
                            
            const yScale = d3.scaleLinear()
                            .domain([0, 90])
                            .range([margin.top + 10, height - margin.bottom])

            // Add a new svg element for this state
            const stateSvg = d3.select("#smallMults")
                .append('svg')
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr("margin-left", margin.left)
                .attr("id", stateName)

            // Add the data points 
            const allCircles = stateSvg.selectAll('circle')
                .data(state)
                .join('circle');

                allCircles.each((d, i, n) => {
                    const elem = d3.select(n[i]);
                    // elem.attr("cx", margin.left + (width /state.length) + (i * 9))
                    elem.attr("cx", xScale(d.year))
                    .attr("cy", yScale(+d.winnerVSecond) + margin.top)
                    .attr("r", 4)
                    .attr("id", "electionCircle")

                    // add the info box for each election / data point
                    .on("click", function(event){
                            electionInfo = d3.select(this.parentNode)
                            infoTextLeftMargin = 6
                            electionInfo.append("rect")
                                .attr("class", "electioninfobox")
                                .attr("x", 0)
                                .attr("y", margin.top + 2)
                                .attr("width", width + margin.left)
                                .attr("height", height)
                                .style("opacity", "80%")
                            // see https://d3-wiki.readthedocs.io/zh_CN/master/Selections/ for good details on "subselections"
                            thisRect = electionInfo.select("rect")
                            if(d.winnerParty == "DEMOCRAT"){
                                thisRect.style("fill", "blue")
                            } else{
                                if(d.winnerParty == "REPUBLICAN"){
                                    thisRect.style("fill", "red")
                                } else{
                                    thisRect.style("fill", "orange")
                                }
                            }
                            electionInfo.append("text")
                                .attr("class", "electioninfotext")
                                .attr("x", infoTextLeftMargin)
                                .attr("y", margin.top + 20)
                                .text("Year: " + d.year)
                            electionInfo.append("text")
                                .attr("class", "electioninfotext")
                                .attr("x", infoTextLeftMargin)
                                .attr("y", margin.top + 34)
                                .text("Winner: " + d.winnerName)
                            electionInfo.append("text")
                                .attr("class", "electioninfotext")
                                .attr("x", infoTextLeftMargin)
                                .attr("y", margin.top + 48)
                                .text("Winner Party: " + d.winnerParty)
                            electionInfo.append("text")
                                .attr("class", "electioninfotext")
                                .attr("x", infoTextLeftMargin)
                                .attr("y", margin.top + 62)
                                .text("2nd Place: " + d.secondPlaceName)
                            electionInfo.append("text")
                                .attr("class", "electioninfotext")
                                .attr("x", infoTextLeftMargin)
                                .attr("y", margin.top + 76)
                                // note first capital letter in "Second" (below).  Whoops.
                                .text("2P Party: " + d.SecondPlaceParty)
                            electionInfo.append("text")
                                .attr("class", "electioninfotext")
                                .attr("x", infoTextLeftMargin)
                                .attr("y", margin.top + 90)
                                .text("Winner % Point Margin: " + d3.format(".2f")(d.winnerVSecond))
                            event.stopPropagation()
                    })

                    d.winnerParty == "DEMOCRAT" ? 
                        elem.attr("fill", "blue") :
                        d.winnerParty == "REPUBLICAN" ? elem.attr("fill", "red") : elem.attr("fill", "orange");

            })

            // Add the state label for each svg
            function lowerAllButFirst(word){
                return word.charAt(0) + word.substring(1).toLowerCase()
            }
            stateSvg.append("text")
                .attr("x", 0)
                .attr("y", 12)
                // I'm sure there's a more elegant way to get the state name (build an array of state names, and then use the i parameter to access the right one?), but this (below) works for now:
                .text(lowerAllButFirst(state[0].state))
                .style('fill', 'black')
                .style('text-anchor', 'start')
                .style('font-size', '15px')
                .style('font-weight', '500') 

            // Add the y axis
            const yAxisGenerator = d3.axisLeft()
                .scale(yScale)
                .tickValues([0,90])            
            // .call is a d3 method that takes a selection as input, and the function you want to run on the selection as an argument.
            const yAxis = stateSvg.append("g")
                .attr("class", "yAxis")
                .style("font-weight", "200")
                //.style("stroke", "lightgray")
                //.attr("text-anchor", "middle")
                //.attr("transform", "rotate(-90)")
                .call(yAxisGenerator)

            // Add the x axis
            const xAxisGenerator = d3.axisBottom()
                .scale(xScale)
                // only include min and max axis labels:
                .tickValues([startYear, stopYear])
                // below turns number into string, somehow
                .tickFormat(d3.format("d"))
            const xAxis = stateSvg.append("g")
                .attr("class", "xAxis")
                .style("font-weight", '100')
                .call(xAxisGenerator)

            // Add the "Year" label
            stateSvg.append("text")
                // shouldn't be hardcoding x and y here.  See note about layout, above.
                .attr("x", 90)
                .attr("y", 176)
                .text("Year")
                .style('fill', 'gray')
                .style('text-anchor', 'start')
                .style('font-size', '12px')
                .style('font-weight', '300') 


            // Add the "Margin" label
            stateSvg.append("text")
                .attr("id", "marginlabel")
                /* .attr("x", 22)
                .attr("y", height / 2) */
                .attr("transform", "translate(12,90) rotate(-90)")
                .attr("text-anchor", "middle")
                .text("% point margin")
                .style('fill', 'gray')
                .style('text-anchor', 'center')
                .style('font-size', '12px')
                .style('font-weight', '300') 

            // Add the nat wvs average line

            const natMarginBox = document.querySelector("#natmargin");
            function updateNatMarginLine(){
                if(natMarginBox.checked){
                    const natAvg = yScale(avgWVS)
                    natMarginLine = stateSvg.append("line")  
                    .attr("id", "natMarginLine")
                    .attr("x1", 22)
                    .attr("y1", natAvg + margin.top)
                    .attr("x2", width)
                    .attr("y2", natAvg + margin.top)
                    .style("stroke-width", "2")
                    .style("stroke", "gray")
                }
                else{
                    d3.select("#natMarginLine").remove()
                }
            }            
            updateNatMarginLine();
            natMarginBox.addEventListener('change', () => {  
                updateNatMarginLine();
            })
 
            // Add the state wvs average line
            const stateMarginBox = document.querySelector("#statemargin")
            function updateStateMarginLine(){
                if(stateMarginBox.checked){
                    stateSvg.append("line")
                    .attr("id", "stateMarginLine")
                    .attr("x1", 22)
                    .attr("y1", yScale(avgStateWVS) + margin.top)
                    .attr("x2", width)
                    .attr("y2", yScale(avgStateWVS) + margin.top)
                    .attr("stroke-dasharray", "4")
                    .style("stroke-width", "2")
                    .style("stroke", "gray")
                }else{
                    d3.select("#stateMarginLine").remove()
                }
            }
            updateStateMarginLine();
            stateMarginBox.addEventListener('change', () => {  
                updateStateMarginLine();
            })
            
            // Add regression lines
            // This was adapted (in some cases heavily) from https://observablehq.com/@hydrosquall/simple-linear-regression-scatterplot-with-d3. Really surprised this takes this much code.
            function addRegressionLine(regSourceData, includedYears, lineType){
                var regYValues = []
                regSourceData.forEach(d => regYValues.push(yScale(d) + margin.top))
                var regXValues = []
                includedYears.forEach(d => regXValues.push(xScale(d)))
                // - regData will be an array of objects representing one state. Each circle in the state is an object in the array. Each object is made up of two values, x and y, representing a circle's scaled coordinates.

                // I'm using the same calculation here for x that we used for cx in the circle.  Pretty ugly way to do it, but I'll leave it for now.  e is the element in regXValues, i is its index value.
                regData = []
                regXValues.forEach((e, i) => regData.push({
                    // x: margin.left + (width /includedYears.length) + (i * 9), 
                    x: e, 
                    y: regYValues[i]
                }))

                linearRegression = ss.linearRegression(regData.map(d => [d.x, d.y]))
                // given any value, ss.linerRegressionLine is function that will use the x and y intercpet values you pass to it to return a new value. 
                linearRegressionLine = ss.linearRegressionLine(linearRegression)
                
                const firstX = regData[0].x;
                const lastX = regData.slice(-1)[0].x;
                const xCoordinates = [firstX, lastX];

                // We pick x and y arbitrarily, just make sure they match d3.line accessors
                regressionPoints = xCoordinates.map(d => ({
                    x: d,                       
                    y: linearRegressionLine(d)
                }));
            

                // - render the line
                const thisLine = stateSvg.append("line")
                .attr("x1", regressionPoints[0].x)
                .attr("y1", regressionPoints[0].y)
                .attr("x2", regressionPoints[1].x)
                .attr("y2", regressionPoints[1].y)
                .style("stroke", "orange")
                .style("stroke-width", "2")

                if(lineType == "stateLine"){
                    thisLine.attr("stroke-dasharray", "4")
                    thisLine.attr("id", "stateTrendLine")
                }
                else{
                    thisLine.attr("id", "natTrendLine")
                }

            }

            const stateYears = state.map(d => d.year)
            const stateTrendBox = document.querySelector("#statetrend")
            function updateStateTrendLine(){
                if(stateTrendBox.checked){
                    addRegressionLine(stateWVS, stateYears, "stateLine")
                } else {
                    d3.select("#stateTrendLine").remove()
                }
            }
            updateStateTrendLine();
            stateTrendBox.addEventListener('change', () => {  
                updateStateTrendLine();
            })
        
            const natTrendBox = document.querySelector("#nattrend")
            function updateNatTrendLine(){
                if(natTrendBox.checked){
                    addRegressionLine(allWVS, Array.from(allYears), "natLine")
                } else{
                    d3.select("#natTrendLine").remove()
                }
            }
            updateNatTrendLine();
            natTrendBox.addEventListener('change', () => {
                updateNatTrendLine();
            })
        })
        
        // remove info boxes on click outside of circle
        // document.querySelector("svg").addEventListener('click', () => {      
        d3.selectAll("svg").on('click', () => { 
            d3.selectAll(".electioninfobox").remove()
            d3.selectAll(".electioninfotext").remove()
        })

        /* *********************** */
        /* BUILD ALLSTATES BAR CHART */
        /* *********************** */

        var barSVGWidth = svgWidth * 3 + 55,
            barSVGHeight = svgHeight * 2,
            barMargin = {top: 20, right: 0, bottom: 20, left: 20},
            barPadding = {top: 60, right: 0, bottom: 60, left: 60},
            marginAreaWidth = barSVGWidth - barMargin.left - barMargin.right,
            marginAreaHeight = barSVGHeight - barMargin.top - barMargin.bottom,
            chartAreaWidth = barSVGWidth - barPadding.left - barPadding.right,
            chartAreaHeight = barSVGHeight - barPadding.top - barPadding.bottom;

        // allWVSForBars = avgWVSByState.map(e => e[1])
        avgWVSByState = avgWVSByState.sort(function(a, b){
            return d3.ascending(a[1], b[1])
        })
        console.log(avgWVSByState)
        yScale = d3.scaleLinear([0, 100], [0, chartAreaHeight])
        xScale = d3.scaleBand()
            .domain(avgWVSByState.map(e => e[0]))
            .range([0, chartAreaWidth])
        xScaleBars = d3.scaleLinear()
            .domain([0, avgWVSByState.length])
            .range([0, chartAreaWidth])

        svgArea = d3.select("#allStatesBarChartArea").append('svg')
            .attr("id", "svgArea") 
            .attr("width", barSVGWidth + 40)
            .attr("height", barSVGHeight)
        chartArea = svgArea
            .append("g")
                .attr("id", "chartArea")
                .attr("transform", 
                    "translate(" + barPadding.left + "," + barPadding.top + ")")
        allBars = chartArea.selectAll('rect')
                .data(avgWVSByState)
                .join('rect')
        
        barWidth = 11;
        extraWidthPerBar = 
            (chartAreaWidth - (barWidth * avgWVSByState.length)) / avgWVSByState.length;

        // for coloring the bars according to gradient:
        const genColor = d3.scaleLinear()
            .domain([0, 50, 100])
            .range(["darkred", "lightgrey", "darkblue"])
        
        // render the bars
        allBars.each((d, i, n) => {
            elem = d3.select(n[i])
                .attr("id", d[0])
                .attr("x", xScaleBars(i) + 7)
                .attr("y", yScale(d[1]))
                .attr("width", barWidth)
                .attr("height", chartAreaHeight - yScale(d[1]))
                // .style("fill", "#FBCC80")
                .style("fill", genColor(d[2]));
        })

        // build y axis
        chartArea.append("g")
            .call(d3.axisLeft(yScale)
                /* .tickFormat(function(d){
                    return d + "%";
                }) */
            );

        rightY = chartArea.append("g")
            .call(d3.axisRight(yScale)
            // .attr("transform", "translate(50, 0)")            
        );

        rightY.attr("transform", "translate(" + (chartAreaWidth + 12) + ", 0)")
            
        // build x axis and labels
        chartArea.append("g")
            .call(d3.axisBottom(xScale))
            .attr("transform", "translate(2" + ',' + chartAreaHeight + ')')
            .selectAll("text")
                .attr("y", 4)
                .attr("x", 9)
                .attr("dy", ".35em")
                .attr("transform", "translate(0, -2) rotate(-90)")
                .style("text-anchor", "start")
                .style("justify-content", "left")
                .style("font-size", "9")
                .style("fill", "white")
                .style("font-weight", 400)
        
        
        // build y axis title
        yPos = (chartAreaHeight / 2) + barPadding.top
        xPos = barPadding.left / 2 
        svgArea.append("text")
            .attr("id", "barYLabel")
            // if you don't transform (below), rotation goes around the origin of the svg.  For a good explanation, see https://stackoverflow.com/questions/11252753/rotate-x-axis-text-in-d3
            .attr("transform", "translate(" + xPos + "," + yPos +") rotate(-90)")
            .attr("text-anchor", "middle")
            .text("Avg. Winner Margin (% point difference)")
            .style('fill', 'gray')
            .style('font-size', '10px')
            .style('font-weight', '400') 

        // build Chart Title
        svgArea.append('text')
            .attr("id", "charttitle")
            .attr("y", 32)
            .text("Average Winner Margin By State for Selected Years: " + startYear + " - " + stopYear)
            .style("font-size", "18")
            .style("font-weight", '600')

        // add a rect for showing legend explaining color of bars:
        // var colorScale = d3.scale.linear()
        //     .domain([0, 50, 100])
        //     .range(["yellow", "green", "orange", "violet"]) 
        
        svgArea.append('text')
            .attr('id', "barColorExplained")
            .attr('x', 60)
            .attr("y", barSVGHeight-31)
            .text('Bar colors indicate % of wins by party.  Deepest blue = 100% Democrat, deepest red = 100%')
            .style("font-size", "14")
            .style("font-weight", '400')
        
            svgArea.append('text')
            .attr('id', "barColorExplained")
            .attr('x', 60)
            .attr("y", barSVGHeight-17)
            .text('Republican, grey = 50% each.')
            .style("font-size", "14")
            .style("font-weight", '400')
        
        /*********************************************/
        /************ ADDED BY COPILOT ***************/
        /*********************************************/
        // build dot chart showing average winner margin by year

        // for each year in electionsbyYear, get the average of winnerVSecond
        const avgWVSByYear = [];
        electionsByYear.forEach((value, key) => {
            const avgWVS = d3.mean(value.map(d => d.winnerVSecond))
            avgWVSByYear.push([key, avgWVS])
        })

        var dotSVGWidth = svgWidth * 3 + 55,
            dotSVGHeight = svgHeight * 2,
            dotMargin = {top: 20, right: 0, bottom: 20, left: 20},
            dotPadding = {top: 60, right: 0, bottom: 60, left: 60},
            marginAreaWidth = dotSVGWidth - dotMargin.left - dotMargin.right,
            marginAreaHeight = dotSVGHeight - dotMargin.top - dotMargin.bottom,
            dotChartAreaWidth = dotSVGWidth - dotPadding.left - dotPadding.right,
            dotChartAreaHeight = dotSVGHeight - dotPadding.top - dotPadding.bottom;
        
        // first, get the data for the dot chart
        avgWVSByYear2 = avgWVSByYear

        // set up the svg area for the dot chart
        svgArea2 = d3.select("#dotChartArea").append('svg')
            .attr("id", "svgArea2")
            .attr("width", dotSVGWidth + 40)
            .attr("height", dotSVGHeight)
        chartArea2 = svgArea2
            .append("g")
                .attr("id", "chartArea2")
                .attr("transform",
                    "translate(" + dotPadding.left + "," + dotPadding.top + ")")
        allDots = chartArea2.selectAll('circle')
                .data(avgWVSByYear)
                .join('circle')
        console.log(allDots)

        // set up the scales for the dot chart
        xScaleDots = d3.scaleLinear()
            .domain([1976, 2022])
            .range([0, dotChartAreaWidth])
        yScaleDots = d3.scaleLinear()   
            .domain([0, 100])
            .range([dotChartAreaHeight, 0])

        // render the dots
        allDots.each((d, i, n) => {
            elem = d3.select(n[i])
                .attr("id", d[0])
                .attr("cx", xScaleDots(d[0]))
                .attr("cy", yScaleDots(d[1]))
                .attr("r", 3)
                .style("fill", "darkblue");
        })        

    }

    // Accept slider input for new year range
    // See https://range-slider.toolcool.org/ for documentation on slider
    const $slider = document.getElementById('slider');
    $slider.addEventListener('click', (evt) => {
        generateCharts($slider.value1, $slider.value2); 
    })

    generateCharts(1976, 2022);    
})






