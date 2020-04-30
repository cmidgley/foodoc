/**
 * Inherited class example
 *   
 * @extends BaseClass
 */
export class InheritedClass extends BaseClass {
    /**
     * Constructor for inherited class
     * @param {string} extraParameter Extra parameter example
     */
    constructor(extraParameter) {
        super();
    }

    /**
     * Implementation of abstract method
     * @param {string} parameter parameter example 
     */
    myAbstract(parameter) {
    }

    /**
     * Protected (and overridden) method
     * @param {number} dataIn 
     * @returns number
     * @protected
     */
    returnMethod(dataIn) {
        return dataIn;
    }

    /**
     * Example of how a flowchart works
     * 
     * ```mermaid
     *   graph TD;
     *     A-->B;
     *     A-->C;
     *     B-->D;
     *     C-->D;
     * ```
     * 
     * And another flowchart, inline context:
     * 
     * ```mermaid
     *   graph TD;
     *      A-->B;
     *      B-->A
     * ```
     */
    flowchart() {

    }
}