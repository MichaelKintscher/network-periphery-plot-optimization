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
    static FILE_PATH = "./data/graph_lg_19_45.csv"; //"./data/network_1.csv";
    static CHART_WRAPPER_ID = "chart-wrapper";
    static SVG_ID = "network-view";

    static BENCHMARK_RUN_BTN_ID = "benchmark-run-btn";
    static BENCHMARK_ITERATIONS_INPUT_ID = "benchmark-iterations-input";
    static BENCHMARK_ITERATIONS_OUTPUT_ID = "benchmark-iterations-output";

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

        // Initialise the benchmark iterations output.
        $(`#${AppController.BENCHMARK_ITERATIONS_OUTPUT_ID}`).text($(`#${AppController.BENCHMARK_ITERATIONS_INPUT_ID}`).val());

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

}

export { AppController };