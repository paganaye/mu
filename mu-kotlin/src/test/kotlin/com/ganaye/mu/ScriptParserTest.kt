package com.ganaye.mu

import com.ganaye.mu.parsing.Context
import com.ganaye.mu.parsing.SourceFile
import org.junit.jupiter.api.Test

import org.junit.jupiter.api.Assertions.*

class ScriptParserTest {

    fun toJSScript(source: String, reactive: Boolean = false): String {
        var context = Context(SourceFile("/test", source))
        val ast = context.scriptParser.parseScript()
        val output = StringBuilder()
        ast.toJS(output, reactive)
        return output.toString()
    }

    @Test
    fun parseVar() {
        assertEquals("const a;", toJSScript("const a;"))
        assertEquals("let a;", toJSScript("let a;"))
        assertEquals("var a;", toJSScript("var a;"))
    }

    @Test
    fun parseVarEqual() {
        assertEquals("let a=new Var(5.0);", toJSScript("let a=5;"))
        assertEquals("const x=new Var(\"a\");", toJSScript("const x=\"a\";"))
    }

    @Test
    fun parseTwoVars() {
        assertEquals("let a=new Var(1.0);let b=new Var(2.0);", toJSScript("let a=1; let b=2;"))
    }

    @Test
    fun parseConsoleLog() {
        val src = "console.log(1)"
        val exp = "console.log(1.0)"
        assertEquals(exp, toJSScript(src))
        val src2 = "console.log(\"Hi\")"
        val exp2 = "console.log(\"Hi\")"
        assertEquals(exp2, toJSScript(src2))
    }

    @Test
    fun parseIf() {
        var src = "if (1) console.log(\"hi\")"
        var exp = "if (1.0) console.log(\"hi\")"
        assertEquals(exp, toJSScript(src))
    }

    @Test
    fun parseIfElse() {
        val src = "if (1) 1; else 2;"
        val exp = "if (1.0) 1.0; else 2.0";
        assertEquals(exp, toJSScript(src))
    }

    @Test
    fun parseWhile() {
        val src = "while (1) {}"
        val exp = "while (1.0) {}"
        assertEquals(exp, toJSScript(src))
    }

    @Test
    fun parseCPlusPlus() { // I know
        val src = "c++"
        val exp = "c++"
        assertEquals(exp, toJSScript(src))
    }

    @Test
    fun parseFor() {
        val src = "for(i=0;i<10;i++) {}"
        val exp = "for (i=0.0; i<10.0; i++) {}"
        assertEquals(exp, toJSScript(src))
    }

    @Test
    fun parseFunction() {
        val src = "function double(a,b) { return a + b; }"
        val exp = "function double(a,b) return a+b;"
        assertEquals(exp, toJSScript(src))
    }

    @Test
    fun parseComma() {
        val src = "1,2,3"
        val exp = "3.0"
        assertEquals(exp, toJSScript(src))
    }

    @Test
    fun parseParenthesis() {
        val src = "(1,2,3)"
        val exp = "3.0"
        assertEquals(exp, toJSScript(src))
    }

    @Test
    fun jsonTest() {
        val src = "1"
        val exp = "1.0"
        assertEquals(exp, toJSScript(src))
    }

    @Test
    fun parseLambda() {
        val src = "let l = (a,b,c) => a+b+c"
        val exp = "let l=new Var((a,b,c) => a+b+c);"
        assertEquals(exp, toJSScript(src))
    }

    @Test
    fun parseComments() {
        val src = "/* some text here */ 1 // some more here"
        val exp = "1.0"
        assertEquals(exp, toJSScript(src))
    }

    @Test
    fun parseTernayExpr() {
        val src = "a ? 1 : 0"
        val exp = "mu.ternary_cond(a,1.0,0.0)"
        assertEquals(exp, toJSScript(src))
    }

    @Test
    fun parseConstTernayExpr() {
        val src = "1 ? 1 : 0"
        val exp = "1.0"
        assertEquals(exp, toJSScript(src))
    }

    @Test
    fun ReactStyleClassApp() {
        val src = """class App extends Mu.Component {
    render() {
        return <h1>Hello world!</h1>
    }
}"""
        val exp = """class App extends Mu.Component {
function render() return mu.elt("h1",null,"Hello world!");}
"""
        assertEquals(exp, toJSScript(src))
    }

    @Test
    fun ReactStyleRenderFunc() {
        val src = "render(<App />, document.body)"
        val exp = "render(mu.elt(\"App\",null),document.body)"
        assertEquals(exp, toJSScript(src))
    }

    @Test
    fun parseArrayExpr() {
        assertEquals("let a=new Var(mu.array(1.0,2.0,3.0));", toJSScript("let a = [1,2,3];"))
    }

    @Test
    fun parseObjectExpr() {
        //assertEquals("let a=new Var(mu.object({a:1.0,b:true}));", toJSScript("let a = {a:1,b:true};"))
    }
}
