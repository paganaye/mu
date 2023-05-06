import { Dynamic<MuElt> } from "../mu"

export interface ExamplePage {
    hideSource?: boolean
    content?: Dynamic<MuElt>
    outputTitle?: string
}

export interface Section {
    section: string;
    pages: Page[]
}

export interface Page {
    page: string;
    url?: string;
    content?: Dynamic<MuElt>;
    external?: boolean,
    reload?: boolean
}
