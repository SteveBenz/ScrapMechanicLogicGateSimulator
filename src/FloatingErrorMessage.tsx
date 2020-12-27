let timeout: NodeJS.Timeout | undefined;

export function show(message: string): void {
    const error = document.getElementById("error");
    if (error === null) {
        throw new Error("missing error element");
    }

    error.innerText = message;
    error.classList.remove('hide');
    error.classList.add('visible');

    if (timeout) {
        clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
        error.classList.remove('visible');
        error.classList.add('hide');
        timeout = undefined;
    }, 2000);
}