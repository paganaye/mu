import { Var, elt } from "../mu";

let count = new Var("count", 1);

let exampleOutput = elt("button",
    { onclick: () => count.setValue(count.getValue() + 1) },
    "Count is ", count);

export default {
    content: exampleOutput
} satisfies ExamplePage;