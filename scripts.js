let originalImage;
let fileName;
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const fileInfo = document.getElementById('file-info');

window.onload = () => {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.style.borderColor = '#0056b3';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#007bff';
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropZone.style.borderColor = '#007bff';
        const files = event.dataTransfer.files;
        if (files.length) {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (event) => {
        if (event.target.files.length) {
            handleFile(event.target.files[0]);
        }
    });

    // 클립보드에서 이미지 붙여넣기 지원
    document.addEventListener('paste', (event) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                handleFile(file);
            }
        }
    });
};

const getParsedFilename = (fileName = "") => {
    return fileName.slice(0, fileName.lastIndexOf("."));
}

function handleFile(file) {
    fileName = getParsedFilename(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            imagePreview.src = event.target.result;
            imagePreview.style.display = 'block';
            fileInfo.textContent = `파일명: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`;
            enableDownloadButtons();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function enableDownloadButtons() {
    document.getElementById('download-main').disabled = false;
    document.getElementById('download-thumbnail').disabled = false;
    document.getElementById('download-compressed').disabled = false;
    document.getElementById('download-zip').disabled = false;

    document.getElementById('download-main').addEventListener('click', () => downloadResizedImage(800, '본문 사이즈'));
    document.getElementById('download-thumbnail').addEventListener('click', () => downloadResizedImage(636, '썸네일 사이즈'));
    document.getElementById('download-compressed').addEventListener('click', downloadCompressedImage);
    document.getElementById('download-zip').addEventListener('click', downloadSelectedVersionsAsZip);
}

function downloadResizedImage(width, label) {
    const { filename, dataURL } = getResizedImage(width, label);
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();
}

function downloadCompressedImage() {
    var { filename, imageData } = getCompressedImage();

    const link = document.createElement('a');
    link.download = filename;
    link.href = imageData;
    link.click();
}

function downloadSelectedVersionsAsZip() {
    const zip = new JSZip();
    const checkMain = document.getElementById('check-main').checked;
    const checkThumbnail = document.getElementById('check-thumbnail').checked;
    const checkCompressed = document.getElementById('check-compressed').checked;

    if (checkMain) {
        addResizedImageToZip(zip, 800, '본문 사이즈');
    }
    if (checkThumbnail) {
        addResizedImageToZip(zip, 636, '썸네일 사이즈');
    }
    if (checkCompressed) {
        addCompressedImageToZip(zip);
    }

    zip.generateAsync({ type: 'blob' }).then((content) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${fileName}.zip`;
        link.click();
    });
}

function addResizedImageToZip(zip, width, label) {
    const { filename, dataURL } = getResizedImage(width, label);
    zip.file(filename, dataURL.split(',')[1], { base64: true });
}


function getCompressedImage() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    let quality = 1.0;
    let imageData = canvas.toDataURL('image/jpeg', quality);

    while (imageData.length > 1024 * 1024 && quality > 0.1) {
        quality -= 0.1;
        imageData = canvas.toDataURL('image/jpeg', quality);
    }

    const filename = `${fileName}-저용량.jpg`;
    return { filename, imageData };
}


function getCompressedImage(width, label) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    let quality = 1.0;
    let imageData = canvas.toDataURL('image/jpeg', quality);

    while (imageData.length > 1024 * 1024 && quality > 0.1) {
        quality -= 0.1;
        imageData = canvas.toDataURL('image/jpeg', quality);
    }

    const filename = `${fileName}-저용량.jpg`;

    return { filename, imageData };
}

function getResizedImage(width, label) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = width / originalImage.width;
    canvas.width = width;
    canvas.height = originalImage.height * scale;
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL('image/jpeg');
    const filename = `${fileName}-${label}.jpg`;
    return { filename, dataURL };
}

function addCompressedImageToZip(zip) {
    const { filename, imageData } = getCompressedImage();
    zip.file(filename, imageData.split(',')[1], { base64: true });
}