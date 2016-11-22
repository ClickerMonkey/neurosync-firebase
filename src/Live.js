
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
