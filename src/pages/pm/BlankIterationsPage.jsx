import React, { useLayoutEffect } from 'react';
/**
 * Target of Product Increments → "Open iterations": an intentionally blank
 * white page — no sidebar, header, tabs, iteration content, text, spinner or
 * placeholder. Mounted outside the AppShell layout route, so none of the app
 * chrome renders. The body's app background (#f8fafd, index.html) is switched
 * to white while this page is shown and restored when the user leaves.
 *
 * The regular Iterations page (`…/iterations`) is unchanged and still reachable
 * from every other entry point.
 */
export const BlankIterationsPage = () => {
    useLayoutEffect(() => {
        const previous = document.body.style.backgroundColor;
        document.body.style.backgroundColor = '#ffffff';
        return () => {
            document.body.style.backgroundColor = previous;
        };
    }, []);
    return <div className="min-h-screen bg-white" data-testid="blank-pi-iterations" aria-hidden="true"/>;
};
