import { MuElt } from "../mu"

export interface ExamplePage {
    hideSource?: boolean
    content?: MuElt
    outputTitle?: string
}

export interface Section {
    section: string;
    pages: Page[]
}

export interface Page {
    page: string;
    url?: string;
    content?: MuElt;
    external?: boolean
}
