import { forwardRef, useId } from 'react';
import { MdDriveFolderUpload } from 'react-icons/md';

const IconUploadButton = forwardRef(function IconUploadButton(
  { label, className = '', id, multiple = false, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="relative inline-flex items-center">
      <input
        id={inputId}
        ref={ref}
        type="file"
        className="sr-only"
        multiple={multiple}
        {...props}
      />
      <label
        htmlFor={inputId}
        className={`inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-200 hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${className}`}
      >
        <MdDriveFolderUpload className="text-lg" aria-hidden="true" />
        <span>{label}</span>
      </label>
    </div>
  );
});

export default IconUploadButton;
