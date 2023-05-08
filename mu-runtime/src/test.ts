import { Var, css, div, mount, p } from "./mu";

document.body.innerHTML = `<div><a href="/">Main Mu app</a></div><h1 style="font-family:monospace;">Test Page</h1><div id="test-page">...</div>`

window.onhashchange = () => document.location.reload();

let backgroundColor = new Var("#f00");

css("p.my-comp", {
    "background-color": backgroundColor,
    "color": "white",
    padding: "10px",
    "border-radius": "10px"
});

var crudeRandomColor = () => {
    return "#" + Math.floor(Math.random() * 0xffffff).toString(16);
}

let testPage = p({ class: "my-comp" }, "This paragraph is red based on its class");

setInterval(() => {
    backgroundColor.value = crudeRandomColor()
}, 1000);

mount(testPage, "test-page");

