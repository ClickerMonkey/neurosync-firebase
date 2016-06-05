# <img src="https://raw.githubusercontent.com/Rekord/rekord/master/images/rekord-color.png" width="60"> rekord-firebase

[![Build Status](https://travis-ci.org/Rekord/rekord-firebase.svg?branch=master)](https://travis-ci.org/Rekord/rekord-firebase)
[![devDependency Status](https://david-dm.org/Rekord/rekord-firebase/dev-status.svg)](https://david-dm.org/Rekord/rekord-firebase#info=devDependencies)
[![Dependency Status](https://david-dm.org/Rekord/rekord-firebase.svg)](https://david-dm.org/Rekord/rekord-firebase)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Rekord/rekord/blob/master/LICENSE)
[![Alpha](https://img.shields.io/badge/State-Alpha-orange.svg)]()

A rekord binding to firebase - implementing Rekord.rest (Rekord.live & Rekord.store implicitly)

The easiest way to install is by using bower via `bower install rekord-firebase`.

- `rekord-firebase.js` is `5.6KB` (`1.1KB` gzipped)
- `rekord-firebase.min.js` is `1.9KB` (`0.7KB` gzipped)

### Example Usage

```javascript
var fire = firebase.database();

// Executed after options are applied but before the store, rest, & live
// implementations are added. It's good to prepare your database in this
// function so if you switch backends there's only one place you need to do so.
// You can also pass a prepare function as a Rekord option.
Rekord.Database.Defaults.prepare = function(db, options) {
  db.api = options.api || fire.ref( options.name );
};

// Default behavior
var TaskList = Rekord({
  name: 'task_list',
  field: ['name', 'done']
});

// Override (or default behavior if prepare method isn't used like above)
var Task = Rekord({
  name: 'task',
  api: fire.ref('task'),
  field: ['name', 'done', 'task_list_id']
});

// Or dynamically return a firebase reference
var Item = Rekord({
  name: 'item',
  fields: ['name', 'list_id'],
  // for all, create, update, remove & query (when getQueryFirebase is not given)
  getFirebase: function(model, database) {
    // model is undefined for all() and query() functions
    return fire.ref( 'list/' + model.list_id + '/items' );
  },
  // for query
  getQueryFirebase: function(url, data) {
    return fire.ref( url );
  }
  // which reference to listen to for child events
  getLiveFirebase: function(database) {
    return fire.ref( database.name );
  }
});

```
