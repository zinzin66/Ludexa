document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("toggle-sidebar");

    // Action du bouton d'ouverture / fermeture
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("closed");
        });
    }

    // Interaction : Sélection dans la liste
    const objectItems = document.querySelectorAll(".object-item");
    objectItems.forEach(item => {
        item.addEventListener("click", () => {
            objectItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            
            const objName = item.querySelector(".obj-name").textContent;
            const propNameInput = document.getElementById("prop-name");
            if (propNameInput) propNameInput.value = objName;
        });
    });
});

