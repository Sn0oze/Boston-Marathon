(function () {
    let margin = {top: 20, right: 20, bottom: 40, left: 50};
    let dataOffset = {time:5,year:1};
    let w = 800;
    let h = 500;
    let symbolWidth = 6;
    let strokeWidth = 2;
    let dataSet = {
        men: [{'year': "", 'athlete': "", 'country': "", 'time': "", 'displayTime': ""}],
        women:[{'year': "", 'athlete': "", 'country': "", 'time': "", 'displayTime': ""}]
    };
    let xScale, yScale, xAxis, yAxis, line;
    let formatTime = d3.timeFormat("%Y");
    let parseToYear = d3.timeParse("%Y");

    d3.queue()
        .defer(d3.csv, "bostonMarathonWinnersMen.csv", rowConverter)
        .defer(d3.csv, "bostonMarathonWinnersWomen.csv", rowConverter)
        .await(function(error, winnersMen, winnersWomen) {
        if (error) {
            console.log(error); //Log the error.
        } else {
            dataSet.men = winnersMen;
            dataSet.women = winnersWomen;

            let container = d3.select("#marathonGraphContainer");
            //Read parent with and calculate height
            w = parseInt(container.style("width"));
            h = ~~w *0.75;

            xScale = d3.scaleTime()
                .domain([
                    parseToYear(getMin(dataSet.men,dataSet.women, "year")),
                    parseToYear(getMax(dataSet.men,dataSet.women, "year"))
                ]).range([margin.left, w - margin.right]);

            yScale = d3.scaleLinear()
                .domain([
                    getMin(dataSet.men,dataSet.women, "time"),
                    getMax(dataSet.men,dataSet.women, "time")
                ]).range([h - margin.top - margin.bottom, margin.top]);

            //Define axes
            xAxis = d3.axisBottom()
                .scale(xScale)
                .ticks(6)
                .tickFormat(formatTime);

            //Define Y axis
            yAxis = d3.axisLeft()
                .scale(yScale)
                .ticks(7);
            //Define line generator

            let svg = d3.select("#marathonGraphContainer")
                .append("svg")
                .attr("id", "graphSVG")
                .attr("width", w)
                .attr("height", h);

            // Draw x axis label
            svg.append("text")
                .attr("transform",
                    "translate(" + (w/2) + " ," +
                    (h - margin.bottom/2) + ")")
                .attr("class", "axisLabels")
                .text("Year");

            // text label for the y axis
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0)
                .attr("x",0 - (h- margin.top - margin.bottom) / 2)
                .attr("dy", "1em")
                .attr("class", "axisLabels")
                .text("Time in Minutes");

            //Define clippath to mask trendlines that reach outside of the graph
            svg.append("clipPath")       // define a clip path
                .attr("id", "graph-clip") // give the clipPath an ID
                .append("rect")          // shape it as an ellipse
               // .attr("fill", "grey") debug
                .attr("x", margin.left)         // position the x-centre
                .attr("y", margin.top)         // position the y-centre
                .attr("width", w - margin.right - margin.left)         // set the x radius
                .attr("height", h - (margin.top*2) - margin.bottom);

            //Set resize listener
            //d3.select(window).on("resize." + container.attr("id"), redraw);

            let legend = svg.append("g")
                .attr("class", "legend");
            //Draw legend
            legend.append("rect")
                .attr("x", w - (margin.left*1.5) -(symbolWidth*3))
                .attr("y", margin.top-(symbolWidth*1.5))
                .attr("width", symbolWidth*1.5)
                .attr("height", symbolWidth*1.5)
                .attr("class", "legendMen");
            legend.append("text")
                .attr("x", w - (margin.left*1.5))
                .attr("y", margin.top)
                .text("Men");

            legend.append("circle")
                .attr("cx", w - (2*symbolWidth + strokeWidth + margin.left*1.5))
                .attr("cy", (margin.top*2)-(symbolWidth - strokeWidth))
                .attr("r", symbolWidth*0.75)
                .attr("class", "legendWomen");
            legend.append("text")
                .attr("x", w - (margin.left*1.5))
                .attr("y", margin.top*2)
                .text("Women");

            let trendData = calcTrendData(dataSet.men);
            let trendLineMen = svg.selectAll(".trendLineMen")
                .data(trendData);

            //Draw trendline for men
            trendLineMen.enter()
                .append("line")
                .attr("class", "trendLineMen")
                .attr("x1", function(d) { return xScale(d[0]); })
                .attr("y1", function(d) { return yScale(d[1]); })
                .attr("x2", function(d) { return xScale(d[2]); })
                .attr("y2", function(d) { return yScale(d[3]); });

            let trendDataWomen = calcTrendData(dataSet.women);

            let trendLineWomen = svg.selectAll(".trendLineWomen")
                .data(trendDataWomen);

            //Draw trendline for women
            trendLineWomen.enter()
                .append("line")
                .attr("class", "trendLineWomen")
                .attr("x1", function(d) { return xScale(d[0]); })
                .attr("y1", function(d) { return yScale(d[1]); })
                .attr("x2", function(d) { return xScale(d[2]); })
                .attr("y2", function(d) { return yScale(d[3]); });

            //Define line generator
            line = d3.line()
                .x(function(d){return xScale(parseToYear(d.year));})
                .y(function(d){return yScale(d.time);});

            //Create line men
            svg.append("path")
                .attr("class", "line")
                .attr("d", line(dataSet.men));
            //Create line men
            svg.append("path")
                .attr("class", "line2")
                .attr("d", line(dataSet.women));

            svg.selectAll("dot")
                .data(dataSet.men)
                .enter().append("rect")
                .attr("width", symbolWidth)
                .attr("height", symbolWidth)
                .attr("x", function(d){return xScale(parseToYear(d.year)) - symbolWidth/2;})
                .attr("y", function(d){return yScale(d.time) - symbolWidth/2;})
                .attr("class", "symbolMen")
                .on("mouseover", function(d) {
                    displayTooltip(d, this);
                })
                .on("mouseout", function () {
                    hideTooltip();
                });

            svg.selectAll("dot")
                .data(dataSet.women)
                .enter().append("circle")
                .attr("r", symbolWidth/2)
                .attr("cx", function(d){return xScale(parseToYear(d.year));})
                .attr("cy", function(d){return yScale(d.time);})
                .attr("class", "symbolWomen")
                .on("mouseover", function(d) {
                    displayTooltip(d, this);
                })
                .on("mouseout", function () {
                    hideTooltip();
                });
            //Create axes
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + (h - margin.bottom - margin.top) + ")")
                .call(xAxis);
            svg.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(" + margin.left + ",0)")
                .call(yAxis);
        }
            d3.selectAll("input[name='marathonRadio']")
                .on("change", function() {
                    update(this);
                });
    });
    //TODO refactor into functions to avoid repetition of large code blocks
    function update(elm) {
        let svg = d3.select("#graphSVG");
        let symbols = svg.selectAll("circle");
        switch(elm.value) {
            case "men":
                xScale.domain([
                    d3.min(dataSet.men, function(d){return parseToYear(d.year);}),
                    d3.max(dataSet.men, function(d){return parseToYear(d.year);})
                ]).range([margin.left, w - margin.right]);

                yScale.domain([
                    d3.min(dataSet.men, function(d){return d.time;}),
                    d3.max(dataSet.men, function(d){return d.time;})
                ]).range([h - margin.top - margin.bottom, margin.top]);

                svg = d3.select("#graphSVG");

                //Hide women
                svg.selectAll(".line2").style("display","none");
                svg.selectAll(".trendLineWomen").style("display","none");
                svg.selectAll(".symbolWomen").style("display","none");


                svg.selectAll(".line").style("display","initial");
                svg.selectAll(".trendLineMen").style("display","initial");
                svg.selectAll(".symbolMen").style("display","initial");

                svg.select(".line")   // change the line
                    .transition()
                    .duration(200)
                    .attr("d", line(dataSet.men));

                symbols = svg.selectAll(".symbolMen")
                    .data(dataSet.men);

                svg.selectAll(".trendLineMen")
                    .transition()
                    .duration(200)
                    .attr("x1", function(d) { return xScale(d[0]); })
                    .attr("y1", function(d) { return yScale(d[1]); })
                    .attr("x2", function(d) { return xScale(d[2]); })
                    .attr("y2", function(d) { return yScale(d[3]); });

                symbols
                    .transition()
                    .duration(200)
                    .attr("x", function(d){return xScale(parseToYear(d.year)) - symbolWidth/2;})
                    .attr("y", function(d){return yScale(d.time) - symbolWidth/2;});

                //Create axes
                updateAxis(svg);

                break;
            case "women":
                xScale.domain([
                    d3.min(dataSet.women, function(d){return parseToYear(d.year);}),
                    d3.max(dataSet.women, function(d){return parseToYear(d.year);})
                ]).range([margin.left, w - margin.right]);

                yScale.domain([
                    d3.min(dataSet.women, function(d){return d.time;}),
                    d3.max(dataSet.women, function(d){return d.time;})
                ]).range([h - margin.top - margin.bottom, margin.top]);

                svg = d3.select("#graphSVG");

                //Hide women
                svg.selectAll(".line2").style("display","initial");
                svg.selectAll(".trendLineWomen").style("display","initial");
                svg.selectAll(".symbolWomen").style("display","initial");


                svg.selectAll(".line").style("display","none");
                svg.selectAll(".trendLineMen").style("display","none");
                svg.selectAll(".symbolMen").style("display","none");

                svg.select(".line2")   // change the line
                    .transition()
                    .duration(200)
                    .attr("d", line(dataSet.women));

                symbols = svg.selectAll(".symbolWomen")
                    .data(dataSet.women);

                svg.selectAll(".trendLineWomen")
                    .attr("clip-path", "url(#graph-clip)")
                    .transition()
                    .duration(200)
                    .attr("x1", function(d) { return xScale(d[0]); })
                    .attr("y1", function(d) { return yScale(d[1]); })
                    .attr("x2", function(d) { return xScale(d[2]); })
                    .attr("y2", function(d) { return yScale(d[3]); });

                symbols
                    .transition()
                    .duration(200)
                    .attr("cx", function(d){return xScale(parseToYear(d.year)); })
                    .attr("cy", function(d){return yScale(d.time);});

                //Create axes
                updateAxis(svg);
                break;
            default:
                xScale = d3.scaleTime()
                    .domain([
                        parseToYear(getMin(dataSet.men,dataSet.women, "year")),
                        parseToYear(getMax(dataSet.men,dataSet.women, "year"))
                    ]).range([margin.left, w - margin.right]);

                yScale = d3.scaleLinear()
                    .domain([
                        getMin(dataSet.men,dataSet.women, "time"),
                        getMax(dataSet.men,dataSet.women, "time")
                    ]).range([h - margin.top - margin.bottom, margin.top]);

                //Hide women

                svg = d3.select("#graphSVG");

                svg.selectAll(".line2").style("display","initial");
                svg.selectAll(".trendLineWomen").style("display","initial");
                svg.selectAll(".symbolWomen").style("display","initial");


                svg.selectAll(".line").style("display","initial");
                svg.selectAll(".trendLineMen").style("display","initial");
                svg.selectAll(".symbolMen").style("display","initial");

                svg.select(".line")   // change the line
                    .transition()
                    .duration(200)
                    .attr("d", line(dataSet.men));

                symbols = svg.selectAll(".symbolMen")
                    .data(dataSet.men);

                svg.selectAll(".trendLineMen")
                    .transition()
                    .duration(200)
                    .attr("x1", function(d) { return xScale(d[0]); })
                    .attr("y1", function(d) { return yScale(d[1]); })
                    .attr("x2", function(d) { return xScale(d[2]); })
                    .attr("y2", function(d) { return yScale(d[3]); });

                symbols
                    .transition()
                    .duration(200)
                    .attr("x", function(d){return xScale(parseToYear(d.year)) - symbolWidth/2;})
                    .attr("y", function(d){return yScale(d.time) - symbolWidth/2;});

                svg.select(".line2")   // change the line
                    .transition()
                    .duration(200)
                    .attr("d", line(dataSet.women));

                symbols = svg.selectAll(".symbolWomen")
                    .data(dataSet.women);

                svg.selectAll(".trendLineWomen")
                    .attr("clip-path", "url(#graph-clip)")
                    .transition()
                    .duration(200)
                    .attr("x1", function(d) { return xScale(d[0]); })
                    .attr("y1", function(d) { return yScale(d[1]); })
                    .attr("x2", function(d) { return xScale(d[2]); })
                    .attr("y2", function(d) { return yScale(d[3]); });

                symbols
                    .transition()
                    .duration(200)
                    .attr("cx", function(d){return xScale(parseToYear(d.year)); })
                    .attr("cy", function(d){return yScale(d.time);});

                updateAxis(svg);

        }
    }

    function displayTooltip(d, self) {
        let xPosition = parseFloat(d3.select(self).attr("cx")||d3.select(self).attr("x"));
        let yPosition = parseFloat(d3.select(self).attr("cy")||d3.select(self).attr("y"));
        let tooltip = d3.select("#tooltip");
        //Update the tooltip position and value
        setTooltipText(tooltip, d);
        d3.select("#tooltip")
            .style("left", xPosition + "px")
            .style("top", yPosition + "px");

        //Show the tooltip
        tooltip.classed("hidden", false);
    }
    // Taken from trendLine example
    function calcTrendData(dataSet) {
        let xSeries = dataSet.map(function (d,i) {
            return i+1
        });
        let ySeries = dataSet.map(function(d) { return +d.time; });

        let leastSquaresCoeff = leastSquares(xSeries, ySeries);

        // apply the reults of the least squares regression
        let x1 = parseToYear(dataSet[0].year);
        let y1 = leastSquaresCoeff[0] + leastSquaresCoeff[1];
        let x2 = parseToYear(dataSet[dataSet.length-1].year);
        let y2 = leastSquaresCoeff[0] * xSeries.length + leastSquaresCoeff[1];
        return [[x1,y1,x2,y2]];
    }

    function hideTooltip() {
        d3.select("#tooltip").classed("hidden", true);
    }

    function setTooltipText(selection, d){
        selection
          .select("#name")
          .text(d.athlete);
        selection
            .select("#country")
            .text(d.country);
        selection
            .select("#year")
            .text(d.year);
        selection
            .select("#time")
            .text(d.displayTime + ", " + d.time.toFixed(2));
    }

    function getMin(set1, set2, prop) {
        return Math.min(d3.min(set1, function(d){return +d[prop];}),d3.min(set2, function(d){return +d[prop];}))
    }

    function getMax(set1, set2, prop) {
        return Math.max(d3.max(set1, function(d){return +d[prop];}),d3.max(set2, function(d){return +d[prop];}))
    }

    function updateAxis(svg) {
        xAxis.scale(xScale);
        yAxis.scale(yScale);
        svg.select(".x.axis")
            .transition()
            .duration(200)
            .call(xAxis);

        svg.select(".y.axis")
            .transition()
            .duration(200)
            .call(yAxis);
    }

    function hmsToMinutes(hms) {
        let times = hms.split(':'); // split it at the colons
        return (+times[0])*60 + (+times[1]) + (+times[2]/60);
    }

    function rowConverter(d) {
        return {
            year: d.year,
            athlete: d.athlete,
            country: d.country,
            time: hmsToMinutes(d.time),
            displayTime: d.time

        };
    }

    // Taken from trendLine example
    function leastSquares(xSeries, ySeries) {
        let reduceSumFunc = function(prev, cur) { return prev + cur; };

        let xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
        let yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

        let ssXX = xSeries.map(function(d) { return Math.pow(d - xBar, 2); })
            .reduce(reduceSumFunc);

        let ssYY = ySeries.map(function(d) { return Math.pow(d - yBar, 2); })
            .reduce(reduceSumFunc);

        let ssXY = xSeries.map(function(d, i) { return (d - xBar) * (ySeries[i] - yBar); })
            .reduce(reduceSumFunc);

        let slope = ssXY / ssXX;
        let intercept = yBar - (xBar * slope);
        let rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);

        return [slope, intercept, rSquare];
    }

    function redraw() {
        let container = d3.select("#marathonGraphContainer");
        let svg = d3.select("#graphSVG");
        w = parseInt(container.style("width"));
        h = ~~w*0.75;
        svg.attr("width", w);
        svg.attr("height", h);
    }
})();