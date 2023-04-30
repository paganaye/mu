(function() {
    var previousServerResponse
    async function checkIfServerResponseChanged(url) {
        const response = await (await fetch(url)).text();
        if (!previousServerResponse) {
            previousServerResponse = response;
            console.log("Stored response for", url);
        }
        else if (response == previousServerResponse){
            console.log("No change");
        } else {
            console.log("Reloading...");
            window.location.reload();
        }
    }
    setInterval(() => checkIfServerResponseChanged(window.location.href),1000);
})();
// Mu is designed with long variable names to ease readability when debugging in the browser.
class Var {
  constructor(variableName) {
    // the name is mainly there to help debugging.
    this.variableName = variableName;
  }
  getValue() {
    return this.value;
  }
  setValue(newValue) {
    if (newValue === this.value) return;
    this.value = newValue;
    this.listeners?.forEach((listener) => listener.call());
  }
  onChange(listener) {
    let listeners = this.listeners || (this.listeners = []);
    listeners.push(listener);
  }
}
console.log("Pascal was here.")

var mu = {
    plus_assign(variable, value) {
        variable.setValue(variable.getValue() + value);
    },
    mount(elt, expr) {
        elt.innerText = expr.getValue();
        expr.onChange(()=>{
            elt.innerText = expr.getValue();
        });
    }
}
