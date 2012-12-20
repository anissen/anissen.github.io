v = (x, y, z) ->
  new THREE.Vector3(x, y, z)

GravitySettings = ->
  @enabled = true
  @x = 0.0
  @y = -9.82
  @z = 0.0

Settings = ->
  @gravity = new GravitySettings()
  @explode = -> alert 'Bang!'
  @running = false
  @

ParticleSettings = ->
  @x = 0.0
  @y = 0.0
  @z = 0.0
  @

window.settings = settings = new Settings()
particleSettings = new ParticleSettings()
gui = null
particleFolder = null

selectedParticle = null

world = null
scene = null
rigidbody = new RigidBody settings
constraintObjects = []
window.cylinder = cylinder = null

alignCylinderToParticles = (cylinder, p1, p2) ->
  length = p1.position.distanceTo(p2.position)
  v = new THREE.Vector3()
  v = v.sub(p2.position, p1.position)
  center = v.clone().add(p1.position, v.clone().divideScalar(2))
  cylinder.position = center

  z = new THREE.Vector3(0,1,0)

  # Get CROSS product (the axis of rotation)
  t = z.clone().cross(z, v)

  # Get angle. length is magnitude of the vector
  angle = Math.acos(z.dot(v) / length)

  rotObjectMatrix = new THREE.Matrix4()
  rotObjectMatrix.makeRotationAxis(t.normalize(), angle)
  cylinder.matrix = new THREE.Matrix4()
  cylinder.matrix.multiplySelf(rotObjectMatrix)      # post-multiply
  cylinder.rotation.setEulerFromRotationMatrix(cylinder.matrix)

sphereMaterial = new THREE.MeshLambertMaterial(
  ambient: 0xFFFFFF
  color: 0x0000FF
)

sphereSelectedMaterial = new THREE.MeshLambertMaterial(
  ambient: 0xFFFFFF
  color: 0x00CC00
)

cylinderMaterial = new THREE.MeshBasicMaterial(
  color: 0xFF0000
  opacity: 0.5
)

cylinderSelectedMaterial = new THREE.MeshBasicMaterial(
  color: 0x00CC00
)

readJson = (data) ->
  if scene? then world.remove scene

  scene = new THREE.Scene()
  world.add scene

  radius = 1.0 #0.015
  segments = 8
  rings = 8

  lineMat = new THREE.LineBasicMaterial(
    ambient: 0xFFFFFF
    color: 0xFF0000
    lineWidth: 1
  )

  createParticle = (p) ->
    sphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, segments, rings),
      sphereMaterial)
    sphereMesh.position = p.position
    sphereMesh

  ###
  createLineConstraint = (c, p1, p2) ->
    lineGeo = new THREE.Geometry()
    lineGeo.vertices.push p1.position, p2.position
    lineGeo.dynamic = true
    constraintObjects.push lineGeo
    new THREE.Line(lineGeo, lineMat)
  ###

  createCylinderConstraint = (c, p1, p2) ->
    length = p1.position.distanceTo(p2.position)

    #THREE.CylinderGeometry = function ( radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded )
    cylinderRadius = 0.5
    cylinderLength = length
    cylinderGeo = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderLength, 6, 1, false)
    cylinder = new THREE.Mesh(cylinderGeo, cylinderMaterial)
    cylinder.p1 = p1
    cylinder.p2 = p2
    constraintObjects.push cylinder

    alignCylinderToParticles(cylinder, p1, p2)

    cylinder


  rigidbody.load data, createParticle, createCylinderConstraint
  scene.add rigidbody.getScene()

  world.enableDomEvent()

  # bind some event on it
  tQuery('sphere')
    .on('mouseover', (event) ->
      event.target.material = sphereSelectedMaterial
    )
    .on('mouseout', (event) ->
      return if event.target is selectedParticle
      event.target.material = sphereMaterial
    )
    .on('click', (event) ->
      #console.log event.target.position
      #console.log particleSettings.x
      selectedParticle?.material = sphereMaterial

      selectedParticle = event.target
      selectedParticle.material = sphereSelectedMaterial
      particleFolder.open()
    )


  tQuery('cylinder')
    .on('mouseover', (event) ->
      event.target.material = cylinderSelectedMaterial
    )
    .on('mouseout', (event) ->
      event.target.material = cylinderMaterial
    )
    .on('mousedown', (event) ->
      event.target.p1.position.y += 10
      event.target.p2.position.y += 10
    )

  ###
  tQuery(world.tScene()).on('click', (event) ->
    console.log('click on scene', event);
  )
  ###

$ ->
  options =
    cameraControls: true
    stats: false

  #world = threeBox($("#three-placeholder").get(0), options)
  world = threeBox($("body").get(0), options)

  groundSize = 150
  tiles = 10
  groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, tiles, tiles)
  groundMesh = new THREE.Mesh(groundGeo, new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true }))
  groundMesh.rotation.x -= Math.PI / 2
  world.add groundMesh

  cubeGeometry = new THREE.CubeGeometry(groundSize, groundSize, groundSize)
  cubeMaterial = new THREE.MeshBasicMaterial({color: 0x0000ff, wireframe: true})
  cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
  cube.position.y += groundSize / 2
  world.add cube


  ###
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
  ###

  tQuery.createAmbientLight().addTo(world).color 0x444444
  tQuery.createDirectionalLight().addTo(world).position(-1, 1, 1).color(0xFF88BB).intensity 3
  tQuery.createDirectionalLight().addTo(world).position(1, 1, -1).color(0x4444FF).intensity 2

  world.loop().hook((delta, now) ->
    rigidbody?.calculate()
    for c in constraintObjects
      alignCylinderToParticles(c, c.p1, c.p2)

    if selectedParticle?
      particleSettings.x = selectedParticle.position.x
      particleSettings.y = selectedParticle.position.y
      particleSettings.z = selectedParticle.position.z

    for controller in particleFolder.__controllers
      controller.updateDisplay()
  )

  #world.add tQuery.createText("G").scaleBy(10)

  world.start()



  $.ajax(
    url: 'data/rigidbodies/hitman.json',
    dataType: 'JSON',
    type: 'GET'
  )
  .done((data) -> readJson(data))
  .fail((err) -> alert('Error!!1! ' + err))

  gui = new dat.GUI()
  optionsFolder = gui.addFolder('Options')
  optionsFolder.add settings, 'running'
  optionsFolder.open()

  gravityFolder = gui.addFolder('Gravity')
  gravityFolder.add settings.gravity, 'enabled'
  gravityFolder.add(settings.gravity, 'x', -20.0, 20.0).step(0.1)
  gravityFolder.add(settings.gravity, 'y', -20.0, 20.0)
  gravityFolder.add(settings.gravity, 'z', -20.0, 20.0)
  gravityFolder.open()

  particleFolder = gui.addFolder('Particle')
  particleFolder.add(particleSettings, 'x').onChange((value) -> selectedParticle?.position.x = value)
  particleFolder.add(particleSettings, 'y').onChange((value) -> selectedParticle?.position.y = value)
  particleFolder.add(particleSettings, 'z').onChange((value) -> selectedParticle?.position.z = value)

handleDnD = (files) ->
  f = files[0]
  #alert "Not a JSON file!"  unless f.type.match("application/json")
  reader = new FileReader()
  reader.onloadend = (e) ->
    result = JSON.parse(@result)
    readJson result

  reader.readAsText f

dnd = new DnDFileController "body", handleDnD
