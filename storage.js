import { getBlockData } from './dom.js';

export function exportToJson(canvas) {
    const blocks = Array.from(canvas.children)
        .filter(child => child.classList.contains('block'))
        .map(block => getBlockData(block));

    const jsonString = JSON.stringify(blocks, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "CodeBlock_scheme.json";
    link.click();
    URL.revokeObjectURL(url);
}

export function importFromJson(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            callback(data);
        } catch (err) {
            alert("Ошибка при чтении файла: " + err.message);
        }
    };
    reader.readAsText(file);
}