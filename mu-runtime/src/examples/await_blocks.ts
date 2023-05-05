import { ExamplePage } from "./examples";
import { Var, elt, watch } from "../mu";

let count = new Var("count", 1);

watch([count], () => {
    if (count.getValue() >= 5) {
        alert(`count is dangerously high! turning it down`);
        count.setValue(2);
    }
})

let exampleOutput = elt(
    "button",
    { onclick: () => count.setValue(count.getValue() + 1) },
    "Count is ", count
);

export default {
    content: exampleOutput
} satisfies ExamplePage;