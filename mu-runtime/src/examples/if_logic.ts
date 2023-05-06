import { Var, div, elt, watch } from "../mu";

let count = new Var(1);

watch([count], () => {
    if (count.value >= 5) {
        alert(`count is dangerously high! turning it down`);
        count.value = 2;
    }
})

let exampleOutput = div(null,
    elt("button", { onclick: () => count.value += 1 }, "Count is ", count)
);

export default {
    content: exampleOutput
} satisfies ExamplePage;