import { initDragAndDrop, createBlockElement } from './dom.js';
import { interpretCode } from './interpreter.js';
import { exportToJson, importFromJson } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('.canvas');
    const templates = document.querySelectorAll('.block-template');
    const runButton = document.getElementById('run-button');
    const clearButton = document.getElementById('clear-btn');
    const output = document.querySelector('.output');

    let draggingElement = null;
    const getDraggingElement = () => draggingElement;
    const setDraggingElement = (el) => { draggingElement = el; };

    initDragAndDrop(canvas, templates, createBlockElement, getDraggingElement, setDraggingElement);

    runButton.addEventListener('click', () => {
        interpretCode(canvas, output);
    });

    clearButton.addEventListener('click', () => {
        canvas.innerHTML = '';
        output.textContent = '';
    });

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            console.log("Экспорт запущен...");
            exportToJson(canvas);
        });
    }

    const importInput = document.getElementById('import-input');
    if (importInput) {
        importInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                importFromJson(e.target.files[0], (data) => {
                    canvas.innerHTML = ''; 
                    renderBlocks(data, canvas);
                });
            }
        });
    }

    function renderBlocks(data, container) {
        data.forEach(blockData => {
            const newBlock = createBlockElement(blockData.type, getDraggingElement, setDraggingElement);
            const header = newBlock.querySelector('.block-header') || newBlock;
            const controls = header.querySelectorAll('input, select');
            
            blockData.values.forEach((val, index) => {
                if (controls[index]) controls[index].value = val;
            });

            if (blockData.children && blockData.children.length > 0) {
                const nestedContainer = newBlock.querySelector('.nested-blocks-container');
                if (nestedContainer) {
                    renderBlocks(blockData.children, nestedContainer);
                }
            }
            container.appendChild(newBlock);
        });
    }
});