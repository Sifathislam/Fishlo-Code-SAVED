function showImageModal(imageUrl) {
    let modal = document.getElementById("imagePreviewModal");

    if (!modal) {
        modal = document.createElement("div");
        modal.id = "imagePreviewModal";
        modal.style.position = "fixed";
        modal.style.top = 0;
        modal.style.left = 0;
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.background = "rgba(0,0,0,0.8)";
        modal.style.display = "flex";
        modal.style.alignItems = "center";
        modal.style.justifyContent = "center";
        modal.style.zIndex = "9999";

        modal.innerHTML = `
            <div style="position:relative;">
                <img id="modalImage" src="" style="max-width:90vw; max-height:90vh; border-radius:10px;" />
                <span onclick="closeImageModal()" 
                      style="position:absolute; top:-10px; right:-10px; background:white; padding:5px 10px; cursor:pointer; border-radius:50%;">
                      ✕
                </span>
            </div>
        `;

        document.body.appendChild(modal);
    }

    document.getElementById("modalImage").src = imageUrl;
    modal.style.display = "flex";
}

function closeImageModal() {
    document.getElementById("imagePreviewModal").style.display = "none";
}