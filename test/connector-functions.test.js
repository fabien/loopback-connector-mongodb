// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback-connector-mongodb
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

// This test written in mocha+should.js
var should = require('./init.js');

describe('connector function - findById', function() {
  var db, TestAlias, sampleId;
  before(function(done) {
    db = global.getDataSource();
    TestAlias = db.define('TestAlias', {foo: {type: String}});
    db.automigrate(function(err) {
      if (err) return done(err);
      TestAlias.create({foo: 'foo'}, function(err, t) {
        if (err) return done(err);
        sampleId = t.id;
        done();
      });
    });
  });

  it('find is aliased as findById', function(done) {
    db.connector.findById('TestAlias', sampleId, {}, function(err, r) {
      if (err) return done(err);
      r.foo.should.equal('foo');
      done();
    });
  });
});

describe('connector function - buildWhere', function() {
  var db, TestAlias;
  before(function() {
    db = global.getDataSource();
    TestAlias = db.define('TestAlias', {foo: {type: String}});
  });

  it('should handle: exists', function() {
    var q = db.connector.buildWhere('TestAlias', {
      name: {exists: true},
    });
    q.should.eql({name: {'$exists': true}});
  });

  it('should handle: all', function() {
    var q = db.connector.buildWhere('TestAlias', {
      name: {all: ['a', 'b']},
    });
    q.should.eql({name: {'$all': ['a', 'b']}});
  });

  it('should handle: elemMatch', function() {
    var q = db.connector.buildWhere('TestAlias', {
      listItems: {elemMatch: {product: 'xyz'}},
    });
    q.should.eql({listItems: {'$elemMatch': {product: 'xyz'}}});
  });

  it('should handle: not', function() {
    var q = db.connector.buildWhere('TestAlias', {
      price: {not: {gt: 1.99}},
    });
    q.should.eql({price: {$not: {$gt: 1.99}}});
  });
});
