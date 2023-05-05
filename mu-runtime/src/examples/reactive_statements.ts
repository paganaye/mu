import { Var, div, elt, p, watch } from "../mu";

let count = new Var(1);

watch([count], () => {
    if (count.getValue() >= 5) {
        alert(`count is dangerously high! turning it down`);
        count.setValue(2);
    }
})

let exampleOutput = div(null,
    elt("button", { onclick: () => count.setValue(count.getValue() + 1) }, "Count is ", count)
);

export default {
    content: exampleOutput
} satisfies ExamplePage;