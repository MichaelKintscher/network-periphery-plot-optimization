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

class ViewControl {
    
    // Properties
    element;        // A reference to the top level HTML element for the view.
    data;           // The data being displayed by the control.
    selectedId;     // The ID of the selected data item.

    // Events
    static VIEWPORT_CHANGED = "viewport_changed";
    static SELECTION_CHANGED = "selection_changed";

    constructor(elementId, data = []) {

        this.element = $(elementId);
        this.data = data;
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

        // Stuff...
    }

    /**
     * Draws the chart based on the current data.
     */
    drawChart() {

        // Stuff...
    }

}

export { ViewControl };