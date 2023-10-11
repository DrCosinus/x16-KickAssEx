import * as path from 'path';
import * as net from 'net';
import { createConnection, TextDocuments, TextDocument, ProposedFeatures, InitializeParams, DidChangeTextDocumentParams} from 'vscode-languageserver/node';
import { TextDocumentChangeEvent } from 'vscode-languageserver/node';
// import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import KickAssemblerLexer from './KickAssemblerLexer';
import KickAssemblerParser from './KickAssemblerParser';

// Create a connection to the Language Server Protocol
const connection = createConnection(ProposedFeatures.all);

// Create a document manager for handling open documents
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Start listening to connection
documents.listen(connection);

connection.onInitialize((params: InitializeParams) => {
    return {
        capabilities: {
            textDocumentSync: documents.
        }
    };
});


// Handle open document
documents.onDidOpen((event) => {
  const text = event.document.getText();
  const lexer = new KickAssemblerLexer(new ANTLRInputStream(text));
  const parser = new KickAssemblerParser(new CommonTokenStream(lexer));
  
  // TODO: Implement parsing and semantic analysis logic here

  // Send diagnostic information back to the client
  connection.sendDiagnostics({
    uri: event.document.uri,
    diagnostics: [
      // Add diagnostic information here
    ],
  });
});

// Handle document changes
documents.onDidChangeContent((change) => {
  // Re-parse and update diagnostics when the document changes
  // This is where you can implement incremental parsing
});

// Handle document closure
documents.onDidClose((event) => {
  // Cleanup resources when a document is closed
});