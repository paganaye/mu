import { p, css, div } from "../mu";
import { ExamplePage } from "./examples";

css("my-comp", {
    "background-color": "red"
});

let exampleOutput = div(null,
    "Svelte allows scoped css styles in a component.",
    p({ class: "my-comp" })
);

export default {
    hideSource: true,
    content: exampleOutput
} satisfies ExamplePage;