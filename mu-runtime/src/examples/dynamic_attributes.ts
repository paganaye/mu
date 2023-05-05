import { Var, elt } from "../mu";
import { ExamplePage } from "./examples";

let src = new Var("https://picsum.photos/id/30/150/100");
let desc = "Red mug";

let exampleOutput = elt("img", { src: src.getValue(), alt: `Picsum photo: ${desc}` })

export default {
    content: exampleOutput
} satisfies ExamplePage;