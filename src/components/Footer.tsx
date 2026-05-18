export default function Footer() {
  return (
    <footer className="bg-deloitte-charcoal border-t border-deloitte-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-deloitte-green rounded-sm" />
            <span className="text-white text-sm font-medium">CrossCheck</span>
          </div>
          <p className="text-deloitte-gray-400 text-xs text-center">
            &copy; {new Date().getFullYear()} CrossCheck Audit Tool. 仅供专业审计参考，不构成任何投资建议。
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-deloitte-gray-400 text-xs hover:text-white transition-colors">隐私政策</a>
            <a href="#" className="text-deloitte-gray-400 text-xs hover:text-white transition-colors">使用条款</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
