//
// ***********************************************************************************
//                      IMPORTS
//
// ***********************************************************************************
//

import { ViewportTransform } from "./ViewportTransform.js";

//
// ***********************************************************************************
//                      CLASS DEFINITION
//
// ***********************************************************************************
//

/**
 * Represents the viewstate of the app.
 */
class ViewState {

    // Properties
    transform;

    static contextSize = 1;
    static contextResolution = 12;

    constructor() {

        // Initialize the properties.
        this.transform = new ViewportTransform({ x: 0, y: 0, k: 1 });
    }
}

export { ViewState };