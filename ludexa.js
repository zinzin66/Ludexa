// Ludexa Engine - Interface Controller
document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("toggle-sidebar");

    // Toggle Panneau Latéral Tactile
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("sidebar-closed");
        });
    }

    // Gestion de la sélection dans l'arborescence
    const objectItems = document.querySelectorAll(".object-item");
    objectItems.forEach(item => {
        item.addEventListener("click", () => {
            objectItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            
            // Mise à jour visuelle du nom dans l'inspecteur
            const objName = item.querySelector(".obj-name").textContent;
            const propNameInput = document.getElementById("prop-name");
            if (propNameInput) propNameInput.value = objName;
        });
    });
});
