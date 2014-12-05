/**
 * Created by alevin on 11/21/2014.
 */

var showingOcclusalClearance = false;

function activateToggleVisibilityButton(btnName,objName)
{
    $('#' + btnName).addClass('btn-success').click( function() {
        viewer.toggleVisibilityInAllWindows(objName);
    })
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

function createRegularMaterial() {
    return new THREE.MeshPhongMaterial({
        ambient: 0x555555,
        color: 0xAAAAAA,
        specular: 0x111111,
        shininess: 200});
}

function createOcclusalClearanceMaterial() {
    var m = createRegularMaterial();
    m.map = createOcclusogramTexture();
    return m;
}

function addSpinnerToAllWebGLWindows()
{
    $('.webgl-container').html(
        '<div class="circularG_main_container">' +
            '<div class="circularG_container">' +
                '<div class="circularG circularG_1"></div>' +
                '<div class="circularG circularG_2"></div>' +
                '<div class="circularG circularG_3"></div>' +
                '<div class="circularG circularG_4"></div>' +
                '<div class="circularG circularG_5"></div>' +
                '<div class="circularG circularG_6"></div>' +
                '<div class="circularG circularG_7"></div>' +
                '<div class="circularG circularG_8"></div>' +
            '</div>' +
        '</div>');
}

$('#occlusogram_button').on("click", function () {
    showingOcclusalClearance = !showingOcclusalClearance;
    if (showingOcclusalClearance) {
        $('#color-legend').show();
        viewer.setMaterialInAllWindowsAndObjects(createOcclusalClearanceMaterial);
    } else {
        $('#color-legend').hide();
        viewer.setMaterialInAllWindowsAndObjects(createRegularMaterial);
    }
});

$('#color-legend').hide();
addSpinnerToAllWebGLWindows();

var layout;

function setLayout(new_layout) {
    layout = new_layout;
    if (layout==0) {
        $('#lower_jaw_window').css('visibility', 'visible');
        $('#upper_jaw_window').css('visibility', 'visible');
        $('#bite_window').css('visibility', 'hidden');
    } else {
        $('#lower_jaw_window').css('visibility', 'hidden');
        $('#upper_jaw_window').css('visibility', 'hidden');
        $('#bite_window').css('visibility', 'visible');
    }
};

setLayout(0);
$('#layout_toggle').click(function() { setLayout(1-layout); });