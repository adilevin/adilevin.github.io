/*
    Adi Levin, 22/Nov/2014:

    Viewer3D - a simple loader + viewer for 3D meshes.

    Prerequisites:

        1. Your html should include the following:

            <script src="http://cdnjs.cloudflare.com/ajax/libs/three.js/r69/three.min.js"></script>
            <script src="js/TrackballControls.js"></script>
		    <script src="js/loaders/STLLoader.js"></script>
            <script src="js/loaders/OBJLoader.js"></script>
		    <script src="js/loaders/ctm/lzma.js"></script>
		    <script src="js/loaders/ctm/ctm.js"></script>
		    <script src="js/loaders/ctm/CTMLoader.js"></script>
            <script src="js/Viewer3D.js"></script>

    Usage instructions:

        1.  In your html, declare empty divs to display 3D content.

            <div id="lower_jaw_window" class="webgl-container"></div>
            <div id="upper_jaw_window" class="webgl-container"></div>
            <div id="bite_window" class="webgl-container"></div>

        2.  In your css, set a width and a height to the above divs. This will determine the size of the 3D windows.

        3.  Notice that the id's of the divs are the names we will use to reference each window later.

        4.  Initialize the viewer by creating a Viewer3D object with the fields windows3D, objects, and onLoadingCompleted.
            The names of windows3D should be identical to div id's as defined in step 1.
            Inside every window, the 'objects' line should contain names of objects to show in that window.
            The 'objects' section should define names of objects and associate them with a url from which to load the
            object.

            var viewer = new Viewer3D(
            {
                windows3D: {
                    lower_jaw_window: {
                        camera: {'eye_pos': [0, 0, 200], 'up_vector': [1, 0, 0] },
                        objects: { lower_jaw: {} }
                    },
                    upper_jaw_window: {
                        camera: {'eye_pos': [0, 0, -200], 'up_vector': [-1, 0, 0] },
                        objects: { upper_jaw: {} }
                    },
                    bite_window: {
                        camera: {'eye_pos': [150, 0, 0], 'up_vector': [0, 0, 1] },
                        objects: { lower_jaw: {}, upper_jaw: {} }
                    }
                },
                objects : {
                    lower_jaw : { url: 'models/orthoL.ctm' },
                    upper_jaw : { url: 'models/orthoU.ctm' }
                },
                onLoadingCompleted : { function() {
                    // This is where you can enable buttons and notify the user that everything is loaded.
                    }
                }
            );

        5.  Limitations on loading 3D formats:

            4.1 We support only the 3 formats: STL, OBJ and CTM.
            4.2 For each file we only load a single mesh, e.g. if an obj file contains several meshes, only
                the first one of them will be loaded.
            4.3 Materials defined inside the files are ignored.

        6.  To control visibility of objects at run-time, use the functions viewer.toggleVisibility,
            viewer.toggleVisibilityInAllWindows, viewer.setVisibility, sending the names of objects
            and 3D windows as defined in the call to the Viewer3D constructor.

        7.  Viewer3D assigns a default material to all objects. To change the material, use the functions
            viewer.setMaterial, viewer.setMaterialInAllWindows, viewer.setMaterialInAllWindowsAndObjects,
            sending the names of objects and 3D windows as defined in the call to the Viewer3D constructor,
            and a material creator function (because in Three.js we need to create the material for each
            rendering context separately).

            For example:

                viewer.setMaterialInAllWindowsAndObjects(function () {
                   return new THREE.MeshPhongMaterial({
                        ambient: 0x555555,
                        color: 0xAAAAAA,
                        specular: 0x111111,
                        shininess: 200})
                   }
                )
});


 */

function Viewer3D(bindings)
{
    function RenderingContext(dom_element_id,initial_camera)
    {
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

        function createCamera(container,initial_camera) {
            var camera = new THREE.PerspectiveCamera(25, container.clientWidth / container.clientHeight, 1, 1500);
            camera.position.set(initial_camera.eye_pos[0],initial_camera.eye_pos[1],initial_camera.eye_pos[2]);
            camera.up.set(initial_camera.up_vector[0],initial_camera.up_vector[1],initial_camera.up_vector[2]);
            return camera;
        }

        function createDefaultMaterial() {
            return new THREE.MeshPhongMaterial({
                ambient: 0x555555,
                color: 0xAAAAAA,
                specular: 0x111111,
                shininess: 200 });
        }

        this.defaultMaterial = createDefaultMaterial();
        this.container = document.getElementById(dom_element_id);
        this.camera = createCamera(this.container,initial_camera);
        this.scene = createEmptyScene();
        this.renderer = createRenderer(this.container);
        this.meshes = [];

        this.render = function() {
            this.renderer.render(this.scene, this.camera);
        };
        this.container.appendChild(this.renderer.domElement);

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

    function createRenderingContexts(viewer)
    {
        for(var windowName in viewer.windows3D)
            if (viewer.windows3D.hasOwnProperty(windowName)) {
                var window3D = viewer.windows3D[windowName];
                window3D.renderingContext = new RenderingContext(windowName, window3D.camera);
                window3D.renderingContext.render();
            }
    }

    function animate(viewer) {
        requestAnimationFrame( function() { animate(viewer); } );
        for(var windowName in viewer.windows3D)
            if (viewer.windows3D.hasOwnProperty(windowName))
                viewer.windows3D[windowName].renderingContext.controls.update();
    }

    function addLoadedObjectToWindow(viewer, windowName, objName) {
        var window3D = viewer.windows3D[windowName];
        var object_in_scene = window3D.objects[objName];
        object_in_scene.mesh = new THREE.Mesh(viewer.objects[objName].geometry.clone(), window3D.renderingContext.defaultMaterial);
        window3D.renderingContext.meshes.push(object_in_scene.mesh);
    }

    function initialize(viewer) {

        var numOfObjectsLoaded = 0;
        function onGeometryLoaded(objName)
        {
            for(var windowName in viewer.windows3D)
                if (viewer.windows3D.hasOwnProperty(windowName) && (objName in viewer.windows3D[windowName].objects)) {
                    addLoadedObjectToWindow(viewer, windowName, objName);
                    viewer.setVisibility(windowName, objName, true);
                }
            if ('onLoad' in viewer.objects[objName])
                viewer.objects[objName].onLoad();
            ++numOfObjectsLoaded;
            if (numOfObjectsLoaded==Object.keys(viewer.objects).length)
                viewer.onLoadingCompleted();
        }

        function loadSTL(filename,onLoad) {
            var loader = new THREE.STLLoader();
            loader.addEventListener('load', function (event) {
                var geometry = event.content;
                onLoad(geometry);
            });
            loader.load(filename);
        }

        function loadOBJ(filename,onLoad) {
            var loader = new THREE.OBJLoader();
            loader.load(filename,function (meshes_container) {
                var foundOneMesh = false;
                meshes_container.traverse( function ( mesh ) {
                    if (mesh instanceof THREE.Mesh) {
                        if (!foundOneMesh) {
                            onLoad(mesh.geometry);
                            foundOneMesh = true;
                        }
                    }
                });
            });
        }

        function loadCTM(filename,onLoad) {
            var loader = new THREE.CTMLoader();
            loader.load(filename,function (geometry) {
                onLoad(geometry);
            });
        }

        function loadObject(viewer,objName) {
            var obj = viewer.objects[objName];
            var fileExt = obj.url.split('.').pop();
            var callback = function(geometry) {
                obj.geometry = geometry;
                onGeometryLoaded(objName);
            };
            var loaderFunctions = { stl:loadSTL, obj:loadOBJ, ctm:loadCTM };
            loaderFunctions[fileExt](obj.url,callback);
        }

        function loadObjectIfNotLoadedYet(viewer,objName)
        {
            var obj = viewer.objects[objName];
            if ('geometry' in obj)
                onGeometryLoaded(objName);
            else
                loadObject(viewer,objName);
        }

        function loadObjects(viewer)
        {
            for(var objName in viewer.objects)
                if (viewer.objects.hasOwnProperty(objName))
                    loadObjectIfNotLoadedYet(viewer,objName);
        }

        createRenderingContexts(viewer);
        loadObjects(viewer);

        window.addEventListener('resize',
            function () {
                for (var windowName in viewer.windows3D)
                    if (viewer.windows3D.hasOwnProperty(windowName))
                        viewer.windows3D[windowName].renderingContext.handleResize();
            },
            false
        );

        animate(viewer);
    }

    this.toggleVisibility = function(windowName,objName) {
        var window3D = this.windows3D[windowName];
        if (objName in window3D.objects) {
            var obj_in_scene = window3D.objects[objName];
            this.setVisibility(windowName, objName, !obj_in_scene.visible);
        }
    };

    this.toggleVisibilityInAllWindows = function(objName) {
        for(var windowName in this.windows3D)
            if (this.windows3D.hasOwnProperty(windowName))
                this.toggleVisibility(windowName,objName);
    };

    this.setVisibility = function(windowName,objName,visible) {
        var window3D = this.windows3D[windowName];
        var obj_in_window = window3D.objects[objName];
        if (!obj_in_window.mesh)
            return; // Mesh hasn't been loaded yet, so don't do anything.
        obj_in_window.visible = visible;
        if (visible)
            window3D.renderingContext.scene.add(obj_in_window.mesh);
        else
            window3D.renderingContext.scene.remove(obj_in_window.mesh);
        window3D.renderingContext.render();
    };

    this.setMaterial = function(windowName,objName,materialCreator) {
        var window3D = this.windows3D[windowName];
        if (objName in window3D.objects) {
            var obj_in_scene = window3D.objects[objName];
            if ('mesh' in obj_in_scene) {
                obj_in_scene.mesh.material = materialCreator();
                window3D.renderingContext.render();
            }
        }
    };

    this.setMaterialInAllWindows = function(objName,materialCreator) {
        for(var windowName in this.windows3D)
            if (this.windows3D.hasOwnProperty(windowName))
                this.setMaterial(windowName,objName,materialCreator);
    };

    this.setMaterialInAllWindowsAndObjects = function(materialCreator) {
        for(var objName in this.objects)
            if (this.objects.hasOwnProperty(objName))
                this.setMaterialInAllWindows(objName,materialCreator);
    };

    this.windows3D = bindings.windows3D;
    this.objects = bindings.objects;
    this.onLoadingCompleted = bindings.onLoadingCompleted;

    initialize(this);
}