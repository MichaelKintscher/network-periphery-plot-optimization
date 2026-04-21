//
// ***********************************************************************************
//                      IMPORTS
//
// ***********************************************************************************
//

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

//
// ***********************************************************************************
//                      CONSTANTS
//
// ***********************************************************************************
//

// Data Config
const FILE_PATH = "./data/results.csv";
const SVG_WRAPPER_ID = "chart-wrapper";
const X_ATTR = "Visible Nodes";
const Y_ATTR = "time";
const N_ATTR = "Nodes";
const COLOR_ATTR = "Implementation";

// Chart Size
const CHART_WIDTH = 800;
const CHART_HEIGHT = 800;
const margin = { top: 20, right: 20, bottom: 80, left: 120 };
const width = CHART_WIDTH - margin.left - margin.right;
const height = CHART_HEIGHT - margin.top - margin.bottom;

// Data Points
const DATA_POINT_OPACITY = 0.7;
const AVG_POINT_SIZE = 10;
const ADD_JITTER = true;
const JITTER_WIDTH = 10;

// Axis Labels
const FONT_SIZE_AXIS = "25px";
const FONT_SIZE_AXIS_LABEL = "30px";
const X_AXIS_LABEL_OFFSET = 90;
const Y_AXIS_LABEL_OFFSET = 90;

// Trend Lines
const TREND_LINE_OPACITY = 1;
const TREND_LINE_WIDTH = 2.5;
const FONT_SIZE_TREND_LINE_LABEL = "20px";

d3.csv(FILE_PATH).then((data) => {

    // Apply data transformations.
    data = data.map(d => {
        d["Nodes"] = +d["Nodes"];
        d["Edges"] = +d["Edges"];
        d["Visible Nodes"] = +d["Visible Nodes"];
        d["Intersections"] = +d["Intersections"];
        d.time = +d["Time (ms)"] / +d["Iterations"];
        return d;
    }).filter(i => i["Visible Nodes"] <= 100 && i[Y_ATTR] < 0.5);
    console.log(data);
    
    drawTimeComplexity(data);
});

function drawTimeComplexity(data) {

    // Filter the data.
    //data = data.filter(d => d[COLOR_ATTR] == "baseline");

    // Get a reference to the SVG.
    let svg = d3.select(`#${SVG_WRAPPER_ID}`)
        .append("svg")
            .attr("width", CHART_WIDTH)
            .attr("height", CHART_HEIGHT);

    let chartSizes = Array.from(new Set(data.map(d => d[N_ATTR]))).sort();
    console.log(chartSizes);

    // Calculate the averages for the accelerated points.
    //let averages = Object.groupBy(data, (d) => d[N_ATTR]);
    // let averages = data.reduce((vals, d) => {
    //     //
    // }, []);

    let baseData = data.filter(d => d[COLOR_ATTR] == "baseline");

    // Bin by the number of nodes in view.
    let bins = Object.groupBy(
            data.filter(i => i[COLOR_ATTR] == "accelerated"),
            (d) => d[X_ATTR]
        );

    // Reduce to make an overall list by averaging within each bin.
    let accelData = Object.keys(bins).reduce((accum, key) => {

        // Get the average for the list.
        let list = bins[key];
        let subBins = Object.groupBy(
            list,
            (d) => d[N_ATTR]
        );
        //console.log(subBins);

        let subAverages = Object.keys(subBins).reduce((subAccum, subKey) => {

            let subList = subBins[subKey];
            let total = subList.reduce((sum, item) => {
                return sum + item.time
            }, 0);

            subAccum.push({
                "Implementation": "accelerated",
                "Nodes": +subKey,
                "Visible Nodes": +key,
                "time": total / subList.length
            });

            return subAccum;
        }, []);
        
        return accum.concat(subAverages);;
    }, []);
    console.log(accelData);

    // Get the averages for each graph size.
    let accelAverages = chartSizes.map(n => {

        let nData = accelData.filter(d => d["Nodes"] == n);
        return {
            "Implementation": "accelerated",
            "Nodes": n,
            "average": nData.reduce((sum, item) => sum + item.time, 0) / nData.length
        }
    });
    console.log(accelAverages);

    let baseAverages = chartSizes.map(n => {

        let nData = baseData.filter(d => d["Nodes"] == n);
        return {
            "Implementation": "baseline",
            "Nodes": n,
            "average": nData.reduce((sum, item) => sum + item.time, 0) / nData.length
        }
    });
    console.log(baseAverages);

    // Calculate the linear regression for each set of averages.
    let [baseSlope, baseIntercept] = linearRegression(
        baseAverages.map(a => a[N_ATTR]),
        baseAverages.map(a => a.average)
    );
    let baseTrend = {
        name: "Baseline",
        start: baseSlope * 0 + baseIntercept,
        end: baseSlope * 500 + baseIntercept
    };

    let [accelSlope, accelIntercept] = linearRegression(
        accelAverages.map(a => a[N_ATTR]),
        accelAverages.map(a => a.average)
    );
    let accelTrend = {
        name: "accelerated",
        start: accelSlope * 0 + accelIntercept,
        end: accelSlope * 500 + accelIntercept
    };

    // Create the scales.
    // let xScale = d3.scaleBand()
    //     .domain(chartSizes)
    //     .range([0, width]);
    let xScale = d3.scaleLinear()
        .domain([0, 500])
        .range([0, width]);
    let yScale = d3.scaleLinear()
        .domain(d3.extent(data.map(d => d[Y_ATTR])))
        .range([height, 0]);
    let colorScale = d3.scaleOrdinal(d3.schemeAccent)
        .domain(Array.from(
            new Set(data.map(d => d[COLOR_ATTR]))
        ));

    // Create the chart area.
    let chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Axis.
    let xAxis = chart.append("g")
        .attr("transform", `translate(0, ${height})`)
        .classed("axis-group", true)
        .call(d3.axisBottom(xScale).tickValues(chartSizes));
    xAxis.selectAll("text")
        .style("font-size", FONT_SIZE_AXIS);

    // Y Axis.
    let yAxis = chart.append("g")
        .classed("axis-group", true)
        .call(d3.axisLeft(yScale));
    yAxis//.call(g => g.select(".domain").remove()) // remove the vertical bar on the axis
        .call(g => g.selectAll(".tick line").clone() // duplicate the tick marks with the following properties
            .attr("x2", width)
            .attr("stroke-opacity", 0.2));
    yAxis.selectAll("text")
        .style("font-size", FONT_SIZE_AXIS);

    // Axis Labels.
    svg.append("text")
        .attr("transform", `translate(${width / 2 + margin.left},${height + X_AXIS_LABEL_OFFSET})`)
        .style("text-anchor", "middle")
        .style("font-size", FONT_SIZE_AXIS_LABEL)
        .style("font-family", "sans-serif")
        .text("Nodes in Graph (n)");

    svg.append("text")
        .attr("transform", `translate(${margin.left - Y_AXIS_LABEL_OFFSET},${height / 2})rotate(-90)`)
        .style("text-anchor", "middle")
        .style("font-size", FONT_SIZE_AXIS_LABEL)
        .style("font-family", "sans-serif")
        .text("Time (ms)");

    // Bind the data points.
    let basePoints = chart.selectAll(".data-point.baseline")
        .data(baseData, d => d)
        .join(
            enter => enter.append("circle")
                .classed("data-point", true)
                .classed("baseline", true)
                .attr("r", 3)
                //.attr("cx", d => xScale(d[N_ATTR]) + xScale.bandwidth() / 2 + (ADD_JITTER ? Math.random() * JITTER_WIDTH - (JITTER_WIDTH / 2) : 0))
                .attr("cx", d => xScale(d[N_ATTR]) + (ADD_JITTER ? Math.random() * JITTER_WIDTH - (JITTER_WIDTH / 2) : 0))
                .attr("cy", d => yScale(d[Y_ATTR]))
                .attr("fill", d => colorScale(d[COLOR_ATTR]))
                .attr("opacity", DATA_POINT_OPACITY)
        );
    let accelPoints = chart.selectAll(".data-point.accelerated")
        .data(accelData, d => d)
        .join(
            enter => enter.append("circle")
                .classed("data-point", true)
                .classed("accelerated", true)
                .attr("r", 3)
                //.attr("cx", d => xScale(d[N_ATTR]) + xScale.bandwidth() / 2 + (ADD_JITTER ? Math.random() * JITTER_WIDTH - (JITTER_WIDTH / 2) : 0))
                .attr("cx", d => xScale(d[N_ATTR]) + (ADD_JITTER ? Math.random() * JITTER_WIDTH - (JITTER_WIDTH / 2) : 0))
                .attr("cy", d => yScale(d[Y_ATTR]))
                .attr("fill", d => colorScale(d[COLOR_ATTR]))
                .attr("opacity", DATA_POINT_OPACITY)
        );

    // Plot the trend lines.
    let baseTrendPathData = [
        { x: 0, y: baseTrend.start },
        { x: 500, y: baseTrend.end }
    ]
    chart.append("path")
        .datum(baseTrendPathData)
        .attr("class", "trendline")
        .attr("fill", "none")
        .attr("stroke", colorScale("baseline"))
        .attr("opacity", TREND_LINE_OPACITY)
        .attr("stroke-width", TREND_LINE_WIDTH)
        .attr("d", d3.line()
            .x(function (d) { return xScale(d.x); })
            .y(function(d) { return yScale(d.y); }));
    chart.append("text")
        .attr("transform", `translate(${xScale(500) - 180},${yScale(baseTrend.end) + 55})`)
        .style("text-anchor", "end")
        .style("font-size", FONT_SIZE_TREND_LINE_LABEL)
        .style("font-family", "sans-serif")
        .text("Baseline O(n)");
        
    // Plot the trend lines.
    let accelTrendPathData = [
        { x: 0, y: accelTrend.start },
        { x: 500, y: accelTrend.end }
    ]
    chart.append("path")
        .datum(accelTrendPathData)
        .attr("class", "trendline")
        .attr("fill", "none")
        .attr("stroke", colorScale("accelerated"))
        .attr("opacity", TREND_LINE_OPACITY)
        .attr("stroke-width", TREND_LINE_WIDTH)
        .attr("d", d3.line()
            .x(function (d) { return xScale(d.x); })
            .y(function(d) { return yScale(d.y); }));
    chart.append("text")
        .attr("transform", `translate(${xScale(500) - 180},${yScale(accelTrend.end) + 25})`)
        .style("text-anchor", "end")
        .style("font-size", FONT_SIZE_TREND_LINE_LABEL)
        .style("font-family", "sans-serif")
        .text("Accelerated O(1)");

    // Plot the averages.
    let baseAvgPoints = chart.selectAll(".average-point.baseline")
        .data(baseAverages, d => d)
        .join(
            enter => enter.append("circle")
                .classed("average-point", true)
                .classed("baseline", true)
                .attr("r", AVG_POINT_SIZE)
                //.attr("cx", d => xScale(d[N_ATTR]) + xScale.bandwidth() / 2)
                .attr("cx", d => xScale(d[N_ATTR]))
                .attr("cy", d => yScale(d.average))
                .attr("fill", d => colorScale(d[COLOR_ATTR]))
                .style("stroke", "black")
                .style("stroke-width", "1px")
        );

    // Plot the averages.
    let accelAvgPoints = chart.selectAll(".average-point.accelerated")
        .data(accelAverages, d => d)
        .join(
            enter => enter.append("circle")
                .classed("average-point", true)
                .classed("accelerated", true)
                .attr("r", AVG_POINT_SIZE)
                //.attr("cx", d => xScale(d[N_ATTR]) + xScale.bandwidth() / 2)
                .attr("cx", d => xScale(d[N_ATTR]))
                .attr("cy", d => yScale(d.average))
                .attr("fill", d => colorScale(d[COLOR_ATTR]))
                .style("stroke", "black")
                .style("stroke-width", "1px")
        );
}

function drawScatterplot(data) {
    // Get a reference to the SVG.
    let svg = d3.select(`#${SVG_WRAPPER_ID}`)
        .append("svg")
            .attr("width", CHART_WIDTH)
            .attr("height", CHART_HEIGHT);
    
    // Create the scales.
    let xScale = d3.scaleLinear()
        .domain(d3.extent(data.map(d => d[X_ATTR])))
        .range([0, width]);
    let yScale = d3.scaleLinear()
        .domain(d3.extent(data.map(d => d[Y_ATTR])))
        .range([height, 0]);
    let colorScale = d3.scaleOrdinal(d3.schemeAccent)
        .domain(Array.from(
            new Set(data.map(d => d[COLOR_ATTR]))
        ));

    // Create the chart area.
    let chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Axis.
    chart.append("g")
        .attr("transform", `translate(0, ${height})`)
        .classed("axis-group", true)
        .call(d3.axisBottom(xScale));

    // Y Axis.
    chart.append("g")
        .classed("axis-group", true)
        .call(d3.axisLeft(yScale));

    // Bind the data points.
    let points = chart.selectAll(".data-point")
        .data(data, d => d)
        .join(
            enter => enter.append("circle")
                .classed("data-point", true)
                .attr("r", 3)
                .attr("cx", d => xScale(d[X_ATTR]))
                .attr("cy", d => yScale(d[Y_ATTR]))
                .attr("fill", d => colorScale(d[COLOR_ATTR]))
        );
}

// Returns [slope, intercept] for the linear regression of the given companion arrays of X and Y values for data points.
// Ex: point 1 = (xArray[1], yArray[1])
// Taken from this example: https://www.w3schools.com/ai/ai_regressions.asp
function linearRegression(xArray, yArray) {
    // Calculate Sums
    let xSum=0, ySum=0 , xxSum=0, xySum=0;
    let count = xArray.length;

    for (let i = 0, len = count; i < count; i++) {
        xSum += xArray[i];
        ySum += yArray[i];
        xxSum += xArray[i] * xArray[i];
        xySum += xArray[i] * yArray[i];
    }

    // Calculate slope and intercept
    let slope = (count * xySum - xSum * ySum) / (count * xxSum - xSum * xSum);
    let intercept = (ySum / count) - (slope * xSum) / count;

    return [slope, intercept];
}