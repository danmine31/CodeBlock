import { calculateExpression } from './calculator.js';

export function interpretCode(canvas, outputElement) {
    const variables = {};
    const allBlocks = canvas.querySelectorAll('.block');
    outputElement.textContent = '';
    outputElement.style.color = 'white';
    allBlocks.forEach(b => b.classList.remove('error'));
    
    function executeAssignmentStatement(stmt, vars) {
        const parts = stmt.split('=');
        if (parts.length !== 2) throw new Error(`Некорректное выражение: ${stmt}`);
        const varName = parts[0].trim();
        const expr = parts[1].trim();
        if (!(varName in vars)) throw new Error(`Переменная "${varName}" не объявлена`);
        vars[varName] = calculateExpression(expr, vars);
    }

    function executeSequence(blocks) {
        for (const block of blocks) {
            if (!block.classList.contains('block')) continue;

            try {
                const type = block.dataset.blockType;

                if (type === 'if') {
                    const headerDiv = block.firstElementChild;
                    const conditionStr = headerDiv.querySelector('input').value.trim();
                    if (!conditionStr) throw new Error('Пустое условие в IF');

                    const conditionMet = calculateExpression(conditionStr, variables);
    
                    if (conditionMet) {
                        const thenContainer = block.querySelector('[data-container-type="then"]');
                        if (thenContainer && !executeSequence(thenContainer.children)) return false;
                    } else {
                        const elseContainer = block.querySelector('[data-container-type="else"]');
                        if (elseContainer && elseContainer.children.length > 0) {
                            if (!executeSequence(elseContainer.children)) return false;
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

                        if (valueStr in variables) {
                            variables[varName] = variables[valueStr];
                        } else if (/^-?\d+$/.test(valueStr)) {
                            variables[varName] = parseInt(valueStr, 10);
                        } else {
                            throw new Error(`Не могу присвоить "${valueStr}!!!". Такой переменной не существует, и это не число`);
                        }
                    } else if (type === 'calculate') {
                        const inputs = block.querySelectorAll('input');
                        const targetExpr = inputs[0].value.trim();
                        const valueExpr = inputs[1].value.trim();

                        if (!targetExpr || !valueExpr) {
                            throw new Error('Надо указа-ть, чему и какое значение присвоить');
                        }
                        const result = calculateExpression(valueExpr, variables);
                        const arrayAccessMatch = targetExpr.match(/^([a-zA-Z_]\w*)\[(.+)\]$/);

                        if (arrayAccessMatch) {
                            const arrayName = arrayAccessMatch[1];
                            const indexExpr = arrayAccessMatch[2];

                            if (!(arrayName in variables)) {
                                throw new Error(`Массив "${arrayName}" не объявлен`);
                            }
                            const arr = variables[arrayName];
                            if (!Array.isArray(arr)) {
                                throw new Error(`"${arrayName}" - это не массив`);
                            }

                            const index = calculateExpression(indexExpr, variables);
                            if (!Number.isInteger(index) || index < 0 || index >= arr.length) {
                                throw new Error(`Индекс ${index} вне допустимого диапазона для массива "${arrayName}"`);
                            }

                            arr[index] = result;
                        } else {
                            if (!(targetExpr in variables)) {
                                throw new Error(`Кажется, вы забыли объявить переменную "${targetExpr}"`);
                            }
                            if (Array.isArray(variables[targetExpr])) {
                                throw new Error(`Нельзя присвоить значение целому массиву "${targetExpr}". Укажите индекс.`);
                            }

                            variables[targetExpr] = result;
                        }
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
                            throw new Error(`Индекс ${index} вне допустимого диапазона (0..${arr.length - 1})`);
                        }
                        const value = calculateExpression(valueExpr, variables);
                        arr[index] = value;
                    } else if (type === 'while') {
                        const header = block.firstElementChild;
                        const conditionStr = header.querySelector('input').value.trim();
                        const checkCondition = () => calculateExpression(conditionStr, variables);

                        const nested = block.querySelector('.nested-blocks-container');

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
                                conditionMet = calculateExpression(conditionExpr, variables);
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
            } catch (e) {
                block.classList.add('error');
                outputElement.style.color = 'red';
                outputElement.textContent = `Ошибка: ${e.message}`;
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
        outputElement.textContent = resultString;
    }
}