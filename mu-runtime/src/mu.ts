debugger;

function elt(tag: string, _args: Attributes | null, ...children: ExprOrElt[]): HTMLElement {
    let elt = document.createElement(tag);
    // TODO args
    let previousParent = mu.currentParent;
    let textNode: Text | undefined;
    mu.currentParent = elt;
    children?.forEach((child: ExprOrElt) => {
        let value;
        if (typeof child === 'function') child = (child as Function)();
        if (child instanceof Expr) {
            child.addListener(() => {
                value = (child as Expr).getValue();
                if (textNode) textNode.nodeValue = value;
            });
            value = child.getValue();
        } else {
            value = child;
        }
        switch (typeof value) {
            case 'boolean':
            case 'string':
            case 'number':
                textNode = document.createTextNode(value.toString());
                mu.currentParent.appendChild(textNode);
                break;
            case 'undefined':
                // ignore
                break;
            default:
                if (value == null) break;
                if (value instanceof Node) {
                    elt.appendChild(value)
                } else {
                    console.warn({ value });
                    throw Error('Unexpected value type');
                }
                break;
        }
    });
    mu.currentParent = previousParent;
    mu.currentParent.appendChild(elt);
    return elt;
}

type Attributes = Record<string, any>;

function p(args: Attributes | null, ...children: ExprOrElt[]) {
    return elt('p', args, ...children);
}


function span(args: Attributes | null, ...children: ExprOrElt[]): HTMLElement {
    return elt('span', args, ...children);
}

function html(content: string): null {
    mu.currentParent.insertAdjacentHTML("beforeend", content);
    return null;
}

abstract class Expr {
    value?: any;
    listeners?: (() => void)[];

    constructor() {
        console.log('new Expr()', this);
    }

    addListener(listener: () => void, init = false) {
        let listeners = this.listeners || (this.listeners = []);
        listeners.push(listener);
        if (init) listener.call(null);
    }

    getValue(): any {
        return this.value;
    }

    invalidateValue() {
        if (this.value === undefined) return false;
        this.value = undefined;
        return true;
    }

    setValue(newValue: any) {
        if (newValue === undefined) newValue = null;
        let originalValue = this.value;
        if (newValue === originalValue) return;
        this.value = newValue;
        this.listeners?.forEach(listener => listener.call(null));
    }
}
// Mu is designed with long variable names to ease readability when debugging in the browser.
class Var extends Expr {
    constructor(readonly initialValue: any, readonly variableName?: string) {
        super();
        this.setValue(initialValue);
        // the name is mainly there to help debugging.
        this.variableName = variableName;
    }
}

class Func extends Expr {
    constructor(readonly args: ExprOrElt[], readonly lambda: (...any: any) => any) {
        super();
        let onArgChanged = () => {
            // lamba is possibly expensive. We call it only as little as possible
            if (this.invalidateValue()) {
                setTimeout(() => this.calcValue());
            }
        };
        args.forEach(a => {
            if (a instanceof Expr) a.addListener(onArgChanged, true);
        });
    }

    calcValue() {
        let argValues = this.args.map(a => (a instanceof Expr ? a.getValue() : a));
        let newValue = this.lambda.apply(null, argValues);
        this.setValue(newValue ?? null);
    }

    getValue() {
        if (this.value === undefined) this.calcValue();
        return this.value;
    }
}

type ExprOrElt = Expr | Node | string | number| boolean | null | undefined;

function mountCheckBox(v: Expr, elt: HTMLInputElement) {
    elt.checked = v.getValue();
    v.addListener(() => {
        elt.checked = v.getValue();
    });
    elt.onclick = () => v.setValue(elt.checked);
}

function mount(v: Expr, elt:HTMLElement) {
    mu.currentParent = document.createElement('div');
    v.getValue();
    v.addListener(() => {
        elt.replaceChildren(...Array.from(mu.currentParent.childNodes));
    }, true);
    console.log('Mounted', v.getValue(), elt);
}

let mu = {
    currentParent: document.createElement('div') as HTMLElement,
    plus(a: ExprOrElt, b: ExprOrElt): ExprOrElt {
        return new Func([a, b], (a, b) => a + b);
    },
    concat(a: ExprOrElt, b: ExprOrElt): ExprOrElt {
        return new Func([a, b], (a, b) => a + b);
    },
    if(a: ExprOrElt, b: ExprOrElt, c?: ExprOrElt): ExprOrElt {
        return new Func([a, b, c], (a, b, c) => (a ? b : c));
    },
};

