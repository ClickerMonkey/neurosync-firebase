/* rekord-firebase 1.5.6 - A rekord binding to firebase - implementing Rekord.rest & Rekord.live by Philip Diffenderfer */
// UMD (Universal Module Definition)
(function (root, factory)
{
  if (typeof define === 'function' && define.amd) // jshint ignore:line
  {
    // AMD. Register as an anonymous module.
    define(['rekord', 'firebase'], function(Rekord, firebase) { // jshint ignore:line
      return factory(root, Rekord, firebase);
    });
  }
  else if (typeof module === 'object' && module.exports)  // jshint ignore:line
  {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(global, require('rekord'), require('firebase'));  // jshint ignore:line
  }
  else
  {
    // Browser globals (root is window)
    root.Rekord = factory(root, root.Rekord, root.Firebase || root.firebase);
  }
}(this, function(global, Rekord, firebase, undefined)
{

  var isObject = Rekord.isObject;
  var isFunction = Rekord.isFunction;
  var isArray = Rekord.isArray;
  var isString = Rekord.isString;
  var noop = Rekord.noop;

  var Rekord_live = Rekord.live;
  var Rekord_rest = Rekord.rest;


function getKey(snapshot)
{
  return isFunction( snapshot.key ) ? snapshot.key() : snapshot.key;
}

function createOperationCallbackSuccess(success)
{
  return function()
  {
    success( {} );
  };
}

function createOperationCallbackFailure(failure)
{
  return function(error)
  {
    failure( {}, error.code );
  };
}

function createQueryCallbackSuccess(success)
{
  return function(snapshot)
  {
    var data = snapshot.val();
    var models = [];

    for (var key in data)
    {
      var model = data[ key ];

      if ( isObject( model ) )
      {
        models.push( model );
      }
    }

    success( models );
  };
}

function createQueryCallbackFailure(failure)
{
  return function(error)
  {
    failure( [], error.code );
  };
}

function clearUndefined(obj)
{
  for (var prop in obj)
  {
    if ( obj[ prop ] === undefined )
    {
      delete obj[ prop ];
    }
  }
}


function Rest(database)
{
  this.database = database;
  this.original = Rekord_rest.call( Rekord, database );
}

Rest.prototype =
{
  getFirebase: function(model, options)
  {
    return this.database.getFirebase ? this.database.getFirebase( model, this.database, options ) : this.database.api;
  },

  getQueryFirebase: function(url, data, options)
  {
    return this.database.getQueryFirebase ? this.database.getQueryFirebase( url, data ) :
      ( isString( url ) ? this.getFirebase().root.child( url ) : this.getFirebase() );
  },

  canCall: function(func, args, failure, offlineValue)
  {
    if ( Rekord.forceOffline )
    {
      failure( offlineValue, 0 );

      return false;
    }

    if ( !this.database.getFirebase && !this.database.api )
    {
      func.apply( this.original, args );

      return false;
    }

    return true;
  },

  all: function( options, success, failure )
  {
    if ( this.canCall( this.original.all, arguments, failure, [] ) )
    {
      this.getFirebase( null, options )
        .once( 'value' )
        .then( createQueryCallbackSuccess( success ) )
        .catch( createQueryCallbackFailure( failure ) )
      ;
    }
  },

  get: function( model, options, success, failure )
  {
    function onGet(snapshot)
    {
      var data = snapshot.val();

      success( data );
    }

    if ( this.canCall( this.original.get, arguments, failure, {} ) )
    {
      this.getFirebase( model, options )
        .child( model.$key() )
        .once( 'value' )
        .then( onGet )
        .catch( createOperationCallbackFailure( failure ) )
      ;
    }
  },

  create: function( model, encoded, options, success, failure )
  {
    if ( this.canCall( this.original.create, arguments, failure, {} ) )
    {
      clearUndefined( encoded );

      this.getFirebase( model, options )
        .child( model.$key() )
        .set( encoded )
        .then( createOperationCallbackSuccess( success ) )
        .catch( createOperationCallbackFailure( failure ) )
      ;
    }
  },

  update: function( model, encoded, options, success, failure )
  {
    if ( this.canCall( this.original.update, arguments, failure, {} ) )
    {
      clearUndefined( encoded );

      this.getFirebase( model, options )
        .child( model.$key() )
        .update( encoded )
        .then( createOperationCallbackSuccess( success ) )
        .catch( createOperationCallbackFailure( failure ) )
      ;
    }
  },

  remove: function( model, options, success, failure )
  {
    if ( this.canCall( this.original.remove, arguments, failure, {} ) )
    {
      this.getFirebase( model, options )
        .child( model.$key() )
        .remove()
        .then( createOperationCallbackSuccess( success ) )
        .catch( createOperationCallbackFailure( failure ) )
      ;
    }
  },

  query: function( url, data, options, success, failure )
  {
    if ( this.canCall( this.original.query, arguments, failure, [] ) )
    {
      var query = this.getQueryFirebase( url, data, options );

      if ( isObject( data ) )
      {
        for (var method in data)
        {
          var args = data[ method ];

          if ( isArray( args ) )
          {
            for (var i = 0; i < args.length; i++)
            {
              query[ method ]( args[ i ] );
            }
          }
          else
          {
            query[ method ]( args );
          }
        }
      }
      else if ( isFunction( data ) )
      {
        data( query );
      }

      query
        .once( 'value' )
        .then( createQueryCallbackSuccess( success ) )
        .catch( createQueryCallbackFailure( failure ) )
      ;
    }
  }
};


function Live(database)
{
  this.database = database;
  this.firebase = database.getLiveFirebase ? database.getLiveFirebase( database ) : database.api;
  this.listen();
}

Live.prototype =
{
  listen: function()
  {
    var onSave = this.handleSave();
    var onRemove = this.handleRemove();

    this.firebase.on( 'child_added', onSave );
    this.firebase.on( 'child_changed', onSave );
    this.firebase.on( 'child_removed', onRemove );
  },

  handleSave: function()
  {
    var db = this.database;

    return function onSave(snapshot)
    {
      var data = snapshot.val();
      var key = getKey( snapshot );

      db.liveSave( key, data );
    };
  },

  handleRemove: function()
  {
    var db = this.database;

    return function onRemove(snapshot)
    {
      var key = getKey( snapshot );

      db.liveRemove( key );
    };
  },

  save: noop,

  remove: noop
};


  function RestFactory(database)
  {
    return new Rest( database );
  }

  function LiveFactory(database)
  {
    if ( !database.getLiveFirebase && !database.api )
    {
      return Rekord_live.call( this, database );
    }

    return new Live( database );
  }

  Rekord.Lives.Firebase = LiveFactory;
  Rekord.setLive( LiveFactory );

  Rekord.Rests.Firebase = RestFactory;
  Rekord.setRest( RestFactory );

  Rekord.Firebase = {
    live: LiveFactory,
    rest: RestFactory,
    RestClass: Rest,
    LiveClass: Live
  };

  return Rekord;

}));
