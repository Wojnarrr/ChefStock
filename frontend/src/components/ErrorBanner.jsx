function ErrorBanner({ message, onDismiss }) {
    if (!message) return null;

    return (
        <div className="alert" role="alert">
            <span>{message}</span>
            <button type="button" className="link-button" onClick={onDismiss}>
                Dismiss
            </button>
        </div>
    );
}

export default ErrorBanner;