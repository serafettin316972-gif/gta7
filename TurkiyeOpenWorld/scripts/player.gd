extends CharacterBody3D

@export var walk_speed := 5.2
@export var run_speed := 8.4
@export var jump_velocity := 4.5
var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
var camera_pivot: Node3D
var camera: Camera3D
var visual: Node3D
var driving := false
var current_vehicle: CharacterBody3D
var health := 100

func _ready() -> void:
	_build_character()
	var collision := CollisionShape3D.new()
	var shape := CapsuleShape3D.new()
	shape.radius = 0.34
	shape.height = 2.0
	collision.shape = shape
	collision.position.y = 1.0
	add_child(collision)
	camera_pivot = Node3D.new()
	camera_pivot.position = Vector3(0, 1.55, 0)
	add_child(camera_pivot)
	camera = Camera3D.new()
	camera.position = Vector3(0, 2.2, 6.0)
	camera.rotation_degrees.x = -13
	camera.current = true
	camera_pivot.add_child(camera)
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _build_character() -> void:
	visual = Node3D.new()
	add_child(visual)
	_add_capsule(visual, Vector3(0, 1.0, 0), Vector3(0.48, 1.0, 0.28), Color(0.035,0.04,0.05))
	_add_box(visual, Vector3(0, 1.48, 0), Vector3(0.48,0.58,0.28), Color(0.025,0.03,0.04))
	_add_box(visual, Vector3(0, 1.52, -0.151), Vector3(0.30,0.42,0.018), Color(0.83,0.82,0.77))
	_add_capsule(visual, Vector3(-0.31,1.42,0), Vector3(0.13,0.53,0.13), Color(0.025,0.03,0.04))
	_add_capsule(visual, Vector3(0.31,1.42,0), Vector3(0.13,0.53,0.13), Color(0.025,0.03,0.04))
	_add_box(visual, Vector3(-0.31,1.45,-0.136), Vector3(0.055,0.52,0.018), Color(0.9,0.9,0.88))
	_add_box(visual, Vector3(0.31,1.45,-0.136), Vector3(0.055,0.52,0.018), Color(0.9,0.9,0.88))
	_add_capsule(visual, Vector3(-0.13,0.48,0), Vector3(0.14,0.48,0.15), Color(0.025,0.03,0.04))
	_add_capsule(visual, Vector3(0.13,0.48,0), Vector3(0.14,0.48,0.15), Color(0.025,0.03,0.04))
	_add_box(visual, Vector3(-0.13,0.08,-0.045), Vector3(0.18,0.12,0.30), Color(0.92,0.92,0.88))
	_add_box(visual, Vector3(0.13,0.08,-0.045), Vector3(0.18,0.12,0.30), Color(0.92,0.92,0.88))
	_add_capsule(visual, Vector3(0,2.05,0), Vector3(0.34,0.39,0.29), Color(0.66,0.46,0.34))
	_add_sphere(visual, Vector3(0,2.43,0.02), Vector3(0.34,0.19,0.30), Color(0.055,0.045,0.04))
	_add_box(visual, Vector3(0,2.16,-0.286), Vector3(0.40,0.055,0.035), Color(0.055,0.035,0.025))
	_add_sphere(visual, Vector3(-0.12,2.10,-0.28), Vector3(0.035,0.025,0.018), Color(0.08,0.08,0.07))
	_add_sphere(visual, Vector3(0.12,2.10,-0.28), Vector3(0.035,0.025,0.018), Color(0.08,0.08,0.07))
	_add_box(visual, Vector3(0,1.82,-0.16), Vector3(0.18,0.025,0.018), Color(0.72,0.72,0.68))
	_add_box(visual, Vector3(0.20,1.64,-0.16), Vector3(0.10,0.07,0.012), Color(0.75,0.03,0.035))
	_add_sphere(visual, Vector3(0.20,1.64,-0.174), Vector3(0.018,0.018,0.008), Color(1,1,1))

func _add_box(parent: Node3D, pos: Vector3, size: Vector3, color: Color) -> void:
	var mesh := BoxMesh.new()
	mesh.size = size
	var node := MeshInstance3D.new()
	node.mesh = mesh
	node.position = pos
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = 0.82
	node.material_override = mat
	parent.add_child(node)

func _add_capsule(parent: Node3D, pos: Vector3, scale_v: Vector3, color: Color) -> void:
	var mesh := CapsuleMesh.new()
	var node := MeshInstance3D.new()
	node.mesh = mesh
	node.position = pos
	node.scale = scale_v
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	node.material_override = mat
	parent.add_child(node)

func _add_sphere(parent: Node3D, pos: Vector3, scale_v: Vector3, color: Color) -> void:
	var node := MeshInstance3D.new()
	node.mesh = SphereMesh.new()
	node.position = pos
	node.scale = scale_v
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color
	node.material_override = mat
	parent.add_child(node)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED and not driving:
		rotate_y(-event.relative.x * 0.0025)
		camera_pivot.rotate_x(-event.relative.y * 0.002)
		camera_pivot.rotation.x = clamp(camera_pivot.rotation.x, -0.65, 0.35)
	if event.is_action_pressed("ui_cancel"):
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED else Input.MOUSE_MODE_CAPTURED

func _physics_process(delta: float) -> void:
	if driving and is_instance_valid(current_vehicle):
		global_position = current_vehicle.global_position + Vector3(0,1.0,0)
		rotation.y = current_vehicle.rotation.y
		return
	var input_dir := Vector2.ZERO
	input_dir.x = float(Input.is_key_pressed(KEY_D)) - float(Input.is_key_pressed(KEY_A))
	input_dir.y = float(Input.is_key_pressed(KEY_S)) - float(Input.is_key_pressed(KEY_W))
	input_dir = input_dir.normalized()
	var direction := (transform.basis * Vector3(input_dir.x,0,input_dir.y)).normalized()
	var speed := run_speed if Input.is_key_pressed(KEY_SHIFT) else walk_speed
	if direction.length_squared() > 0.0001:
		velocity.x = direction.x * speed
		velocity.z = direction.z * speed
		visual.rotation.y = lerp_angle(visual.rotation.y, atan2(-direction.x,-direction.z)-rotation.y, delta*10.0)
	else:
		velocity.x = move_toward(velocity.x,0,18*delta)
		velocity.z = move_toward(velocity.z,0,18*delta)
	if not is_on_floor():
		velocity.y -= gravity * delta
	elif Input.is_key_pressed(KEY_SPACE):
		velocity.y = jump_velocity
	move_and_slide()
