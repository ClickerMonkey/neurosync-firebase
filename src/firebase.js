(function(global, Rekord, Firebase, undefined)
{
  var isObject = Rekord.isObject;
  var isFunction = Rekord.isFunction;
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

    function createCallback(success, failure)
    {
      return function onOperation(error)
      {
        if ( error )
        {
          failure( {}, error );
        }
        else
        {
          success( {} );
        }
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

      all: function( success, failure )
      {
        if ( Rekord.forceOffline )
        {
          return failure( [], 0 );
        }

        function onAll(snapshot)
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
        }

        function onAllError(error)
        {
          failure( [], error.code );
        }

        getFirebase().once( 'value', onAll, onAllError );
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

        function onGetError(error)
        {
          failure( {}, error.code );
        }

        getFirebase( model )
          .child( model.$key() )
          .once( 'value', onGet, onGetError )
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
          .set( encoded, createCallback( success, failure ) )
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
          .update( encoded, createCallback( success, failure ) )
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
          .remove( createCallback( success, failure ) )
        ;
      },

      query: function( url, query, success, failure )
      {
        success( [] );
      }

    };
  }

  Rekord.setLive( LiveFactory );
  Rekord.setRest( RestFactory );

  Rekord.Firebase = {
    live: LiveFactory,
    rest: RestFactory
  };

})( this, this.Rekord, this.Firebase );
