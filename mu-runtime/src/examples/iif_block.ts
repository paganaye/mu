import { ExamplePage } from "./examples";
import { iif, Var, div, elt } from "../mu";

let loggedIn = new Var(false);

let exampleOutput = div(null,
    iif(loggedIn,
        elt("button", { onclick: () => loggedIn.setValue(false) }, "Log out"),
        elt("button", { onclick: () => loggedIn.setValue(true) }, "Log in"))
);

export default {
    content: exampleOutput
} satisfies ExamplePage;