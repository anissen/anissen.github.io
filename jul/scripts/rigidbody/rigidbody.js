(function() {
  var Constraint, Particle, RigidBody;

  Particle = (function() {

    function Particle(settings) {
      this.settings = settings;
      this.immovable = this.settings.immovable;
      this.position = new THREE.Vector3(this.settings.position.x, this.settings.position.y, this.settings.position.z);
      this.oldPosition = this.position.clone();
      this.accumulatedForce = new THREE.Vector3();
      this.addedForce = new THREE.Vector3();
    }

    Particle.prototype.getMass = function() {
      if (this.immovable) {
        return 0.0;
      } else {
        return this.settings.mass;
      }
    };

    Particle.prototype.getInverseMass = function() {
      if (this.immovable) {
        return 0.0;
      } else {
        return 1 / this.getMass();
      }
    };

    Particle.prototype.addForce = function(force) {
      return this.addedForce.addSelf(force);
    };

    return Particle;

  })();

  Constraint = (function() {

    function Constraint(settings) {
      this.settings = settings;
      this.p1 = this.settings.p1;
      this.p2 = this.settings.p2;
      this.strategy = this.settings.strategy;
      this.broken = this.settings.broken;
      this.breakFactor = this.settings.breakFactor;
    }

    return Constraint;

  })();

  RigidBody = (function() {

    function RigidBody(settings) {
      this.settings = settings;
      this.bodyScene = new THREE.Scene();
      this.particles = {};
      this.constraints = [];
      this.step = 1.0;
      this.damping = 0.05;
      this.iterations = 2;
    }

    RigidBody.prototype.addParticle = function(particle, particleCallback) {
      this.particles[particle.settings.id] = particle;
      return this.bodyScene.add(particleCallback(particle));
    };

    RigidBody.prototype.getParticle = function(id) {
      return this.particles[id];
    };

    RigidBody.prototype.addConstraint = function(constraint, constraintCallback) {
      this.constraints.push(constraint);
      constraint.length = constraint.p1.position.distanceTo(constraint.p2.position);
      return this.bodyScene.add(constraintCallback(constraint, constraint.p1, constraint.p2));
    };

    RigidBody.prototype.load = function(data, particleCallback, constraintCallback) {
      var c, constraint, p, _i, _j, _len, _len1, _ref, _ref1, _results;
      this.particles = {};
      this.constraints = [];
      _ref = data.rigidbody.particle;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        this.addParticle(new Particle(p), particleCallback);
      }
      _ref1 = data.rigidbody.constraint;
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        c = _ref1[_j];
        constraint = new Constraint(c);
        constraint.p1 = this.getParticle(c.settings.particle1);
        constraint.p2 = this.getParticle(c.settings.particle2);
        _results.push(this.addConstraint(constraint, constraintCallback));
      }
      return _results;
    };

    RigidBody.prototype.getScene = function() {
      return this.bodyScene;
    };

    RigidBody.prototype.calculate = function() {
      var i, _i, _ref, _results;
      if (!this.settings.running) {
        return;
      }
      this.accumulateForces();
      this.verlet();
      _results = [];
      for (i = _i = 0, _ref = this.iterations; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push(this.satisfyConstraints());
      }
      return _results;
    };

    RigidBody.prototype.accumulateForces = function() {
      var gravityVector, k, p, _ref, _results;
      gravityVector = new THREE.Vector3(this.settings.gravity.x / 1000, this.settings.gravity.y / 1000, this.settings.gravity.z / 1000);
      if (!this.settings.gravity.enabled) {
        gravityVector = new THREE.Vector3();
      }
      _ref = this.particles;
      _results = [];
      for (k in _ref) {
        p = _ref[k];
        p.accumulatedForce = (new THREE.Vector3()).add(p.addedForce, gravityVector);
        _results.push(p.addedForce = new THREE.Vector3());
      }
      return _results;
    };

    RigidBody.prototype.verlet = function() {
      var a, k, p, result, step2, temp, _ref, _results;
      step2 = this.step * this.step;
      _ref = this.particles;
      _results = [];
      for (k in _ref) {
        p = _ref[k];
        result = new THREE.Vector3(0, 0, 0);
        temp = p.position.clone();
        a = p.accumulatedForce.clone();
        result.sub(p.position, p.oldPosition);
        a.multiplyScalar(p.getMass() * step2);
        result.addSelf(a);
        p.position.addSelf(result.multiplyScalar(1.0 - this.damping));
        _results.push(p.oldPosition = temp);
      }
      return _results;
    };

    RigidBody.prototype.satisfyConstraints = function() {
      var c, delta, deltalength, diff, displacement, displacement1, displacement2, invmass1, invmass2, x1, x2, _i, _len, _ref, _results;
      _ref = this.constraints;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        if (c.broken) {
          continue;
        }
        if (c.p1.immovable && c.p2.immovable) {
          continue;
        }
        x1 = c.p1.position;
        x2 = c.p2.position;
        invmass1 = c.p1.getInverseMass();
        invmass2 = c.p2.getInverseMass();
        delta = new THREE.Vector3(0, 0, 0);
        delta.sub(x2, x1);
        deltalength = delta.length();
        if (c.strategy === 'break' && deltalength > c.length * c.breakFactor) {
          c.broken = true;
        }
        diff = (deltalength - c.length) / (deltalength * (invmass1 + invmass2));
        displacement = delta.multiplyScalar(diff);
        displacement1 = displacement.clone().multiplyScalar(invmass1);
        displacement2 = displacement.clone().multiplyScalar(invmass2);
        x1.addSelf(displacement1);
        _results.push(x2.subSelf(displacement2));
      }
      return _results;
    };

    RigidBody.prototype.constraintHack = function() {
      var k, p, _ref, _results;
      _ref = this.particles;
      _results = [];
      for (k in _ref) {
        p = _ref[k];
        if (p.position.y < 0) {
          _results.push(p.position.setY(0));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return RigidBody;

  })();

  window.Particle = Particle;

  window.Constraint = Constraint;

  window.RigidBody = RigidBody;

}).call(this);
