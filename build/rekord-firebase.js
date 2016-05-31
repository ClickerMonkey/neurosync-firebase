(function(global, Rekord, Firebase, undefined)
{
  var isObject = Rekord.isObject;
  var noop = Rekord.noop;

  var cache = {};

  var Rekord_live = Rekord.live;
  var Rekord_rest = Rekord.rest;

  function firebase(url)
  {
    return url in cache ? cache[ url ] : cache[ url ] = new Firebase( url );
  }

  function LiveFactory(database)
  {
    if ( !database.api )
    {
      return Rekord_live.call( this, database );
    }

    var fire = database.api;

    function handleSave(snapshot)
    {
      var data = snapshot.val();
      var key = snapshot.key();

      database.liveSave( key, data );
    }

    function handleRemove(snapshot)
    {
      var data = snapshot.val();
      var key = snapshot.key();

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
    if ( !database.api )
    {
      return Rekord_rest.call( this, database );
    }

    var fire = database.api;

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

      firebase: fire,

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

        fire.once( 'value', onAll, onAllError );
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

        fire.child( model.$key() ).once( 'value', onGet, onGetError );
      },

      create: function( model, encoded, success, failure )
      {
        if ( Rekord.forceOffline )
        {
          return failure( {}, 0 );
        }

        clearUndefined( encoded );

        fire.child( model.$key() ).set( encoded, createCallback( success, failure ) );
      },

      update: function( model, encoded, success, failure )
      {
        if ( Rekord.forceOffline )
        {
          return failure( {}, 0 );
        }

        clearUndefined( encoded );

        fire.child( model.$key() ).update( encoded, createCallback( success, failure ) );
      },

      remove: function( model, success, failure )
      {
        if ( Rekord.forceOffline )
        {
          return failure( {}, 0 );
        }

        fire.child( model.$key() ).remove( createCallback( success, failure ) );
      },

      query: function( url, query, success, failure )
      {
        success( [] );
      }

    };
  }

  Rekord.firebase = firebase;
  Rekord.setLive( LiveFactory );
  Rekord.setRest( RestFactory );

})( this, this.Rekord, this.Firebase );
