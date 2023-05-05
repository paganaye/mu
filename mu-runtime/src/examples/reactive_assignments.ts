import { Var, elt } from "../mu";
import { ExamplePage } from "./examples";

let count = new Var(1, "count");

let exampleOutput = elt("button",
    { onclick: () => count.setValue(count.getValue() + 1) },
    "Count is ", count);

export default {
    content: exampleOutput
} satisfies ExamplePage;