import { Var, div, elt, p, watch } from "../mu";
import { ExamplePage } from "./examples";

let count = new Var(1);

let exampleOutput = div(null,
    elt("button", { onclick: () => count.value += 1 }, "Count is ", count),
    p(null, "count is ", count),
    p(null, "count time 2 is ", watch([count], (count) => count.value * 2))
);

export default {
    content: exampleOutput
} satisfies ExamplePage;