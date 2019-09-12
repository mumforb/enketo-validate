'use strict';

/**
 * Various utilities.
 *
 * @module utils
 */

/**
 * Parses an Expression to extract all function calls and theirs argument arrays.
 *
 * @static
 * @param {string} expr - The expression to search
 * @param {string} func - The function name to search for
 * @return {Array<Array<string, any>>} The result array, where each result is an array containing the function call and array of arguments.
 */
function parseFunctionFromExpression( expr, func ) {
    let index;
    let result;
    let openBrackets;
    let start;
    let argStart;
    let args;
    const findFunc = new RegExp( `${func}\\s*\\(`, 'g' );
    const results = [];

    if ( !expr || !func ) {
        return results;
    }

    while ( ( result = findFunc.exec( expr ) ) !== null ) {
        openBrackets = 1;
        args = [];
        start = result.index;
        argStart = findFunc.lastIndex;
        index = argStart - 1;
        while ( openBrackets !== 0 && index < expr.length ) {
            index++;
            if ( expr[ index ] === '(' ) {
                openBrackets++;
            } else if ( expr[ index ] === ')' ) {
                openBrackets--;
            } else if ( expr[ index ] === ',' && openBrackets === 1 ) {
                args.push( expr.substring( argStart, index ).trim() );
                argStart = index + 1;
            }
        }
        // add last argument
        if ( argStart < index ) {
            args.push( expr.substring( argStart, index ).trim() );
        }

        // add [ 'function( a ,b)', ['a','b'] ] to result array
        results.push( [ expr.substring( start, index + 1 ), args ] );
    }

    return results;
}

/**
 * @module dom-utils
 */


/**
 * Creates an XPath from a node
 *
 * @param {Element} node - XML node
 * @param {string} [rootNodeName] - Defaults to #document
 * @param {boolean} [includePosition] - Whether or not to include the positions `/path/to/repeat[2]/node`
 * @return {string} XPath
 */
function getXPath( node, rootNodeName = '#document', includePosition = false ) {
    let index;
    const steps = [];
    let position = '';
    if ( !node || node.nodeType !== 1 ) {
        return null;
    }
    const nodeName = node.nodeName;
    let parent = node.parentElement;
    let parentName = parent ? parent.nodeName : null;

    if ( includePosition ) {
        index = getRepeatIndex( node );
        if ( index > 0 ) {
            position = `[${index + 1}]`;
        }
    }

    steps.push( nodeName + position );

    while ( parent && parentName !== rootNodeName && parentName !== '#document' ) {
        if ( includePosition ) {
            index = getRepeatIndex( parent );
            position = ( index > 0 ) ? `[${index + 1}]` : '';
        }
        steps.push( parentName + position );
        parent = parent.parentElement;
        parentName = parent ? parent.nodeName : null;
    }

    return `/${steps.reverse().join( '/' )}`;
}

/**
 * Obtains the index of a repeat instance within its own series.
 *
 * @param {Element} node - XML node
 * @return {number} index
 */
function getRepeatIndex( node ) {
    let index = 0;
    const nodeName = node.nodeName;
    let prevSibling = node.previousSibling;

    while ( prevSibling ) {
        // ignore any sibling text and comment nodes (e.g. whitespace with a newline character)
        if ( prevSibling.nodeName && prevSibling.nodeName === nodeName ) {
            index++;
        }
        prevSibling = prevSibling.previousSibling;
    }

    return index;
}

function addXPathExtensionsOc( XPathJS ) {

    const FUNCTIONS = {
        'comment-status': {

            fn( a ) {
                const curValue = a.toString();
                let status = '';
                let comment;

                if ( curValue ) {
                    try {
                        comment = JSON.parse( curValue );
                        comment.queries = ( Array.isArray( comment.queries ) ) ? comment.queries : [];
                        comment.logs = ( Array.isArray( comment.logs ) ) ? comment.logs : [];
                        if ( typeof comment === 'object' && comment !== null ) {
                            // duplicates _getCurrentStatus() in Dn.js
                            comment.queries.concat( comment.logs ).some( item => {
                                if ( typeof item === 'object' && item !== null && item.status ) {
                                    status = item.status;
                                    return true;
                                }
                                return false;
                            } );
                        }
                    } catch ( e ) {
                        console.error( 'Could not parse JSON from', curValue );
                    }
                }

                return new XPathJS.customXPathFunction.type.StringType( status );
            },

            args: [
                { t: 'string' }
            ],

            ret: 'string'

        }
    };

    Object.keys( FUNCTIONS ).forEach( fnName => {
        XPathJS.customXPathFunction.add( fnName, FUNCTIONS[ fnName ] );
    } );

}

/**
 * @module utils
 *
 * @description Gathers utility functions from third parties.
 */
module.exports = {
    /**
     * @type function
     * @see {@link https://enketo.github.io/enketo-core/module-utils.html#~parseFunctionFromExpression|parseFunctionFromExpression}
     */
    parseFunctionFromExpression,
    /**
     * @type function
     * @see {@link https://github.com/OpenClinica/enketo-xpath-extensions-oc|addXPathExtensionsOc}
     */
    addXPathExtensionsOc,
    getXPath
};
