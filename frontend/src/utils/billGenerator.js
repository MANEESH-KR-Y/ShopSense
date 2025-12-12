import html2canvas from "html2canvas";

export const generateBillImage = async (element) => {
    if (!element) throw new Error("No element to capture");

    console.log("Starting Capture...");

    // 1. Create a deep clone
    const clone = element.cloneNode(true);

    // 2. Reset styles to ensure clean capture
    Object.assign(clone.style, {
        position: "fixed",
        top: "-10000px",
        left: "-10000px",
        transform: "none", // Remove any scaling
        width: "800px",    // Standard bill width
        height: "auto",
        zIndex: "-1000",
        overflow: "visible",
        maxHeight: "none"
    });

    // 3. Append to body so it's rendered
    document.body.appendChild(clone);

    try {
        // 4. Capture
        const canvas = await html2canvas(clone, {
            backgroundColor: "#111111", // Brand black
            scale: 2,                   // High resolution
            useCORS: true,
            logging: true,
            windowWidth: 800,
            onclone: (clonedDoc) => {
                // Optional: Force specific styles in the cloned document if needed
            }
        });

        const image = canvas.toDataURL("image/png");
        console.log("Capture Success!");
        return image;

    } catch (err) {
        console.error("Capture Failed:", err);
        throw err;
    } finally {
        // 5. Cleanup
        if (document.body.contains(clone)) {
            document.body.removeChild(clone);
        }
    }
};
