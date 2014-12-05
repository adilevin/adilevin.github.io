function add_greeting()
{

    if (localStorage.username) {
        var greeting_text = 'Hello ' + localStorage.username;
        var login_text = 'Change nickname';
    } else {        
        var greeting_text = 'Hello guest';
        var login_text = 'Login';
    }
    $('body').prepend('<div id="greeting"_with_username" style="font-size:20px">' + greeting_text + 
        '! (<a href="../login" style="font-size:20px">' + login_text + '</a>)');
}

$(document).ready(function () {
    add_greeting();
});