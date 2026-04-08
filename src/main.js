//
// ***********************************************************************************
//                      IMPORTS
//
// ***********************************************************************************
//

import { AppController } from "./AppController.js";

//
// ***********************************************************************************
//                      DOCUMENT INITIALIZATION
//
// ***********************************************************************************
//

let appController = null;

// Main function runs when the HTML document is loaded.
$(document).ready(function() {

    // Create the app controller.
    appController = new AppController();
});