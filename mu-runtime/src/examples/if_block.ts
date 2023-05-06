import { ExamplePage } from "./examples";
import { Var, elt, watch } from "../mu";

let loggedIn = new Var(false);

let exampleOutput = watch([loggedIn], () => {
    if (loggedIn.value) {
        return elt("button", { onclick: () => loggedIn.value = false }, "Log out")
    } else {
        return elt("button", { onclick: () => loggedIn.value = true }, "Log in")
    }
});

export default {
    content: exampleOutput
} satisfies ExamplePage;