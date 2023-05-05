import { elt } from "../mu";

let src = "https://picsum.photos/id/30/150/100";
let desc = "Red mug";

let exampleOutput = elt("img", { src, alt: `Picsum photo: ${desc}` })

export default {
    content: exampleOutput
} satisfies ExamplePage;