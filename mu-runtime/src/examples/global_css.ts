import { p, css, div, elt, Var } from "../mu";
import { ExamplePage } from "./examples";

let backgroundColor = new Var("#f00");

css("p.my-comp", {
    "background-color": backgroundColor,
    "color": "white",
    padding: "10px",
    "border-radius": "10px"
});

var randomColor = () => "#" + Math.floor(Math.random() * 16777215).toString(16);

let exampleOutput = div(null,
    "The css function add global css selectors. Mu allows you to use CSS as you would normally.",
    p({ class: "my-comp" }, "This paragraph is red based on its class"),
    p(null, "Another paragraph will show normally."),
    elt("button", { onclick: () => { backgroundColor.setValue(randomColor()) } }, "click me")
);

export default {
    hideSource: true,
    content: exampleOutput
} satisfies ExamplePage;