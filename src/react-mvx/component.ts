/**
 * React components
 */

import * as React from 'react'
import { Record, Store, extendable, mergeProps, mixinRules, tools, Mixable } from 'type-r'
import Link from './Link'
import processSpec, { TypeSpecs } from './define'

const reactMixinRules : any = { // Can't type it precisely because of weird type problem in NestedReact and NestedTypes
    componentWillMount        : 'reverse',
    componentDidMount         : 'reverse',
    componentWillReceiveProps : 'reverse',
    shouldComponentUpdate     : 'some',
    componentWillUpdate       : 'reverse',
    componentDidUpdate        : 'reverse',
    componentWillUnmount      : 'sequence',
    state                     : 'merge',
    store                     : 'merge',
    props                     : 'merge',
    context                   : 'merge',
    childContext              : 'merge',
    getChildContext           : 'mergeSequence'
};

@extendable
@mixinRules( reactMixinRules )
export abstract class Component<P> extends React.Component<P, Record> {
    static state? : TypeSpecs | typeof Record
    static store? : TypeSpecs | typeof Store
    static props? : TypeSpecs
    static autobind? : string
    static context? : TypeSpecs
    static childContext? : TypeSpecs
    static pureRender? : boolean

    private static propTypes: any;
    private static defaultProps: any;
    private static contextTypes : any;
    private static childContextTypes : any;
    
    static extend : ( spec : object ) => Component< any >

    linkAt( key : string ) : Link< any> {
        // Quick and dirty hack to suppres type error - refactor later.
        return (<any>this.state).linkAt( key );
    }

    linkAll( ...keys : string[] ) : { [ key : string ] : Link<any> }
    linkAll(){
        // Quick and dirty hack to suppres type error - refactor later.
        return (<any>this.state).linkAll.apply( this, arguments );
    }

    static define( protoProps, staticProps ){
        var BaseClass          = tools.getBaseClass( this ),
            staticsDefinition = tools.getChangedStatics( this, 'state', 'store', 'props', 'autobind', 'context', 'childContext', 'pureRender' ),
            combinedDefinition = tools.assign( staticsDefinition, protoProps || {} );

        var definition = processSpec( combinedDefinition, this.prototype );

        const { getDefaultProps, propTypes, contextTypes, childContextTypes, ...protoDefinition } = definition;

        if( getDefaultProps ) this.defaultProps = definition.getDefaultProps();
        if( propTypes ) this.propTypes = propTypes;
        if( contextTypes ) this.contextTypes = contextTypes;
        if( childContextTypes ) this.childContextTypes = childContextTypes;

        Mixable.define.call( this, protoDefinition, staticProps );

        return this;
    }

    readonly state : Record
    readonly store? : Store

    assignToState( x, key ){
        this.state.assignFrom({ [ key ] : x });
    }
}

/**
 * ES5 components definition factory
 */
export function createClass( a_spec ){
    // Gather all methods to pin them to `this` later.
    const methods = [];
    for( let key in a_spec ){
        if( a_spec.hasOwnProperty( key ) && typeof a_spec[ key ] === 'function' ){
            methods.push( key );
        }
    }

    const Subclass = Component.extend({
        // Override constructor to autobind all the methods...
        constructor(){
            Component.apply( this.arguments );

            for( let method in methods ){
                this[ method ] = this[ method ].bind( this );
            }
        },
        ...a_spec
    });

    return Subclass;
}