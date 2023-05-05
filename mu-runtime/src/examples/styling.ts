import { p } from "../mu";
import { ExamplePage } from "./examples";


let exampleOutput = p(
    { style: { "background-color": "#fcf", padding: "25px", "font-size": "40pt" } },
    "Styled")

export default {
    content: exampleOutput
} satisfies ExamplePage;