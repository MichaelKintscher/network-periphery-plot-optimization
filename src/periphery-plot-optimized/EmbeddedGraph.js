//
// ***********************************************************************************
//                      IMPORTS
//
// ***********************************************************************************
//

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

//
// ***********************************************************************************
//                      CLASS DEFINITION
//
// ***********************************************************************************
//

/**
 * This is an acceleration data structure that represents a graph embedded in the plane.
 */
class EmbeddedGraph {

    // Properties
    nodeMap;        // This is a hash map that maps node IDs to their corresponding node objects.
    delaunay;       // This is the Delaunay triangulation of the graph's nodes, which serves as an acceleration structure for geometric queries.
    delaunayToNodeMap;  // This is a hash map that maps Delaunay indices to their corresponding node IDs.
    nodeToDelaunayMap;  // This is a hash map that maps node IDs to their corresponding Delaunay indices.

    constructor(edgeList) {

        // Initialize the node and Delaunay ID maps.
        this.nodeMap = new Map();
        this.delaunayToNodeMap = new Map();
        this.nodeToDelaunayMap = new Map();

        // Rebuild the acceleration structure.
        this.rebuild(edgeList);
    }

//
// ***********************************************************************************
//                      METHODS
//
// ***********************************************************************************
//

    rebuild(edgeList) {

        // Initialize the flat array for input to the Delaunay triangulation.
        let points = [];

        // Build the adjacency list.
        // This is a hash map that maps node IDs to their adjacency lists.
        this.nodeMap.clear();
        edgeList.forEach(edge => {

            // Reference the edge's source and target nodes.
            let sourceId = edge.source;
            let targetId = edge.target;

            // Reference the edge's source and target nodes' coordinates, and convert them to numbers.
            let sourceX = +edge.sourceX;
            let sourceY = +edge.sourceY;
            let targetX = +edge.targetX;
            let targetY = +edge.targetY;

            // If the map does not already contain the node, map the node by its ID.
            if (!this.nodeMap.has(sourceId)) {
                this.nodeMap.set(sourceId, new Node(sourceId, sourceX, sourceY));

                // Add the source node's coordinates to the flat array for input to the Delaunay triangulation.
                points.push(sourceX, sourceY);

                // Map the Delaunay index to the node ID and vice versa.
                let delaunayIndex = (points.length / 2) - 1;
                this.delaunayToNodeMap.set(delaunayIndex, sourceId);
                this.nodeToDelaunayMap.set(sourceId, delaunayIndex);

            }

            // Add the edge to the node's adjacency list.
            this.nodeMap.get(sourceId).topoAdjacencyList.push(targetId);

            // For an undirected graph, also add the edge to the target node's adjacency list.
            if (!this.nodeMap.has(targetId)) {
                this.nodeMap.set(targetId, new Node(targetId, targetX, targetY));

                // Add the target node's coordinates to the flat array for input to the Delaunay triangulation.
                points.push(targetX, targetY);

                // Map the Delaunay index to the node ID and vice versa.
                let delaunayIndex = (points.length / 2) - 1;
                this.delaunayToNodeMap.set(delaunayIndex, targetId);
                this.nodeToDelaunayMap.set(targetId, delaunayIndex);
            }
            this.nodeMap.get(targetId).topoAdjacencyList.push(sourceId);
        });

        // Build the Delaunay triangulation from the flat array of points.
        this.delaunay = new d3.Delaunay(points);
    }

}

//
// ***********************************************************************************
//                      SUPPORTING CLASS DEFINITION
//
// ***********************************************************************************
//

class Node {

    // Properties
    id;     // The node's unique identifier.
    x;      // The node's x-coordinate in the plane.
    y;      // The node's y-coordinate in the plane.
    topoAdjacencyList;  // The node's topological adjacency list.
    geoAdjacencyList;   // The node's geometric adjacency list.

    constructor(id, x, y, topoAdjacencyList = [], geoAdjacencyList = []) {

        this.id = id;
        this.x = x;
        this.y = y;
        this.topoAdjacencyList = topoAdjacencyList;
        this.geoAdjacencyList = geoAdjacencyList;
    }
}

export { EmbeddedGraph };