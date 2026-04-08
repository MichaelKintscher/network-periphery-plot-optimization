//
// ***********************************************************************************
//                      IMPORTS
//
// ***********************************************************************************
//

import { AppController } from "./AppController";

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