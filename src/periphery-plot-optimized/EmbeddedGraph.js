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

    /**
     * Gets a list of intersections based on the given circle center and radius.
     * @param {number} x 
     * @param {number} y 
     */
    getIntersections(x, y, r) {

        // 1. Find the closest node to the viewport's center.
        let closest = this.findClosestNode(x, y);

        // 2. Do a bread-first search to identify the in-view node set.
        let inView = this.getNodesInView(closest, x, y, r);

        // 3. Create the edge set from the original graph as all edges connecting a node in the node set to a node not in the node set.
        let possibleEdges = this.getEdgeSet(inView);

        // 4. Run intersection testing on the edges in the edge set.
        let intersections = this.getEdgeIntersects(possibleEdges, x, y, r);

        // Return the edge set with the intersections.
        return intersections;
    }

//
// ***********************************************************************************
//                      HELPER FUNCTIONS
//
// ***********************************************************************************
//

    /**
     * Finds the closest node to the given coordinates.
     * @param {number} x - The x coordinate of the point.
     * @param {number} y - The y coordinate of the point.
     */
    findClosestNode(x, y) {
        //
    }

    getNodesInView(closest, x, y, r) {
        //
    }

    /**
     * Gets the list of edges that connect a node in view to a node out of view.
     * @param {Map<string,Node>} inView 
     * @returns 
     */
    getEdgeSet(inView) {

        // Initialize the edge set.
        let edgeSet = [];

        // For each node in view...
        inView.forEach((sourceId, source) => {
            // For each edge connecting to that node...
            source.topoAdjacencyList.forEach(targetId => {

                // Check if the target node is in view.
                if (!inView.has(targetId)) {
                    // If the target node is not in view, add the edge to the edge set.
                    let target = this.nodeMap.get(targetId);
                    this.edgeSet.push(new Edge(source.id, target.id, source.x, source.y, target.x, target.y));
                }
            });
        });

        return edgeSet;

    }

    getEdgeIntersects(edgeSet, cx, cy, r) {
        
        // Add the intersection to each edge in the set...
        return edgeSet.map(edge => {

            // Initialize the intercepts to undefined.
            edge.intX = undefined;
            edge.intY = undefined;
            
            // Plug the parametric equation for the line segment into the equation for the circle
            //      then rearrange as a quadratic equation for "t".
            let a = Math.pow(edge.x1 - edge.x2, 2) + Math.pow(edge.y1 - edge.y2, 2);
            let b = 2 * (edge.x1 - edge.x2) * (edge.x2 - cx) + 2 * (edge.y1 - edge.y2) * (edge.y2 - cy);
            let c = Math.pow(edge.x2 - cx, 2) + Math.pow(edge.y2 - cy, 2) - Math.pow(r, 2);
            let discriminant = Math.pow(b, 2) - 4 * a * c;

            // This condition should not happen.
            // If the discriminant is < 0, the line segment does not intersect.
            if (discriminant < 0) {
                // No intersection.
                return edge;
            }

            // Solve for t with the quadratic equation.
            let t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
            let t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

            // This condition should not happen.
            // The edge is passing through the viewport, but neither node is visible.
            if ((t1 >= 0 && t1 <= 1) && (t2 >= 0 && t2 <= 1)) {
                // Ignore it.
                return edge;
            }

            if (t1 >= 0 && t1 <= 1) {
                // The segment intersects at point t1.
                //      Get x and y by plugging t1 into the parametric line equation.
                edge.intX = t1 * edge.x1 + (1 - t1) * edge.x2;
                edge.intY = t1 * edge.y1 + (1 - t1) * edge.y2;
                return edge;
            }
            if (t2 >= 0 && t2 <= 1) {
                // The segment intersects at point t2.
                //      Get x and y by plugging t2 into the parametric line equation.
                edge.intX = t2 * edge.x1 + (1 - t2) * edge.x2;
                edge.intY = t2 * edge.y1 + (1 - t2) * edge.y2;
                return edge;
            } 

            // Else there is no intersection.
            return edge;
        });

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

class Edge {

    // Properties
    source;     // The ID of the source node.
    target;     // The ID of the target node.
    x1;         // The x coordinate of the source node.
    y1;         // The y coordinate of the source node.
    x2;         // The x coordinate of the target node.
    y2;         // The y coordinate of the target node.

    constructor(source, target, x1, y1, x2, y2) {

        this.source = source;
        this.target = target;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
}

export { EmbeddedGraph };