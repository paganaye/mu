# MU

## Introduction

Have you heard of Mu? It's a cool experimental language that can be used for both server-side and client-side web development. Although it has a syntax similar to JavaScript, it's not just a clone of the popular language.
It is inspired by Douglas Crockford famous Javascript: The Good Parts.

## Why another framework 

Vue, React, Svelte, and other frameworks provide access to both the positive and negative aspects of JavaScript. Although these tools can be beneficial in many ways, they cannot entirely eliminate the challenges associated with using JavaScript.

Mu however is a language, it implements only the good parts of Javascript and brings several new concepts. 

## Concepts

Mu aims are:
* Provide unbreakable reactivity
* Provide unbreakable asynchronicity
* Being easy to learn for Javascript programmers
* To run in either a server or a browser environment

## Goal 1 - Reactivity

### 1.1 Simple counter

This simple program shows button that increments a counter. 

Here, it is very similar to Svelte, Vue or React.

    <script>
    let count = 0;
    </script>
    <button onclick={count=count+1}>
        Clicked {count} {count == 1 ? 'time' : 'times'}
    </button>
    <button onclick={count=0}>Reset</button>

The button texts are automatically modified when the counter is changed.

## Language

### Javascript
mu is mainly javascript derived.
There are subtle differences:
 * expressions are reactive
 * when a function is purely functional it becomes an expression
 * the functions that can't be purely functional are asynchronous
 * the `this` keyword is not mandatory.
 
## Templating

I am not decided on Templating perhaps I should show diverent
Again, it is very similar to Svelte, Vue or React.

### Vue
Vue is compact and well readable for me. 

    <template v-if="todos && todos.length">
      <ul>
        <li v-for="todo in todos" :key="todo.id">{{ todo.text }}</li>
      </ul>
    </template>
    <p v-else>There is nothing to do now</p>

Templates are empty HTML elements.
You have to provide a key. 

### React
React is hugely popular but somewhat cryptic.

    {todos ? (
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    ) : (
      <p>There is nothing to do now</p>
    )}

It is nice that it can use JS syntax. 
    
### Mu HTML rendering
Mu implements both Vue style attributes and React JSX concepts.

#### Mu templates
mu attributes 
 * if
 * while
 * foreach
 * else
 * else if

Custom mu tags 
 * &lt;template>&lt;/template>

 We get this

    <template if={todos && todos.length}>
      <ul>
        <li foreach={todo in todos}>{{ todo.text }}</li>
      </ul>
    </template>
    <p else>There is nothing to do now</p>

#### Mu JSX

Mu implements standard JSX but also a more procedural JSX Builder

    if (todos) {
       for(todo of todos) {
           render(<li key={todo.id}>{todo.text}</li>)
       }
    }
    else render(<p>There is nothing to do now</p>)
    
### Other Goals (to be sorted)

To the casual user the language feels like Javascript and HTML.

It is however a new language, it compiles and generates HTML, CSS, and JavaScript.

It is inspired by TypeScript, Svelte and React.
The aim is to keep the good part of Javascript and try to remove the bad parts.

One of Mu's strengths is that it compiles and generates HTML, CSS, and JavaScript that can be executed on the server or sent to the browser. The aim is to make it easy to create dynamic and interactive web applications using a single language.

Mu internally uses purely functional constructs. Expressions in Mu are reactive, allowing for instant updates of HTML pages without the need for additional constructs.

Another crucial aspect of Mu is its asynchronous mechanism. All functions and methods in Mu are asynchronous, which ensures that the language will never block the web page or the server.


At present, Mu is implemented in Kotlin, but the goal is for it to be self-compiling in the future. Although still in development, Mu has the potential to be a powerful and flexible language for building robust and high-performance web applications.
