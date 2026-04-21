//
// ***********************************************************************************
//                      IMPORTS
//
// ***********************************************************************************
//

import { NetworkView } from "../common/NetworkView.js";
import { LineChart } from "./LineChart.js";

//
// ***********************************************************************************
//                      CLASS DEFINITION
//
// ***********************************************************************************
//

class Benchmark {

    // Constants
    static STORAGE_KEY = "benchmark_results";
    static LOG_HEADER = "Iterations,Time (ms),Nodes,Edges,Visible Nodes,Intersections,Viewport X, Viewport Y, Viewport Scale\n";

    // Properties
    #networkView;   // A reference to the network view to benchmark.
    #resultsSvg;    // A reference to the SVG element to display results.
    #lineChart;     // A reference to the line chart for displaying results.

    constructor(networkView, resultsSvg = null) {
        this.#networkView = networkView;
        this.#resultsSvg = resultsSvg;

        // Initialize the results chart.
        if (this.#resultsSvg) {
            this.#lineChart = new LineChart(this.#resultsSvg);
        }
    }

//
// ***********************************************************************************
//                      METHODS
//
// ***********************************************************************************
//

    run(iterations) {

        // Run the benchmark for the specified number of iterations.
        let results;
        let startTime = Date.now();
        for (let i = 0; i < iterations; i++) {
            results = this.#networkView.getIntersections();
        }

        let endTime = Date.now() - startTime;
        console.log(`Benchmark completed in ${endTime} ms for ${iterations} iterations.\nAverage time per iteration: ${endTime / iterations} ms.\nIntersections found: ${results.intersections.length}`);

        // Get the nodes in view.
        if (!results.inView) {
            results.inView = this.#networkView.getNodesInView();
            console.log(`Found ${results.inView.size} nodes in view.`);
        }

        // Add the data point to the line chart.
        if (this.#lineChart) {
            this.#lineChart.addResult(results.inView.size, endTime / iterations);
        }

        // Get the current viewport transform.
        let viewportTransform = this.#networkView.getViewportTransform("data");

        // Store the results in local storage.
        let storedResults = JSON.parse(localStorage.getItem(Benchmark.STORAGE_KEY)) || [];
        storedResults.push(new BenchmarkResult(
            iterations,
            endTime,
            this.#networkView.getNodeCount(),
            this.#networkView.getEdgeCount(),
            results.inView.size,
            results.intersections.length,
            viewportTransform.x,
            viewportTransform.y,
            viewportTransform.k
        ));
        localStorage.setItem(Benchmark.STORAGE_KEY, JSON.stringify(storedResults));

        return endTime;
    }

    exportResults() {

        // Retrieve the results from local storage.
        let storedResults = JSON.parse(localStorage.getItem(Benchmark.STORAGE_KEY)) || [];
        if (storedResults.length === 0) {
            console.warn("No benchmark results to export.");
            return "";
        }

        // Build the log data string.
        let logDataString = Benchmark.LOG_HEADER;
        storedResults.forEach(result => {
            logDataString += `${result.iterations},${result.time},${result.nodes},${result.edges},${result.visibleNodes},${result.intersections},${result.viewportX},${result.viewportY},${result.viewportScale}\n`;
        });

        // URL encode the log data string and append it to the download url.
        logDataString = logDataString.replaceAll("#", "%23");
        var downloadUri = encodeURI(`data:text/csv;charset=utf-8,${logDataString}`);

        return downloadUri;
    }

    clearResults() {

        // Clear the results from local storage and the line chart.
        localStorage.removeItem(Benchmark.STORAGE_KEY);

        if (this.#lineChart) {
            this.#lineChart.clear();
        }
    }
}

//
// ***********************************************************************************
//                      SUPPORTING CLASS DEFINITION
//
// ***********************************************************************************
//

class BenchmarkResult {

    // Properties
    iterations;     // The number of iterations the benchmark was run for.
    time;           // The total time taken for the benchmark.
    nodes;          // The number of nodes in the network.
    edges;          // The number of edges in the network.
    visibleNodes;   // The number of nodes in the viewport.
    intersections;  // The number of intersections found.
    viewportX;      // The x-coordinate of the viewport.
    viewportY;      // The y-coordinate of the viewport.
    viewportScale;  // The scale of the viewport.

    constructor(iterations, time, nodes, edges, visibleNodes, intersections, viewportX, viewportY, viewportScale) {
        this.iterations = iterations;
        this.time = time;
        this.nodes = nodes;
        this.edges = edges;
        this.visibleNodes = visibleNodes;
        this.intersections = intersections;
        this.viewportX = viewportX;
        this.viewportY = viewportY;
        this.viewportScale = viewportScale;
    }
}

export { Benchmark };