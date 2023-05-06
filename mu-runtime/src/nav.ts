import { Page, Section } from "./examples/examples";
import { div, elt, Attributes, each } from "./mu";


let sections: Section[] = [
    {
        section: "INTRODUCTION", pages: [
            { page: "Hello world" },
            { page: "Dynamic attributes" }
        ],
    }, {
        section: "INSPIRATIONS", pages: [
            { page: "Inspirations" },
        ]
    }, {
        section: "STYLING", pages: [
            { page: "Styling" },
            { page: "Global CSS" },
            { page: "HTML tags" }
        ]
    }, {
        section: "REACTIVITY", pages: [
            { page: "Reactive assignments" },
            { page: "Reactive declarations" },
            { page: "Reactive statements" }
        ]
    }, {
        section: "PROPS", pages: [
            { page: "Declaring props" },
            { page: "REPL" },
            { page: "Default values" },
            { page: "Spread props" }
        ]
    }, {
        section: "LOGIC", pages: [
            { page: "If block" },
            { page: "Switch block" },
            { page: "Iif block" },
            { page: "Each blocks" },
            { page: "Repeat blocks" },
            { page: "Keyed each blocks" },
            { page: "Await blocks" }
        ]
    }, {
        section: "EVENTS", pages: [
            { page: "DOM events" },
            { page: "Inline handlers" },
            { page: "Event modifiers" },
            { page: "Component events" },
            { page: "Event forwarding" },
            { page: "DOM event forwarding" }
        ]
    }, {
        section: "BINDINGS", pages: [
            { page: "Text inputs" },
            { page: "Numeric inputs" },
            { page: "Checkbox inputs" },
            { page: "Group inputs" },
            { page: "Textarea inputs" },
            { page: "File inputs" },
            { page: "Select bindings" },
            { page: "Select multiple" },
            { page: "Each block bindings" },
            { page: "Media elements" },
            { page: "Dimensions" },
            { page: "bind: this = { canvas }" },
            { page: "Component bindings" },
        ]
    }, {
        section: "LIFECYCLE", pages: [
            { page: "onMount" },
            { page: "onDestroy" },
            { page: "beforeUpdate and afterUpdate" },
            { page: "tick" },
        ]
    }, {
        section: "STORES", pages: [
            { page: "Writable stores" },
            { page: "Auto - subscriptions" },
            { page: "Readable stores" },
            { page: "Derived stores" },
            { page: "Custom stores" },
        ]
    }, {
        section: "MOTION", pages: [
            { page: "Tweened" },
            { page: "Spring" },
        ]
    }, {
        section: "TRANSITIONS", pages: [
            { page: "The transition directive" },
            { page: "Adding parameters" },
            { page: "In and out" },
            { page: "Custom CSS transitions" },
            { page: "Custom JS transitions" },
            { page: "Transition events" },
            { page: "Deferred transitions" },
        ]
    }, {
        section: "ANIMATIONS", pages: [
            { page: "The animate directive" },
        ]
    }, {
        section: "EASING", pages: [
            { page: "Ease Visualiser" },
        ]
    }, {
        section: "SVG", pages: [
            { page: "Clock" },
            { page: "Bar chart" },
            { page: "Area chart" },
            { page: "Scatterplot" },
            { page: "SVG transitions" },
        ]
    }, {
        section: "ACTIONS", pages: [
            { page: "The use directive" },
            { page: "Adding parameters" },
            { page: "A more complex action" },
        ]
    }, {
        section: "CLASSES", pages: [
            { page: "The class directive" },
            { page: "Shorthand class directive" },
        ]
    }, {
        section: "COMPONENT COMPOSITION", pages: [
            { page: "Slots" },
            { page: "Slot fallbacks" },
            { page: "Named slots" },
            { page: "Slot props" },
            { page: "Conditional Slots" },
            { page: "Modal" },
        ]
    }, {
        section: "CONTEXT API", pages: [
            { page: "CONTEXT API" },
            { page: "setContext and getContext" },
        ]
    }, {
        section: "SPECIAL ELEMENTS", pages: [
            { page: "svelte: self" },
            { page: "svelte: component" },
            { page: "svelte: element" },
            { page: "svelte: window" },
            { page: "svelte:window bindings" },
            { page: "svelte: document" },
            { page: "svelte: body" },
            { page: "svelte: head" },
        ]
    }, {
        section: "MODULE CONTEXT", pages: [
            { page: "Named exports" },
        ]
    }, {
        section: "DEBUGGING", pages: [
            { page: "The @debug tag" },
        ]
    }, {
        section: "7GUIS", pages: [
            { page: "Counter" },
            { page: "Temperature Converter" },
            { page: "Flight booker" },
            { page: "Timer" },
            { page: "CRUD" },
            { page: "Circle Drawer" },
        ]
    }, {
        section: "MISCELLANEOUS", pages: [
            { page: "Hacker News" },
            { page: "Immutable data" }
        ]
    }
];

export let pageByUrl: { [key: string]: Page } = {}
export let homePage = sections[0].pages[0];


if (location.hostname === "localhost") {
    sections[0].pages.unshift({ page: "Test page (for devs)", reload: true, url: "test" })
}

sections.forEach(s => {
    s.pages.forEach(p => {
        if (!p.url) p.url = p.page.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
        pageByUrl[p.url] = p;
    })
})




export function nav(attr?: Attributes) {
    return elt("nav", attr,
        elt("h2", null, "Menu"),
        // 
        each(sections, (s) =>
            elt("h3", {}, s.section,
                each(s.pages, (p) =>
                    div(null, elt("a", { href: "#" + p.url }, p.page))
                )
            )
        )
    );
}