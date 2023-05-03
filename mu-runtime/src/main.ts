import { repeat, Var, booleanInput, div, mount, numberInput, p, span, Reactive, each as eachConst, eachVar as eachVar, elt, Mu, DeepReactive, textInput } from "./mu.ts"
//----------------------------
let x = Var.new("x", true);
let y = Var.new("y", false);
let r = Var.new("r", 5);
let s = Var.new("s", 5);

interface Month {
  abbr: string;
  name: string;
  days: number;
}

let months: Month[] = [
  { abbr: "Jan", name: "January", days: 31 }, { abbr: "Feb", name: "February", days: 28 },
  { abbr: "Mar", name: "March", days: 31 }, { abbr: "Apr", name: "April", days: 30 },
  { abbr: "May", name: "May", days: 31 }, { abbr: "Jun", name: "June", days: 30 },
  { abbr: "Jul", name: "July", days: 31 },
  { abbr: "Aug", name: "August", days: 31 }, { abbr: "Sep", name: "September", days: 30 },
  { abbr: "Oct", name: "October", days: 31 }, { abbr: "Nov", name: "November", days: 30 },
  { abbr: "Dec", name: "December", days: 31 }];

let $months = Var.new("months", months);

mount(
  new Reactive([], () => {
    return div(null,
      div(null, "r", numberInput(r), r),
      div(null, "s", numberInput(s), s),
      div(null, booleanInput(x), "x"),
      () => div(null, booleanInput(y), "y"),
      repeat(s, (i) => {
        return div(null, "row ", i,
          repeat(r, (j) => span(null, '(' + j + ',' + i + ") "))
        )
      }),
      eachVar($months, ($month, _idx, _context) => {
        let month = $month.getValue();
        return elt("li", null, month.abbr, " ",
          textInput($month.getMemberVar("name")), " ",
          numberInput($month.getMemberVar("days")))
      }),
      div(null,
        Mu.if(
          x,
          p(null, "as x is true we show if (y)",
            Mu.if(
              y,
              p(null, "y is true",
                span(null, " (in y is true)")),
              p(null, "y is false",
                span(null, " (in y is false)"))
            )
          ),
          p(null, "x is false")
        )),
      elt("pre", null, new DeepReactive([months], () => JSON.stringify(months, undefined, "  ")))
    );
  }),
  document.body
);
