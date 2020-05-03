/**
 * Inherited class example
 * 
 * Introduction text to build out an example for review.  Then we will following this with a code fragment to
 * verify that the fragment wraps around the class diagram correctly.
 * 
 * ```js
 *    class.prototype['cmd_' + name] = class.prototype[name];
 *    class.prototype[name] = function(...args) { this._validateAPI(name, args); };
 * ```
 * 
 * Wrapup text for more verification of responsive styling on various devices.
 * 
 * @extends InheritedClass
 */
export class InheritedTwiceClass extends InheritedClass{
    /**
     * Constructor for inherited twice class
     * @param {string} extraParameter Extra parameter example
     */
    constructor(extraParameter) {
        super(extraParameter);
    }
}