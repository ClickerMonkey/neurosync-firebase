(function(global, Rekord, wait, undefined)
{
  var Promise = Rekord.Promise;
  var isEmpty = Rekord.isEmpty;
  var isValue = Rekord.isValue;

  var REFERENCE_DELIMITER = '/';

  function Reference(database, root, parent, ref, key, value)
  {
    this.database = database;
    this.root = root || this;
    this.parent = parent;
    this.ref = ref;
    this.key = key;

    this.value = value;
    this.children = {};
    this.delay = 0;
    this.error = false;
  }

  Reference.prototype =
  {
    child: function(path)
    {
      return this.database.ref( this.ref + REFERENCE_DELIMITER + path );
    },
    val: function()
    {
      return this.value;
    },
    set: function(value, onComplete, $trigger)
    {
      return this.createPromise( onComplete, function handleSet()
      {
        var empty = Rekord.isEmpty( this.value );

        for (var prop in this.value)
        {
          delete this.value[ prop ];
        }

        Rekord.transfer( value, this.value );

        if ( $trigger )
        {
          if ( empty )
          {
            this.parent.fullTrigger( 'child_added', [this] );
          }
          else
          {
            this.parent.fullTrigger( 'child_changed', [this] );
          }

          this.fullTrigger( 'value', [this] );
        }
      });
    },
    update: function(value, onComplete, $trigger)
    {
      return this.createPromise( onComplete, function handleUpdate()
      {
        var empty = Rekord.isEmpty( this.value );

        Rekord.transfer( value, this.value );

        if ( $trigger )
        {
          if ( empty )
          {
            this.parent.fullTrigger( 'child_added', [this] );
          }
          else
          {
            this.parent.fullTrigger( 'child_changed', [this] );
          }

          this.fullTrigger( 'value', [this] );
        }
      });
    },
    remove: function(onComplete, $trigger)
    {
      return this.createPromise( onComplete, function handleRemove()
      {
        delete this.parent.children[ this.key ];
        delete this.parent.value[ this.key ];

        if ( $trigger )
        {
          this.parent.fullTrigger( 'child_removed', [this] );
        }
      });
    },
    createPromise: function(onComplete, execute)
    {
      var ref = this;
      var promise = new Promise();

      promise.complete( onComplete );

      function resolve()
      {
        if ( ref.error !== false )
        {
          promise.reject( ref.error );
        }
        else
        {
          if ( execute ) execute.call( ref, promise );

          promise.resolve( ref );
        }
      }

      if ( this.delay === 0 )
      {
        resolve();
      }
      else
      {
        wait( this.delay, resolve );
      }

      return promise;
    },
    on: function(eventName, callback)
    {
      // this.once( eventName, callback );
      this.$on( eventName, callback );
    },
    off: function( eventName, callback )
    {
      this.$off( eventName, callback );
    },
    once: function(eventName, callback)
    {
      if (eventName === 'child_added')
      {
        for (var prop in this.children)
        {
          return this.children[ prop ].createPromise( callback );
        }
      }

      return this.createPromise( callback );
    },
    fullTrigger: function(eventName, args)
    {
      this.$trigger( eventName, args );

      if ( this.parent )
      {
        this.parent.fullTrigger( eventName, args );
      }
    }
  };

  Rekord.addEventful( Reference.prototype, true );

  function Database()
  {
    this.root = new Reference( this, null, null, '', '', {} );
    this.cached = {};
  }

  Database.prototype =
  {
    ref: function(path)
    {
      var fullPath = isValue( path ) ? path : '';

      if ( fullPath in this.cached )
      {
        return this.cached[ fullPath ];
      }

      var nodes = fullPath.split( REFERENCE_DELIMITER );
      var node = this.root;

      for (var i = 0; i < nodes.length; i++)
      {
        var nodeName = nodes[ i ];
        var child = node.children[ nodeName ];

        if ( !child )
        {
          var ref = nodes.slice(0, i + 1).join( REFERENCE_DELIMITER );
          var value = node.value[ nodeName ];

          if ( !value )
          {
            value = node.value[ nodeName ] = {};
          }

          child = node.children[ nodeName ] = new Reference( this, this.root, node, ref, nodeName, value );
          this.cached[ ref ] = child;
        }

        node = child;
      }

      return node;
    }
  };

  var firebase =
  {
    database: function()
    {
      return new Database();
    }
  };

  global.firebase = firebase;

})( this, this.Rekord, this.wait );
