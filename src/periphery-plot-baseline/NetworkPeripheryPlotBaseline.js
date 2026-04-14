//
// ***********************************************************************************
//                      IMPORTS
//
// ***********************************************************************************
//

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { ViewportTransform } from "../common/ViewportTransform.js";

//
// ***********************************************************************************
//                      CLASS DEFINITION
//
// ***********************************************************************************
//

class NetworkPeripheryPlotBaseline {

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
    
    constructor(svgId, drawCenter, innerRadius, outerRadius, data = []) {

        this.#svg = d3.select(`${svgId}`);
        this.#data = data;
        this.#drawCenter = drawCenter;
        this.#innerRadius = innerRadius;
        this.#outerRadius = outerRadius;

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
            .outerRadius(d => this.#distanceScale(this.#nodeProperties.find(n => n.id == d.outerNode).degree))
            .startAngle(d => d.angle - 0.01)
            .endAngle(d => d.angle + 0.01)
            .padAngle(1.5 / this.#innerRadius)
            .padRadius(this.#innerRadius);

        // Preprocess the graph data for faster use during drawing.
        let sourceSet = new Set(this.#data.map(d => d.source.id));
        let targetSet = new Set(this.#data.map(d => d.target.id));
        this.#nodeProperties = Array.from(sourceSet.union(targetSet))
            .map(d => {
                return {
                    id: d,
                    degree: this.#countNeighbors(d)
                };
            });

        console.log(this.#data);
        console.log(this.#nodeProperties);

        // A radial y-scale
        this.#distanceScale = d3.scaleRadial()
            .domain([0, d3.max(this.#nodeProperties.map(n => n.degree))])
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
        
        let contextData = this.#getViewportIntersections();
        console.log(contextData);

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
                translate(${this.#distanceScale(this.#nodeProperties.find(n => n.id == d.outerNode).degree)},0)`
            )
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", d => 2 * this.#nodeProperties.find(n => n.id == d.outerNode).degree)
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

    /**
     * Calculates the set of intersections between edges and the viewport.
     * Based on: https://math.stackexchange.com/questions/103556/circle-and-line-segment-intersection
     */
    #getViewportIntersections() {
        
        //console.log(this.#data);

        let x = undefined;
        let y = undefined;

        let cx = this.#centerTransform.x;
        let cy = this.#centerTransform.y;
        let r = this.#focusDistance;

        //console.log(`cx: ${cx}, cy: ${cy}, r: ${r}`);

        let intersects = this.#data.map(d => {

            // Plug the parametric equation for the line segment into the equation for the circle
            //      then rearrange as a quadratic equation for "t".
            let a = Math.pow(d.x1 - d.x2, 2) + Math.pow(d.y1 - d.y2, 2);
            let b = 2 * (d.x1 - d.x2) * (d.x2 - cx) + 2 * (d.y1 - d.y2) * (d.y2 - cy);
            let c = Math.pow(d.x2 - cx, 2) + Math.pow(d.y2 - cy, 2) - Math.pow(r, 2);
            let discriminant = Math.pow(b, 2) - 4 * a * c;

            // If the discriminant is < 0, the line segment does not intersect.
            if (discriminant < 0) {
                // No intersection.
                return { x: undefined, y: undefined };
            }

            // Solve for t with the quadratic equation.
            let t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
            let t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

            // The edge is passing through the viewport, but neither node is visible.
            if ((t1 >= 0 && t1 <= 1) && (t2 >= 0 && t2 <= 1)) {
                // Ignore it.
                return { x: undefined, y: undefined };
            }

            if (t1 >= 0 && t1 <= 1) {
                // The segment intersects at point t1.
                //      Get x and y by plugging t1 into the parametric line equation.
                return {
                    x: t1 * d.x1 + (1 - t1) * d.x2,
                    y: t1 * d.y1 + (1 - t1) * d.y2,
                    outerNode: this.#nodeInView(d.source) ? d.target.id : d.source.id,
                    innerNode: this.#nodeInView(d.source) ? d.source.id : d.target.id
                };
            }
            if (t2 >= 0 && t2 <= 1) {
                // The segment intersects at point t2.
                //      Get x and y by plugging t2 into the parametric line equation.
                return {
                    x: t2 * d.x1 + (1 - t2) * d.x2,
                    y: t2 * d.y1 + (1 - t2) * d.y2,
                    outerNode: this.#nodeInView(d.source) ? d.target.id : d.source.id,
                    innerNode: this.#nodeInView(d.source) ? d.source.id : d.target.id
                };
            } 

            // Else there is no intersection.
            return { x: undefined, y: undefined };
        });

        intersects = intersects.filter(i => i.x != undefined && i.y != undefined)
            .map(i => {
                return { ...i, angle: this.#intersectionPointToAngle(i.x, i.y) };
            });
        //console.log(intersects);

        return intersects;
    }

    #intersectionPointToAngle(x, y) {

        let pX = (x - this.#centerTransform.x) * this.#centerTransform.k;
        let pY = (y - this.#centerTransform.y) * this.#centerTransform.k;

        let angle = Math.atan2(pX, pY);
        return angle;
    }

    #nodeInView(node) {
        let pX = (node.x - this.#centerTransform.x);
        let pY = (node.y - this.#centerTransform.y);

        return Math.pow(pX, 2) + Math.pow(pY, 2) < Math.pow(this.#focusDistance, 2);
    }

    #countNeighbors(nodeId) {
        //console.log(nodeId);
        return this.#data.reduce((count, link) => {
            // Add one if the link has the node as a source or target.
            //console.log(`linksource: ${link.source.id}, linktarger: ${link.target.id}, ${link.source.id == nodeId}, ${link.target.id == nodeId}`);
            return link.source.id == nodeId || link.target.id == nodeId ? count + 1 : count;
        }, 0);
    }
}

export { NetworkPeripheryPlotBaseline };