import { Attributes, elt, div, MuElt, p } from "../mu";

interface User {
    firstName: string;
    lastName: string;
    rootProps?: Attributes
}

function user(props: User) {
    return div(props.rootProps,
        div(null, elt("label", null, "first name"), elt("span", null, props.firstName)),
        div(null, elt("label", null, "first name"), elt("span", null, props.lastName)))
}

interface Employee {
    role: string;
}

function employee(props: Employee) {
    return div(null,
        div(null, elt("label", null, "role"), elt("span", null, props.role)))
}


function person(props: Employee & User, ...children: MuElt[]) {
    return div(null,
        user(props),
        employee(props),
        ...children)
}


let exampleOutput = person({
    firstName: "Pascal",
    lastName: "Ganaye",
    role: "Developer"
},
    p(null, "Here I am adding text to the end of person in the children area."));

export default {
    content: exampleOutput
} satisfies ExamplePage;