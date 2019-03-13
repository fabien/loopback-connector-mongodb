// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback-connector-mongodb
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

require('./init.js');

var Transaction = require('..').Transaction;
var supportsTransactions = false;
var db, Model;

describe('Transactions', function() {
  before(function(done) {
    db = global.getDataSource();
    var propertyDef = {
      name: {
        type: String,
      },
      createdAt: {
        type: Date,
      },
    };

    Model = db.createModel('Example', propertyDef);

    Model.observe('before save', function(ctx, next) {
      if (ctx.isNewInstance) {
        ctx.instance.createdAt = new Date();
      }
      next();
    });

    Model.destroyAll(function(err) {
      if (err) return done(err);
      db.automigrate(done);
    });
  });

  before(function(done) {
    db.connector.supportsTransactions(function(err, bool) {
      supportsTransactions = bool;
      done();
    });
  });

  it('should return Transaction object', optional(function() {
    var tx = Model.getTransaction();
    tx.should.be.instanceOf(Transaction);
    tx.isInTransation.should.be.false();
  }));

  it('should rollback Transaction object', optional(function(done) {
    var tx = Model.getTransaction();
    tx.should.be.instanceOf(Transaction);
    tx.isInTransation.should.be.false();
    tx.start();
    tx.isInTransation.should.be.true();

    Model.create({name: 'Test'}, {transaction: tx}, function(err, instance) {
      instance.should.be.instanceOf(Model);
      instance.name.should.equal('Test');
      instance.createdAt.should.be.instanceOf(Date);
      tx.rollback().then(function() {
        Model.count(function(err, count) {
          count.should.equal(0);
          done(err);
        });
      }, done);
    });
  }));

  it('should commit Transaction object', optional(function(done) {
    var tx = Model.getTransaction();
    tx.should.be.instanceOf(Transaction);
    tx.isInTransation.should.be.false();
    tx.start();
    tx.isInTransation.should.be.true();

    Model.create({name: 'Test'}, {transaction: tx}, function(err, instance) {
      instance.should.be.instanceOf(Model);
      instance.name.should.equal('Test');
      instance.createdAt.should.be.instanceOf(Date);
      tx.commit().then(function() {
        Model.count(function(err, count) {
          count.should.equal(1);
          done(err);
        });
      }, done);
    });
  }));

  it('should wrap a model', optional(function(done) {
    Model.transaction(function(tx, Example) {
      Example.create({name: 'Other'}, function(err, instance) {
        instance.should.be.instanceOf(Model);
        instance.name.should.equal('Other');
        instance.createdAt.should.be.instanceOf(Date);
        tx.rollback();
      });
    }).then(function() {
      Model.count(function(err, count) {
        count.should.equal(1);
        done(err);
      });
    }, done);
  }));

  it('should wrap multiple models', optional(function(done) {
    Model.transaction(['Example'], function(tx, Example) {
      Example.create({name: 'Other'}, function(err, instance) {
        instance.should.be.instanceOf(Model);
        instance.name.should.equal('Other');
        instance.createdAt.should.be.instanceOf(Date);
        tx.rollback();
      });
    }).then(function() {
      Model.count(function(err, count) {
        count.should.equal(1);
        done(err);
      });
    }, done);
  }));

  function optional(fn) {
    return function(done) {
      if (supportsTransactions && fn.length) {
        fn(done);
      } else if (supportsTransactions) {
        fn();
        done();
      } else {
        this.skip();
      }
    };
  };
});
