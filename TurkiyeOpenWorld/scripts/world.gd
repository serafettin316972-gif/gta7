extends Node3D

const PlayerScript = preload("res://scripts/player.gd")
const VehicleScript = preload("res://scripts/vehicle.gd")
const NPCScript = preload("res://scripts/npc.gd")
var player
var hud: CanvasLayer
var info: Label
var money := 1250
var wanted := 0
var mission_stage := 0
var mission_reward := 750
var nearby_vehicle: CharacterBody3D
var shop_position := Vector3(8,0,-10)
var day_time := 12.0
var phone_open := false
var inventory_open := false
var e_was_down := false

func _ready() -> void:
	_setup_world()
	_spawn_player()
	_spawn_traffic()
	_spawn_npcs()
	_setup_hud()
	_load_game()

func _mat(color: Color, rough := 0.85) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = rough
	return material

func _box(parent: Node3D, pos: Vector3, size: Vector3, color: Color) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	node.mesh = mesh
	node.position = pos
	node.material_override = _mat(color)
	parent.add_child(node)
	return node

func _static_box(pos: Vector3, size: Vector3, color: Color) -> void:
	var body := StaticBody3D.new()
	body.position = pos
	add_child(body)
	_box(body, Vector3.ZERO, size, color)
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	collision.shape = shape
	body.add_child(collision)

func _setup_world() -> void:
	var world_environment := WorldEnvironment.new()
	var environment := Environment.new()
	environment.background_mode = Environment.BG_SKY
	environment.sky = Sky.new()
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color(0.72, 0.76, 0.82)
	environment.ambient_light_energy = 0.65
	environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	world_environment.environment = environment
	add_child(world_environment)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48, -35, 0)
	sun.light_energy = 1.15
	sun.shadow_enabled = true
	add_child(sun)
	_static_box(Vector3(0, -0.35, 0), Vector3(260, 0.6, 260), Color(0.28, 0.34, 0.29))
	for i in range(-5, 6):
		_static_box(Vector3(i * 24, 0.0, 0), Vector3(9, 0.12, 250), Color(0.105, 0.115, 0.12))
		_static_box(Vector3(0, 0.01, i * 24), Vector3(250, 0.12, 9), Color(0.105, 0.115, 0.12))
		for side in [-1, 1]:
			_static_box(Vector3(i * 24 + side * 6, 0.08, 0), Vector3(2, 0.22, 250), Color(0.52, 0.5, 0.45))
			_static_box(Vector3(0, 0.08, i * 24 + side * 6), Vector3(250, 0.22, 2), Color(0.52, 0.5, 0.45))
	for x in range(-5, 6):
		for z in range(-5, 6):
			var center := Vector3(x * 24 + 12, 0, z * 24 + 12)
			var height := randf_range(8, 27)
			var width := randf_range(8, 13)
			var depth := randf_range(8, 13)
			var palette := [Color(0.67, 0.58, 0.48), Color(0.72, 0.69, 0.61), Color(0.48, 0.52, 0.56), Color(0.78, 0.73, 0.63), Color(0.55, 0.43, 0.34)]
			_box(self, center + Vector3(0, height / 2, 0), Vector3(width, height, depth), palette[randi() % palette.size()])
			for floor_index in range(1, int(height / 3.0)):
				var y := floor_index * 3.0
				for side in [-1, 1]:
					_box(self, center + Vector3(side * (width / 2 + 0.025), y, 0), Vector3(0.07, 0.12, depth * 0.82), Color(0.32, 0.32, 0.31))
				for side_x in [-1, 1]:
					_box(self, center + Vector3(side_x * width * 0.23, y + 0.65, -depth / 2 - 0.035), Vector3(1.25, 1.15, 0.08), Color(0.16, 0.27, 0.34))
	_box(self, Vector3(0, -0.2, -132), Vector3(260, 0.2, 20), Color(0.12, 0.34, 0.48))
	_box(self, Vector3(-28, 0.08, 28), Vector3(17, 0.18, 18), Color(0.18, 0.38, 0.2))
	for i in range(18):
		var tree := Node3D.new()
		tree.position = Vector3(randf_range(-35, -21), 0, randf_range(20, 36))
		add_child(tree)
		_box(tree, Vector3(0, 1.5, 0), Vector3(0.35, 3, 0.35), Color(0.25, 0.16, 0.1))
		var crown := MeshInstance3D.new()
		var sphere := SphereMesh.new()
		crown.mesh = sphere
		crown.position.y = 3.5
		crown.scale = Vector3(1.5, 1.8, 1.5)
		crown.material_override = _mat(Color(0.12, 0.32, 0.16))
		tree.add_child(crown)
	var shop := Area3D.new()
	shop.position = shop_position + Vector3(0, 1, 0)
	shop.name = "Mahalle Marketi"
	add_child(shop)
	var shop_collision := CollisionShape3D.new()
	var shop_shape := BoxShape3D.new()
	shop_shape.size = Vector3(5, 3, 4)
	shop_collision.shape = shop_shape
	shop.add_child(shop_collision)
	_box(self, shop_position + Vector3(0, 1.8, -1), Vector3(5, 3.6, 0.45), Color(0.72, 0.57, 0.36))
	_box(self, shop_position + Vector3(0, 3.75, -1), Vector3(5.2, 0.45, 0.5), Color(0.72, 0.04, 0.04))
	var mosque := Node3D.new()
	mosque.position = Vector3(38, 0, -38)
	add_child(mosque)
	_box(mosque, Vector3(0, 2, 0), Vector3(12, 4, 10), Color(0.76, 0.72, 0.62))
	var dome := MeshInstance3D.new()
	var dome_mesh := SphereMesh.new()
	dome.mesh = dome_mesh
	dome.scale = Vector3(3.8, 2, 3.8)
	dome.position.y = 5
	dome.material_override = _mat(Color(0.55, 0.58, 0.56))
	mosque.add_child(dome)
	for x in [-5, 5]:
		var minaret := MeshInstance3D.new()
		var cylinder := CylinderMesh.new()
		cylinder.top_radius = 0.22
		cylinder.bottom_radius = 0.42
		cylinder.height = 13
		minaret.mesh = cylinder
		minaret.position = Vector3(x, 6.5, 0)
		minaret.material_override = _mat(Color(0.8, 0.76, 0.67))
		mosque.add_child(minaret)

func _spawn_player() -> void:
	player = PlayerScript.new()
	player.name = "AnaKarakter"
	player.position = Vector3(0, 1, 4)
	add_child(player)

func _spawn_traffic() -> void:
	for i in range(8):
		var car = VehicleScript.new()
		car.position = Vector3(randf_range(-90, 90), 0.2, randf_range(-90, 90))
		car.rotation.y = randf() * TAU
		add_child(car)

func _spawn_npcs() -> void:
	for i in range(24):
		var npc = NPCScript.new()
		npc.position = Vector3(randf_range(-80, 80), 0, randf_range(-80, 80))
		add_child(npc)

func _setup_hud() -> void:
	hud = CanvasLayer.new()
	add_child(hud)
	var panel := ColorRect.new()
	panel.position = Vector2(18, 16)
	panel.size = Vector2(300, 112)
	panel.color = Color(0.02, 0.025, 0.03, 0.78)
	hud.add_child(panel)
	info = Label.new()
	info.position = Vector2(32, 24)
	info.add_theme_font_size_override("font_size", 18)
	info.add_theme_color_override("font_color", Color(1, 1, 1))
	hud.add_child(info)
	var controls := Label.new()
	controls.text = "WASD Hareket  |  SHIFT Koş  |  SPACE Zıpla\nE Etkileşim / Araca bin  |  TAB Envanter\nP Telefon  |  M Harita  |  ESC Fareyi bırak"
	controls.position = Vector2(20, 620)
	controls.add_theme_font_size_override("font_size", 15)
	controls.add_theme_color_override("font_color", Color(1, 1, 1))
	hud.add_child(controls)
	var title := Label.new()
	title.text = "İSTANBUL  •  YENİ BİR HAYAT"
	title.position = Vector2(850, 22)
	title.add_theme_font_size_override("font_size", 22)
	title.add_theme_color_override("font_color", Color(1, 1, 1))
	hud.add_child(title)

func _process(delta: float) -> void:
	day_time = fmod(day_time + delta * 0.025, 24.0)
	if not is_instance_valid(player):
		return
	var time_text := "%02d:%02d" % [int(day_time), int(fposmod(day_time * 60, 60))]
	info.text = "₺ %s\nSağlık: %d   Aranma: %s\nSaat: %s\nGörev: Mahalle marketine git" % [str(money), player.health, "★".repeat(wanted), time_text]
	var near_car = null
	for child in get_children():
		if child is CharacterBody3D and child != player and child.get_script() == VehicleScript and child.global_position.distance_to(player.global_position) < 4.0:
			near_car = child
			break
	nearby_vehicle = near_car
	var e_down := Input.is_key_pressed(KEY_E)
	if e_down and not e_was_down:
		if player.driving:
			_exit_vehicle()
		elif near_car:
			_enter_vehicle(near_car)
		elif player.global_position.distance_to(shop_position) < 8.0:
			_shop_interaction()
		elif mission_stage == 0 and player.global_position.distance_to(Vector3(38, 0, -38)) < 9.0:
			_complete_mission()
	e_was_down = e_down

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_TAB:
			inventory_open = not inventory_open
			_popup("ENVANTER\nTelefon • Anahtar • Kozmetik\nŞimdilik temel envanter prototipi" if inventory_open else "")
		elif event.keycode == KEY_P:
			phone_open = not phone_open
			_popup("TELEFON\nHarita • Mesajlar • Görevler • Para: ₺%d" % money if phone_open else "")
		elif event.keycode == KEY_M:
			_popup("HARİTA\nMerkez: Başlangıç Meydanı\nKuzey: Sahil\nDoğu: Eski Mahalle\nGüney: Sanayi")
		elif event.keycode == KEY_F5:
			_save_game()
			_popup("Oyun kaydedildi.")
		elif event.keycode == KEY_F9:
			_load_game()
			_popup("Kayıt yüklendi.")

func _popup(message: String) -> void:
	var old = hud.get_node_or_null("Popup")
	if old:
		old.queue_free()
	if message.is_empty():
		return
	var panel := Panel.new()
	panel.name = "Popup"
	panel.position = Vector2(420, 230)
	panel.size = Vector2(440, 190)
	panel.modulate = Color(1, 1, 1, 0.96)
	hud.add_child(panel)
	var label := Label.new()
	label.text = message
	label.position = Vector2(20, 20)
	label.size = Vector2(400, 150)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.add_theme_font_size_override("font_size", 20)
	panel.add_child(label)

func _enter_vehicle(car) -> void:
	player.driving = true
	player.current_vehicle = car
	car.occupied = true
	car.driver = player
	player.visible = false
	_popup("Araca bindin. WASD sürüş, SPACE el freni, E in.")

func _exit_vehicle() -> void:
	var car = player.current_vehicle
	if is_instance_valid(car):
		car.occupied = false
		car.speed = 0
		player.global_position = car.global_position + car.global_transform.basis.x * 2.0
	player.driving = false
	player.current_vehicle = null
	player.visible = true
	_popup("Araçtan indin.")

func _shop_interaction() -> void:
	if money >= 100:
		money -= 100
		_popup("MAHALLE MARKETİ\nSu satın aldın: ₺100\nKalan para: ₺%d" % money)
	else:
		_popup("Yeterli paran yok.")

func _complete_mission() -> void:
	mission_stage = 1
	money += mission_reward
	_popup("GÖREV TAMAMLANDI\nMahalleye hoş geldin!\nÖdül: ₺%d" % mission_reward)

func _save_game() -> void:
	var data := {"money": money, "wanted": wanted, "mission_stage": mission_stage, "player_position": [player.global_position.x, player.global_position.y, player.global_position.z]}
	var file := FileAccess.open("user://savegame.json", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))

func _load_game() -> void:
	if not FileAccess.file_exists("user://savegame.json"):
		return
	var file := FileAccess.open("user://savegame.json", FileAccess.READ)
	if not file:
		return
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) == TYPE_DICTIONARY:
		money = int(parsed.get("money", money))
		wanted = int(parsed.get("wanted", 0))
		mission_stage = int(parsed.get("mission_stage", 0))
		var saved_position = parsed.get("player_position", [0, 1, 4])
		if saved_position.size() == 3:
			player.global_position = Vector3(saved_position[0], saved_position[1], saved_position[2])
