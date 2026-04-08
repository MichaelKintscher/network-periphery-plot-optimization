/**
 * Represents the (x, y) position and zoom factor (k) of a viewport.
 */
class ViewportTransform {
    x;      // The x value of the transform. Represents the offset along the x axis.
    y;      // The y value of the transform. Represents the offset along the y axis.
    k;      // The zoom factor of the transform. Represents a scalar applied to the transform.

    constructor(transform) {
        this.x = transform.x;
        this.y = transform.y;
        this.k = transform.k;
    }
}

export { ViewportTransform };