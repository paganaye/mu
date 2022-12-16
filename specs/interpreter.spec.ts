import { Mu, MuInterpreter } from '../src/runtime/MuInterpreter';

let lastPrint: any[];
let e: MuInterpreter;

type DynamicTitleTest = [string, () => void];

function testEval(sourceCode: string, expectedValue: any, suffix = ""): DynamicTitleTest {
  return [
    sourceCode + " => " + expectedValue + suffix,
    () => {
      const actualValue = e.eval(sourceCode);
      expect(actualValue).toEqual(expectedValue)
    }
  ];
}

beforeEach(() => {
  e = Mu()
    .addFunction("print", (...args) => {
      const res = args.length > 0 ? args[0] : null
      lastPrint = res;
      return res
    })
    .addFunction("returnsPromise", a1 => new Promise((s, f) => { setTimeout(() => s(a1), 10) }))
    .addFunction("add", (a, b, c, d) => { let r = a + b; if (c) { r += c; } if (d) { r += d; } return r; });
});

it('Test1', () => {
  expect(e).toBe(e);
});

it('1+2', () => {
  expect(e.eval("1+2")).toBe(3);
  expect(e.eval("1+2+3")).toBe(6);
});

it(`"hello" + " " + "world"`, () => {
  expect(e.eval(`"hello" + " " + "world"`)).toBe('hello world');
});

it(`""hello"" + " " + '"world"'`, () => {
  expect(e.eval(`"'hello'" + \` \` + '"world"'`)).toBe(`'hello' "world"`);
});

it('(1 + 2) * 3', () => {
  expect(e.eval("(1 + 2) * 3")).toBe(9);
  expect(e.eval("(1 + 2) * 3 + 5")).toBe(14);
});

it('(1 + 2) * (3 + 5)', () => {
  expect(e.eval("(1 + 2) * (3 + 5)")).toBe(24);
  expect(e.eval("(1 + 2) * (3 + 4) -5")).toBe(16);

  expect(e.eval("2*(3+4)")).toBe(14);
  expect(e.eval("2*(3+4)+5")).toBe(19);
});

it('1+2*3', () => {
  expect(e.eval("1 + 2 * 3")).toBe(1 + 2 * 3);
  expect(e.eval("1 + 2 * 3 + 4")).toBe(1 + 2 * 3 + 4);
});


it('2 * 3 + 4 * 5', () => {
  expect(e.eval("(1 + 2) + (3 + 4) * (5*6)")).toBe((1 + 2) + (3 + 4) * (5 * 6));
  expect(e.eval("(1 + 2) + (3 + 4) * 5")).toBe((1 + 2) + (3 + 4) * 5);
  expect(e.eval("2*3+4*5")).toBe(2 * 3 + 4 * 5);
  expect(e.eval("2*(3+4)+5*6")).toBe(2 * (3 + 4) + 5 * 6);
});

it('2 * 3 + 4 * 5', () => {
  expect(e.eval("1+2*1/4")).toBe(1 + 2 * 1 / 4)
  expect(e.eval("1+2*1/2+3")).toBe(1 + 2 * 1 / 2 + 3)

});

it('1*2/4 + 2*3/6', () => {
  expect(e.eval("1*2/4 + 2*3/6")).toBe(1 * 2 / 4 + 2 * 3 / 6)
  expect(e.eval("1*2/4 + 2*3/6 - 2.3")).toBe(1 * 2 / 4 + 2 * 3 / 6 - 2.3)
  expect(e.eval("7+1*2/4 + 2*3/6 - 2.3")).toBe(7 + 1 * 2 / 4 + 2 * 3 / 6 - 2.3)
});

it('5 – (5 * (32 + 4))', () => {
  expect(e.eval("5 - (5 * (32 + 4))")).toBe(5 - (5 * (32 + 4)))
  expect(e.eval("12 * 5 - (5 * (32 + 4)) + 3")).toBe(12 * 5 - (5 * (32 + 4)) + 3)
});

it('o.sub1', () => {
  const obj = { o: { v1: 55 } };
  expect(e.eval("o.v1", obj)).toBe(55)
});

it('o.sub1.subValue', () => {
  const obj = { o: { v1: 55, sub1: { subValue: 45 } } };
  expect(e.eval("o.v1 + o.sub1.subValue", obj)).toBe(100)
  expect(e.eval(`o.v1 + o.sub1["sub" + "Value"]`, obj)).toBe(100)
  expect(e.eval("o.v1 + o['sub1'].subValue", obj)).toBe(100)
});

it('assignment o.sub1.subValue', () => {
  const obj = { o: { v1: 55, sub1: { subValue: 45 } } };
  expect(e.eval("o.sub1.subValue2 = 10\no.sub1.subValue2", obj)).toBe(10)
});

it('def fn()', () => {
  expect(e.eval([
    "def fn():",
    "    return 12",
    "fn()"])).toBe(12)
});

it('def fn(x)', () => {
  expect(e.eval([
    "def fn(x):",
    "    return x*2",
    "fn(7)"])).toBe(14)
});

it('func call', () => {
  const obj = { add: (x: number, y: number) => x + y };

  expect(e.eval("add(2, 3)", obj)).toBe(5)
  expect(e.eval("add(2+10, 3)", obj)).toBe(15)
});


it(`empty or special param`, () => {
  expect(e.eval(`def f(p):\n  p\nf('')`)).toBe(``);
  expect(e.eval(`def f(p):\n  p\nf('"')`)).toBe(`"`);
  expect(e.eval(`def f(p):\n  p\nf("'")`)).toBe(`'`);
  expect(e.eval(`def f(p):\n  p\nf(",")`)).toBe(`,`);
  expect(e.eval(`def f(p):\n  p\nf(" ")`)).toBe(` `);
  expect(e.eval(`def f(p):\n  p\nf(")")`)).toBe(`)`);
  expect(e.eval(`def f(p):\n  p\nf("}")`)).toBe(`}`);
});

it('Object call', () => {
  const obj = { o: { add: (x: number, y: number) => x + y } };

  expect(e.eval("o.add(2, 3)", obj)).toBe(5)
  expect(e.eval("o.add(2 * 10, 3)", obj)).toBe(23)
  expect(e.eval(`
    o.add(
      2 * 10,
      3
      )`, obj)).toBe(23)

});

it('Object call2', () => {
  const obj = {
    o: {
      add: (x: number, y: number) => x + y,
      getObject: (p: string) => { return { p } }
    }
  };

  expect(e.eval("o.getObject(5).p", obj)).toBe(5)
  expect(e.eval("x = o.getObject(5)\nx.p * x.p", obj)).toBe(25)
});

it('json obj', () => {
  expect(e.eval(`x = {m1: 1+2*3, m2: "ee"}\nx.m1`)).toBe(7);
  expect(e.eval("x = {'m1': 1+2*3}\nx.m1")).toBe(7);
});



it('json with dynamic key', () => {
  expect(e.eval(`
p = "prop"
x = { [p + "_"+1]: 1+2*3}
x.prop_1`)).toBe(7);
  expect(e.eval(`p = {x:"prop"}\nx = {[p.x + "_"+1]: 1+2*3}\nx.prop_1`)).toBe(7);
});

it('json single name prop', () => {
  expect(e.eval([
    "pp = 't1'",
    "x = {pp}",
    "x.pp"])).toBe('t1');
  expect(e.eval([
    "pp = 5",
    "x = {pp, x:10}",
    "x.pp + x.x"])).toBe(15);
});

it('json array', () => {
  expect(e.eval(`x = [{m1: 1+2*3, m2: "ee"}]\nx.length`)).toBe(1);
  expect(e.eval("x = [1,2,3]\nx.length")).toBe(3);
  expect(e.eval("x = [1,2,3]\nx[1]")).toBe(2);
  expect(e.eval("x = [{f1:1, f2:12}, {f1:2, f2:22}, {f1:3, f2:32}]\nx[1].f2")).toBe(22);
  expect(e.eval("x = [{f1:1, f2:12}, {f1:2, f2:22}, {f1:3, f2:32}]\nx[1].f2 = 55\nx[1].f2")).toBe(55);
});

it('array map', () => {
  const script = `
    def fn(n):
      {
        t1: n * 2,
        t2: n * 3
      }
        
    arr = [1,2,3]
    arr.map(fn)     
    `;
  const res = e.eval(script) as { t1: number, t2: number }[];

  expect(res.length).toBe(3);
  expect(res.map(o => o.t1 + o.t2).join(',')).toBe("5,10,15");
});

it('array map 2', () => {
  const script = `
  def map(n):
    {
      t1: n * 2,
      t2: n * 3
    }
  
  def map2(o):
      o.t1 + o.t2
  
  arr = [1,2,3]
  
  arr
      .map(map)
      .map(map2)
      .join(",")
      `;
  expect(e.eval(script)).toBe("5,10,15");
});

it('arrow functions', () => {
  const script = `
    arr = [1,2,3]
    arr.map(n =>
            n = n * 2
            return {
                t1: n * 2,
                t2: n * 3
            }).map(r => r.t1 * 8).join(',')     
      `;
  expect(e.eval(script)).toBe("32,64,96");
});

it('arrow functions with filter', () => {
  const script = `
    arr = [1,2,3]
    arr.map(n =>
        n = n * 2
        {
          t1: n * 2,
          t2: n * 3
        }
      )
      .filter(v => (v.t1 > 10) or (v.t2 > 10))
      .map(r => r.t1 * r.t2)
      .join(',')
        `;
  expect(e.eval(script)).toBe("96,216");
});


it('print empty string', () => {
  const script = `
    print(
      ""
    )
    `;
  expect(e.eval(script, { print: (v: string) => v })).toBe('');
}

);
it('if condition', () => {
  const script = (p: number) => `
    x = 1
    if x == ${p}:
      x = 5
    else:
      x = 10
    x
          `;
  expect(e.eval(script(1))).toBe(5);
  expect(e.eval(script(2))).toBe(10);
});

it('if condition', () => {

  expect(e.eval(`
   x = {o1: {ov: 55}}
   x.o1.ov1?.someProp or 32
   `)).toBe(32);

  expect(e.eval("x={}\nx?.p1?.ff")).toBe(null);
});

it('simple for', () => {
  const script = `
    sum = 0
    for item in [1,2,3]:
      sum = sum + item
    sum
      `;
  expect(e.eval(script)).toBe(6);
});

it('simple while', () => {
  const script = `
    sum = 0
    i = 0
    
    while i < 5:
        sum = sum + i
        i = i + 1

    sum
    `;
  expect(e.eval(script)).toBe(10);
});

it('funcCall with null coalescing', () => {
  const script = `
    def f():
      null

    f()?.prop or 5
    `
    ;
  expect(e.eval(script)).toBe(5);
});

it('long comments issue', () => {
  const script = `
    def f2():
      """
      long comment
      """
      5

    f2()
    `
    ;
  expect(e.eval(script)).toBe(5);
});

it('nude lambda', () => {
  expect(e.eval("()=>null")).toBeInstanceOf(Function);
});


it('chaining funcCall with null coalescing', () => {
  expect(e.eval("p={f: ()=>null}\np?.f()?.sdsd")).toBe(null);
  expect(e.eval("p={f: ()=>null}\np?.f()?.sdsd or 5")).toBe(5);
});

it('comparison operations', () => {
  expect(e.eval("1+2*3==7")).toBe(true);
  expect(e.eval("1+2==2")).toBe(false);
});

it('comparison operations', () => {
  expect(e.eval("1+2*3==7")).toBe(true);
  expect(e.eval("1+2==2")).toBe(false);
});

// ** migration issue for now
it('simple and operator', async () => {
  expect(await e.evalAsync('2 == 2 and 3 == 3')).toBe(true)
  expect(await e.evalAsync('(2 == 2) and (3 == 3) and (5 == 5)')).toBe(true)
  expect(await e.evalAsync('(2 == 2) and (3 != 3) and (5 == 5)')).toBe(false)
  expect(await e.evalAsync('(2 != 2) and (3 != 3) and (5 == 5)')).toBe(false)
  expect(await e.evalAsync('(2 != 2) and (3 == 3) and (5 == 5)')).toBe(false)
  expect(await e.evalAsync('(2 == 2) and (3 == 3) and (5 != 5)')).toBe(false)
});

it('simple or operator', async () => {
  expect(await e.evalAsync('2 == 2 or 3 == 3')).toBe(true)
  expect(await e.evalAsync('2 == 2 or 3 == 3 or 5 == 5')).toBe(true)
  expect(await e.evalAsync('2 != 2 or 3 != 3 or 5 != 5')).toBe(false)
  expect(await e.evalAsync('2 == 2 or 3 != 3 or 5 != 5')).toBe(true)
  expect(await e.evalAsync('2 == 2 or 3 == 3 and 5 != 5')).toBe(true)
});

it("conditionals", async () => {
  expect(await e.evalAsync('x = null\nx == null')).toBe(true)
  expect(await e.evalAsync('x = null\nx?.p1?.p == null')).toBe(true)
  expect(await e.evalAsync('x = null\nx != null and x.length >0')).toBe(false)
  expect(await e.evalAsync('x = null\nx?.p1?.p != null and x.length >0')).toBe(false)
});

it('arithmetic + comparison', async () => {
  expect(await e.evalAsync('0.25 == 1/4')).toBe(true)
  expect(await e.evalAsync('0.25 == 1/2')).toBe(false)

  expect(await e.evalAsync('1+2*3 == 5 or 1 > 3')).toBe(false)
  expect(await e.evalAsync('1+2*3 == 5 or 1 < 3')).toBe(true)

  expect(await e.evalAsync('2 == 1/2 + 1/2 and 1/2 + 1/2 == 1')).toBe(false)
  expect(await e.evalAsync('(2 == 1/2 + 1/2) and (1/2 + 1/2 == 1)')).toBe(false)
  expect(await e.evalAsync('(2 == (1/2 + 1/2)) and ((1/2 + 1/2) == 1)')).toBe(false)
});

it('Negative number', async () => {
  expect(await e.evalAsync('-1')).toBe(-1)
});

it('number in parenthesis', async () => {
  expect(await e.evalAsync('(1)')).toBe(1)
});

it('5+4*3**2', async () => {
  expect(await e.evalAsync('5+4*3**2')).toBe(41)
});

it('5+4*3**2', async () => {
  expect(e.eval('5+4*3**2')).toBe(41)
});



it('Negative numbers', async () => {
  expect(await e.evalAsync('x=-1\nx')).toBe(-1)
  expect(await e.evalAsync('x=-3.14 + 3\nx')).toBe(-3.14 + 3)
  expect(await e.evalAsync('-3.14 - 3')).toBe(-3.14 - 3)
  expect(await e.evalAsync('x=5\nx*-1')).toBe(-5)
  expect(await e.evalAsync(`
    def f(x):
      return x
    
    f(-5)
    `)).toBe(-5)

  expect(await e.evalAsync(`
    def f(x):
      return x
    
    f(-0.14)
    `)).toBe(-0.14)

  expect(await e.evalAsync('1/2*-1 == -0.5')).toBe(true)

});

it('Recursive function - power', async () => {

  const script =
    `
    def power(base, exponent):
      if exponent == 0:
        return 1
      else:
        return base * power(base, exponent - 1)
    
    "5 ** 10 == " + power(5, 10) + " == " + Math.pow(5, 10)    
    `
  expect(await e.evalAsync(script)).toBe('5 ** 10 == 9765625 == 9765625');
});

it('try catch error', async () => {
  const script = `
x = []
try:
  x.push("try")
  raise RangeError("RangeError")
except ReferenceError as e:
  x.push("ReferenceError")
except RangeError as e:
  x.push("RangeError")
except Error as e:
  x.push("Error")
else:
  x.push("else")
finally:
  x.push("finally")
x
`;
  expect(e.eval(script)).toEqual(["try", "RangeError", "finally"]);
  expect(await e.evalAsync(script)).toEqual(["try", "RangeError", "finally"]);
})

it('try catch no error', async () => {
  const script = `
    x = []
    try:
      x.push(1)
    except:
      x.push(2)
    finally:
      x.push(3)
    else:
      x.push(4)
    x
    `;
  const check = (result: number[]): void => {
    expect(result.length).toBe(3);
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(4);
    expect(result[2]).toBe(3);
  }

  check(await e.evalAsync(script) as number[])
  check(e.eval(script) as number[])
})

it('try catch errorMessage', async () => {
  const script = `
    m = ''
    try:
      raise Error('My Message')
      x.push(1)
    except Error as e:
      m = e.message
    m
    `;

  expect(await e.evalAsync(script)).toContain('My Message');
  expect(e.eval(script)).toContain('My Message');
})

it('try catch errorMessage with alias', async () => {
  const script = `
    m = ''
    try:
      raise Error('My Message')
      x.push(1)
    except Error as err:
      m = err.message
    m
    `;

  expect(await e.evalAsync(script)).toContain('My Message');
  expect(e.eval(script)).toContain('My Message');
})

it('try catch JS errorMessage', async () => {
  const script = `
    m = ''
    try:
      func1()
    except Error as error:
      m = error.message
    m
    `;
  const obj = {
    func1: () => {
      throw new Error('JS Error Message');
    }
  };
  expect(await e.evalAsync(script, obj)).toContain('JS Error Message');
  expect(e.eval(script, obj)).toContain('JS Error Message');
});

it('if with AND', async () => {
  const script = `
      x=5
      y=10
      r = 0
      
      if x == 5 and y == 10:
          r = x + y
          
      return r
    `;

  expect(await e.evalAsync(script)).toBe(15);
  expect(e.eval(script)).toBe(15);
}
);

it('if with AND nullable objects', async () => {
  const script = `
      l = null
      r = {price: 5}
      
      if l?.price != null and r?.price != null:
        return 100
      
      return 1
    `;
  expect(await e.evalAsync(script)).toBe(1);
  expect(e.eval(script)).toBe(1);
}
);


it('if with AND in brackets', async () => {
  const script = `
      x=5
      y=10
      r = 0
      
      if (x == 5) and (y == 10):
          r = x + y
          
      return r
      `
  expect(await e.evalAsync(script)).toBe(15);
  expect(e.eval(script)).toBe(15);
}
);

// incorrect
it('passing value type to the arrow function', async () => {

  const script = `
      x = [2,3,4,5,6,7,8,9]

      sum = 0
      x.forEach(i => sum = sum + i)
      
      sum
      `
}
);

it('passing value type to the for loop', async () => {

  const script = `
    x = [2,3,4,5,6,7,8,9]
    sum = 0

    for i in x:
        sum = sum + i

    sum
      `
  expect(await e.evalAsync(script)).toBe(44);
  expect(e.eval(script)).toBe(44);
}
);

it('passing value type to the while loop', async () => {

  const script = `
    x = [2,3,4,5,6,7,8,9]
    sum = 0
    i=0
    while i < x.length:
      val = x[i]
      sum = sum + val
      i = i + 1

    sum
      `
  expect(await e.evalAsync(script)).toBe(44);
  expect(e.eval(script)).toBe(44);
}
);

it('passing value type to the arrow function', async () => {

  const script = `
    x = [2,3,4,5,6,7,8,9]

    sum = {value:0}
    x.forEach(i => sum.value = sum.value + i)
    
    sum.value
    `
  expect(await e.evalAsync(script)).toBe(44);
  expect(e.eval(script)).toBe(44);
}
);


it('unknown property is null', async () => {
  const script = `
    x = {}

    if x.someValue == null:
      return true
    else:
      return false
    `
  expect(await e.evalAsync(script)).toBe(true);
  expect(e.eval(script)).toBe(true);
}
);

it('boolean value', async () => {
  const script = `
    x = 2 == 2

    if x:
      return true
    else:
      return false
    `
  expect(await e.evalAsync(script)).toBe(true);
  expect(e.eval(script)).toBe(true);
}
);

it('null coalescing functions', async () => {
  const script = `
    o = {}

    if o?.nonExistentFunctions(23, 43) == null:
      return 10

    return 5
    `
  expect(await e.evalAsync(script)).toBe(10);
  expect(e.eval(script)).toBe(10);
}
);

it('return empty', async () => {
  const script = `
    if 1 == 1:
      return

    return 5
    `
  expect(await e.evalAsync(script)).toBe(null);
  expect(e.eval(script)).toBe(null);
});

it('semicolon as a string', async () => {
  const interpreter = Mu();
  const res = await interpreter.evalAsync(`"first;second".split(';')`) as string;
  expect(res.length).toBe(2);
});


it('literal strings as keyword confusion', async () => {
  const interpreter = Mu();

  const script = `
    s = '('
    if s == '(':
        return 55
  
    return 99
    `;
  expect(await interpreter.evalAsync(script)).toBe(55);
  expect(interpreter.eval(script)).toBe(55);
});


it('literal strings as keyword confusion 2', async () => {
  const interpreter = Mu();

  const script = `
    s = '()'
    if s[0] == '(' and s[s.length - 1] == ')':
        return 55
  
    return 99
    `;
  //expect(await interpreter.evalAsync(script)).toBe(55);
  expect(interpreter.eval(script)).toBe(55);
});


it('Recursive factorial', async () => {

  const script =
    `
    def fact(x):
      if x == 1:
        return 1
      else:
        return x * fact(x - 1)
    
    fact(5)
    `
  expect(await e.evalAsync(script)).toBe(120);
});


it('arrow functions1', () => {
  const script = `
x = n => {
      t1: n*1,
      t2: n*2
}
x(10)`;
  expect(e.eval(script)).toEqual({ t1: 10, t2: 20 });
});


it('arrow functions3', () => {
  const script = `
    arr = [1,2,3]
    arr.map(n =>
            n = n * 2
            return {
                t1: n * 2,
                t2: n * 3
            }).map(r => r.t1 * 8).join(',')     
      `;
  expect(e.eval(script)).toBe("32,64,96");
});


it('functions preserve global context', async () => {
  await e.evalAsync(`
  x = 1
  def fn():
    x = 101
    print("in fn x is " + x)
  fn()
  print("outside x is " + x)
  `);
  expect(lastPrint).toBe("outside x is 1");
});

it('functions can see global context', async () => {
  await e.evalAsync(`
  y = 1
  def fn():
    print("in fn y is " + y)
  fn()
  `);
  expect(lastPrint).toBe("in fn y is 1");
});


it('infinite loop2', async () => {
  expect(await e.evalAsync(`
    def myRange(n):
      print("in my range "+n)
      x = []
      i = 0
      while i < n:
        i = i + 1
        if i%2 == 0 : continue
        x.push(i)
      x
    y = []
    for i in myRange(10):
      y.push(i)
    y.join(",")
  `)).toBe('1,3,5,7,9')
})


it('while break / continue2', async () => {
  expect(await e.evalAsync(`
    i = 1
    x = []
    while i < 10:
      i = i + 1
      if i%2 == 0 : continue
      print("pushing " + i)
      x.push(i)
    x.join(",")
    `)).toBe('3,5,7,9')
});


it('for1', async () => {
  expect(await e.evalAsync(`
    x = []
    x.push(1)
    x.push(2)
    x
  `)).toEqual([1, 2])
})
it('for2', async () => {
  await e.evalAsync(`
    for i in [1,2,3]:
      print(1)
      break
    print(2)
  `);
  expect(lastPrint).toEqual(2)
})

describe("Blocks", () => {
  it('regular block', async () => {
    await e.evalAsync(`
  if true:
     print("regular block")
  `);
    expect(lastPrint).toBe("regular block");
  });

  it('inline block', async () => {
    await e.evalAsync(`if true: print("inline block")`);
    expect(lastPrint).toBe("inline block");
  });

  it('after regular block', async () => {
    await e.evalAsync(`
  if true:
     print("regular block")
  print("after regular block")`);
    expect(lastPrint).toBe("after regular block");
  });


  it('after inline block', async () => {
    await e.evalAsync(`
    if true: print("inline block")
    print("after inline block")
  `);
    expect(lastPrint).toBe("after inline block");
  });

});

describe("Booleans", () => {
  describe("Boolean literals", () => {
    it(...testEval("true", true));
    it(...testEval("false", false));
  });
  describe("Boolean operators", () => {
    it(...testEval("not true", false));
    it(...testEval("not false", true));

    it(...testEval("false and false", false));
    it(...testEval("false and true", false));
    it(...testEval("true and false", false));
    it(...testEval("true and true", true));

    it(...testEval("false or false", false));
    it(...testEval("false or true", true));
    it(...testEval("true or false", true));
    it(...testEval("true or true", true));
  });
});
describe("Numbers", () => {
  describe("number comparators", () => {
    it(...testEval("1>=0", true));
    it(...testEval("1>0", true));
    it(...testEval("1>=1", true));
    it(...testEval("1>1", false));
    it(...testEval("1>2", false));

    it(...testEval("1<0", false));
    it(...testEval("1<=0", false));
    it(...testEval("1<1", false));
    it(...testEval("1<=1", true));
    it(...testEval("1<2", true));


    it(...testEval("1==1", true));
    it(...testEval("1==2", false));

    it(...testEval("1!=1", false));
    it(...testEval("1!=2", true));
  });
  describe("Number operators", () => {
    it(...testEval("1+2", 3.0));
    it(...testEval("5-4", 1.0));
    it(...testEval("2*3", 6));
    it(...testEval("9/3", 3));
    it(...testEval("-5--15", 10));
    it(...testEval("2**3", 8));
  });
  describe("Operator precedence", () => {
    it(...testEval("1+2*3", 7.0));
    it(...testEval("(1+2)*3", 9.0));
    it(...testEval("3*2+1", 7));
    it(...testEval("3*(1+2)", 9));
    it(...testEval("5+4*3**2", 41));
    it(...testEval("2*(3+4)+5", 19));
  });
});

describe("Strings", () => {
  describe("literals", () => {
    it(...testEval('"a"', "a"));
    it(...testEval('"a"', "a"));
    it(...testEval('"""a"""', "a"));
  });
  describe("string comparators", () => {
    it(...testEval('"b"+"a"', "ba"));
    it(...testEval('"b"+5', "b5"));
    it(...testEval('5+"b"', "5b"));
    it(...testEval('5+5+"b"+5+5', "10b55"));
  });

});

describe("null", () => {
  it('null => null', () => expect(e.eval("null")).toBe(null));
});

describe("JSON", () => {
  it(...testEval(`[1,2,3+4]`, [1, 2, 7], " JSON Array"));
  it(...testEval(`{a:1, b:2}`, { a: 1, b: 2 }, " JSON Object"));
  it(...testEval(`{"a":true, "b":null}`, { a: true, b: null }, " JSON Object with quoted names"));
  it(...testEval(`{"a":true, b:[1,2,null]}`, { a: true, b: [1, 2, null] }, " Mixed JSON"));
})

describe("Assignments", () => {
  it('o=1234', () => {
    e.eval("o=1234");
    expect(e.lastScope?.o).toBe(1234);
  });

})

describe("Object members", () => {
  it('o.sub1', () => {
    const globals = { o: { v1: 55 } };
    expect(e.eval("o.v1", globals)).toBe(55)
  });
  it('o.sub1.subValue', () => {
    const globals = { o: { v1: 55, sub1: { sub2: 45 } } };
    expect(e.eval("o.v1 + o.sub1.sub2", globals)).toBe(100)
    expect(e.eval("o.v1 + o['sub1'].sub2", globals)).toBe(100)
  });

  it(`o["subValue"]`, () => {
    const globals = { o: { subValue: 45 } };
    expect(e.eval(`o["subValue"]`, globals)).toBe(45)
  });

  it('assignment o.sub1.subValue', () => {
    e.eval("o.s=1", { o: {} })
    expect(e.lastScope?.o).toEqual({ s: 1 });
  });

})

describe("Loops", () => {
  it('simple while', () => {
    const script = [
      "sum = 0",            // 1
      "i = 0",              // 2
      "",                   // 3
      "while i < 5:",       // 4
      "    sum = sum + i",  // 5
      "    i = i + 1",      // 6
      "",                   // 7
      "sum"];               // 8

    // 1+2+3+4 = 10
    expect(e.eval(script.join("\n"))).toBe(10);
  });

  it('while with break', () => {
    const script = [
      "i = 0",              // 2
      "while i < 15:",      // 4
      "    i = i + 1",      // 6
      "    if i == 3:",     // 7
      "       break",       // 8
      "",                   // 9
      "i"];               // 10

    // 1+2+3+4 = 10
    expect(e.eval(script.join("\n"))).toBe(3);
  });

})


describe("Functions", () => {

  it('system global function call', () => {
    const globals = { add: (x: number, y: number) => x + y };

    expect(e.eval("add(2, 3)", globals)).toBe(5)
  });


  it('system object member function call', () => {
    const globals = { o: { add: (x: number, y: number) => x + y } };

    expect(e.eval("o.add(2, 3)", globals)).toBe(5)
  });

});


it('Negative number', async () => {
  expect(await e.evalAsync('-1')).toBe(-1)
});

it('number in parenthesis', async () => {
  expect(await e.evalAsync('(1)')).toBe(1)
});


it("in", async () => {
  expect(await e.evalAsync(`1 in [1,2]`)).toBe(true)
})


it('for in very large range', async () => {
  await e.evalAsync([
    "for i in range(10_000):",
    "   print(i)",
    "   if i==10:",
    "      break"
  ].join("\n"));
  expect(lastPrint).toEqual(10)
})

it('if condition', () => {
  const script = (p: number) => `
  x = 1
  if x == 1:
    x = 5
  else:
    x = 10
  x
`;
  expect(e.eval(script(1))).toBe(5);
});

it("tuple", () => {
  expect(e!.eval(`1,2,3`)).toEqual([1, 2, 3]);
});
it('tuple in parenthesis', () => {
  expect(e!.eval(`(1,2,3)`)).toEqual([1, 2, 3]);
});


it('use arrow functions', () => {
  expect(e!.eval(`
  fn = a => a * 2
  fn(10)`)).toBe(20);
});



it('Mapping an array', () => {
  const e = Mu();
  const res = e.eval('([1,2,3]).map(x => 2 * x)');
  expect(res).toEqual([2, 4, 6]);
});


describe("import", () => {


  it("Import js", async () => {
    const interpreter = Mu();
    interpreter.importRoot = __dirname;

    const res = await interpreter.evalAsync(`
    import "math.js" as obj
    return obj.PI
    `);
    expect(res).toBe(Math.PI);
  });


  it("Import Mu", async () => {
    const interpreter = Mu();
    interpreter.importRoot = __dirname;

    const res = await interpreter.evalAsync(`
    import "math.mu" as obj
    return obj.PI
    `);
    expect(res).toBe(Math.PI);
  });



  it("Import some more", async () => {
    const interpreter = Mu();

    interpreter.loadFile = path => {
      return Promise.resolve(`
        def multiply(x, y):
            x * y

        def func1(x, y):
          multiply(x, y) + someNumber

        someNumber = 55
      `);
    };

    const res = await interpreter.evalAsync(`
    import 'service.Mu' as obj

    return obj.func1(2, 3) + obj.multiply(2, 3)
    `);

    expect(res).toBe(67);
  });


  it('Import JSON', async () => {
    const interpreter = Mu();

    interpreter.loadFile = path => {
      return Promise.resolve(`
        {"x": "test1", "n": 22}
      `);
    }

    const res = await interpreter.evalAsync(`
    import './some.json' as obj
    return obj
    `);

    expect(res).toEqual({ "x": "test1", "n": 22 });
  });

  it('Import and calling function with default value', async () => {
    const interpreter = Mu();

    interpreter.loadFile = ((path => {
      return Promise.resolve(`
          def multiply(x, y):
              x * y
  
          def func1(x, y):
            # if y is null then 100 will be passed
            multiply(x, y or 100) + someNumber
  
          someNumber = 55
        `);
    }));

    const res = await interpreter.evalAsync(`
      import './service.Mu' as obj
  
      return obj.func1(2) + obj.multiply(2, 3)
      `);

    expect(res).toBe(261);
  });

  it('Import with package loader', async () => {
    const interpreter = Mu();
  
    interpreter.importJsModule = async (path) => {
      return path === "service.js" ? {
        add: (x: number, y: number) => x + y,
        remove: (x: number, y: number) => x - y,
        times: (x: number, y: number) => x * y,
      } : null
    }
  
    interpreter.loadFile = async (path) => {
      return Promise.resolve(`
          from "service.js" import add
  
          def multiply(x, y):
              x * y
  
          def func1(x, y):
            add(x, y) + someNumber
  
          someNumber = 55
        `);
    }
  
    const res = await interpreter.evalAsync(`
      import '/service.Mu' as obj
  
      return obj.func1(2, 3)
      `);
  
    expect(res).toBe(60);
  
  
  });
  
});




it('print("Hello")', async () => {
  const r = await e.evalAsync('print("Hello")');
  expect(r).toBe("Hello");
});

it('print(x)', async () => {
  const r = await e.evalAsync('print(x)', { x: 88 });
  expect(r).toBe(88);
});

it('Triple quote string as Comment', async () => {
  const text = `
    1
    2 3 4
    5
    `;
  expect(await e.evalAsync('""" 12345 """')).toBe(' 12345 ');
  expect(await e.evalAsync(`"""${text}"""`)).toBe(text);
});

it('Triple quote string as an expression', async () => {
  const text = `
    1
    2 3 4
    5
    `;
  expect(await e.evalAsync(`
    str = """ 12345 """
    str
    `)).toBe(' 12345 ');
  expect(await e.evalAsync(`
    str = """${text}"""
    str
    `)).toBe(text);
});

it('print(add(33, 2))', async () => {
  expect(await e.evalAsync('print(add(33, 2, 45))'))
    .toBe(80);

  expect(await e.evalAsync('add("Hello ", "World")'))
    .toBe('Hello World');

  expect(await e.evalAsync('print(add("Hello ", "World", "!"))'))
    .toBe('Hello World!');

  expect(await e.evalAsync('print(add(s, "World"))', { s: 'Hello ' }))
    .toBe('Hello World');

  expect(await e.evalAsync('print(add(s, "World", 1))', { s: 'Hello ' }))
    .toBe('Hello World1');

});

it('Expressions like: 35 + 45 or 35 + add(20, add(10, 15)) + 20', async () => {

  expect(await e.evalAsync('35 + 45'))
    .toBe(80);

  expect(await e.evalAsync('35 + 45 + 20'))
    .toBe(100);

  expect(await e.evalAsync('35 + add(20, 25) + 20'))
    .toBe(100);

  expect(await e.evalAsync('35 + add(20, add(10, 15)) + 20'))
    .toBe(100);

});

it('Multiline instructions', async () => {
  const script = [
    'x = add(55, 45)',
    'x + 45 + add(2, 3)'
  ].join('\n');

  expect(await e.evalAsync(script))
    .toBe(150);

});

it('Complex objects instructions', async () => {
  expect(await e.evalAsync('x.prop1', { x: { prop1: 100 } }))
    .toBe(100);

  expect(await e.evalAsync([
    'x = {prop1: 55}',
    '45 + x.prop1'
  ].join('\n')))
    .toBe(100);
});

it('Complex objects instructions => accessing array', async () => {
  expect(await e.evalAsync([
    'x = {prop1: [55, 65]}',
    '45 + x.prop1[1]'
  ].join('\n')))
    .toBe(110);
});


it('if statement TRUE', async () => {
  expect(await e.evalAsync([
    'x = 5',
    'if x == 5:',
    '  x = 10',
    '  x = x + 5',
    'print(x)'].join('\n')))
    .toBe(15);
});

it('if statement TRUE - indent 5', async () => {
  expect(await e.evalAsync([
    'x = 5',
    'if x == 5:',
    '     x = 10',
    '     x = x + 5',
    'print(x)'].join('\n')))
    .toBe(15);
});

it('if statement FALSE', async () => {
  expect(await e.evalAsync([
    'x = 5',
    'if x == 3:',
    '  x = 10',
    '  x = x + 5',
    'print(x)'
  ].join('\n')))
    .toBe(5);
});

it('with Entry function', async () => {
  let localResult = 0;

  await Mu()
    .addFunction("setResult", r => localResult = r)
    .evalAsync([
      'x = 5', // this will be ignored
      'def func1():',
      '  x = 10',
      '  x = x + 5',
      '  setResult(x)',
      'setResult(8888)' // this should be ignored as well
    ].join('\n'), undefined, 'func1');
  expect(localResult)
    .toBe(15);
});


it('with Entry function and if', async () => {
  let localResult = 0;

  await Mu()
    .addFunction("setResult", r => localResult = r)
    .evalAsync([
      'x = 5', // this will be ignored
      'def func1():',
      '  x = 10',
      '  if x == 10:',
      '    x = x + 5',
      '  setResult(x)',
      'setResult(8888)' // this should be ignored as well
    ].join('\n'), undefined, 'func1');
  expect(localResult)
    .toBe(15);

  await Mu()
    .addFunction("setResult", r => localResult = r)
    .evalAsync([
      'x = 5', // this will be ignored
      'def func1():',
      '  x = 10',
      '  if x != 10:',
      '    x = x + 5',
      '  setResult(x)',
      'setResult(8888)' // this should be ignored as well
    ].join('\n'), undefined, 'func1');
  expect(localResult)
    .toBe(10);
});

it('with Entry function with double if', async () => {
  let localResult = 0;

  await Mu()
    .addFunction("setResult", r => localResult = r)
    .evalAsync([
      'def func1():',
      '  x = 10',
      '  if x == 10:',
      '    x = x + 5',
      '    if x == 15:',
      '      x = x + 15',
      '  setResult(x)',
    ].join('\n'), undefined, 'func1');
  expect(localResult)
    .toBe(30);

  await Mu()
    .addFunction("setResult", r => localResult = r)
    .evalAsync([
      'def func1():',
      '  x = 10',
      '  if x != 10:',
      '    x = x + 5',
      '    if x == 15:',
      '      x = x + 15',
      '  setResult(x)'
    ].join('\n'), undefined, 'func1');
  expect(localResult)
    .toBe(10);

  await Mu()
    .addFunction("setResult", r => localResult = r)
    .evalAsync([
      'def func1():',
      '  x = 10',
      '  if x == 10:',
      '    x = x + 5',
      '    if x != 15:',
      '      x = x + 15',
      '  setResult(x)'
    ].join('\n'), undefined, 'func1');
  expect(localResult)
    .toBe(15);
});



it('set context variable (both ways)', async () => {
  const cxt = {
    obj: {
      value1: 0
    }
  };

  await Mu()
    .evalAsync([
      'def func1():',
      '  obj.value1 = 15',
      '  obj.value2 = 25',
      '  obj.newObject = {value3: 35}',
    ].join('\n'), cxt, 'func1');

  expect(cxt.obj.value1).toBe(15);
  expect((cxt.obj as any).value2).toBe(25);
  expect((cxt.obj as any).newObject.value3).toBe(35);

  // this is to make sure we can read back a complex context values inside a script
  expect(
    await Mu()
      .evalAsync('obj.newObject.value3 + obj.value2 + obj.value1', cxt)
  ).toBe(75);

  expect(
    await e.evalAsync('add(obj.newObject.value3, obj.value2, obj.value1)', cxt)
  ).toBe(75);
});

it('entry function calling another function', async () => {
  expect(
    await Mu()
      .evalAsync(
        `
      def func2():
        2 + 3

      def func1():
        2 + 3 + func2()
        `, undefined, 'func1')).toBe(10);
});

it('call a function from context', async () => {
  expect(
    await Mu()
      .evalAsync('obj.addNums(2, 3)', {
        obj: {
          addNums: (a: number, b: number): number => a + b
        }
      })
  ).toBe(5);
});

it('assign global context', async () => {
  const inter = Mu().assignGlobalContext({ value1: 5, addNums2: (a: number, b: number): number => a + b });
  expect(await inter.evalAsync('addNums2(value1, 10)'))
    .toBe(15);
});

it('Function with parameters', async () => {
  let res = 0;
  await Mu()
    .addFunction("setResult", r => res = r)
    .evalAsync([
      'def func1():',
      '  x = p1 + p2',
      '  setResult(x)'
    ].join('\n'), { p1: 5, p2: 10 }, 'func1');

  expect(res).toBe(15);
});

it('Function with promises 1', async () => {
  const res = await e.evalAsync([
    'def func1(p1):',
    '  returnsPromise(p1)',
    'func1(10)'
  ].join('\n'));
  expect(res).toBe(10);
});

it('Function with promises and entry function', async () => {
  expect(
    await e.evalAsync(`
      async def func2(p1):
        returnsPromise(p1)

      async def func1():
        5 + func2(5)
      `, undefined, 'func1'
    )).toBe(10);
});

it('Function with promises 2', async () => {
  const res = await e.evalAsync([
    'async def func1(p1, p2):',
    '  x = returnsPromise(p1) + returnsPromise(p2)',
    '  x',
    'func1(10, 20)'
  ].join('\n'));
  expect(res).toBe(30);
});

it('Function with promises 3', async () => {
  const res = await e.evalAsync([
    'async def func1(p1):',
    '  x = returnsPromise(p1)',
    '  x.value',
    'func1({value: 30})'
  ].join('\n'));
  expect(res).toBe(30);
});

xit('callback with promise', async () => {
  const res = await e.evalAsync(`
    def func1(p1):
      x = returnsPromise(p1)
      x.value

    x = [{value: 30}, {value: 40}]
    x.map(func1).join("|")
    `)
  expect(res).toBe("30|40")
})

it('expression as a function parameter', async () => {
  expect(await e.evalAsync('add(2 + 2, 3)'))
    .toBe(7);
});

it('expression as a function parameter (2)', async () => {
  expect(await e.evalAsync('add(2 + add(10, 5), 3)'))
    .toBe(20);
});

it('Assert boolean', async () => {
  expect(await e.evalAsync('2 == 5'))
    .toBe(false);

  expect(await e.evalAsync('5 == 5'))
    .toBe(true);

  expect(await e.evalAsync(['x = 5', 'x == 5'].join('\n')))
    .toBe(true);

  expect(await e.evalAsync(['x = 6', 'x != 5'].join('\n')))
    .toBe(true);

  expect(await e.evalAsync(['x = 6', 'add(x, 4) == add(6, 4)'].join('\n')))
    .toBe(true);

  expect(await e.evalAsync(['x = 6', 'add(x, 4) == add(6, 4)'].join('\n')))
    .toBe(true);
});

it('print two objects', async () => {
  // same problem as code below
  const x = await e.evalAsync('print({x:88, y:"test"}, {x: "99", y: "test 99"})') as any;
  expect(x.x)
    .toBe(88);

  const x5 = await e.evalAsync('print({x : 88, y:"test"}, {x: "99", y: "test 99"})') as any;
  expect(x5.x)
    .toBe(88);

  const x2 = await e.evalAsync('print([{x: 88, y : "test"}, {},{}], {x: "99", y: "test 99"})') as any;
  expect(x2[0].x)
    .toBe(88);

  const x25 = await e.evalAsync('print([{x: 88, y : "test"}, {},{}], {x: "99", y: "test 99"})') as any;
  expect(x25[0].x)
    .toBe(88);

});

it('MultiLine JSON objects', async () => {
  expect(
    await e.evalAsync(
      [
        'x = {',
        '  x : 88,',
        '  y : "test"',
        '  }',
        'x.x + 2'
      ].join('\n'))
  )
    .toBe(90);
});

it('return ', async () => {
  expect(await e.evalAsync(['x = 5', 'if 2 == 2:', '  return x', 'x + 10'].join('\n')))
    .toBe(5);

  let res = 0;
  const i = await Mu()
    .addFunction("setResult", r => res = r)
    .evalAsync(['x = 5', 'return x + 5', 'setResult(x + 100)'].join('\n'));
  expect(i).toBe(10);
  expect(res).toBe(0);
});

it('return value', async () => {
  const i = await Mu()
    .evalAsync([
      'x = "  1234567890  "',
      'return x.trim()'
    ].join('\n'));

  expect(i).toBe('1234567890');
});

it('line comments ', async () => {
  expect(await e.evalAsync(['5 + 5', '# 2 + 3 and some comment'].join('\n')))
    .toBe(10);

  expect(await e.evalAsync(['5 + 5', '     # 2 + 3 and some comment'].join('\n')))
    .toBe(10);

  expect(await e.evalAsync('# 2 + 3 and some comment'))
    .toBe(undefined);
});

it('inline comments ', async () => {
  expect(await e.evalAsync('2 + 3   # and some comment'))
    .toBe(5);
});

it('strings with # inside ', async () => {
  expect(await e.evalAsync('"2 + 3   # and some comment"'))
    .toBe('2 + 3   # and some comment');
});

it('strings with # inside and function ', async () => {
  expect(await e.evalAsync('"1#2".split("#").length'))
    .toBe(2);
});

it('Calling a standard string functions', async () => {
  expect(await e.evalAsync(['x = "test"', 'x.indexOf("s")'].join('\n')))
    .toBe(2);

  expect(await e.evalAsync(['x = "test"', 'x.replace("es", "tt")'].join('\n')))
    .toBe("tttt");

  expect(await e.evalAsync([
    'str = "Apple, Banana, Kiwi"',
    'str.slice(str.indexOf("Ba"), str.lastIndexOf(","))'
  ].join('\n')))
    .toBe("Banana");
});

it('Calling chaining methods', async () => {
  expect(await e.evalAsync([
    'str = "Kiwi  "',
    'str.replace("Kiwi", "Banana").trim()'
  ].join('\n')))
    .toBe("Banana");

  expect(await e.evalAsync([
    'str = "Kiwi  "',
    'str.replace("Kiwi", "Banana").trim().length'
  ].join('\n')))
    .toBe("Banana".length);
});

it('function parameter as an expressions', async () => {
  let res = 0;
  const i = Mu().addFunction("setResult", a => res = a);
  expect(await i.evalAsync([
    'setResult(5 + 5)'
  ].join('\n')))
    .toBe(10);
});


it('Boolean operation', async () => {
  expect(await e.evalAsync([
    '5 == 5'
  ].join('\n')))
    .toBe(true);

  expect(await e.evalAsync([
    'x = true',
    'print(x)'
  ].join('\n')))
    .toBe(true);

  expect(await e.evalAsync([
    'x = false',
    "x"
  ].join('\n')))
    .toBe(false);

  expect(await e.evalAsync([
    'print(5 == 5)'
  ].join('\n')))
    .toBe(true);

  expect(await e.evalAsync([
    'print(5 != 5)'
  ].join('\n')))
    .toBe(false);
});


it("datetime", async () => {
  const i = Mu();

  expect(
    await i.evalAsync('dateTime().getDate()')
  ).toBe(new Date().getDate());

  expect(
    await i.evalAsync('dateTime("2019-10-29").getDate() == 29')
  ).toBe(true);
});

it('null value', async () => {
  expect(await e.evalAsync([
    "null"
  ].join('\n')))
    .toBe(null);

  expect(await e.evalAsync([
    'x = null',
    "x"
  ].join('\n')))
    .toBe(null);

  expect(await e.evalAsync([
    'x = null',
    'x == null'
  ].join('\n')))
    .toBe(true);

  expect(await e.evalAsync([
    'x = null',
    'x != null'
  ].join('\n')))
    .toBe(false);
});

it('isNull function', async () => {
  expect(await e.evalAsync([
    'isNull(5)'
  ].join('\n')))
    .toBe(false);

  expect(await e.evalAsync([
    'x = null',
    'isNull(x, "some value")'
  ].join('\n')))
    .toBe('some value');

  expect(await e.evalAsync([
    'x = 5',
    'isNull(x, "some value")'
  ].join('\n')))
    .toBe(5);
});

it("Numerics", async () => {
  expect(await e.evalAsync([
    'x = 3.14',
    "x"
  ].join('\n')))
    .toBe(3.14);

  expect(await e.evalAsync([
    'x = 3.14',
    'x * 2'
  ].join('\n')))
    .toBe(3.14 * 2);

  expect(await e.evalAsync([
    'x = 3.14',
    'x / 2'
  ].join('\n')))
    .toBe(3.14 / 2);

  expect(await e.evalAsync([
    'x = 3.14',
    'Math.floor(x / 2)'
  ].join('\n')))
    .toBe(Math.floor(3.14 / 2));
});

it('Replace tabs', async () => {
  expect(await e.evalAsync([
    'x = 5',
    'if x == 5:',
    '\tx = 10',
    'x + 5'
  ].join('\n')))
    .toBe(15);
});

it('Function call 1', async () => {
  expect(
    await Mu()
      .evalAsync([
        'def func1(obj):',
        '  obj.value2 = 25',
        '  obj.value1 + obj.value2',
        'func1({value1: 15})'
      ].join('\n')
      )
  ).toBe(40);

  expect(
    await Mu()
      .evalAsync([
        'def func1(obj):',
        '  obj.value1 = 15',
        '  obj.value2 = 25',
        '  obj.value1 + obj.value2',
        'func1({})'
      ].join('\n')
      )
  ).toBe(40);
});

it('Function call 2', async () => {
  expect(
    await Mu()
      .evalAsync([
        'def func1():',
        '  15 + 25',
        'func1()'
      ].join('\n')
      )
  ).toBe(40);
});

it('function call with parameters', async () => {
  expect(
    await Mu()
      .evalAsync([
        'def f(x):',
        '  x + 25',
        '',
        'f(15)'
      ].join('\n')
      )
  ).toBe(40);

  expect(
    await Mu()
      .evalAsync([
        'def f(x):',
        '  x * x',
        '',
        'f(5) + f(3)'
      ].join('\n')
      )
  ).toBe(34);

  expect(
    await Mu()
      .evalAsync([
        'def f(x):',
        '  x * x',
        'y = f(5)',
        'y = y + f(y)',
        "y"
      ].join('\n')
      )
  ).toBe(650);

});

it('Function call 2 with comment', async () => {
  expect(
    await Mu()
      .evalAsync([
        'def func1():',
        '  # test',
        '  15 + 25',
        'func1()'
      ].join('\n')
      )
  ).toBe(40);
});

it('Function call (Math.floor callback)', async () => {
  expect(
    await Mu()
      .evalAsync([
        'x = [1.2, 2.3, 3.9]',
        'x.map(Math.floor).join("|")'
      ].join('\n')
      )
  ).toBe('1|2|3');
});

it('PScript Function call (f * callback)', async () => {
  expect(
    await Mu()
      .evalAsync([
        'def f(n):',
        '  n * n',
        'x = [2, 3, 4]',
        'x.map(f).join("|")'
      ].join('\n')
      )
  ).toBe('4|9|16');
});

it('Promise function', async () => {
  expect(
    await Mu()
      .evalAsync('pfunc(5) + pfunc(2)',
        { pfunc: (fn: number) => new Promise((s, f) => s(fn * fn)) }
      )
  ).toBe(29);

  expect(
    await Mu()
      .evalAsync('pfunc(5) + pfunc(2)',
        { pfunc: (fn: number) => new Promise((s, f) => setTimeout(() => s(fn * fn), 100)) }
      )
  ).toBe(29);

});


it('Function call (pscript callback)', async () => {
  expect(
    await Mu()
      .evalAsync([
        'def f(x):',
        '  x * x',
        'caller(f)'
      ].join('\n'),
        { caller: (fn: (x: number) => unknown) => fn(5) }
      )
  ).toBe(25);
});

it('Function call with multiple params and callback', async () => {
  expect(
    await Mu()
      .evalAsync([
        'def f(x, y, z):',
        '  x + y + z',
        'caller(f)'
      ].join('\n'),
        { caller: (fn: (x: number, y: number, z: number) => number) => fn(2, 4, 6) }
      )
  ).toBe(12);
});

it('Function call with multiple params', async () => {
  expect(
    await Mu()
      .evalAsync([
        'def f(x, y, z):',
        '  x + y + z',
        'f(2, 4, 6)'
      ].join('\n')
      )
  ).toBe(12);
});

it('function scope', async () => {
  expect(
    await Mu()
      .evalAsync([
        'x = 5',
        'def f():',
        '  x = 10',
        'f()',
        "x"
      ].join('\n')
      )
  ).toBe(5);
});

it('nested functions', async () => {
  expect(
    await Mu()
      .evalAsync([
        'def f(x, y):',
        '  def f1(z):',
        '    z + 10',
        '  x + f1(y)',
        'f(2, 4)'
      ].join('\n')
      )
  ).toBe(16);

  expect(
    await Mu()
      .evalAsync([
        'def f(x, y):',
        '  def f1(z):',
        '    z + 10',
        '  def f2(z):',
        '    z + 20',
        '  x + f1(y) + f2(y)',
        'f(2, 4)'
      ].join('\n')
      )
  ).toBe(40);
});

it('Arrow functions - one liner', async () => {
  expect(
    await Mu()
      .evalAsync([
        'x = [1, 2, 3]',
        'x.map(r => r * r).join(",")'
      ].join('\n')
      )
  ).toBe("1,4,9");

  expect(
    await Mu()
      .evalAsync([
        'x = [1, 2, 3]',
        'x.map(r => r * r).filter(r => r > 3).join(",")'
      ].join('\n')
      )
  ).toBe("4,9");

  expect(
    await Mu()
      .evalAsync([
        'x = [{x:1}, {x:2}, {x:3}]',
        'x.map(r => r.x).map(r => r * r).filter(r => r > 3).join(",")'
      ].join('\n')
      )
  ).toBe("4,9");

});

it('Arrow functions - two parameters - oneliner', async () => {
  expect(
    await Mu()
      .evalAsync([
        'x = [1, 2, 3]',
        'x.map((r, i) => r * i).join(",")'
      ].join('\n')
      )
  ).toBe("0,2,6");
});

it('Arrow functions - two parameters - multiliner', async () => {
  expect(
    await Mu()
      .evalAsync([
        'x = [1, 2, 3]',
        'x.map((r, i) =>',
        '  x = r * i',
        '  x = x + r + i',
        '  x',
        ').join("|")'
      ].join('\n')
      )
  ).toBe("1|5|11");

  expect(
    await Mu()
      .evalAsync([
        'x = [1, 2, 3]',
        'x.map(r =>',
        '  x = r * r',
        '  x',
        ').filter(r => r > 3).join("|")'
      ].join('\n')
      )
  ).toBe("4|9");

});

it('Multiline function parameters', async () => {
  expect(
    await e.evalAsync([
      'add(',
      ' 54,',
      '  "tt",',
      '"")'
    ].join('\n'))
  ).toBe("54tt");

  expect(
    await e.evalAsync([
      'add(',
      ' 54,',
      '  "tt",',
      '"")'
    ].join('\n'))
  ).toBe("54tt");

});

it('Arrow function started from new line', async () => {
  expect(
    await e.evalAsync([
      'x = [1, 2, 3]',
      'x.map(',
      '  r => ',
      '  r = r * r',
      '  r',
      ').join("|")'
    ].join('\n'))
  ).toBe("1|4|9");

  expect(
    await e.evalAsync([
      'add(',
      ' 54,',
      '  "tt",',
      '"")'
    ].join('\n'))
  ).toBe("54tt");

});

it('chaining methods multiliners', async () => {
  expect(
    await e.evalAsync(
      `
        x = [1, 2, 3]
        x
          .map((r, i) =>
              x = r * i
              x
          )
          .join(",")
        `
    )
  ).toBe("0,2,6");

  expect(
    await e.evalAsync(
      `
        x = [1, 2, 3]
        x.map(
            (r, i) =>
            x = r * i
            x
          )
          .filter(r => r >= 2)
          .join(",")
        `
    )
  ).toBe("2,6");

  expect(
    await e.evalAsync(
      `
        x = [1, 2, 3]
        x.map(r => r * r)
         .filter(r => r >= 2)
         .join(",")
        `
    )
  ).toBe("4,9");
})

it('(if) - else', async () => {
  expect(await e.evalAsync(`
    x = 5
    if x == 5:
      x = x + 10
    else:
      x = x + 100
    x
    `)).toBe(15)

  expect(await e.evalAsync(`
    x = 15
    if x == 5:
      x = x + 10
    else:
      x = x + 100
    x
    `)).toBe(115)
})

it('(if) - else in func', async () => {
  expect(await e.evalAsync(`
      def func1(y):
        if y == 5:
          y = y + 10
        else:
          y = y + 100
        y
      func1(5)
    `)).toBe(15)

  expect(await e.evalAsync(`
      def func1(y):
        if y == 5:
          y = y + 10
        else:
          y = y + 100
        y
      func1(10)
    `)).toBe(110)
})

it("while", async () => {
  expect(await e.evalAsync(`
    i = 1
    while i < 6:
      i = i + 1
    i
    `)).toBe(6)

  expect(await e.evalAsync(`
    i = 1
    x = []
    while i < 6:
      i = i + 1
      x.push(i)
    x.join(",")
    `)).toBe('2,3,4,5,6')
})

it('while break / continue', async () => {
  expect(await e.evalAsync(`
    print("start")
    i = 1
    x = []
    while i < 10:
      i = i + 1
      if i % 2 == 0:
        continue
      x.push(i)
    x.join(",")
    `)).toBe('3,5,7,9')

  expect(await e.evalAsync(`
    i = 1
    x = []
    while i < 10:
      i = i + 1
      if i == 5:
        break
      x.push(i)
    x.join(",")
    `)).toBe('2,3,4')
})

it('while break / continue - in function', async () => {
  expect(await e.evalAsync(`
    def f():
      i = 1
      x = []
      while i < 10:
        i = i + 1
        if i % 2 == 0:
          continue
        x.push(i)
      x.join(",")
    f()
    `)).toBe('3,5,7,9')

  expect(await e.evalAsync(`
    def f(s, e):
      i = s
      x = []
      while i < e:
        i = i + 1
        if i == 5:
          break
        x.push(i)
      x.join(",")
    f(1, 10)
    `)).toBe('2,3,4')
})

it('while - with function calls', async () => {
  expect(await e.evalAsync(`
    def addUp(x, y):
      x + y
    i = 0
    x = []
    while true:
      i = i + 1
      x.push(addUp(i, i + 1))
      if i == 10:
        break
    x.join(",")
    `)).toBe('3,5,7,9,11,13,15,17,19,21')
})

it('for with variable what contains in', async () => {
  expect(await e.evalAsync(`
    x = []
    for link in [1,2,3]:
      x.push(link)
    x.join(",")
  `)).toBe('1,2,3')
})

it('for - continue', async () => {
  expect(await e.evalAsync(`
    x = []
    for i in [1,2,3,4,5]:
      x.push(i)
      if i == 3:
        continue
    x.join(",")
  `)).toBe('1,2,3,4,5')
})

it('for - break', async () => {
  expect(await e.evalAsync(`
    x = []
    a = [1,2,3,4,5]
    for i in a:
      x.push(i)
      if i == 3:
        break
    x.join(",")
  `)).toBe('1,2,3')
})

it("for", async () => {
  expect(await e.evalAsync(`
    x = []
    a = [1,2,3,4,5]
    for i in a:
      x.push(i)
      if i == 3:
        break
    x.join(",")
  `)).toBe('1,2,3')
})


it('for with range function', async () => {
  expect(await e.evalAsync(`
    def myRange(n):
      print("in my range "+n)
      x = []
      i = 0
      while i < n:
        print("in my range i < n: "+i+"<"+n)      
        x.push(i)
        i = i + 1
      x
    y = []
    for i in myRange(10):
      y.push(i)
    y.join(",")
  `)).toBe('0,1,2,3,4,5,6,7,8,9')
})


it('Recursive function - pow', async () => {
  expect(await e.evalAsync(`
    def power(base, exponent):
      if exponent == 0:
        return 1
      else:
        return base * power(base, exponent - 1)

    power(2, 3)
    `)).toBe(Math.pow(2, 3))
})

it('for with myRange function call', async () => {
  expect(await e.evalAsync(`
    def myRange(arr):
      x = []
      for i in arr:
        x.push(i * i)
      x
    myRange([1,2,3,6]).join("|")
  `)).toBe('1|4|9|36')
})

it('Null-conditional operators ?.', async () => {
  expect(await e.evalAsync(`
    x = {}
    x?.p1?.p2?.p3`)).toBe(null)
  expect(await e.evalAsync(`
    def f():
      x = {}
      x?.p1?.p2?.p3
    f()
     `)).toBe(null)
})

it('Null-conditional operators "?." with "or"', async () => {
  expect(await e.evalAsync(`
    x = {}
    x?.p1?.p2?.p3 or "N/A"`)).toBe('N/A')
  expect(await e.evalAsync(`
    def f():
      x = {}
      x?.p1?.p2?.p3 or "N/A"
    f()
     `)).toBe('N/A')
})

it('Null-conditional operators 2 ?.', async () => {
  expect(await e.evalAsync(`
    x = {p1:{}}
    x?.p1?.p2?.p3`)).toBe(null)
  expect(await e.evalAsync(`
    def f():
      x = {p1:{}}
      x?.p1?.p2?.p3
    f()
     `)).toBe(null)
})


it('Passing references 1', async () => {
  const o = { value: 5 }
  expect(await e.evalAsync(`value + 10`, o)).toBe(15)
})

it('Passing references 2', async () => {
  const o = {
    value: 5,
    func: (f: (x: unknown) => unknown): number => {
      const obj = { value: 5 };
      f(obj);
      return obj.value + 10;
    }
  }
  expect(await e.evalAsync(`func(r => r.value = r.value + 10)`, o)).toBe(25)
});

it('null props', async () => {
  expect(await e.evalAsync(
    `
    x = {prop1: 25}
    x?.prop1
    `)).toBe(25)
});

it('Set indexed array', async () => {
  expect(await e.evalAsync(
    `
      x = [1,2,3,5]
      x[2] = 11
      x[2]
      `
  )).toBe(11)
})

it('Set indexed array with prop', async () => {
  expect(await e.evalAsync(
    `
      x = [1,2,3,5]
      x[2] = {}
      x[2].tt = 11
      x[2].tt
      `
  )).toBe(11)
})

it('Set indexed array in func', async () => {
  expect(await e.evalAsync(
    `
      def foo():
        x = [1,2,3,5]
        x[2] = 11
        x[2]

      foo()
      `
  )).toBe(11)
})

it('Set indexed array with prop in func', async () => {
  expect(await e.evalAsync(
    `
      def foo():
        x = [1,2,3,5]
        x[2] = {}
        x[2].tt = 11
        x[2].tt

      foo()
      `
  )).toBe(11)
})

it('Set dynamic property', async () => {
  expect(await e.evalAsync(`
      x = {}
      x["t123"] = 33
      x.t123
      `
  )).toBe(33)
  
  expect(await e.evalAsync(`
      x = {}
      x["t123"] = 33
      x.t123
      `)).toBe(33)

  expect(await e.evalAsync(
    `
      x = {}
      p = "tt_"
      i = 5
      x[p + i + 1] = 33
      x.tt_51
      `
  )).toBe(33)
})

it('Set dynamic property in func', async () => {
  expect(await e.evalAsync(
    `
      def foo():
        x = {}
        x["t123"] = 33
        x.t123

      foo()
      `
  )).toBe(33)

  expect(await e.evalAsync(
    `
      def foo():
        x = {}
        p = "tt_"
        i = 5
        x[p + i + 1] = 33
        x.tt_51

      foo()
      `
  )).toBe(33)
})

it('get dynamic property', async () => {
  expect(await e.evalAsync(
    `
      x = {p1:33}
      x["p1"]
      `
  )).toBe(33)

  expect(await e.evalAsync(
    `
      x = {p1:33}
      p = "p"
      i = 1
      x[p + 1]
      `
  )).toBe(33)
})

it('get dynamic property in func', async () => {
  expect(await e.evalAsync(
    `
      def foo():
        x = {p1:33}
        x["p1"]

      foo()
      `
  )).toBe(33)

  expect(await e.evalAsync(
    `
      def foo():
        x = {p1:33}
        p = "p"
        i = 1
        x[p + 1]

      foo()
      `
  )).toBe(33)
})

it('JSON resolve values', async () => {
  expect(await e.evalAsync(
    `
        p = "t"
        x = {
          p1: p + "_" + 2
        }
        x.p1
      `
  )).toBe("t_2")

  expect(await e.evalAsync(
    `
        p = "t"
        x = {
          p1: p + "_" + 2,
          p2: "some value"
        }
        x.p1
      `
  )).toBe("t_2")

})

it('JSON resolve values - with promise', async () => {
  expect(await e.evalAsync(
    `
        p = "t"
        x = {
          p1: p + "_" + 2 + returnsPromise(10)
        }
        x.p1
      `
  )).toBe("t_210")

  expect(await e.evalAsync(
    `
        p = "t"
        x = {
          p1: p + "_" + 2 + returnsPromise(10),
          p2: "some value"
        }
        x.p1
      `
  )).toBe("t_210")

})

it('JSON parsing error 1', async () => {
  let msg = ""
  try {
    await e.evalAsync(
      `
    x = {
      p1: {}
      p2: 5
    }
    x
      `);
    msg = "NO ERROR"
  } catch (error) {
    msg = "ERROR"
  }

  expect(msg).toBe("ERROR");

  msg = "";

  try {
    await e.evalAsync(`x = { p1: {} p2: 5 }`);
    msg = "NO ERROR"
  } catch (error) {
    msg = "ERROR"
  }

  expect(msg).toBe("ERROR");
})
/*
  it('JSON parsing Array of arrays', async () => {
    let o = await e.evalAsync(`[["ss", "ss2", 5]]`);
    expect(o.length).toBe(1);
    expect(o[0][1]).toBe("ss2");
    expect(o[0][2]).toBe(5);

    o = await e.evalAsync(`[
        ["ss1", "ss21", 5],
        ["ss2", "ss22", 6],
        ["ss3", dateTime("2020-03-07"), 7],
        []
    ]`);
    expect(o.length).toBe(4);
    expect(o[0][1]).toBe("ss21");
    expect(o[0][2]).toBe(5);

    expect(o[1][1]).toBe("ss22");
    expect(o[1][2]).toBe(6);

    expect(o[2][1].toISOString()).toBe(new Date('2020-03-07').toISOString());
    expect(o[3].length).toBe(0);
  });
*/

it('JSON parsing last comma error', async () => {
  let x = ""
  try {
    await e.evalAsync(`[[12, 42],`);
    x = "NO ERROR"
  } catch (error) {
    x = "ERROR"
  }

  expect(x).toBe("ERROR");

  x = ""
  try {
    await e.evalAsync(`[
        [12, 42],
      ]`);
    x = "NO ERROR"
  } catch (error) { x = "ERROR" }
  expect(x).toBe("ERROR");

  x = ""
  try {
    x = await e.evalAsync(`[
        [12, 42]
        [33, 77]
      ]`) as any;
  } catch (error) { x = "ERROR" }
  expect(x).toBe("ERROR");

});

it('JSON parsing with a Quoted keys', async () => {
  const o = await e.evalAsync(`{"p1": 23, "x": [{"d" : 5}]}`) as any;
  expect(o.p1).toBe(23);
  expect(o.x[0].d).toBe(5);
})

it('should return NULL gracely', async () => {
  expect(await e.evalAsync(`
        x = {}
        x["prop1"]`)).toBe(undefined);

  // has to be 0
  expect(await e.evalAsync(`
        x = {prop1: 0}
        x["prop1"]`)).toBe(0);

  expect(await e.evalAsync(`
        x = {prop1: null}
        x["prop1"]`)).toBe(null);
});

it('subset of dynamic', async () => {
  expect(await e.evalAsync(`
issue = {}
pp = {ss: "22"}
issue["dd"  + pp.ss] = 55
issue["dd22"]
    `)).toBe(55);
});

it('Empty string bug', async () => {
  expect(await e.evalAsync(`"".trim()`)).toBe("");
});

it('Empty string bug for function return', async () => {
  expect(await e.evalAsync(`"".trim().length`)).toBe(0);
});



