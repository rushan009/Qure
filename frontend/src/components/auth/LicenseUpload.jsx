export const LicenseUpload = () => (
  <div className="flex flex-col gap-1.5 animate-fadeIn">
    <label className="text-sm font-medium text-gray-700">
      Doctor License <span className="text-gray-400 font-normal">(Image)</span>
    </label>
    <div className="relative border-2 border-dashed border-teal-300 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-teal-50/50 hover:bg-teal-50 transition-colors duration-150 group">
      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
        <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-sm text-gray-500">
        <span className="text-teal-600 font-medium">Upload license</span> or drag & drop
      </p>
      <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 10MB</p>
    </div>
  </div>
);