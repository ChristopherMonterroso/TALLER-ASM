/**
 * Componente de paginación reutilizable.
 * Props: { page, totalPages, onNext, onPrev, onGoTo, total, pageSize }
 */
const Pagination = ({ page, totalPages, onNext, onPrev, onGoTo, total, pageSize }) => {
  if (!total || total <= 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Calcular rango de botones de página a mostrar (máx 5)
  const delta = 2;
  let start = Math.max(1, page - delta);
  let end = Math.min(totalPages, page + delta);
  if (end - start < 4) {
    if (start === 1) end = Math.min(totalPages, start + 4);
    else start = Math.max(1, end - 4);
  }
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12, padding: '14px 0 4px',
      borderTop: '1px solid var(--color-border)',
    }}>
      {/* Info */}
      <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
        Mostrando <strong style={{ color: 'var(--color-text)' }}>{from}–{to}</strong> de <strong style={{ color: 'var(--color-text)' }}>{total}</strong>
      </span>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onPrev}
          disabled={page === 1}
          style={{ padding: '4px 10px', minWidth: 34 }}
        >
          ‹
        </button>

        {start > 1 && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => onGoTo(1)} style={{ padding: '4px 10px', minWidth: 34 }}>1</button>
            {start > 2 && <span style={{ color: 'var(--color-text-muted)', padding: '0 2px' }}>…</span>}
          </>
        )}

        {pages.map(p => (
          <button
            key={p}
            className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => onGoTo(p)}
            style={{ padding: '4px 10px', minWidth: 34 }}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span style={{ color: 'var(--color-text-muted)', padding: '0 2px' }}>…</span>}
            <button className="btn btn-ghost btn-sm" onClick={() => onGoTo(totalPages)} style={{ padding: '4px 10px', minWidth: 34 }}>{totalPages}</button>
          </>
        )}

        <button
          className="btn btn-ghost btn-sm"
          onClick={onNext}
          disabled={page === totalPages}
          style={{ padding: '4px 10px', minWidth: 34 }}
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default Pagination;
