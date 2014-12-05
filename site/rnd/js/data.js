
var items = new Array();

items.random_index = function()
{
    return Math.floor(Math.random()*this.length);
};

items.reset_selection = function()
{
    this.selected = undefined;    
};

items.stop_actions = function()
{
    if (this.action_timer) {
        clearInterval(this.action_timer);
        this.action_timer = undefined;
    }
    if (this.action_timeout) {
        clearTimeout(this.action_timeout);
        this.action_timeout = undefined;
    }
}

items.reset = function () 
{
    this.stop_actions();
    this.reset_selection();
    while (this.length > 0)
        this.shift();
};

items.reset();

items.swap_elements = function(i,j)
{
    var tmp = this[i];
    this[i] = this[j];
    this[j] = tmp;              
};

items.swap_randomly = function()
{
    this.swap_elements(this.random_index(),this.random_index());
};

items.choose_randomly = function()
{
    items.selected = this.random_index();
};

items.display = function () 
{
    var ol = $("#list_of_items");
    if (this.length === 0)
        ol.html("");
    else {
        var txt = "";
        for (var i = 0; i < this.length; ++i) {
            txt += "<li id='item" + String(i) + "' onclick='delete_item(this);'";
            if (this.selected === i)
                txt += " class='selected_item'";
            txt += ">" + this[i] + "</li>";
        }
        ol.html(txt);
    }
};

items.start_action = function (action, timeout_msec) {
    this.stop_actions();
    this.reset_selection();
    var t = this;
    this.action_timer = setInterval(function () { action(); t.display(); }, 25);
    this.action_timeout = setTimeout(function () { t.stop_actions(); }, timeout_msec);
};