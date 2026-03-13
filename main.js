
import { initDragAndDrop, createBlockElement } from './dom.js';
import { interpretCode } from './interpreter.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('.canvas');
    const templates = document.querySelectorAll('.block-template');
    const runButton = document.getElementById('run-button');
    const output = document.querySelector('.output');

    let draggingElement = null;
    const getDraggingElement = () => draggingElement;
    const setDraggingElement = (el) => { draggingElement = el; };

    initDragAndDrop(canvas, templates, createBlockElement, getDraggingElement, setDraggingElement);

    runButton.addEventListener('click', () => {
        interpretCode(canvas, output);
    });
});