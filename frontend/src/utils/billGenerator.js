import html2canvas from "html2canvas";

export const generateBillImage = async (element) => {
    if (!element) throw new Error("No element to capture");

    console.log("Starting Capture Direct...");

    try {
        // Capture the element directly. 
        // It must be visible in the DOM (but can be off-screen).
        const canvas = await html2canvas(element, {
            backgroundColor: "#111111", // Brand black
            scale: 2,                   // High resolution
            useCORS: true,
            allowTaint: false,          // KEEP FALSE to ensure toDataURL works!
            logging: true,
            windowWidth: 400,
            // We don't need onclone since we are not cloning
        });

        const image = canvas.toDataURL("image/png");
        console.log("Capture Success!");
        return image;

    } catch (err) {
        console.error("Capture Failed:", err);
        throw err;
    }
};
