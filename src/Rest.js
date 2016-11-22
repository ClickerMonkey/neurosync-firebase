
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
