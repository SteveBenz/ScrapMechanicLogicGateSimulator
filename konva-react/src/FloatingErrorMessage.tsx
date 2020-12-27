let timeout: NodeJS.Timeout | undefined;

export function show(message: string): void {
    const error = document.getElementById("error");
    if (error === null) {
        throw new Error("missing error element");
    }

    error.innerText = message;
    error.classList.add('visible');

    if (timeout) {
        clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
        error.classList.remove('visible');
        timeout = undefined;
    }, 4000);
}