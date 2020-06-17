document.body.addEventListener("focus", event => {
    const target = event.target;
    switch (target.tagName) {
        case "INPUT":
        case "TEXTAREA":
        case "SELECT":
            document.body.classList.add("keyboard");
    }
}, true); 
document.body.addEventListener("blur", () => {
    document.body.classList.remove("keyboard");
}, true); 