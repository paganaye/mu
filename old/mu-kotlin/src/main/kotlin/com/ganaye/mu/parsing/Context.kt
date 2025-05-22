package com.ganaye.mu.parsing

import com.ganaye.mu.parsing.html.HTMLParser
import com.ganaye.mu.parsing.html.HTMLTokenizer
import com.ganaye.mu.parsing.script.ExprParser
import com.ganaye.mu.parsing.script.ScriptParser
import com.ganaye.mu.parsing.script.ScriptTokenizer

class Context(val file: ISourceFile) {
    val fileReader = FileReader(file)
    val htmlTokenizer = Tokenizer(HTMLTokenizer(fileReader))
    val scriptTokenizer = Tokenizer(ScriptTokenizer(fileReader))
    val scriptParser = ScriptParser(this)
    val exprParser = ExprParser(this)
    val htmlParser = HTMLParser(this)
}