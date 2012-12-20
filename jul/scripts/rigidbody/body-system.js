(function() {
  var GravitySettings, ParticleSettings, Settings, alignCylinderToParticles, constraintObjects, cylinder, cylinderMaterial, cylinderSelectedMaterial, dnd, gui, handleDnD, particleFolder, particleSettings, readJson, rigidbody, scene, selectedParticle, settings, sphereMaterial, sphereSelectedMaterial, v, world;

  v = function(x, y, z) {
    return new THREE.Vector3(x, y, z);
  };

  GravitySettings = function() {
    this.enabled = true;
    this.x = 0.0;
    this.y = -9.82;
    return this.z = 0.0;
  };

  Settings = function() {
    this.gravity = new GravitySettings();
    this.explode = function() {
      return alert('Bang!');
    };
    this.running = false;
    return this;
  };

  ParticleSettings = function() {
    this.x = 0.0;
    this.y = 0.0;
    this.z = 0.0;
    return this;
  };

  window.settings = settings = new Settings();

  particleSettings = new ParticleSettings();

  gui = null;

  particleFolder = null;

  selectedParticle = null;

  world = null;

  scene = null;

  rigidbody = new RigidBody(settings);

  constraintObjects = [];

  window.cylinder = cylinder = null;

  alignCylinderToParticles = function(cylinder, p1, p2) {
    var angle, center, length, rotObjectMatrix, t, z;
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
    color: 0xFF0000,
    opacity: 0.5
  });

  cylinderSelectedMaterial = new THREE.MeshBasicMaterial({
    color: 0x00CC00
  });

  readJson = function(data) {
    var createCylinderConstraint, createParticle, lineMat, radius, rings, segments;
    if (scene != null) {
      world.remove(scene);
    }
    scene = new THREE.Scene();
    world.add(scene);
    radius = 1.0;
    segments = 8;
    rings = 8;
    lineMat = new THREE.LineBasicMaterial({
      ambient: 0xFFFFFF,
      color: 0xFF0000,
      lineWidth: 1
    });
    createParticle = function(p) {
      var sphereMesh;
      sphereMesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, rings), sphereMaterial);
      sphereMesh.position = p.position;
      return sphereMesh;
    };
    /*
      createLineConstraint = (c, p1, p2) ->
        lineGeo = new THREE.Geometry()
        lineGeo.vertices.push p1.position, p2.position
        lineGeo.dynamic = true
        constraintObjects.push lineGeo
        new THREE.Line(lineGeo, lineMat)
    */

    createCylinderConstraint = function(c, p1, p2) {
      var cylinderGeo, cylinderLength, cylinderRadius, length;
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
    rigidbody.load(data, createParticle, createCylinderConstraint);
    scene.add(rigidbody.getScene());
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
      selectedParticle.material = sphereSelectedMaterial;
      return particleFolder.open();
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
    var cube, cubeGeometry, cubeMaterial, gravityFolder, groundGeo, groundMesh, groundSize, options, optionsFolder, tiles;
    options = {
      cameraControls: true,
      stats: false
    };
    world = threeBox($("body").get(0), options);
    groundSize = 150;
    tiles = 10;
    groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, tiles, tiles);
    groundMesh = new THREE.Mesh(groundGeo, new THREE.MeshBasicMaterial({
      color: 0x555555,
      wireframe: true
    }));
    groundMesh.rotation.x -= Math.PI / 2;
    world.add(groundMesh);
    cubeGeometry = new THREE.CubeGeometry(groundSize, groundSize, groundSize);
    cubeMaterial = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      wireframe: true
    });
    cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.y += groundSize / 2;
    world.add(cube);
    /*
      lineLengthHalf = groundSize / 2
      lineGeo = new THREE.Geometry()
      lineGeo.vertices.push new THREE.Vector3(-lineLengthHalf, 0, 0),
                            new THREE.Vector3(lineLengthHalf, 0, 0),
                            new THREE.Vector3(0, -lineLengthHalf, 0),
                            new THREE.Vector3(0, lineLengthHalf, 0),
                            new THREE.Vector3(0, 0, -lineLengthHalf),
                            new THREE.Vector3(0, 0, lineLengthHalf)
      lineMat = new THREE.LineBasicMaterial(
        color: 0x000000
        lineWidth: 2
      )
      line = new THREE.Line(lineGeo, lineMat)
      line.type = THREE.Lines
      world.add line
    */

    tQuery.createAmbientLight().addTo(world).color(0x444444);
    tQuery.createDirectionalLight().addTo(world).position(-1, 1, 1).color(0xFF88BB).intensity(3);
    tQuery.createDirectionalLight().addTo(world).position(1, 1, -1).color(0x4444FF).intensity(2);
    world.loop().hook(function(delta, now) {
      var c, controller, _i, _j, _len, _len1, _ref, _results;
      if (rigidbody != null) {
        rigidbody.calculate();
      }
      for (_i = 0, _len = constraintObjects.length; _i < _len; _i++) {
        c = constraintObjects[_i];
        alignCylinderToParticles(c, c.p1, c.p2);
      }
      if (selectedParticle != null) {
        particleSettings.x = selectedParticle.position.x;
        particleSettings.y = selectedParticle.position.y;
        particleSettings.z = selectedParticle.position.z;
      }
      _ref = particleFolder.__controllers;
      _results = [];
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        controller = _ref[_j];
        _results.push(controller.updateDisplay());
      }
      return _results;
    });
    world.start();
    $.ajax({
      url: 'data/rigidbodies/hitman.json',
      dataType: 'JSON',
      type: 'GET'
    }).done(function(data) {
      return readJson(data);
    }).fail(function(err) {
      return alert('Error!!1! ' + err);
    });
    gui = new dat.GUI();
    optionsFolder = gui.addFolder('Options');
    optionsFolder.add(settings, 'running');
    optionsFolder.open();
    gravityFolder = gui.addFolder('Gravity');
    gravityFolder.add(settings.gravity, 'enabled');
    gravityFolder.add(settings.gravity, 'x', -20.0, 20.0).step(0.1);
    gravityFolder.add(settings.gravity, 'y', -20.0, 20.0);
    gravityFolder.add(settings.gravity, 'z', -20.0, 20.0);
    gravityFolder.open();
    particleFolder = gui.addFolder('Particle');
    particleFolder.add(particleSettings, 'x').onChange(function(value) {
      return selectedParticle != null ? selectedParticle.position.x = value : void 0;
    });
    particleFolder.add(particleSettings, 'y').onChange(function(value) {
      return selectedParticle != null ? selectedParticle.position.y = value : void 0;
    });
    return particleFolder.add(particleSettings, 'z').onChange(function(value) {
      return selectedParticle != null ? selectedParticle.position.z = value : void 0;
    });
  });

  handleDnD = function(files) {
    var f, reader;
    f = files[0];
    reader = new FileReader();
    reader.onloadend = function(e) {
      var result;
      result = JSON.parse(this.result);
      return readJson(result);
    };
    return reader.readAsText(f);
  };

  dnd = new DnDFileController("body", handleDnD);

}).call(this);
