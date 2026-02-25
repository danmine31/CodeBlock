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
        const container = event.target.closest('.nested-blocks-container') || canvas;
        const dropTarget = getDropPosition(container, event.clientY);
        const isTemplate = draggingElement.classList.contains('block-template');
        const isBlockOnCanvas = draggingElement.classList.contains('block');
        if (isTemplate) {
            const blockType = draggingElement.dataset.blockType;
            const newBlock = createBlockElement(blockType);
            if (dropTarget) {
                container.insertBefore(newBlock, dropTarget);
            } else {
                container.appendChild(newBlock);
            }
        }
        else if (isBlockOnCanvas) {
            if (dropTarget) {
                container.insertBefore(draggingElement, dropTarget);
            } else {
                container.appendChild(draggingElement);
            }
        }
    });

    function getDropPosition(container, y) {
        const draggableElements = [...container.children].filter(child =>
            child.classList.contains('block') && !child.classList.contains('dragging')
        );
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
            input.placeholder = 'z, o, v';
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
            input2.placeholder = '(6+7) / a';

            block.appendChild(text1);
            block.appendChild(input1);
            block.appendChild(text2);
            block.appendChild(input2);
        } else if (type === 'if') {
            block.classList.add('if-block');
            block.style.flexDirection = 'column';
            block.style.alignItems = 'stretch';

            const headerDiv = document.createElement('div');
            headerDiv.style.display = 'flex';
            headerDiv.style.alignItems = 'center';
            headerDiv.style.gap = '10px';

            headerDiv.appendChild(deleteBtn);

            const text1 = document.createElement('span');
            text1.textContent = 'Если ';
            const input1 = document.createElement('input');
            input1.placeholder = 'выражение 1';

            const select = document.createElement('select');
            ['>', '<', '==', '!=', '>=', '<='].forEach(op => {
                const option = document.createElement('option');
                option.value = op;
                option.textContent = op;
                select.appendChild(option);
            });

            const input2 = document.createElement('input');
            input2.placeholder = 'выражение 2';

            headerDiv.appendChild(text1);
            headerDiv.appendChild(input1);
            headerDiv.appendChild(select);
            headerDiv.appendChild(input2);

            const nestedContainer = document.createElement('div');
            nestedContainer.classList.add('nested-blocks-container');

            block.innerHTML = '';
            block.appendChild(headerDiv);
            block.appendChild(nestedContainer);
        }

        block.addEventListener('dragstart', function(e) {
            e.stopPropagation();
            draggingElement = block;
            setTimeout(() => { block.classList.add('dragging'); }, 0);
        });
        block.addEventListener('dragend', function(e) {
            e.stopPropagation();
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
        if (!tokens) throw new Error("Что вы написали? Мы не можем понять(((");
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
                if (operatorStack.length === 0) throw new Error("Не для всех скобочек есть пара");
                operatorStack.pop();
            } else {
                throw new Error(` "${token}" - это что!?!`);
            }
        }
        while (operatorStack.length > 0) {
            const op = operatorStack.pop();
            if (op === '(') throw new Error("Не для всех скобочек есть пара");
            outputQueue.push(op);
        }
        return outputQueue;
    }

    function evaluateRPN(rpnQueue) {
        let stack = [];
        for (const token of rpnQueue) {
            if (typeof token === 'number') {
                if (!Number.isInteger(token)) {
                    throw new Error(`Тут есть нецелое число "${token}"`);
                }
                stack.push(token);
            } else {
                if (stack.length < 2) throw new Error("Слишком мало операндов!");
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
        if (stack.length !== 1) throw new Error("Что-то не так с синтаксисом...");
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
        const allBlocks = canvas.querySelectorAll('.block');
        output.textContent = '';
        output.style.color = 'black';
        allBlocks.forEach(b => b.classList.remove('error'));

        function executeSequence(blocks) {
            for (const block of blocks) {
                if (!block.classList.contains('block')) continue;

                try {
                    const type = block.dataset.blockType;

                    if (type === 'if') {
                        const headerDiv = block.firstElementChild;
                        const inputs = headerDiv.querySelectorAll('input');
                        const select = headerDiv.querySelector('select');

                        const expr1 = inputs[0].value.trim();
                        const operator = select.value;
                        const expr2 = inputs[1].value.trim();

                        if (!expr1 || !expr2) {
                            throw new Error('Напишите два выражения для условия');
                        }

                        const val1 = calculateExpression(expr1, variables);
                        const val2 = calculateExpression(expr2, variables);

                        let conditionMet = false;
                        if (operator === '>') conditionMet = val1 > val2;
                        else if (operator === '<') conditionMet = val1 < val2;
                        else if (operator === '==') conditionMet = val1 === val2;
                        else if (operator === '!=') conditionMet = val1 !== val2;
                        else if (operator === '>=') conditionMet = val1 >= val2;
                        else if (operator === '<=') conditionMet = val1 <= val2;

                        if (conditionMet) {
                            const nestedContainer = block.querySelector('.nested-blocks-container');
                            if (nestedContainer) {
                                const success = executeSequence(nestedContainer.children);
                                if (!success) return false;
                            }
                        }
                    } else {
                        const inputs = block.querySelectorAll('input');
                        if (type === 'declare') {
                            const varNames = inputs[0].value.split(',');
                            const validInput = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
                            for (const name of varNames) {
                                const trimmedName = name.trim();
                                if (trimmedName) {
                                    if (!validInput.test(trimmedName)) {
                                        throw new Error(`Странное какое-то имя - "${trimmedName}". Напоминаю: оно должно начинаться с буквы или '_' и может содержать только буквы, цифры и '_'.`);
                                    }
                                    variables[trimmedName] = 0;
                                }
                            }
                        } else if (type === 'assign') {
                            const varName = inputs[0].value.trim();
                            const valueStr = inputs[1].value.trim();
                            if (!varName) continue;
                            if (!(varName in variables)) {
                                throw new Error(`"${varName}" не объявлена!`);
                            }
                            if (!/^-?\d+$/.test(valueStr)) {
                                throw new Error(`"${valueStr}" - но это же не целое число!`);
                            }
                            const value = parseInt(valueStr, 10);
                            variables[varName] = value;
                        } else if (type === 'calculate') {
                            const targetVar = inputs[0].value.trim();
                            const expression = inputs[1].value.trim();
                            if (!targetVar || !expression) {
                                throw new Error('Надо переменную для результата и выражение');
                            }
                            if (!(targetVar in variables)) {
                                throw new Error(`Кажется, вы забыли объявить переменную "${targetVar}"`);
                            }
                            const result = calculateExpression(expression, variables);

                            if (typeof result !== 'number') {
                                throw new Error(`Не получилось посчитать...  ${result}`);
                            }
                            variables[targetVar] = result;
                        }
                    }
                }
                catch (e) {
                    block.classList.add('error');
                    output.style.color = 'red';
                    output.textContent = `Ошибка тут: ${e.message}`;
                    return false;
                }
            }
            return true;
        }
        const success = executeSequence(canvas.children);
        if (success) {
            let resultString = 'Выполнение завершено!\n\n';
            const variableKeys = Object.keys(variables);
            if (variableKeys.length === 0) {
                resultString += 'А где переменные???';
            } else {
                for (const key of variableKeys) {
                    resultString += `${key} = ${variables[key]}\n`;
                }
            }
            output.textContent = resultString;
        }
    }
});