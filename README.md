# Mu

**A TypeScript language/superset with a dedicated compiler, designed for structured development, promoting functional purity and reactive programming with explicit side-effect management.**

## Description

Mu is an experimental project exploring a novel approach to writing applications by building upon TypeScript/JavaScript. It introduces specific language-level concepts, enforced by a custom compiler.


## Core Features

* **`func` / `proc` Distinction:**
    * `func`: Defines pure functions. Their purity (no side effects, no modification of external state or arguments) is checked at compile time.
    * `proc`: Defines procedures for asynchronous operations and side effects. They are automatically transformed into `async` functions and benefit from optimized `await` management for common I/O operations.
* **Disallows `function` Keyword:** To encourage the systematic use of `func` and `proc`.
* **JSX Syntax Support:** For declarative creation of elements or components. JSX is transformed into calls to a `mu` runtime library (e.g., `mu.elt(...)`, `mu.fragment(...)`).
* **Compile-Time Purity Checks:** The compiler analyzes the body of `func`s to detect impure operations.

## Philosophy / Why Mu?

* **Clarity and Structure:** Mu is both functionnal and procedural but it encourage a clean separation between functions and procedures. 
* **Robustness:** Reduce unexpected side effects through purity checks.
* **Reactivity:** Facilitate the creation of reactive applications.
* **Maintainability:** Better structured and more predictable code is easier to maintain and evolve.

## Key Concepts / Syntax Overview

### `func` (Pure Functions)

`func`tions are at the core of pure logic in Mu. They must not have side effects. The compiler transforms their return values to integrate them into a reactive paradigm.

```typescript
    // Example of a func
    func simpleAddition(a: number, b: number): number {
        // This function is pure.
        return a + b;
    }
```

### `proc` (Asynchronous Procedures)
`proc`edures are used for operations that interact with the outside world, such as network calls, DOM manipulation, or console output. They are asynchronous by nature.

```typeScript
    // Example of a proc
    proc fetchUserData(userId: string) {
        console.log(`Workspaceing data for ${userId}...`); 
        const userData = await fetch(`/api/users/${userId}`); 
        const data = await userData.json(); 
        console.log(data);
    }
```    

### `JSX` (Element Syntax)

Mu supports JSX for describing element structures, potentially for user interfaces.

```typeScript

    // Example of a Mu component using JSX
    func MyComponentUI(props: { message: string }): MuElement { // MuElement is a hypothetical type for the runtime
    return (
        <div class="container">
        <h1>Notification</h1>
        <p>{props.message}</p>
        </div>
    );
    // This will be transformed into calls like:
    // mu.elt("div", { class: "container" },
    //   mu.elt("h1", null, "Notification"),
    //   mu.elt("p", null, props.message)
    // )
    }

```

### Conceptual Example

```typeScript

// --- src/main.mu ---

// Mu requires 'from' to be importable if 'func's are used,
// but the compiler ensures it's added if needed.

// A 'func': pure.
// Its return is transformed into an Observable<string> by the compiler.
func createMessage(name: string): string {
  return `Hello, ${name}, from Mu!`;
}

// A simple component using JSX (transformed by Mu into mu.elt calls)
// MuElement would be a type defined by Mu's runtime.
func MyMessageUI(props: { message: string }): MuElement {
  return <p>{props.message}</p>;
}

// A 'proc': asynchronous, for side effects
proc startApplication() {
  const greeting$ = createMessage("World"); // Calling a 'func'

  // greeting$ is an Observable<string>
  greeting$.subscribe(messageText => {
    console.log("Message from func:", messageText); // Side effect: console output

    // Using the component (would require a Mu runtime for actual rendering)
    const uiElement = <MyMessageUI message={messageText} />;
    // runtimeMu.render(document.body, uiElement); // Hypothetical call to Mu runtime
    console.log("UI Element created (internal representation):", uiElement);
  });

  // Example of an async operation in a proc
  // console.log("Starting an asynchronous operation...");
  // try {
  //   const response = await fetch("[https://api.example.com/data](https://api.example.com/data)"); // 'await' is handled by the compiler
  //   const data = await response.json();
  //   console.log("Data fetched:", data);
  // } catch (error) {
  //   console.error("Error fetching data:", error);
  // }
}
```


# Installation

... TODO