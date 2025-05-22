import { IBenchmark, IRow } from "./benchmark-common";

// js-framework-benchmark/frameworks/non-keyed/vanillajs/src/Main.js
function _random(max: number) {
    return Math.round(Math.random() * 1000) % max;
}

const rowTemplate = document.createElement("tr");
rowTemplate.innerHTML = "<td class='col-md-1'></td><td class='col-md-4'><a class='lbl'></a></td><td class='col-md-1'><a class='remove'><span class='remove glyphicon glyphicon-remove' aria-hidden='true'></span></a></td><td class='col-md-6'></td>";

class Store {
    data: any[];
    backup: any[];
    selected: number = -1;
    id: number;
    constructor() {
        this.data = [];
        this.backup = [];
        this.selected = -1;
        this.id = 1;
    }
    buildData(count = 1000) {
        var adjectives = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"];
        var colours = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
        var nouns = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];
        var data = [];
        for (var i = 0; i < count; i++)
            data.push({ id: this.id++, label: adjectives[_random(adjectives.length)] + " " + colours[_random(colours.length)] + " " + nouns[_random(nouns.length)] });
        return data;
    }
    updateData(mod: number = 10) {
        for (let i = 0; i < this.data!.length; i += mod) {
            this.data![i].label += ' !!!';
            // this.data[i] = Object.assign({}, this.data[i], {label: this.data[i].label +' !!!'});
        }
    }
    delete(id: number) {
        const idx = this.data!.findIndex((d: { id: number; }) => d.id == id);
        this.data = this.data!.filter((_e: any, i: any) => i != idx);
        return this;
    }
    run() {
        this.data = this.buildData();
        this.selected = -1;
    }
    add(count: number) {
        this.data = this.data!.concat(this.buildData(count));
        this.selected = -1;
    }
    update() {
        this.updateData();
        this.selected = -1;
    }
    select(id: number) {
        this.selected = id;
    }
    hideAll() {
        this.backup = this.data;
        this.data = [];
        this.selected = -1;
    }
    showAll() {
        this.data = this.backup;
        this.backup = [];
        this.selected = -1;
    }
    runLots() {
        this.data = this.buildData(10000);
        this.selected = -1;
    }
    clear() {
        this.data = [];
        this.selected = -1;
    }
    swapRows() {
        if (this.data!.length > 998) {
            var a = this.data![1];
            this.data![1] = this.data![998];
            this.data![998] = a;
        }
    }
}

export class VanillaJsMain implements IBenchmark {
    store: Store;
    start: number;
    rows: HTMLElement[];
    data: IRow[];
    selectedRow: any;
    tbody: HTMLElement | null;

    constructor(tbody: HTMLElement) {
        this.store = new Store();
        this.start = 0;
        this.rows = [];
        this.data = [];
        this.selectedRow = undefined;
        this.tbody = tbody
    }

    hideAll() {
        throw new Error("Method not implemented.");
    }

    showAll() {
        throw new Error("Method not implemented.");
    }

    findIdx(id: any): number {
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i].id === id) return i;
        }
        return -1;
    }

    run() {
        this.store.run();
        this.updateRows();
        this.appendRows();
        this.unselect();
    }
    add(count: number = 1000) {
        this.store.add(count);
        this.appendRows();
    }
    update() {
        this.store.update();
        // this.updateRows();
        for (let i = 0; i < this.data.length; i += 10) {
            (this.rows[i].childNodes[1].childNodes[0] as HTMLElement).innerText = this.store.data![i].label;
        }
    }
    unselect() {
        if (this.selectedRow !== undefined) {
            this.selectedRow.className = "";
            this.selectedRow = undefined;
        }
    }
    select(idx: number) {
        this.unselect();
        if (idx !== undefined) {
            this.store.select(this.data[idx].id);
            this.selectedRow = this.rows[idx];
        }
        this.selectedRow.className = "danger";
    }
    delete(idx: number) {
        // Remove that row from the DOM
        // this.store.delete(this.data[idx].id);
        // this.rows[idx].remove();
        // this.rows.splice(idx, 1);
        // this.data.splice(idx, 1);

        // Faster, shift all rows below the row that should be deleted rows one up and drop the last row
        for (let i = this.rows.length - 2; i >= idx; i--) {
            let tr = this.rows[i];
            let data = this.store.data![i + 1];
            (tr as any).data_id = data.id;
            (tr.childNodes[0] as HTMLElement).innerText = data.id;
            (tr.childNodes[1].childNodes[0] as HTMLElement).innerText = data.label;
            this.data[i] = this.store.data![i];
        }
        this.store.delete(this.data[idx].id);
        this.data.splice(idx, 1);
        this.rows.pop()!.remove();
    }
    updateRows() {
        for (let i = 0; i < this.rows.length; i++) {
            if (this.data[i] !== this.store.data![i]) {
                let tr = this.rows[i];
                let data = this.store.data![i];
                (tr as any).data_id = data.id;
                (tr.childNodes[0] as HTMLElement).innerText = data.id;
                (tr.childNodes[1].childNodes[0] as HTMLElement).innerText = data.label;
                this.data[i] = this.store.data![i];
            }
        }
    }
    removeAllRows() {
        // ~258 msecs
        // for(let i=this.rows.length-1;i>=0;i--) {
        //     tbody.removeChild(this.rows[i]);
        // }
        // ~251 msecs
        // for(let i=0;i<this.rows.length;i++) {
        //     tbody.removeChild(this.rows[i]);
        // }
        // ~216 msecs
        // var cNode = tbody.cloneNode(false);
        // tbody.parentNode.replaceChild(cNode ,tbody);
        // ~212 msecs
        this.tbody!.textContent = "";

        // ~236 msecs
        // var rangeObj = new Range();
        // rangeObj.selectNodeContents(tbody);
        // rangeObj.deleteContents();
        // ~260 msecs
        // var last;
        // while (last = tbody.lastChild) tbody.removeChild(last);
    }
    runLots() {
        this.store.runLots();
        this.updateRows();
        this.appendRows();
        this.unselect();
    }
    clear() {
        this.store.clear();
        this.rows = [];
        this.data = [];
        // 165 to 175 msecs, but feels like cheating
        // requestAnimationFrame(() => {
        this.removeAllRows();
        this.unselect();
        // });
    }
    swapRows() {
        let old_selection = this.store.selected;
        this.store.swapRows();
        this.updateRows();
        this.unselect();
        if (old_selection! >= 0) {
            let idx = this.store.data!.findIndex((d: { id: any; }) => d.id === old_selection);
            if (idx > 0) {
                this.store.select(this.data[idx].id);
                this.selectedRow = this.rows[idx];
                this.selectedRow!.className = "danger";
            }
        }
    }
    appendRows() {
        // Using a document fragment is slower...
        // var docfrag = document.createDocumentFragment();
        // for(let i=this.rows.length;i<this.store.data.length; i++) {
        //     let tr = this.createRow(this.store.data[i]);
        //     this.rows[i] = tr;
        //     this.data[i] = this.store.data[i];
        //     docfrag.appendChild(tr);
        // }
        // this.tbody.appendChild(docfrag);

        // ... than adding directly
        var rows = this.rows, s_data = this.store.data, data = this.data, tbody = this.tbody;
        for (let i = rows.length; i < s_data!.length; i++) {
            let tr = this.createRow(s_data![i]);
            rows[i] = tr;
            data[i] = s_data![i];
            tbody!.appendChild(tr);
        }
    }
    createRow(data: IRow) {
        const tr = rowTemplate.cloneNode(true) as any,
            td1 = tr.firstChild,
            a2 = td1!.nextSibling.firstChild;
        tr.data_id = data.id;
        td1.textContent = data.id;
        a2.textContent = data.label;
        return tr;
    }
}



// new Main();
