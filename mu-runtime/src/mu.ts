export class Mu {
    static if(a: MuElt, b: MuElt, c?: MuElt): Reactive<any> {
        return new Reactive([a as any, b, c], (a, b, c) => {
            return (a ? b : c)
        });
    }

}

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
    }
}

export function elt(tag: string, attrs: Attributes | null, ...children: MuElt[]): HTMLElement {
    let rootElt: HTMLElement = document.createElement(tag);
    if (attrs) {
        for (let name in attrs) {
            rootElt.setAttribute(name, attrs[name]);
        }
    }
    children?.forEach(child => addChild(rootElt, child));
    return rootElt;
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

export function html(content: string): HTMLElement {
    let temp = document.createElement("div") as HTMLDivElement;
    temp.innerHTML = content;
    return temp.firstChild as HTMLElement
}

class Expr<T> {
    private value: T | undefined;
    listeners?: (() => void)[];
    deepListeners?: ((variableName: string, newValue: any) => void)[];
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

    addListener(listener: () => void, init = false) {
        let listeners = this.listeners || (this.listeners = []);
        listeners.push(listener);
        if (init) listener.call(null);
    }

    addDeepListener(deepListener: (variableName: string) => void, init = false) {
        let deepListeners = this.deepListeners || (this.deepListeners = []);
        deepListeners.push(deepListener);
        if (init) deepListener.call(null, this.variableName ?? "Expr");
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
            this.listeners?.forEach(listener => listener.call(null));
            if (this.parent) {
                this.parent.onChildValueChanged(this.variableName, newValue)
            }
        }
    }

    protected onValueChanging(_newValue: T, _originalValue: T | undefined): boolean {
        return true;
    }

    protected onChildValueChanged(variableName: string, newValue: any) {
        this.deepListeners?.forEach(deepListener => deepListener.call(null, variableName, newValue));
        if (this.parent) {
            this.parent.onChildValueChanged(variableName, newValue)
        }
    }

}

export class Var<T> extends Expr<T> {
    static objectVars = new WeakMap<object, Var<object>>()
    cachedMemberVars?: { [key: string | number]: Var<any> };

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

    static new<T>(name: string, value: T): Var<T> {
        return new Var(undefined, name, value);
    }

    protected constructor(parent: Var<any> | undefined, readonly variableName: string, readonly initialValue: T) {
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
        let cachedResult = this.cachedMemberVars && this.cachedMemberVars[memberName];
        if (cachedResult) return cachedResult;

        let thisValue = this.getValue() as any;
        if (typeof thisValue !== 'object') throw Error("Cannot get member of " + typeof thisValue);
        let memberValue = thisValue[memberName];
        let memberNameString = typeof memberName === "number" ? `[${memberName}]` : memberName;
        let result: Var<U>
        if (memberValue === undefined) memberValue = null;
        if (this instanceof Var<U>) {
            result = Var.get(memberValue, () => new MemberVar(this as any, memberNameString, memberValue)) as Var<U>
        } else throw Error("Cannot get variable members from something that is not a Var");
        (this.cachedMemberVars || (this.cachedMemberVars = {}))[memberName] = result;
        return result;
    }      

}

class MemberVar<T> extends Var<T> {
    // member variables need to change the r
    public constructor(parent: Var<any>, readonly variableName: string, readonly initialValue: T) {
        super(parent, variableName, initialValue);
    }

    protected override onValueChanging(newValue: T, originalValue: T | undefined): boolean {
        this.parent!.getValue()[this.variableName] = newValue;
        return super.onValueChanging(newValue, originalValue);

    }  
}

export class Reactive<T> extends Expr<T> {
    state?: any;

    constructor(readonly args: Expr<any>[], readonly lambda: (this: Reactive<any>, ...any: any) => any) {
        super(undefined, undefined, undefined);
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

    calcValue(): void {
        let argValues = this.args.map(a => (a instanceof Expr ? a.getValue() : a));
        let newValue = this.lambda.apply(this, argValues);
        this.setValue(newValue);
    }
}

export class DeepReactive<T> extends Expr<T> {
    state?: any;

    constructor(readonly args: (Expr<any> | any[] | object)[], readonly lambda: (this: DeepReactive<any>, ...any: any) => any) {
        super(undefined, "DeepFunc", undefined);
        let onArgChanged = () => {
            // lamba is possibly expensive. We call it only as little as possible
            if (this.invalidateValue()) {
                setTimeout(() => this.calcValue());
            }
        };
        args.forEach(a => {
            if (typeof a === "object") {
                if (!(a instanceof Expr)) {
                    a = Var.get(a, () => Var.new("DeepFunc", a));
                }
                if (a instanceof Expr) a.addDeepListener(onArgChanged, true);
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
                        newContent = toElt(newContent)  //  newContent = deepClone(newContent)
                        if (newContent) state.root.append(newContent);
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
        });
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
                    newContent = toElt(newContent)  // deepClone(newContent)
                    if (newContent) state.root.append(newContent);
                }
            })
            return state.root;
        });
    }

    getEntry(idx: number): T {
        return this.itemsVar.getValue()[idx]
    }
}

type MuElt = Node | string | number | boolean | null | undefined | (() => MuElt) | Expr<MuElt> | Promise<MuElt>;

export function mount(v: Expr<MuElt>, elt: HTMLElement) {
    let result = v.getValue() as HTMLDivElement;
    v.addListener(() => {
        elt.replaceChildren(...Array.from(result.childNodes));
    }, true);
    console.log('Mounted', v.getValue(), elt);
}

export function p(attrs: Attributes | null, ...children: MuElt[]) {
    return elt('p', attrs, ...children);
}

export function div(attrs: Attributes | null, ...children: MuElt[]): HTMLDivElement {
    return elt('div', attrs, ...children) as HTMLDivElement;
}

export function span(attrs: Attributes | null, ...children: MuElt[]): HTMLElement {
    return elt('span', attrs, ...children);
}

export function numberInput(v: Var<number>, attrs: Attributes | null = null): HTMLInputElement {
    let e = elt('input', { ...attrs, type: "number" }) as HTMLInputElement;
    v.addListener(() => {
        e.value = v.getValue().toString();
    }, true);
    e.oninput = () => v.setValue(+e.value);
    return e;
}

export function booleanInput(v: Var<boolean>, attrs: Attributes | null = null): HTMLInputElement {
    let e = elt('input', { ...attrs, type: "checkbox" }) as HTMLInputElement;
    v.addListener(() => {
        e.value = v.getValue().toString();
    }, true);
    e.oninput = () => v.setValue(!!e.value);
    return e;
}

export function textInput(v: Var<string>, attrs: Attributes | null = null): HTMLInputElement {
    let e = elt('input', { ...attrs }) as HTMLInputElement;
    v.addListener(() => {
        e.value = v.getValue()?.toString();
    }, true);
    e.oninput = () => v.setValue(e.value);
    return e;
}

function isObjectOrArray(o: any) {
    return typeof o === 'object' && o !== null;
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
