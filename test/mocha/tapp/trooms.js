var should = require('should');
var mongoose = require('mongoose');
var app = require('../../../server');
var User = mongoose.model('User');
var Room = mongoose.model('Room');
var App = mongoose.model('App');
var inspect = require('util').inspect;

var user, room, app;

describe('Model Room', function() {
     before(function(done) {
         console.log('before test');
         user = new User({
         	name: 'Test',
         	email: 'test@test.com',
         	username: 'test',
         	password: 'root'
         });

         room = new Room({
         	name: 'Class 100',
         	users: []
         });

         app = new App({
            appId: '8888',
            version_code: 1,
            name: 'testApp'
         });

         user.save(function(err) {
         	if(err) return done(err);
         	console.log('save the user ' + user.username);
         	room.save(function(err) {
         	    if(err) return done(err);
         	    console.log('save the room ' + room.name);
                 app.save(function(err) {
                    if(err) return done(err);
                    done();
                 });
         	});
         });
     });

     describe('Check the init env', function(){
     	it('should exist the user', function(done) {
     	    User.findOne({username: 'test'}, function(err, user) {
     	    	if(err) return done(err);
     	    	should.exist(user);
             user.username.should.equal('test');
     	    	done();
     	    })
     	});

     	it('should exist the room', function(done) {
     	    Room.findOne({name:'Class 100'}, function(err, room) {
     	    	if(err) return done(err);
     	    	should.exist(room);
     	    	done();
     	    })
     	});
     });

     describe('Test Method joinUser', function() {
        it('should begin with no user in the room', function(done) {
            var result = room.ifHaveUser(user, function(err) {
                if(err) return done(err);
            });
            result.should.not.be.ok;
            done();
        });

         it('should join a user with on error', function(done) {
         	room.joinUser(user, function(err, room) {
                if(err) return done(err);
                console.log(room.users.length);
                done();
            })
         });

        /* it('should have only one the user in the room', function(done) {

         });
*/
         it('should get the user in User model, and equal', function(done) {
              var result = room.ifHaveUser(user, function(err) {
                  if(err) return done(err);
              });
              result.should.be.ok;
              User.findById(user._id, function(err, muser) {
                  user.username.should.equal(muser.username);
                  done();
              });
         });

     });

    describe('Test Method exitUser', function() {
        var testUser;
        before(function(done) {
            if(room.users.length < 1) {
                var muser = new User({
                   name: 'Exit',
                   email: 'exit@exit.com',
                   username: 'exit',
                   password: 'root'
              });
              muser.save(function(err) {
                if(err) return done(err);
                room.joinUser(muser, function(err, room) {
                    if(err) return done(err);
                    done();
                });
              });
           }
           var id = room.users[0];
           User.findById(id, function(err, user) {
               if(err) return done(err);
               testUser = user;
               done();
           });
        });

        it('should exit a user from a room with no error', function(done) {
            room.exitUser(testUser, function(err, room) {
                if(err) return done(err);
                done();
            });
        });

        it('should not exist the user in the room', function(done) {
            var result = room.ifHaveUser(testUser, function(err) {
                if(err) return done(err);
            });
            result.should.not.be.ok;
            done();
        });

    });


     after(function(done) {
         console.log('after test');
         Room.remove().exec(function(err) {
         	if(err) return done(err);
         	User.remove().exec(function(err) {
         	  if(err) return done(err);
         	  console.log('remove all');
               App.remove().exec(function(err) {
                  if(err)  return done(err);
                  done();
               });
         	});
         });
     });
});

describe('The Method For App In Room', function() {
   var app, room;
   before(function(done) {
      console.log('App Before.....');
      app = new App({
         appId: '654321',
         version_code: 1,
         name: 'testApp'
      });
      room = new Room({
         name: 'Class Baa'
      });

      app.save(function(err) {
         if(err) return done(err);
         console.log('创建App成功......');
         room.save(function(err) {
             if(err) return done(err);
             done();
         })
      });
   });

   describe('Test Method AddApp', function() {
      it('should add the app without err', function(done) {
          room.addApp(app, function(err, room) {
             if(err) return done(err);
             console.log('添加App成功: '+room.apps.length);
             console.log(JSON.stringify(room.apps));
             done();
          });
      });

      it('should have the app in the room', function(done) {
          var result = room.isAsigned(app, room);
          result.should.be.ok;
          done();
      });
   });

   describe('Test Method RemoveApp', function() {
      it('should remove the app without err', function(done) {
          room.removeApp(app, function(err, room) {
             if(err) return done(err);
             done();
          });
      });

      it('should have not the app in the room', function(done) {
          var result = room.isAsigned(app, room);
          result.should.not.be.ok;
          done();
      });
   });


});


