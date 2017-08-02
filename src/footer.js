
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
