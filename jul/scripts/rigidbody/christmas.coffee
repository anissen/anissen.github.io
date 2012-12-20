
GravitySettings = ->
  @enabled = true
  @x = 0.0
  @y = -9.82
  @z = 0.0

Settings = ->
  @gravity = new GravitySettings()
  @running = true
  @

settings = new Settings()
selectedParticle = null

world = null
scene = null
rigidbody = new RigidBody settings
constraintObjects = []


#--------------------------------------------------

text = "GOD JUL"
height = 20 / 10
size = 70 / 10
hover = 30 / 10
curveSegments = 4 / 10
bevelThickness = 2 / 10
bevelSize = 1.5 / 10
bevelSegments = 3 / 10
bevelEnabled = true
font = "optimer" # helvetiker, optimer, gentilis, droid sans, droid serif
weight = "bold" # normal bold
style = "normal" # normal italic
mirror = true

material = new THREE.MeshFaceMaterial( [
  new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.FlatShading } ), # front
  new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.SmoothShading } ) # side
] );

createText = ->
  textGeo = new THREE.TextGeometry('GOD JUL',
    size: size
    height: height
    curveSegments: curveSegments
    font: font
    weight: weight
    style: style
    bevelThickness: bevelThickness
    bevelSize: bevelSize
    bevelEnabled: bevelEnabled
    material: 0
    extrudeMaterial: 1
  )
  textGeo.computeBoundingBox()
  textGeo.computeVertexNormals()
  centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x)
  textMesh1 = new THREE.Mesh(textGeo, material)
  textMesh1.position.x = centerOffset
  textMesh1.position.y = hover
  textMesh1.position.z = 0
  textMesh1.rotation.x = 0
  textMesh1.rotation.y = Math.PI * 2
  world.add textMesh1
  if mirror
    textMesh2 = new THREE.Mesh(textGeo, material)
    textMesh2.position.x = centerOffset
    textMesh2.position.y = -hover
    textMesh2.position.z = height
    textMesh2.rotation.x = Math.PI
    textMesh2.rotation.y = Math.PI * 2
    world.add textMesh2

#--------------------------------------------------


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
)

cylinderSelectedMaterial = new THREE.MeshBasicMaterial(
  color: 0x00CC00
)

createScene = () ->
  # SCENE
  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x000000, 250, 1400)

  # LIGHTS
  dirLight = new THREE.DirectionalLight(0xffffff, 0.125)
  dirLight.position.set(0, 0, 1).normalize()
  scene.add dirLight

  pointLight = new THREE.PointLight(0xffffff, 1.5)
  pointLight.position.set 0, 100, 90
  scene.add pointLight

  pointLight.color.setHSV Math.random(), 0.95, 0.85

  radius = 1.5
  segments = 8
  rings = 8

  createParticle = (p) ->
    sphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, segments, rings),
      sphereMaterial)
    sphereMesh.position = p.position
    sphereMesh

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

  createChristmasRope = (startVector, endVector, letters) ->
    diff = (new THREE.Vector3()).sub(endVector, startVector)
    letterMargin = 3
    letterId = 0
    segmentCount = letterMargin + letterMargin * letters.length + letterMargin
    particleLetter = letterMargin + Math.ceil(letterMargin / 2)
    particle = null
    lastParticle = null
    for i in [1..segmentCount]
      posVector = (new THREE.Vector3()).add(startVector, diff.clone().multiplyScalar(i / segmentCount))
      particleSettings =
        id: 'particle' + i
        position: posVector
        mass: 3.0
        immovable: (i is 1 or i is segmentCount)
      particle = new Particle particleSettings
      rigidbody.addParticle particle, createParticle

      if i is particleLetter and i + Math.floor(letterMargin / 2) + letterMargin <= segmentCount
        particleSettings =
          id: 'particleLetter' + i
          position: (new THREE.Vector3()).add(posVector, new THREE.Vector3(0, -15, 0))
          mass: 15.0
          immovable: false
        letterParticle = new Particle particleSettings
        rigidbody.addParticle letterParticle, createParticle

        constraintSettings =
          p1: particle
          p2: letterParticle
        constraint = new Constraint constraintSettings
        rigidbody.addConstraint constraint, createCylinderConstraint

        text = tQuery.createText letters[letterId]
        text.position = letterParticle.position.clone()
        text.scaleBy(10)
        world.add text
        console.log text.position

        letterId++
        particleLetter += letterMargin


      if lastParticle?
        constraintSettings =
          p1: lastParticle
          p2: particle
        constraint = new Constraint constraintSettings
        rigidbody.addConstraint constraint, createCylinderConstraint
      lastParticle = particle

  createChristmasRope (new THREE.Vector3(-70, 70, 0)), (new THREE.Vector3(70, 70, 0)), ['G', 'O', 'D']

  scene.add rigidbody.getScene()

  createText()

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
      selectedParticle?.material = sphereMaterial

      selectedParticle = event.target
      selectedParticle.material = sphereSelectedMaterial
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
  world = threeBox($("body").get(0), options)
  ###
  tQuery.createAmbientLight().addTo(world).color 0x444444
  tQuery.createDirectionalLight().addTo(world).position(-1, 1, 1).color(0xFF88BB).intensity 3
  tQuery.createDirectionalLight().addTo(world).position(1, 1, -1).color(0x4444FF).intensity 2
  ###
  world.loop().hook((delta, now) ->
    rigidbody?.calculate()
    for c in constraintObjects
      alignCylinderToParticles(c, c.p1, c.p2)
  )

  ###
  text1 = tQuery.createText("G")
  text1.material = cylinderMaterial
  world.add text1.scaleBy(10)
  ###

  createScene()

  world.start()

