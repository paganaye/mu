export type Dynamic<T> = (() => T | Dynamic<T>) | Expr<T | Dynamic<T>> | Promise<T | Dynamic<T>>;
export type ConstHTMLElt = Node | string | number | boolean | null | undefined | Error;
export type MuElt = ConstHTMLElt | Dynamic<ConstHTMLElt>;

export type ConstAttr = string | number | boolean | null | undefined | Attribute[] | { [key: string]: Attribute } | Error | Function;
export type Attribute = Dynamic<ConstAttr> | ConstAttr;
export type Attributes = Record<string, Attribute>;


function toElt(value: ConstHTMLElt): Node {
    switch (typeof value) {
        case 'boolean':
        case 'string':
        case 'number':
            let textNode = document.createTextNode(value.toString());
            return textNode;
        default:
            if (value === null) return document.createComment("null");
            else if (value === undefined) return document.createComment("undefined");
            else if (value instanceof Node) {
                return value;
            } else if (value instanceof Error) {
                return div({ class: "error" },
                    p(null, elt("span", null, value.name), value.message),
                    elt("pre", null, value.stack)
                )
            } else {
                let message = `Unexpected value ${typeof value} ${JSON.stringify(value)}`;
                console.warn(message, { value });
                return document.createComment(message);
            }
    }
}

function freeze<T>(source: T | Dynamic<T>, listener: (value: T) => void, tempValue: T, immediate: boolean): T {
    function doFreeze(source: T | Dynamic<T>) {
        for (let i = 0; i < 25; i++) {
            if (typeof source === 'function') {
                source = (source as Function)();
            } else if (source instanceof Expr) {
                let expr = source;
                source.addListener({
                    owner: null as any,
                    onExprChanged: () => {
                        listener!(doFreeze(expr.getValue()))
                    }
                })
                source = source.getValue();
            } else if (source instanceof Promise) {
                source.then((value: T | Dynamic<T>) => {
                    listener!(doFreeze(value))
                }).catch((reason: any) => {
                    listener!(reason)
                })
                return tempValue
            } else {
                return source;
            }
        }
        console.warn("Stack overflow in toConcrete", { child: source })
        return tempValue;
    }
    let result = doFreeze(source);
    if (immediate) listener(result);
    return result;
}

function cssFreeze(source: Attribute, multiLine: boolean, listener: (value: string) => void) {
    function getCssString(_ignored: Attribute) {
        let result: string[] = [];
        console.log({ source });
        if (typeof source === "string") result.push(source);
        else if (isObjectAndNotArray(source)) {
            for (let key in source as object) {
                let value = (source as any)[key];
                value = freeze(value, getCssString, "", false)
                result.push(key + ": " + value)
            }
        } else {
            console.warn("cssFreeze", { source });
        }
        listener(multiLine ? result.map(s => "  " + s).join(";\n") : result.join("; "))
    }
    freeze(source, getCssString, "", true);
}


function toCSSAttr(attr: Attribute, elt: HTMLElement): void {

    cssFreeze(attr, false, (value: string) => {
        if (value) elt.setAttribute("style", value)
        else elt.removeAttribute("style")
    });
}

interface CompiledCss {
    content: string;
    styleElt: HTMLStyleElement;
}
let globalCss: Record<string, CompiledCss> = {};

export function css(selectors: string | string[], attr: Attribute) {
    let selector: string = Array.isArray(selectors) ? selectors.join(', ') : selectors;
    cssFreeze(attr, true, (newContent: string) => {
        let current = globalCss[selector];
        if (newContent) {
            if (!current) {
                current = {
                    content: newContent,
                    styleElt: document.createElement("style")
                }
                document.head.appendChild(current.styleElt);
            }
            current.styleElt.innerHTML = selector + " {\n  " + newContent + "\n}";
        } else if (current) {
            current.styleElt.remove();
            delete globalCss[selector];
        }
    });
}

function addChild(parent: HTMLElement, child: MuElt) {
    let childElt: Node | undefined;

    child = freeze(child, (newMuElt) => {
        if (childElt && childElt.parentNode) {
            let newElt = toElt(newMuElt)!;
            childElt.parentNode.replaceChild(newElt, childElt);
            childElt = newElt;
        }
    }, "…", false);
    childElt = toElt(child);
    parent.appendChild(childElt);
}

function applyAttributes(elt: HTMLElement, attrs?: Attributes) {
    for (let name in attrs) {
        let value: Attribute = attrs[name];
        if (typeof value === 'object' && name === "style") toCSSAttr(value, elt);
        else if (name.startsWith('on') && typeof value === "function") {
            // elt.setAttribute(name, "dynamic");
            (elt as any)[name] = value;
        }
        else elt.setAttribute(name, value as any);
    }
}

export function elt(tag: string, attrs?: Attributes | null, ...children: MuElt[]): HTMLElement {
    let domElt: HTMLElement = document.createElement(tag);
    if (attrs) applyAttributes(domElt, attrs);
    children?.forEach(child => addChild(domElt, child));
    return domElt;
}

export function html(tagName: string, attrs: Attributes | null, content: string): HTMLElement {
    let elt = document.createElement(tagName) as HTMLDivElement;
    if (attrs) applyAttributes(elt, attrs);
    elt.innerHTML = content;
    return elt;
}

export function iif(a: Expr<boolean>, b: MuElt, c?: MuElt): Reactive<any> {
    return new Reactive([a as any], (a) => {
        return (a.getValue() ? b : c)
    }, false);
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

export function repeat(count: Expr<number>, content: (i: number) => MuElt, repeatOptions: RepeatOptions = defaultRepeatOptions): MuElt {
    return new RepeatFunc(count, content, repeatOptions);
}

interface EachOptions extends ContainerOptions { }

const defaultEachOptions: EachOptions = {
    containerTag: "div",
}

class EachState {
    root!: HTMLElement
    count!: number
}

export function each<T extends Object>(items: T[], content: (item: T, idx: number) => MuElt, eachOptions: EachOptions = defaultEachOptions): MuElt {
    return elt(eachOptions.containerTag, null, ...items.map((item, idx) => {
        return content(item, idx);
    }))

}

export function eachVar<T extends Object>(items: Var<T[]>, content: (this: EachVar<T>, item: Var<T>, idx: number, context: EachVar<T>) => MuElt, eachOptions: EachOptions = defaultEachOptions): MuElt {
    return new EachVar(items, content, eachOptions) as any;
}

class ShadowNode {
    static ShadowNodes = new WeakMap<Node, ShadowNode>()

    static get(node: Node): ShadowNode {
        let res: ShadowNode | undefined;
        res = ShadowNode.ShadowNodes.get(node);
        if (!res) {
            res = new ShadowNode(node);
        }
        return res;
    }

    constructor(readonly node: Node) { }
    dispose(): void { }
    children?: ShadowNode[];
}

interface ExprListener {
    owner: ShadowNode;
    onExprChanged(): void
}

interface DeepListener {
    onMemberChanged(memberName: string, newValue: any): void
}

class Expr<T> {
    private value: T | undefined;
    listeners?: ExprListener[];
    deepListeners?: DeepListener[];
    readonly variableName: string;
    static variableNameCounters = new Map<string, number>()

    constructor(readonly parent: Expr<any> | undefined, variableName: string | undefined, initialValue: T | undefined) {
        if (!variableName) {
            variableName = this.constructor.name;
            let counter = (Expr.variableNameCounters.get(variableName) ?? 0) + 1;
            Expr.variableNameCounters.set(variableName, counter);
            variableName += counter;
        }
        this.variableName = variableName;
        if (initialValue !== undefined) this.setValue(initialValue);
    }

    addListener(listener: ExprListener, init = false) {
        let listeners = this.listeners || (this.listeners = []);
        listeners.push(listener);
        if (init) listener.onExprChanged();
    }

    removeListener(listener: ExprListener) {
        if (!this.listeners) return
        let idx = this.listeners.indexOf(listener)
        if (idx >= 0) this.listeners?.splice(idx, 1);
    }

    addDeepListener(deepListener: DeepListener, init = false) {
        let deepListeners = this.deepListeners || (this.deepListeners = []);
        deepListeners.push(deepListener);
        if (init) deepListener.onMemberChanged(this.variableName ?? "Expr", null);
    }

    getValue(): T {
        if (this.value === undefined) this.calcValue();
        return this.value!;
    }

    calcValue(): void {
        throw Error("Internal Error calcValue not defined for " + this.constructor.name)
    }

    invalidateValue() {
        if (this.value === undefined) return false;
        this.value = undefined;
        return true;
    }

    setValue(newValue: T) {
        if (newValue === undefined) newValue = null as any;
        let originalValue = this.value;
        if (newValue === originalValue) return;
        if (this.onValueChanging(newValue, originalValue)) {
            this.value = newValue;
            this.listeners?.forEach(listener => listener.onExprChanged());
            if (this.parent) {
                this.parent.onChildValueChanged(this.variableName, newValue)
            }
        }
    }

    protected onValueChanging(_newValue: T, _originalValue: T | undefined): boolean {
        return true;
    }

    protected onChildValueChanged(variableName: string, newValue: any) {
        this.deepListeners?.forEach(deepListener => deepListener.onMemberChanged(variableName, newValue), null);
        if (this.parent) {
            this.parent.onChildValueChanged(variableName, newValue)
        }
    }

}

export class Var<T> extends Expr<T> {
    static objectVars = new WeakMap<object, Var<object>>()

    static get<T>(initialValue: any, createNew: () => Var<T>): Var<T> {
        let res: Var<T> | undefined;
        if (typeof initialValue === 'object' && initialValue != null) {
            res = Var.objectVars.get(initialValue) as Var<T> | undefined;
            if (!res) {
                res = createNew()
                Var.objectVars.set(initialValue, res as any);
            }
        } else {
            res = createNew()
        }
        return res
    }

    public constructor(readonly initialValue: T, variableName: string = "unnamed-variable", parent: Var<any> | undefined = undefined) {
        super(parent, variableName, initialValue);
        if (isObjectOrArray(initialValue)) {
            Var.objectVars.set(initialValue as object, this as Var<object>);
        }
    }

    protected override onValueChanging(newValue: T, originalValue: T | undefined): boolean {
        if (isObjectOrArray(originalValue)) {
            console.log("We're modifying an object or array var")
        }
        if (isObjectOrArray(newValue)) {
            console.log("We're modifying a var to an object or array")
        }
        return super.onValueChanging(newValue, originalValue);
    }

    public getMemberVar<U>(memberName: string | number): Var<U> {
        let thisValue = this.getValue() as any;
        if (typeof thisValue !== 'object') throw Error("Cannot get member of " + typeof thisValue);
        let memberValue = thisValue[memberName];
        let memberNameString = typeof memberName === "number" ? `[${memberName}]` : memberName;
        let result: Var<U>
        if (memberValue === undefined) memberValue = null;
        if (this instanceof Var<U>) {
            result = Var.get(memberValue, () => new MemberVar(this as any, memberNameString, memberValue)) as Var<U>
        } else throw Error("Cannot get variable members from something that is not a Var");
        return result;
    }

}

class MemberVar<T> extends Var<T> {
    // member variables need to change the r
    public constructor(parent: Var<any>, readonly variableName: string, readonly initialValue: T) {
        super(initialValue, variableName, parent);
    }

    protected override onValueChanging(newValue: T, originalValue: T | undefined): boolean {
        this.parent!.getValue()[this.variableName] = newValue;
        return super.onValueChanging(newValue, originalValue);

    }
}

export function watch(watch: Expr<any>[], lambda: (this: Reactive<any>, ...any: Expr<any>[]) => any, immediate: boolean = true): Expr<MuElt> {
    return new Reactive(watch, lambda, immediate);
}

class Reactive<T> extends Expr<T> {
    state?: any;

    constructor(readonly args: Expr<any>[], readonly lambda: (this: Reactive<any>, ...any: any) => any, immediate: boolean) {
        super(undefined, undefined, undefined);
        let onArgChanged: ExprListener = {
            owner: null as any,
            onExprChanged: () => {
                // lamba is possibly expensive. We call it only as little as possible
                if (this.invalidateValue()) {
                    setTimeout(() => this.calcValue());
                }
            }
        }
        args.forEach(a => {
            if (a instanceof Expr) a.addListener(onArgChanged, true);
        });
        if (immediate) this.calcValue()
    }

    calcValue(): void {
        // let argValues = this.args.map(a => (a instanceof Expr ? a.getValue() : a));
        let newValue = this.lambda.apply(this, this.args);
        this.setValue(newValue);
    }
}

export class DeepReactive<T> extends Expr<T> {
    state?: any;

    constructor(readonly args: (Expr<any> | any[] | object)[], readonly lambda: (this: DeepReactive<any>, ...any: any) => any) {
        super(undefined, "DeepFunc", undefined);
        let onMemberChanged = () => {
            // lamba is possibly expensive. We call it only as little as possible
            if (this.invalidateValue()) {
                setTimeout(() => this.calcValue());
            }
        };
        args.forEach(a => {
            if (typeof a === "object") {
                if (!(a instanceof Expr)) {
                    a = Var.get(a, () => new Var(a));
                }
                if (a instanceof Expr) a.addDeepListener({
                    onMemberChanged
                }, true);
            }
        });
    }

    calcValue(): void {
        let argValues = this.args.map(a => (a instanceof Expr ? a.getValue() : a));
        let newValue = this.lambda.apply(this, argValues);
        this.setValue(newValue);
    }
}

class RepeatFunc<T> extends Reactive<T> {
    constructor(count: Expr<number>, content: (idx: number, context: RepeatFunc<T>) => MuElt, repeatOptions: RepeatOptions = defaultRepeatOptions) {
        super([count], function (count: number) {
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
                    let newContent = content(state.count, this);
                    if (newContent) {
                        addChild(state.root, newContent)
                    }
                    state.count += 1;
                } while (state.count < newCountValue);
            } else while (state.count > newCountValue) {
                let child = state.root.lastChild;
                if (child) child.remove()
                state.count -= 1
            }
            state.count = newCountValue;
            return state.root;
        }, false); // or true?
    }
}

export class EachVar<T> extends Reactive<T> {
    constructor(readonly itemsVar: Var<T[]>, content: (item: Var<T>, idx: number, context: EachVar<T>)
        => MuElt, eachOptions: EachOptions = defaultEachOptions) {

        super([itemsVar], (items: T[]) => {
            let state: EachState = this.state;
            if (!state) {
                state = this.state = {
                    root: elt(eachOptions.containerTag, null),
                    count: 0,
                };
            }
            items.forEach((_it, idx) => {
                // let entryVar = Var.get(itemsVar, `${itemsVar.variableName}[${idx}]`, _it);
                let newContent = content(itemsVar.getMemberVar(idx), idx, this);
                if (newContent) {
                    addChild(state.root, newContent);
                }
            })
            return state.root;
        }, false); // or true?
    }

    getEntry(idx: number): T {
        return this.itemsVar.getValue()[idx]
    }
}

export function mount(v: MuElt, elt: HTMLElement | string) {
    let htmlElement = (typeof elt === "string")
        ? document.getElementById(elt)!
        : elt!;
    freeze(v, (o) => {
        htmlElement.replaceChildren(toElt(o))
    }, "…", true)
}

function isObjectOrArray(o: any) {
    return typeof o === 'object' && o !== null;
}

function isObjectAndNotArray(o: any) {
    return typeof o === 'object' && o !== null && !Array.isArray(o);
}

// ====================================================================================
// ============= potentially optional code which we should perhaps remove =============
// ====================================================================================

export function p(attrs?: Attributes | null, ...children: MuElt[]) {
    return elt('p', attrs, ...children);
}

export function div(attrs?: Attributes | null, ...children: MuElt[]): HTMLDivElement {
    return elt('div', attrs, ...children) as HTMLDivElement;
}

export function span(attrs?: Attributes | null, ...children: MuElt[]): HTMLElement {
    return elt('span', attrs, ...children);
}

export function numberInput(v: Var<number>, attrs: Attributes | null = null): HTMLInputElement {
    let e = elt('input', { ...attrs, type: "number" }) as HTMLInputElement;
    v.addListener({
        owner: null as any,
        onExprChanged: () => {
            e.value = v.getValue().toString();
        }
    }, true);
    e.oninput = () => v.setValue(+e.value);
    return e;
}

export function booleanInput(v: Var<boolean>, attrs: Attributes | null = null): HTMLInputElement {
    let e = elt('input', { ...attrs, type: "checkbox" }) as HTMLInputElement;
    v.addListener({
        owner: null as any,
        onExprChanged: () => {
            e.value = v.getValue().toString();
        }
    }, true);
    e.oninput = () => v.setValue(!!e.value);
    return e;
}

export function textInput(v: Var<string>, attrs: Attributes | null = null): HTMLInputElement {
    let e = elt('input', { ...attrs }) as HTMLInputElement;
    v.addListener({
        owner: null as any,
        onExprChanged: () => {
            e.value = v.getValue()?.toString();
        }
    }, true);
    e.oninput = () => v.setValue(e.value);
    return e;
}



/*
function deepClone(originalElt: MuElt): Node | undefined {
    if (originalElt instanceof Node) {
        let clonedElt = originalElt.cloneNode(false);
        originalElt.childNodes?.forEach(originalChild => {
            let renderedExpr = mu.eltExpr.get(originalChild)
            if (renderedExpr) {
                addChild(clonedElt as HTMLElement, renderedExpr)
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
*/
