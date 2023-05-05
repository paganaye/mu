import { ExamplePage } from "./examples";
import { div, elt, p } from "../mu";

let exampleOutput = div(null,
    elt("h1", null, "TODO"),
    p(null, "")
);

export default {
    content: exampleOutput
} satisfies ExamplePage;