/**
* Created by Adi Levin on 10/31/2014.
*/

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
var rendering_contexts, stats;

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
    this.render = function() {
        this.renderer.render(this.scene, this.camera);
        stats.update();
    };
    this.container.appendChild(this.renderer.domElement);

    this.loadSTL = function(filename,onLoad) {
        var loader = new THREE.STLLoader();
        loader.addEventListener('load', function (event) {
            var material = new THREE.MeshPhongMaterial({ ambient: 0x555555, color: 0xAAAAAA, specular: 0x111111, shininess: 200 });
            var geometry = event.content;
            var mesh = new THREE.Mesh(geometry, material);
            onLoad(mesh);
        });
        loader.load(filename);
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
    var icon_span = $('#' + button_id + ' > span');
    icon_span.removeClass().addClass('glyphicon')
    if (state=='loading') {
        btn.addClass('btn-warning');
        icon_span.addClass('glyphicon-refresh glyphicon-refresh-animate');
    } else if (state=='visible') {
        btn.removeClass('btn-warning').addClass('btn-success');
        icon_span.addClass('glyphicon-ok');
        mesh = btn.data("mesh");
        rendering_context = btn.data("rendering_context");
        rendering_context.scene.add(mesh);
        rendering_context.render();
    } else if (state=='hidden') {
        btn.removeClass('btn-success').addClass('btn-warning');
        icon_span.addClass('glyphicon-minus');
        mesh = btn.data("mesh");
        rendering_context = btn.data("rendering_context");
        rendering_context.scene.remove(mesh);
        rendering_context.render();
    }
    btn.data("state",state);
}


function createAllScenes(bindings) {

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
            rendering_context.loadSTL(obj.src,
                (function(btn_id) {
                    return function (mesh) {
                        var b = $('#'+btn_id);
                        b.data("mesh", mesh);
                        setVisibilityButtonState(btn_id, 'visible');
                        b.on("click", function () {
                            toggleVisibilityButtonState(btn_id);
                        });
                    };
                }) (button_id)
            );
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