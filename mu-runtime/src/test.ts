import { Var, booleanInput, div, each, elt, iif, mount, } from "./mu";

document.body.innerHTML = `<div><a href="/">Main Mu app</a></div><h1 style="font-family:monospace;">Test App</h1><div id="test-page">...</div>`

window.onhashchange = () => document.location.reload();

var checkBox = new Var(false);
var counter = new Var(1);

let testPage = each([{ a: 1 }, { a: 2 }], (i) => {
    return elt("div", null, i.a);
})


mount(testPage, "test-page");

