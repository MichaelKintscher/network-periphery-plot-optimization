//
// ***********************************************************************************
//                      IMPORTS
//
// ***********************************************************************************
//

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { ViewControl } from "../common/ViewControl.js";
import { ViewportTransform } from "../common/ViewportTransform.js";
import { NetworkPeripheryPlotBaseline } from "../periphery-plot-baseline/NetworkPeripheryPlotBaseline.js";
import { NetworkPeripheryPlotOptimized } from "../periphery-plot-optimized/NetworkPeripheryPlotOptimized.js";

//
// ***********************************************************************************
//                      CLASS DEFINITION
//
// ***********************************************************************************
//

class NetworkView extends ViewControl {

    // Properties
    useSimulation = false;

    #SOURCE_ATTR = "source";        // The attribute of the dataset containing source nodes.
    #TARGET_ATTR = "target";        // The attribute of the dataset containing target nodes.
    #ID_ATTR = "id";    // The attribute of the dataset mapped to the ID.

    CHART_WIDTH = 800;
    CHART_HEIGHT = 800;
    #margin = { top: 60, right: 60, bottom: 60, left: 60 };
    #width = this.CHART_WIDTH - this.#margin.left - this.#margin.right;
    #height = this.CHART_HEIGHT - this.#margin.top - this.#margin.bottom;
    #dataTransform;

    #svg;
    #chart;

    // Zoom and pan properties.
    #viewportRadius = 200;
    #viewportXScale;
    #viewportYScale;
    #initialXScale;
    #initialYScale;
    #xScale;
    #yScale;
    #zoomBehavior;
    #ignoreZoom;
    #viewportTransform;

    // Network properties.
    #nodeColorScale;
    #simulation;
    #links;
    #nodes;
    #linkData;
    #nodeData;

    #delaunayPath;
    #showDelaunay;

    #peripheryPlotEnabled;
    #peripheryPlotType;
    #peripheryPlot;

    constructor(elementId, data = [], peripheryPlotType) {

        // Call the parent constructor.
        //      The structured clone prevents the original data input from being modified.
        //      See the WARNING in the comments of the #initializeMarkLocations() method on this class.
        let dataCopy = structuredClone(data);
        super(elementId, dataCopy);

        // Scale the data if needed.
        let scalar = this.#width;
        let extent = d3.extent(this.data.reduce((accum, item) => {
            return accum.concat([item["x1"],item["y1"],item["x2"],item["y2"]]);
        }, []));
        this.#dataTransform =d3.scaleLinear()
            .domain(extent)
            .range([0, 1]);
        this.data = this.data.map(d => {
            d["x1"] = this.#dataTransform(d["x1"]) * scalar;
            d["y1"] = this.#dataTransform(d["y1"]) * scalar;
            d["x2"] = this.#dataTransform(d["x2"]) * scalar;
            d["y2"] = this.#dataTransform(d["y2"]) * scalar;
            return d;
        });

        console.log(this.data);

        // Store a reference to the config parameter.
        this.#peripheryPlotType = peripheryPlotType;
        this.#peripheryPlotEnabled = peripheryPlotType != "None";

        // Initialize the chart.
        this.initializeChart();

        // Initialize the periphery plot, if it is enabled.
        let drawCenter = {
            x: this.CHART_WIDTH / 2,
            y: this.CHART_HEIGHT / 2
        };

        switch (this.#peripheryPlotType) {
            case "baseline":
                this.#peripheryPlot = new NetworkPeripheryPlotBaseline(elementId, drawCenter, 200, 300, dataCopy);
                break;
            case "optimized":
                this.#peripheryPlot = new NetworkPeripheryPlotOptimized(elementId, drawCenter, 200, 300, dataCopy);
                break;
            case "None":
                // Nothing to do.
                break;
        }

        // Draw Delaunay triangulation if enabled.
        this.#showDelaunay = false;
        if (this.#peripheryPlotEnabled) {
            let path = this.#peripheryPlot.getDelaunayPath();

            this.#delaunayPath = this.#chart.append("g")
                .classed("delaunay", true)
                .append("path")
                    .attr("d", path)
                    .attr("display", this.#showDelaunay ? "block" : "none")
                    .style("fill", "none")
                    .style("stroke", "#44F")
                    .style("stroke-width", "1px")
                    .style("stroke-opacity", 1);
                
        }
        
        // Draw the chart.
        this.drawChart();
    }

//
// ***********************************************************************************
//                      EVENT HANDLERS
//
// ***********************************************************************************
//

    #onZoomed(event, xScale, yScale) {

        //console.log("zoomed!");
        // Update the scales based on the event.
        this.#xScale = event.transform.rescaleX(xScale);
        this.#yScale = event.transform.rescaleY(yScale);
        this.#viewportXScale = d3.scaleLinear()
            .domain([(this.#width / 2), -(this.#width / 2)]) // Negate the value because the transform is an offset.
            .range(([0, 1]).map(i => i / event.transform.k));
        this.#viewportYScale = d3.scaleLinear()
            .domain([-(this.#height / 2), (this.#height / 2)])//.domain([-(this.#height + (this.#height / 2)), -(this.#height / 2)]) // Negate the value because the transform is an offset.
            .range(([0, 1]).map(i => (i / event.transform.k) + ((event.transform.k - 1) / event.transform.k)));
            // Dont ask why the offset ((event.transform.k - 1) / event.transform.k) works. It just does. Probably something to do with the
            //      inverse of the linear transform (this.#height) in the initialYScale domain definition.

        // Update the link and node locations.
        this.#links
            .attr("x1", d => this.#xScale(d[this.#SOURCE_ATTR].x))
            .attr("y1", d => this.#yScale(d[this.#SOURCE_ATTR].y))
            .attr("x2", d => this.#xScale(d[this.#TARGET_ATTR].x))
            .attr("y2", d => this.#yScale(d[this.#TARGET_ATTR].y));


        this.#nodes
            .attr("cx", d => this.#xScale(d.x))
            .attr("cy", d => this.#yScale(d.y));

        this.#chart.selectAll("circle.ref-test")
            .attr("cx", () => this.#xScale(0))
            .attr("cy", () => this.#yScale(0));

        this.#delaunayPath.attr("transform", `translate(${this.#xScale(0)}, ${this.#yScale(0)}) scale(${event.transform.k}, ${-event.transform.k})`);

        // Create an instance of the new viewport transform.
        let transform = new ViewportTransform({
            x: this.#viewportXScale(event.transform.x), //this.#viewportXScale(this.#xScale.invert(-event.transform.x)),// + this.#xScale.invert((this.#width)), // Negate the value because the transform is an offset.
            y: this.#viewportYScale(event.transform.y), //this.#viewportYScale(this.#yScale.invert(-event.transform.y)),// - this.#yScale.invert((this.#height)), // Negate the value because the transform is an offset.
            k: event.transform.k
        });
        //console.log(`Viewport transform: ${transform.x}, ${transform.y}, k: ${transform.k}`);

        // Update the periphery plot, if it is enabled.
        if (this.#peripheryPlotEnabled) {

            this.#viewportTransform = new ViewportTransform({
                x: (this.#xScale.invert(this.#width / 2) - this.#xScale.invert(0)) - (this.#xScale.invert(0) - this.#xScale.invert(-event.transform.x)),//this.#xScale.invert(event.transform.x),//(this.#width / 2) - event.transform.x,
                y: this.#height + (this.#yScale.invert(this.#height / 2) - this.#yScale.invert(0)) - (this.#yScale.invert(0) - this.#yScale.invert(-event.transform.y)),//this.#yScale.invert(event.transform.y),//event.transform.y,//(this.#height / 2) + event.transform.y,
                k: event.transform.k
            });
            // console.log(`Viewport transform for periphery plot: ${this.#dataTransform.invert(this.#viewportTransform.x / this.#width)}, ${this.#dataTransform.invert(this.#viewportTransform.y / this.#width)}, k: ${this.#viewportTransform.k}`);
            let focusDistance = this.#xScale.invert(this.#viewportRadius) - this.#xScale.invert(0); // The distance is the relative change of the viewport radius, not the absolute mapped value.
            this.#peripheryPlot.setCenterTransform(this.#viewportTransform, focusDistance);
        }
        
        // Raise the viewport changed event.
        if (!this.#ignoreZoom) {
            //console.log("Raising VIEWPORT_CHANGED from SpatialView.");
            //console.log(`event: ${event.transform.x}, ${event.transform.y}, k: ${event.transform.k}`)
            //console.log(`transform: ${transform.x}, ${transform.y}, ${transform.k}`);
            $(this).trigger(ViewControl.VIEWPORT_CHANGED, [transform]);
        }
    }

    #onSimTicked(links, nodes) {

        // Set the position attribute of the links.
        links
            .attr("x1", d => this.#xScale(d[this.#SOURCE_ATTR].x))
            .attr("y1", d => this.#yScale(d[this.#SOURCE_ATTR].y))
            .attr("x2", d => this.#xScale(d[this.#TARGET_ATTR].x))
            .attr("y2", d => this.#yScale(d[this.#TARGET_ATTR].y));

        // Set the position attribute of the nodes.
        nodes
            .attr("cx", d => this.#xScale(d.x))
            .attr("cy", d => this.#yScale(d.y));
    }

//
// ***********************************************************************************
//                      METHODS
//
// ***********************************************************************************
//

    /**
     * Updates the view control's state to match the given viewport transform.
     * @param {ViewportTransform} transform - The viewport transform to update the control to match.
     */
    updateViewport(transform) {
    
            console.log("Updating viewport for SpatialView");
            // Create a d3 transform from the ViewportTransform, then call the zoom behavior to set
            //      the new transform.
            var x = this.#viewportXScale.invert(transform.x); //-this.#xScale(transform.x)// + (this.#width / 2);
            var y = this.#viewportYScale.invert(transform.y); //-this.#yScale(transform.y)// + (this.#height / 2);
            var d3Transform = d3.zoomIdentity.translate(x, y).scale(transform.k);
            console.log(`Updating viewport with transform: ${transform.x}, ${transform.y}, k: ${transform.k}`);
            this.#ignoreZoom = true;
            this.#svg.call(this.#zoomBehavior.transform, d3Transform);
            this.#ignoreZoom = false;
            console.log(transform);
            console.log(`${x},${y}, width: ${this.#width}, height: ${this.#height}, k: ${transform.k}`);
            console.log(d3Transform);
    }

    /**
     * Sets limits on panning and zooming the viewport. Set the min and max zoom to the same number to disable zooming.
     * @param {number} minZoom - The minimum zoom level (most zoomed out).
     * @param {number} maxZoom - The maximum zoom level (most zoomed in).
     * @param {[number,number]} upperLeft - The upper left corner of the viewport bounds. Unknown units. 1 cprresponds to the width or height of the chart.
     * @param {[number,number]} lowerRight - The lower right corner of the viewport bounds. Unknown units. 1 cprresponds to the width or height of the chart.
     */
    setZoomLimits(minZoom, maxZoom, upperLeft, lowerRight) {

        // Update the zoom behaviors.
        this.#zoomBehavior
            .scaleExtent([maxZoom, minZoom])
            .extent([[0, 0], [this.#width, this.#height]])
            .translateExtent([
                [this.#xScale(upperLeft[0] * this.#width), this.#yScale(upperLeft[1] * this.#width)],
                [this.#xScale(lowerRight[0] * this.#width), this.#yScale(lowerRight[1] * this.#width)]
            ]);
        
        console.log(`Viewport constrianed to: [[${this.#xScale(upperLeft[0] * this.#width)},${this.#yScale(upperLeft[1] * this.#width)}], [${this.#xScale(lowerRight[0] * this.#width)},${this.#yScale(lowerRight[1] * this.#width)}]]`);
    }
        
    /**
     * Initializes the chart based on the current data.
     */
    initializeChart() {
    
        // Create the scales.
        this.#initialYScale = d3.scaleLinear()
            .domain([0, this.#height])//d3.extent(this.data.map(d => d[this.#Y_ATTR])))
            .range([this.#height, 0]);
        
        this.#initialXScale = d3.scaleLinear()
            .domain([0, this.#width])//d3.extent(this.data.map(d => d[this.#X_ATTR])))
            .range([0, this.#width]);

        this.#viewportXScale = d3.scaleLinear()
            .domain([(this.#width / 2), -(this.#width / 2)]) // Negate the value because the transform is an offset.
            .range([0, 1]);
        this.#viewportYScale = d3.scaleLinear()
            .domain([-(this.#height / 2), (this.#height / 2)])//.domain([-(this.#height + (this.#height / 2)), -(this.#height / 2)]) // Negate the value because the transform is an offset.
            .range([0, 1]);
        
        // Initialize the zoom scales to the original scales.
        this.#xScale = this.#initialXScale;
        this.#yScale = this.#initialYScale;
                
        // Define the zoom behaviors.
        this.#zoomBehavior = d3.zoom()
            .scaleExtent([0.2, 32])
            .extent([[0, 0], [this.#width, this.#height]])
            .translateExtent([[-Infinity, -Infinity], [Infinity, Infinity]])//([[0, -Infinity], [width, Infinity]])
            .on("zoom", (event) => this.#onZoomed(event, this.#initialXScale, this.#initialYScale));

        // Store a reference to the svg.
        this.#svg = d3.select(`#${this.element.attr("id")}`)
            .attr("width", this.#width + this.#margin.left + this.#margin.right)
            .attr("height", this.#height + this.#margin.top + this.#margin.bottom)
            .call(this.#zoomBehavior);

        // Clear any existing elements from the chart.
        this.#svg.selectAll("*").remove();

        // Add the viewport, with the given margins on the svg.
        this.#chart = this.#svg.append("g")
            .attr("transform", `translate(${this.#margin.left},${this.#margin.top})`)
            .attr("clip-path", "url(#mainClip)");

        // Add the clipping path.
        this.#chart.append("clipPath")
            .attr("id", "mainClip")
            .append("circle")
                .attr("cx", this.#width / 2)
                .attr("cy", this.#height / 2)
                .attr("r", this.#viewportRadius)
                .attr("border", "1px solid black");

        //Create a copy of the data, because the force simulation mutates the data.
        this.#linkData = Array.from(this.data.map(d => d));
        let sourceSet = new Set(this.data.map(d => d[this.#SOURCE_ATTR]));
        let targetSet = new Set(this.data.map(d => d[this.#TARGET_ATTR]));
        this.#nodeData = Array.from(sourceSet.union(targetSet))
            .map(d => {
                return {
                    id: d,
                    group: sourceSet.has(d) ?
                        this.data.find(l => l.source == d).source_group :
                        this.data.find(l => l.target == d).target_group
                };
            });
        console.log("nodes")
        console.log(this.#nodeData);
        console.log("links")
        console.log(this.#linkData);

        
        this.#nodeColorScale = d3.scaleOrdinal(d3.schemeAccent)
            .domain(Array.from( new Set(this.#nodeData.map(n => n.group))));

        if (this.useSimulation) {
            this.#initializeSimulation();
        } else {
            this.#initializeMarkLocations();
        }

        // Add a line for each link.
        this.#links = this.#chart.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll()
            .data(this.#linkData)
                .join("line")
                    .attr("stroke-width", 1);

        // Add a circle for each node.
        this.#nodes = this.#chart.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll()
            .data(this.#nodeData)
                .join("circle")
                    .attr("r", 7)
                    .attr("fill", d => this.#nodeColorScale(d.group))
                    .attr("data-node-id", d => d.id)
                    .on("click", (evt, d) => this.#onPointClicked(d, evt.target));

        // Mark located at 0,0, for coordinate alignment testing.
        // this.#chart.append("circle")
        //     .attr("cx", () => this.#xScale(0))
        //     .attr("cy", () => this.#yScale(0))
        //     .attr("r", 4)
        //     .style("fill", "red")
        //     .style("stroke", "black")
        //     .style("stroke-width", "1px")
        //     .classed("ref-test", true);

        // Add the viewport border.
        this.#chart.append("circle")
            .attr("cx", this.#width / 2)
            .attr("cy", this.#height / 2)
            .attr("r", this.#viewportRadius)
            .style("stroke", "black")
            .style("stroke-width", "3px")
            .style("fill", "none");

        // Add the viewport center.
        this.#chart.append("circle")
            .attr("cx", this.#width / 2)
            .attr("cy", this.#height / 2)
            .attr("r", 2)
            .style("stroke", "black")
            .style("stroke-width", "3px")
            .style("fill", "steelblue");
    }

    /**
     * Draws the chart based on the current data.
     */
    drawChart() {

        // Set the position attribute of the links.
        this.#links
            .attr("x1", d => this.#xScale(d[this.#SOURCE_ATTR].x))
            .attr("y1", d => this.#yScale(d[this.#SOURCE_ATTR].y))
            .attr("x2", d => this.#xScale(d[this.#TARGET_ATTR].x))
            .attr("y2", d => this.#yScale(d[this.#TARGET_ATTR].y));

        // Set the position attribute of the nodes.
        this.#nodes
            .attr("cx", d => this.#xScale(d.x))
            .attr("cy", d => this.#yScale(d.y));
    }

    /**
     * Gets the intersections for the current center transform and focus distance.
     * @returns 
     */
    getIntersections() {
        return this.#peripheryPlot.getIntersections();
    }

    getNodeCount() {
        return this.#nodeData.length;
    }

    getEdgeCount() {
        return this.#linkData.length;
    }

    /**
     * 
     * @param {string} coordinates - The coordinate system to return the transform in. Can be "viewport" or "data".
     *  - "viewport" returns the transform in terms of the viewport coordinates, where (0,0) is the center of the chart.
     *  - "data" returns the transform in terms of the data coordinates for reference with the original data file.
     * @returns 
     */
    getViewportTransform(coordinates = "viewport") {

        switch (coordinates) {
            case "viewport":
                return this.#viewportTransform;
            case "data":
                return new ViewportTransform({
                    x: this.#dataTransform.invert(this.#viewportTransform.x / this.#width),
                    y: this.#dataTransform.invert(this.#viewportTransform.y / this.#width),
                    k: this.#viewportTransform.k
                });
        }

        return;
    }

//
// ***********************************************************************************
//                      VIEW CONFIGURATION METHODS
//
// ***********************************************************************************
//

    setEdgeVisibility(visible) {
        this.#links.style("display", visible ? "block" : "none");
    }

    toggleEdges() {
        this.#links.style("display", function(d) {
            return d3.select(this).style("display") === "none" ? "block" : "none";
        });
    }

    setDelunayVisibility(visible) {
        this.#showDelaunay = visible;
        if (this.#delaunayPath) {
            this.#delaunayPath.style("display", visible ? "block" : "none");
        }
    }

    toggleDelaunay() {
        this.#showDelaunay = !this.#showDelaunay;
        this.setDelunayVisibility(this.#showDelaunay);
    }

    setIntersectionVisibility(visible) {
        if (this.#peripheryPlotEnabled) {
            this.#peripheryPlot.setIntersectionVisibility(visible);
        }
    }

    toggleIntersections() {
        if (this.#peripheryPlotEnabled) {
            this.#peripheryPlot.toggleIntersections();
        }
    }

    setPeripheryPlotVisibility(visible) {
        if (this.#peripheryPlotEnabled) {
            this.#peripheryPlot.setPlotVisibility(visible);
        }
    }

    togglePeripheryPlot() {
        if (this.#peripheryPlotEnabled) {
            this.#peripheryPlot.togglePlotVisibility();
        }
    }
    
//
// ***********************************************************************************
//                      HELPER FUNCTIONS
//
// ***********************************************************************************
//

    #initializeSimulation() {
        // Create the simulation.
        this.#simulation = d3.forceSimulation(this.#nodeData)
            .force("link", d3.forceLink(this.#linkData).id(d => d.id))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(this.#width / 2, this.#height / 2))
            .on("tick", () => this.#onSimTicked(this.#links, this.#nodes));
    }

    #initializeMarkLocations() {

        // This function creates the same data structure that the d3 force simulation does.
        // Map the node locations onto the node data.
        this.#nodeData = this.#nodeData.map(node => {

            // If a link using the node as a source exists, use that.
            let sourceLink = this.data.find(({ source }) => source == node.id);
            if (sourceLink == undefined) {
                // Otherwise use a link with the node as a destination.
                sourceLink = this.data.find(({ target }) => target == node.id);
                node.x = sourceLink.x2;
                node.y = sourceLink.y2;
            }
            else {
                node.x = sourceLink.x1;
                node.y = sourceLink.y1;
            }
            return node;
        });
        //console.log(this.#nodeData);

        // Map the node references onto the link data.
        // WARNING - this modifies the original input data. Beware of using the same input data elsewhere.
        this.#linkData = this.#linkData.map(link => {
            link.source = this.#nodeData.find((({ id }) => id == link.source));
            link.target = this.#nodeData.find((({ id }) => id == link.target));
            return link;
        });

        
        //console.log(this.#linkData);
    }
    
    //
    // ***********************************************************************************
    //                      SELECTION MANAGEMENT
    //
    // ***********************************************************************************
    //
    
        /**
         * Handles when a point in the visualization is clicked.
         * @param {*} item - The item from the dataset bound to the mark that was clicked on.
         * @param {*} element - The HTML elemet of the mark that was clicked on.
         */
        #onPointClicked(item, element) {
            
            // console.log("clicked!");
            // console.log(item);
            // console.log(element);
    
            // Visually update the element.
            this.#chart.selectAll("circle.selected")
                .classed("selected", false)
                .attr("r", 7)
                .style("stroke", d => this.#nodeColorScale(d.group))
                .style("stroke-width", "1px");
    
            let mark = d3.select(element)
                .classed("selected", true)
                .attr("r", 10)
                .style("stroke", "red")
                .style("stroke-width", "5px");
    
            // Update the selected ID and raise the selection changed event.
            this.selectedId = mark.attr("data-node-id");
            $(this).trigger(ViewControl.SELECTION_CHANGED, [this.selectedId]);
        }
}

export { NetworkView };