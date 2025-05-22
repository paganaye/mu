import { html } from "../mu";


let string = `here's some <strong>HTML!!!</strong>`;

let exampleOutput = html("div", null, string)

export default {
    content: exampleOutput
} satisfies ExamplePage;