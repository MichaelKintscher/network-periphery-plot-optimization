//
// ***********************************************************************************
//                      IMPORTS
//
// ***********************************************************************************
//

// d3 for the CSV loader.
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

//
// ***********************************************************************************
//                      CLASS DEFINITION
//
// ***********************************************************************************
//

/**
 * The data manager is responsible for loading the requested data from the given file.
 */
class DataManager {
    
    static model; // Cache of the loaded data.

    static load(filePath, callBack) {

        // Load the data.
        d3.csv(filePath).then((data) => {
            DataManager.#onLoaded(data, callBack);
        });
    }

    static #onLoaded(data, callBack) {

        // Cache the loaded data.
        this.model = data;
        
        // Invoke the callback.
        callBack(data);
    }
}

export { DataManager };