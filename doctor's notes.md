# Compile the extension

## KickAssembler

- [Web site](http://www.theweb.dk/KickAssembler)
- [PDF](http://www.theweb.dk/KickAssembler/KickAssembler.pdf)
- I use v5.25

### OpenJDK

[OpenJDK](https://adoptium.net/)

## Need nodejs and npm

[nodejs and npm](https://nodejs.org/)

> I use version 18.18.0 LTS

## Get dependencies

> npm install

Eventually, you will need to fix issue.

> npm audit fix  

or

>  npm audit fix --force

# Syntax & Grammar of Kick Assembler

## Visual Studio Code

- [Language Extensions Overview](https://code.visualstudio.com/api/language-extensions/overview)
- [Syntax Highlight Guide](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide)
- [Semantic Highlight Guide](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide)
- [Snippet Guide](https://code.visualstudio.com/api/language-extensions/snippet-guide)
- [Create your own snippets](https://code.visualstudio.com/docs/editor/userdefinedsnippets#_creating-your-own-snippets)

- [What is the Language Server Protocol](https://microsoft.github.io/language-server-protocol/overviews/lsp/overview/)

### VS Code extension sources

- [VS Code HTML extension](https://github.com/microsoft/vscode/tree/main/extensions/html)
- [VS Code Typescript extension](https://github.com/microsoft/vscode/tree/main/extensions/typescript-language-features)

### Tuto video

- [Extending VSCode: Write Your Own Language Server in VSCode (YouTube Video)](https://www.youtube.com/watch?v=H0p7tcUuJm0)

## ANTLR

- I use v4.13.1
- [Site](https://www.antlr.org/)
- [GitHub](https://github.com/ANTLR/grammars-v4)
- [Lab](http://lab.antlr.org/)

```console
> pip install antlr4-tools

> antlr4-parse KickAssembler.g4 prog test.asm -gui

> antlr4 -Dlanguage=CSharp KickAssembler.g4 -o out 
> antlr4 -Dlanguage=CSharp src/antlr/KickAssembler.g4 -o out/antlr
```
TypeScript, CSharp

npm install antlr4
npm install vscode-languageserver
npm install antlr4ts