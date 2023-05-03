//----------------------------
let x = new Var(true);
let y = new Var(false);
let r = new Var(5);
let s = new Var(5);

let months = new Var([{ abbr: "Jan", name: "January" }, { abbr: "Feb", name: "February" },
{ abbr: "Mar", name: "March" }, { abbr: "Apr", name: "April" },
{ abbr: "May", name: "May" }, { abbr: "Jun", name: "June" },
{ abbr: "Jul", name: "July" }, { abbr: "Aug", name: "August" },
{ abbr: "Sep", name: "September" }, { abbr: "Oct", name: "October" },
{ abbr: "Nov", name: "November" }, { abbr: "Dec", name: "December" }]);

mount(
  new Func([], () => {
    return div(null,
      div(null, "r", numberInput(r), r),
      div(null, "s", numberInput(s), s),
      div(null, booleanInput(x), "x"),
      div(null, booleanInput(y), "y"),
      repeat(s, (i) => {
        return div(null, "row ", i,
          repeat(r, (j) => '(' + j + ',' + i + ") "))
      }),
      each(months, (it: any) => {
        return elt("li", null, it.abbr, " - ", it.name)
      }, { containerTag: "ol" }),
      div(null,
        mu.if(
          x,
          p(null, "as x is true we show if (y)",
            mu.if(
              y,
              p(null, "y is true",
                span(null, " (in y is true)")),
              p(null, "y is false",
                span(null, " (in y is false)"))
            )
          ),
          p(null, "x is false")
        ))
    );
  }),
  document.body
);
