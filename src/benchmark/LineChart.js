//
// ***********************************************************************************
//                      IMPORTS
//
// ***********************************************************************************
//

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

//
// ***********************************************************************************
//                      CLASS DEFINITION
//
// ***********************************************************************************
//

class LineChart {

    // Properties
    #svg;           // A reference to the SVG element to draw the chart in.
    #chart;         // A reference to the chart area within the SVG.
    #margin;        // The margins around the chart area.
    #width;         // The width of the chart area.
    #height;        // The height of the chart area.

    #data;          // The data to plot.

    constructor(svg) {

        // Select the SVG element.
        this.#svg = d3.select(`#${svg.attr("id")}`);

        let CHART_WIDTH = svg.width();
        let CHART_HEIGHT = svg.height();
        this.#margin = { top: 20, right: 20, bottom: 20, left: 30 };
        this.#width = CHART_WIDTH - this.#margin.left - this.#margin.right;
        this.#height = CHART_HEIGHT - this.#margin.top - this.#margin.bottom;

        // Initialize the data array.
        this.#data = [];

        // Initialize the chart.
        this.#initializeChart();
    }

    #initializeChart() {

        // Create the scales.
        this.xScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, this.#width]);
        this.yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([this.#height, 0]);

        // Create the chart area.
        this.#chart = this.#svg.append("g")
            .attr("transform", `translate(${this.#margin.left},${this.#margin.top})`);

        console.log(`LineChart initialized with width: ${this.#width} and height: ${this.#height}`);

        // X Axis.
        this.#chart.append("g")
            .attr("transform", `translate(0, ${this.#height})`)
            .classed("axis-group", true)
            .call(d3.axisBottom(this.xScale));

        // Y Axis.
        this.#chart.append("g")
            .classed("axis-group", true)
            .call(d3.axisLeft(this.yScale));
    }

//
// ***********************************************************************************
//                      METHODS
//
// ***********************************************************************************
//

    addResult(nodes, time) {

        // Add the new data point to the data array.
        this.#data.push({ nodes: nodes, time: time });

        // Bind the data points.
        this.#chart.selectAll(".data-point")
            .data(this.#data, d => d)
            .join(
                enter => enter.append("circle")
                    .classed("data-point", true)
                    .attr("r", 3)
                    .attr("cx", d => this.xScale(d.nodes))
                    .attr("cy", d => this.yScale(d.time))
                    .attr("fill", "steelblue")
            );

        // Update the scales.
        this.#rescale();
    }

    clear() {
        this.#data = [];
        this.#chart.selectAll(".data-point").remove();
        this.#rescale();
    }

//
// ***********************************************************************************
//                      HELPER FUNCTIONS
//
// ***********************************************************************************
//

    #rescale() {

        // Clear the existing axes and labels.
        this.#chart.selectAll(".axis-group").remove();

        // Update the scales.
        this.xScale.domain([0, d3.max(this.#data, d => d.nodes)]);
        this.yScale.domain([0, d3.max(this.#data, d => d.time)]);

        // Update the point locations.
        this.#chart.selectAll(".data-point")
            .attr("cx", d => this.xScale(d.nodes))
            .attr("cy", d => this.yScale(d.time));

        // X Axis.
        this.#chart.append("g")
            .attr("transform", `translate(0, ${this.#height})`)
            .classed("axis-group", true)
            .call(d3.axisBottom(this.xScale));

        // Y Axis.
        this.#chart.append("g")
            .classed("axis-group", true)
            .call(d3.axisLeft(this.yScale));
    }
}

export { LineChart };