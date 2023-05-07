import { Var, booleanInput, css, div, each, elt, iif, mount, } from "./mu";

document.body.innerHTML = `<div><a href="/">Main Mu app</a></div><h1 style="font-family:monospace;">Test App</h1><div id="test-page">...</div>`

window.onhashchange = () => document.location.reload();


let testPage = div(null, "Test")

css("div", "background-color:red");
css("div", "background-color:blue");

mount(testPage, "test-page");


