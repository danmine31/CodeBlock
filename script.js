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
                    for (const name of varNames) {
                        const trimmedName = name.trim();
                        if (trimmedName) {
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
                    const value = parseInt(valueStr, 10);
                    if (isNaN(value)) {
                         throw new Error(`Значение "${valueStr}" не является числом.`);
                    }
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
                    const evaluateExpression = (expr, scope) => {
                        const varNames = Object.keys(scope);
                        const varValues = Object.values(scope);
                        try {
                            const func = new Function(...varNames, `return ${expr};`);
                            const result = func(...varValues);
                            if (typeof result !== 'number' || !isFinite(result)) {
                                throw new Error(`Результат выражения не является числом.`);
                            }
                            return result;
                        } catch (e) {
                            throw new Error(`Ошибка в выражении "${expr}": ${e.message}`);
                        }
                    };

                    const result = evaluateExpression(expression, variables);
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
            resultString += '(переменных нет)';
        } else {
            for (const key of variableKeys) {
                 resultString += `${key} = ${variables[key]}\n`;
            }
        }
        output.textContent = resultString;
    }
});
