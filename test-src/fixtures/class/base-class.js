/**
 * Base class example
 * @abstract
 */
export class BaseClass {
    /**
     * Example class member
     * @member
     */
    memberOne = 1;

    /**
     * Example private class member
     * @member
     * @private
     */
    #privateMemberTwo = 2;

    /**
     * Example private class member with type number
     * @member
     * @protected
     * @type number
     */
    protectedMemberThree = 3;

    /**
     * Constructor for base class
     */
    constructor() {
        /**
         * Example public member declared in constructor
         * @member
         */
        this.publicMemberFour = 2;
    }

    /**
     * Abstract method that must be implemented
     * @abstract
     * @param {string} parameter parameter example 
     */
    myAbstract(parameter) {
        throw new Error("Must implement");
    }

    /**
     * Protected (overridable) method
     * @param {number} dataIn 
     * @returns number
     * @protected
     */
    returnMethod(dataIn) {
        return dataIn;
    }
}