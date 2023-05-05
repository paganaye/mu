import { p } from "../mu";
import { ExamplePage } from "./examples";


let exampleOutput = p(
    {
        style: {
            "background-color": "#fcf",
            padding: "25px",
            "font-size": "40pt",
            "border": "4px solid #f8f",
            "border-radius": "15px"
        }
    },
    "Styled paragraph")

export default {
    content: exampleOutput
} satisfies ExamplePage;