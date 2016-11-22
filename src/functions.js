
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
