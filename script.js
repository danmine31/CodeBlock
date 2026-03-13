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
            input1.placeholder = '(a > 5) AND (b < 10)';
            input1.style.flexGrow = '1';

            const toggleElseBtn = document.createElement('button');
            toggleElseBtn.classList.add('toggle-else-btn');
            toggleElseBtn.textContent = '+ иначе';
            
            headerDiv.appendChild(text1);
            headerDiv.appendChild(input1);
            headerDiv.appendChild(toggleElseBtn);

            const thenContainer = document.createElement('div');
            thenContainer.classList.add('nested-blocks-container', 'then-container');
            thenContainer.dataset.containerType = 'then';

            block.innerHTML = '';
            block.appendChild(headerDiv);
            block.appendChild(thenContainer);
            
            toggleElseBtn.addEventListener('click', function() {
                const existingLabel = block.querySelector('.else-label');
                const existingContainer = block.querySelector('.else-container');

                if (!existingLabel) {
                    const elseLabel = document.createElement('div');
                    elseLabel.classList.add('else-label');
                    elseLabel.textContent = 'Иначе:';

                    const elseContainer = document.createElement('div');
                    elseContainer.classList.add('nested-blocks-container', 'else-container');
                    elseContainer.dataset.containerType = 'else';

                    block.appendChild(elseLabel);
                    block.appendChild(elseContainer);
                    toggleElseBtn.textContent = '- иначе';
                } 
                
                else {
                    existingLabel.remove();
                    existingContainer.remove();
                    toggleElseBtn.textContent = '+ иначе';
                }
            });
        }
        else if (type === 'declare-array') {
            block.appendChild(deleteBtn);
            const text = document.createElement('span');
            text.textContent = 'Объявить массив: ';
            const input1 = document.createElement('input');
            input1.placeholder = 'имя';
            const input2 = document.createElement('input');
            input2.placeholder = 'размер';
            block.appendChild(text);
            block.appendChild(input1);
            block.appendChild(document.createTextNode(' размера '));
            block.appendChild(input2);
        } else if (type === 'array-assign') {
            block.appendChild(deleteBtn);
            const text1 = document.createElement('span');
            text1.textContent = 'Присвоить ';
            const input1 = document.createElement('input');
            input1.placeholder = 'массив';
            const text2 = document.createElement('span');
            text2.textContent = '[';
            const input2 = document.createElement('input');
            input2.placeholder = 'индекс';
            const text3 = document.createElement('span');
            text3.textContent = '] = ';
            const input3 = document.createElement('input');
            input3.placeholder = 'значение';
            block.appendChild(text1);
            block.appendChild(input1);
            block.appendChild(text2);
            block.appendChild(input2);
            block.appendChild(text3);
            block.appendChild(input3);
        } else if (type === 'while' || type === 'for') {
            block.classList.add(type === 'while' ? 'while-block' : 'for-block');
            block.style.flexDirection = 'column';
            block.style.alignItems = 'stretch';

            const headerDiv = document.createElement('div');
            headerDiv.style.display = 'flex';
            headerDiv.style.alignItems = 'center';
            headerDiv.style.gap = '10px';
            headerDiv.appendChild(deleteBtn);

            if (type === 'while') {
                const text = document.createElement('span');
                text.textContent = 'Пока ';
                const input1 = document.createElement('input');
                input1.placeholder = 'i < 100 AND flag == 1';
                input1.style.flexGrow = '1';
                headerDiv.append(text, input1);
            } else {
                const text1 = document.createElement('span');
                text1.textContent = 'Для (';
                const initInput = document.createElement('input');
                initInput.placeholder = 'i = 0';
                initInput.title = 'Инициализация';
                const text2 = document.createElement('span');
                text2.textContent = ';';
                const conditionInput = document.createElement('input');
                conditionInput.placeholder = 'i < 10';
                conditionInput.title = 'Условие';
                const text3 = document.createElement('span');
                text3.textContent = ';';
                const updateInput = document.createElement('input');
                updateInput.placeholder = 'i = i + 1';
                updateInput.title = 'Инкремент';
                const text4 = document.createElement('span');
                text4.textContent = ')';
                [initInput, conditionInput, updateInput].forEach(input => {
                    input.style.flex = '1';
                    input.style.minWidth = '60px';
                });
                headerDiv.append(text1, initInput, text2, conditionInput, text3, updateInput, text4);
            }

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

    function tokenize(str) {
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

    function toRPN(tokens) {
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

    function evaluateRPN(rpnQueue, currentVariables) {
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

    function calculateExpression(exprStr, currentVariables) {
        const tokens = tokenize(exprStr);
        const rpn = toRPN(tokens, currentVariables);
        const result = evaluateRPN(rpn, currentVariables);
        return result;
    }

    function interpretCode() {
        const variables = {};
        const allBlocks = canvas.querySelectorAll('.block');
        output.textContent = '';
        output.style.color = 'white';
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

                        const conditionStr = inputs[0].value.trim();
                        const conditionMet = evaluateExpression(conditionStr, variables);
                        if (typeof conditionMet !== 'boolean') {
                            throw new Error('Условие IF должно возвращать true или false.');
                        }

                        if (conditionMet) {
                            const thenContainer = block.querySelector('[data-container-type="then"]');
                            if (thenContainer) {
                                const success = executeSequence(thenContainer.children);
                                if (!success) return false;
                            }
                        } else {
                            const elseContainer = block.querySelector('[data-container-type="else"]');
                            if (elseContainer && elseContainer.children.length > 0) {
                                const success = executeSequence(elseContainer.children);
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
                            const expression = inputs[1].value.trim();
                                if (!varName || !expression) {
                                    throw new Error('Надо указать имя переменной и выражение');
                                }
                            
                            if (!(varName in variables)) {
                                throw new Error(`"${varName}" не объявлена!`);    
                            }

                        const result = calculateExpression(expression, variables);
                        if (typeof result !== 'number') {
                            throw new Error(`Не получилось посчитать... ${result}`);
                        }
                        variables[varName] = result;
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
                        } else if (type === 'declare-array') {
                        const arrayName = inputs[0].value.trim();
                        const sizeStr = inputs[1].value.trim();
                        if (!arrayName) throw new Error('Укажите имя массива');
                        const validInput = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
                        if (!validInput.test(arrayName)) {
                            throw new Error(`Некорректное имя массива "${arrayName}"`);
                        }
                        if (!/^\d+$/.test(sizeStr)) {
                            throw new Error(`Размер массива должен быть целым положительным числом, получено "${sizeStr}"`);
                        }
                        const size = parseInt(sizeStr, 10);
                        if (size <= 0) throw new Error('Размер массива должен быть больше 0');
                        if (arrayName in variables) {
                            throw new Error(`Переменная с именем "${arrayName}" уже существует`);
                        }
                        variables[arrayName] = new Array(size).fill(0);
                    } else if (type === 'array-assign') {
                        const arrayName = inputs[0].value.trim();
                        const indexExpr = inputs[1].value.trim();
                        const valueExpr = inputs[2].value.trim();
                        if (!arrayName || !indexExpr || !valueExpr) {
                            throw new Error('Заполните все поля: имя массива, индекс и значение');
                        }
                        if (!(arrayName in variables)) {
                            throw new Error(`Массив "${arrayName}" не объявлен`);
                        }
                        const arr = variables[arrayName];
                        if (!Array.isArray(arr)) {
                            throw new Error(`"${arrayName}" не является массивом`);
                        }
                        const index = calculateExpression(indexExpr, variables);
                        if (!Number.isInteger(index) || index < 0 || index >= arr.length) {
                            throw new Error(`Индекс ${index} вне допустимого диапазона (0..${arr.length-1})`);
                        }
                        const value = calculateExpression(valueExpr, variables);
                        arr[index] = value;
                    } else if (type === 'while') {
                            const header = block.firstElementChild;
                            const inputs = header.querySelectorAll('input');
                            const operator = header.querySelector('select').value;
                            const nested = block.querySelector('.nested-blocks-container');

                            const checkCondition = () => {
                                const v1 = calculateExpression(inputs[0].value.trim(), variables);
                                const v2 = calculateExpression(inputs[1].value.trim(), variables);
                                if (operator === '>') return v1 > v2;
                                if (operator === '<') return v1 < v2;
                                if (operator === '==') return v1 === v2;
                                if (operator === '!=') return v1 !== v2;
                                if (operator === '>=') return v1 >= v2;
                                if (operator === '<=') return v1 <= v2;
                                return false;
                            };

                            let iterations = 0;
                            while (checkCondition()) {
                                if (!executeSequence(nested.children)) return false;
                                iterations++;
                                if (iterations > 1000) throw new Error("Похоже, цикл WHILE зациклился (больше 1000 итераций)!");
                            }
                        } else if (type === 'for') {
                            const initStmt = inputs[0].value.trim();
                            const conditionExpr = inputs[1].value.trim();
                            const updateStmt = inputs[2].value.trim();
                            const nested = block.querySelector('.nested-blocks-container');

                            if (initStmt) {
                                executeAssignmentStatement(initStmt, variables);
                            }

                            let iterations = 0;
                            while (true) {
                                if (iterations++ > 2000) throw new Error("Цикл FOR зациклился (больше 2000 итераций)!");

                                let conditionMet = true;
                                if (conditionExpr) {
                                    conditionMet = evaluateExpression(conditionExpr, variables);
                                    if (typeof conditionMet !== 'boolean') throw new Error('Условие FOR должно быть булевым.');
                                }
                                if (!conditionMet) break;

                                if (!executeSequence(nested.children)) return false;

                                if (updateStmt) {
                                    executeAssignmentStatement(updateStmt, variables);
                                }
                            }    
                        }
                    }
                }
                catch (e) {
                    block.classList.add('error');
                    output.style.color = 'red';
                    output.textContent = `Ошибка: ${e.message}`;
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
                    if (Array.isArray(variables[key])) {
                        resultString += `${key} = [${variables[key].join(', ')}]\n`;
                    } else {
                        resultString += `${key} = ${variables[key]}\n`;
                    }
                }
            }
            output.textContent = resultString;
        }
    }
});