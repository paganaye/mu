package com.ganaye.mu

import com.ganaye.mu.emit.JSBuilder
import com.ganaye.mu.parsing.Context
import com.ganaye.mu.parsing.SourceFile
import org.junit.jupiter.api.Test

import org.junit.jupiter.api.Assertions.*

class ScriptParserTest {

    fun testJS(source: String, expected: String) {
        val context = Context(SourceFile("/test", source))
        val ast = context.scriptParser.parseScript()
        val output = JSBuilder()
        ast.toJS(output, false)
        val actual = output.toString()
        assertEquals(expected.trim(), actual.trim())
    }

    @Test
    fun parseVar() {
        testJS("const a;", "const a;")
        testJS("let a;", "let a;")
        testJS("var a;", "var a;")
    }

    @Test
    fun parseVarEqualNumber() {
        testJS("let a=5;", "let a=new Var(5.0);")
    }

    @Test
    fun parseVarEqualString() {
        testJS("const x=\"a\";", "const x=new Var(\"a\");")
    }

    @Test
    fun parseTwoVars() {
        testJS("let a=1;let b=2;", "let a=new Var(1.0);\nlet b=new Var(2.0);")
    }

    @Test
    fun parseConsoleLog() {
        val src = "console.log(1)"
        val exp = "console.log(1.0);"
        testJS(src, exp)
        val src2 = "console.log(\"Hi\")"
        val exp2 = "console.log(\"Hi\");"
        testJS(src2, exp2)
    }

    @Test
    fun parseIf() {
        var src = "if (1) console.log(\"hi\")"
        var exp = "if (1.0) console.log(\"hi\");"
        testJS(src, exp)
    }

    @Test
    fun parseIfElse() {
        val src = "if (1) 1; else 2;"
        val exp = "if (1.0) 1.0;\nelse 2.0;";
        testJS(src, exp)
    }

    @Test
    fun parseWhile() {
        val src = "while (1) {}"
        val exp = "while (1.0) {}"
        testJS(src, exp)
    }

    @Test
    fun parseCPlusPlus() { // I know
        val src = "c++"
        val exp = "c++;"
        testJS(src, exp)
    }

    @Test
    fun parseFor() {
        val src = "for(i=0;i<10;i++) {}"
        val exp = "for( i=new Var(0.0);i<10.0;i++) {}"
        testJS(src, exp)
    }

    @Test
    fun parseFunction() {
        val src = "function double(a,b) { return a + b; }"
        val exp = """
function double(a,b) {
  return a+b;}

""".trimIndent()
        testJS(src, exp)
    }

    @Test
    fun parseComma() {
        val src = "1,2,3"
        val exp = "3.0;"
        testJS(src, exp)
    }

    @Test
    fun parseParenthesis() {
        val src = "(1,2,3)"
        val exp = "3.0;"
        testJS(src, exp)
    }

    @Test
    fun jsonTest() {
        val src = "1"
        val exp = "1.0;"
        testJS(src, exp)
    }

    @Test
    fun parseLambda() {
        val src = "let l = (a,b,c) => a+b+c"
        val exp = "let l=new Var((a,b,c) => a+b+c);"
        testJS(src, exp)
    }

    @Test
    fun parseComments() {
        val src = "/* some text here */ 1 // some more here"
        val exp = "1.0;"
        testJS(src, exp)
    }

    @Test
    fun parseTernayExpr() {
        val src = "a ? 1 : 0"
        val exp = "mu.ternary_cond(a,1.0,0.0);"
        testJS(src, exp)
    }

    @Test
    fun parseConstTernayExpr() {
        val src = "1 ? 1 : 0"
        val exp = "1.0;"
        testJS(src, exp)
    }

    @Test
    fun ReactStyleClassApp() {
        val src = """
class App extends Mu.Component {
    render() {
        return <h1>Hello world!</h1>
    }
}"""
        val exp = """
class App extends Mu.Component {
  render() {
    return mu.elt("h1",null,"Hello world!");}
}

""".trimIndent()
        testJS(src, exp)
    }

    @Test
    fun ReactStyleRenderFunc() {
        val src = "render(<App />, document.body)"
        val exp = "render(mu.elt(\"App\",null),document.body);"
        testJS(src, exp)
    }

    @Test
    fun parseArrayExpr() {
        testJS("let a = [1,2,3];", "let a=new Var(mu.array(1.0,2.0,3.0));")
    }

    @Test
    fun parseObjectExpr() {
        //testJS("let a=new Var(mu.object({a:1.0,b:true}));","let a = {a:1,b:true};")
    }
}
