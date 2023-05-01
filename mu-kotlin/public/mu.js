(function () {
  var previousServerResponse
  async function checkIfServerResponseChanged(url) {
    const response = await (await fetch(url)).text();
    if (!previousServerResponse) {
      previousServerResponse = response;
      console.log("Stored response for", url);
    }
    else if (response == previousServerResponse) {
      console.log("No change");
    } else {
      console.log("Reloading...");
      window.location.reload();
    }
  }
  setInterval(() => checkIfServerResponseChanged(window.location.href), 1000);
})();
class Expr {
  addListener(listener, init) {
    let listeners = this.listeners || (this.listeners = []);
    listeners.push(listener);
    if (init) listener.call();
  }
  getValue() {
    return this.value;
  }
  setValue(newValue) {
    if (newValue === undefined) newValue = null;
    if (newValue === this.value) return;
    this.value = newValue;
    this.listeners?.forEach((listener) => listener.call());
  }
}
// Mu is designed with long variable names to ease readability when debugging in the browser.
class Var extends Expr {
  constructor(originalValue, variableName) {
    super();
    this.setValue(originalValue);
    // the name is mainly there to help debugging.
    this.variableName = variableName;
  }
}

class Func extends Expr {
  constructor(args, lambda) {
    super();
    this.args = args;
    this.lambda = lambda;
    let onArgChanged = () => {
      if (this.value !== undefined) {
        this.value = undefined;
        this.listeners?.forEach((listener) => listener.call());
      }
    };
    args.forEach(a => {
      if (a instanceof Expr) a.addListener(onArgChanged, true)
    });
  }
  getValue() {
    if (this.value === undefined) {
      let argValues = this.args.map(a => a.getValue ? a.getValue() : a);
      let newValue = this.lambda.apply(null, argValues)
      this.value = newValue ?? null;
    }
    return this.value;
  }
}

var mu = {
  plus_assign(variable, value) {
    variable.setValue(variable.getValue() + value);
  },
  mount(elt, expr) {
    // first we replace the <span element>
    let text = expr.getValue();
    let newElt = document.createTextNode(text)
    elt.parentNode.replaceChild(newElt, elt)
    // then we listen to the expression changes
    expr.addListener(() => {
      newElt.nodeValue = expr.getValue();
    }, true);
  },
  // the functions below are reactive and called when their arguments change
  equalequal(a, b) { return new Func([a, b], (a, b) => a == b); },
  ternary_cond(a, b, c) { return new Func([a, b, c], (a, b, c) => a ? b : c); }
}
