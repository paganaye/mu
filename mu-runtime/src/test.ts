import { Var, css, div, mount } from "./mu";

document.body.innerHTML = `<div><a href="/">Main Mu app</a></div><h1 style="font-family:monospace;">Test App</h1><div id="test-page">...</div>`

window.onhashchange = () => document.location.reload();


let testPage = div(null, "Test")

let var1 = new Var("font-size: 5px");

css("div", var1);

setTimeout(() => {
    var1.value = "font-size: 50px"
}, 1000);

mount(testPage, "test-page");


