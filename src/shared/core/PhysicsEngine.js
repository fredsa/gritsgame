/*Copyright 2012 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
#limitations under the License.*/

//Box2D = box2D.Box2D;

Vec2 = Box2D.Common.Math.b2Vec2;
BodyDef =  Box2D.Dynamics.b2BodyDef;
Body =  Box2D.Dynamics.b2Body;
FixtureDef =  Box2D.Dynamics.b2FixtureDef;
Fixture =  Box2D.Dynamics.b2Fixture;
World =  Box2D.Dynamics.b2World;
MassData = Box2D.Collision.Shapes.b2MassData;
PolygonShape =  Box2D.Collision.Shapes.b2PolygonShape;
CircleShape = Box2D.Collision.Shapes.b2CircleShape;
DebugDraw =  Box2D.Dynamics.b2DebugDraw;
RevoluteJointDef =  Box2D.Dynamics.Joints.b2RevoluteJointDef;

GRITS_COLLISION_GROUP = {
  'player': 0x0001,
  'team0': 0x0001 << 1,
  'team1': 0x0001 << 2,
  'projectile': 0x0001 << 3,
  'pickupobject': 0x0001 << 4,

  //map objects,
  'mapobject': 0x0001 << 5,
  'projectileignore': 0x0001 << 6

  ,
  'all': 0xFFFF
};

PhysicsEngineClass = Class.extend({
  world: null,
  //-----------------------------------------
  create: function () {
    this.world = new World(
    new Vec2(0, 0) //gravity
    ,
    false //true                 //allow sleep
    );

    Box2D.Common.b2Settings.b2_maxTranslation = 99999;
    Box2D.Common.b2Settings.b2_maxTranslationSquared = Box2D.Common.b2Settings.b2_maxTranslation * Box2D.Common.b2Settings.b2_maxTranslation;

  },
  //-----------------------------------------	
  addContactListener: function (callbacks) {
    var listener = new Box2D.Dynamics.b2ContactListener;
    if (callbacks.BeginContact) listener.BeginContact = function (contact) {
      callbacks.BeginContact(contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody());
    }
    if (callbacks.EndContact) listener.EndContact = function (contact) {
      callbacks.EndContact(contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody());
    }
    if (callbacks.PostSolve) listener.PostSolve = function (contact, impulse) {
      callbacks.PostSolve(contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody(), impulse.normalImpulses[0]);
    }
    this.world.SetContactListener(listener);
  },
  //-----------------------------------------
  update: function () {
    var start = Date.now();
    this.world.Step(
    Constants.PHYSICS_LOOP_HZ //frame-rate
    ,
    10 //velocity iterations
    ,
    10 //position iterations
    );
    this.world.ClearForces();
    return (Date.now() - start);
  },
  //-----------------------------------------
  registerBody: function (bodyDef) {
    var body = this.world.CreateBody(bodyDef);
    return body;
  },
  //-----------------------------------------
  addBody: function (entityDef) {
    var bodyDef = new BodyDef;

    var id = entityDef.id;

    if (entityDef.type == 'static') {
      bodyDef.type = Body.b2_staticBody;
    } else {
      bodyDef.type = Body.b2_dynamicBody;
    }

    bodyDef.position.x = entityDef.x;
    bodyDef.position.y = entityDef.y;
    if (entityDef.userData) bodyDef.userData = entityDef.userData;
    if (entityDef.angle) bodyDef.angle = entityDef.angle;
    if (entityDef.damping) bodyDef.linearDamping = entityDef.damping;
    var body = this.registerBody(bodyDef);

	var fixtureDefinition = new FixtureDef;
    if (entityDef.useBouncyFixture) 
	{
		fixtureDefinition.density = 1.0;
		fixtureDefinition.friction = 0;
		fixtureDefinition.restitution = 1.0;
    }
	else 
	{
		fixtureDefinition.density = 1.0;
		fixtureDefinition.friction = 0; //0.5;//0.0;
		fixtureDefinition.restitution = 0; //0.2;
    }
	
	

    if (entityDef.categories && entityDef.categories.length) {
      fixtureDefinition.filter.categories = 0x0000;
      for (var i = 0; i < entityDef.categories.length; i++)
      fixtureDefinition.filter.categoryBits |= GRITS_COLLISION_GROUP[entityDef.categories[i]];

    } else fixtureDefinition.filter.categoryBits = 0x0001;

    if (entityDef.collidesWith && entityDef.collidesWith.length) {
      //For example, if walls are category 0x01, and ghosts are category 0x02, you can set ghost.maskBits = 0x01 to have ghosts only check collisions 
      //with walls (and anything else that is in category 1).
      //If you fire a bullet that should collide with everything, the default maskBits is 0xffff, and thus will match everything.		
      fixtureDefinition.filter.maskBits = 0x0000;
      for (var i = 0; i < entityDef.collidesWith.length; i++)
      fixtureDefinition.filter.maskBits |= GRITS_COLLISION_GROUP[entityDef.collidesWith[i]];

    } else fixtureDefinition.filter.maskBits = 0xFFFF;

    if (entityDef.radius) {
      fixtureDefinition.shape = new CircleShape(entityDef.radius);
      body.CreateFixture(fixtureDefinition);
    } else if (entityDef.polyPoints) {
     
        var points = entityDef.polyPoints;
        var vecs = [];
        for (var i = 0; i < points.length; i++) {
          var vec = new Vec2();
          vec.Set(points[i].x, points[i].y);
          vecs[i] = vec;
        }
        fixtureDefinition.shape = new PolygonShape;
        fixtureDefinition.shape.SetAsArray(vecs, vecs.length);
        body.CreateFixture(fixtureDefinition);
      
    } 
	else { //we're a box!
      fixtureDefinition.shape = new PolygonShape;
      fixtureDefinition.shape.SetAsBox(entityDef.halfWidth, entityDef.halfHeight);
      body.CreateFixture(fixtureDefinition);
    }

    return body;

  },

  //-----------------------------------------
  removeBodyAsObj: function (obj) {

    this.world.DestroyBody(obj);
  },
  //-----------------------------------------
  getBodySpec: function (b) {
    return {
      x: b.GetPosition().x,
      y: b.GetPosition().y,
      a: b.GetAngle(),
      c: {
        x: b.GetWorldCenter().x,
        y: b.GetWorldCenter().y
      }
    };
  },
  //-----------------------------------------	
  applyImpulse: function (body, degrees, power) {
    body.ApplyImpulse(new Vec2(Math.cos(degrees * (Math.PI / 180)) * power, Math.sin(degrees * (Math.PI / 180)) * power), body.GetWorldCenter());
  },
  //-----------------------------------------
  clearImpulse: function (body) {
    body.m_linearVelocity.SetZero();
    body.m_angularVelocity = 0.0;
  },
  //-----------------------------------------
  setVelocity: function (bodyId, x, y) {
    var body = this.bodiesMap[bodyId];
    body.SetLinearVelocity(new Vec2(x, y));
  },
  //-----------------------------------------
  getVelocity: function (body) {
    return body.GetLinearVelocity();
  },
  //-----------------------------------------
  getPosition: function (body) {
    return body.GetPosition();
  },
  //-----------------------------------------
  setPosition: function (body, pos) {
    body.SetPosition(pos);
  },

});

var gPhysicsEngine = new PhysicsEngineClass();
//exports.Class = PhysicsEngineClass;
