(function() {
  var GravitySettings, SCREEN_HEIGHT, SCREEN_WIDTH, Settings, alignCylinderToParticles, animate, bevelEnabled, bevelSegments, bevelSize, bevelThickness, camera, cameraTarget, clock, color, composer, constraintObjects, container, createScene, createSnowflakes, createTextMesh, curveSegments, cylinderMaterial, decimalToHex, effectFXAA, font, glow, hblur, height, hex, hover, imgTexture2, init, material, materials, mirror, mouseX, mouseXOnMouseDown, onDocumentMouseDown, onDocumentMouseMove, onDocumentMouseOut, onDocumentMouseUp, onDocumentTouchMove, onDocumentTouchStart, onWindowResize, parameters, parent, postprocessing, render, renderTargetParameters, renderer, rigidbody, scene, selectedParticle, settings, size, snowflakeScene, sphereMaterial, stats, style, targetRotation, targetRotationOnMouseDown, text, textGeo, textMesh1, textMesh2, time, vblur, weight, windowHalfX, windowHalfY, world;

  if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
  }

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

  imgTexture2 = THREE.ImageUtils.loadTexture("./data/images/pine.jpg");

  imgTexture2.wrapS = imgTexture2.wrapT = THREE.RepeatWrapping;

  imgTexture2.anisotropy = 16;

  sphereMaterial = new THREE.MeshPhongMaterial({
    ambient: 0xFFFFFF,
    color: 0xAA0000,
    specular: 0x555555,
    shininess: 80
  });

  cylinderMaterial = new THREE.MeshPhongMaterial({
    map: imgTexture2,
    bumpMap: imgTexture2,
    bumpScale: 1,
    ambient: 0xFFFFFF,
    color: 0x00AA00,
    specular: 0x555555,
    shininess: 10
  });

  SCREEN_WIDTH = window.innerWidth;

  SCREEN_HEIGHT = window.innerHeight;

  container = void 0;

  stats = void 0;

  hex = void 0;

  color = void 0;

  camera = void 0;

  cameraTarget = void 0;

  scene = void 0;

  renderer = void 0;

  effectFXAA = void 0;

  textMesh1 = void 0;

  textMesh2 = void 0;

  textGeo = void 0;

  material = void 0;

  parent = void 0;

  text = "GOD JUL";

  height = 15;

  size = 50;

  hover = 30;

  curveSegments = 4;

  bevelThickness = 2;

  bevelSize = 1.5;

  bevelSegments = 3;

  bevelEnabled = true;

  font = "optimer";

  weight = "bold";

  style = "normal";

  mirror = true;

  targetRotation = 0;

  targetRotationOnMouseDown = 0;

  mouseX = 0;

  mouseXOnMouseDown = 0;

  windowHalfX = SCREEN_WIDTH / 2;

  windowHalfY = SCREEN_HEIGHT / 2;

  postprocessing = {
    enabled: false
  };

  glow = 0.9;

  hblur = null;

  vblur = null;

  renderTargetParameters = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBFormat,
    stencilBuffer: false
  };

  composer = null;

  time = 0;

  clock = new THREE.Clock();

  snowflakeScene = null;

  materials = [];

  parameters = null;

  decimalToHex = function(d) {
    hex = Number(d).toString(16);
    hex = "000000".substr(0, 6 - hex.length) + hex;
    return hex.toUpperCase();
  };

  init = function() {
    var bluriness, dirLight, plane, pointLight, renderModel, renderTarget;
    container = document.createElement("div");
    document.body.appendChild(container);
    camera = new THREE.PerspectiveCamera(30, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 1500);
    camera.position.set(0, 400, 700);
    cameraTarget = new THREE.Vector3(0, 150, 0);
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x112211, 250, 1400);
    dirLight = new THREE.DirectionalLight(0xffffff, 0.125);
    dirLight.position.set(0, 0, 1).normalize();
    scene.add(dirLight);
    pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(0, 100, 90);
    scene.add(pointLight);
    hex = decimalToHex(pointLight.color.getHex());
    material = new THREE.MeshFaceMaterial([
      new THREE.MeshPhongMaterial({
        color: 0xFF0000,
        shading: THREE.FlatShading
      }), new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        shading: THREE.SmoothShading
      })
    ]);
    parent = new THREE.Object3D();
    parent.position.y = 100;
    scene.add(parent);
    plane = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), new THREE.MeshBasicMaterial({
      color: 0x00BB00,
      opacity: 0.5,
      transparent: true
    }));
    plane.position.y = 0;
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);
    renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.setClearColor(scene.fog.color, 1);
    container.appendChild(renderer.domElement);
    renderer.autoClear = false;
    renderTarget = new THREE.WebGLRenderTarget(SCREEN_WIDTH, SCREEN_HEIGHT, renderTargetParameters);
    effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
    hblur = new THREE.ShaderPass(THREE.HorizontalTiltShiftShader);
    vblur = new THREE.ShaderPass(THREE.VerticalTiltShiftShader);
    bluriness = 2;
    hblur.uniforms["h"].value = bluriness / SCREEN_WIDTH;
    vblur.uniforms["v"].value = bluriness / SCREEN_HEIGHT;
    hblur.uniforms["r"].value = vblur.uniforms["r"].value = 0.5;
    effectFXAA.uniforms["resolution"].value.set(1 / SCREEN_WIDTH, 1 / SCREEN_HEIGHT);
    composer = new THREE.EffectComposer(renderer, renderTarget);
    renderModel = new THREE.RenderPass(scene, camera);
    vblur.renderToScreen = true;
    composer = new THREE.EffectComposer(renderer, renderTarget);
    composer.addPass(renderModel);
    composer.addPass(effectFXAA);
    composer.addPass(hblur);
    composer.addPass(vblur);
    stats = new Stats();
    stats.domElement.style.position = "absolute";
    stats.domElement.style.top = "0px";
    document.addEventListener("mousedown", onDocumentMouseDown, false);
    document.addEventListener("touchstart", onDocumentTouchStart, false);
    document.addEventListener("touchmove", onDocumentTouchMove, false);
    return window.addEventListener("resize", onWindowResize, false);
  };

  onWindowResize = function() {
    var bluriness, renderTarget;
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    windowHalfX = SCREEN_WIDTH / 2;
    windowHalfY = SCREEN_HEIGHT / 2;
    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderTarget = new THREE.WebGLRenderTarget(SCREEN_WIDTH, SCREEN_HEIGHT, renderTargetParameters);
    composer.reset(renderTarget);
    bluriness = 2;
    hblur.uniforms['h'].value = bluriness / SCREEN_WIDTH;
    vblur.uniforms['v'].value = bluriness / SCREEN_HEIGHT;
    return effectFXAA.uniforms['resolution'].value.set(1 / SCREEN_WIDTH, 1 / SCREEN_HEIGHT);
  };

  createTextMesh = function(text) {
    var centerOffset;
    textGeo = new THREE.TextGeometry(text, {
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
    textMesh1.position.y = -50;
    textMesh1.position.z = -height / 2;
    textMesh1.rotation.x = 0;
    textMesh1.rotation.y = Math.PI * 2;
    container = new THREE.Object3D();
    container.add(textMesh1);
    return container;
  };

  onDocumentMouseDown = function(event) {
    event.preventDefault();
    document.addEventListener("mousemove", onDocumentMouseMove, false);
    document.addEventListener("mouseup", onDocumentMouseUp, false);
    document.addEventListener("mouseout", onDocumentMouseOut, false);
    mouseXOnMouseDown = event.clientX - windowHalfX;
    return targetRotationOnMouseDown = targetRotation;
  };

  onDocumentMouseMove = function(event) {
    mouseX = event.clientX - windowHalfX;
    return targetRotation = targetRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.02;
  };

  onDocumentMouseUp = function(event) {
    document.removeEventListener("mousemove", onDocumentMouseMove, false);
    document.removeEventListener("mouseup", onDocumentMouseUp, false);
    return document.removeEventListener("mouseout", onDocumentMouseOut, false);
  };

  onDocumentMouseOut = function(event) {
    document.removeEventListener("mousemove", onDocumentMouseMove, false);
    document.removeEventListener("mouseup", onDocumentMouseUp, false);
    return document.removeEventListener("mouseout", onDocumentMouseOut, false);
  };

  onDocumentTouchStart = function(event) {
    if (event.touches.length === 1) {
      event.preventDefault();
      mouseXOnMouseDown = event.touches[0].pageX - windowHalfX;
      return targetRotationOnMouseDown = targetRotation;
    }
  };

  onDocumentTouchMove = function(event) {
    if (event.touches.length === 1) {
      event.preventDefault();
      mouseX = event.touches[0].pageX - windowHalfX;
      return targetRotation = targetRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.05;
    }
  };

  animate = function() {
    requestAnimationFrame(animate);
    render();
    return stats.update();
  };

  render = function() {
    var approxDistanceToCenter, c, delta, h, i, k, p, rotationDiff, snowflake, _i, _j, _k, _len, _ref, _ref1, _ref2;
    parent.rotation.y += (targetRotation - parent.rotation.y) * 0.05;
    rotationDiff = parent.rotation.y - targetRotation;
    _ref = rigidbody.particles;
    for (k in _ref) {
      p = _ref[k];
      approxDistanceToCenter = p.position.x;
      p.addForce(new THREE.Vector3(0, rotationDiff / 200, -(approxDistanceToCenter * rotationDiff) / 10000));
      if (p.textMesh != null) {
        p.textMesh.rotation.x = -p.position.z / 30;
      }
    }
    if (rigidbody != null) {
      rigidbody.calculate();
    }
    for (_i = 0, _len = constraintObjects.length; _i < _len; _i++) {
      c = constraintObjects[_i];
      alignCylinderToParticles(c, c.p1, c.p2);
    }
    delta = clock.getDelta();
    time = Date.now() * 0.00005;
    for (i = _j = 0, _ref1 = snowflakeScene.children.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
      snowflake = snowflakeScene.children[i];
      snowflake.rotation.y = time * (i < 4 ? i + 1 : -(i + 1));
    }
    for (i = _k = 0, _ref2 = materials.length; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; i = 0 <= _ref2 ? ++_k : --_k) {
      color = parameters[i][0];
      h = (360 * (color[0] + time) % 360) / 360;
      materials[i].color.setHSV(h, color[1], color[2]);
    }
    camera.lookAt(cameraTarget);
    return composer.render(delta);
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

  createSnowflakes = function() {
    var geometry, i, particles, sprite, sprite1, sprite2, sprite3, sprite4, sprite5, vertex, _i, _j, _ref;
    snowflakeScene = new THREE.Scene();
    sprite1 = THREE.ImageUtils.loadTexture("./data/images/sprites/snowflake1.png");
    sprite2 = THREE.ImageUtils.loadTexture("./data/images/sprites/snowflake2.png");
    sprite3 = THREE.ImageUtils.loadTexture("./data/images/sprites/snowflake3.png");
    sprite4 = THREE.ImageUtils.loadTexture("./data/images/sprites/snowflake4.png");
    sprite5 = THREE.ImageUtils.loadTexture("./data/images/sprites/snowflake5.png");
    geometry = new THREE.Geometry();
    for (i = _i = 0; _i < 500; i = ++_i) {
      vertex = new THREE.Vector3();
      vertex.x = Math.random() * 1000 - 500;
      vertex.y = Math.random() * 1000 - 500;
      vertex.z = Math.random() * 1000 - 500;
      geometry.vertices.push(vertex);
    }
    parameters = [[[1.0, 0.2, 1.0], sprite2, 20], [[0.95, 0.1, 1], sprite3, 15], [[0.90, 0.05, 1], sprite1, 10], [[0.85, 0, 0.8], sprite5, 8], [[0.80, 0, 0.7], sprite4, 5]];
    for (i = _j = 0, _ref = parameters.length; 0 <= _ref ? _j < _ref : _j > _ref; i = 0 <= _ref ? ++_j : --_j) {
      color = parameters[i][0];
      sprite = parameters[i][1];
      size = parameters[i][2];
      materials[i] = new THREE.ParticleBasicMaterial({
        size: size,
        map: sprite,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
      });
      materials[i].color.setHSV(color[0], color[1], color[2]);
      particles = new THREE.ParticleSystem(geometry, materials[i]);
      particles.rotation.x = Math.random() * 6;
      particles.rotation.y = Math.random() * 6;
      particles.rotation.z = Math.random() * 6;
      snowflakeScene.add(particles);
    }
    return parent.add(snowflakeScene);
  };

  createScene = function() {
    var createChristmasRope, createCylinderConstraint, createParticle, radius, rings, segments;
    radius = 6;
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
      cylinderRadius = 3;
      cylinderLength = length;
      cylinderGeo = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderLength, 6, 1, false);
      cylinder = new THREE.Mesh(cylinderGeo, cylinderMaterial);
      cylinder.p1 = p1;
      cylinder.p2 = p2;
      constraintObjects.push(cylinder);
      alignCylinderToParticles(cylinder, p1, p2);
      return cylinder;
    };
    createChristmasRope = function(ropeId, startVector, endVector, letters, breakLetter) {
      var constraint, constraintSettings, diff, endSegments, i, lastParticle, letter, letterId, letterMargin, letterParticle, particle, particleLetter, particleSettings, posVector, segmentCount, startSegments, textMesh, _i, _results;
      diff = (new THREE.Vector3()).sub(endVector, startVector);
      letterMargin = 3;
      letterId = 0;
      startSegments = 1;
      endSegments = 1;
      segmentCount = startSegments + letterMargin * letters.length + endSegments;
      particleLetter = startSegments + Math.ceil(letterMargin / 2);
      particle = null;
      lastParticle = null;
      _results = [];
      for (i = _i = 1; 1 <= segmentCount ? _i <= segmentCount : _i >= segmentCount; i = 1 <= segmentCount ? ++_i : --_i) {
        posVector = (new THREE.Vector3()).add(startVector, diff.clone().multiplyScalar((i - 1) / (segmentCount - 1)));
        particleSettings = {
          id: ropeId + 'particle' + i,
          position: posVector,
          mass: 1.0,
          immovable: i === 1 || i === segmentCount
        };
        particle = new Particle(particleSettings);
        rigidbody.addParticle(particle, createParticle);
        if (i === particleLetter && i + Math.floor(letterMargin / 2) + endSegments <= segmentCount) {
          particleSettings = {
            id: ropeId + 'particleLetter' + i,
            position: (new THREE.Vector3()).add(posVector, new THREE.Vector3(0, -40, 0)),
            mass: 10.0,
            immovable: false
          };
          letterParticle = new Particle(particleSettings);
          rigidbody.addParticle(letterParticle, createParticle);
          constraintSettings = {
            p1: particle,
            p2: letterParticle,
            strategy: letterId === breakLetter ? 'break' : 'default',
            broken: false,
            breakFactor: 1.08
          };
          constraint = new Constraint(constraintSettings);
          rigidbody.addConstraint(constraint, createCylinderConstraint);
          letter = letters[letterId];
          textMesh = createTextMesh(letter);
          textMesh.position = letterParticle.position;
          particle.textMesh = textMesh;
          parent.add(textMesh);
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
    createChristmasRope('first', new THREE.Vector3(-320, 230, 0), new THREE.Vector3(320, 230, 0), ['G', 'O', 'D', 'T'], 3);
    createChristmasRope('second', new THREE.Vector3(-300, 80, 0), new THREE.Vector3(300, 80, 0), ['H', 'J', 'U', 'L'], 0);
    parent.add(rigidbody.getScene());
    return createSnowflakes();
  };

  init();

  createScene();

  animate();

}).call(this);
