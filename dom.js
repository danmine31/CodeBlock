export function initDragAndDrop(canvas, templates, createBlockElement, getDraggingElement, setDraggingElement) {

    templates.forEach(template => {
        template.addEventListener('dragstart', (e) => {
            setDraggingElement(template);
            template.classList.add('dragging');
        });
        template.addEventListener('dragend', () => {
            template.classList.remove('dragging');
            setDraggingElement(null);
        });
    });

    const existingBlocks = canvas.querySelectorAll('.block');
    existingBlocks.forEach(block => {

        block.removeEventListener('dragstart', block._dragStartHandler);
        block.removeEventListener('dragend', block._dragEndHandler);

        const dragStartHandler = (e) => {
            e.stopPropagation();
            setDraggingElement(block);
            block.classList.add('dragging');
        };
        const dragEndHandler = (e) => {
            e.stopPropagation();
            block.classList.remove('dragging');
            setDraggingElement(null);
        };

        block._dragStartHandler = dragStartHandler;
        block._dragEndHandler = dragEndHandler;

        block.addEventListener('dragstart', dragStartHandler);
        block.addEventListener('dragend', dragEndHandler);
    });

    canvas.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    canvas.addEventListener('drop', (event) => {
        event.preventDefault();
        const draggingElement = getDraggingElement();
        if (!draggingElement) return;

        const container = event.target.closest('.nested-blocks-container') || canvas;
        const dropTarget = getDropPosition(container, event.clientY);
        const isTemplate = draggingElement.classList.contains('block-template');
        const isBlockOnCanvas = draggingElement.classList.contains('block');

        if (isTemplate) {

            const blockType = draggingElement.dataset.blockType;
            const newBlock = createBlockElement(blockType);

            const dragStartHandler = (e) => {
                e.stopPropagation();
                setDraggingElement(newBlock);
                newBlock.classList.add('dragging');
            };
            const dragEndHandler = (e) => {
                e.stopPropagation();
                newBlock.classList.remove('dragging');
                setDraggingElement(null);
            };
            newBlock._dragStartHandler = dragStartHandler;
            newBlock._dragEndHandler = dragEndHandler;
            newBlock.addEventListener('dragstart', dragStartHandler);
            newBlock.addEventListener('dragend', dragEndHandler);

            if (dropTarget) {
                container.insertBefore(newBlock, dropTarget);
            } else {
                container.appendChild(newBlock);
            }
        } else if (isBlockOnCanvas) {

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
}

export function createBlockElement(type) {
    const block = document.createElement('div');
    block.classList.add('block');
    block.draggable = true;
    block.dataset.blockType = type;

    const deleteBtn = document.createElement('span');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.innerHTML = '&times;';
    deleteBtn.addEventListener('click', () => {
        block.remove();
    });

    if (type === 'declare') {

        block.appendChild(deleteBtn);
        const text = document.createElement('span');
        text.textContent = 'Объявить переменные: ';
        const input = document.createElement('input');
        input.placeholder = 'z, o, v';
        block.appendChild(text);
        block.appendChild(input);
    } 
    else if (type === 'assign') {
        block.appendChild(deleteBtn);
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
    } 
    else if (type === 'calculate') {
        block.appendChild(deleteBtn);
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
    } 
    else if (type === 'if') {
      
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
            } else {
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
    } 
    else if (type === 'array-assign') {
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
    } 
    else if (type === 'while' || type === 'for') {
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
        block.appendChild(headerDiv);
        block.appendChild(nestedContainer);
    }

    return block;
}