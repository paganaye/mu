import { Var, div, elt, p, watch } from "../mu";
import { ExamplePage } from "./examples";

type State = "Liquid" | "Solid" | "Gas";

let state = new Var<State>("state", "Solid");

function transitionButton(text: string, newState: State) {
    return elt("button", { onclick: () => { state.setValue(newState) } }, text);
}

let exampleOutput = div(null,
    "Current State: ",
    state,
    watch([state], () => {

        switch (state.getValue()) {
            case "Gas":
                return div(null, transitionButton("Condensation", "Liquid"), transitionButton("Deposition", "Solid"))
            case "Liquid":
                return div(null, transitionButton("Freezing", "Solid"), transitionButton("Vaporization", "Gas"))
            case "Solid":
                return div(null, transitionButton("Melting", "Liquid"), transitionButton("Sublimation", "Gas"))
        }
    }));

export default {
    content: exampleOutput
} satisfies ExamplePage;