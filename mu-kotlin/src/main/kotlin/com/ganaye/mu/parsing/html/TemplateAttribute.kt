package com.ganaye.mu.parsing.html

enum class TemplateAttribute(val attribute: String?) {
    If("if"),
    While("while"),
    Foreach("foreach"),
    Else("else"),
    Elseif(null)
}