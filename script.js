document.addEventListener('DOMContentLoaded', function() {
    const templates = document.querySelectorAll('.block-template');
    const canvas = document.querySelector('.canvas');
    const runButton = document.getElementById('run-button');
    const output = document.querySelector('.output');

    let draggingElement = null;

    templates.forEach(function(template) {
        template.addEventListener("dragstart", function() {
            draggingElement = template;
            draggingElement.classList.add('dragging');
        });
        template.addEventListener("dragend", function() {
            draggingElement.classList.remove('dragging');
        });
    });
    canvas.addEventListener("dragover", function(event) {
        event.preventDefault();
    });
    canvas.addEventListener("drop", function(event) {
        event.preventDefault();
        const dropTarget = getDropPosition(canvas, event.clientY);
        const isTemplate = draggingElement.classList.contains('block-template');
        const isBlockOnCanvas = draggingElement.classList.contains('block');
        if (isTemplate) {
            const blockType = draggingElement.dataset.blockType;
            const newBlock = createBlockElement(blockType);
            if (dropTarget) {
                canvas.insertBefore(newBlock, dropTarget);
            } else {
                canvas.appendChild(newBlock);
            }
        } 
        else if (isBlockOnCanvas) {
            if (dropTarget) {
                canvas.insertBefore(draggingElement, dropTarget);
            } else {
                canvas.appendChild(draggingElement);
            }
        }
    });

    function getDropPosition(container, y) {
        const draggableElements = [...container.querySelectorAll('.block:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function createBlockElement(type) {
        const block = document.createElement('div');
        block.classList.add('block');
        block.draggable = true;
        block.dataset.blockType = type;

        const deleteBtn = document.createElement('span');
        deleteBtn.classList.add('delete-btn');
        deleteBtn.innerHTML = '&times;';

        deleteBtn.addEventListener('click', function() {
            block.remove();
        });
        block.appendChild(deleteBtn);

        if (type === 'declare') {
            const text = document.createElement('span');
            text.textContent = 'Объявить переменные: ';
            const input = document.createElement('input');
            input.placeholder = 'a, b, c';
            block.appendChild(text);
            block.appendChild(input);
        } else if (type === 'assign') {
            const text1 = document.createElement('span');
            text1.textContent = 'Присвоить ';
            const input1 = document.createElement('input');
            input1.placeholder = 'имя';
            const text2 = document.createElement('span');
            text2.textContent = ' значение ';
            const input2 = document.createElement('input');
            input2.placeholder = '0';
            
            block.appendChild(text1);
            block.appendChild(input1);
            block.appendChild(text2);
            block.appendChild(input2);
        } else if (type === 'calculate') {
            const text1 = document.createElement('span');
            text1.textContent = 'Присвоить ';

            const input1 = document.createElement('input');
            input1.placeholder = 'имя переменной';

            const text2 = document.createElement('span');
            text2.textContent = ' значение выражения ';

            const input2 = document.createElement('input');
            input2.placeholder = 'a + 5 * b';

            block.appendChild(text1);
            block.appendChild(input1);
            block.appendChild(text2);
            block.appendChild(input2);
        }
        block.addEventListener('dragstart', function() {
            draggingElement = block;
            setTimeout(() => { block.classList.add('dragging'); }, 0);
        });
        block.addEventListener('dragend', function() {
            block.classList.remove('dragging');
        });
        return block;
    }
    runButton.addEventListener('click', interpretCode);

    const operations = {
        '+': { priority: 1, associativity: 'LtoR' },
        '-': { priority: 1, associativity: 'LtoR' },
        '*': { priority: 2, associativity: 'LtoR' },
        '/': { priority: 2, associativity: 'LtoR' },
        '%': { priority: 2, associativity: 'LtoR' }
    };

    function tokenize(str) {
        const tokens = str.replace(/\s+/g, '').match(/(\d+(\.\d+)?|[a-zA-Z_]\w*|[+\-*/%()])/g);
        if (!tokens) throw new Error("Не удалось разобрать выражение, проверьте синтаксис.");
        return tokens;
    }

    function toRPN(tokens, currentVariables) {
        let outputQueue = [];
        let operatorStack = [];
        for (const token of tokens) {
            if (!isNaN(token)) {
                outputQueue.push(parseInt(token, 10));
            } else if (token in currentVariables) {
                outputQueue.push(currentVariables[token]);
            } else if (token in operations) {

                while (
                    operatorStack.length > 0 &&
                    operatorStack[operatorStack.length - 1] !== '(' &&
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
                if (operatorStack.length === 0) throw new Error("Ошибка: нет пары для скобки.");
                operatorStack.pop();
            } else {
                throw new Error(`Ошибка: неизвестная переменная или символ "${token}"`);
            }
        }
        while (operatorStack.length > 0) {
            const op = operatorStack.pop();
            if (op === '(') throw new Error("Ошибка: нет пары для скобки.");
            outputQueue.push(op);
        }
        return outputQueue;
    }

    function evaluateRPN(rpnQueue) {
        let stack = [];
        for (const token of rpnQueue) {
            if (typeof token === 'number') {
                if (!Number.isInteger(token)) {
                    throw new Error(`Обнаружено нецелое число "${token}" в выражении.`);
                }
                stack.push(token);
            } else {
                if (stack.length < 2) throw new Error("Ошибка в выражении: не хватает операндов.");
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
                }
                stack.push(result);
            }
        }
        if (stack.length !== 1) throw new Error("Ошибка в синтаксисе выражения.");
        return stack[0];
    }

    function calculateExpression(exprStr, currentVariables) {
        const tokens = tokenize(exprStr);
        const rpn = toRPN(tokens, currentVariables);
        const result = evaluateRPN(rpn);
        return result;
    }

    function interpretCode() {
        const variables = {};
        const blocks = canvas.querySelectorAll('.block');
        output.textContent = '';
        output.style.color = 'black';
        blocks.forEach(b => b.classList.remove('error'));
        for (const block of blocks) {
            try {
                const type = block.dataset.blockType;
                const inputs = block.querySelectorAll('input');
                if (type === 'declare') {
                    const varNames = inputs[0].value.split(',');
                    const validInput = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
                    for (const name of varNames) {
                        const trimmedName = name.trim();
                        if (trimmedName) {
                            if (!validInput.test(trimmedName)) {
                                throw new Error(`Недопустимое имя переменной: "${trimmedName}". Оно должно начинаться с буквы или '_' и может содержать только буквы, цифры и '_'.`);
                            }
                            variables[trimmedName] = 0;
                        }
                    }

                } else if (type === 'assign') {
                    const varName = inputs[0].value.trim();
                    const valueStr = inputs[1].value.trim();
                    if (!varName) continue;

                    if (!(varName in variables)) {
                        throw new Error(`Переменная "${varName}" не объявлена.`);
                    }

                    if (!/^-?\d+$/.test(valueStr)) {
                        throw new Error(`Значение "${valueStr}" не является ЦЕЛЫМ числом.`);
                    }

                    const value = parseInt(valueStr, 10);
                    variables[varName] = value;

                } else if (type === 'calculate') {
                    const targetVar = inputs[0].value.trim();
                    const expression = inputs[1].value.trim();

                    if (!targetVar || !expression) {
                        throw new Error('Укажите переменную для результата и выражение.');
                    }
                    if (!(targetVar in variables)) {
                        throw new Error(`Переменная "${targetVar}" для сохранения результата не объявлена.`);
                    }

                    const result = calculateExpression(expression, variables);
                    
                    if (typeof result !== 'number') {
                        throw new Error(`Не удалось вычислить выражение. Результат: ${result}`);
                    }

                    variables[targetVar] = result;
                }
            }
            catch (e) {
                block.classList.add('error');
                output.style.color = 'red';
                output.textContent = `Ошибка в блоке: ${e.message}`;
                return;
            }
        }

        let resultString = 'Выполнение завершено.\n\n';
        const variableKeys = Object.keys(variables);
        if (variableKeys.length === 0) {
            resultString += 'Переменных нет.';
        } else {
            for (const key of variableKeys) {
                resultString += `${key} = ${variables[key]}\n`;
            }
        }
        output.textContent = resultString;
    }
});
