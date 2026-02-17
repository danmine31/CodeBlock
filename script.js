const canvas = document.querySelector('.canvas');
const blocks = document.querySelectorAll('.block-template');

blocks.forEach( draggable => {
    draggable.addEventListener("dragstart",()=>{
        draggable.classList.add('dragging');
    });
    draggable.addEventListener("dragend",()=>{
        draggable.classList.remove('dragging');
    });
});

canvas.addEventListener("dragover",(event)=>{
    event.preventDefault();

    const dragging = document.querySelector('.dragging');
    const dropTarget = getDropPosition(canvas, event.clientY);

    if (dropTarget){
        canvas.insertBefore(dragging, dropTarget);
    } else {
        canvas.appendChild(dragging);
    }

    if (!dragging.classList.contains('variable-created')){
        dragging.classList.add('variable-created');
        dragging.innerHTML = `newVar:<input type="text" placeholder="имя переменной"/>`;
    }
});

function getDropPosition(canvas, y){
    const draggableElements = [...canvas.querySelectorAll('.block-template:not(.dragging)')];
    for (const draggable of draggableElements){
        const pos = draggable.getBoundingClientRect();
        if (y < pos.bottom){
            return draggable;
        }
    }
    return null;
}