
export const operations = {
    '+': { priority: 4, associativity: 'L', type: 'binary' },
    '-': { priority: 4, associativity: 'L', type: 'binary' },
    '*': { priority: 5, associativity: 'L', type: 'binary' },
    '/': { priority: 5, associativity: 'L', type: 'binary' },
    '%': { priority: 5, associativity: 'L', type: 'binary' },
    '>': { priority: 3, associativity: 'L', type: 'binary' },
    '<': { priority: 3, associativity: 'L', type: 'binary' },
    '>=': { priority: 3, associativity: 'L', type: 'binary' },
    '<=': { priority: 3, associativity: 'L', type: 'binary' },
    '==': { priority: 3, associativity: 'L', type: 'binary' },
    '!=': { priority: 3, associativity: 'L', type: 'binary' },
    'AND': { priority: 2, associativity: 'L', type: 'binary' },
    'OR': { priority: 1, associativity: 'L', type: 'binary' },
    'NOT': { priority: 6, associativity: 'R', type: 'unary' },
};

export function tokenize(str) {
    const regex = /\d+(\.\d+)?|\b(true|false|AND|OR|NOT)\b|[a-zA-Z_]\w*|>=|<=|==|!=|[()\[\]+\-*/%><]/gi;
    const tokens = str.match(regex);
    if (!tokens) return [];
    return tokens.map(t => {
        const upper = t.toUpperCase();
        if (operations[upper] || upper === 'TRUE' || upper === 'FALSE') {
            return upper;
        }
        return t;
    });
}

export function toRPN(tokens) {
    let outputQueue = [];
    let operatorStack = [];
    let lastToken = null;
    for (const token of tokens) {
        if (!isNaN(token)) {
            outputQueue.push(parseFloat(token));
        } else if (token === 'TRUE' || token === 'FALSE') {
            outputQueue.push(token === 'TRUE');
        } else if (/^[a-zA-Z_]\w*$/.test(token) && !operations[token]) {
            outputQueue.push(token);
        } else if (token === '[') {
            operatorStack.push(token);
        } else if (token === ']') {
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '[') {
                outputQueue.push(operatorStack.pop());
            }
            if (operatorStack.length === 0) throw new Error("Нет открывающей скобки '['");
            operatorStack.pop();
            outputQueue.push('ARRAY_ACCESS');
        } else if (operations[token]) {
            const op = operations[token];
            while (
                operatorStack.length > 0 &&
                operatorStack[operatorStack.length - 1] !== '(' &&
                operatorStack[operatorStack.length - 1] !== '[' &&
                (operations[operatorStack[operatorStack.length - 1]].priority > op.priority ||
                    (operations[operatorStack[operatorStack.length - 1]].priority === op.priority && op.associativity === 'L'))
            ) {
                outputQueue.push(operatorStack.pop());
            }
            operatorStack.push(token);
        } else if (token === '(') {
            operatorStack.push(token);
        } else if (token === ')') {
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                outputQueue.push(operatorStack.pop());
            }
            if (operatorStack.length === 0) throw new Error("Не для всех скобочек есть пара");
            operatorStack.pop();
        } else {
            throw new Error(`Неизвестный токен: "${token}"`);
        }
        lastToken = token;
    }
    while (operatorStack.length > 0) {
        const op = operatorStack.pop();
        if (op === '(' || op === '[') throw new Error("Не для всех скобочек есть пара");
        outputQueue.push(op);
    }
    return outputQueue;
}

export function evaluateRPN(rpnQueue, currentVariables) {
    let stack = [];
    for (const token of rpnQueue) {
        if (typeof token === 'number' || typeof token === 'boolean') {
            stack.push(token);
        } else if (typeof token === 'string' && !operations[token] && token !== 'ARRAY_ACCESS') {
            if (token in currentVariables) {
                stack.push(currentVariables[token]);
            } else {
                throw new Error(`Переменная "${token}" не найдена`);
            }
        } else if (token === 'ARRAY_ACCESS') {
            if (stack.length < 2) throw new Error("Слишком мало операндов для доступа к массиву");
            const index = stack.pop();
            const arr = stack.pop();

            if (!Array.isArray(arr)) throw new Error(`Попытка доступа по индексу к переменной, которая не является массивом`);
            if (!Number.isInteger(index) || index < 0 || index >= arr.length)
                throw new Error(`Индекс ${index} вне допустимого диапазона для массива`);
            stack.push(arr[index]);
        } else if (operations[token]) {
            const op = operations[token];
            if (op.type === 'unary') {
                if (stack.length < 1) throw new Error(`Мало операндов для унарного оператора ${token}`);
                const a = stack.pop();
                if (typeof a !== 'boolean') throw new Error(`Оператор ${token} применим только к булевым значениям`);
                stack.push(!a);
            } else {
                if (stack.length < 2) throw new Error(`Мало операндов для бинарного оператора ${token}`);
                const b = stack.pop();
                const a = stack.pop();
                let result;
                switch (token) {
                    case '+': result = a + b; break;
                    case '-': result = a - b; break;
                    case '*': result = a * b; break;
                    case '/':
                        if (b === 0) throw new Error("Делить на ноль НЕЛЬЗЯ!");
                        result = Math.trunc(a / b);
                        break;
                    case '%':
                        if (b === 0) throw new Error("Деление на ноль НЕЛЬЗЯ (остаток)!");
                        result = a % b;
                        break;
                    case '>': result = a > b; break;
                    case '<': result = a < b; break;
                    case '>=': result = a >= b; break;
                    case '<=': result = a <= b; break;
                    case '==': result = a === b; break;
                    case '!=': result = a !== b; break;
                    case 'AND':
                        if (typeof a !== 'boolean' || typeof b !== 'boolean') throw new Error("AND требует булевы операнды");
                        result = a && b;
                        break;
                    case 'OR':
                        if (typeof a !== 'boolean' || typeof b !== 'boolean') throw new Error("OR требует булевы операнды");
                        result = a || b;
                        break;
                }
                stack.push(result);
            }
        }
    }
    if (stack.length !== 1) throw new Error("Что-то не так с синтаксисом...");
    return stack[0];
}

export function calculateExpression(exprStr, currentVariables) {
    const tokens = tokenize(exprStr);
    const rpn = toRPN(tokens, currentVariables);
    const result = evaluateRPN(rpn, currentVariables);
    return result;
}