//
//    fancy_copy 
//
//    Written by Adi Levin, 2/Nov/2013.
//
//    the function fancy_copy.run() copies the contents of one text element to another, animating each letter
//    separately, along a random Bezier path. As input, provide the ids of the source and target DOM elements
//    and the required duration of the animation, in milliseconds.
//
//    Assumptions
//
//        The contents of the first element must be plain text - no html tags.
//
//    Usage:
//
//        fancy_copy.run("id_of_first_element","id_of_second_element",1000 /* duration, milliseconds */);
//
//    Prerequisites:
//
//        JQuery:         <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
//        JQuery.path:    Included at the bottom of this source file
//        This file:      <script src="js/fancy_copy.js"></script>
//

var fancy_copy =
{
    run: function (src_id, trg_id, duration_msec) {
        var orig_src_text = $("#" + src_id).html();
        var src_text = this._separate_text_to_spans(src_id, src_id + "_fancy_move_src");
        var trg_text = src_text.replace(/_fancy_move_src/g, "_fancy_move_trg");
        $("#" + trg_id).html(trg_text);
        var arr = src_text.match(/<span/g);
        var n = arr.length;
        for (var i = 0; i < n; ++i) {
            this._animate_along_path($("#" + src_id + "_fancy_move_src" + String(i)), $("#" + src_id + "_fancy_move_trg" + String(i)), Math.random() * 360, Math.random() * 360, duration_msec);
        }
        $("#" + src_id).html(orig_src_text);
    },

    _separate_text_to_spans: function (elem_id, prefix) {
        var elem = $("#" + elem_id);
        var orig_text = elem.html();
        new_text = this._separate_to_spans(prefix, orig_text);
        elem.html(new_text);
        return new_text;
    },

    _separate_to_spans: function (prefix, text) {
        if (text.search("<span") >= 0)
            return text;
        var new_text = "";
        for (var i = 0; i < text.length; ++i) {
            var letter = text[i];
            new_text += "<span id='" + prefix + String(i) + "' class='relpos'>" + letter + "</span>";
        }
        return new_text;
    },

    _Generate_callback: function (elem) {
        return (function (elem) {
            var the_elem = elem;
            return function () {
                the_elem.replaceWith(the_elem.html());
            }
        })(elem);
    },

    _animate_along_path: function (src_element, trg_element, start_angle, end_angle, duration_msec) {

        var src_offset = src_element.offset();
        var trg_offset = trg_element.offset();

        var path = new $.path.bezier({
            start: { x: src_offset.left - trg_offset.left, y: src_offset.top - trg_offset.top, angle: start_angle, length: 2 },
            end: { x: 0, y: 0, angle: end_angle, length: 1 }
        })

        trg_element.animate({ path: path }, duration_msec, this._Generate_callback(trg_element));
    }
}


////////////////////////////////////////////
//
// JQuery.path
//
////////////////////////////////////////////

/*
 * jQuery css bezier animation support -- Jonah Fox
 * version 0.0.1
 * Released under the MIT license.
 */
/*
  var path = $.path.bezier({
    start: {x:10, y:10, angle: 20, length: 0.3},
    end:   {x:20, y:30, angle: -20, length: 0.2}
  })
  $("myobj").animate({path: path}, duration)

*/

;(function($){

  $.path = {};

  var V = {
    rotate: function(p, degrees) {
      var radians = degrees * Math.PI / 180,
        c = Math.cos(radians),
        s = Math.sin(radians);
      return [c*p[0] - s*p[1], s*p[0] + c*p[1]];
    },
    scale: function(p, n) {
      return [n*p[0], n*p[1]];
    },
    add: function(a, b) {
      return [a[0]+b[0], a[1]+b[1]];
    },
    minus: function(a, b) {
      return [a[0]-b[0], a[1]-b[1]];
    }
  };

  $.path.bezier = function( params, rotate ) {
    params.start = $.extend( {angle: 0, length: 0.3333}, params.start );
    params.end = $.extend( {angle: 0, length: 0.3333}, params.end );

    this.p1 = [params.start.x, params.start.y];
    this.p4 = [params.end.x, params.end.y];

    var v14 = V.minus( this.p4, this.p1 ),
      v12 = V.scale( v14, params.start.length ),
      v41 = V.scale( v14, -1 ),
      v43 = V.scale( v41, params.end.length );

    v12 = V.rotate( v12, params.start.angle );
    this.p2 = V.add( this.p1, v12 );

    v43 = V.rotate(v43, params.end.angle );
    this.p3 = V.add( this.p4, v43 );

    this.f1 = function(t) { return (t*t*t); };
    this.f2 = function(t) { return (3*t*t*(1-t)); };
    this.f3 = function(t) { return (3*t*(1-t)*(1-t)); };
    this.f4 = function(t) { return ((1-t)*(1-t)*(1-t)); };

    /* p from 0 to 1 */
    this.css = function(p) {
      var f1 = this.f1(p), f2 = this.f2(p), f3 = this.f3(p), f4=this.f4(p), css = {};
      if (rotate) {
        css.prevX = this.x;
        css.prevY = this.y;
      }
      css.x = this.x = ( this.p1[0]*f1 + this.p2[0]*f2 +this.p3[0]*f3 + this.p4[0]*f4 +.5 )|0;
      css.y = this.y = ( this.p1[1]*f1 + this.p2[1]*f2 +this.p3[1]*f3 + this.p4[1]*f4 +.5 )|0;
      css.left = css.x + "px";
      css.top = css.y + "px";
      return css;
    };
  };

  $.path.arc = function(params, rotate) {
    for ( var i in params ) {
      this[i] = params[i];
    }

    this.dir = this.dir || 1;

    while ( this.start > this.end && this.dir > 0 ) {
      this.start -= 360;
    }

    while ( this.start < this.end && this.dir < 0 ) {
      this.start += 360;
    }

    this.css = function(p) {
      var a = ( this.start * (p ) + this.end * (1-(p )) ) * Math.PI / 180,
        css = {};

      if (rotate) {
        css.prevX = this.x;
        css.prevY = this.y;
      }
      css.x = this.x = ( Math.sin(a) * this.radius + this.center[0] +.5 )|0;
      css.y = this.y = ( Math.cos(a) * this.radius + this.center[1] +.5 )|0;
      css.left = css.x + "px";
      css.top = css.y + "px";
      return css;
    };
  };

  $.fx.step.path = function(fx) {
    var css = fx.end.css( 1 - fx.pos );
    if ( css.prevX != null ) {
      $.cssHooks.transform.set( fx.elem, "rotate(" + Math.atan2(css.prevY - css.y, css.prevX - css.x) + ")" );
    }
    fx.elem.style.top = css.top;
    fx.elem.style.left = css.left;
  };

})(jQuery);