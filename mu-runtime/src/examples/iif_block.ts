import { ExamplePage } from "./examples";
import { iif, Var, div, elt } from "../mu";

let loggedIn = new Var(false);

let exampleOutput = div(null,
    iif(loggedIn,
        elt("button", { onclick: () => loggedIn.value = false }, "Log out"),
        elt("button", { onclick: () => loggedIn.value = true }, "Log in"))
);

export default {
    content: exampleOutput
} satisfies ExamplePage;