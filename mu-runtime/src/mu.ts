// debugger;
type Attributes = Record<string, any>;


function toElt(value: MuElt): Node | undefined {
    do {
        if (typeof value === 'function') value = (value as Function)();
        else if (value instanceof Expr) value = value.getValue();
        else break;
    } while (true);
    switch (typeof value) {
        case 'boolean':
        case 'string':
        case 'number':
            let textNode = document.createTextNode(value.toString());
            return textNode;
        case 'undefined':
            // ignore
            return undefined;
        default:
            if (value == null) return undefined;
            // if (Array.isArray(value)) {
            //     let result: Node[] = [];
            //     value.forEach(v => {
            //         let e = toElt(v);
            //         if (Array.isArray(e)) result.push(...result);
            //         else if (e instanceof Node) result.push(e);
            //     })
            //     return result;
            // }
            if (value instanceof Node) {
                return value;
            } else {
                console.warn({ value });
                throw Error('Unexpected value ' + typeof (value));
            }
    }
}

function addChild(parent: HTMLElement, child: MuElt) {
    let value;
    let childElt: Node | undefined = toElt(child);
    if (typeof child === 'function') child = (child as Function)();
    if (child instanceof Expr) {
        value = child.getValue();
    } else {
        value = child;
    }
    if (childElt) parent.appendChild(childElt);

    if (child instanceof Expr) {
        child.addListener(() => {
            value = (child as Expr<MuElt>).getValue();
            if (!(value instanceof Node)) {
                if (childElt instanceof Text) {
                    childElt.nodeValue = value!.toString();
                    return
                }
                else value = document.createTextNode(value as any);
            }
            if (childElt && !Array.isArray(childElt) && childElt.parentNode) {
                childElt.parentNode.replaceChild(value, childElt);
                childElt = value;
            } else {
                console.warn("Cannot replace child", { current: childElt, new: value })
            }
        });
        if (!childElt) {
            childElt = document.createComment("Expr");
            parent.appendChild(childElt);
        }
        mu.eltExpr.set(childElt, { expr: child, elt: childElt })
    }
}

function elt(tag: string, attrs: Attributes | null, ...children: MuElt[]): HTMLElement {
    let rootElt: HTMLElement = document.createElement(tag);
    if (attrs) {
        for (let name in attrs) {
            rootElt.setAttribute(name, attrs[name]);
        }
    }
    children?.forEach(child => addChild(rootElt, child));
    return rootElt;
}


function deepClone(originalElt: MuElt): Node | undefined {
    if (originalElt instanceof Node) {
        let clonedElt = originalElt.cloneNode(false);
        originalElt.childNodes?.forEach(originalChild => {
            let renderedExpr = mu.eltExpr.get(originalChild)
            if (renderedExpr?.expr) {
                addChild(clonedElt as HTMLElement, renderedExpr.expr)
            } else {
                let clonedChild = deepClone(originalChild);
                clonedElt.appendChild(clonedChild as HTMLElement);
            }
        })
        return clonedElt;
    } else if (originalElt instanceof Expr) {
        return toElt(originalElt);
    } else return document.createTextNode(originalElt?.toString() ?? ""); //  throw Error("cloning of " + originalElt + " is not implemented.")
}

interface ContainerOptions {
    containerTag: string;
}

interface RepeatOptions extends ContainerOptions { }

const defaultRepeatOptions: RepeatOptions = {
    containerTag: "div",
}

class RepeatState {
    root!: HTMLElement
    count!: number
}

function repeat(count: Expr<number>, content: (i: number) => MuElt, repeatOptions: RepeatOptions = defaultRepeatOptions): MuElt {
    return new Func([count], function (this: Func<MuElt>, count: number) {
        let state: RepeatState = this.state;
        if (!state) {
            state = this.state = {
                root: elt(repeatOptions.containerTag, null),
                count: 0,
            };
        }
        let newCountValue: number = +count;
        if (newCountValue < 0 || isNaN(newCountValue)) newCountValue = 0
        if (state.count < newCountValue) {
            do {
                let newContent = content(state.count);
                let cloned = deepClone(newContent)
                if (cloned) state.root.append(cloned);
                state.count += 1;
            } while (state.count < newCountValue);
        } else while (state.count > newCountValue) {
            let child = state.root.lastChild;
            if (child) child.remove()
            state.count -= 1
        }
        state.count = newCountValue;
        return state.root;
    });
}

interface EachOptions extends ContainerOptions { }

const defaultEachOptions: EachOptions = {
    containerTag: "div",
    childrenTag: "span"
}

class EachState {
    root!: HTMLElement
    count!: number
}


function each<T extends Object>(items: Expr<T[]>, content: (item: T, idx: number) => MuElt, eachOptions: EachOptions = defaultEachOptions): MuElt {
    return new MFunc([items], function (this: MFunc<T>, items: T[]) {
        let state: EachState = this.state;
        if (!state) {
            state = this.state = {
                root: elt(eachOptions.containerTag, null),
                count: 0,
            };
        }
        items.forEach((it, idx) => {
            console.log(it);
            let newContent = content(it, idx);
            if (newContent) {
                newContent = deepClone(newContent)
                state.root.append(newContent!);
            }
        })
        return state.root;
    }) as any;
}

function html(content: string): HTMLElement {
    let temp = document.createElement("div") as HTMLDivElement;
    temp.innerHTML = content;
    return temp.firstChild as HTMLElement
}

abstract class Expr<T> {
    value: T | undefined;
    listeners?: (() => void)[];

    addListener(listener: () => void, init = false) {
        let listeners = this.listeners || (this.listeners = []);
        listeners.push(listener);
        if (init) listener.call(null);
    }

    getValue(): T {
        return this.value!!;
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
class Var<T> extends Expr<T> {
    constructor(readonly initialValue: T, readonly variableName?: string) {
        super();
        this.setValue(initialValue);
        // the name is mainly there to help debugging.
        this.variableName = variableName;
    }
}

class Func<T> extends Expr<T> {
    state?: any;

    constructor(readonly args: Expr<MuElt>[], readonly lambda: (this: Func<any>, ...any: any) => any) {
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
        let newValue = this.lambda.apply(this, argValues);
        this.setValue(newValue ?? null);
    }

    getValue(): T {
        if (this.value === undefined) this.calcValue();
        return this.value!;
    }
}

class MFunc<T> extends Expr<T> {
    state?: any;

    constructor(readonly args: Expr<T[]>[], readonly lambda: (this: MFunc<any>, ...any: any) => any) {
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
        let newValue = this.lambda.apply(this, argValues);
        this.setValue(newValue ?? null);
    }

    getValue(): T {
        if (this.value === undefined) this.calcValue();
        return this.value!;
    }
}


type MuElt = Expr<MuElt> | Node | string | number | boolean | null | undefined;

function mount(v: Expr<MuElt>, elt: HTMLElement) {
    let result = v.getValue() as HTMLDivElement;
    v.addListener(() => {
        elt.replaceChildren(...Array.from(result.childNodes));
    }, true);
    console.log('Mounted', v.getValue(), elt);
}

function p(attrs: Attributes | null, ...children: MuElt[]) {
    return elt('p', attrs, ...children);
}

function div(attrs: Attributes | null, ...children: MuElt[]): HTMLDivElement {
    return elt('div', attrs, ...children) as HTMLDivElement;
}

function span(attrs: Attributes | null, ...children: MuElt[]): HTMLElement {
    return elt('span', attrs, ...children);
}

function numberInput(v: Var<number>, attrs: Attributes | null = null): HTMLInputElement {
    let e = elt('input', { ...attrs, type: "number" }) as HTMLInputElement;
    v.addListener(() => {
        e.value = v.getValue().toString();
    }, true);
    e.oninput = () => v.setValue(+e.value);
    return e;
}

function booleanInput(v: Var<boolean>, attrs: Attributes | null = null): HTMLInputElement {
    let e = elt('input', { ...attrs, type: "checkbox" }) as HTMLInputElement;
    v.addListener(() => {
        e.value = v.getValue().toString();
    }, true);
    e.oninput = () => v.setValue(+e.value);
    return e;
}

function stringInput(v: Var<string>, attrs: Attributes | null = null): HTMLInputElement {
    let e = elt('input', { ...attrs }) as HTMLInputElement;
    v.addListener(() => {
        e.value = v.getValue().toString();
    }, true);
    e.oninput = () => v.setValue(e.value);
    return e;
}

class RenderedExpr {
    expr!: Expr<MuElt>;
    elt?: Node
}

class Mu {
    eltExpr = new WeakMap<Node, RenderedExpr>();

    plus(a: MuElt, b: MuElt): Func<any> {
        return new Func([a as any, b], (a, b) => {
            return a + b
        });
    }
    concat(a: MuElt, b: MuElt): Func<any> {
        return new Func([a as any, b], (a, b) => {
            return a + b
        });
    }
    if(a: MuElt, b: MuElt, c?: MuElt): Func<any> {
        return new Func([a as any, b, c], (a, b, c) => {
            return (a ? b : c)
        });
    }
    loop(n: MuElt, c: MuElt): Func<any> {
        return new Func([n as any, c], (a, b, c) => {
            return (a ? b : c)
        });
    }
}

var mu = new Mu();

