/**
 * Base class example
 * @abstract
 */
export class baseClass {
    /**
     * Constructor for base class
     */
    constructor() {

    }

    /**
     * Abstract method that must be implemented
     * @abstract
     * @param {string} parameter parameter example 
     */
    myAbstract(parameter) {
        throw new Error("Must implement");
    }
}