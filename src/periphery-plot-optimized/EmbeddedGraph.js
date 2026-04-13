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
    nodeMap;

    constructor(edgeList) {

        // Initialize the node map.
        this.nodeMap = new Map();

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

        // Build the adjacency list.
        // This is a hash map that maps node IDs to their adjacency lists.
        this.nodeMap.clear();
        edgeList.forEach(edge => {

            // Reference the edge's source and target nodes.
            let sourceId = edge.source;
            let targetId = edge.target;

            // Reference the edge's source and target nodes' coordinates.
            let sourceX = edge.sourceX;
            let sourceY = edge.sourceY;
            let targetX = edge.targetX;
            let targetY = edge.targetY;

            // If the map does not already contain the node, map the node by its ID.
            if (!this.nodeMap.has(sourceId)) {
                this.nodeMap.set(sourceId, new Node(sourceId, sourceX, sourceY));
            }

            // Add the edge to the node's adjacency list.
            this.nodeMap.get(sourceId).topoAdjacencyList.push(targetId);

            // For an undirected graph, also add the edge to the target node's adjacency list.
            if (!this.nodeMap.has(targetId)) {
                this.nodeMap.set(targetId, new Node(targetId, targetX, targetY));
            }
            this.nodeMap.get(targetId).topoAdjacencyList.push(sourceId);

        });
    }

}

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