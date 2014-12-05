
function enable_disable_buttons()
{
    document.getElementById("select_btn").disabled = (items.length<=1);
    document.getElementById("reset_btn").disabled = (items.length===0);
    document.getElementById("sort_btn").disabled = (items.length<=1);
}

function focus_on_input()
{
    document.getElementById("input").focus();
}

function append_item()
{
    var inp = $("#input");
    items.push(inp.val());
    inp.val("");
    disable_enable_submit_btn();
    items.display();
    var input_offset = inp.offset();
    var last_item = $("#item" + String(items.length - 1));
    var last_item_offset = last_item.offset();
    //var top_offset = 70 + 50 * (items.length - 1);
    var top_offset = last_item_offset.top - input_offset.top;
    last_item.css("top",String(-top_offset) + "px").animate({top:"0px"});
    enable_disable_buttons();
    focus_on_input();
    $("#buttons_section").css("top", -54).animate({ top: "0px" });
}

function disable_enable_submit_btn()
{
    var inp = $("#input");
    var txt = inp.val();
    if (txt.length==0)
        $("#submit_btn").attr('disabled','true');
    else
        $("#submit_btn").removeAttr('disabled');
}

function delete_item(list_element)
{
    for(var i=0;i<items.length;++i) {
        if (list_element.innerHTML===items[i]) {
            items.swap_elements(0,i);
            items.shift();
            items.reset_selection();            
            items.display();
            enable_disable_buttons();
            focus_on_input();
            return;
        }
    }
}

function play_sound()
{    
    stop_sound();
    var elem = document.getElementById("music");
    elem.play();        
}

function stop_sound()
{
    var elem = document.getElementById("music");
    elem.pause();
    // elem.currentTime = "0";
}

function preload_audio()
{
    var audio_tag = document.getElementById("music");
    audio_tag.load();
}

function get_total_visits_counter() 
{
    $.get("php/counter.php", function (data, status) { 
        $("#counter").html(data).hide().fadeIn(5000);
    });
}

function assign_button_actions()
{
    $("#select_btn").click(function(){
        items.start_action(function() {items.choose_randomly();}, 8000);
        play_sound();
    });

    $("#reset_btn").click(function () {
        stop_sound();
        items.reset();
        items.display();
        enable_disable_buttons();
        focus_on_input();
    });

    $("#sort_btn").click(function () {
        play_sound();
        items.start_action(function () { items.swap_randomly(); }, 8000);
    });
}

$(document).ready(function () {
    assign_button_actions();
    enable_disable_buttons();
    preload_audio();
    get_total_visits_counter();
    focus_on_input();
});