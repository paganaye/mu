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

  invalidateValue() {
    if (this.value === undefined) return false;
    this.value = undefined;
    return true;
  }

  setValue(newValue) {
    if (newValue === undefined) newValue = null;
    let originalValue = this.value;
    if (newValue === originalValue) return;
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
    this.args = args;
    this.lambda = lambda;
    let onArgChanged = () => {
      // lamba is possibly expensive. We call it only as little as possible
      if (this.invalidateValue()) {
        setTimeout(() => this.calcValue());
      }
    };
    args.forEach(a => {
      if (a instanceof Expr) a.addListener(onArgChanged, true)
    });
  }

  calcValue() {
    let argValues = this.args.map(a => a.getValue ? a.getValue() : a);
    let newValue = this.lambda.apply(null, argValues)
    this.setValue(newValue ?? null);
  }

  getValue() {
    if (this.value === undefined) this.calcValue();
    return this.value;
  }
}

var mu = {
  plus_assign(variable, value) {
    console.log("mu.plus_assign",{variable,value})
    variable.setValue(variable.getValue() + value);
  },
  push(variable, value) {
    console.log("mu.push",{variable,value})
  },
  assign(variable,value) {
    console.log("mu.assign",{variable,value})
    if (value instanceof Expr) value=value.getValue();
    variable.setValue(value);
  },
  array(value) {
    console.log("mu.array",{value})
    return value;
  },
  mount(elt, expr) {
    console.log("mu.mount",{elt, expr})
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
  plus(a, b) { return new Func([a, b], (a, b) => a + b); },
  ternary_cond(a, b, c) { return new Func([a, b, c], (a, b, c) => a ? b : c); }
}

function mu_push(variable,value) {
    console.log("mu_push", { variable, value });
}