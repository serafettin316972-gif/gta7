extends CharacterBody3D
var speed := 0.0
var max_speed := 25.0
var occupied := false
var driver: Node3D

func _ready() -> void:
	var body := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = Vector3(1.9,0.75,3.6)
	body.mesh = mesh
	body.position.y = 0.75
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.12,0.18,0.24)
	body.material_override = mat
	add_child(body)
	var roof := MeshInstance3D.new()
	var rm := BoxMesh.new()
	rm.size = Vector3(1.45,0.65,1.7)
	roof.mesh = rm
	roof.position = Vector3(0,1.35,-0.1)
	roof.material_override = mat
	add_child(roof)
	for x in [-0.78,0.78]:
		for z in [-1.15,1.15]:
			var w := MeshInstance3D.new()
			var wm := CylinderMesh.new()
			wm.top_radius = 0.34
			wm.bottom_radius = 0.34
			wm.height = 0.18
			w.mesh = wm
			w.rotation.z = PI/2
			w.position = Vector3(x,0.38,z)
			var black := StandardMaterial3D.new()
			black.albedo_color = Color(0.025,0.025,0.03)
			w.material_override = black
			add_child(w)
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(1.9,1.5,3.6)
	collision.shape = shape
	collision.position.y = 0.75
	add_child(collision)

func _physics_process(delta: float) -> void:
	if not occupied:
		return
	var throttle := float(Input.is_key_pressed(KEY_W))-float(Input.is_key_pressed(KEY_S))
	var steer := float(Input.is_key_pressed(KEY_A))-float(Input.is_key_pressed(KEY_D))
	speed = move_toward(speed,throttle*max_speed,12.0*delta)
	if Input.is_key_pressed(KEY_SPACE):
		speed = move_toward(speed,0,22*delta)
	rotation.y += steer * sign(speed) * delta * clamp(abs(speed)/7.0,0.15,1.0)*1.4
	var forward: Vector3 = -global_transform.basis.z
	velocity.x = forward.x*speed
	velocity.z = forward.z*speed
	velocity.y -= 9.8*delta
	move_and_slide()
