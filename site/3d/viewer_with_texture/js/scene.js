/**
* Created by Adi Levin on 10/31/2014.
*/

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
var rendering_contexts;
var stats;
var materials;
var cur_material_index = 0;

function toggle_occlusogram() {
    cur_material_index = (cur_material_index + 1) % materials.length;
    update_color_legend_visibility();
    for (i = 0; i < rendering_contexts.length; ++i)
        rendering_contexts[i].set_material_to_all_meshes(materials[cur_material_index]);
}

function update_color_legend_visibility()
{
    var btn = $('#occlusogram_button')
    if (cur_material_index==1) {
        $('#color-legend').show();
    } else {
        $('#color-legend').hide();
    }
}


function createOcclusogramTexture() {
    var imageCanvas = document.createElement("canvas"),
        context = imageCanvas.getContext("2d");

    var pixels_per_color = 10;
    var palette = [
        'rgba(255,0,0,1.0)', // 0-0.2
        'rgba(255,165,0,1.0)', // 0.2-0.4
        'rgba(255,255,0,1.0)', // 0.4-0.6
        'rgba(0,255,0,1.0)', // 0.6-0.8
        'rgba(0,255,255,1.0)', // 0.8-1.0
        'rgba(100,149,237,1.0)', // 1.0-1.2
        'rgba(255,0,255,1.0)', // 1.2-1.4
        'rgba(255,255,255,1.0)', // 1.4-1.6
        'rgba(255,255,255,1.0)', // 1.6-1.8
        'rgba(255,255,255,1.0)', // 1.6-2.0
     ];

    imageCanvas.width = pixels_per_color * palette.length
    imageCanvas.height = 1;

    for (var i = 0; i < palette.length; ++i) {
        context.fillStyle = palette[i];
        context.fillRect(pixels_per_color * i, 0, pixels_per_color, imageCanvas.height);
    }

    var textureCanvas = new THREE.Texture(imageCanvas,
        THREE.UVMapping,
        THREE.RepeatWrapping,THREE.RepeatWrapping,
        THREE.LinearFilter,
        THREE.RGBAFormat);

    textureCanvas.needsUpdate = true;

    return textureCanvas;
}

function createMaterials() {
    var material_list = [
        new THREE.MeshPhongMaterial({
            ambient: 0x555555,
            color: 0xAAAAAA,
            specular: 0x111111,
            shininess: 200 }),
        new THREE.MeshPhongMaterial({
            ambient: 0x555555,
            color: 0xAAAAAA,
            specular: 0x111111,
            shininess: 200,
            map: createOcclusogramTexture()})
        ];
    return material_list;
}

function createDirectionalLight( x, y, z, color, intensity ) {
    var directionalLight = new THREE.DirectionalLight( color, intensity );
    directionalLight.position.set( x, y, z );
    return directionalLight;
}

function createEmptyScene() {
    var scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xdddddd));
    scene.add(createDirectionalLight(1, 1, 1, 0xffffff, 1));
    scene.add(createDirectionalLight(-1, -1, -0.5, 0xffffff, 1));
    return scene;
}

function createRenderer(container) {
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x02040b);
    return renderer;
}

function createTrackballControls (camera, renderer, render_function) {
    var controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    controls.keys = [ 65, 83, 68 ];
    controls.addEventListener('change', render_function);
    return controls;
}

function createCamera(container) {
    var camera = new THREE.PerspectiveCamera(25, container.clientWidth / container.clientHeight, 1, 1500);
    camera.position.set(0, 0, 100);
    return camera;
}

function createStats() {
    stats = new Stats();
    stats.domElement.className = 'stats';
    $("body").append(stats.domElement);
}

function RenderingContext(dom_element_id)
{
    this.container = document.getElementById(dom_element_id);
    this.camera = createCamera(this.container);
    this.scene = createEmptyScene();
    this.renderer = createRenderer(this.container);
    this.meshes = []

    /*
    This is here for testing the texture:

    var geometry = new THREE.PlaneBufferGeometry( 1, 1 );
    var mesh = new THREE.Mesh( geometry, materials[1] );
    mesh.scale.set( 20, 20, 20 );
    this.scene.add(mesh);*/

    this.render = function() {
        this.renderer.render(this.scene, this.camera);
        stats.update();
    };
    this.container.appendChild(this.renderer.domElement);

    this.set_material_to_all_meshes = function(material) {
        for(var i=0;i<this.meshes.length;++i)
            this.meshes[i].material = material;
        this.render();
    }

    this.loadSTL = function(filename,onLoad) {
        var loader = new THREE.STLLoader();
        var that = this;
        loader.addEventListener('load', function (event) {
            var geometry = event.content;
            var mesh = new THREE.Mesh(geometry, materials[cur_material_index]);
            that.meshes.push(mesh);
            onLoad(mesh);
        });
        loader.load(filename);
    };

    this.loadOBJ = function(filename,onLoad) {
        var loader = new THREE.OBJLoader();
        var that = this;
        loader.load(filename,function (meshes_container) {
            meshes_container.traverse( function ( mesh ) {
			    if ( mesh instanceof THREE.Mesh ) {
				    mesh.material = materials[cur_material_index];
                    that.meshes.push(mesh);
                    onLoad(mesh);
				}
			} );
            //onLoad(meshes_container);
        });
    };

    this.loadCTM = function(filename,onLoad) {
        var loader = new THREE.CTMLoader();
        var that = this;
        loader.load(filename,function (geometry) {
            var mesh = new THREE.Mesh(geometry, materials[cur_material_index]);
            that.meshes.push(mesh);
            onLoad(mesh);
        });
    };
    
    var that = this;
    this.controls = createTrackballControls(this.camera,this.renderer,function() { that.render() });
    
    this.handleResize = function() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( this.container.clientWidth, this.container.clientHeight );
        this.controls.handleResize();
        this.render();                
    }
}

function toggleVisibilityButtonState(button_id)
{
    var btn = $('#'+button_id);
    if (btn.data("state")=='visible')
        setVisibilityButtonState(button_id,'hidden');
    else
        setVisibilityButtonState(button_id,'visible')
}

function setVisibilityButtonState(button_id,state)
{
    var mesh, rendering_context;
    var btn = $('#'+button_id);
    if (state=='loading') {
        btn.addClass('btn-warning');
    } else if (state=='visible') {
        btn.removeClass('btn-warning').addClass('btn-success');
        mesh = btn.data("mesh");
        rendering_context = btn.data("rendering_context");
        rendering_context.scene.add(mesh);
        rendering_context.render();
    } else if (state=='hidden') {
        btn.removeClass('btn-warning').addClass('btn-success');
        mesh = btn.data("mesh");
        rendering_context = btn.data("rendering_context");
        rendering_context.scene.remove(mesh);
        rendering_context.render();
    }
    btn.data("state",state);
}

function createMeshLoadingCallBack(button_id)
{
    return function (mesh) {
        var b = $('#' + button_id);
        b.data("mesh", mesh);
        setVisibilityButtonState(button_id, 'visible');
        b.on("click", function () {
            toggleVisibilityButtonState(button_id);
        });
    };
}

function createAllScenes(bindings) {

    materials = createMaterials();
    update_color_legend_visibility();
    $('#occlusogram_button').on("click",function() { toggle_occlusogram(); });
    createStats();

    rendering_contexts = [];
    var map_scene_name_to_rendering_context = {};
    for(var i=0;i<bindings.scenes.length;++i) {
        var context = new RenderingContext(bindings.scenes[i].html_id);
        context.render();
        map_scene_name_to_rendering_context[bindings.scenes[i].name] = context;
        rendering_contexts.push(context);
    }

    var map_object_name_to_object = {};
    for(i=0;i<bindings.objects.length;++i)
        map_object_name_to_object[bindings.objects[i].name] = bindings.objects[i];

    for(i=0;i<bindings.visibility_buttons.length;++i) {
        var button_id = bindings.visibility_buttons[i].html_id;
        var obj_name = bindings.visibility_buttons[i].object_name;
        var obj = map_object_name_to_object[obj_name];
        var btn = $('#'+button_id);
        btn.data("obj",obj);
        var rendering_context = map_scene_name_to_rendering_context[bindings.visibility_buttons[i].scene_name];
        if (rendering_context) {
            btn.data("rendering_context",rendering_context);
            setVisibilityButtonState(button_id,'loading');
            var fileExt = obj.src.split('.').pop();
            if (fileExt=="stl")
                rendering_context.loadSTL(obj.src,createMeshLoadingCallBack(button_id));
            else if (fileExt=="obj")
                rendering_context.loadOBJ(obj.src,createMeshLoadingCallBack(button_id));
            else if (fileExt=="ctm")
                rendering_context.loadCTM(obj.src,createMeshLoadingCallBack(button_id));
        }
    }

    window.addEventListener( 'resize', function() {
            for(i=0;i<rendering_contexts.length;++i)
                rendering_contexts[i].handleResize(); }, false );

    animate();
}

function animate() {
    requestAnimationFrame( animate );
    for(var i=0;i<rendering_contexts.length;++i)
        rendering_contexts[i].controls.update();
}