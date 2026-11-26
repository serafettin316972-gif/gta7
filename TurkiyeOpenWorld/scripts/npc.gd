extends CharacterBody3D
var origin: Vector3
var phase := 0.0

func _ready() -> void:
	origin = global_position
	phase = randf()*TAU
	var mesh := CapsuleMesh.new()
	var body := MeshInstance3D.new()
	body.mesh = mesh
	body.position.y = 0.9
	body.scale = Vector3(0.32,0.9,0.32)
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(randf_range(0.25,0.75),randf_range(0.2,0.65),randf_range(0.18,0.55))
	body.material_override = mat
	add_child(body)
	var col := CollisionShape3D.new()
	var shape := CapsuleShape3D.new()
	shape.radius = 0.3
	shape.height = 1.8
	col.shape = shape
	col.position.y = 0.9
	add_child(col)

func _physics_process(delta: float) -> void:
	phase += delta*0.22
	var target := origin+Vector3(sin(phase)*4,0,cos(phase*0.7)*4)
	var d := target-global_position
	if d.length() > 0.5:
		velocity.x = d.normalized().x*1.1
		velocity.z = d.normalized().z*1.1
		rotation.y = atan2(-velocity.x,-velocity.z)
	else:
		velocity.x = move_toward(velocity.x,0,delta)
		velocity.z = move_toward(velocity.z,0,delta)
	if not is_on_floor():
		velocity.y -= 9.8*delta
	move_and_slide()
