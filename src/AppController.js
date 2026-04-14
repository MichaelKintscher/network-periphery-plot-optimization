//
// ***********************************************************************************
//                      IMPORTS
//
// ***********************************************************************************
//

import { DataManager } from "./common/DataManager.js";
import { NetworkView } from "./periphery-plot-baseline/NetworkView.js";

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

    // Properties
    #networkView;       // A reference to the network view.

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

        // Create the network view.
        this.#networkView = new NetworkView(`#${AppController.SVG_ID}`, data, "TP");
    }

}

export { AppController };