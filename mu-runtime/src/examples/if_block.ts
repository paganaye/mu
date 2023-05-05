import { ExamplePage } from "./examples";
import { Var, elt, watch } from "../mu";

let loggedIn = Var.new("count", false);

let exampleOutput = watch([loggedIn], () => {
    if (loggedIn.getValue()) {
        return elt("button", { onclick: () => loggedIn.setValue(false) }, "Log out")
    } else {
        return elt("button", { onclick: () => loggedIn.setValue(true) }, "Log in")
    }
});

export default {
    content: exampleOutput
} satisfies ExamplePage;