/* rekord-firebase 1.4.3 - A rekord binding to firebase - implementing Rekord.rest & Rekord.live by Philip Diffenderfer */
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

  function LiveFactory(database)
  {
    var fire = database.getLiveFirebase ? database.getLiveFirebase( database ) : database.api;

    if ( !fire )
    {
      return Rekord_live.call( this, database );
    }

    function handleSave(snapshot)
    {
      var data = snapshot.val();
      var key = getKey( snapshot );

      database.liveSave( key, data );
    }

    function handleRemove(snapshot)
    {
      var key = getKey( snapshot );

      database.liveRemove( key );
    }

    fire.on( 'child_added', handleSave );
    fire.on( 'child_changed', handleSave );
    fire.on( 'child_removed', handleRemove );

    return {
      firebase: fire,
      save: noop,
      remove: noop
    };
  }

  function RestFactory(database)
  {
    if ( !database.api && !database.getFirebase )
    {
      return Rekord_rest.call( this, database );
    }

    function getFirebase(model)
    {
      return database.getFirebase ? database.getFirebase( model, database ) : database.api;
    }

    function getQueryFirebase(url, data)
    {
      return database.getQueryFirebase ? database.getQueryFirebase( url, data ) :
        ( isString( url ) ? getFirebase().root.child( url ) : getFirebase() );
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

    return {

      getFirebase: getFirebase,
      getQueryFirebase: getQueryFirebase,

      all: function( success, failure )
      {
        if ( Rekord.forceOffline )
        {
          return failure( [], 0 );
        }

        getFirebase()
          .once( 'value' )
          .then( createQueryCallbackSuccess( success ) )
          .catch( createQueryCallbackFailure( failure ) )
        ;
      },

      get: function( model, success, failure )
      {
        if ( Rekord.forceOffline )
        {
          return failure( {}, 0 );
        }

        function onGet(snapshot)
        {
          var data = snapshot.val();

          success( data );
        }

        getFirebase( model )
          .child( model.$key() )
          .once( 'value' )
          .then( onGet )
          .catch( createOperationCallbackFailure( failure ) )
        ;
      },

      create: function( model, encoded, success, failure )
      {
        if ( Rekord.forceOffline )
        {
          return failure( {}, 0 );
        }

        clearUndefined( encoded );

        getFirebase( model )
          .child( model.$key() )
          .set( encoded )
          .then( createOperationCallbackSuccess( success ) )
          .catch( createOperationCallbackFailure( failure ) )
        ;
      },

      update: function( model, encoded, success, failure )
      {
        if ( Rekord.forceOffline )
        {
          return failure( {}, 0 );
        }

        clearUndefined( encoded );

        getFirebase( model )
          .child( model.$key() )
          .update( encoded )
          .then( createOperationCallbackSuccess( success ) )
          .catch( createOperationCallbackFailure( failure ) )
        ;
      },

      remove: function( model, success, failure )
      {
        if ( Rekord.forceOffline )
        {
          return failure( {}, 0 );
        }

        getFirebase( model )
          .child( model.$key() )
          .remove()
          .then( createOperationCallbackSuccess( success ) )
          .catch( createOperationCallbackFailure( failure ) )
        ;
      },

      query: function( url, data, success, failure )
      {
        if ( Rekord.forceOffline )
        {
          return failure( [], 0 );
        }

        var query = getQueryFirebase( url, data );

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

    };
  }

  Rekord.setLive( LiveFactory );
  Rekord.setRest( RestFactory );

  Rekord.Firebase = {
    live: LiveFactory,
    rest: RestFactory
  };

  return Rekord;

}));
