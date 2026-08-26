export default function Modal({ titulo, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <div className="page-header">
          <h2 className="text-primary" style={{ margin: 0 }}>{titulo}</h2>
          <button className="btn btn-secondary" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
