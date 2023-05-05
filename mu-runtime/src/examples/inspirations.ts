import { ExamplePage } from "./examples";
import { div, elt, p } from "../mu";

export default {
    hideSource: true,
    content: div(null,
        elt("p", null, "Mu is largely inspired from the three following frameworks: ",
            elt("a", { href: "https://svelte.dev/examples/html-tags", target: "new" }, "Svelte.js"), ", ",
            elt("a", { href: "https://vuejs.org/examples/#hello-world", target: "new" }, "Vue.js"), ", ",
            elt("a", { href: "https://legacy.reactjs.org/docs/hello-world.html", target: "new" }, "React.js"), " and ",
            elt("a", { href: "https://www.typescriptlang.org/", target: "new" }, "typescript.js"), ". ",
            "Mu stands on the shoulders of these pioneers. it is a compiler like svelte. It uses JSX like react. It has custom attributes like Vue.js."
        ),
        elt("p", null, "It's aim is to expose a simple coherent syntax and produce readable javascript code.")
    )
} satisfies ExamplePage;

