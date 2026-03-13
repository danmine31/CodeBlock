
export const operations = {
    '+': { priority: 1, associativity: 'LtoR' },
    '-': { priority: 1, associativity: 'LtoR' },
    '*': { priority: 2, associativity: 'LtoR' },
    '/': { priority: 2, associativity: 'LtoR' },
    '%': { priority: 2, associativity: 'LtoR' }
};

export function tokenize(str) {
    const tokens = str.replace(/\s+/g, '').match(/(\d+(\.\d+)?|[a-zA-Z_]\w*|[+\-*/%()\[\]])/g);
    if (!tokens) throw new Error("Что вы написали? Мы не можем понять(((");
    return tokens;
}

export function toRPN(tokens, currentVariables) {
    let outputQueue = [];
    let operatorStack = [];
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!isNaN(token)) {
            outputQueue.push(parseInt(token, 10));
        }
        else if (/^[a-zA-Z_]\w*$/.test(token)) {
            outputQueue.push(token);
        }
        else if (token === '[') {
            operatorStack.push(token);
        }
        else if (token === ']') {
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '[') {
                outputQueue.push(operatorStack.pop());
            }
            if (operatorStack.length === 0) throw new Error("Нет открывающей [");
            operatorStack.pop();
            outputQueue.push('ARRAY_ACCESS');
        } else if (token in operations) {
            while (
                operatorStack.length > 0 &&
                operatorStack[operatorStack.length - 1] !== '(' &&
                operatorStack[operatorStack.length - 1] !== '[' &&
                (operations[operatorStack[operatorStack.length - 1]].priority > operations[token].priority ||
                    (operations[operatorStack[operatorStack.length - 1]].priority === operations[token].priority && operations[token].associativity === 'LtoR'))
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
            throw new Error(` "${token}" - это что!?!`);
        }
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
        if (typeof token === 'number') {
            stack.push(token);
        }
        else if (typeof token === 'string' && !(token in operations) && token !== 'ARRAY_ACCESS') {
            if (token in currentVariables) {
                stack.push(currentVariables[token]);
            } else {
                throw new Error(`Переменная "${token}" не найдена`);
            }
        }
        else if (token === 'ARRAY_ACCESS') {
            if (stack.length < 2) throw new Error("Слишком мало операндов для доступа к массиву");
            const index = stack.pop();
            const arr = stack.pop();

            if (!Array.isArray(arr)) throw new Error(`Попытка доступа по индексу к чему-то, что не является массивом`);
            if (!Number.isInteger(index) || index < 0 || index >= arr.length)
                throw new Error(`Индекс ${index} вне допустимого диапазона для массива`);
            stack.push(arr[index]);
        }
        else if (token in operations) {
            if (stack.length < 2) throw new Error("Слишком мало операндов!");
            const b = stack.pop();
            const a = stack.pop();
            if (typeof a !== 'number' || typeof b !== 'number')
                throw new Error("Операнды должны быть числами");
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
            }
            stack.push(result);
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