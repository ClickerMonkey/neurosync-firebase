(function(Firebase, global, undefined)
{

  var cache = {};

  var Neuro_live = Neuro.live;
  var Neuro_rest = Neuro.rest;

  Neuro.firebase = function(url)
  {
    return url in cache ? cache[ url ] : cache[ url ] = new Firebase( url );
  };

  if ( !Neuro.liveSet )
  {
    Neuro.live = function(database)
    {
      if ( !database.api )
      {
        return Neuro_live.call( this, database );
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
        save: Neuro.noop,
        remove: Neuro.noop
      };
    };

    Neuro.liveSet = true;
  }

  if ( !Neuro.restSet )
  {
    Neuro.rest = function(database)
    {
      if ( !database.api )
      {
        return Neuro_rest.call( this, database );
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
          if ( Neuro.forceOffline )
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

              if ( Neuro.isObject( model ) )
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
          if ( Neuro.forceOffline )
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

          file.child( model.$key() ).once( 'value', onGet, onGetError );
        },

        create: function( model, encoded, success, failure )
        {
          if ( Neuro.forceOffline )
          {
            return failure( {}, 0 );
          }

          clearUndefined( encoded );

          fire.child( model.$key() ).set( encoded, createCallback( success, failure ) );
        },

        update: function( model, encoded, success, failure )
        {
          if ( Neuro.forceOffline )
          {
            return failure( {}, 0 );
          }

          clearUndefined( encoded );

          fire.child( model.$key() ).update( encoded, createCallback( success, failure ) );
        },

        remove: function( model, success, failure )
        {
          if ( Neuro.forceOffline )
          {
            return failure( {}, 0 );
          }

          fire.child( model.$key() ).remove( createCallback( success, failure ) );
        },

        query: function( query, success, failure )
        {
          success( [] );
        }

      };

    };

    Neuro.restSet = true;
  }

})( Firebase, this );