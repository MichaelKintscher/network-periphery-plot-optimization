//
// ***********************************************************************************
//                      IMPORTS
//
// ***********************************************************************************
//

import { DataManager } from "./common/DataManager.js";
import { NetworkView } from "./common/NetworkView.js";
import { Benchmark } from "./benchmark/Benchmark.js";
import { ViewportTransform } from "./common/ViewportTransform.js";

//
// ***********************************************************************************
//                      CLASS DEFINITION
//
// ***********************************************************************************
//

/**
 * The app controller is responsible for listening for UI events, managing the app
 * state, and synchronizing app components.
 */

class AppController {

    // Constants
    //static FILE_PATH = "./data/graph_lg_19_45.csv";
    static FILE_PATH = "./data/network_1.csv";
    static CHART_WRAPPER_ID = "chart-wrapper";
    static SVG_ID = "network-view";

    static BENCHMARK_RUN_BTN_ID = "benchmark-run-btn";
    static BENCHMARK_ITERATIONS_INPUT_ID = "benchmark-iterations-input";
    static BENCHMARK_ITERATIONS_OUTPUT_ID = "benchmark-iterations-output";

    static CHART_SETTINGS_CARD_ID = "chart-settings-card";
    static EDGES_TOGGLE_ID = "show-edges-switch";
    static DELAUNAY_TOGGLE_ID = "show-delaunay-switch";
    static INTERSECTIONS_TOGGLE_ID = "show-intersections-switch";
    static PERIPHERY_PLOT_TOGGLE_ID = "show-periphery-plot-switch";

    // Properties
    #networkView;       // A reference to the network view.
    #benchmark;          // A reference to the benchmark.

    constructor() {

        // Create the SVG element for the network view.
        $(`#${AppController.CHART_WRAPPER_ID}`).append(`<svg id="${AppController.SVG_ID}" width="800" height="800"></svg>`);

        // Load the data.
        DataManager.load(AppController.FILE_PATH, (data) => {
            this.#onDataLoaded(data);
        });
    }

//
// ***********************************************************************************
//                      EVENT HANDLERS
//
// ***********************************************************************************
//

    #onDataLoaded(data) {

        // Create and initialize the network view.
        this.#networkView = new NetworkView(`#${AppController.SVG_ID}`, data, "optimized");
        this.#networkView.updateViewport(new ViewportTransform({x: 0, y: 0, k: 1}));

        // Create the benchmark.
        this.#benchmark = new Benchmark(this.#networkView);

        // Wire the event handlers.
        $(`#${AppController.BENCHMARK_ITERATIONS_INPUT_ID}`).on("input", () => this.#onBenchmarkIterationsChanged());
        $(`#${AppController.BENCHMARK_RUN_BTN_ID}`).on("click", () => this.#onBenchmarkRunClicked());
        $(`#${AppController.CHART_SETTINGS_CARD_ID} input[type="checkbox"]`).on("change", (event) => this.#onSwitchToggled(event.target.id));

        // Initialize the benchmark iterations output.
        $(`#${AppController.BENCHMARK_ITERATIONS_OUTPUT_ID}`).text($(`#${AppController.BENCHMARK_ITERATIONS_INPUT_ID}`).val());

        // Initialize the chart settings switches.
        $(`#${AppController.EDGES_TOGGLE_ID}`).prop("checked", true);
        this.#networkView.setEdgeVisibility(true);
        $(`#${AppController.INTERSECTIONS_TOGGLE_ID}`).prop("checked", false);
        this.#networkView.setIntersectionVisibility(false);
        $(`#${AppController.DELAUNAY_TOGGLE_ID}`).prop("checked", false);
        this.#networkView.setDelunayVisibility(false);
        $(`#${AppController.PERIPHERY_PLOT_TOGGLE_ID}`).prop("checked", true);
        this.#networkView.setPeripheryPlotVisibility(true);

    }

    #onBenchmarkIterationsChanged() {
        const iterations = $(`#${AppController.BENCHMARK_ITERATIONS_INPUT_ID}`).val();
        $(`#${AppController.BENCHMARK_ITERATIONS_OUTPUT_ID}`).text(iterations);
        //console.log(`Benchmark iterations changed to ${iterations}`);
    }

    #onBenchmarkRunClicked() {
        const iterations = $(`#${AppController.BENCHMARK_ITERATIONS_INPUT_ID}`).val();
        this.#benchmark.run(iterations);
    }

    #onSwitchToggled(switchId) {
        switch (switchId) {
            case AppController.EDGES_TOGGLE_ID:
                this.#networkView.toggleEdges();
                break;
            case AppController.DELAUNAY_TOGGLE_ID:
                this.#networkView.toggleDelaunay();
                break;
            case AppController.INTERSECTIONS_TOGGLE_ID:
                this.#networkView.toggleIntersections();
                break;
            case AppController.PERIPHERY_PLOT_TOGGLE_ID:
                this.#networkView.togglePeripheryPlot();
                break;
        }
        // console.log(`Switch toggled: ${switchId}`);
    }

}

export { AppController };