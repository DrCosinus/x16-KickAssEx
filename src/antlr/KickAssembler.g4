grammar KickAssembler ;

options { caseInsensitive = true; }

prog:   ( line | scope )* EOF ;

line:
    directive
    |   label
    |   instruction
    |   org
    |   call
    |   function_def
    |   return
    ;

scope       : '{' line* '}' ;

macro_def   : '.macro' Name '(' names ')' scope ;

function_def: '.function' Name '(' names ')' scope ;

return      : '.return' expr ;  // return statement inside function

names       : Name? ( ',' names )* ; // can be empty

org         : '*' '=' value String?;

directive   : cpu | variable | data | encoding | constant | macro_def;

call        : Name '(' values ')' ;

label       : '!' Name? ':' 
            | '@' Name ':'  // @ = global scope
            | Name ':'
            ;

value       : Number | Name | '*' | String ;

values      : value (',' values)? ;

instruction : label? opcode '#'? arguments? ;

arguments   : argument (',' arguments)? 
            | '!' Name? ('+'+ | '-'+)   // multi label
            | '@' Name
            ;

argument    : expr 
            | '(' argument ')'
            | '(' arguments ')'
            ;

opcode      : 'lda' | 'ldx' | 'ldy' | 'sta' | 'stx' | 'sty' | 'stz' 
            | 'inc' | 'inx' | 'iny' | 'dec' | 'dex'| 'dey' 
            | 'rts' | 'jmp' | 'jsr' | 'brk'
            | 'tax' | 'txa' | 'tay' | 'tya' | 'tsx' 
            | 'bit' 
            | 'bbs0' | 'bbs1' | 'bbs2' | 'bbs3' | 'bbs4' | 'bbs5' | 'bbs6' | 'bbs7' | 'bbr0' | 'bbr1' | 'bbr2' | 'bbr3' | 'bbr4' | 'bbr5' | 'bbr6' | 'bbr7'
            | 'rmb0' | 'rmb1' | 'rmb2' | 'rmb3' | 'rmb4' | 'rmb5' | 'rmb6' | 'rmb7' | 'smb0' | 'smb1' | 'smb2' | 'smb3' | 'smb4' | 'smb5' | 'smb6' | 'smb7'
            | 'tsb' | 'trb'
            | 'adc' | 'sbc' | 'asl' | 'lsr' | 'rol' | 'ror' | 'and' | 'ora' | 'eor'
            | 'pha' | 'pla' | 'php' | 'plp' | 'phx' | 'plx' | 'phy' | 'ply'
            | 'clc' | 'sec' | 'cld' | 'sed' | 'cli' | 'sei'
            | 'wai'
            | 'cmp' | 'cpx' | 'cpy'
            | 'bmi' | 'bpl' | 'bne' | 'beq' | 'bcs' | 'bcc' | 'bvs' | 'bvc' | 'bra'
            ;

cpu         : '.cpu' Processor;

constant    : '.const' Name '=' expr ;

variable    : '.var' Name '=' expr ;

encoding    : '.encoding' String ;

data        : ( '.byte' | '.word' | '.dword' ) expr ( ',' expr )* 
            | '.text' String
            | '.fill' ( Number | Name ) ',' value       // to do: manage more syntax with formula and patterns
            ;

expr        : '@'? Name
            | '!' Name? ('+'+ | '-'+) 
            | value 
            | '-' expr
            | Name '(' expr ( ',' expr )* ')'
            | '(' expr ')'
            | expr ( '*' | '/' ) expr
            | expr ( '+' | '-' ) expr
            | expr ( '<<' | '>>' ) expr
            | expr ( '&' | '|' | '^' ) expr
            | '~' expr
            | ( '>' | '<') expr
            ; // expr op expr

// Lexems

Number      : Digit+ ('.' Digit+)? | Hex | Bin;

Processor   : '_65c02' | '_6502' | 'dtv' | '_6502NoIllegals'; // Compatible with name so must be defined before

Name        : Letter ( Letter | Digit )* ;

fragment Digit  : '0'..'9' ;

fragment Letter : 'a'..'z' | '_' ;

fragment Dec    : Digit+ ;

fragment Hex    : '$' ('0'..'9'|'a'..'f')+ ;

fragment Bin    : '%' ('0' | '1')+ ;

String      : '"' ~["]* '"' ;

Whitespaces : (' ' | '\t')+ -> channel(HIDDEN);

Newline     : ('\r' '\n'? | '\n') -> channel(HIDDEN);

LineComment : '//' ~ [\r\n]* -> skip;

BlockComment: '/*' .*? '*/' -> channel(HIDDEN) ;
