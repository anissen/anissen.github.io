(function() {
  var GravitySettings, Settings, alignCylinderToParticles, bevelEnabled, bevelSegments, bevelSize, bevelThickness, constraintObjects, createScene, createText, curveSegments, cylinderMaterial, cylinderSelectedMaterial, font, height, hover, material, mirror, rigidbody, scene, selectedParticle, settings, size, sphereMaterial, sphereSelectedMaterial, style, text, weight, world;

  GravitySettings = function() {
    this.enabled = true;
    this.x = 0.0;
    this.y = -9.82;
    return this.z = 0.0;
  };

  Settings = function() {
    this.gravity = new GravitySettings();
    this.running = true;
    return this;
  };

  settings = new Settings();

  selectedParticle = null;

  world = null;

  scene = null;

  rigidbody = new RigidBody(settings);

  constraintObjects = [];

  text = "GOD JUL";

  height = 20 / 10;

  size = 70 / 10;

  hover = 30 / 10;

  curveSegments = 4 / 10;

  bevelThickness = 2 / 10;

  bevelSize = 1.5 / 10;

  bevelSegments = 3 / 10;

  bevelEnabled = true;

  font = "optimer";

  weight = "bold";

  style = "normal";

  mirror = true;

  material = new THREE.MeshFaceMaterial([
    new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shading: THREE.FlatShading
    }), new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shading: THREE.SmoothShading
    })
  ]);

  createText = function() {
    var centerOffset, textGeo, textMesh1, textMesh2;
    textGeo = new THREE.TextGeometry('GOD JUL', {
      size: size,
      height: height,
      curveSegments: curveSegments,
      font: font,
      weight: weight,
      style: style,
      bevelThickness: bevelThickness,
      bevelSize: bevelSize,
      bevelEnabled: bevelEnabled,
      material: 0,
      extrudeMaterial: 1
    });
    textGeo.computeBoundingBox();
    textGeo.computeVertexNormals();
    centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
    textMesh1 = new THREE.Mesh(textGeo, material);
    textMesh1.position.x = centerOffset;
    textMesh1.position.y = hover;
    textMesh1.position.z = 0;
    textMesh1.rotation.x = 0;
    textMesh1.rotation.y = Math.PI * 2;
    world.add(textMesh1);
    if (mirror) {
      textMesh2 = new THREE.Mesh(textGeo, material);
      textMesh2.position.x = centerOffset;
      textMesh2.position.y = -hover;
      textMesh2.position.z = height;
      textMesh2.rotation.x = Math.PI;
      textMesh2.rotation.y = Math.PI * 2;
      return world.add(textMesh2);
    }
  };

  alignCylinderToParticles = function(cylinder, p1, p2) {
    var angle, center, length, rotObjectMatrix, t, v, z;
    length = p1.position.distanceTo(p2.position);
    v = new THREE.Vector3();
    v = v.sub(p2.position, p1.position);
    center = v.clone().add(p1.position, v.clone().divideScalar(2));
    cylinder.position = center;
    z = new THREE.Vector3(0, 1, 0);
    t = z.clone().cross(z, v);
    angle = Math.acos(z.dot(v) / length);
    rotObjectMatrix = new THREE.Matrix4();
    rotObjectMatrix.makeRotationAxis(t.normalize(), angle);
    cylinder.matrix = new THREE.Matrix4();
    cylinder.matrix.multiplySelf(rotObjectMatrix);
    return cylinder.rotation.setEulerFromRotationMatrix(cylinder.matrix);
  };

  sphereMaterial = new THREE.MeshLambertMaterial({
    ambient: 0xFFFFFF,
    color: 0x0000FF
  });

  sphereSelectedMaterial = new THREE.MeshLambertMaterial({
    ambient: 0xFFFFFF,
    color: 0x00CC00
  });

  cylinderMaterial = new THREE.MeshBasicMaterial({
    color: 0xFF0000
  });

  cylinderSelectedMaterial = new THREE.MeshBasicMaterial({
    color: 0x00CC00
  });

  createScene = function() {
    var createChristmasRope, createCylinderConstraint, createParticle, dirLight, pointLight, radius, rings, segments;
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 250, 1400);
    dirLight = new THREE.DirectionalLight(0xffffff, 0.125);
    dirLight.position.set(0, 0, 1).normalize();
    scene.add(dirLight);
    pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(0, 100, 90);
    scene.add(pointLight);
    pointLight.color.setHSV(Math.random(), 0.95, 0.85);
    radius = 1.5;
    segments = 8;
    rings = 8;
    createParticle = function(p) {
      var sphereMesh;
      sphereMesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, rings), sphereMaterial);
      sphereMesh.position = p.position;
      return sphereMesh;
    };
    createCylinderConstraint = function(c, p1, p2) {
      var cylinder, cylinderGeo, cylinderLength, cylinderRadius, length;
      length = p1.position.distanceTo(p2.position);
      cylinderRadius = 0.5;
      cylinderLength = length;
      cylinderGeo = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderLength, 6, 1, false);
      cylinder = new THREE.Mesh(cylinderGeo, cylinderMaterial);
      cylinder.p1 = p1;
      cylinder.p2 = p2;
      constraintObjects.push(cylinder);
      alignCylinderToParticles(cylinder, p1, p2);
      return cylinder;
    };
    createChristmasRope = function(startVector, endVector, letters) {
      var constraint, constraintSettings, diff, i, lastParticle, letterId, letterMargin, letterParticle, particle, particleLetter, particleSettings, posVector, segmentCount, _i, _results;
      diff = (new THREE.Vector3()).sub(endVector, startVector);
      letterMargin = 3;
      letterId = 0;
      segmentCount = letterMargin + letterMargin * letters.length + letterMargin;
      particleLetter = letterMargin + Math.ceil(letterMargin / 2);
      particle = null;
      lastParticle = null;
      _results = [];
      for (i = _i = 1; 1 <= segmentCount ? _i <= segmentCount : _i >= segmentCount; i = 1 <= segmentCount ? ++_i : --_i) {
        posVector = (new THREE.Vector3()).add(startVector, diff.clone().multiplyScalar(i / segmentCount));
        particleSettings = {
          id: 'particle' + i,
          position: posVector,
          mass: 3.0,
          immovable: i === 1 || i === segmentCount
        };
        particle = new Particle(particleSettings);
        rigidbody.addParticle(particle, createParticle);
        if (i === particleLetter && i + Math.floor(letterMargin / 2) + letterMargin <= segmentCount) {
          particleSettings = {
            id: 'particleLetter' + i,
            position: (new THREE.Vector3()).add(posVector, new THREE.Vector3(0, -15, 0)),
            mass: 15.0,
            immovable: false
          };
          letterParticle = new Particle(particleSettings);
          rigidbody.addParticle(letterParticle, createParticle);
          constraintSettings = {
            p1: particle,
            p2: letterParticle
          };
          constraint = new Constraint(constraintSettings);
          rigidbody.addConstraint(constraint, createCylinderConstraint);
          text = tQuery.createText(letters[letterId]);
          text.position = letterParticle.position.clone();
          text.scaleBy(10);
          world.add(text);
          console.log(text.position);
          letterId++;
          particleLetter += letterMargin;
        }
        if (lastParticle != null) {
          constraintSettings = {
            p1: lastParticle,
            p2: particle
          };
          constraint = new Constraint(constraintSettings);
          rigidbody.addConstraint(constraint, createCylinderConstraint);
        }
        _results.push(lastParticle = particle);
      }
      return _results;
    };
    createChristmasRope(new THREE.Vector3(-70, 70, 0), new THREE.Vector3(70, 70, 0), ['G', 'O', 'D']);
    scene.add(rigidbody.getScene());
    createText();
    world.enableDomEvent();
    tQuery('sphere').on('mouseover', function(event) {
      return event.target.material = sphereSelectedMaterial;
    }).on('mouseout', function(event) {
      if (event.target === selectedParticle) {
        return;
      }
      return event.target.material = sphereMaterial;
    }).on('click', function(event) {
      if (selectedParticle != null) {
        selectedParticle.material = sphereMaterial;
      }
      selectedParticle = event.target;
      return selectedParticle.material = sphereSelectedMaterial;
    });
    return tQuery('cylinder').on('mouseover', function(event) {
      return event.target.material = cylinderSelectedMaterial;
    }).on('mouseout', function(event) {
      return event.target.material = cylinderMaterial;
    }).on('mousedown', function(event) {
      event.target.p1.position.y += 10;
      return event.target.p2.position.y += 10;
    });
    /*
      tQuery(world.tScene()).on('click', (event) ->
        console.log('click on scene', event);
      )
    */

  };

  $(function() {
    var options;
    options = {
      cameraControls: true,
      stats: false
    };
    world = threeBox($("body").get(0), options);
    /*
      tQuery.createAmbientLight().addTo(world).color 0x444444
      tQuery.createDirectionalLight().addTo(world).position(-1, 1, 1).color(0xFF88BB).intensity 3
      tQuery.createDirectionalLight().addTo(world).position(1, 1, -1).color(0x4444FF).intensity 2
    */

    world.loop().hook(function(delta, now) {
      var c, _i, _len, _results;
      if (rigidbody != null) {
        rigidbody.calculate();
      }
      _results = [];
      for (_i = 0, _len = constraintObjects.length; _i < _len; _i++) {
        c = constraintObjects[_i];
        _results.push(alignCylinderToParticles(c, c.p1, c.p2));
      }
      return _results;
    });
    /*
      text1 = tQuery.createText("G")
      text1.material = cylinderMaterial
      world.add text1.scaleBy(10)
    */

    createScene();
    return world.start();
  });

}).call(this);
