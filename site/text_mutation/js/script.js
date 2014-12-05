$(document).ready(function () {
    $("#button").click(on_btn_click);
});

on_btn_click = function () {
    fancy_copy.run("src_word", "trg_word",1500);
}