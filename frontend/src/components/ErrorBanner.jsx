function ErrorBanner({ message, onDismiss, tone = "error" }) {
    if (!message) return null;

    return (
        <div className={`alert ${tone === "warning" ? "alert-warning" : ""}`} role="alert">
            <span>{message}</span>
            <button type="button" className="link-button" onClick={onDismiss}>
                Dismiss
            </button>
        </div>
    );
}

export default ErrorBanner;