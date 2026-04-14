//
// ***********************************************************************************
//                      IMPORTS
//
// ***********************************************************************************
//

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { ViewportTransform } from "../common/ViewportTransform.js";
import { EmbeddedGraph } from "./EmbeddedGraph.js";

//
// ***********************************************************************************
//                      CLASS DEFINITION
//
// ***********************************************************************************
//

class NetworkPeripheryPlotOptimized {

    // Properties

    // Chart drawing configuration
    #svg;
    #data;
    #innerRadius;
    #outerRadius;
    #drawCenter;

    // Plot parameters
    #focusDistance;
    #contextDistance;
    #centerTransform;

    // Chart drawing
    #arc;
    #distanceScale;

    // Graph data
    #nodes;
    #nodeProperties;
    #embeddedGraph;

    constructor(svgId, drawCenter, innerRadius, outerRadius, data = []) {

        this.#svg = d3.select(`${svgId}`);
        this.#data = data;
        this.#drawCenter = drawCenter;
        this.#innerRadius = innerRadius;
        this.#outerRadius = outerRadius;

        // Initialize the embedded graph acceleration structure.
        let edgeList = this.#data.map(d => {
            return {
                source: d.source.id,
                target: d.target.id,
                sourceX: d.source.x,
                sourceY: d.source.y,
                targetX: d.target.x,
                targetY: d.target.y
            };
        });
        this.#embeddedGraph = new EmbeddedGraph(edgeList);

        // Default the distance to 1 and the center to the identity transform.
        this.#contextDistance = 1;
        this.#centerTransform = new ViewportTransform({ x: 0, y: 0, k: 1 });

        // Initialize the chart.
        this.initializeChart();
    }

//
// ***********************************************************************************
//                      METHODS
//
// ***********************************************************************************
//

    /**
     * Initializes the chart based on the current data.
     */
    initializeChart() {

        // Create the arc generator.
        this.#arc = d3.arc()
            .innerRadius(this.#innerRadius)
            .outerRadius(d => this.#distanceScale(this.#nodeProperties.get(d.target).degree))
            .startAngle(d => d.angle - 0.01)
            .endAngle(d => d.angle + 0.01)
            .padAngle(1.5 / this.#innerRadius)
            .padRadius(this.#innerRadius);

        // Preprocess the graph data for faster use during drawing.
        let sourceSet = new Set(this.#data.map(d => d.source.id));
        let targetSet = new Set(this.#data.map(d => d.target.id));
        this.#nodeProperties = new Map();
        Array.from(sourceSet.union(targetSet))
            .forEach(d => {
                let degree = this.#countNeighbors(d);
                this.#nodeProperties.set(d, {
                    id: d,
                    degree: degree
                });
            });

        console.log(this.#data);
        console.log(this.#nodeProperties);

        // A radial y-scale
        this.#distanceScale = d3.scaleRadial()
            .domain([0, d3.max(Array.from(this.#nodeProperties.values()).map(n => n.degree))])
            .range([this.#innerRadius, this.#outerRadius]);

        // Y Axis (distance).
        this.#svg.append("g")
            .attr("transform", `translate(${this.#drawCenter.x},${this.#drawCenter.y})`)
            .attr("text-anchor", "middle")
            .call(g => g.append("text")
                .attr("y", d => this.#distanceScale(this.#distanceScale.ticks(3).pop()))
                .attr("dy", "1.5em")
                .text("Node Degree"))
            .call(g => g.selectAll("g")
                .data(this.#distanceScale.ticks(3).slice(1))
                .join("g")
                    .attr("fill", "none")
                    // The rings.
                    .call(g => g.append("circle")
                        .attr("stroke", "#000")
                        .attr("stroke-opacity", 0.2)
                        .attr("r", this.#distanceScale))
                    // The number labels on the TOP of the rings.
                    .call(g => g.append("text")
                        .attr("y", d => -this.#distanceScale(d))
                        .attr("dy", "0.35em")
                        .attr("stroke", "#fff")
                        .attr("stroke-width", 5)
                        .text(this.#distanceScale.tickFormat(5, "s"))
                        .clone(true)
                            .attr("fill", "#0009")
                            .attr("stroke", "none"))
                    // The number labels on the BOTTOM of the rings.
                    .call(g => g.append("text")
                        .attr("y", d => this.#distanceScale(d))
                        .attr("dy", "0.35em")
                        .attr("stroke", "#fff")
                        .attr("stroke-width", 5)
                        .text(this.#distanceScale.tickFormat(3, "s"))
                        .clone(true)
                            .attr("fill", "#0009")
                            .attr("stroke", "none")
                    )
            );
    }

    setContextDistance(distance) {

        // Set the context distance then draw the chart.
        this.#contextDistance = distance;
        this.drawChart();
    }

    setCenterTransform(transform, focusDistance) {

        // Set the center transform then draw the chart.
        this.#centerTransform = transform;
        this.#focusDistance = focusDistance;
        this.drawChart();
    }

    /**
     * Draws the chart based on the current data.
     */
    drawChart() {

        // Clear the svg.
        this.#svg.selectAll("g.periphery-plot").remove();
        
        let contextData = this.#embeddedGraph.getIntersections(this.#centerTransform.x, this.#centerTransform.y, this.#focusDistance);
        //console.log(contextData);

        // Add a circle for each intersection.
        let plot = this.#svg.append("g")
            .attr("transform", `translate(${this.#drawCenter.x},${this.#drawCenter.y})`)
            .classed("periphery-plot", true);
        // plot.append("circle")
        //     .attr("cx", 0)
        //     .attr("cy", 0)
        //     .attr("r", this.#outerRadius)
        //     .style("stroke", "#444")
        //     .attr("stroke-opacity", 0.3)
        //     .style("stroke-width", "1px")
        //     .style("fill", "none");
        let intersections = plot
            .selectAll("g.leaf")
            .data(contextData)
            .join("g")
                .classed("leaf", true);
        
        // intersections.append("circle")
        //     .attr("cx", d => (d.x - this.#centerTransform.x) * this.#centerTransform.k)
        //     .attr("cy", d => (-d.y + this.#centerTransform.y) * this.#centerTransform.k)
        //     .attr("r", 4)
        //     .style("fill", "orange")
        //     .style("stroke", "black")
        //     .style("stroke-width", "1px");
        intersections.append("path")
                    .attr("d", this.#arc)
                    .attr("fill", "#99F")
                    .attr("opacity", 0.3);
        intersections.append("circle")
            .attr("transform", d =>
                `rotate(${d.angle * 180 / Math.PI - 90})
                translate(${this.#distanceScale(this.#nodeProperties.get(d.target).degree)},0)`
            )
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", d => 2 * this.#nodeProperties.get(d.target).degree)
            .style("fill", "#44F")
            .attr("opacity", 0.4)
            .style("stroke", "black")
            .style("stroke-width", "1px");
                
        //console.log(`focusCenter: ${this.#centerTransform.x}, drawCenter: ${this.#drawCenter.x}`);

    }
    
//
// ***********************************************************************************
//                      HELPER FUNCTIONS
//
// ***********************************************************************************
//

    #countNeighbors(nodeId) {
        //console.log(nodeId);
        return this.#data.reduce((count, link) => {
            // Add one if the link has the node as a source or target.
            //console.log(`linksource: ${link.source.id}, linktarger: ${link.target.id}, ${link.source.id == nodeId}, ${link.target.id == nodeId}`);
            return link.source.id == nodeId || link.target.id == nodeId ? count + 1 : count;
        }, 0);
    }
}

export { NetworkPeripheryPlotOptimized };