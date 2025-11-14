import PropTypes from 'prop-types';

function ImageLightbox({ image, onClose }) {
  if (!image?.url) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt || 'Vergrößerte Bildansicht'}
      onClick={onClose}
    >
      <div className="relative w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-brand-700 shadow transition hover:bg-white"
        >
          Schließen
        </button>
        <img src={image.url} alt={image.alt || 'Vergrößerte Bildansicht'} className="max-h-[80vh] w-full rounded-3xl object-contain" />
      </div>
    </div>
  );
}

ImageLightbox.propTypes = {
  image: PropTypes.shape({
    url: PropTypes.string,
    alt: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

ImageLightbox.defaultProps = {
  image: null,
};

export default ImageLightbox;
