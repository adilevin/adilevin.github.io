/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

function rgb(r, g, b) {
  r = Math.floor(r);
  g = Math.floor(g);
  b = Math.floor(b);
  s = ["rgb(",r,",",g,",",b,")"].join("");
  return s;
}

function set_canvas_gradient_background(canvas,color0,color1) 
{
    var ctx = canvas.getContext("2d");
    var grd = ctx.createLinearGradient(0, 0, canvas.width, 0); //canvas.height);
    grd.addColorStop(0, color0);
    grd.addColorStop(1, color1);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};

function now_milliseconds()
{
    var d = new Date();
    return d.getTime();
}

function background_canvas()
{
    this.c = document.getElementById("back_canvas");
    if (this.c===null)
        throw "canvas object not found";
    this.set_gradient_background = function(phase) {
        var color0 = rgb(128+Math.sin(phase*1.3)*127,0,128+Math.sin(phase*2.5));
        var color1 = rgb(0,128+Math.cos(phase*0.7)*127,0);
        set_canvas_gradient_background(this.c,color0,color1);
    };
    this.animate_gradient_background = function() {
        var elapsed_time = now_milliseconds();
        elapsed_time -= this.start_time;
        this.set_gradient_background(elapsed_time * 0.001);
    };
    this.start_animated_color = function(time_interval_msec) {
        this.start_time = now_milliseconds();
        var t = this;
        setInterval(function(){t.animate_gradient_background();},time_interval_msec);
    };
};

var bg_canvas;

function on_load_canvas()
{
    bg_canvas = new background_canvas();
    bg_canvas.start_animated_color(50);
}