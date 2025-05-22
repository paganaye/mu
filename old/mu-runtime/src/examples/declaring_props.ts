import { div, elt } from "../mu";

interface User {
    firstName: string;
    lastName: string;
}

function user(props: User) {
    return div(null,
        div(null, elt("label", null, "first name"), elt("span", null, props.firstName)),
        div(null, elt("label", null, "first name"), elt("span", null, props.lastName)))
}

let exampleOutput = user({
    firstName: "Pascal",
    lastName: "Ganaye"
});

export default {
    content: exampleOutput
} satisfies ExamplePage;