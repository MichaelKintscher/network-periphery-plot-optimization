//
// ***********************************************************************************
//                      IMPORTS
//
// ***********************************************************************************
//

import { NetworkView } from "../common/NetworkView.js";

//
// ***********************************************************************************
//                      CLASS DEFINITION
//
// ***********************************************************************************
//

class Benchmark {

    // Properties
    #networkView;   // A reference to the network view to benchmark.

    constructor(networkView) {
        this.#networkView = networkView;
    }

//
// ***********************************************************************************
//                      METHODS
//
// ***********************************************************************************
//

    run(iterations) {

        // Run the benchmark for the specified number of iterations.
        let intersections;
        let startTime = Date.now();
        for (let i = 0; i < iterations; i++) {
            intersections = this.#networkView.getIntersections();
        }

        let endTime = Date.now() - startTime;
        console.log(`Benchmark completed in ${endTime} ms for ${iterations} iterations.\nAverage time per iteration: ${endTime / iterations} ms.\nIntersections found: ${intersections.length}`);
        return endTime;
    }
}

export { Benchmark };