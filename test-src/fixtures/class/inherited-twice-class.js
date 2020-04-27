/**
 * Inherited class example
 * @extends InheritedClass
 * @extends BaseClass
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