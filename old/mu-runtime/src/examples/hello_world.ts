import { ExamplePage } from "./examples";
import { div, elt, p } from "../mu";

let name: string = "world";

let exampleOutput = elt("h1", {}, "hello ", name, "!")

export default {
    content: exampleOutput
} satisfies ExamplePage;