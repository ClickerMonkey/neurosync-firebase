module( 'Firebase' );

test( 'load', function(assert)
{
  var prefix = 'load_';
  var fire = firebase.database();

  fire.ref('task').set({
    1: {id: 1, name: 't1', done: true},
    2: {id: 2, name: 't2', done: false},
    3: {id: 3, name: 't3', done: false},
    4: {id: 4, name: 't4', done: true}
  });

  var Task = Rekord({
    name: prefix + 'task',
    api: fire.ref('task'),
    fields: ['name', 'done']
  });

  strictEqual( Task.all().length, 4 );
});

test( 'load delay', function(assert)
{
  var prefix = 'load_delay_';
  var timer = assert.timer();
  var fire = firebase.database();

  fire.ref('task').set({
    1: {id: 1, name: 't1', done: true},
    2: {id: 2, name: 't2', done: false},
    3: {id: 3, name: 't3', done: false},
    4: {id: 4, name: 't4', done: true}
  });
  fire.ref('task').delay = 1;

  var Task = Rekord({
    name: prefix + 'task',
    api: fire.ref('task'),
    fields: ['name', 'done']
  });

  expect(2);

  strictEqual( Task.all().length, 0 );

  wait(2, function()
  {
    strictEqual( Task.all().length, 4 );
  });

  timer.run();
});

test( 'load fail', function(assert)
{
  var prefix = 'load_fail_';
  var fire = firebase.database();

  fire.ref('task').set({
    1: {id: 1, name: 't1', done: true},
    2: {id: 2, name: 't2', done: false},
    3: {id: 3, name: 't3', done: false},
    4: {id: 4, name: 't4', done: true}
  });
  fire.ref('task').error = 0;

  var Task = Rekord({
    name: prefix + 'task',
    api: fire.ref('task'),
    fields: ['name', 'done']
  });

  strictEqual( Task.all().length, 0 );
});

test( 'save', function(assert)
{
  var prefix = 'save_';
  var fire = firebase.database();

  var Task = Rekord({
    name: prefix + 'task',
    api: fire.ref('task'),
    fields: ['name', 'done'],
    defaults: {
      done: false
    }
  });

  Task.create({id: 1, name: 't1'});

  deepEqual( fire.ref('task/1').value, {id: 1, name: 't1', done: false} );
});

test( 'save delay', function(assert)
{
  var prefix = 'save_delay_';
  var timer = assert.timer();
  var fire = firebase.database();

  var Task = Rekord({
    name: prefix + 'task',
    api: fire.ref('task'),
    fields: ['name', 'done'],
    defaults: {
      done: false
    }
  });

  fire.ref('task/1').delay = 1;

  var t1 = Task.create({id: 1, name: 't1'});

  notOk( t1.$isSaved() );
  strictEqual( t1.$status, Rekord.Model.Status.SavePending );
  deepEqual( fire.ref('task/1').value, {} );

  wait(2, function()
  {
    ok( t1.$isSaved() );
    strictEqual( t1.$status, Rekord.Model.Status.Synced );
    deepEqual( fire.ref('task/1').value, {id: 1, name: 't1', done: false} );
  });

  timer.run();
});

test( 'save fail', function(assert)
{
  var prefix = 'save_fail_';
  var fire = firebase.database();

  var Task = Rekord({
    name: prefix + 'task',
    api: fire.ref('task'),
    fields: ['name', 'done'],
    defaults: {
      done: false
    }
  });

  fire.ref('task/1').error = 0;

  Task.create({id: 1, name: 't1'});

  deepEqual( fire.ref('task/1').value, {} );
});

test( 'update', function(assert)
{
  var prefix = 'update_';
  var fire = firebase.database();

  var Task = Rekord({
    name: prefix + 'task',
    api: fire.ref('task'),
    fields: ['name', 'done'],
    defaults: {
      done: false
    }
  });

  var t1 = Task.create({id: 1, name: 't1'});

  deepEqual( fire.ref('task/1').value, {id: 1, name: 't1', done: false} );

  t1.done = true;
  t1.$save();

  deepEqual( fire.ref('task/1').value, {id: 1, name: 't1', done: true} );
});

test( 'update delay', function(assert)
{
  var prefix = 'update_delay_';
  var timer = assert.timer();
  var fire = firebase.database();

  var Task = Rekord({
    name: prefix + 'task',
    api: fire.ref('task'),
    fields: ['name', 'done'],
    defaults: {
      done: false
    }
  });

  var t1 = Task.create({id: 1, name: 't1'});

  deepEqual( fire.ref('task/1').value, {id: 1, name: 't1', done: false} );

  fire.ref('task/1').delay = 1;

  t1.done = true;
  t1.$save();

  strictEqual( t1.$status, Rekord.Model.Status.SavePending );
  deepEqual( fire.ref('task/1').value, {id: 1, name: 't1', done: false} );

  wait(2, function()
  {
    strictEqual( t1.$status, Rekord.Model.Status.Synced );
    deepEqual( fire.ref('task/1').value, {id: 1, name: 't1', done: true} );
  });

  timer.run();
});

test( 'update fail', function(assert)
{
  var prefix = 'update_fail_';
  var fire = firebase.database();

  var Task = Rekord({
    name: prefix + 'task',
    api: fire.ref('task'),
    fields: ['name', 'done'],
    defaults: {
      done: false
    }
  });

  var t1 = Task.create({id: 1, name: 't1'});

  deepEqual( fire.ref('task/1').value, {id: 1, name: 't1', done: false} );

  fire.ref('task/1').error = 0;

  t1.done = true;
  t1.$save();

  deepEqual( fire.ref('task/1').value, {id: 1, name: 't1', done: false} );
});

test( 'remove', function(assert)
{
  var prefix = 'remove_';
  var fire = firebase.database();

  var Task = Rekord({
    name: prefix + 'task',
    api: fire.ref('task'),
    fields: ['name', 'done'],
    defaults: {
      done: false
    }
  });

  var t1 = Task.create({id: 1, name: 't1'});

  deepEqual( fire.ref('task').value, {1: {id: 1, name: 't1', done: false}} );

  t1.$remove();

  deepEqual( fire.ref('task').value, {} );
});

test( 'remove delay', function(assert)
{
  var prefix = 'remove_delay_';
  var timer = assert.timer();
  var fire = firebase.database();

  var Task = Rekord({
    name: prefix + 'task',
    api: fire.ref('task'),
    fields: ['name', 'done'],
    defaults: {
      done: false
    }
  });

  var t1 = Task.create({id: 1, name: 't1'});

  deepEqual( fire.ref('task').value, {1: {id: 1, name: 't1', done: false}} );

  fire.ref('task/1').delay = 1;

  t1.$remove();

  strictEqual( t1.$status, Rekord.Model.Status.RemovePending );
  deepEqual( fire.ref('task').value, {1: {id: 1, name: 't1', done: false}} );

  wait(2, function()
  {
    strictEqual( t1.$status, Rekord.Model.Status.Removed );
    deepEqual( fire.ref('task').value, {} );
  });

  timer.run();
});

test( 'remove fail', function(assert)
{
  var prefix = 'remove_fail_';
  var fire = firebase.database();

  var Task = Rekord({
    name: prefix + 'task',
    api: fire.ref('task'),
    fields: ['name', 'done'],
    defaults: {
      done: false
    }
  });

  var t1 = Task.create({id: 1, name: 't1'});

  deepEqual( fire.ref('task').value, {1: {id: 1, name: 't1', done: false}} );

  fire.ref('task/1').error = 0;

  t1.$remove();

  strictEqual( t1.$status, Rekord.Model.Status.RemovePending );
  deepEqual( fire.ref('task').value, {1: {id: 1, name: 't1', done: false}} );
});

test( 'fetch', function(assert)
{
  var prefix = 'fetch_';
  var fire = firebase.database();

  var Task = Rekord({
    name: prefix + 'task',
    api: fire.ref('task'),
    fields: ['name', 'done'],
    defaults: {
      done: false
    }
  });

  deepEqual( fire.ref('task').value, {} );

  fire.ref('task/1').set({id: 1, name: 't1', done: true});

  var t1 = Task.fetch(1);

  ok( t1 );
  strictEqual( t1.id, 1 );
  strictEqual( t1.name, 't1' );
  strictEqual( t1.done, true );
});

test( 'fetch fail', function(assert)
{
  var prefix = 'fetch_fail_';
  var fire = firebase.database();

  var Task = Rekord({
    name: prefix + 'task',
    api: fire.ref('task'),
    fields: ['name', 'done'],
    defaults: {
      done: false
    }
  });

  deepEqual( fire.ref('task').value, {} );

  fire.ref('task/1').error = 404;

  var t1 = Task.fetch(1);

  notOk( t1.$isSaved() );
});

test( 'live create', function(assert)
{
  var prefix = 'live_create_';
  var fire = firebase.database();

  var Task = Rekord({
    name: prefix + 'task',
    api: fire.ref('task'),
    fields: ['name', 'done'],
    defaults: {
      done: false
    }
  });

  strictEqual( Task.all().length, 0 );
  deepEqual( fire.ref('task').value, {} );

  fire.ref('task/1').set({id: 1, name: 't1', done: true}, 0, true);

  strictEqual( Task.all().length, 1 );
  deepEqual( fire.ref('task/1').value, {id: 1, name: 't1', done: true} );

  var t1 = Task.get(1);
  strictEqual( t1.id, 1 );
  strictEqual( t1.name, 't1' );
  strictEqual( t1.done, true );
});

test( 'live update', function(assert)
{
  var prefix = 'live_update_';
  var fire = firebase.database();

  var Task = Rekord({
    name: prefix + 'task',
    api: fire.ref('task'),
    fields: ['name', 'done'],
    defaults: {
      done: false
    }
  });

  strictEqual( Task.all().length, 0 );
  deepEqual( fire.ref('task').value, {} );

  fire.ref('task/1').set({id: 1, name: 't1', done: true}, 0, true);

  strictEqual( Task.all().length, 1 );
  deepEqual( fire.ref('task/1').value, {id: 1, name: 't1', done: true} );

  var t1 = Task.get(1);
  strictEqual( t1.id, 1 );
  strictEqual( t1.name, 't1' );
  strictEqual( t1.done, true );

  fire.ref('task/1').update({done: false}, 0, true);

  strictEqual( t1.done, false );
});
