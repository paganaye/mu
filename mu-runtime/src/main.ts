//----------------------------
var x = new Var(true);
var y = new Var(false);

setTimeout(() => {
  mountCheckBox(x, document.getElementById('xCheckBox') as HTMLInputElement);
  mountCheckBox(y, document.getElementById('yCheckBox') as HTMLInputElement);
})


mount(
  new Func([], () => {
    html(`<div><label>x</label> <input type="checkbox" id="xCheckBox" /></div>
    <div><label>y</label> <input type="checkbox" id="yCheckBox" /></div>`)
    p(null, 'in App');
    p(null, x);
    p(null, 'another one');
    p(null,
      mu.if(
        x,
        p(null,
          span(null, mu.concat("x:", x)),
          mu.if(y,
            span(null, mu.concat(', y:', y)),
          )
        )
      )
    );
  }),
  document.body
);
